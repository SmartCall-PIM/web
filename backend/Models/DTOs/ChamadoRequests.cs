using System.ComponentModel.DataAnnotations;

namespace Backend.CSharp.Models.DTOs;

/// <summary>
/// Request simplificado - apenas a descrição do problema é necessária
/// Os dados do usuário (nome, email, userId) são extraídos do token JWT
/// </summary>
public class CriarChamadoRequest
{
    [Required(ErrorMessage = "Descrição do chamado é obrigatória")]
    [MinLength(10, ErrorMessage = "Descrição deve ter no mínimo 10 caracteres")]
    [MaxLength(1000, ErrorMessage = "Descrição deve ter no máximo 1000 caracteres")]
    public string MensagemInicial { get; set; } = string.Empty;
}

public class ChamadoResponse
{
    public int Id { get; set; }
    public string NomeUsuario { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Categoria { get; set; }
    public string? Prioridade { get; set; }
    public DateTime CriadoEm { get; set; }
    public DateTime? AtualizadoEm { get; set; }
    public int TotalMensagens { get; set; }
    public string? UltimaMensagem { get; set; }
    public bool AtribuidoATecnico { get; set; }
}

public class ChamadoDetalhadoResponse : ChamadoResponse
{
    public List<ChatMessageResponse> Mensagens { get; set; } = new();
}
