using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LMPTS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkerInactivePeriods : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsCurrentlyActive",
                table: "Workers",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.CreateTable(
                name: "WorkerInactivePeriods",
                columns: table => new
                {
                    InactivePeriodId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    WorkerId = table.Column<int>(type: "int", nullable: false),
                    DeactivatedOn = table.Column<DateTime>(type: "date", nullable: false),
                    ReactivatedOn = table.Column<DateTime>(type: "date", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkerInactivePeriods", x => x.InactivePeriodId);
                    table.ForeignKey(
                        name: "FK_WorkerInactivePeriods_Workers_WorkerId",
                        column: x => x.WorkerId,
                        principalTable: "Workers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WorkerInactivePeriods_WorkerId_DeactivatedOn",
                table: "WorkerInactivePeriods",
                columns: new[] { "WorkerId", "DeactivatedOn" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WorkerInactivePeriods");

            migrationBuilder.DropColumn(
                name: "IsCurrentlyActive",
                table: "Workers");
        }
    }
}
