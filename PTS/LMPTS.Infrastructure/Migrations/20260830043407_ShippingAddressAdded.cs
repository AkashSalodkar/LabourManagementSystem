using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LMPTS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ShippingAddressAdded : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ShowShippingAddress",
                table: "PurchaseOrderSettings",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ShowShippingAddress",
                table: "ProformaInvoiceSettings",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ShowShippingAddress",
                table: "InvoiceSettings",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ShowShippingAddress",
                table: "DeliveryNoteSettings",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ShowShippingAddress",
                table: "PurchaseOrderSettings");

            migrationBuilder.DropColumn(
                name: "ShowShippingAddress",
                table: "ProformaInvoiceSettings");

            migrationBuilder.DropColumn(
                name: "ShowShippingAddress",
                table: "InvoiceSettings");

            migrationBuilder.DropColumn(
                name: "ShowShippingAddress",
                table: "DeliveryNoteSettings");
        }
    }
}
