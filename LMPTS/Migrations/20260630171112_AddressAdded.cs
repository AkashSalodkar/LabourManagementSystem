using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LMPTS.Migrations
{
    /// <inheritdoc />
    public partial class AddressAdded : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Address",
                table: "Supervisors",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Address",
                table: "Labours",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Address",
                table: "Contractors",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Specilization",
                table: "Contractors",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Address",
                table: "Supervisors");

            migrationBuilder.DropColumn(
                name: "Address",
                table: "Labours");

            migrationBuilder.DropColumn(
                name: "Address",
                table: "Contractors");

            migrationBuilder.DropColumn(
                name: "Specilization",
                table: "Contractors");
        }
    }
}
