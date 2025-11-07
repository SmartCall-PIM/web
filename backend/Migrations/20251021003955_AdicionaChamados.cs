using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.CSharp.Migrations
{
    /// <inheritdoc />
    public partial class AdicionaChamados : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "chamado_id",
                table: "chat_messages",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "chamados",
                columns: table => new
                {
                    id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    nome_usuario = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    email = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    titulo = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    status = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    categoria = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    prioridade = table.Column<string>(type: "TEXT", maxLength: 20, nullable: true),
                    criado_em = table.Column<DateTime>(type: "TEXT", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    atualizado_em = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_chamados", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_chat_messages_chamado_id",
                table: "chat_messages",
                column: "chamado_id");

            migrationBuilder.AddForeignKey(
                name: "FK_chat_messages_chamados_chamado_id",
                table: "chat_messages",
                column: "chamado_id",
                principalTable: "chamados",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_chat_messages_chamados_chamado_id",
                table: "chat_messages");

            migrationBuilder.DropTable(
                name: "chamados");

            migrationBuilder.DropIndex(
                name: "IX_chat_messages_chamado_id",
                table: "chat_messages");

            migrationBuilder.DropColumn(
                name: "chamado_id",
                table: "chat_messages");
        }
    }
}
