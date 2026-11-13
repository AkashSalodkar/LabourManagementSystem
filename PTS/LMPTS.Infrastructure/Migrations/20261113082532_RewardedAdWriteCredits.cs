using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LMPTS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RewardedAdWriteCredits : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RewardedAdAccess",
                columns: table => new
                {
                    RewardedAdAccessId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ChallengeToken = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    TransactionId = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UsedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RewardedAdAccess", x => x.RewardedAdAccessId);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RewardedAdAccess_ChallengeToken",
                table: "RewardedAdAccess",
                column: "ChallengeToken",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RewardedAdAccess_TransactionId",
                table: "RewardedAdAccess",
                column: "TransactionId",
                unique: true,
                filter: "[TransactionId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_RewardedAdAccess_UserId_UsedAt_ExpiresAt",
                table: "RewardedAdAccess",
                columns: new[] { "UserId", "UsedAt", "ExpiresAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RewardedAdAccess");
        }
    }
}
