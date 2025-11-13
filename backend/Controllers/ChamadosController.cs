using System.Security.Claims;
using Backend.CSharp.Data;
using Backend.CSharp.Models;
using Backend.CSharp.Models.DTOs;
using Backend.CSharp.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.CSharp.Controllers;

[ApiController]
[Route("api/chamados")]
[Authorize] // Requer autenticação para todos os endpoints
public class ChamadosController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly GeminiService _geminiService;
    private readonly TypingStatusService _typingStatusService;
    private readonly ILogger<ChamadosController> _logger;

    public ChamadosController(
        ApplicationDbContext context,
        GeminiService geminiService,
        TypingStatusService typingStatusService,
        ILogger<ChamadosController> logger)
    {
        _context = context;
        _geminiService = geminiService;
        _typingStatusService = typingStatusService;
        _logger = logger;
    }
    /// <summary>
    /// Lista todos os chamados do usuário autenticado
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ChamadoResponse>>> GetChamados()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { error = "Usuário não autenticado" });
        }

        var chamados = await _context.Chamados
            .Where(c => c.UserId == userId) // Filtra apenas chamados do usuário
            .Include(c => c.Mensagens)
            .OrderByDescending(c => c.AtualizadoEm ?? c.CriadoEm)
            .Select(c => new ChamadoResponse
            {
                Id = c.Id,
                NomeUsuario = c.NomeUsuario ?? string.Empty,
                Email = c.Email,
                Titulo = c.Titulo,
                Status = c.Status,
                Categoria = c.Categoria,
                Prioridade = c.Prioridade,
                CriadoEm = c.CriadoEm,
                AtualizadoEm = c.AtualizadoEm,
                TotalMensagens = c.Mensagens.Count,
                UltimaMensagem = c.Mensagens
                    .OrderByDescending(m => m.CreatedAt)
                    .Select(m => m.Message)
                    .FirstOrDefault(),
                AtribuidoATecnico = c.AtribuidoATecnico
            })
            .ToListAsync();

        return Ok(chamados);
    }

    /// <summary>
    /// Busca um chamado específico com todas as mensagens
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ChamadoDetalhadoResponse>> GetChamado(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { error = "Usuário não autenticado" });
        }

        var chamado = await _context.Chamados
            .Include(c => c.Mensagens)
            .FirstOrDefaultAsync(c => c.Id == id && (c.UserId == userId || c.TecnicoId == userId)); // Permite acesso ao dono ou técnico atribuído

        if (chamado == null)
        {
            return NotFound(new { error = "Chamado não encontrado" });
        }

        var response = new ChamadoDetalhadoResponse
        {
            Id = chamado.Id,
            NomeUsuario = chamado.NomeUsuario ?? string.Empty,
            Email = chamado.Email,
            Titulo = chamado.Titulo,
            Status = chamado.Status,
            Categoria = chamado.Categoria,
            Prioridade = chamado.Prioridade,
            CriadoEm = chamado.CriadoEm,
            AtualizadoEm = chamado.AtualizadoEm,
            TotalMensagens = chamado.Mensagens.Count,
            Mensagens = chamado.Mensagens
                .OrderBy(m => m.CreatedAt)
                .Select(m => new ChatMessageResponse
                {
                    Id = m.Id,
                    Message = m.Message,
                    IsUser = m.IsUser,
                    SenderId = m.SenderId,
                    SenderType = m.SenderType,
                    CreatedAt = m.CreatedAt
                })
                .ToList()
        };        return Ok(response);
    }

    /// <summary>
    /// Busca novas mensagens de um chamado após um determinado ID
    /// </summary>
    [HttpGet("{id}/mensagens/novas")]
    public async Task<ActionResult<IEnumerable<ChatMessageResponse>>> GetNovasMensagens(int id, [FromQuery] int? afterId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { error = "Usuário não autenticado" });
        }

        var chamado = await _context.Chamados
            .Include(c => c.Mensagens)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (chamado == null)
        {
            return NotFound(new { error = "Chamado não encontrado" });
        }

        // Verifica se o usuário tem permissão (dono do chamado ou técnico atribuído)
        if (chamado.UserId != userId && chamado.TecnicoId != userId)
        {
            return Forbid();
        }

        // Busca mensagens com ID maior que o fornecido
        var lastId = afterId ?? 0;
        
        var novasMensagens = chamado.Mensagens
            .Where(m => m.Id > lastId)
            .OrderBy(m => m.Id)
            .Select(m => new ChatMessageResponse
            {
                Id = m.Id,
                Message = m.Message,
                IsUser = m.IsUser,
                SenderId = m.SenderId,
                SenderType = m.SenderType,
                CreatedAt = m.CreatedAt
            })
            .ToList();

        return Ok(novasMensagens);
    }

    /// <summary>
    /// Atualiza o status de digitação do usuário em um chamado
    /// </summary>
    [HttpPost("{id}/typing")]
    public async Task<IActionResult> UpdateTypingStatus(int id, [FromBody] TypingStatusRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var userName = User.FindFirstValue(ClaimTypes.Name);
        
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { error = "Usuário não autenticado" });
        }

        var chamado = await _context.Chamados.FindAsync(id);
        if (chamado == null)
        {
            return NotFound(new { error = "Chamado não encontrado" });
        }

        // Verifica se o usuário tem permissão
        if (chamado.UserId != userId && chamado.TecnicoId != userId)
        {
            return Forbid();
        }

        // Determina se é técnico ou usuário
        var userType = userId == chamado.TecnicoId ? "tecnico" : "user";

        _typingStatusService.SetTypingStatus(id, userId, userName ?? "Usuário", userType, request.IsTyping);
        
        return Ok();
    }

    /// <summary>
    /// Obtém os usuários que estão digitando em um chamado
    /// </summary>
    [HttpGet("{id}/typing")]
    public async Task<ActionResult<List<TypingStatusResponse>>> GetTypingStatus(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { error = "Usuário não autenticado" });
        }

        var chamado = await _context.Chamados.FindAsync(id);
        if (chamado == null)
        {
            return NotFound(new { error = "Chamado não encontrado" });
        }

        // Verifica se o usuário tem permissão
        if (chamado.UserId != userId && chamado.TecnicoId != userId)
        {
            return Forbid();
        }

        var typingUsers = _typingStatusService.GetTypingUsers(id, userId);
        
        _logger.LogInformation($"Usuários digitando no chamado {id}: {typingUsers.Count}");
        
        return Ok(typingUsers);
    }

    /// <summary>
    /// Cria um novo chamado
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ChamadoDetalhadoResponse>> CriarChamado([FromBody] CriarChamadoRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var userEmail = User.FindFirstValue(ClaimTypes.Email);
        var userName = User.FindFirstValue(ClaimTypes.Name);
        
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { error = "Usuário não autenticado" });
        }

        try
        {
            _logger.LogInformation("Iniciando criação de chamado para usuário {UserId}", userId);
            _logger.LogInformation("Mensagem inicial: {Mensagem}", request.MensagemInicial);
            
            // Analisa a mensagem inicial com a IA
            _logger.LogInformation("Chamando GeminiService para análise...");
            var analise = await _geminiService.AnalisarChamadoAsync(request.MensagemInicial);
            
            if (analise != null)
            {
                _logger.LogInformation("Análise IA concluída - Título: {Titulo}, Categoria: {Categoria}, Prioridade: {Prioridade}", 
                    analise.Titulo, analise.Categoria, analise.Prioridade);
            }
            else
            {
                _logger.LogWarning("Análise IA retornou null - usando valores padrão");
            }

            // Cria o chamado associado ao usuário autenticado
            // Todos os dados vêm do token JWT - não aceita parâmetros externos
            var chamado = new Chamado
            {
                UserId = userId, // Do token JWT
                NomeUsuario = userName ?? "Usuário", // Do token JWT
                Email = userEmail, // Do token JWT
                Titulo = analise?.Titulo ?? "Novo Chamado",
                Categoria = analise?.Categoria,
                Prioridade = analise?.Prioridade,
                Status = "Em Andamento",
                CriadoEm = DateTime.UtcNow,
                AtualizadoEm = DateTime.UtcNow
            };

            _context.Chamados.Add(chamado);
            await _context.SaveChangesAsync();

            // Adiciona mensagem do usuário
            var userMessage = new ChatMessage
            {
                Message = request.MensagemInicial,
                IsUser = true,
                ChamadoId = chamado.Id,
                CreatedAt = DateTime.UtcNow
            };
            _context.ChatMessages.Add(userMessage);

            // Gera resposta da IA
            var botResponseText = await _geminiService.GerarRespostaChat(request.MensagemInicial);
            var botMessage = new ChatMessage
            {
                Message = botResponseText,
                IsUser = false,
                ChamadoId = chamado.Id,
                CreatedAt = DateTime.UtcNow
            };
            _context.ChatMessages.Add(botMessage);

            await _context.SaveChangesAsync();

            // Retorna o chamado criado com as mensagens
            var response = new ChamadoDetalhadoResponse
            {
                Id = chamado.Id,
                NomeUsuario = chamado.NomeUsuario,
                Email = chamado.Email,
                Titulo = chamado.Titulo,
                Status = chamado.Status,
                Categoria = chamado.Categoria,
                Prioridade = chamado.Prioridade,
                CriadoEm = chamado.CriadoEm,
                AtualizadoEm = chamado.AtualizadoEm,
                TotalMensagens = 2,
                Mensagens = new List<ChatMessageResponse>
                {
                    new() { Id = userMessage.Id, Message = userMessage.Message, IsUser = true, CreatedAt = userMessage.CreatedAt },
                    new() { Id = botMessage.Id, Message = botMessage.Message, IsUser = false, CreatedAt = botMessage.CreatedAt }
                }
            };

            return CreatedAtAction(nameof(GetChamado), new { id = chamado.Id }, response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao criar chamado");
            return StatusCode(500, new { error = "Erro ao criar chamado" });
        }
    }

    /// <summary>
    /// Adiciona uma nova mensagem a um chamado existente
    /// </summary>
    [HttpPost("{id}/mensagens")]
    public async Task<ActionResult<SendMessageResponse>> AdicionarMensagem(int id, [FromBody] SendMessageRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { error = "Usuário não autenticado" });
        }

        var chamado = await _context.Chamados
            .FirstOrDefaultAsync(c => c.Id == id && (c.UserId == userId || c.TecnicoId == userId)); // Permite usuário ou técnico
        
        if (chamado == null)
        {
            return NotFound(new { error = "Chamado não encontrado" });
        }

        // Verifica se o chamado já foi resolvido
        if (chamado.Status == "Resolvido")
        {
            return BadRequest(new { error = "Este chamado já foi resolvido e não aceita mais mensagens" });
        }

        try
        {
            // Adiciona mensagem do usuário
            var userMessage = new ChatMessage
            {
                Message = request.Message,
                IsUser = true,
                ChamadoId = id,
                SenderId = userId,
                SenderType = userId == chamado.TecnicoId ? "tecnico" : "user",
                CreatedAt = DateTime.UtcNow
            };
            _context.ChatMessages.Add(userMessage);

            // Verifica se o chamado foi escalado para um técnico
            ChatMessage? botMessage = null;
            if (string.IsNullOrEmpty(chamado.TecnicoId))
            {
                // Chamado não está com técnico, IA pode responder
                // Busca o histórico de mensagens do chamado (antes de adicionar a nova)
                var historicoMensagens = await _context.ChatMessages
                    .Where(m => m.ChamadoId == id)
                    .OrderBy(m => m.CreatedAt)
                    .ToListAsync();

                // Gera resposta da IA com contexto do histórico
                var botResponseText = await _geminiService.GerarRespostaChat(request.Message, historicoMensagens);
                botMessage = new ChatMessage
                {
                    Message = botResponseText,
                    IsUser = false,
                    ChamadoId = id,
                    SenderId = null,
                    SenderType = "ai",
                    CreatedAt = DateTime.UtcNow
                };
                _context.ChatMessages.Add(botMessage);
            }

            // Atualiza timestamp do chamado
            chamado.AtualizadoEm = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var response = new SendMessageResponse
            {
                UserMessage = new ChatMessageResponse
                {
                    Id = userMessage.Id,
                    Message = userMessage.Message,
                    IsUser = true,
                    SenderId = userMessage.SenderId,
                    SenderType = userMessage.SenderType,
                    CreatedAt = userMessage.CreatedAt
                }
            };

            // Se a IA respondeu, adiciona a resposta
            if (botMessage != null)
            {
                response.BotResponse = new ChatMessageResponse
                {
                    Id = botMessage.Id,
                    Message = botMessage.Message,
                    IsUser = false,
                    SenderId = botMessage.SenderId,
                    SenderType = botMessage.SenderType,
                    CreatedAt = botMessage.CreatedAt
                };
            }

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao adicionar mensagem");
            return StatusCode(500, new { error = "Erro ao adicionar mensagem" });
        }
    }

    /// <summary>
    /// Atualiza o status de um chamado
    /// </summary>
    [HttpPatch("{id}/status")]
    public async Task<ActionResult> AtualizarStatus(int id, [FromBody] string status)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { error = "Usuário não autenticado" });
        }

        var chamado = await _context.Chamados
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId); // Verifica se é do usuário
        
        if (chamado == null)
        {
            return NotFound(new { error = "Chamado não encontrado" });
        }

        chamado.Status = status;
        chamado.AtualizadoEm = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Status atualizado com sucesso" });
    }

    /// <summary>
    /// Escala o chamado para um técnico quando o usuário marca como não resolvido
    /// </summary>
    [HttpPost("{id}/escalar")]
    public async Task<ActionResult> EscalarParaTecnico(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { error = "Usuário não autenticado" });
        }

        var chamado = await _context.Chamados
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
        
        if (chamado == null)
        {
            return NotFound(new { error = "Chamado não encontrado" });
        }

        // Verifica se o chamado já foi atribuído a um técnico
        if (chamado.AtribuidoATecnico)
        {
            return BadRequest(new { error = "Este chamado já foi atribuído a um técnico" });
        }

        // Busca técnicos (Role = 1) e administradores (Role = 2)
        var tecnicos = await _context.Users
            .Where(u => u.Role == 1)
            .ToListAsync();

        var administradores = await _context.Users
            .Where(u => u.Role == 2)
            .ToListAsync();

        // Prioriza técnicos online (última atividade no último minuto = realmente online agora)
        var tecnicosOnline = tecnicos
            .Where(t => t.LastActivityAt.HasValue && t.LastActivityAt.Value > DateTime.UtcNow.AddMinutes(-1))
            .ToList();

        // Administradores online como fallback
        var adminsOnline = administradores
            .Where(a => a.LastActivityAt.HasValue && a.LastActivityAt.Value > DateTime.UtcNow.AddMinutes(-1))
            .ToList();

        // Lógica de priorização:
        // 1. Técnicos online
        // 2. Técnicos offline
        // 3. Administradores online
        // 4. Administradores offline
        List<ApplicationUser> tecnicosDisponiveis;
        
        if (tecnicosOnline.Any())
        {
            tecnicosDisponiveis = tecnicosOnline;
        }
        else if (tecnicos.Any())
        {
            tecnicosDisponiveis = tecnicos;
        }
        else if (adminsOnline.Any())
        {
            tecnicosDisponiveis = adminsOnline;
        }
        else if (administradores.Any())
        {
            tecnicosDisponiveis = administradores;
        }
        else
        {
            return BadRequest(new { error = "Nenhum técnico disponível no momento" });
        }

        // Seleciona técnico aleatório
        var random = new Random();
        var tecnicoSorteado = tecnicosDisponiveis[random.Next(tecnicosDisponiveis.Count)];

        // Atribui técnico ao chamado e marca como atribuído
        chamado.TecnicoId = tecnicoSorteado.Id;
        chamado.AtribuidoATecnico = true;
        chamado.AtualizadoEm = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new 
        { 
            message = "Chamado escalado para técnico com sucesso",
            tecnicoNome = tecnicoSorteado.FullName ?? tecnicoSorteado.Email
        });
    }

    /// <summary>
    /// Marca um chamado como resolvido (apenas técnicos/admins atribuídos)
    /// </summary>
    [HttpPost("{id}/resolver")]
    public async Task<ActionResult> MarcarComoResolvido(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { error = "Usuário não autenticado" });
        }

        var chamado = await _context.Chamados
            .FirstOrDefaultAsync(c => c.Id == id);
        
        if (chamado == null)
        {
            return NotFound(new { error = "Chamado não encontrado" });
        }

        // Verifica se o usuário é o técnico atribuído ao chamado
        if (chamado.TecnicoId != userId)
        {
            // Verifica se é administrador (Role 2) para permitir também
            var user = await _context.Users.FindAsync(userId);
            if (user == null || user.Role != 2)
            {
                return Forbid(); // 403 - Apenas o técnico atribuído ou admin pode resolver
            }
        }

        // Atualiza status para Resolvido
        chamado.Status = "Resolvido";
        chamado.AtualizadoEm = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new 
        { 
            message = "Chamado marcado como resolvido com sucesso",
            status = chamado.Status
        });
    }

    /// <summary>
    /// Lista chamados atribuídos ao técnico logado
    /// </summary>
    [HttpGet("tecnico/meus-chamados")]
    public async Task<ActionResult<IEnumerable<ChamadoResponse>>> GetChamadosTecnico()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var userRole = User.FindFirstValue(ClaimTypes.Role);
        
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { error = "Usuário não autenticado" });
        }

        // Verifica se é técnico ou administrador
        if (userRole != "Técnico" && userRole != "Administrador")
        {
            return Forbid();
        }

        var chamados = await _context.Chamados
            .Where(c => c.TecnicoId == userId) // Filtra chamados atribuídos ao técnico
            .Include(c => c.Mensagens)
            .OrderByDescending(c => c.AtualizadoEm ?? c.CriadoEm)
            .Select(c => new ChamadoResponse
            {
                Id = c.Id,
                NomeUsuario = c.NomeUsuario ?? string.Empty,
                Email = c.Email,
                Titulo = c.Titulo,
                Status = c.Status,
                Categoria = c.Categoria,
                Prioridade = c.Prioridade,
                CriadoEm = c.CriadoEm,
                AtualizadoEm = c.AtualizadoEm,
                TotalMensagens = c.Mensagens.Count,
                UltimaMensagem = c.Mensagens
                    .OrderByDescending(m => m.CreatedAt)
                    .Select(m => m.Message)
                    .FirstOrDefault(),
                AtribuidoATecnico = c.AtribuidoATecnico
            })
            .ToListAsync();

        return Ok(chamados);
    }

    /// <summary>
    /// Lista TODOS os chamados do sistema (apenas para técnicos e administradores)
    /// </summary>
    [HttpGet("relatorio/todos")]
    public async Task<ActionResult<IEnumerable<ChamadoResponse>>> GetTodosChamados()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { error = "Usuário não autenticado" });
        }

        // Busca o usuário para verificar a Role
        var user = await _context.Users.FindAsync(userId);
        
        if (user == null)
        {
            return Unauthorized(new { error = "Usuário não encontrado" });
        }

        // Verifica se é técnico (Role 1) ou administrador (Role 2)
        if (user.Role != 1 && user.Role != 2)
        {
            return Forbid(); // Retorna 403 Forbidden se não for técnico/admin
        }

        var chamados = await _context.Chamados
            .Include(c => c.Mensagens)
            .OrderByDescending(c => c.AtualizadoEm ?? c.CriadoEm)
            .Select(c => new ChamadoResponse
            {
                Id = c.Id,
                NomeUsuario = c.NomeUsuario ?? string.Empty,
                Email = c.Email,
                Titulo = c.Titulo,
                Status = c.Status,
                Categoria = c.Categoria,
                Prioridade = c.Prioridade,
                CriadoEm = c.CriadoEm,
                AtualizadoEm = c.AtualizadoEm,
                TotalMensagens = c.Mensagens.Count,
                UltimaMensagem = c.Mensagens
                    .OrderByDescending(m => m.CreatedAt)
                    .Select(m => m.Message)
                    .FirstOrDefault(),
                AtribuidoATecnico = c.AtribuidoATecnico
            })
            .ToListAsync();

        return Ok(chamados);
    }
}
