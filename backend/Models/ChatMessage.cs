using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.CSharp.Models;

/// <summary>
/// Representa uma mensagem do chat entre usuário e IA
/// </summary>
public class ChatMessage
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [MaxLength(5000)]
    public string Message { get; set; } = string.Empty;

    [Required]
    public bool IsUser { get; set; }

    // ID de quem enviou a mensagem (usuário ou técnico)
    [MaxLength(450)]
    [Column("AutorId")]
    public string? SenderId { get; set; }

    // Tipo do autor (para exibição: "user" ou "tecnico")
    [MaxLength(20)]
    [Column("TipoAutor")]
    public string? SenderType { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Relacionamento com Chamado
    public int? ChamadoId { get; set; }
    
    [ForeignKey("ChamadoId")]
    public virtual Chamado? Chamado { get; set; }
}
