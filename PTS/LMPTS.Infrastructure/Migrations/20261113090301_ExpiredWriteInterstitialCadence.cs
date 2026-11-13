using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LMPTS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ExpiredWriteInterstitialCadence : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ExpiredWriteActionCount",
                table: "Users",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ExpiredWriteActionCount",
                table: "Users");
        }
    }
}
