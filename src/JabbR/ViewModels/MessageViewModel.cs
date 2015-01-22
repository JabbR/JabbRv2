using System;

namespace JabbR.ViewModels
{
    public class MessageViewModel
    {
        public bool HtmlEncoded { get; set; }
        public string Id { get; set; }
        public string Content { get; set; }
        public string HtmlContent { get; set; }
        public DateTimeOffset When { get; set; }
        public UserViewModel User { get; set; }
        public int MessageType { get; set; }
        public string UserRoomPresence { get; set; }

        public string ImageUrl { get; set; }
        public string Source { get; set; }
    }
}