using Microsoft.EntityFrameworkCore;
using LMPTS.Entities;

namespace LMPTS.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        // ===== Existing DbSets =====
        public DbSet<User> Users { get; set; }
        public DbSet<UserOtp> UserOtps { get; set; }
        public DbSet<AttendanceRecord> AttendanceRecords { get; set; }
        public DbSet<Payment> Payments { get; set; }

        // ===== New DbSets =====
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

            // ============================================
            // USER CONFIGURATION
            // ============================================
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(u => u.UserId);

                entity.Property(u => u.FullName)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(u => u.MobileNumber)
                    .IsRequired()
                    .HasMaxLength(10);

                entity.Property(u => u.Industry)
                    .HasMaxLength(50);

                entity.Property(u => u.Role)
                    .HasDefaultValue(UserRole.Supervisor);

                entity.Property(u => u.CreatedAt)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("GETDATE()");

                entity.Property(u => u.IsVerified)
                    .HasDefaultValue(false);

                entity.Property(u => u.IsActive)
                    .HasDefaultValue(true);

                // Unique constraint on MobileNumber
                entity.HasIndex(u => u.MobileNumber)
                    .IsUnique();

                // Navigation properties
                entity.HasMany(u => u.Projects)
                    .WithOne(p => p.User)
                    .HasForeignKey(p => p.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(u => u.Subscriptions)
                    .WithOne(s => s.User)
                    .HasForeignKey(s => s.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(u => u.Notifications)
                    .WithOne(n => n.User)
                    .HasForeignKey(n => n.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(u => u.AuditLogs)
                    .WithOne(a => a.User)
                    .HasForeignKey(a => a.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(u => u.DashboardStats)
                    .WithOne(d => d.User)
                    .HasForeignKey<DashboardStats>(d => d.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // ============================================
            // USER OTP CONFIGURATION
            // ============================================
            // In ApplicationDbContext.cs, update UserOtp configuration
            // In ApplicationDbContext.cs - Update UserOtp configuration

            modelBuilder.Entity<UserOtp>(entity =>
            {
                // Use OtpId as primary key
                entity.HasKey(e => e.OtpId);

                entity.Property(e => e.OtpId)
                    .ValueGeneratedOnAdd();

                entity.Property(e => e.MobileNumber)
                    .IsRequired()
                    .HasMaxLength(10);

                entity.Property(e => e.OtpCode)
                    .IsRequired()
                    .HasMaxLength(6);

                entity.Property(e => e.Role)
                    .IsRequired()
                    .HasMaxLength(20);

                entity.Property(e => e.ExpiryTime)
                    .IsRequired()
                    .HasColumnType("datetime");

                // Index for fast lookups
                entity.HasIndex(e => e.MobileNumber);
                entity.HasIndex(e => e.ExpiryTime);
            });

            // ============================================
            // PROJECT CONFIGURATION
            // ============================================
            modelBuilder.Entity<Project>(entity =>
            {
                entity.HasKey(p => p.ProjectId);

                entity.Property(p => p.ProjectName)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(p => p.ProjectAddress)
                    .HasMaxLength(255);

                entity.Property(p => p.CreatedAt)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("GETDATE()");

                entity.Property(p => p.LastModifiedAt)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("GETDATE()");

                entity.Property(p => p.IsActive)
                    .HasDefaultValue(true);

                // Index for user's projects
                entity.HasIndex(p => new { p.UserId, p.IsActive });

                // Navigation properties
                entity.HasMany(p => p.Workers)
                    .WithOne(w => w.Project)
                    .HasForeignKey(w => w.ProjectId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // ============================================
            // WORKER CONFIGURATION
            // ============================================
            modelBuilder.Entity<Worker>(entity =>
            {
                entity.HasKey(w => w.WorkerId);

                entity.Property(w => w.FullName)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(w => w.MobileNumber)
                    .HasMaxLength(10);

                entity.Property(w => w.JoiningDate)
                    .IsRequired()
                    .HasColumnType("date");

                entity.Property(w => w.DailyWage)
                    .IsRequired()
                    .HasColumnType("decimal(10,2)")
                    .HasDefaultValue(400);

                entity.Property(w => w.Role)
                    .HasMaxLength(50)
                    .HasDefaultValue("Worker");

                entity.Property(w => w.Advance)
                    .HasColumnType("decimal(10,2)")
                    .HasDefaultValue(0);

                entity.Property(w => w.Bonus)
                    .HasColumnType("decimal(10,2)")
                    .HasDefaultValue(0);

                entity.Property(w => w.CreatedAt)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("GETDATE()");

                entity.Property(w => w.LastUpdatedAt)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("GETDATE()");

                entity.Property(w => w.IsActive)
                    .HasDefaultValue(true);

                // Indexes for performance
                entity.HasIndex(w => w.ProjectId);
                entity.HasIndex(w => w.FullName);
                entity.HasIndex(w => new { w.ProjectId, w.IsActive });

                // Navigation properties
                entity.HasMany(w => w.Attendances)
                    .WithOne(a => a.Worker)
                    .HasForeignKey(a => a.WorkerId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(w => w.WageOverrides)
                    .WithOne(o => o.Worker)
                    .HasForeignKey(o => o.WorkerId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(w => w.Payments)
                    .WithOne(p => p.Worker)
                    .HasForeignKey(p => p.WorkerId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(w => w.Advances)
                    .WithOne(a => a.Worker)
                    .HasForeignKey(a => a.WorkerId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(w => w.Bonuses)
                    .WithOne(b => b.Worker)
                    .HasForeignKey(b => b.WorkerId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(w => w.MonthlyStatements)
                    .WithOne(m => m.Worker)
                    .HasForeignKey(m => m.WorkerId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // ============================================
            // WORKER ATTENDANCE CONFIGURATION
            // ============================================
            modelBuilder.Entity<WorkerAttendance>(entity =>
            {
                entity.HasKey(a => a.AttendanceId);

                entity.Property(a => a.AttendanceDate)
                    .IsRequired()
                    .HasColumnType("date");

                entity.Property(a => a.Status)
                    .IsRequired()
                    .HasMaxLength(2);

                entity.Property(a => a.DailyRate)
                    .IsRequired()
                    .HasColumnType("decimal(10,2)");

                entity.Property(a => a.NetAmount)
                    .IsRequired()
                    .HasColumnType("decimal(10,2)");

                entity.Property(a => a.CreatedAt)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("GETDATE()");

                entity.Property(a => a.UpdatedAt)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("GETDATE()");

                // Unique constraint: One attendance per worker per day
                entity.HasIndex(a => new { a.WorkerId, a.AttendanceDate })
                    .IsUnique();

                // Index for date range queries
                entity.HasIndex(a => a.AttendanceDate);
            });

            // ============================================
            // WORKER WAGE OVERRIDE CONFIGURATION
            // ============================================
            modelBuilder.Entity<WorkerWageOverride>(entity =>
            {
                entity.HasKey(o => o.OverrideId);

                entity.Property(o => o.EffectiveFrom)
                    .HasColumnType("date");

                entity.Property(o => o.EffectiveTo)
                    .HasColumnType("date");

                entity.Property(o => o.DailyWageAmount)
                    .IsRequired()
                    .HasColumnType("decimal(10,2)");

                entity.Property(o => o.Note)
                    .HasMaxLength(255);

                entity.Property(o => o.CreatedAt)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("GETDATE()");

                entity.Property(o => o.UpdatedAt)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("GETDATE()");

                // Index for date range queries
                entity.HasIndex(o => new { o.WorkerId, o.EffectiveFrom, o.EffectiveTo });
            });

            // ============================================
            // WORKER PAYMENT CONFIGURATION
            // ============================================
            modelBuilder.Entity<WorkerPayment>(entity =>
            {
                entity.HasKey(p => p.PaymentId);

                entity.Property(p => p.PaymentDate)
                    .IsRequired()
                    .HasColumnType("date");

                entity.Property(p => p.Amount)
                    .IsRequired()
                    .HasColumnType("decimal(10,2)");

                entity.Property(p => p.PaymentMethod)
                    .HasMaxLength(20)
                    .HasDefaultValue("Cash");

                entity.Property(p => p.Note)
                    .HasMaxLength(255);

                entity.Property(p => p.CreatedAt)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("GETDATE()");

                entity.Property(p => p.UpdatedAt)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("GETDATE()");

                // Indexes
                entity.HasIndex(p => new { p.WorkerId, p.PaymentDate });
                entity.HasIndex(p => p.PaymentDate);
            });

            // ============================================
            // WORKER ADVANCE CONFIGURATION
            // ============================================
            modelBuilder.Entity<WorkerAdvance>(entity =>
            {
                entity.HasKey(a => a.AdvanceId);

                entity.Property(a => a.AdvanceDate)
                    .IsRequired()
                    .HasColumnType("date");

                entity.Property(a => a.Amount)
                    .IsRequired()
                    .HasColumnType("decimal(10,2)");

                entity.Property(a => a.PaymentMethod)
                    .HasMaxLength(20)
                    .HasDefaultValue("Cash");

                entity.Property(a => a.Note)
                    .HasMaxLength(255);

                entity.Property(a => a.CreatedAt)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("GETDATE()");

                entity.Property(a => a.UpdatedAt)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("GETDATE()");

                // Indexes
                entity.HasIndex(a => new { a.WorkerId, a.AdvanceDate });
                entity.HasIndex(a => a.AdvanceDate);
            });

            // ============================================
            // WORKER BONUS CONFIGURATION
            // ============================================
            modelBuilder.Entity<WorkerBonus>(entity =>
            {
                entity.HasKey(b => b.BonusId);

                entity.Property(b => b.BonusDate)
                    .IsRequired()
                    .HasColumnType("date");

                entity.Property(b => b.Amount)
                    .IsRequired()
                    .HasColumnType("decimal(10,2)");

                entity.Property(b => b.PaymentMethod)
                    .HasMaxLength(20)
                    .HasDefaultValue("Cash");

                entity.Property(b => b.Note)
                    .HasMaxLength(255);

                entity.Property(b => b.CreatedAt)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("GETDATE()");

                entity.Property(b => b.UpdatedAt)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("GETDATE()");

                // Indexes
                entity.HasIndex(b => new { b.WorkerId, b.BonusDate });
                entity.HasIndex(b => b.BonusDate);
            });

            // ============================================
            // WORKER MONTHLY STATEMENT CONFIGURATION
            // ============================================
            modelBuilder.Entity<WorkerMonthlyStatement>(entity =>
            {
                entity.HasKey(m => m.StatementId);

                entity.Property(m => m.Month)
                    .IsRequired();

                entity.Property(m => m.Year)
                    .IsRequired();

                entity.Property(m => m.TotalWages)
                    .HasColumnType("decimal(18,2)")
                    .HasDefaultValue(0);

                entity.Property(m => m.TotalAdvances)
                    .HasColumnType("decimal(18,2)")
                    .HasDefaultValue(0);

                entity.Property(m => m.TotalBonuses)
                    .HasColumnType("decimal(18,2)")
                    .HasDefaultValue(0);

                entity.Property(m => m.TotalPayments)
                    .HasColumnType("decimal(18,2)")
                    .HasDefaultValue(0);

                entity.Property(m => m.Balance)
                    .HasColumnType("decimal(18,2)")
                    .HasDefaultValue(0);

                entity.Property(m => m.CalculatedAt)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("GETDATE()");

                // Unique constraint: One statement per worker per month
                entity.HasIndex(m => new { m.WorkerId, m.Month, m.Year })
                    .IsUnique();
            });

            // ============================================
            // SUBSCRIPTION CONFIGURATION
            // ============================================
            modelBuilder.Entity<Subscription>(entity =>
            {
                entity.HasKey(s => s.SubscriptionId);

                entity.Property(s => s.PlanType)
                    .IsRequired()
                    .HasMaxLength(20)
                    .HasDefaultValue("free");

                entity.Property(s => s.StartDate)
                    .IsRequired()
                    .HasColumnType("date");

                entity.Property(s => s.EndDate)
                    .HasColumnType("date");

                entity.Property(s => s.PricePaid)
                    .HasColumnType("decimal(10,2)");

                entity.Property(s => s.PaymentMethod)
                    .HasMaxLength(50);

                entity.Property(s => s.Note)
                    .HasMaxLength(255);

                entity.Property(s => s.IsActive)
                    .HasDefaultValue(true);

                entity.Property(s => s.CreatedAt)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("GETDATE()");

                entity.Property(s => s.UpdatedAt)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("GETDATE()");

                // Indexes
                entity.HasIndex(s => new { s.UserId, s.IsActive });
                entity.HasIndex(s => s.PlanType);
            });

            // ============================================
            // NOTIFICATION CONFIGURATION
            // ============================================
            modelBuilder.Entity<Notification>(entity =>
            {
                entity.HasKey(n => n.NotificationId);

                entity.Property(n => n.Title)
                    .IsRequired()
                    .HasMaxLength(255);

                entity.Property(n => n.Message)
                    .IsRequired()
                    .HasMaxLength(1000);

                entity.Property(n => n.Type)
                    .HasMaxLength(50);

                entity.Property(n => n.IsRead)
                    .HasDefaultValue(false);

                entity.Property(n => n.CreatedAt)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("GETDATE()");

                entity.Property(n => n.ReadAt)
                    .HasColumnType("datetime");

                // Indexes
                entity.HasIndex(n => new { n.UserId, n.IsRead, n.CreatedAt });
                entity.HasIndex(n => n.CreatedAt);
            });

            // ============================================
            // AUDIT LOG CONFIGURATION
            // ============================================
            modelBuilder.Entity<AuditLog>(entity =>
            {
                entity.HasKey(a => a.LogId);

                entity.Property(a => a.Action)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(a => a.EntityName)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(a => a.EntityId)
                    .IsRequired();

                entity.Property(a => a.Details)
                    .HasMaxLength(500);

                entity.Property(a => a.IpAddress)
                    .HasMaxLength(50);

                entity.Property(a => a.CreatedAt)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("GETDATE()");

                // Indexes
                entity.HasIndex(a => new { a.UserId, a.EntityName, a.CreatedAt });
                entity.HasIndex(a => a.CreatedAt);
            });

            // ============================================
            // DASHBOARD STATS CONFIGURATION
            // ============================================
            modelBuilder.Entity<DashboardStats>(entity =>
            {
                entity.HasKey(d => d.StatsId);

                entity.Property(d => d.TotalProjects)
                    .HasDefaultValue(0);

                entity.Property(d => d.TotalWorkers)
                    .HasDefaultValue(0);

                entity.Property(d => d.PresentToday)
                    .HasDefaultValue(0);

                entity.Property(d => d.TotalDue)
                    .HasColumnType("decimal(18,2)")
                    .HasDefaultValue(0);

                entity.Property(d => d.CalculatedAt)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("GETDATE()");

                // Unique constraint: One stats per user
                entity.HasIndex(d => d.UserId)
                    .IsUnique();
            });

            // ============================================
            // ATTENDANCE RECORD (Legacy) CONFIGURATION
            // ============================================
            modelBuilder.Entity<AttendanceRecord>(entity =>
            {
                entity.HasKey(a => a.AttendanceRecordId);

                entity.Property(a => a.AttendanceDate)
                    .IsRequired()
                    .HasColumnType("date");

                entity.Property(a => a.DailyRate)
                    .HasColumnType("decimal(18,2)")
                    .HasDefaultValue(0);

                entity.Property(a => a.OvertimeHours)
                    .HasColumnType("decimal(18,2)")
                    .HasDefaultValue(0);

                entity.Property(a => a.TotalHoursWorked)
                    .HasColumnType("decimal(18,2)")
                    .HasDefaultValue(0);

                entity.Property(a => a.OvertimeRate)
                    .HasColumnType("decimal(18,2)")
                    .HasDefaultValue(0);

                entity.Property(a => a.Bonus)
                    .HasColumnType("decimal(18,2)")
                    .HasDefaultValue(0);

                entity.Property(a => a.Deduction)
                    .HasColumnType("decimal(18,2)")
                    .HasDefaultValue(0);

                entity.Property(a => a.Remarks)
                    .HasMaxLength(255);

                // Indexes
                entity.HasIndex(a => new { a.UserId, a.AttendanceDate })
                    .IsUnique();

                entity.HasOne(a => a.User)
                    .WithMany(u => u.AttendanceRecords)
                    .HasForeignKey(a => a.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // ============================================
            // PAYMENT (Legacy) CONFIGURATION
            // ============================================
            modelBuilder.Entity<Payment>(entity =>
            {
                entity.HasKey(p => p.PaymentId);

                entity.Property(p => p.Month)
                    .IsRequired();

                entity.Property(p => p.Year)
                    .IsRequired();

                entity.Property(p => p.PresentDays)
                    .HasDefaultValue(0);

                entity.Property(p => p.HalfDays)
                    .HasDefaultValue(0);

                entity.Property(p => p.AbsentDays)
                    .HasDefaultValue(0);

                entity.Property(p => p.TotalHoursWorked)
                    .HasColumnType("decimal(18,2)")
                    .HasDefaultValue(0);

                entity.Property(p => p.OvertimeHours)
                    .HasColumnType("decimal(18,2)")
                    .HasDefaultValue(0);

                entity.Property(p => p.DailyRate)
                    .HasColumnType("decimal(18,2)")
                    .HasDefaultValue(0);

                entity.Property(p => p.OvertimeRate)
                    .HasColumnType("decimal(18,2)")
                    .HasDefaultValue(0);

                entity.Property(p => p.GrossAmount)
                    .HasColumnType("decimal(18,2)")
                    .HasDefaultValue(0);

                entity.Property(p => p.Bonus)
                    .HasColumnType("decimal(18,2)")
                    .HasDefaultValue(0);

                entity.Property(p => p.Deduction)
                    .HasColumnType("decimal(18,2)")
                    .HasDefaultValue(0);

                entity.Property(p => p.AdvancePaid)
                    .HasColumnType("decimal(18,2)")
                    .HasDefaultValue(0);

                entity.Property(p => p.NetAmount)
                    .HasColumnType("decimal(18,2)")
                    .HasDefaultValue(0);

                entity.Property(p => p.PaymentDate)
                    .HasColumnType("datetime");

                entity.Property(p => p.PaymentStatus)
                    .HasDefaultValue(PaymentStatus.Pending);

                entity.Property(p => p.PaymentMode)
                    .HasDefaultValue(PaymentMode.Cash);

                entity.Property(p => p.TransactionReference)
                    .HasMaxLength(100);

                entity.Property(p => p.Remarks)
                    .HasMaxLength(255);

                entity.Property(p => p.CreatedOn)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("GETDATE()");

                entity.Property(p => p.UpdatedOn)
                    .HasColumnType("datetime");

                // Unique constraint: One payment per user per month
                entity.HasIndex(p => new { p.UserId, p.Month, p.Year })
                    .IsUnique();

                entity.HasOne(p => p.User)
                    .WithMany(u => u.Payments)
                    .HasForeignKey(p => p.UserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }

        // ============================================
        // OVERRIDE SAVECHANGES FOR AUTO TIMESTAMPS
        // ============================================
        public override int SaveChanges()
        {
            UpdateTimestamps();
            return base.SaveChanges();
        }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            UpdateTimestamps();
            return await base.SaveChangesAsync(cancellationToken);
        }

        private void UpdateTimestamps()
        {
            var entries = ChangeTracker.Entries()
                .Where(e => e.Entity is Worker ||
                           e.Entity is WorkerAttendance ||
                           e.Entity is WorkerWageOverride ||
                           e.Entity is WorkerPayment ||
                           e.Entity is WorkerAdvance ||
                           e.Entity is WorkerBonus ||
                           e.Entity is WorkerMonthlyStatement ||
                           e.Entity is Subscription ||
                           e.Entity is Notification ||
                           e.Entity is Project);

            foreach (var entry in entries)
            {
                if (entry.State == EntityState.Added)
                {
                    var createdAtProp = entry.Property("CreatedAt");
                    if (createdAtProp != null && (createdAtProp.CurrentValue == null || (DateTime)createdAtProp.CurrentValue == DateTime.MinValue))
                    {
                        createdAtProp.CurrentValue = DateTime.Now;
                    }
                }

                if (entry.State == EntityState.Added || entry.State == EntityState.Modified)
                {
                    var updatedAtProp = entry.Property("UpdatedAt");
                    if (updatedAtProp != null)
                    {
                        updatedAtProp.CurrentValue = DateTime.Now;
                    }
                }

                // Special handling for Project LastModifiedAt
                if (entry.Entity is Project project && entry.State == EntityState.Modified)
                {
                    project.LastModifiedAt = DateTime.Now;
                }

                // Special handling for Worker LastUpdatedAt
                if (entry.Entity is Worker worker && entry.State == EntityState.Modified)
                {
                    worker.LastUpdatedAt = DateTime.Now;
                }
            }
        }
    }
}