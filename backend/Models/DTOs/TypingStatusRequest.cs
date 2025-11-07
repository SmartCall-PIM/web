namespace Backend.CSharp.Models.DTOs;

public class TypingStatusRequest
{
    public bool IsTyping { get; set; }
}

public class TypingStatusResponse
{
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string UserType { get; set; } = string.Empty;
    public bool IsTyping { get; set; }
    public DateTime LastUpdate { get; set; }
}
