using System;
using System.Resources;

namespace JabbR.Commands
{
    [AttributeUsage(AttributeTargets.Class, Inherited = false, AllowMultiple = true)]
    public sealed class CommandAttribute : Attribute
    {
        public string CommandName { get; private set; }
        public string DescriptionResourceKey { get; set; }
        public string Arguments { get; set; }
        public string Group { get; set; }
        public string ConfirmMessageResourceKey { get; set; }

        public string Description {
            get
            {
                if (string.IsNullOrWhiteSpace(DescriptionResourceKey))
                {
                    return string.Empty;
                }

                var resourceManager = new ResourceManager(typeof(LanguageResources));
                return resourceManager.GetString(DescriptionResourceKey);
            }
        }
        public string ConfirmMessage
        {
            get
            {
                if (string.IsNullOrWhiteSpace(ConfirmMessageResourceKey))
                {
                    return null;
                }

                var resourceManager = new ResourceManager(typeof(LanguageResources));
                return resourceManager.GetString(ConfirmMessageResourceKey);
            }
        }

        public CommandAttribute(string commandName, string descriptionResourceKey, string arguments, string group)
        {
            CommandName = commandName;
            DescriptionResourceKey = descriptionResourceKey;
            Arguments = arguments;
            Group = group;
        }

        public CommandAttribute(string commandName, string descriptionResourceKey, string arguments, string group, string confirmMessageResourceKey)
            : this(commandName, descriptionResourceKey, arguments, group)
        {
            ConfirmMessageResourceKey = confirmMessageResourceKey;
        }
    }
}