using Backend.CSharp.Data;
using Backend.CSharp.Models;
using Backend.CSharp.Models.DTOs;
using Backend.CSharp.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.CSharp.Controllers;

[ApiController]
[Route("api/chat")]
public class ChatController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly GeminiService _geminiService;
    private readonly ILogger<ChatController> _logger;

    public ChatController(
        ApplicationDbContext context,
        GeminiService geminiService,
        ILogger<ChatController> logger)
    {
        _context = context;
        _geminiService = geminiService;
        _logger = logger;
    }

    /// <summary>
    /// Lista todas as mensagens do chat
    /// </summary>
    [HttpGet("messages")]
    public async Task<ActionResult<IEnumerable<ChatMessageResponse>>> GetMessages()
    {
        var messages = await _context.ChatMessages
            .OrderBy(m => m.CreatedAt)
            .Select(m => new ChatMessageResponse
            {
                Id = m.Id,
                Message = m.Message,
                IsUser = m.IsUser,
                CreatedAt = m.CreatedAt
            })
            .ToListAsync();

        return Ok(messages);
    }

    /// <summary>
    /// Envia uma mensagem e recebe resposta da IA
    /// GET: Retorna informações sobre o endpoint
    /// POST: Envia mensagem e recebe resposta
    /// </summary>
    [HttpGet("messages/send_message")]
    [HttpPost("messages/send_message")]
    public async Task<ActionResult> SendMessage([FromBody] SendMessageRequest? request = null)
    {
        // Se for GET, retorna informações sobre o endpoint
        if (HttpContext.Request.Method == "GET")
        {
            return Ok(new
            {
                endpoint = "/api/chat/messages/send_message/",
                method = "POST",
                description = "Envia uma mensagem para o chat e recebe resposta da IA",
                body = new { message = "Sua mensagem aqui" },
                example = new { message = "Meu computador não liga" }
            });
        }

        // Validação
        if (request == null || string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest(new { error = "Mensagem não pode estar vazia" });
        }

        try
        {
            // Salva mensagem do usuário
            var userMessage = new ChatMessage
            {
                Message = request.Message,
                IsUser = true,
                CreatedAt = DateTime.UtcNow
            };
            _context.ChatMessages.Add(userMessage);
            await _context.SaveChangesAsync();

            // Gera resposta usando o Gemini
            var botResponseText = await _geminiService.GerarRespostaChat(request.Message);

            // Salva resposta do bot
            var botMessage = new ChatMessage
            {
                Message = botResponseText,
                IsUser = false,
                CreatedAt = DateTime.UtcNow
            };
            _context.ChatMessages.Add(botMessage);
            await _context.SaveChangesAsync();

            // Retorna ambas as mensagens
            return Ok(new SendMessageResponse
            {
                UserMessage = new ChatMessageResponse
                {
                    Id = userMessage.Id,
                    Message = userMessage.Message,
                    IsUser = userMessage.IsUser,
                    CreatedAt = userMessage.CreatedAt
                },
                BotResponse = new ChatMessageResponse
                {
                    Id = botMessage.Id,
                    Message = botMessage.Message,
                    IsUser = botMessage.IsUser,
                    CreatedAt = botMessage.CreatedAt
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao processar mensagem");
            return StatusCode(500, new { error = "Erro interno do servidor" });
        }
    }

    /// <summary>
    /// Analisa uma descrição de chamado e retorna a classificação completa
    /// </summary>
    [HttpPost("messages/analisar_chamado")]
    public async Task<ActionResult<GeminiAnalise>> AnalisarChamado([FromBody] AnalisarChamadoRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var analise = await _geminiService.AnalisarChamadoAsync(request.Descricao);

            if (analise == null)
            {
                return StatusCode(500, new { error = "Não foi possível analisar o chamado" });
            }

            return Ok(analise);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao analisar chamado");
            return StatusCode(500, new { error = "Erro interno do servidor" });
        }
    }
}
