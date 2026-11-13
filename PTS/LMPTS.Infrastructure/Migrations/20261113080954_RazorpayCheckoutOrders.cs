using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LMPTS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RazorpayCheckoutOrders : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ProviderOrderId",
                table: "SubscriptionPayments",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_SubscriptionPayments_ProviderOrderId",
                table: "SubscriptionPayments",
                column: "ProviderOrderId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_SubscriptionPayments_ProviderOrderId",
                table: "SubscriptionPayments");

            migrationBuilder.DropColumn(
                name: "ProviderOrderId",
                table: "SubscriptionPayments");
        }
    }
}
