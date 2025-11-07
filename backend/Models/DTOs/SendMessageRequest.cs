using System.ComponentModel.DataAnnotations;

namespace Backend.CSharp.Models.DTOs;

public class SendMessageRequest
{
    [Required(ErrorMessage = "Mensagem não pode estar vazia")]
    [MinLength(1)]
    public string Message { get; set; } = string.Empty;
}
