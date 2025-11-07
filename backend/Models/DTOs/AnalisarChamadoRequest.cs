using System.ComponentModel.DataAnnotations;

namespace Backend.CSharp.Models.DTOs;

public class AnalisarChamadoRequest
{
    [Required(ErrorMessage = "Descrição não pode estar vazia")]
    [MinLength(10, ErrorMessage = "Descrição deve ter no mínimo 10 caracteres")]
    public string Descricao { get; set; } = string.Empty;
}
