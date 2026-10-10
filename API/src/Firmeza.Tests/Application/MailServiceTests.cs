using System;
using System.IO;
using System.Net.Mail;
using System.Threading;
using System.Threading.Tasks;
using Firmeza.Application.Abstractions;
using Firmeza.Application.Services.Receipts;
using Firmeza.Domain.Entities;
using Firmeza.Domain.Enums;
using Firmeza.Infrastructure.Mail;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Xunit;

namespace Firmeza.Tests.Application;

public class MailServiceTests
{
    private readonly ISmtpTransport _transport = Substitute.For<ISmtpTransport>();
    private readonly ILogger<SmtpMailService> _logger = Substitute.For<ILogger<SmtpMailService>>();

    private SmtpMailService CreateService(MailOptions? options = null)
    {
        var opt = options ?? new MailOptions
        {
            Enabled = true,
            Host = "smtp.test.local",
            Port = 587,
            UserName = "test@firmeza.local",
            Password = "secret-password",
            FromEmail = "noreply@firmeza.local",
            FromName = "Firmeza ERP"
        };

        return new SmtpMailService(Options.Create(opt), _transport, _logger);
    }

    [Fact]
    public async Task SendSaleReceiptEmailAsync_SendsEmailWithPdfAttachment()
    {
        var sut = CreateService();
        var sale = new Sale
        {
            Id = Guid.NewGuid(),
            SaleNumber = "VTA-20261010-0001",
            SaleDate = DateTimeOffset.UtcNow,
            Total = 150000m,
            Status = SaleStatus.Confirmed
        };
        var pdfBytes = new byte[] { 1, 2, 3, 4, 5 };

        string? toAddress = null;
        string? subject = null;
        string? body = null;
        string? attachmentName = null;
        string? attachmentMediaType = null;
        var attachmentCount = 0;

        await _transport.SendMailAsync(Arg.Do<MailMessage>(msg =>
        {
            toAddress = msg.To[0].Address;
            subject = msg.Subject;
            body = msg.Body;
            attachmentCount = msg.Attachments.Count;
            if (attachmentCount > 0)
            {
                attachmentName = msg.Attachments[0].Name;
                attachmentMediaType = msg.Attachments[0].ContentType.MediaType;
            }
        }), Arg.Any<CancellationToken>());

        await sut.SendSaleReceiptEmailAsync("cliente@empresa.com", "Carlos Perez", sale, pdfBytes);

        Assert.Equal("cliente@empresa.com", toAddress);
        Assert.NotNull(subject);
        Assert.Contains(sale.SaleNumber, subject);
        Assert.NotNull(body);
        Assert.Contains("Carlos Perez", body);
        Assert.Equal(1, attachmentCount);
        Assert.Equal($"comprobante_{sale.SaleNumber}.pdf", attachmentName);
        Assert.Equal("application/pdf", attachmentMediaType);
    }

    [Fact]
    public async Task SendWelcomeEmailAsync_SendsWelcomeMessage()
    {
        var sut = CreateService();
        string? toAddress = null;
        string? subject = null;
        string? body = null;

        await _transport.SendMailAsync(Arg.Do<MailMessage>(msg =>
        {
            toAddress = msg.To[0].Address;
            subject = msg.Subject;
            body = msg.Body;
        }), Arg.Any<CancellationToken>());

        await sut.SendWelcomeEmailAsync("nuevo@empresa.com", "Maria Gomez");

        Assert.Equal("nuevo@empresa.com", toAddress);
        Assert.NotNull(subject);
        Assert.Contains("Bienvenido", subject);
        Assert.NotNull(body);
        Assert.Contains("Maria Gomez", body);
    }

    [Fact]
    public async Task SendSaleReceiptEmailAsync_WhenTransportFails_DoesNotThrow()
    {
        var sut = CreateService();
        var sale = new Sale
        {
            Id = Guid.NewGuid(),
            SaleNumber = "VTA-20261010-9999",
            SaleDate = DateTimeOffset.UtcNow,
            Total = 50000m
        };

        _transport.SendMailAsync(Arg.Any<MailMessage>(), Arg.Any<CancellationToken>())
            .ThrowsAsync(new SmtpException("Error de conexión al servidor de correo"));

        // No debe lanzar excepción ("Fallo de correo no debe tumbar la venta")
        var exception = await Record.ExceptionAsync(() =>
            sut.SendSaleReceiptEmailAsync("error@empresa.com", "Cliente Falla", sale, [1, 2, 3]));

        Assert.Null(exception);
    }

