using Firmeza.Web.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Firmeza.Web.Infrastructure.Persistence.Configurations;

public class SaleDetailConfiguration : IEntityTypeConfiguration<SaleDetail>
{
    public void Configure(EntityTypeBuilder<SaleDetail> builder)
    {
        builder.ToTable("sale_details");
        builder.HasKey(detail => detail.Id);
        builder.Property(detail => detail.Id).HasDefaultValueSql("gen_random_uuid()").ValueGeneratedOnAdd();
        builder.Property(detail => detail.Quantity).IsRequired();
        builder.Property(detail => detail.UnitPrice).HasPrecision(14, 2).IsRequired();
        builder.Property(detail => detail.Subtotal).HasPrecision(14, 2).IsRequired();
        builder.HasOne(detail => detail.Sale).WithMany(sale => sale.Details).HasForeignKey(detail => detail.SaleId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(detail => detail.Product).WithMany(product => product.SaleDetails).HasForeignKey(detail => detail.ProductId).OnDelete(DeleteBehavior.Restrict);
    }
}
