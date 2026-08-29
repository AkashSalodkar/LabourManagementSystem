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

        // Existing DbSets
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
        public DbSet<WorkerInactivePeriod> WorkerInactivePeriods { get; set; }
        public DbSet<Subscription> Subscriptions { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<DashboardStats> DashboardStats { get; set; }

        // New Quotation Module DbSets
        public DbSet<BusinessInfo> BusinessInfos { get; set; }
        public DbSet<Customer> Customers { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<QuotationSetting> QuotationSettings { get; set; }
        public DbSet<InvoiceSetting> InvoiceSettings { get; set; }
        public DbSet<PurchaseOrderSetting> PurchaseOrderSettings { get; set; }
        public DbSet<ProformaInvoiceSetting> ProformaInvoiceSettings { get; set; }
        public DbSet<DeliveryNoteSetting> DeliveryNoteSettings { get; set; }
        public DbSet<ReceiptSetting> ReceiptSettings { get; set; }
        public DbSet<ColumnHeadingSetting> ColumnHeadingSettings { get; set; }
        public DbSet<DocumentTerm> DocumentTerms { get; set; }
        public DbSet<DocumentProduct> DocumentProducts { get; set; }
        public DbSet<DocumentOtherCharge> DocumentOtherCharges { get; set; }
        public DbSet<DocumentPaidInfo> DocumentPaidInfos { get; set; }
        public DbSet<DocumentTermSelection> DocumentTermSelections { get; set; }
        public DbSet<Quotation> Quotations { get; set; }
        public DbSet<Invoice> Invoices { get; set; }
        public DbSet<PurchaseOrder> PurchaseOrders { get; set; }
        public DbSet<ProformaInvoice> ProformaInvoices { get; set; }
        public DbSet<DeliveryNote> DeliveryNotes { get; set; }
        public DbSet<Receipt> Receipts { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ============================================================
            // EXISTING CONFIGURATIONS (Keep your existing ones)
            // ============================================================

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
                entity.Property(e => e.IsCurrentlyActive).HasDefaultValue(true);
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

            // WorkerInactivePeriod Configuration
            modelBuilder.Entity<WorkerInactivePeriod>(entity =>
            {
                entity.HasKey(e => e.InactivePeriodId);
                entity.Property(e => e.DeactivatedOn).HasColumnType("date");
                entity.Property(e => e.ReactivatedOn).HasColumnType("date");
                entity.HasOne(e => e.Worker)
                    .WithMany(w => w.InactivePeriods)
                    .HasForeignKey(e => e.WorkerId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasIndex(e => new { e.WorkerId, e.DeactivatedOn });
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

            // ============================================================
            // NEW QUOTATION MODULE CONFIGURATIONS
            // ============================================================

            // ============================================================
            // 1. BusinessInfo - One-to-One with User
            // ============================================================
            modelBuilder.Entity<BusinessInfo>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.BusinessName).HasMaxLength(100);
                entity.Property(e => e.ContactName).HasMaxLength(100);
                entity.Property(e => e.Email).HasMaxLength(100);
                entity.Property(e => e.Phone).HasMaxLength(15);
                entity.Property(e => e.AddressLine1).HasMaxLength(200);
                entity.Property(e => e.AddressLine2).HasMaxLength(200);
                entity.Property(e => e.City).HasMaxLength(100);
                entity.Property(e => e.BusinessCategory).HasMaxLength(100);
                entity.Property(e => e.TaxLabel).HasMaxLength(20);
                entity.Property(e => e.TaxNumber).HasMaxLength(50);
                entity.Property(e => e.State).HasMaxLength(50);
                entity.Property(e => e.BankAccountName).HasMaxLength(100);
                entity.Property(e => e.BankAccountNumber).HasMaxLength(50);
                entity.Property(e => e.BankName).HasMaxLength(100);
                entity.Property(e => e.IfscCode).HasMaxLength(20);
                entity.Property(e => e.UpiId).HasMaxLength(100);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETDATE()");

                // FIX: Use Restrict instead of Cascade
                entity.HasOne(e => e.User)
                    .WithOne()
                    .HasForeignKey<BusinessInfo>(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(e => e.UserId).IsUnique();
            });

            // ============================================================
            // 2. Customer - One-to-Many with User (NO CASCADE)
            // ============================================================
            modelBuilder.Entity<Customer>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.CompanyName).HasMaxLength(100);
                entity.Property(e => e.Email).HasMaxLength(100);
                entity.Property(e => e.Mobile).HasMaxLength(10);
                entity.Property(e => e.AddressLine1).HasMaxLength(200);
                entity.Property(e => e.AddressLine2).HasMaxLength(200);
                entity.Property(e => e.City).HasMaxLength(100);
                entity.Property(e => e.Gstin).HasMaxLength(50);
                entity.Property(e => e.State).HasMaxLength(50);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETDATE()");

                // FIX: Use Restrict instead of Cascade
                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.Name);
            });

            // ============================================================
            // 3. Product - One-to-Many with User (NO CASCADE)
            // ============================================================
            modelBuilder.Entity<Product>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Price).HasColumnType("decimal(18,2)");
                entity.Property(e => e.Gst).HasColumnType("decimal(5,2)");
                entity.Property(e => e.Unit).HasMaxLength(20);
                entity.Property(e => e.Hsn).HasMaxLength(20);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETDATE()");

                // FIX: Use Restrict instead of Cascade
                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.Name);
            });

            // ============================================================
            // 4. Document Settings - One-to-One with User (NO CASCADE)
            // ============================================================

            // QuotationSetting
            modelBuilder.Entity<QuotationSetting>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.NumberPrefix).HasMaxLength(20);
                entity.Property(e => e.SerialNumber).HasMaxLength(10);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETDATE()");

                // FIX: Use Restrict instead of Cascade
                entity.HasOne(e => e.User)
                    .WithOne()
                    .HasForeignKey<QuotationSetting>(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(e => e.UserId).IsUnique();
            });

            // InvoiceSetting
            modelBuilder.Entity<InvoiceSetting>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.NumberPrefix).HasMaxLength(20);
                entity.Property(e => e.SerialNumber).HasMaxLength(10);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETDATE()");

                // FIX: Use Restrict instead of Cascade
                entity.HasOne(e => e.User)
                    .WithOne()
                    .HasForeignKey<InvoiceSetting>(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(e => e.UserId).IsUnique();
            });

            // PurchaseOrderSetting
            modelBuilder.Entity<PurchaseOrderSetting>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.NumberPrefix).HasMaxLength(20);
                entity.Property(e => e.SerialNumber).HasMaxLength(10);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETDATE()");

                // FIX: Use Restrict instead of Cascade
                entity.HasOne(e => e.User)
                    .WithOne()
                    .HasForeignKey<PurchaseOrderSetting>(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(e => e.UserId).IsUnique();
            });

            // ProformaInvoiceSetting
            modelBuilder.Entity<ProformaInvoiceSetting>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.NumberPrefix).HasMaxLength(20);
                entity.Property(e => e.SerialNumber).HasMaxLength(10);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETDATE()");

                // FIX: Use Restrict instead of Cascade
                entity.HasOne(e => e.User)
                    .WithOne()
                    .HasForeignKey<ProformaInvoiceSetting>(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(e => e.UserId).IsUnique();
            });

            // DeliveryNoteSetting
            modelBuilder.Entity<DeliveryNoteSetting>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.NumberPrefix).HasMaxLength(20);
                entity.Property(e => e.SerialNumber).HasMaxLength(10);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETDATE()");

                // FIX: Use Restrict instead of Cascade
                entity.HasOne(e => e.User)
                    .WithOne()
                    .HasForeignKey<DeliveryNoteSetting>(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(e => e.UserId).IsUnique();
            });

            // ReceiptSetting
            modelBuilder.Entity<ReceiptSetting>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.NumberPrefix).HasMaxLength(20);
                entity.Property(e => e.SerialNumber).HasMaxLength(10);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETDATE()");

                // FIX: Use Restrict instead of Cascade
                entity.HasOne(e => e.User)
                    .WithOne()
                    .HasForeignKey<ReceiptSetting>(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(e => e.UserId).IsUnique();
            });

            // ColumnHeadingSetting
            modelBuilder.Entity<ColumnHeadingSetting>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETDATE()");

                // FIX: Use Restrict instead of Cascade
                entity.HasOne(e => e.User)
                    .WithOne()
                    .HasForeignKey<ColumnHeadingSetting>(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(e => e.UserId).IsUnique();
            });

            // ============================================================
            // 5. Document Terms - One-to-Many with User (NO CASCADE)
            // ============================================================
            modelBuilder.Entity<DocumentTerm>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.DocumentType).IsRequired().HasMaxLength(20);
                entity.Property(e => e.Text).IsRequired();
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETDATE()");

                // FIX: Use Restrict instead of Cascade
                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(e => new { e.UserId, e.DocumentType });
            });

            // ============================================================
            // 6. Document Products - No User relationship, only Document
            // ============================================================
            modelBuilder.Entity<DocumentProduct>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.DocumentType).IsRequired().HasMaxLength(20);
                entity.Property(e => e.ProductName).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Price).HasColumnType("decimal(18,2)");
                entity.Property(e => e.Gst).HasColumnType("decimal(5,2)");
                entity.Property(e => e.Qty).HasColumnType("decimal(18,2)");
                entity.Property(e => e.Unit).HasMaxLength(20);
                entity.Property(e => e.Hsn).HasMaxLength(20);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETDATE()");

                // Product reference (optional, can be deleted without affecting documents)
                entity.HasOne(e => e.Product)
                    .WithMany()
                    .HasForeignKey(e => e.ProductId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasIndex(e => new { e.DocumentType, e.DocumentId });
                entity.HasIndex(e => e.ProductId);
            });

            // ============================================================
            // 7. Document Other Charges - No User relationship
            // ============================================================
            modelBuilder.Entity<DocumentOtherCharge>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.DocumentType).IsRequired().HasMaxLength(20);
                entity.Property(e => e.Label).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Amount).HasColumnType("decimal(18,2)");
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETDATE()");

                entity.HasIndex(e => new { e.DocumentType, e.DocumentId });
            });

            // ============================================================
            // 8. Document Paid Info - No User relationship
            // ============================================================
            modelBuilder.Entity<DocumentPaidInfo>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.DocumentType).IsRequired().HasMaxLength(20);
                entity.Property(e => e.Date).HasColumnType("date");
                entity.Property(e => e.Amount).HasColumnType("decimal(18,2)");
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETDATE()");

                entity.HasIndex(e => new { e.DocumentType, e.DocumentId });
            });

            // ============================================================
            // 9. Document Term Selections - No User relationship
            // ============================================================
            modelBuilder.Entity<DocumentTermSelection>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.DocumentType).IsRequired().HasMaxLength(20);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETDATE()");

                // Many-to-One with DocumentTerm
                entity.HasOne(e => e.Term)
                    .WithMany()
                    .HasForeignKey(e => e.TermId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(e => new { e.DocumentType, e.DocumentId, e.TermId }).IsUnique();
            });

            // ============================================================
            // 10-15. DOCUMENTS (Quotation, Invoice, PurchaseOrder, etc.)
            // ============================================================

            // ============================================================
            // QUOTATIONS - NO CASCADE ON USER, CASCADE ON CHILDREN
            // ============================================================
            modelBuilder.Entity<Quotation>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.QuotationNo).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Date).HasColumnType("date");
                entity.Property(e => e.GrandTotal).HasColumnType("decimal(18,2)");
                entity.Property(e => e.Status).HasMaxLength(20);
                entity.Property(e => e.CustomerName).HasMaxLength(100);
                entity.Property(e => e.CustomerCompany).HasMaxLength(100);
                entity.Property(e => e.CustomerMobile).HasMaxLength(10);
                entity.Property(e => e.CustomerEmail).HasMaxLength(100);
                entity.Property(e => e.CustomerAddressLine1).HasMaxLength(200);
                entity.Property(e => e.CustomerAddressLine2).HasMaxLength(200);
                entity.Property(e => e.CustomerAddressLine3).HasMaxLength(100);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETDATE()");

                // FIX: Use Restrict instead of Cascade on User
                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                // FIX: Use Restrict instead of SetNull on Customer
                entity.HasOne(e => e.Customer)
                    .WithMany()
                    .HasForeignKey(e => e.CustomerId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.CustomerId);
                entity.HasIndex(e => e.QuotationNo);
                entity.HasIndex(e => e.Date);
                entity.HasIndex(e => e.Status);
            });

            // ============================================================
            // INVOICES
            // ============================================================
            modelBuilder.Entity<Invoice>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.InvoiceNo).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Date).HasColumnType("date");
                entity.Property(e => e.DueDate).HasColumnType("date");
                entity.Property(e => e.PoNo).HasMaxLength(50);
                entity.Property(e => e.GrandTotal).HasColumnType("decimal(18,2)");
                entity.Property(e => e.PaidTotal).HasColumnType("decimal(18,2)");
                entity.Property(e => e.BalanceDue).HasColumnType("decimal(18,2)");
                entity.Property(e => e.Status).HasMaxLength(20);
                entity.Property(e => e.CustomerName).HasMaxLength(100);
                entity.Property(e => e.CustomerCompany).HasMaxLength(100);
                entity.Property(e => e.CustomerMobile).HasMaxLength(10);
                entity.Property(e => e.CustomerEmail).HasMaxLength(100);
                entity.Property(e => e.CustomerAddressLine1).HasMaxLength(200);
                entity.Property(e => e.CustomerAddressLine2).HasMaxLength(200);
                entity.Property(e => e.CustomerAddressLine3).HasMaxLength(100);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETDATE()");

                // FIX: Use Restrict instead of Cascade on User
                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                // FIX: Use Restrict instead of SetNull on Customer
                entity.HasOne(e => e.Customer)
                    .WithMany()
                    .HasForeignKey(e => e.CustomerId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.CustomerId);
                entity.HasIndex(e => e.InvoiceNo);
                entity.HasIndex(e => e.Date);
                entity.HasIndex(e => e.Status);
            });

            // ============================================================
            // PURCHASE ORDERS
            // ============================================================
            modelBuilder.Entity<PurchaseOrder>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.PurchaseOrderNo).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Date).HasColumnType("date");
                entity.Property(e => e.GrandTotal).HasColumnType("decimal(18,2)");
                entity.Property(e => e.Status).HasMaxLength(20);
                entity.Property(e => e.CustomerName).HasMaxLength(100);
                entity.Property(e => e.CustomerCompany).HasMaxLength(100);
                entity.Property(e => e.CustomerMobile).HasMaxLength(10);
                entity.Property(e => e.CustomerEmail).HasMaxLength(100);
                entity.Property(e => e.CustomerAddressLine1).HasMaxLength(200);
                entity.Property(e => e.CustomerAddressLine2).HasMaxLength(200);
                entity.Property(e => e.CustomerAddressLine3).HasMaxLength(100);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETDATE()");

                // FIX: Use Restrict instead of Cascade on User
                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                // FIX: Use Restrict instead of SetNull on Customer
                entity.HasOne(e => e.Customer)
                    .WithMany()
                    .HasForeignKey(e => e.CustomerId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.CustomerId);
                entity.HasIndex(e => e.PurchaseOrderNo);
                entity.HasIndex(e => e.Date);
                entity.HasIndex(e => e.Status);
            });

            // ============================================================
            // PROFORMA INVOICES
            // ============================================================
            modelBuilder.Entity<ProformaInvoice>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.ProformaInvoiceNo).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Date).HasColumnType("date");
                entity.Property(e => e.DueDate).HasColumnType("date");
                entity.Property(e => e.PoNo).HasMaxLength(50);
                entity.Property(e => e.GrandTotal).HasColumnType("decimal(18,2)");
                entity.Property(e => e.PaidTotal).HasColumnType("decimal(18,2)");
                entity.Property(e => e.BalanceDue).HasColumnType("decimal(18,2)");
                entity.Property(e => e.Status).HasMaxLength(20);
                entity.Property(e => e.CustomerName).HasMaxLength(100);
                entity.Property(e => e.CustomerCompany).HasMaxLength(100);
                entity.Property(e => e.CustomerMobile).HasMaxLength(10);
                entity.Property(e => e.CustomerEmail).HasMaxLength(100);
                entity.Property(e => e.CustomerAddressLine1).HasMaxLength(200);
                entity.Property(e => e.CustomerAddressLine2).HasMaxLength(200);
                entity.Property(e => e.CustomerAddressLine3).HasMaxLength(100);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETDATE()");

                // FIX: Use Restrict instead of Cascade on User
                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                // FIX: Use Restrict instead of SetNull on Customer
                entity.HasOne(e => e.Customer)
                    .WithMany()
                    .HasForeignKey(e => e.CustomerId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.CustomerId);
                entity.HasIndex(e => e.ProformaInvoiceNo);
                entity.HasIndex(e => e.Date);
                entity.HasIndex(e => e.Status);
            });

            // ============================================================
            // DELIVERY NOTES
            // ============================================================
            modelBuilder.Entity<DeliveryNote>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.DeliveryNoteNo).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Date).HasColumnType("date");
                entity.Property(e => e.RefNo).HasMaxLength(50);
                entity.Property(e => e.Status).HasMaxLength(20);
                entity.Property(e => e.CustomerName).HasMaxLength(100);
                entity.Property(e => e.CustomerCompany).HasMaxLength(100);
                entity.Property(e => e.CustomerMobile).HasMaxLength(10);
                entity.Property(e => e.CustomerEmail).HasMaxLength(100);
                entity.Property(e => e.CustomerAddressLine1).HasMaxLength(200);
                entity.Property(e => e.CustomerAddressLine2).HasMaxLength(200);
                entity.Property(e => e.CustomerAddressLine3).HasMaxLength(100);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETDATE()");

                // FIX: Use Restrict instead of Cascade on User
                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                // FIX: Use Restrict instead of SetNull on Customer
                entity.HasOne(e => e.Customer)
                    .WithMany()
                    .HasForeignKey(e => e.CustomerId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.CustomerId);
                entity.HasIndex(e => e.DeliveryNoteNo);
                entity.HasIndex(e => e.Date);
                entity.HasIndex(e => e.Status);
            });

            // ============================================================
            // RECEIPTS
            // ============================================================
            modelBuilder.Entity<Receipt>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.ReceiptNo).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Date).HasColumnType("date");
                entity.Property(e => e.PaymentMode).HasMaxLength(20);
                entity.Property(e => e.ReferenceNo).HasMaxLength(50);
                entity.Property(e => e.PaidAmount).HasColumnType("decimal(18,2)");
                entity.Property(e => e.Status).HasMaxLength(20);
                entity.Property(e => e.CustomerName).HasMaxLength(100);
                entity.Property(e => e.CustomerCompany).HasMaxLength(100);
                entity.Property(e => e.CustomerMobile).HasMaxLength(10);
                entity.Property(e => e.CustomerEmail).HasMaxLength(100);
                entity.Property(e => e.CustomerAddressLine1).HasMaxLength(200);
                entity.Property(e => e.CustomerAddressLine2).HasMaxLength(200);
                entity.Property(e => e.CustomerAddressLine3).HasMaxLength(100);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETDATE()");

                // FIX: Use Restrict instead of Cascade on User
                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                // FIX: Use Restrict instead of SetNull on Customer
                entity.HasOne(e => e.Customer)
                    .WithMany()
                    .HasForeignKey(e => e.CustomerId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.CustomerId);
                entity.HasIndex(e => e.ReceiptNo);
                entity.HasIndex(e => e.Date);
                entity.HasIndex(e => e.Status);
            });
        }
    }
}