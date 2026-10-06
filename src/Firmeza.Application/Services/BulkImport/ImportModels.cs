namespace Firmeza.Application.Services.BulkImport;

public enum ImportSeverity
{
    Warning,
    Error
}

public sealed class ImportValidationError
{
    public string SheetName { get; set; } = string.Empty;
    public int RowNumber { get; set; }
    public string Field { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public ImportSeverity Severity { get; set; } = ImportSeverity.Error;
    public string? RawValue { get; set; }
}

public sealed class ImportResult
{
    public bool Success => Errors.Count == 0 && (ProductsCreated + ProductsUpdated + CustomersCreated + CustomersUpdated + SalesCreated > 0);
    public int TotalRowsProcessed { get; set; }
    public int ProductsCreated { get; set; }
    public int ProductsUpdated { get; set; }
    public int CustomersCreated { get; set; }
    public int CustomersUpdated { get; set; }
    public int SalesCreated { get; set; }
    public List<ImportValidationError> Errors { get; } = new();
    public List<ImportValidationError> Warnings { get; } = new();

    public void AddError(string sheet, int row, string field, string message, string? rawValue = null)
    {
        Errors.Add(new ImportValidationError
        {
            SheetName = sheet,
            RowNumber = row,
            Field = field,
            Message = message,
            Severity = ImportSeverity.Error,
            RawValue = rawValue
        });
    }

    public void AddWarning(string sheet, int row, string field, string message, string? rawValue = null)
    {
        Warnings.Add(new ImportValidationError
        {
            SheetName = sheet,
            RowNumber = row,
            Field = field,
            Message = message,
            Severity = ImportSeverity.Warning,
            RawValue = rawValue
        });
    }
}
