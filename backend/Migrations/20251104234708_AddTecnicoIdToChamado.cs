using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.CSharp.Migrations
{
    /// <inheritdoc />
    public partial class AddTecnicoIdToChamado : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TecnicoId",
                table: "chamados",
                type: "TEXT",
                maxLength: 450,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TecnicoId",
                table: "chamados");
        }
    }
}
