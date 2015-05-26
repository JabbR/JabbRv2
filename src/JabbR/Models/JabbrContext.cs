namespace JabbR.Models
{
    public class JabbrContext
    {
        private static bool _created = false;

        public JabbrContext()
        {
            if (!_created)
            {
                _created = true;
            }
        }
    }
}
