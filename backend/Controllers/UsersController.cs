using Backend.CSharp.Models;
using Backend.CSharp.Models.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Backend.CSharp.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Administrador")]
public class UsersController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogger<UsersController> _logger;

    public UsersController(
        UserManager<ApplicationUser> userManager,
        ILogger<UsersController> logger)
    {
        _userManager = userManager;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<List<UserListResponse>>> GetAllUsers()
    {
        try
        {
            var users = await _userManager.Users
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync();

            var userResponses = users.Select(u => new UserListResponse
            {
                Id = u.Id,
                FullName = u.FullName ?? u.Email!,
                Email = u.Email!,
                Role = ((UserRole)u.Role).ToFriendlyString(),
                CreatedAt = u.CreatedAt
            }).ToList();

            return Ok(userResponses);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao listar usuários");
            return StatusCode(500, new { message = "Erro ao listar usuários" });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> UpdateUser(string id, [FromBody] UpdateUserRequest request)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
            {
                return NotFound(new { message = "Usuário não encontrado" });
            }

            // Verifica se o email já está em uso por outro usuário
            if (user.Email != request.Email)
            {
                var existingUser = await _userManager.FindByEmailAsync(request.Email);
                if (existingUser != null && existingUser.Id != id)
                {
                    return BadRequest(new { message = "Este email já está em uso" });
                }

                user.Email = request.Email;
                user.UserName = request.Email;
            }

            // Verifica se o role foi alterado
            bool roleChanged = false;
            if (!string.IsNullOrEmpty(request.Role))
            {
                var newRole = (int)UserRoleExtensions.FromString(request.Role);
                if (user.Role != newRole)
                {
                    roleChanged = true;
                    user.Role = newRole;
                }
            }

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                return BadRequest(new 
                { 
                    message = "Erro ao atualizar usuário",
                    errors = result.Errors.Select(e => e.Description).ToList()
                });
            }

            // Se o role foi alterado, indica que o usuário precisa fazer login novamente
            return Ok(new 
            { 
                message = "Usuário atualizado com sucesso",
                requiresRelogin = roleChanged,
                updatedUserId = id
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao atualizar usuário {UserId}", id);
            return StatusCode(500, new { message = "Erro ao atualizar usuário" });
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteUser(string id)
    {
        try
        {
            // Verifica se não está tentando deletar a si mesmo
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (currentUserId == id)
            {
                return BadRequest(new { message = "Você não pode deletar sua própria conta" });
            }

            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
            {
                return NotFound(new { message = "Usuário não encontrado" });
            }

            var result = await _userManager.DeleteAsync(user);
            if (!result.Succeeded)
            {
                return BadRequest(new 
                { 
                    message = "Erro ao deletar usuário",
                    errors = result.Errors.Select(e => e.Description).ToList()
                });
            }

            return Ok(new { message = "Usuário deletado com sucesso" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao deletar usuário {UserId}", id);
            return StatusCode(500, new { message = "Erro ao deletar usuário" });
        }
    }
}
