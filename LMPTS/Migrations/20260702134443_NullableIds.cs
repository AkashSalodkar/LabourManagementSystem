using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LMPTS.Migrations
{
    /// <inheritdoc />
    public partial class NullableIds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BuilderSupervisors_Builders_BuilderId",
                table: "BuilderSupervisors");

            migrationBuilder.DropForeignKey(
                name: "FK_ContractorSupervisors_Contractors_ContractorId",
                table: "ContractorSupervisors");

            migrationBuilder.AlterColumn<int>(
                name: "ContractorId",
                table: "ContractorSupervisors",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AlterColumn<int>(
                name: "BuilderId",
                table: "BuilderSupervisors",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddForeignKey(
                name: "FK_BuilderSupervisors_Builders_BuilderId",
                table: "BuilderSupervisors",
                column: "BuilderId",
                principalTable: "Builders",
                principalColumn: "BuilderId");

            migrationBuilder.AddForeignKey(
                name: "FK_ContractorSupervisors_Contractors_ContractorId",
                table: "ContractorSupervisors",
                column: "ContractorId",
                principalTable: "Contractors",
                principalColumn: "ContractorId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BuilderSupervisors_Builders_BuilderId",
                table: "BuilderSupervisors");

            migrationBuilder.DropForeignKey(
                name: "FK_ContractorSupervisors_Contractors_ContractorId",
                table: "ContractorSupervisors");

            migrationBuilder.AlterColumn<int>(
                name: "ContractorId",
                table: "ContractorSupervisors",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "BuilderId",
                table: "BuilderSupervisors",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_BuilderSupervisors_Builders_BuilderId",
                table: "BuilderSupervisors",
                column: "BuilderId",
                principalTable: "Builders",
                principalColumn: "BuilderId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ContractorSupervisors_Contractors_ContractorId",
                table: "ContractorSupervisors",
                column: "ContractorId",
                principalTable: "Contractors",
                principalColumn: "ContractorId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
