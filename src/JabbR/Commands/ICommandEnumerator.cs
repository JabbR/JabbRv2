using System.Collections.Generic;

namespace JabbR.Commands
{
    public interface ICommandEnumerator
    {
        IEnumerable<CommandDescriptor> Commands { get; }
    }
}