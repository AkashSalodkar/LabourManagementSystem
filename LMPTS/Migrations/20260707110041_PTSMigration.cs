using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LMPTS.Migrations
{
    /// <inheritdoc />
    public partial class PTSMigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AttendanceRecords_Labours_LaborId",
                table: "AttendanceRecords");

            migrationBuilder.DropForeignKey(
                name: "FK_Payments_Labours_LaborId",
                table: "Payments");

            migrationBuilder.DropTable(
                name: "BuilderContractors");

            migrationBuilder.DropTable(
                name: "Labours");

            migrationBuilder.DropTable(
                name: "ContractorSupervisors");

            migrationBuilder.DropTable(
                name: "Contractors");

            migrationBuilder.DropTable(
                name: "BuilderSupervisors");

            migrationBuilder.DropTable(
                name: "Builders");

            migrationBuilder.RenameColumn(
                name: "Role",
                table: "Users",
                newName: "Industry");

            migrationBuilder.RenameColumn(
                name: "LaborId",
                table: "Payments",
                newName: "UserId");

            migrationBuilder.RenameIndex(
                name: "IX_Payments_LaborId_Month_Year",
                table: "Payments",
                newName: "IX_Payments_UserId_Month_Year");

            migrationBuilder.RenameColumn(
                name: "LaborId",
                table: "AttendanceRecords",
                newName: "UserId");

            migrationBuilder.RenameIndex(
                name: "IX_AttendanceRecords_LaborId",
                table: "AttendanceRecords",
                newName: "IX_AttendanceRecords_UserId");

            migrationBuilder.AddColumn<string>(
                name: "Address",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "City",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CompanyName",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GSTNumber",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PANNumber",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "PinCode",
                table: "Users",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "State",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_AttendanceRecords_Users_UserId",
                table: "AttendanceRecords",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_Users_UserId",
                table: "Payments",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AttendanceRecords_Users_UserId",
                table: "AttendanceRecords");

            migrationBuilder.DropForeignKey(
                name: "FK_Payments_Users_UserId",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "Address",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "City",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CompanyName",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "GSTNumber",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PANNumber",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PinCode",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "State",
                table: "Users");

            migrationBuilder.RenameColumn(
                name: "Industry",
                table: "Users",
                newName: "Role");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "Payments",
                newName: "LaborId");

            migrationBuilder.RenameIndex(
                name: "IX_Payments_UserId_Month_Year",
                table: "Payments",
                newName: "IX_Payments_LaborId_Month_Year");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "AttendanceRecords",
                newName: "LaborId");

            migrationBuilder.RenameIndex(
                name: "IX_AttendanceRecords_UserId",
                table: "AttendanceRecords",
                newName: "IX_AttendanceRecords_LaborId");

            migrationBuilder.CreateTable(
                name: "Builders",
                columns: table => new
                {
                    BuilderId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    BuilderType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    City = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CompanyName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ContractorCount = table.Column<int>(type: "int", nullable: false),
                    GSTNumber = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsVerified = table.Column<bool>(type: "bit", nullable: false),
                    PANNumber = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RegisteredAddress = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RegisteredMobileNumber = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SupervisorCount = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Builders", x => x.BuilderId);
                    table.ForeignKey(
                        name: "FK_Builders_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "BuilderSupervisors",
                columns: table => new
                {
                    BuilderSupervisorId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BuilderId = table.Column<int>(type: "int", nullable: true),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Address = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ContractorCount = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BuilderSupervisors", x => x.BuilderSupervisorId);
                    table.ForeignKey(
                        name: "FK_BuilderSupervisors_Builders_BuilderId",
                        column: x => x.BuilderId,
                        principalTable: "Builders",
                        principalColumn: "BuilderId");
                    table.ForeignKey(
                        name: "FK_BuilderSupervisors_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "Contractors",
                columns: table => new
                {
                    ContractorId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BuilderSupervisorId = table.Column<int>(type: "int", nullable: true),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Address = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Specialization = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Contractors", x => x.ContractorId);
                    table.ForeignKey(
                        name: "FK_Contractors_BuilderSupervisors_BuilderSupervisorId",
                        column: x => x.BuilderSupervisorId,
                        principalTable: "BuilderSupervisors",
                        principalColumn: "BuilderSupervisorId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Contractors_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "BuilderContractors",
                columns: table => new
                {
                    BuilderId = table.Column<int>(type: "int", nullable: false),
                    ContractorId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BuilderContractors", x => new { x.BuilderId, x.ContractorId });
                    table.ForeignKey(
                        name: "FK_BuilderContractors_Builders_BuilderId",
                        column: x => x.BuilderId,
                        principalTable: "Builders",
                        principalColumn: "BuilderId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_BuilderContractors_Contractors_ContractorId",
                        column: x => x.ContractorId,
                        principalTable: "Contractors",
                        principalColumn: "ContractorId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ContractorSupervisors",
                columns: table => new
                {
                    ContractorSupervisorId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ContractorId = table.Column<int>(type: "int", nullable: true),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Address = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContractorSupervisors", x => x.ContractorSupervisorId);
                    table.ForeignKey(
                        name: "FK_ContractorSupervisors_Contractors_ContractorId",
                        column: x => x.ContractorId,
                        principalTable: "Contractors",
                        principalColumn: "ContractorId");
                    table.ForeignKey(
                        name: "FK_ContractorSupervisors_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "Labours",
                columns: table => new
                {
                    LaborId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ContractorId = table.Column<int>(type: "int", nullable: true),
                    ContractorSupervisorId = table.Column<int>(type: "int", nullable: true),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Address = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Skill = table.Column<int>(type: "int", nullable: false),
                    SkillId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Labours", x => x.LaborId);
                    table.ForeignKey(
                        name: "FK_Labours_ContractorSupervisors_ContractorSupervisorId",
                        column: x => x.ContractorSupervisorId,
                        principalTable: "ContractorSupervisors",
                        principalColumn: "ContractorSupervisorId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Labours_Contractors_ContractorId",
                        column: x => x.ContractorId,
                        principalTable: "Contractors",
                        principalColumn: "ContractorId");
                    table.ForeignKey(
                        name: "FK_Labours_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateIndex(
                name: "IX_BuilderContractors_ContractorId",
                table: "BuilderContractors",
                column: "ContractorId");

            migrationBuilder.CreateIndex(
                name: "IX_Builders_UserId",
                table: "Builders",
                column: "UserId",
                unique: true);

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
                name: "IX_Contractors_BuilderSupervisorId",
                table: "Contractors",
                column: "BuilderSupervisorId");

            migrationBuilder.CreateIndex(
                name: "IX_Contractors_UserId",
                table: "Contractors",
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

            migrationBuilder.CreateIndex(
                name: "IX_Labours_ContractorId",
                table: "Labours",
                column: "ContractorId");

            migrationBuilder.CreateIndex(
                name: "IX_Labours_ContractorSupervisorId",
                table: "Labours",
                column: "ContractorSupervisorId");

            migrationBuilder.CreateIndex(
                name: "IX_Labours_UserId",
                table: "Labours",
                column: "UserId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_AttendanceRecords_Labours_LaborId",
                table: "AttendanceRecords",
                column: "LaborId",
                principalTable: "Labours",
                principalColumn: "LaborId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_Labours_LaborId",
                table: "Payments",
                column: "LaborId",
                principalTable: "Labours",
                principalColumn: "LaborId",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
