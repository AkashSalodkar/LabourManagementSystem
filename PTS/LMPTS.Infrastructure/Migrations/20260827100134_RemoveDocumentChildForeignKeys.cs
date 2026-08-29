using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LMPTS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveDocumentChildForeignKeys : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DocumentOtherCharges_DeliveryNotes_DocumentId",
                table: "DocumentOtherCharges");

            migrationBuilder.DropForeignKey(
                name: "FK_DocumentOtherCharges_Invoices_DocumentId",
                table: "DocumentOtherCharges");

            migrationBuilder.DropForeignKey(
                name: "FK_DocumentOtherCharges_ProformaInvoices_DocumentId",
                table: "DocumentOtherCharges");

            migrationBuilder.DropForeignKey(
                name: "FK_DocumentOtherCharges_PurchaseOrders_DocumentId",
                table: "DocumentOtherCharges");

            migrationBuilder.DropForeignKey(
                name: "FK_DocumentOtherCharges_Quotations_DocumentId",
                table: "DocumentOtherCharges");

            migrationBuilder.DropForeignKey(
                name: "FK_DocumentPaidInfos_Invoices_DocumentId",
                table: "DocumentPaidInfos");

            migrationBuilder.DropForeignKey(
                name: "FK_DocumentPaidInfos_ProformaInvoices_DocumentId",
                table: "DocumentPaidInfos");

            migrationBuilder.DropForeignKey(
                name: "FK_DocumentProducts_DeliveryNotes_DocumentId",
                table: "DocumentProducts");

            migrationBuilder.DropForeignKey(
                name: "FK_DocumentProducts_Invoices_DocumentId",
                table: "DocumentProducts");

            migrationBuilder.DropForeignKey(
                name: "FK_DocumentProducts_ProformaInvoices_DocumentId",
                table: "DocumentProducts");

            migrationBuilder.DropForeignKey(
                name: "FK_DocumentProducts_PurchaseOrders_DocumentId",
                table: "DocumentProducts");

            migrationBuilder.DropForeignKey(
                name: "FK_DocumentProducts_Quotations_DocumentId",
                table: "DocumentProducts");

            migrationBuilder.DropForeignKey(
                name: "FK_DocumentTermSelections_DeliveryNotes_DocumentId",
                table: "DocumentTermSelections");

            migrationBuilder.DropForeignKey(
                name: "FK_DocumentTermSelections_Invoices_DocumentId",
                table: "DocumentTermSelections");

            migrationBuilder.DropForeignKey(
                name: "FK_DocumentTermSelections_ProformaInvoices_DocumentId",
                table: "DocumentTermSelections");

            migrationBuilder.DropForeignKey(
                name: "FK_DocumentTermSelections_PurchaseOrders_DocumentId",
                table: "DocumentTermSelections");

            migrationBuilder.DropForeignKey(
                name: "FK_DocumentTermSelections_Quotations_DocumentId",
                table: "DocumentTermSelections");

            migrationBuilder.DropIndex(
                name: "IX_DocumentTermSelections_DocumentId",
                table: "DocumentTermSelections");

            migrationBuilder.DropIndex(
                name: "IX_DocumentProducts_DocumentId",
                table: "DocumentProducts");

            migrationBuilder.DropIndex(
                name: "IX_DocumentPaidInfos_DocumentId",
                table: "DocumentPaidInfos");

            migrationBuilder.DropIndex(
                name: "IX_DocumentOtherCharges_DocumentId",
                table: "DocumentOtherCharges");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_DocumentTermSelections_DocumentId",
                table: "DocumentTermSelections",
                column: "DocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentProducts_DocumentId",
                table: "DocumentProducts",
                column: "DocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentPaidInfos_DocumentId",
                table: "DocumentPaidInfos",
                column: "DocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentOtherCharges_DocumentId",
                table: "DocumentOtherCharges",
                column: "DocumentId");

            migrationBuilder.AddForeignKey(
                name: "FK_DocumentOtherCharges_DeliveryNotes_DocumentId",
                table: "DocumentOtherCharges",
                column: "DocumentId",
                principalTable: "DeliveryNotes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_DocumentOtherCharges_Invoices_DocumentId",
                table: "DocumentOtherCharges",
                column: "DocumentId",
                principalTable: "Invoices",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_DocumentOtherCharges_ProformaInvoices_DocumentId",
                table: "DocumentOtherCharges",
                column: "DocumentId",
                principalTable: "ProformaInvoices",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_DocumentOtherCharges_PurchaseOrders_DocumentId",
                table: "DocumentOtherCharges",
                column: "DocumentId",
                principalTable: "PurchaseOrders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_DocumentOtherCharges_Quotations_DocumentId",
                table: "DocumentOtherCharges",
                column: "DocumentId",
                principalTable: "Quotations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_DocumentPaidInfos_Invoices_DocumentId",
                table: "DocumentPaidInfos",
                column: "DocumentId",
                principalTable: "Invoices",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_DocumentPaidInfos_ProformaInvoices_DocumentId",
                table: "DocumentPaidInfos",
                column: "DocumentId",
                principalTable: "ProformaInvoices",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_DocumentProducts_DeliveryNotes_DocumentId",
                table: "DocumentProducts",
                column: "DocumentId",
                principalTable: "DeliveryNotes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_DocumentProducts_Invoices_DocumentId",
                table: "DocumentProducts",
                column: "DocumentId",
                principalTable: "Invoices",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_DocumentProducts_ProformaInvoices_DocumentId",
                table: "DocumentProducts",
                column: "DocumentId",
                principalTable: "ProformaInvoices",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_DocumentProducts_PurchaseOrders_DocumentId",
                table: "DocumentProducts",
                column: "DocumentId",
                principalTable: "PurchaseOrders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_DocumentProducts_Quotations_DocumentId",
                table: "DocumentProducts",
                column: "DocumentId",
                principalTable: "Quotations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_DocumentTermSelections_DeliveryNotes_DocumentId",
                table: "DocumentTermSelections",
                column: "DocumentId",
                principalTable: "DeliveryNotes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_DocumentTermSelections_Invoices_DocumentId",
                table: "DocumentTermSelections",
                column: "DocumentId",
                principalTable: "Invoices",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_DocumentTermSelections_ProformaInvoices_DocumentId",
                table: "DocumentTermSelections",
                column: "DocumentId",
                principalTable: "ProformaInvoices",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_DocumentTermSelections_PurchaseOrders_DocumentId",
                table: "DocumentTermSelections",
                column: "DocumentId",
                principalTable: "PurchaseOrders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_DocumentTermSelections_Quotations_DocumentId",
                table: "DocumentTermSelections",
                column: "DocumentId",
                principalTable: "Quotations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
