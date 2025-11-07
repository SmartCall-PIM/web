using System.Collections.Concurrent;
using Backend.CSharp.Models.DTOs;

namespace Backend.CSharp.Services;

public class TypingStatusService
{
    // Armazena o status de digitação por chamado: ChamadoId -> (UserId -> TypingStatus)
    private readonly ConcurrentDictionary<int, ConcurrentDictionary<string, TypingStatusResponse>> _typingStatus = new();
    
    // Tempo limite para considerar que o usuário parou de digitar (em segundos)
    private const int TYPING_TIMEOUT_SECONDS = 5;

    public void SetTypingStatus(int chamadoId, string userId, string userName, string userType, bool isTyping)
    {
        var chamadoTyping = _typingStatus.GetOrAdd(chamadoId, _ => new ConcurrentDictionary<string, TypingStatusResponse>());
        
        if (isTyping)
        {
            chamadoTyping[userId] = new TypingStatusResponse
            {
                UserId = userId,
                UserName = userName,
                UserType = userType,
                IsTyping = true,
                LastUpdate = DateTime.UtcNow
            };
        }
        else
        {
            chamadoTyping.TryRemove(userId, out _);
        }
    }

    public List<TypingStatusResponse> GetTypingUsers(int chamadoId, string excludeUserId)
    {
        if (!_typingStatus.TryGetValue(chamadoId, out var chamadoTyping))
        {
            return new List<TypingStatusResponse>();
        }

        var now = DateTime.UtcNow;
        var activeTyping = new List<TypingStatusResponse>();

        foreach (var (userId, status) in chamadoTyping)
        {
            // Remove status expirados
            if ((now - status.LastUpdate).TotalSeconds > TYPING_TIMEOUT_SECONDS)
            {
                chamadoTyping.TryRemove(userId, out _);
                continue;
            }

            // Não inclui o próprio usuário
            if (userId != excludeUserId)
            {
                activeTyping.Add(status);
            }
        }

        return activeTyping;
    }

    public void ClearTypingStatus(int chamadoId, string userId)
    {
        if (_typingStatus.TryGetValue(chamadoId, out var chamadoTyping))
        {
            chamadoTyping.TryRemove(userId, out _);
        }
    }
}
