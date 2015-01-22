using JabbR.ViewModels;
using Microsoft.AspNet.SignalR;
using Microsoft.AspNet.SignalR.Hubs;

namespace JabbR.Commands
{
    [Command("name", "", "userName", "user")]
    public class NameCommand : Command
    {
        public NameCommand(IHub chatHub)
            : base(chatHub)
        {
        }

        public override void Execute(string room, string[] args)
        {
            if (args.Length != 1)
            {
                throw new HubException("Invalid number of arguments.");
            }

            Clients.Caller.userNameChanged(new UserViewModel
            {
                Name = args[0]
            });
        }
    }
}