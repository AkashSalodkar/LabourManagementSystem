using Microsoft.EntityFrameworkCore;
using LMPTS.Entities;

namespace LMPTS.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {

        }
        public DbSet<User> Users { get; set; }
        //public DbSet<Builder> Builders { get; set; }
        //public DbSet<BuilderSupervisor> BuilderSupervisors { get; set; }
        //public DbSet<Contractor> Contractors { get; set; }
        //public DbSet<ContractorSupervisor> ContractorSupervisors { get; set; }
        //public DbSet<BuilderContractor> BuilderContractors { get; set; }
        //public DbSet<Labor> Labours { get; set; }
        public DbSet<UserOtp> UserOtps { get; set; }
        public DbSet<AttendanceRecord> AttendanceRecords => Set<AttendanceRecord>();
        public DbSet<Payment> Payments { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<AttendanceRecord>()
                .HasOne(a => a.User)
                .WithMany(l => l.AttendanceRecords)
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Payment>()
                .HasOne(p => p.User)
                .WithMany(l => l.Payments)
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Payment>()
                .HasIndex(p => new
                {
                    p.UserId,
                    p.Month,
                    p.Year
                })
                .IsUnique();

            // 7. Login
            modelBuilder.Entity<User>()
                .HasKey(l => l.UserId);

        }

    }
}
