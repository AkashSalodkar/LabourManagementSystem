using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LMPTS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProjectIdToWorkerAttendance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_WorkerAttendances_WorkerId_AttendanceDate",
                table: "WorkerAttendances");

            migrationBuilder.AddColumn<int>(
                name: "ProjectId",
                table: "WorkerAttendances",
                type: "int",
                nullable: false,
                defaultValue: 0);

            // The AddColumn above set every existing row's ProjectId to the placeholder
            // default of 0. Backfill it here with each worker's actual project before the
            // foreign key below is added - otherwise the FK's validation against Projects
            // will fail on every pre-existing row still sitting at 0.
            migrationBuilder.Sql(@"
                UPDATE wa
                SET wa.ProjectId = w.ProjectId
                FROM WorkerAttendances wa
                INNER JOIN Workers w ON wa.WorkerId = w.Id
            ");

            migrationBuilder.CreateIndex(
                name: "IX_WorkerAttendances_ProjectId",
                table: "WorkerAttendances",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkerAttendances_WorkerId_ProjectId_AttendanceDate",
                table: "WorkerAttendances",
                columns: new[] { "WorkerId", "ProjectId", "AttendanceDate" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_WorkerAttendances_Projects_ProjectId",
                table: "WorkerAttendances",
                column: "ProjectId",
                principalTable: "Projects",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_WorkerAttendances_Projects_ProjectId",
                table: "WorkerAttendances");

            migrationBuilder.DropIndex(
                name: "IX_WorkerAttendances_ProjectId",
                table: "WorkerAttendances");

            migrationBuilder.DropIndex(
                name: "IX_WorkerAttendances_WorkerId_ProjectId_AttendanceDate",
                table: "WorkerAttendances");

            migrationBuilder.DropColumn(
                name: "ProjectId",
                table: "WorkerAttendances");

            migrationBuilder.CreateIndex(
                name: "IX_WorkerAttendances_WorkerId_AttendanceDate",
                table: "WorkerAttendances",
                columns: new[] { "WorkerId", "AttendanceDate" },
                unique: true);
        }
    }
}
