using Firmeza.Domain.Entities;
using Firmeza.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Firmeza.Infrastructure.Persistence.Configurations;

public class SaleConfiguration : IEntityTypeConfiguration<Sale>
{
    public void Configure(EntityTypeBuilder<Sale> builder)
    {
        builder.ToTable("sales");
        builder.HasKey(sale => sale.Id);
        builder.Property(sale => sale.Id).HasDefaultValueSql("gen_random_uuid()").ValueGeneratedOnAdd();
        builder.Property(sale => sale.SaleNumber).HasMaxLength(30).IsRequired();
        builder.Property(sale => sale.SaleDate).HasDefaultValueSql("now()").IsRequired();
        builder.Property(sale => sale.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(sale => sale.Total).HasPrecision(14, 2).IsRequired();
        builder.HasIndex(sale => sale.SaleNumber).IsUnique();

        // El panel necesita filtrar rapido por estado (columna de la barra) y por
        // fecha; el indice de CustomerId ya existe para el historial del cliente.
        builder.HasIndex(sale => sale.Status);
        builder.HasIndex(sale => sale.CreatedByUserId);
        builder.HasOne<ApplicationUser>().WithMany().HasForeignKey(sale => sale.ConfirmedByUserId).OnDelete(DeleteBehavior.SetNull);
        builder.HasOne(sale => sale.Customer).WithMany(customer => customer.Sales).HasForeignKey(sale => sale.CustomerId).OnDelete(DeleteBehavior.Restrict);
        // Quien creo la venta (puede ser un Cliente del portal).
        builder.HasOne<ApplicationUser>().WithMany().HasForeignKey(sale => sale.CreatedByUserId).OnDelete(DeleteBehavior.SetNull);
    }
}
