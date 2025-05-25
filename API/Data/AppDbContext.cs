using Microsoft.EntityFrameworkCore;
using BandymasPraktikiai;

namespace BandymasPraktikiai.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Group> Groups { get; set; }
        public DbSet<GroupMember> GroupMembers { get; set; }
        public DbSet<MemberDebt> MemberDebts { get; set; }
        public DbSet<Transaction> Transactions { get; set; }
        public DbSet<TransactionSplit> TransactionSplits { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>()
                .Property(u => u.Id)
                .ValueGeneratedOnAdd();

            modelBuilder.Entity<GroupMember>()
                .HasOne(gm => gm.User)
                .WithMany(u => u.GroupMemberships)
                .HasForeignKey(gm => gm.UserId);

            modelBuilder.Entity<MemberDebt>()
                .HasOne(md => md.GroupMember)
                .WithMany(gm => gm.Debts)
                .HasForeignKey(md => md.GroupMemId);

            // Add unique index to prevent duplicate debts
            modelBuilder.Entity<MemberDebt>()
                .HasIndex(md => new { md.GroupMemId, md.CreditorId, md.DebtorId })
                .IsUnique();
        }
    }
}