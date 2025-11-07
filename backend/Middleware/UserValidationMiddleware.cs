using Backend.CSharp.Models;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;

namespace Backend.CSharp.Middleware;

public class UserValidationMiddleware
{
    private readonly RequestDelegate _next;

    public UserValidationMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, UserManager<ApplicationUser> userManager)
    {
        // Verifica se o usuário está autenticado
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
            
            if (!string.IsNullOrEmpty(userId))
            {
                // Verifica se o usuário ainda existe no banco de dados
                var user = await userManager.FindByIdAsync(userId);
                
                if (user == null)
                {
                    // Usuário foi deletado, retorna 401 Unauthorized
                    context.Response.StatusCode = 401;
                    context.Response.ContentType = "application/json";
                    await context.Response.WriteAsJsonAsync(new 
                    { 
                        message = "Usuário não encontrado. Faça login novamente.",
                        requiresLogin = true 
                    });
                    return;
                }
            }
        }

        await _next(context);
    }
}

// Extension method para facilitar o uso no Program.cs
public static class UserValidationMiddlewareExtensions
{
    public static IApplicationBuilder UseUserValidation(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<UserValidationMiddleware>();
    }
}
