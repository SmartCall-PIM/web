using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.CSharp.Migrations
{
    /// <inheritdoc />
    public partial class AddLastActivityAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "LastActivityAt",
                table: "AspNetUsers",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LastActivityAt",
                table: "AspNetUsers");
        }
    }
}
