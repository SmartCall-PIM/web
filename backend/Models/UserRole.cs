namespace Backend.CSharp.Models;

public enum UserRole
{
    Usuario = 0,
    Tecnico = 1,
    Administrador = 2
}

public static class UserRoleExtensions
{
    public static string ToFriendlyString(this UserRole role)
    {
        return role switch
        {
            UserRole.Usuario => "Usuário",
            UserRole.Tecnico => "Técnico",
            UserRole.Administrador => "Administrador",
            _ => "Usuário"
        };
    }

    public static UserRole FromString(string roleString)
    {
        return roleString?.ToLower() switch
        {
            "técnico" or "tecnico" => UserRole.Tecnico,
            "administrador" or "admin" => UserRole.Administrador,
            _ => UserRole.Usuario
        };
    }
}
