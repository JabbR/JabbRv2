using System;
using System.Collections.Generic;
using System.Linq;
using JabbR.Commands;
using JabbR.Models;
using JabbR.ViewModels;
using Microsoft.AspNet.SignalR;

namespace JabbR
{
    public class Chat : Hub
    {
        private readonly ICommandEnumerator _commandEnumerator;
        private readonly ICommandDispatcher _commandDispatcher;

        public Chat(ICommandEnumerator commandEnumerator,
                    ICommandDispatcher commandDispatcher)
            : base()
        {
            _commandEnumerator = commandEnumerator;
            _commandDispatcher = commandDispatcher;
        }

        public void Join()
        {
            Join(reconnecting: false);
        }

        public void Join(bool reconnecting)
        {
            Clients.Caller.name = "testUser";
            Clients.Caller.LogOn(new object[0], new object[0], new { TabOrder = new object[0] });
        }

        public bool Send(string content, string roomName)
        {
            return Send(new ClientMessage
            {
                Content = content,
                Room = roomName
            });
        }

        public bool Send(ClientMessage clientMessage)
        {
            if (!_commandDispatcher.TryHandleCommand(clientMessage, this))
            {
                // The message is not a command so treat it as a normal message
                var message = new MessageViewModel
                {
                    User = GetUserInfo(),
                    Id = clientMessage.Id,
                    Content = clientMessage.Content,
                    When = DateTimeOffset.Now
                };

                Clients.Group(clientMessage.Room).addMessage(message, clientMessage.Room);
            }

            return true;
        }

        public UserViewModel GetUserInfo()
        {
            return new UserViewModel
            {
                Name = Clients.Caller.name
            };
        }

        public IEnumerable<CommandViewModel> GetCommands()
        {
            return from command in _commandEnumerator.Commands
                   select command.Details;
        }

        public object GetShortcuts()
        {
            return new[] {
                new { Name = "Tab or Shift + Tab", Group = "shortcut", IsKeyCombination = true, Description = LanguageResources.Client_ShortcutTabs },
                new { Name = "Alt + L", Group = "shortcut", IsKeyCombination = true, Description = LanguageResources.Client_ShortcutLobby },
                new { Name = "Alt + Number", Group = "shortcut", IsKeyCombination = true, Description = LanguageResources.Client_ShortcutSpecificTab }
            };
        }

        public IEnumerable<LobbyRoomViewModel> GetRooms()
        {
            return Enumerable.Empty<LobbyRoomViewModel>();
        }

        public IEnumerable<MessageViewModel> GetPreviousMessages(string messageId)
        {
            return Enumerable.Empty<MessageViewModel>();
        }

        public void LoadRooms(string[] roomNames)
        {
        }

        public RoomViewModel GetRoomInfo(string roomName)
        {
            return new RoomViewModel
            {
                Name = roomName,
                Owners = Enumerable.Empty<string>(),
                Users = Enumerable.Empty<UserViewModel>(),
                RecentMessages = Enumerable.Empty<MessageViewModel>()
            };
        }

        public void PostNotification(ClientNotification notification)
        {
        }

        public void PostNotification(ClientNotification notification, bool executeContentProviders)
        {
        }

        public void Typing(string roomName)
        {
        }

        public void UpdateActivity()
        {
        }

        public void TabOrderChanged(string[] tabOrdering)
        {
        }
    }
}
