using Firmeza.Domain.Entities;
using Firmeza.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Firmeza.Infrastructure.Persistence.Configurations;

public class CustomerRequestConfiguration : IEntityTypeConfiguration<CustomerSignupRequest>
{
    public void Configure(EntityTypeBuilder<CustomerSignupRequest> builder)
    {
        builder.ToTable("customer_requests");
        builder.HasKey(request => request.Id);
        builder.Property(request => request.Id).HasDefaultValueSql("gen_random_uuid()").ValueGeneratedOnAdd();
        builder.Property(request => request.UserId).HasMaxLength(450).IsRequired();
        builder.Property(request => request.Document).HasMaxLength(30).IsRequired();
        builder.Property(request => request.FullName).HasMaxLength(120).IsRequired();
        builder.Property(request => request.Email).HasMaxLength(160).IsRequired();
        builder.Property(request => request.Phone).HasMaxLength(30).IsRequired();
        builder.Property(request => request.Address).HasMaxLength(240);
        builder.Property(request => request.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(request => request.CreatedAt).IsRequired();

        builder.HasIndex(request => request.Status);
        // El documento se valida como unico tambien en el dominio; el indice
        // evita dos solicitudes simultaneas con el mismo documento.
        builder.HasIndex(request => request.Document).IsUnique();

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(request => request.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<Customer>()
            .WithMany()
            .HasForeignKey(request => request.CustomerId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}