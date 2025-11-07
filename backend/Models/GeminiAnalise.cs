using System.Text.Json.Serialization;

namespace Backend.CSharp.Models;

/// <summary>
/// Resposta da análise do Gemini
/// </summary>
public class GeminiAnalise
{
    [JsonPropertyName("titulo")]
    public string Titulo { get; set; } = string.Empty;

    [JsonPropertyName("categoria")]
    public string Categoria { get; set; } = string.Empty;

    [JsonPropertyName("prioridade")]
    public string Prioridade { get; set; } = string.Empty;

    [JsonPropertyName("sugestao_solucao")]
    public string SugestaoSolucao { get; set; } = string.Empty;
}