    [Fact]
    public async Task SendSaleReceiptEmailAsync_WhenDisabled_DoesNotSend()
    {
        var sut = CreateService(new MailOptions { Enabled = false });
        var sale = new Sale
        {
            Id = Guid.NewGuid(),
            SaleNumber = "VTA-20261010-0002",
            SaleDate = DateTimeOffset.UtcNow,
            Total = 10000m
        };

        await sut.SendSaleReceiptEmailAsync("nadie@empresa.com", "Test", sale, [1]);

        await _transport.DidNotReceive().SendMailAsync(Arg.Any<MailMessage>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task SendAccountApprovedEmailAsync_SendsApprovalMessage()
    {
        var sut = CreateService();
        string? toAddress = null;
        string? subject = null;
        string? body = null;

        await _transport.SendMailAsync(Arg.Do<MailMessage>(msg =>
        {
            toAddress = msg.To[0].Address;
            subject = msg.Subject;
            body = msg.Body;
        }), Arg.Any<CancellationToken>());

        await sut.SendAccountApprovedEmailAsync("aprobado@empresa.com", "Juan Perez");

        Assert.Equal("aprobado@empresa.com", toAddress);
        Assert.NotNull(subject);
        Assert.Contains("aprobada", subject);
        Assert.NotNull(body);
        Assert.Contains("Juan Perez", body);
    }

    [Fact(Skip = "Envío manual a servidor SMTP real")]
    public async Task SendLiveWelcomeAndReceiptEmails()
    {
        var options = new MailOptions
        {
            Enabled = true,
            Host = "smtp.gmail.com",
            Port = 587,
            EnableSsl = true,
            UserName = "ivandavidmejiamendez@gmail.com",
            Password = "saesxllihmdwdfuw",
            FromEmail = "ivandavidmejiamendez@gmail.com",
            FromName = "Firmeza Materiales de Construcción"
        };

        var realTransport = new SystemSmtpTransport(Options.Create(options));
        var sut = new SmtpMailService(Options.Create(options), realTransport, _logger);

        // 1. Enviar correo de bienvenida con banner corporativo
        await sut.SendWelcomeEmailAsync(
            "ivandavidmejiamendez@gmail.com",
            "Iván David Mejía Méndez");

        // 2. Generar venta de demostración con productos reales y PDF
        var sale = new Sale
        {
            Id = Guid.NewGuid(),
            SaleNumber = "VTA-20261010-0088",
            SaleDate = DateTimeOffset.UtcNow,
            Total = 485000m,
            Status = SaleStatus.Confirmed,
            Customer = new Customer
            {
                Id = Guid.NewGuid(),
                FullName = "Iván David Mejía Méndez",
                Document = "1020304050",
                Email = "ivandavidmejiamendez@gmail.com",
                Phone = "3101234567"
            }
        };

        sale.Details.Add(new SaleDetail
        {
            ProductId = Guid.NewGuid(),
            Product = new Product { Name = "Cemento Gris Uso General Argos 50 kg", Sku = "CEM-ARG-050", Price = 34500m },
            Quantity = 10,
            UnitPrice = 34500m,
            Subtotal = 345000m
        });

        sale.Details.Add(new SaleDetail
        {
            ProductId = Guid.NewGuid(),
            Product = new Product { Name = "Varilla Corrugada 1/2 pulgada x 6 m Diaco", Sku = "VAR-DIA-012", Price = 28000m },
            Quantity = 5,
            UnitPrice = 28000m,
            Subtotal = 140000m
        });

        var receiptService = new ReceiptService(Substitute.For<ISaleRepository>());
        var pdfBytes = receiptService.GenerateReceiptPdf(sale);

        // 3. Enviar correo de comprobante oficial con PDF adjunto
        await sut.SendSaleReceiptEmailAsync(
            "ivandavidmejiamendez@gmail.com",
            "Iván David Mejía Méndez",
            sale,
            pdfBytes);

        Assert.True(pdfBytes.Length > 1000);
    }
}
