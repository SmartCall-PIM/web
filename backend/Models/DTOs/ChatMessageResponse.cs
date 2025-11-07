namespace Backend.CSharp.Models.DTOs;

public class ChatMessageResponse
{
    public int Id { get; set; }
    public string Message { get; set; } = string.Empty;
    public bool IsUser { get; set; }
    public string? SenderId { get; set; }
    public string? SenderType { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class SendMessageResponse
{
    public ChatMessageResponse UserMessage { get; set; } = null!;
    public ChatMessageResponse BotResponse { get; set; } = null!;
}
