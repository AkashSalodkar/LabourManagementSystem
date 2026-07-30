using LMPTS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System.Reflection.Emit;

namespace LMPTS.Infrastructure.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<UserOtp> UserOtps { get; set; }
        public DbSet<Project> Projects { get; set; }
        public DbSet<Worker> Workers { get; set; }
        public DbSet<WorkerAttendance> WorkerAttendances { get; set; }
        public DbSet<WorkerWageOverride> WorkerWageOverrides { get; set; }
        public DbSet<WorkerPayment> WorkerPayments { get; set; }
        public DbSet<WorkerAdvance> WorkerAdvances { get; set; }
        public DbSet<WorkerBonus> WorkerBonuses { get; set; }
        public DbSet<WorkerMonthlyStatement> WorkerMonthlyStatements { get; set; }
        public DbSet<Subscription> Subscriptions { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<DashboardStats> DashboardStats { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User Configuration
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.FullName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.MobileNumber).IsRequired().HasMaxLength(10);
                entity.Property(e => e.Industry).HasMaxLength(50);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETDATE()");
                entity.HasIndex(e => e.MobileNumber).IsUnique();
            });

            // UserOtp Configuration
            modelBuilder.Entity<UserOtp>(entity =>
            {
                entity.HasKey(e => e.OtpId);
                entity.Property(e => e.MobileNumber).IsRequired().HasMaxLength(10);
                entity.Property(e => e.OtpCode).IsRequired().HasMaxLength(6);
                entity.Property(e => e.Role).IsRequired().HasMaxLength(20);
                entity.HasIndex(e => e.MobileNumber);
                entity.HasIndex(e => e.ExpiryTime);
            });

            // Project Configuration
            modelBuilder.Entity<Project>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.ProjectName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.ProjectAddress).HasMaxLength(255);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.LastModifiedAt).HasDefaultValueSql("GETDATE()");
                entity.HasIndex(e => new { e.UserId, e.IsActive });
            });

            // Worker Configuration
            modelBuilder.Entity<Worker>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.FullName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.MobileNumber).HasMaxLength(10);
                entity.Property(e => e.JoiningDate).HasColumnType("date");
                entity.Property(e => e.DailyWage).HasColumnType("decimal(10,2)").HasDefaultValue(400);
                entity.Property(e => e.Role).HasMaxLength(50).HasDefaultValue("Worker");
                entity.Property(e => e.Advance).HasColumnType("decimal(10,2)").HasDefaultValue(0);
                entity.Property(e => e.Bonus).HasColumnType("decimal(10,2)").HasDefaultValue(0);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.LastUpdatedAt).HasDefaultValueSql("GETDATE()");
                entity.HasIndex(e => e.ProjectId);
                entity.HasIndex(e => e.FullName);
            });

            // WorkerAttendance Configuration
            modelBuilder.Entity<WorkerAttendance>(entity =>
            {
                entity.HasKey(e => e.AttendanceId);
                entity.Property(e => e.AttendanceDate).HasColumnType("date");
                entity.Property(e => e.Status).IsRequired().HasMaxLength(2);
                entity.Property(e => e.DailyRate).HasColumnType("decimal(10,2)");
                entity.Property(e => e.NetAmount).HasColumnType("decimal(10,2)");
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETDATE()");
                entity.HasIndex(e => new { e.WorkerId, e.AttendanceDate }).IsUnique();
                entity.HasIndex(e => e.AttendanceDate);
            });

            // WorkerWageOverride Configuration
            modelBuilder.Entity<WorkerWageOverride>(entity =>
            {
                entity.HasKey(e => e.OverrideId);
                entity.Property(e => e.EffectiveFrom).HasColumnType("date");
                entity.Property(e => e.EffectiveTo).HasColumnType("date");
                entity.Property(e => e.DailyWageAmount).HasColumnType("decimal(10,2)");
                entity.Property(e => e.Note).HasMaxLength(255);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETDATE()");
                entity.HasIndex(e => new { e.WorkerId, e.EffectiveFrom, e.EffectiveTo });
            });

            // WorkerPayment Configuration
            modelBuilder.Entity<WorkerPayment>(entity =>
            {
                entity.HasKey(e => e.PaymentId);
                entity.Property(e => e.PaymentDate).HasColumnType("date");
                entity.Property(e => e.Amount).HasColumnType("decimal(10,2)");
                entity.Property(e => e.PaymentMethod).HasMaxLength(20).HasDefaultValue("Cash");
                entity.Property(e => e.Note).HasMaxLength(255);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETDATE()");
                entity.HasIndex(e => new { e.WorkerId, e.PaymentDate });
            });

            // WorkerAdvance Configuration
            modelBuilder.Entity<WorkerAdvance>(entity =>
            {
                entity.HasKey(e => e.AdvanceId);
                entity.Property(e => e.AdvanceDate).HasColumnType("date");
                entity.Property(e => e.Amount).HasColumnType("decimal(10,2)");
                entity.Property(e => e.PaymentMethod).HasMaxLength(20).HasDefaultValue("Cash");
                entity.Property(e => e.Note).HasMaxLength(255);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETDATE()");
                entity.HasIndex(e => new { e.WorkerId, e.AdvanceDate });
            });

            // WorkerBonus Configuration
            modelBuilder.Entity<WorkerBonus>(entity =>
            {
                entity.HasKey(e => e.BonusId);
                entity.Property(e => e.BonusDate).HasColumnType("date");
                entity.Property(e => e.Amount).HasColumnType("decimal(10,2)");
                entity.Property(e => e.PaymentMethod).HasMaxLength(20).HasDefaultValue("Cash");
                entity.Property(e => e.Note).HasMaxLength(255);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETDATE()");
                entity.HasIndex(e => new { e.WorkerId, e.BonusDate });
            });

            // WorkerMonthlyStatement Configuration
            modelBuilder.Entity<WorkerMonthlyStatement>(entity =>
            {
                entity.HasKey(e => e.StatementId);
                entity.Property(e => e.TotalWages).HasColumnType("decimal(18,2)");
                entity.Property(e => e.TotalAdvances).HasColumnType("decimal(18,2)");
                entity.Property(e => e.TotalBonuses).HasColumnType("decimal(18,2)");
                entity.Property(e => e.TotalPayments).HasColumnType("decimal(18,2)");
                entity.Property(e => e.Balance).HasColumnType("decimal(18,2)");
                entity.Property(e => e.CalculatedAt).HasDefaultValueSql("GETDATE()");
                entity.HasIndex(e => new { e.WorkerId, e.Month, e.Year }).IsUnique();
            });

            // Subscription Configuration
            modelBuilder.Entity<Subscription>(entity =>
            {
                entity.HasKey(e => e.SubscriptionId);
                entity.Property(e => e.PlanType).IsRequired().HasMaxLength(20).HasDefaultValue("free");
                entity.Property(e => e.StartDate).HasColumnType("date");
                entity.Property(e => e.EndDate).HasColumnType("date");
                entity.Property(e => e.PricePaid).HasColumnType("decimal(10,2)");
                entity.Property(e => e.PaymentMethod).HasMaxLength(50);
                entity.Property(e => e.Note).HasMaxLength(255);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETDATE()");
                entity.HasIndex(e => new { e.UserId, e.IsActive });
            });

            // Notification Configuration
            modelBuilder.Entity<Notification>(entity =>
            {
                entity.HasKey(e => e.NotificationId);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Message).IsRequired().HasMaxLength(1000);
                entity.Property(e => e.Type).HasMaxLength(50);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.ReadAt).HasColumnType("datetime");
                entity.HasIndex(e => new { e.UserId, e.IsRead, e.CreatedAt });
            });

            // AuditLog Configuration
            modelBuilder.Entity<AuditLog>(entity =>
            {
                entity.HasKey(e => e.LogId);
                entity.Property(e => e.Action).IsRequired().HasMaxLength(50);
                entity.Property(e => e.EntityName).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Details).HasMaxLength(500);
                entity.Property(e => e.IpAddress).HasMaxLength(50);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETDATE()");
                entity.HasIndex(e => new { e.UserId, e.EntityName, e.CreatedAt });
            });

            // DashboardStats Configuration
            modelBuilder.Entity<DashboardStats>(entity =>
            {
                entity.HasKey(e => e.StatsId);
                entity.Property(e => e.TotalDue).HasColumnType("decimal(18,2)");
                entity.Property(e => e.CalculatedAt).HasDefaultValueSql("GETDATE()");
                entity.HasIndex(e => e.UserId).IsUnique();
            });
        }
    }
}