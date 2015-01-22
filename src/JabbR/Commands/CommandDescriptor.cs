using System;
using JabbR.ViewModels;

namespace JabbR.Commands
{
    public class CommandDescriptor
    {
        public CommandViewModel Details { get; set; }
        public Type Type { get; set; }
    }
}