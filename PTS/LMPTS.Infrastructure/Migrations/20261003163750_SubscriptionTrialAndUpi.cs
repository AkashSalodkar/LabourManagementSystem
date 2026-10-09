using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LMPTS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SubscriptionTrialAndUpi : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<DateTime>(
                name: "StartDate",
                table: "Subscriptions",
                type: "datetime2",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "date");

            migrationBuilder.AlterColumn<string>(
                name: "PlanType",
                table: "Subscriptions",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "trial",
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20,
                oldDefaultValue: "free");

            migrationBuilder.AlterColumn<DateTime>(
                name: "EndDate",
                table: "Subscriptions",
                type: "datetime2",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "date",
                oldNullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PaidAt",
                table: "Subscriptions",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentReference",
                table: "Subscriptions",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProviderPaymentId",
                table: "Subscriptions",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "SubscriptionPayments",
                columns: table => new
                {
                    SubscriptionPaymentId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    OrderRef = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    ProviderQrId = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    QrImageUrl = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(16)", maxLength: 16, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SubscriptionPayments", x => x.SubscriptionPaymentId);
                    table.ForeignKey(
                        name: "FK_SubscriptionPayments_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Subscriptions_ProviderPaymentId",
                table: "Subscriptions",
                column: "ProviderPaymentId",
                unique: true,
                filter: "[ProviderPaymentId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "UX_Subscriptions_OneTrialPerUser",
                table: "Subscriptions",
                column: "UserId",
                unique: true,
                filter: "[PlanType] = 'trial'");

            migrationBuilder.CreateIndex(
                name: "IX_SubscriptionPayments_OrderRef",
                table: "SubscriptionPayments",
                column: "OrderRef",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SubscriptionPayments_ProviderQrId",
                table: "SubscriptionPayments",
                column: "ProviderQrId");

            migrationBuilder.CreateIndex(
                name: "IX_SubscriptionPayments_UserId_CreatedAt",
                table: "SubscriptionPayments",
                columns: new[] { "UserId", "CreatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SubscriptionPayments");

            migrationBuilder.DropIndex(
                name: "IX_Subscriptions_ProviderPaymentId",
                table: "Subscriptions");

            migrationBuilder.DropIndex(
                name: "UX_Subscriptions_OneTrialPerUser",
                table: "Subscriptions");

            migrationBuilder.DropColumn(
                name: "PaidAt",
                table: "Subscriptions");

            migrationBuilder.DropColumn(
                name: "PaymentReference",
                table: "Subscriptions");

            migrationBuilder.DropColumn(
                name: "ProviderPaymentId",
                table: "Subscriptions");

            migrationBuilder.AlterColumn<DateTime>(
                name: "StartDate",
                table: "Subscriptions",
                type: "date",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "datetime2");

            migrationBuilder.AlterColumn<string>(
                name: "PlanType",
                table: "Subscriptions",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "free",
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20,
                oldDefaultValue: "trial");

            migrationBuilder.AlterColumn<DateTime>(
                name: "EndDate",
                table: "Subscriptions",
                type: "date",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldNullable: true);
        }
    }
}
