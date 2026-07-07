using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LMPTS.Migrations
{
    /// <inheritdoc />
    public partial class ColumnNamesUpdated : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "PinCode",
                table: "Users",
                newName: "Pin Code");

            migrationBuilder.RenameColumn(
                name: "PasswordHash",
                table: "Users",
                newName: "Password");

            migrationBuilder.RenameColumn(
                name: "PANNumber",
                table: "Users",
                newName: "PAN Number");

            migrationBuilder.RenameColumn(
                name: "MobileNumber",
                table: "Users",
                newName: "Mobile Number");

            migrationBuilder.RenameColumn(
                name: "GSTNumber",
                table: "Users",
                newName: "GST Number");

            migrationBuilder.RenameColumn(
                name: "FullName",
                table: "Users",
                newName: "Full Name");

            migrationBuilder.RenameColumn(
                name: "CompanyName",
                table: "Users",
                newName: "Company Name");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Pin Code",
                table: "Users",
                newName: "PinCode");

            migrationBuilder.RenameColumn(
                name: "Password",
                table: "Users",
                newName: "PasswordHash");

            migrationBuilder.RenameColumn(
                name: "PAN Number",
                table: "Users",
                newName: "PANNumber");

            migrationBuilder.RenameColumn(
                name: "Mobile Number",
                table: "Users",
                newName: "MobileNumber");

            migrationBuilder.RenameColumn(
                name: "GST Number",
                table: "Users",
                newName: "GSTNumber");

            migrationBuilder.RenameColumn(
                name: "Full Name",
                table: "Users",
                newName: "FullName");

            migrationBuilder.RenameColumn(
                name: "Company Name",
                table: "Users",
                newName: "CompanyName");
        }
    }
}
