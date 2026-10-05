using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Firmeza.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SaleAuditAndStockOnConfirm : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "CancelledAt",
                table: "sales",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ConfirmedAt",
                table: "sales",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ConfirmedByUserId",
                table: "sales",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "DeliveredAt",
                table: "sales",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_sales_ConfirmedByUserId",
                table: "sales",
                column: "ConfirmedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_sales_Status",
                table: "sales",
                column: "Status");

            migrationBuilder.AddForeignKey(
                name: "FK_sales_AspNetUsers_ConfirmedByUserId",
                table: "sales",
                column: "ConfirmedByUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_sales_AspNetUsers_ConfirmedByUserId",
                table: "sales");

            migrationBuilder.DropIndex(
                name: "IX_sales_ConfirmedByUserId",
                table: "sales");

            migrationBuilder.DropIndex(
                name: "IX_sales_Status",
                table: "sales");

            migrationBuilder.DropColumn(
                name: "CancelledAt",
                table: "sales");

            migrationBuilder.DropColumn(
                name: "ConfirmedAt",
                table: "sales");

            migrationBuilder.DropColumn(
                name: "ConfirmedByUserId",
                table: "sales");

            migrationBuilder.DropColumn(
                name: "DeliveredAt",
                table: "sales");
        }
    }
}
