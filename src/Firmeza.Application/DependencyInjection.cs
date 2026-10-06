using Firmeza.Application.Abstractions;
using Firmeza.Application.Services.Auth;
using Firmeza.Application.Services.BulkImport;
using Firmeza.Application.Services.CustomerRequests;
using Firmeza.Application.Services.Customers;
using Firmeza.Application.Services.Dashboard;
using Firmeza.Application.Services.Exports;
using Firmeza.Application.Services.Products;
using Firmeza.Application.Services.Receipts;
using Firmeza.Application.Services.Sales;
using Microsoft.Extensions.DependencyInjection;

namespace Firmeza.Application;

public static class ApplicationServiceCollectionExtensions
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IProductService, ProductService>();
        services.AddScoped<ICustomerService, CustomerService>();
        services.AddScoped<ICustomerRequestService, CustomerRequestService>();
        services.AddScoped<ISaleService, SaleService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IBulkImportService, BulkImportService>();
        services.AddScoped<IExportService, ExportService>();
        services.AddScoped<IReceiptService, ReceiptService>();

        return services;
    }
}
