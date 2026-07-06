using Microsoft.EntityFrameworkCore;
using LMPTS.Entities;

namespace LMPTS.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {

        }
        public DbSet<Builder> Builders { get; set; }
        public DbSet<BuilderSupervisor> BuilderSupervisors { get; set; }
        public DbSet<Contractor> Contractors { get; set; }
        public DbSet<ContractorSupervisor> ContractorSupervisors { get; set; }
        public DbSet<BuilderContractor> BuilderContractors { get; set; }

        public DbSet<Labor> Labours { get; set; }
        public DbSet<UserOtp> UserOtps { get; set; }

        public DbSet<AttendanceRecord> AttendanceRecords => Set<AttendanceRecord>();
        public DbSet<Payment> Payments { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Builder>()
                .HasOne(b => b.User)
                .WithOne(u => u.Builder)
                .HasForeignKey<Builder>(b => b.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<BuilderSupervisor>()
                .HasOne(b => b.User)
                .WithOne(u => u.BuilderSupervisor)
                .HasForeignKey<BuilderSupervisor>(b => b.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Contractor>()
                .HasOne(c => c.User)
                .WithOne(u => u.Contractor)
                .HasForeignKey<Contractor>(c => c.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<ContractorSupervisor>()
                .HasOne(s => s.User)
                .WithOne(u => u.ContractorSupervisor)
                .HasForeignKey<ContractorSupervisor>(s => s.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Labor>()
                .HasOne(l => l.User)
                .WithOne(u => u.Labor)
                .HasForeignKey<Labor>(l => l.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<BuilderContractor>()
                .HasKey(x => new { x.BuilderId, x.ContractorId });

            modelBuilder.Entity<BuilderContractor>()
                .HasOne(x => x.Builder)
                .WithMany(x => x.BuilderContractors)
                .HasForeignKey(x => x.BuilderId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<BuilderContractor>()
                .HasOne(x => x.Contractor)
                .WithMany(x => x.BuilderContractors)
                .HasForeignKey(x => x.ContractorId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Contractor>()
                .HasOne(c => c.BuilderSupervisors)
                .WithMany(s => s.Contractors)
                .HasForeignKey(c => c.BuilderSupervisorId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Labor>()
                .HasOne(l => l.ContractorSupervisor)
                .WithMany(s => s.Labors)
                .HasForeignKey(l => l.ContractorSupervisorId)
                .OnDelete(DeleteBehavior.Restrict);

            // 6. Labor to Attendance
            modelBuilder.Entity<AttendanceRecord>()
                .HasOne(a => a.Labor)
                .WithMany(l => l.AttendanceRecords)
                .HasForeignKey(a => a.LaborId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Payment>()
                .HasOne(p => p.Labor)
                .WithMany(l => l.Payments)
                .HasForeignKey(p => p.LaborId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Payment>()
                .HasIndex(p => new
                {
                    p.LaborId,
                    p.Month,
                    p.Year
                })
                .IsUnique();

            // 7. Login
            modelBuilder.Entity<User>()
                .HasKey(l => l.UserId);

        }


        public DbSet<User> Users { get; set; }
    }
}
