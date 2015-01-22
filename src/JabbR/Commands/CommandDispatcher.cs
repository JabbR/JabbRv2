using System;
using System.Linq;
using System.Text.RegularExpressions;
using JabbR.Models;
using Microsoft.AspNet.SignalR.Hubs;

namespace JabbR.Commands
{
    public class CommandDispatcher : ICommandDispatcher
    {
        private readonly ICommandActivator _commandActivator;

        public CommandDispatcher(ICommandActivator commandActivator)
        {
            _commandActivator = commandActivator;
        }

        public bool TryHandleCommand(ClientMessage message, IHub chatHub)
        {
            var content = message.Content.Trim();
            if (!Regex.IsMatch(content, @"^\/[A-Za-z0-9?]+?"))
            {
                return false;
            }

            string[] args;
            var commandName = ParseCommand(content, out args);

            var command = _commandActivator.CreateCommand(commandName, chatHub);
            if (command == null)
            {
                return false;
            }

            command.Execute(message.Room, args);
            return true;
        }

        private static string ParseCommand(string commandString, out string[] args)
        {
            var parts = commandString.Substring(1).Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);

            if (parts.Length == 0)
            {
                args = new string[0];
                return null;
            }

            args = parts.Skip(1).ToArray();
            return parts[0];
        }
    }
}