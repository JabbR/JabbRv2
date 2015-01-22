using Microsoft.AspNet.SignalR.Hubs;

namespace JabbR.Commands
{
    public interface ICommandActivator
    {
        ICommand CreateCommand(string commandName, IHub chatHub);
    }
}