using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LMPTS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCommerceModuleFixed : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BusinessInfos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    LogoImg = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SignatureImg = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    BusinessName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    ContactName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Phone = table.Column<string>(type: "nvarchar(15)", maxLength: 15, nullable: true),
                    AddressLine1 = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    AddressLine2 = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    City = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    OtherInfo = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    BusinessCategory = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    TaxLabel = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    TaxNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    State = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    BankAccountName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    BankAccountNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    BankName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    IfscCode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    UpiId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "GETDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "GETDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BusinessInfos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BusinessInfos_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ColumnHeadingSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    TaxLabel = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    HsnLabel = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    OtherChargesLabel = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ShowQty2Column = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "GETDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "GETDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ColumnHeadingSettings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ColumnHeadingSettings_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Customers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    CompanyName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Mobile = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    AddressLine1 = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    AddressLine2 = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    City = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    OtherInfo = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Gstin = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    State = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ShippingAddress = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    BillingAddress = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "GETDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "GETDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Customers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Customers_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "DeliveryNoteSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ShowProductHSN = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TopMessage = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BottomMessage = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ShowSignature = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    NumberPrefix = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    SerialNumber = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "GETDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "GETDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeliveryNoteSettings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DeliveryNoteSettings_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "DocumentTerms",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    DocumentType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Text = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "GETDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "GETDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DocumentTerms", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DocumentTerms_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "InvoiceSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DiscountType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TaxType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ShowProductHSN = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TopMessage = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BottomMessage = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ShowBankInfo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ShowUpiInfo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ShowSignature = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    NumberPrefix = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    SerialNumber = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "GETDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "GETDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InvoiceSettings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InvoiceSettings_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Products",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Price = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    Gst = table.Column<decimal>(type: "decimal(5,2)", nullable: true),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Unit = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Hsn = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "GETDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "GETDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Products", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Products_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ProformaInvoiceSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DiscountType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TaxType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ShowProductHSN = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TopMessage = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BottomMessage = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ShowBankInfo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ShowUpiInfo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ShowSignature = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    NumberPrefix = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    SerialNumber = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "GETDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "GETDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProformaInvoiceSettings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProformaInvoiceSettings_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PurchaseOrderSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DiscountType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TaxType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ShowProductHSN = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TopMessage = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BottomMessage = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ShowBankInfo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ShowUpiInfo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ShowSignature = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    NumberPrefix = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    SerialNumber = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "GETDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "GETDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PurchaseOrderSettings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PurchaseOrderSettings_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "QuotationSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DiscountType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TaxType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ShowProductHSN = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ShowShippingAddress = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TopMessage = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BottomMessage = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ShowBankInfo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ShowUpiInfo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ShowSignature = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    NumberPrefix = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    SerialNumber = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "GETDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "GETDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuotationSettings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QuotationSettings_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ReceiptSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ReceiptType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ShowSignature = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    NumberPrefix = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    SerialNumber = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "GETDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "GETDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReceiptSettings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReceiptSettings_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "DeliveryNotes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DeliveryNoteNo = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    RefNo = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Date = table.Column<DateTime>(type: "date", nullable: false),
                    OtherInfo = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CustomerId = table.Column<int>(type: "int", nullable: true),
                    CustomerName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CustomerCompany = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CustomerMobile = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    CustomerEmail = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CustomerAddressLine1 = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CustomerAddressLine2 = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CustomerAddressLine3 = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CustomerBillingAddress = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CustomerShippingAddress = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "GETDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "GETDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeliveryNotes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DeliveryNotes_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DeliveryNotes_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Invoices",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    InvoiceNo = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    DueDate = table.Column<DateTime>(type: "date", nullable: true),
                    PoNo = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    GrandTotal = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PaidTotal = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    BalanceDue = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Date = table.Column<DateTime>(type: "date", nullable: false),
                    OtherInfo = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CustomerId = table.Column<int>(type: "int", nullable: true),
                    CustomerName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CustomerCompany = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CustomerMobile = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    CustomerEmail = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CustomerAddressLine1 = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CustomerAddressLine2 = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CustomerAddressLine3 = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CustomerBillingAddress = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CustomerShippingAddress = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "GETDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "GETDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Invoices", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Invoices_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Invoices_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ProformaInvoices",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProformaInvoiceNo = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    DueDate = table.Column<DateTime>(type: "date", nullable: true),
                    PoNo = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    GrandTotal = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PaidTotal = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    BalanceDue = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Date = table.Column<DateTime>(type: "date", nullable: false),
                    OtherInfo = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CustomerId = table.Column<int>(type: "int", nullable: true),
                    CustomerName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CustomerCompany = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CustomerMobile = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    CustomerEmail = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CustomerAddressLine1 = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CustomerAddressLine2 = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CustomerAddressLine3 = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CustomerBillingAddress = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CustomerShippingAddress = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "GETDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "GETDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProformaInvoices", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProformaInvoices_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProformaInvoices_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PurchaseOrders",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PurchaseOrderNo = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    GrandTotal = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Date = table.Column<DateTime>(type: "date", nullable: false),
                    OtherInfo = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CustomerId = table.Column<int>(type: "int", nullable: true),
                    CustomerName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CustomerCompany = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CustomerMobile = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    CustomerEmail = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CustomerAddressLine1 = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CustomerAddressLine2 = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CustomerAddressLine3 = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CustomerBillingAddress = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CustomerShippingAddress = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "GETDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "GETDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PurchaseOrders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PurchaseOrders_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PurchaseOrders_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Quotations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    QuotationNo = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    GrandTotal = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Date = table.Column<DateTime>(type: "date", nullable: false),
                    OtherInfo = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CustomerId = table.Column<int>(type: "int", nullable: true),
                    CustomerName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CustomerCompany = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CustomerMobile = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    CustomerEmail = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CustomerAddressLine1 = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CustomerAddressLine2 = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CustomerAddressLine3 = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CustomerBillingAddress = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CustomerShippingAddress = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "GETDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "GETDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Quotations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Quotations_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Quotations_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Receipts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Date = table.Column<DateTime>(type: "date", nullable: false),
                    ReceiptNo = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CustomerId = table.Column<int>(type: "int", nullable: true),
                    PaymentMode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    ReferenceNo = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    PaidAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    PaymentFor = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CustomerName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CustomerCompany = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CustomerMobile = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    CustomerEmail = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CustomerAddressLine1 = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CustomerAddressLine2 = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CustomerAddressLine3 = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CustomerBillingAddress = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CustomerShippingAddress = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "GETDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "GETDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Receipts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Receipts_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Receipts_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "DocumentPaidInfos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DocumentType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    DocumentId = table.Column<int>(type: "int", nullable: false),
                    Date = table.Column<DateTime>(type: "date", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Note = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "GETDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "GETDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DocumentPaidInfos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DocumentPaidInfos_Invoices_DocumentId",
                        column: x => x.DocumentId,
                        principalTable: "Invoices",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DocumentPaidInfos_ProformaInvoices_DocumentId",
                        column: x => x.DocumentId,
                        principalTable: "ProformaInvoices",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DocumentOtherCharges",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DocumentType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    DocumentId = table.Column<int>(type: "int", nullable: false),
                    Label = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    IsTaxable = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "GETDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "GETDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DocumentOtherCharges", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DocumentOtherCharges_DeliveryNotes_DocumentId",
                        column: x => x.DocumentId,
                        principalTable: "DeliveryNotes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DocumentOtherCharges_Invoices_DocumentId",
                        column: x => x.DocumentId,
                        principalTable: "Invoices",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DocumentOtherCharges_ProformaInvoices_DocumentId",
                        column: x => x.DocumentId,
                        principalTable: "ProformaInvoices",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DocumentOtherCharges_PurchaseOrders_DocumentId",
                        column: x => x.DocumentId,
                        principalTable: "PurchaseOrders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DocumentOtherCharges_Quotations_DocumentId",
                        column: x => x.DocumentId,
                        principalTable: "Quotations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DocumentProducts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DocumentType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    DocumentId = table.Column<int>(type: "int", nullable: false),
                    ProductId = table.Column<int>(type: "int", nullable: true),
                    ProductName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Price = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Gst = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    Qty = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Unit = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Hsn = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "GETDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "GETDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DocumentProducts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DocumentProducts_DeliveryNotes_DocumentId",
                        column: x => x.DocumentId,
                        principalTable: "DeliveryNotes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DocumentProducts_Invoices_DocumentId",
                        column: x => x.DocumentId,
                        principalTable: "Invoices",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DocumentProducts_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_DocumentProducts_ProformaInvoices_DocumentId",
                        column: x => x.DocumentId,
                        principalTable: "ProformaInvoices",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DocumentProducts_PurchaseOrders_DocumentId",
                        column: x => x.DocumentId,
                        principalTable: "PurchaseOrders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DocumentProducts_Quotations_DocumentId",
                        column: x => x.DocumentId,
                        principalTable: "Quotations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DocumentTermSelections",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DocumentType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    DocumentId = table.Column<int>(type: "int", nullable: false),
                    TermId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "GETDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DocumentTermSelections", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DocumentTermSelections_DeliveryNotes_DocumentId",
                        column: x => x.DocumentId,
                        principalTable: "DeliveryNotes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DocumentTermSelections_DocumentTerms_TermId",
                        column: x => x.TermId,
                        principalTable: "DocumentTerms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DocumentTermSelections_Invoices_DocumentId",
                        column: x => x.DocumentId,
                        principalTable: "Invoices",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DocumentTermSelections_ProformaInvoices_DocumentId",
                        column: x => x.DocumentId,
                        principalTable: "ProformaInvoices",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DocumentTermSelections_PurchaseOrders_DocumentId",
                        column: x => x.DocumentId,
                        principalTable: "PurchaseOrders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DocumentTermSelections_Quotations_DocumentId",
                        column: x => x.DocumentId,
                        principalTable: "Quotations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BusinessInfos_UserId",
                table: "BusinessInfos",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ColumnHeadingSettings_UserId",
                table: "ColumnHeadingSettings",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Customers_Name",
                table: "Customers",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_Customers_UserId",
                table: "Customers",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryNotes_CustomerId",
                table: "DeliveryNotes",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryNotes_Date",
                table: "DeliveryNotes",
                column: "Date");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryNotes_DeliveryNoteNo",
                table: "DeliveryNotes",
                column: "DeliveryNoteNo");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryNotes_Status",
                table: "DeliveryNotes",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryNotes_UserId",
                table: "DeliveryNotes",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryNoteSettings_UserId",
                table: "DeliveryNoteSettings",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DocumentOtherCharges_DocumentId",
                table: "DocumentOtherCharges",
                column: "DocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentOtherCharges_DocumentType_DocumentId",
                table: "DocumentOtherCharges",
                columns: new[] { "DocumentType", "DocumentId" });

            migrationBuilder.CreateIndex(
                name: "IX_DocumentPaidInfos_DocumentId",
                table: "DocumentPaidInfos",
                column: "DocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentPaidInfos_DocumentType_DocumentId",
                table: "DocumentPaidInfos",
                columns: new[] { "DocumentType", "DocumentId" });

            migrationBuilder.CreateIndex(
                name: "IX_DocumentProducts_DocumentId",
                table: "DocumentProducts",
                column: "DocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentProducts_DocumentType_DocumentId",
                table: "DocumentProducts",
                columns: new[] { "DocumentType", "DocumentId" });

            migrationBuilder.CreateIndex(
                name: "IX_DocumentProducts_ProductId",
                table: "DocumentProducts",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentTerms_UserId_DocumentType",
                table: "DocumentTerms",
                columns: new[] { "UserId", "DocumentType" });

            migrationBuilder.CreateIndex(
                name: "IX_DocumentTermSelections_DocumentId",
                table: "DocumentTermSelections",
                column: "DocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentTermSelections_DocumentType_DocumentId_TermId",
                table: "DocumentTermSelections",
                columns: new[] { "DocumentType", "DocumentId", "TermId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DocumentTermSelections_TermId",
                table: "DocumentTermSelections",
                column: "TermId");

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_CustomerId",
                table: "Invoices",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_Date",
                table: "Invoices",
                column: "Date");

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_InvoiceNo",
                table: "Invoices",
                column: "InvoiceNo");

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_Status",
                table: "Invoices",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_UserId",
                table: "Invoices",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_InvoiceSettings_UserId",
                table: "InvoiceSettings",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Products_Name",
                table: "Products",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_Products_UserId",
                table: "Products",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_ProformaInvoices_CustomerId",
                table: "ProformaInvoices",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_ProformaInvoices_Date",
                table: "ProformaInvoices",
                column: "Date");

            migrationBuilder.CreateIndex(
                name: "IX_ProformaInvoices_ProformaInvoiceNo",
                table: "ProformaInvoices",
                column: "ProformaInvoiceNo");

            migrationBuilder.CreateIndex(
                name: "IX_ProformaInvoices_Status",
                table: "ProformaInvoices",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_ProformaInvoices_UserId",
                table: "ProformaInvoices",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_ProformaInvoiceSettings_UserId",
                table: "ProformaInvoiceSettings",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrders_CustomerId",
                table: "PurchaseOrders",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrders_Date",
                table: "PurchaseOrders",
                column: "Date");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrders_PurchaseOrderNo",
                table: "PurchaseOrders",
                column: "PurchaseOrderNo");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrders_Status",
                table: "PurchaseOrders",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrders_UserId",
                table: "PurchaseOrders",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrderSettings_UserId",
                table: "PurchaseOrderSettings",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Quotations_CustomerId",
                table: "Quotations",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_Quotations_Date",
                table: "Quotations",
                column: "Date");

            migrationBuilder.CreateIndex(
                name: "IX_Quotations_QuotationNo",
                table: "Quotations",
                column: "QuotationNo");

            migrationBuilder.CreateIndex(
                name: "IX_Quotations_Status",
                table: "Quotations",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Quotations_UserId",
                table: "Quotations",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_QuotationSettings_UserId",
                table: "QuotationSettings",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Receipts_CustomerId",
                table: "Receipts",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_Receipts_Date",
                table: "Receipts",
                column: "Date");

            migrationBuilder.CreateIndex(
                name: "IX_Receipts_ReceiptNo",
                table: "Receipts",
                column: "ReceiptNo");

            migrationBuilder.CreateIndex(
                name: "IX_Receipts_Status",
                table: "Receipts",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Receipts_UserId",
                table: "Receipts",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_ReceiptSettings_UserId",
                table: "ReceiptSettings",
                column: "UserId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BusinessInfos");

            migrationBuilder.DropTable(
                name: "ColumnHeadingSettings");

            migrationBuilder.DropTable(
                name: "DeliveryNoteSettings");

            migrationBuilder.DropTable(
                name: "DocumentOtherCharges");

            migrationBuilder.DropTable(
                name: "DocumentPaidInfos");

            migrationBuilder.DropTable(
                name: "DocumentProducts");

            migrationBuilder.DropTable(
                name: "DocumentTermSelections");

            migrationBuilder.DropTable(
                name: "InvoiceSettings");

            migrationBuilder.DropTable(
                name: "ProformaInvoiceSettings");

            migrationBuilder.DropTable(
                name: "PurchaseOrderSettings");

            migrationBuilder.DropTable(
                name: "QuotationSettings");

            migrationBuilder.DropTable(
                name: "Receipts");

            migrationBuilder.DropTable(
                name: "ReceiptSettings");

            migrationBuilder.DropTable(
                name: "Products");

            migrationBuilder.DropTable(
                name: "DeliveryNotes");

            migrationBuilder.DropTable(
                name: "DocumentTerms");

            migrationBuilder.DropTable(
                name: "Invoices");

            migrationBuilder.DropTable(
                name: "ProformaInvoices");

            migrationBuilder.DropTable(
                name: "PurchaseOrders");

            migrationBuilder.DropTable(
                name: "Quotations");

            migrationBuilder.DropTable(
                name: "Customers");
        }
    }
}
