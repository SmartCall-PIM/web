using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.CSharp.Migrations
{
    /// <inheritdoc />
    public partial class AddAutorInfoToChatMessage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AutorId",
                table: "chat_messages",
                type: "TEXT",
                maxLength: 450,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TipoAutor",
                table: "chat_messages",
                type: "TEXT",
                maxLength: 20,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AutorId",
                table: "chat_messages");

            migrationBuilder.DropColumn(
                name: "TipoAutor",
                table: "chat_messages");
        }
    }
}
