using Firmeza.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Firmeza.Infrastructure.Persistence.Configurations;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("products");
        builder.HasKey(product => product.Id);
        builder.Property(product => product.Id).HasDefaultValueSql("gen_random_uuid()").ValueGeneratedOnAdd();
        builder.Property(product => product.Sku).HasMaxLength(30).IsRequired();
        builder.Property(product => product.Name).HasMaxLength(120).IsRequired();
        builder.Property(product => product.Description).HasMaxLength(1000);
        builder.Property(product => product.Category).HasMaxLength(80).IsRequired();
        builder.Property(product => product.Unit).HasMaxLength(30).IsRequired();
        builder.Property(product => product.Price).HasPrecision(14, 2).IsRequired();
        builder.Property(product => product.Stock).IsRequired();
        builder.Property(product => product.IsActive).HasDefaultValue(true).IsRequired();
        builder.Property(product => product.CreatedAt).HasDefaultValueSql("now()").ValueGeneratedOnAdd().IsRequired();
        builder.HasIndex(product => product.Sku).IsUnique();
        builder.HasIndex(product => product.Category);
    }
}
