using System;
using Microsoft.AspNet.SignalR;
using Microsoft.AspNet.SignalR.Hubs;

namespace JabbR.Commands
{
    public abstract class Command : ICommand
    {
        public Command(IHub chatHub)
        {
            Context = chatHub.Context;
            Clients = chatHub.Clients;
            Groups = chatHub.Groups;
        }

        public HubCallerContext Context { get; private set; }
        public IHubCallerConnectionContext<dynamic> Clients { get; private set; }
        public IGroupManager Groups { get; private set; }

        public abstract void Execute(string room, string[] args);
    }
}