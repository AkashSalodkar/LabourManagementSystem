using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LMPTS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class TrialPeriod45Days : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                UPDATE [Subscriptions]
                SET [EndDate] = DATEADD(day, 15, [EndDate]),
                    [Note] = '45-day free trial (extended from 30 days)'
                WHERE [PlanType] = 'trial'
                  AND [EndDate] IS NOT NULL
                  AND [Note] = '30-day free trial'
                  AND [EndDate] = DATEADD(day, 30, [StartDate]);
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                UPDATE [Subscriptions]
                SET [EndDate] = DATEADD(day, -15, [EndDate]),
                    [Note] = '30-day free trial'
                WHERE [PlanType] = 'trial'
                  AND [EndDate] IS NOT NULL
                  AND [Note] = '45-day free trial (extended from 30 days)'
                  AND [EndDate] = DATEADD(day, 45, [StartDate]);
                """);
        }
    }
}
