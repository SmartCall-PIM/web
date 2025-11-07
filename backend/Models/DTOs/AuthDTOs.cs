using System.ComponentModel.DataAnnotations;

namespace Backend.CSharp.Models.DTOs;

public class RegisterRequest
{
    [Required(ErrorMessage = "O email é obrigatório")]
    [EmailAddress(ErrorMessage = "Email inválido")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "A senha é obrigatória")]
    [MinLength(6, ErrorMessage = "A senha deve ter no mínimo 6 caracteres")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "A confirmação de senha é obrigatória")]
    [Compare("Password", ErrorMessage = "As senhas não coincidem")]
    public string ConfirmPassword { get; set; } = string.Empty;

    public string? FullName { get; set; }
}

public class LoginRequest
{
    [Required(ErrorMessage = "O email é obrigatório")]
    [EmailAddress(ErrorMessage = "Email inválido")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "A senha é obrigatória")]
    public string Password { get; set; } = string.Empty;
}

public class AuthResponse
{
    public bool Success { get; set; }
    public string? Token { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public UserInfo? User { get; set; }
    public string? Message { get; set; }
    public List<string>? Errors { get; set; }
}

public class UserInfo
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public DateTime CreatedAt { get; set; }
    public string Role { get; set; } = string.Empty;
}

public class RefreshTokenRequest
{
    [Required]
    public string Token { get; set; } = string.Empty;
    
    [Required]
    public string RefreshToken { get; set; } = string.Empty;
}

public class ChangePasswordRequest
{
    [Required(ErrorMessage = "A senha atual é obrigatória")]
    public string SenhaAtual { get; set; } = string.Empty;

    [Required(ErrorMessage = "A nova senha é obrigatória")]
    [MinLength(6, ErrorMessage = "A nova senha deve ter no mínimo 6 caracteres")]
    public string NovaSenha { get; set; } = string.Empty;
}

public class UserInfoResponse
{
    public string Id { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}

public class UpdateProfileRequest
{
    [Required(ErrorMessage = "O nome completo é obrigatório")]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "O email é obrigatório")]
    [EmailAddress(ErrorMessage = "Email inválido")]
    public string Email { get; set; } = string.Empty;
}

public class UserListResponse
{
    public string Id { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class UpdateUserRequest
{
    [Required(ErrorMessage = "O email é obrigatório")]
    [EmailAddress(ErrorMessage = "Email inválido")]
    public string Email { get; set; } = string.Empty;

    public string? Role { get; set; }
}
