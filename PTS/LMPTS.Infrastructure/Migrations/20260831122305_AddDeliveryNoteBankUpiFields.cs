using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LMPTS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDeliveryNoteBankUpiFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ShowBankInfo",
                table: "DeliveryNoteSettings",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ShowUpiInfo",
                table: "DeliveryNoteSettings",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ShowBankInfo",
                table: "DeliveryNoteSettings");

            migrationBuilder.DropColumn(
                name: "ShowUpiInfo",
                table: "DeliveryNoteSettings");
        }
    }
}
