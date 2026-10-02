using System.Threading;
using System.Threading.Tasks;

namespace Firmeza.Application.Services.Exports;

public interface IExportService
{
    Task<byte[]> ExportProductsToExcelAsync(CancellationToken cancellationToken = default);
    Task<byte[]> ExportProductsToPdfAsync(CancellationToken cancellationToken = default);

    Task<byte[]> ExportCustomersToExcelAsync(CancellationToken cancellationToken = default);
    Task<byte[]> ExportCustomersToPdfAsync(CancellationToken cancellationToken = default);

    Task<byte[]> ExportSalesToExcelAsync(CancellationToken cancellationToken = default);
    Task<byte[]> ExportSalesToPdfAsync(CancellationToken cancellationToken = default);
}
