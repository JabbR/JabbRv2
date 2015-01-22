using System;

namespace JabbR.ViewModels
{
    public class SettingsViewModel
    {
        public string GoogleAnalytics { get; set; }
        public string AppInsights { get; set; }
        public string Sha { get; set; }
        public string Branch { get; set; }
        public string Time { get; set; }
        public bool DebugMode { get; set; }
        public Version Version { get; set; }
        public bool IsAdmin { get; set; }
        public bool AllowRoomCreation { get; set; }
        public string ClientLanguageResources { get; set; }
        public int MaxMessageLength { get; set; }
     
        public bool ShowDetails
        {
            get
            {
                return !string.IsNullOrEmpty(Sha) && !string.IsNullOrEmpty(Branch) && !string.IsNullOrEmpty(Time);
            }
        }
    }
}