using Newtonsoft.Json;

namespace BlazorChatApp.Models
{
    public class ChatMessage
    {
        public bool IsUser { get; set; }
        public string Text { get; set; } = "";
        public IList<AttachFileModel> AttachFilesSend { get; set; }
        public bool IsFile { get; set; }
    }

    public class AttachFileModel
    {
        public string ContentBase64 { get; set; }
        public string FileName { get; set; }
        public Guid Id { get; set; }
        public string Extension { get; set; }
        public string ContentType { get; set; }
        public StreamContent StreamContent { get; set; }
    }

    public class ChatResponse
    {
        [JsonProperty("message")]
        public string Message { get; set; }
    }
}
