using Microsoft.AspNetCore.Identity;

namespace Backend.CSharp.Models;

public class ApplicationUser : IdentityUser
{
    public string? FullName { get; set; }
    public int Role { get; set; } = 0; // 0 = Usuário, 1 = Técnico, 2 = Administrador
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }
    public DateTime? LastActivityAt { get; set; } // Atualizado por heartbeat para saber quem está realmente online
}
