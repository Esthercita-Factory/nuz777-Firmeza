using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace Firmeza.Application.Services.BulkImport;

public interface IBulkImportService
{
    Task<ImportResult> ImportFromExcelAsync(Stream excelStream, CancellationToken cancellationToken = default);

    Task<byte[]> GenerateImportTemplateAsync();
}
