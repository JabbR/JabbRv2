using JabbR.Models;
using Microsoft.AspNet.SignalR.Hubs;

namespace JabbR.Commands
{
    public interface ICommandDispatcher
    {
        // TODO: Find a better alternative than passing the IHub everywhere.
        // Hopefully we will be able to take advantage of scoped SignalR services.
        bool TryHandleCommand(ClientMessage message, IHub chatHub);
    }
}