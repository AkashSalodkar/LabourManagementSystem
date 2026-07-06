using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LMPTS.Migrations
{
    /// <inheritdoc />
    public partial class SupervisorTypeAdded : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Builders_Users_UserId",
                table: "Builders");

            migrationBuilder.DropForeignKey(
                name: "FK_Contractors_Supervisors_ManagingSupervisorId",
                table: "Contractors");

            migrationBuilder.DropForeignKey(
                name: "FK_Contractors_Users_UserId",
                table: "Contractors");

            migrationBuilder.DropForeignKey(
                name: "FK_Labours_Contractors_ContractorId",
                table: "Labours");

            migrationBuilder.DropForeignKey(
                name: "FK_Labours_Supervisors_ManagingSupervisorId",
                table: "Labours");

            migrationBuilder.DropForeignKey(
                name: "FK_Labours_Users_UserId",
                table: "Labours");

            migrationBuilder.DropTable(
                name: "Supervisors");

            migrationBuilder.DropIndex(
                name: "IX_Contractors_ManagingSupervisorId",
                table: "Contractors");

            migrationBuilder.DropColumn(
                name: "ManagingSupervisorId",
                table: "Contractors");

            migrationBuilder.RenameColumn(
                name: "ManagingSupervisorId",
                table: "Labours",
                newName: "ContractorSupervisorId");

            migrationBuilder.RenameIndex(
                name: "IX_Labours_ManagingSupervisorId",
                table: "Labours",
                newName: "IX_Labours_ContractorSupervisorId");

            migrationBuilder.AlterColumn<int>(
                name: "ContractorId",
                table: "Labours",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<int>(
                name: "BuilderSupervisorId",
                table: "Contractors",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "BuilderSupervisors",
                columns: table => new
                {
                    BuilderSupervisorId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Address = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BuilderId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    ContractorCount = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BuilderSupervisors", x => x.BuilderSupervisorId);
                    table.ForeignKey(
                        name: "FK_BuilderSupervisors_Builders_BuilderId",
                        column: x => x.BuilderId,
                        principalTable: "Builders",
                        principalColumn: "BuilderId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BuilderSupervisors_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "ContractorSupervisors",
                columns: table => new
                {
                    ContractorSupervisorId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Address = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    ContractorId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContractorSupervisors", x => x.ContractorSupervisorId);
                    table.ForeignKey(
                        name: "FK_ContractorSupervisors_Contractors_ContractorId",
                        column: x => x.ContractorId,
                        principalTable: "Contractors",
                        principalColumn: "ContractorId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ContractorSupervisors_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Contractors_BuilderSupervisorId",
                table: "Contractors",
                column: "BuilderSupervisorId");

            migrationBuilder.CreateIndex(
                name: "IX_BuilderSupervisors_BuilderId",
                table: "BuilderSupervisors",
                column: "BuilderId");

            migrationBuilder.CreateIndex(
                name: "IX_BuilderSupervisors_UserId",
                table: "BuilderSupervisors",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ContractorSupervisors_ContractorId",
                table: "ContractorSupervisors",
                column: "ContractorId");

            migrationBuilder.CreateIndex(
                name: "IX_ContractorSupervisors_UserId",
                table: "ContractorSupervisors",
                column: "UserId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Builders_Users_UserId",
                table: "Builders",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Contractors_BuilderSupervisors_BuilderSupervisorId",
                table: "Contractors",
                column: "BuilderSupervisorId",
                principalTable: "BuilderSupervisors",
                principalColumn: "BuilderSupervisorId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Contractors_Users_UserId",
                table: "Contractors",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Labours_ContractorSupervisors_ContractorSupervisorId",
                table: "Labours",
                column: "ContractorSupervisorId",
                principalTable: "ContractorSupervisors",
                principalColumn: "ContractorSupervisorId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Labours_Contractors_ContractorId",
                table: "Labours",
                column: "ContractorId",
                principalTable: "Contractors",
                principalColumn: "ContractorId");

            migrationBuilder.AddForeignKey(
                name: "FK_Labours_Users_UserId",
                table: "Labours",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Builders_Users_UserId",
                table: "Builders");

            migrationBuilder.DropForeignKey(
                name: "FK_Contractors_BuilderSupervisors_BuilderSupervisorId",
                table: "Contractors");

            migrationBuilder.DropForeignKey(
                name: "FK_Contractors_Users_UserId",
                table: "Contractors");

            migrationBuilder.DropForeignKey(
                name: "FK_Labours_ContractorSupervisors_ContractorSupervisorId",
                table: "Labours");

            migrationBuilder.DropForeignKey(
                name: "FK_Labours_Contractors_ContractorId",
                table: "Labours");

            migrationBuilder.DropForeignKey(
                name: "FK_Labours_Users_UserId",
                table: "Labours");

            migrationBuilder.DropTable(
                name: "BuilderSupervisors");

            migrationBuilder.DropTable(
                name: "ContractorSupervisors");

            migrationBuilder.DropIndex(
                name: "IX_Contractors_BuilderSupervisorId",
                table: "Contractors");

            migrationBuilder.DropColumn(
                name: "BuilderSupervisorId",
                table: "Contractors");

            migrationBuilder.RenameColumn(
                name: "ContractorSupervisorId",
                table: "Labours",
                newName: "ManagingSupervisorId");

            migrationBuilder.RenameIndex(
                name: "IX_Labours_ContractorSupervisorId",
                table: "Labours",
                newName: "IX_Labours_ManagingSupervisorId");

            migrationBuilder.AlterColumn<int>(
                name: "ContractorId",
                table: "Labours",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ManagingSupervisorId",
                table: "Contractors",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Supervisors",
                columns: table => new
                {
                    SupervisorId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ContractorId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Address = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Supervisors", x => x.SupervisorId);
                    table.ForeignKey(
                        name: "FK_Supervisors_Contractors_ContractorId",
                        column: x => x.ContractorId,
                        principalTable: "Contractors",
                        principalColumn: "ContractorId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Supervisors_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Contractors_ManagingSupervisorId",
                table: "Contractors",
                column: "ManagingSupervisorId");

            migrationBuilder.CreateIndex(
                name: "IX_Supervisors_ContractorId",
                table: "Supervisors",
                column: "ContractorId");

            migrationBuilder.CreateIndex(
                name: "IX_Supervisors_UserId",
                table: "Supervisors",
                column: "UserId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Builders_Users_UserId",
                table: "Builders",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Contractors_Supervisors_ManagingSupervisorId",
                table: "Contractors",
                column: "ManagingSupervisorId",
                principalTable: "Supervisors",
                principalColumn: "SupervisorId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Contractors_Users_UserId",
                table: "Contractors",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Labours_Contractors_ContractorId",
                table: "Labours",
                column: "ContractorId",
                principalTable: "Contractors",
                principalColumn: "ContractorId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Labours_Supervisors_ManagingSupervisorId",
                table: "Labours",
                column: "ManagingSupervisorId",
                principalTable: "Supervisors",
                principalColumn: "SupervisorId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Labours_Users_UserId",
                table: "Labours",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
