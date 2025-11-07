using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.CSharp.Models;

/// <summary>
/// Representa um chamado/ticket de suporte
/// </summary>
public class Chamado
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    // ID do usuário autenticado (obrigatório via JWT)
    [Required]
    [MaxLength(450)] // Tamanho padrão do UserId do Identity
    public string? UserId { get; set; }

    // ID do técnico atribuído (quando escalado)
    [MaxLength(450)]
    public string? TecnicoId { get; set; }

    // Indica se o chamado já foi atribuído a um técnico (para evitar reatribuições)
    public bool AtribuidoATecnico { get; set; } = false;

    // Nome extraído do token JWT
    [MaxLength(100)]
    public string? NomeUsuario { get; set; }

    // Email extraído do token JWT
    [MaxLength(200)]
    public string? Email { get; set; }

    [MaxLength(200)]
    public string Titulo { get; set; } = "Novo Chamado";

    [MaxLength(50)]
    public string Status { get; set; } = "Em Andamento"; // Em Andamento ou Resolvido

    [MaxLength(50)]
    public string? Categoria { get; set; }

    [MaxLength(20)]
    public string? Prioridade { get; set; }

    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

    public DateTime? AtualizadoEm { get; set; }

    // Relacionamento com mensagens
    public virtual ICollection<ChatMessage> Mensagens { get; set; } = new List<ChatMessage>();
}
