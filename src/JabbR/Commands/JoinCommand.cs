using JabbR.ViewModels;
using Microsoft.AspNet.SignalR;
using Microsoft.AspNet.SignalR.Hubs;

namespace JabbR.Commands
{
    [Command("join", "Join_CommandInfo", "room [invitecode]", "user")]
    public class JoinCommand : Command
    {
        public JoinCommand(IHub chatHub)
            : base(chatHub)
        {
        }

        public override void Execute(string room, string[] args)
        {
            if (args.Length != 1)
            {
                throw new HubException("Invalid number of arguments.");
            }

            var user = new UserViewModel
            {
                Name = Clients.Caller.name
            };

            var newRoom = new RoomViewModel
            {
                Name = args[0],
                Welcome = string.Empty,
                Private = false,
                Closed = false
            };

            // Tell caller to join this room
            Clients.Caller.joinRoom(newRoom);
            // Tell the people in this room that you've joined
            Clients.Group(newRoom.Name).addUser(user, newRoom.Name, isOwner: false);
            // Subscribe to room messages
            Groups.Add(Context.ConnectionId, newRoom.Name);
        }
    }
}