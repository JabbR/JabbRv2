using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using JabbR.ViewModels;
using Microsoft.Framework.Runtime;

namespace JabbR.Commands
{
    public class CommandEnumerator : ICommandEnumerator
    {
        private readonly ILibraryManager _libraryManager;
        private readonly Lazy<IEnumerable<CommandDescriptor>> _commands;

        public CommandEnumerator(ILibraryManager libraryManager)
        {
            _libraryManager = libraryManager;
            _commands = new Lazy<IEnumerable<CommandDescriptor>>(GetCommandDescriptors);
        }

        public IEnumerable<CommandDescriptor> Commands
        {
            get
            {
                return _commands.Value;
            }
        }

        private static IEnumerable<Assembly> GetAssemblies()
        {
            // TODO: Pick up commands from other assemblies.
            yield return Assembly.Load(typeof(CommandEnumerator).GetTypeInfo().Assembly.GetName());
        }

        private static IEnumerable<Type> GetCommandTypes()
        {
            return from assembly in GetAssemblies()
                   from type in assembly.GetTypes()
                   where type.GetTypeInfo().ImplementedInterfaces.Contains(typeof(ICommand))
                   select type;
        }

        private static IEnumerable<CommandDescriptor> GetCommandDescriptors()
        {
            return from commandType in GetCommandTypes()
                   let typeInfo = commandType.GetTypeInfo()
                   let commandAttribute = typeInfo.GetCustomAttributes(true)
                                                  .OfType<CommandAttribute>()
                                                  .FirstOrDefault()
                   where commandAttribute != null
                   select new CommandDescriptor
                   {
                       Type = commandType,
                       Details = new CommandViewModel
                       {
                           Name = commandAttribute.CommandName,
                           Description = commandAttribute.Description,
                           Arguments = commandAttribute.Arguments,
                           Group = commandAttribute.Group,
                           ConfirmMessage = commandAttribute.ConfirmMessage
                       }
                   };
        }
    }
}