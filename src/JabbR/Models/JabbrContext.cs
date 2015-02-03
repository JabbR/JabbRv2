using Microsoft.AspNet.Identity.EntityFramework;
using Microsoft.Data.Entity;
using Microsoft.Data.Entity.Metadata;

namespace JabbR.Models
{
    public class JabbrContext :IdentityDbContext<ChatUser>
    {
        private static bool _created = false;

        public JabbrContext()
        {
            Database.AsMigrationsEnabled().ApplyMigrations();
        }

        protected override void OnConfiguring(DbContextOptions options)
        {
            options.UseSqlServer();
        }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
        }
    }
}