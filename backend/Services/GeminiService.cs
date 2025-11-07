using Backend.CSharp.Models;
using System.Text;
using System.Text.Json;

namespace Backend.CSharp.Services;

/// <summary>
/// Serviço para integração com a API do Gemini (FastAPI)
/// </summary>
public class GeminiService
{
    private readonly HttpClient _httpClient;
    private readonly string _apiUrl;
    private readonly ILogger<GeminiService> _logger;

    public GeminiService(HttpClient httpClient, IConfiguration configuration, ILogger<GeminiService> logger)
    {
        _httpClient = httpClient;
        _apiUrl = configuration["GeminiApiUrl"] ?? "http://localhost:8001";
        _logger = logger;
    }

    /// <summary>
    /// Envia a descrição do chamado para a API do Gemini e retorna a análise
    /// </summary>
    public async Task<GeminiAnalise?> AnalisarChamadoAsync(string descricao)
    {
        try
        {
            _logger.LogInformation("Tentando conectar com API do Gemini em: {ApiUrl}", _apiUrl);
            _logger.LogInformation("Descrição recebida: {Descricao}", descricao);

            var requestBody = new { descricao };
            var jsonBody = JsonSerializer.Serialize(requestBody);
            _logger.LogInformation("JSON enviado: {JsonBody}", jsonBody);

            var content = new StringContent(
                jsonBody,
                Encoding.UTF8,
                "application/json"
            );

            var fullUrl = $"{_apiUrl}/analisar";
            _logger.LogInformation("URL completa: {FullUrl}", fullUrl);
            
            var response = await _httpClient.PostAsync(fullUrl, content);
            _logger.LogInformation("Status da resposta: {StatusCode}", response.StatusCode);

            if (response.IsSuccessStatusCode)
            {
                var jsonResponse = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("Resposta recebida: {JsonResponse}", jsonResponse);
                
                var options = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                };
                return JsonSerializer.Deserialize<GeminiAnalise>(jsonResponse, options);
            }
            else
            {
                var errorText = await response.Content.ReadAsStringAsync();
                _logger.LogError("Erro na API do Gemini: {StatusCode} - {ErrorText}", 
                    response.StatusCode, errorText);
                return null;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao conectar com a API do Gemini. URL: {ApiUrl}", _apiUrl);
            return null;
        }
    }

    /// <summary>
    /// Gera uma resposta para o chat usando a API do Gemini
    /// </summary>
    public async Task<string> GerarRespostaChat(string mensagem, List<ChatMessage>? historicoMensagens = null)
    {
        // Prepara o contexto com o histórico
        var contexto = PrepararContextoHistorico(historicoMensagens);
        
        // Adiciona a mensagem atual ao contexto
        var mensagemCompleta = string.IsNullOrEmpty(contexto) 
            ? mensagem 
            : $"{contexto}\n\nUsuário: {mensagem}";

        var analise = await AnalisarChamadoAsync(mensagemCompleta);

        if (analise != null && !string.IsNullOrEmpty(analise.SugestaoSolucao))
        {
            // Converte \n literais em quebras de linha reais
            analise.SugestaoSolucao = analise.SugestaoSolucao.Replace("\\n", "\n");

            // Se for uma apresentação ou fora do escopo, retorna a sugestão diretamente
            if (analise.Categoria == "Outros" || analise.Categoria == "Fora do Escopo")
            {
                return analise.SugestaoSolucao;
            }

            // Se for um chamado técnico, formata a resposta com mais detalhes
            return FormatarRespostaTecnica(analise);
        }

        // Resposta padrão em caso de erro
        return "Desculpe, não consegui processar sua mensagem no momento. Por favor, tente novamente.";
    }

    /// <summary>
    /// Prepara o contexto com o histórico de mensagens
    /// </summary>
    private string PrepararContextoHistorico(List<ChatMessage>? mensagens)
    {
        if (mensagens == null || !mensagens.Any())
        {
            return string.Empty;
        }

        var sb = new StringBuilder();
        sb.AppendLine("Histórico da conversa:");
        sb.AppendLine();

        // Ordena por data e pega as últimas 10 mensagens para não sobrecarregar
        var mensagensRecentes = mensagens
            .OrderBy(m => m.CreatedAt)
            .TakeLast(10)
            .ToList();

        foreach (var msg in mensagensRecentes)
        {
            var remetente = msg.IsUser ? "Usuário" : "Assistente";
            sb.AppendLine($"{remetente}: {msg.Message}");
        }

        return sb.ToString();
    }

    /// <summary>
    /// Formata a resposta de um chamado técnico
    /// </summary>
    private string FormatarRespostaTecnica(GeminiAnalise analise)
    {
        // Para evitar duplicar metadados no texto da IA exibido ao usuário,
        // retornamos apenas a sugestão de solução (texto formatado em Markdown)
        // Os metadados (titulo, categoria, prioridade) são armazenados no Chamado e
        // exibidos separadamente no cabeçalho do chat.
        return analise.SugestaoSolucao ?? string.Empty;
    }
}
