using Firmeza.Web.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Firmeza.Web.Infrastructure.Persistence.Configurations;

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
        builder.HasOne(sale => sale.Customer).WithMany(customer => customer.Sales).HasForeignKey(sale => sale.CustomerId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(sale => sale.CreatedByUser).WithMany().HasForeignKey(sale => sale.CreatedByUserId).OnDelete(DeleteBehavior.SetNull);
    }
}
