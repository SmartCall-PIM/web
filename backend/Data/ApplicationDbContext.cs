using Backend.CSharp.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Backend.CSharp.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<ChatMessage> ChatMessages { get; set; }
    public DbSet<Chamado> Chamados { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Chamado>(entity =>
        {
            entity.ToTable("chamados");
            
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.NomeUsuario).HasColumnName("nome_usuario").IsRequired().HasMaxLength(100);
            entity.Property(e => e.Email).HasColumnName("email").HasMaxLength(200);
            entity.Property(e => e.Titulo).HasColumnName("titulo").HasMaxLength(200);
            entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(50);
            entity.Property(e => e.Categoria).HasColumnName("categoria").HasMaxLength(50);
            entity.Property(e => e.Prioridade).HasColumnName("prioridade").HasMaxLength(20);
            entity.Property(e => e.CriadoEm).HasColumnName("criado_em").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.AtualizadoEm).HasColumnName("atualizado_em");
            
            entity.HasMany(e => e.Mensagens)
                .WithOne(m => m.Chamado)
                .HasForeignKey(m => m.ChamadoId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ChatMessage>(entity =>
        {
            entity.ToTable("chat_messages");
            
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Message).HasColumnName("message").IsRequired().HasMaxLength(5000);
            entity.Property(e => e.IsUser).HasColumnName("is_user").IsRequired();
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.ChamadoId).HasColumnName("chamado_id");
        });
    }
}
