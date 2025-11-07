using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.CSharp.Migrations
{
    /// <inheritdoc />
    public partial class AddUserIdToChamados : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "UserId",
                table: "chamados",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UserId",
                table: "chamados");
        }
    }
}
