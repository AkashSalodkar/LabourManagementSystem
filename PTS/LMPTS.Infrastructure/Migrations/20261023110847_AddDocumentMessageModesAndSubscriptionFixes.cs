using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LMPTS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDocumentMessageModesAndSubscriptionFixes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "QrImageUrl",
                table: "SubscriptionPayments",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(400)",
                oldMaxLength: 400);

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "SubscriptionPayments",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "GETDATE()",
                oldClrType: typeof(DateTime),
                oldType: "datetime2");

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "SubscriptionPayments",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "GETDATE()");

            migrationBuilder.AddColumn<string>(
                name: "BottomMessageMode",
                table: "QuotationSettings",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MessageModeSchemaVersion",
                table: "QuotationSettings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "TopMessageMode",
                table: "QuotationSettings",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BottomMessageMode",
                table: "PurchaseOrderSettings",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MessageModeSchemaVersion",
                table: "PurchaseOrderSettings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "TopMessageMode",
                table: "PurchaseOrderSettings",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BottomMessageMode",
                table: "ProformaInvoiceSettings",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MessageModeSchemaVersion",
                table: "ProformaInvoiceSettings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "TopMessageMode",
                table: "ProformaInvoiceSettings",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BottomMessageMode",
                table: "InvoiceSettings",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MessageModeSchemaVersion",
                table: "InvoiceSettings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "TopMessageMode",
                table: "InvoiceSettings",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BottomMessageMode",
                table: "DeliveryNoteSettings",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MessageModeSchemaVersion",
                table: "DeliveryNoteSettings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "TopMessageMode",
                table: "DeliveryNoteSettings",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "SubscriptionPayments");

            migrationBuilder.DropColumn(
                name: "BottomMessageMode",
                table: "QuotationSettings");

            migrationBuilder.DropColumn(
                name: "MessageModeSchemaVersion",
                table: "QuotationSettings");

            migrationBuilder.DropColumn(
                name: "TopMessageMode",
                table: "QuotationSettings");

            migrationBuilder.DropColumn(
                name: "BottomMessageMode",
                table: "PurchaseOrderSettings");

            migrationBuilder.DropColumn(
                name: "MessageModeSchemaVersion",
                table: "PurchaseOrderSettings");

            migrationBuilder.DropColumn(
                name: "TopMessageMode",
                table: "PurchaseOrderSettings");

            migrationBuilder.DropColumn(
                name: "BottomMessageMode",
                table: "ProformaInvoiceSettings");

            migrationBuilder.DropColumn(
                name: "MessageModeSchemaVersion",
                table: "ProformaInvoiceSettings");

            migrationBuilder.DropColumn(
                name: "TopMessageMode",
                table: "ProformaInvoiceSettings");

            migrationBuilder.DropColumn(
                name: "BottomMessageMode",
                table: "InvoiceSettings");

            migrationBuilder.DropColumn(
                name: "MessageModeSchemaVersion",
                table: "InvoiceSettings");

            migrationBuilder.DropColumn(
                name: "TopMessageMode",
                table: "InvoiceSettings");

            migrationBuilder.DropColumn(
                name: "BottomMessageMode",
                table: "DeliveryNoteSettings");

            migrationBuilder.DropColumn(
                name: "MessageModeSchemaVersion",
                table: "DeliveryNoteSettings");

            migrationBuilder.DropColumn(
                name: "TopMessageMode",
                table: "DeliveryNoteSettings");

            migrationBuilder.AlterColumn<string>(
                name: "QrImageUrl",
                table: "SubscriptionPayments",
                type: "nvarchar(400)",
                maxLength: 400,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(1000)",
                oldMaxLength: 1000);

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "SubscriptionPayments",
                type: "datetime2",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldDefaultValueSql: "GETDATE()");
        }
    }
}
