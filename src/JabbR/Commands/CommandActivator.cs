using System;
using System.Collections.Concurrent;
using System.Linq;
using Microsoft.AspNet.SignalR.Hubs;
using Microsoft.Framework.DependencyInjection;

namespace JabbR.Commands
{
    public class CommandActivator : ICommandActivator
    {
        private readonly ConcurrentDictionary<string, CommandDescriptor> _commandLookup;
        private readonly IServiceProvider _provider;

        public CommandActivator(IServiceProvider provider, ICommandEnumerator commandEnumerator)
        {
            var commandDictionary = commandEnumerator.Commands.ToDictionary(command => command.Details.Name);

            _provider = provider;
            _commandLookup = new ConcurrentDictionary<string, CommandDescriptor>(commandDictionary);
        }

        public ICommand CreateCommand(string commandName, IHub chatHub)
        {
            CommandDescriptor descriptor;
            if (_commandLookup.TryGetValue(commandName, out descriptor))
            {
                var typeActivator = new TypeActivator();
                return (ICommand)typeActivator.CreateInstance(_provider, descriptor.Type, chatHub);
            }

            return null;
        }
    }
}