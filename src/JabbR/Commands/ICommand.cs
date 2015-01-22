namespace JabbR.Commands
{
    public interface ICommand
    {
        void Execute(string room, string[] args);
    }
}