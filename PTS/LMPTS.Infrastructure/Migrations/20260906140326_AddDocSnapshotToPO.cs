using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LMPTS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDocSnapshotToPO : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DocSnapshot",
                table: "Receipts",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DocSnapshot",
                table: "PurchaseOrders",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DocSnapshot",
                table: "ProformaInvoices",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DocSnapshot",
                table: "Invoices",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DocSnapshot",
                table: "DeliveryNotes",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DocSnapshot",
                table: "Receipts");

            migrationBuilder.DropColumn(
                name: "DocSnapshot",
                table: "PurchaseOrders");

            migrationBuilder.DropColumn(
                name: "DocSnapshot",
                table: "ProformaInvoices");

            migrationBuilder.DropColumn(
                name: "DocSnapshot",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "DocSnapshot",
                table: "DeliveryNotes");
        }
    }
}
