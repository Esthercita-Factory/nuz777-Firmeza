using System;
using System.Threading;
using System.Threading.Tasks;
using Firmeza.Domain.Entities;

namespace Firmeza.Application.Services.Receipts;

public interface IReceiptService
{
    byte[] GenerateReceiptPdf(Sale sale);

    Task<string> EnsureReceiptPdfSavedAsync(Guid saleId, string webRootPath, CancellationToken cancellationToken = default);

    Task<string> EnsureReceiptPdfSavedAsync(Sale sale, string webRootPath, CancellationToken cancellationToken = default);
}
