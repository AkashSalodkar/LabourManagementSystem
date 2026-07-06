using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LMPTS.Migrations
{
    /// <inheritdoc />
    public partial class Specialization : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Specilization",
                table: "Contractors",
                newName: "Specialization");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Specialization",
                table: "Contractors",
                newName: "Specilization");
        }
    }
}
