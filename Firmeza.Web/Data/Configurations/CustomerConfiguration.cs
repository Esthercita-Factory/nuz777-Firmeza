using Firmeza.Web.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Firmeza.Web.Data.Configurations;

public class CustomerConfiguration : IEntityTypeConfiguration<Customer>
{
    public void Configure(EntityTypeBuilder<Customer> builder)
    {
        builder.ToTable("customers");
        builder.HasKey(customer => customer.Id);
        builder.Property(customer => customer.Id).HasDefaultValueSql("gen_random_uuid()").ValueGeneratedOnAdd();
        builder.Property(customer => customer.Document).HasMaxLength(30).IsRequired();
        builder.Property(customer => customer.FullName).HasMaxLength(120).IsRequired();
        builder.Property(customer => customer.Email).HasMaxLength(160).IsRequired();
        builder.Property(customer => customer.Phone).HasMaxLength(30).IsRequired();
        builder.Property(customer => customer.Address).HasMaxLength(240);
        builder.Property(customer => customer.IsActive).HasDefaultValue(true).IsRequired();
        builder.Property(customer => customer.CreatedAt).HasDefaultValueSql("now()").ValueGeneratedOnAdd().IsRequired();
        builder.HasIndex(customer => customer.Document).IsUnique();
        builder.HasIndex(customer => customer.Email).IsUnique();
    }
}
