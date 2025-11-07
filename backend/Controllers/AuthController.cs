using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Backend.CSharp.Models;
using Backend.CSharp.Models.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

namespace Backend.CSharp.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IConfiguration _configuration;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IConfiguration configuration)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _configuration = configuration;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new AuthResponse
            {
                Success = false,
                Message = "Dados inválidos",
                Errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList()
            });
        }

        var existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser != null)
        {
            return BadRequest(new AuthResponse
            {
                Success = false,
                Message = "Email já cadastrado",
                Errors = new List<string> { "Este email já está em uso" }
            });
        }

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            FullName = request.FullName,
            CreatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, request.Password);

        if (!result.Succeeded)
        {
            return BadRequest(new AuthResponse
            {
                Success = false,
                Message = "Erro ao criar usuário",
                Errors = result.Errors.Select(e => e.Description).ToList()
            });
        }

        var token = GenerateJwtToken(user);
        var expiresAt = DateTime.UtcNow.AddHours(24);

        return Ok(new AuthResponse
        {
            Success = true,
            Token = token,
            ExpiresAt = expiresAt,
            User = new UserInfo
            {
                Id = user.Id,
                Email = user.Email!,
                FullName = user.FullName,
                CreatedAt = user.CreatedAt,
                Role = ((UserRole)user.Role).ToFriendlyString()
            },
            Message = "Usuário registrado com sucesso"
        });
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new AuthResponse
            {
                Success = false,
                Message = "Dados inválidos",
                Errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList()
            });
        }

        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null)
        {
            return Unauthorized(new AuthResponse
            {
                Success = false,
                Message = "Credenciais inválidas",
                Errors = new List<string> { "Email ou senha incorretos" }
            });
        }

        var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, false);
        if (!result.Succeeded)
        {
            return Unauthorized(new AuthResponse
            {
                Success = false,
                Message = "Credenciais inválidas",
                Errors = new List<string> { "Email ou senha incorretos" }
            });
        }

        // Atualiza último login e atividade
        user.LastLoginAt = DateTime.UtcNow;
        user.LastActivityAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        var token = GenerateJwtToken(user);
        var expiresAt = DateTime.UtcNow.AddHours(24);

        return Ok(new AuthResponse
        {
            Success = true,
            Token = token,
            ExpiresAt = expiresAt,
            User = new UserInfo
            {
                Id = user.Id,
                Email = user.Email!,
                FullName = user.FullName,
                CreatedAt = user.CreatedAt,
                Role = ((UserRole)user.Role).ToFriendlyString()
            },
            Message = "Login realizado com sucesso"
        });
    }

    [Authorize]
    [HttpGet("profile")]
    public async Task<ActionResult<UserInfo>> GetProfile()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { message = "Usuário não autenticado" });
        }

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return NotFound(new { message = "Usuário não encontrado" });
        }

        return Ok(new UserInfo
        {
            Id = user.Id,
            Email = user.Email!,
            FullName = user.FullName,
            CreatedAt = user.CreatedAt
        });
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<ActionResult> Logout()
    {
        await _signInManager.SignOutAsync();
        return Ok(new { message = "Logout realizado com sucesso" });
    }

    private string GenerateJwtToken(ApplicationUser user)
    {
        var jwtKey = _configuration["Jwt:Key"] ?? "your-super-secret-key-change-this-in-production-minimum-32-characters";
        var jwtIssuer = _configuration["Jwt:Issuer"] ?? "SmartCallAPI";
        var jwtAudience = _configuration["Jwt:Audience"] ?? "SmartCallClient";

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim(JwtRegisteredClaimNames.Email, user.Email!),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Name, user.FullName ?? user.Email!),
            new Claim(ClaimTypes.Role, ((UserRole)user.Role).ToFriendlyString())
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: jwtIssuer,
            audience: jwtAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(24),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserInfoResponse>> GetCurrentUser()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return NotFound(new { message = "Usuário não encontrado" });
        }

        return Ok(new UserInfoResponse
        {
            Id = user.Id,
            UserName = user.UserName!,
            Email = user.Email!,
            FullName = user.FullName ?? user.Email!,
            Role = ((UserRole)user.Role).ToFriendlyString()
        });
    }

    [HttpPost("refresh-token")]
    [Authorize]
    public async Task<ActionResult<AuthResponse>> RefreshToken()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return Unauthorized(new AuthResponse
            {
                Success = false,
                Message = "Usuário não encontrado"
            });
        }

        // Gera um novo token com as informações atualizadas (incluindo Role)
        var token = GenerateJwtToken(user);
        var expiresAt = DateTime.UtcNow.AddHours(24);

        return Ok(new AuthResponse
        {
            Success = true,
            Token = token,
            ExpiresAt = expiresAt,
            User = new UserInfo
            {
                Id = user.Id,
                Email = user.Email!,
                FullName = user.FullName,
                CreatedAt = user.CreatedAt,
                Role = ((UserRole)user.Role).ToFriendlyString()
            },
            Message = "Token renovado com sucesso"
        });
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<ActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return NotFound(new { message = "Usuário não encontrado" });
        }

        var result = await _userManager.ChangePasswordAsync(user, request.SenhaAtual, request.NovaSenha);
        if (!result.Succeeded)
        {
            return BadRequest(new 
            { 
                message = "Erro ao alterar senha. Verifique se a senha atual está correta.",
                errors = result.Errors.Select(e => e.Description).ToList()
            });
        }

        return Ok(new { message = "Senha alterada com sucesso" });
    }

    [HttpPut("update-profile")]
    [Authorize]
    public async Task<ActionResult<UserInfoResponse>> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return NotFound(new { message = "Usuário não encontrado" });
        }

        // Verifica se o email já está em uso
        if (user.Email != request.Email)
        {
            var existingUser = await _userManager.FindByEmailAsync(request.Email);
            if (existingUser != null && existingUser.Id != userId)
            {
                return BadRequest(new { message = "Este email já está em uso" });
            }

            user.Email = request.Email;
            user.UserName = request.Email;
        }

        user.FullName = request.FullName;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            return BadRequest(new 
            { 
                message = "Erro ao atualizar perfil",
                errors = result.Errors.Select(e => e.Description).ToList()
            });
        }

        return Ok(new UserInfoResponse
        {
            Id = user.Id,
            UserName = user.UserName!,
            Email = user.Email!,
            FullName = user.FullName ?? user.Email!,
            Role = ((UserRole)user.Role).ToFriendlyString()
        });
    }

    /// <summary>
    /// Endpoint de heartbeat para manter o status online do usuário
    /// </summary>
    [Authorize]
    [HttpPost("heartbeat")]
    public async Task<ActionResult> Heartbeat()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return NotFound();
        }

        user.LastActivityAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        return Ok(new { lastActivity = user.LastActivityAt });
    }
}
