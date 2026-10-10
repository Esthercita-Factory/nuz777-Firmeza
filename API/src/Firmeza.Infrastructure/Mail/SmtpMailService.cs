using System;
using System.Globalization;
using System.IO;
using System.Net.Mail;
using System.Threading;
using System.Threading.Tasks;
using Firmeza.Application.Abstractions;
using Firmeza.Domain.Entities;
using Firmeza.Domain.Enums;
using Firmeza.Domain.Services;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Firmeza.Infrastructure.Mail;

public sealed class SmtpMailService : IMailService
{
    private readonly MailOptions _options;
    private readonly ISmtpTransport _transport;
    private readonly ILogger<SmtpMailService> _logger;

    public SmtpMailService(
        IOptions<MailOptions> options,
        ISmtpTransport transport,
        ILogger<SmtpMailService> logger)
    {
        _options = options.Value;
        _transport = transport;
        _logger = logger;
    }

    public async Task SendSaleReceiptEmailAsync(
        string recipientEmail,
        string recipientName,
        Sale sale,
        byte[] pdfReceiptBytes,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(recipientEmail))
        {
            _logger.LogWarning("No se puede enviar comprobante: el cliente no tiene correo registrado.");
            return;
        }

        if (!_options.Enabled)
        {
            _logger.LogInformation("Envío de correos deshabilitado en configuración. Venta: {SaleNumber}", sale.SaleNumber);
            return;
        }

        if (string.IsNullOrWhiteSpace(_options.Password) && string.Equals(_options.Host, "smtp.gmail.com", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("Se omitió el envío SMTP hacia {Email} para venta {SaleNumber}: Mail:Password no está configurado aún. Configure la Contraseña de Aplicación de Gmail en appsettings.", recipientEmail, sale.SaleNumber);
            return;
        }

        try
        {
            using var message = new MailMessage
            {
                From = new MailAddress(_options.FromEmail, _options.FromName),
                Subject = $"Comprobante de Venta {sale.SaleNumber} - Firmeza Materiales",
                IsBodyHtml = true,
                Body = BuildReceiptHtml(recipientName, sale)
            };
            message.To.Add(new MailAddress(recipientEmail, recipientName));

            if (pdfReceiptBytes is { Length: > 0 })
            {
                using var stream = new MemoryStream(pdfReceiptBytes);
                var attachment = new Attachment(stream, $"comprobante_{sale.SaleNumber}.pdf", "application/pdf");
                message.Attachments.Add(attachment);

                await _transport.SendMailAsync(message, cancellationToken);
            }
            else
            {
                await _transport.SendMailAsync(message, cancellationToken);
            }

            _logger.LogInformation("Comprobante de venta {SaleNumber} enviado exitosamente a {Email}.", sale.SaleNumber, recipientEmail);
        }
        catch (Exception ex)
        {
            // "Fallo de correo no debe tumbar la venta: se registra y se avisa"
            _logger.LogError(ex, "Fallo al enviar correo con comprobante para la venta {SaleNumber} a {Email}.", sale.SaleNumber, recipientEmail);
        }
    }

    public async Task SendWelcomeEmailAsync(
        string recipientEmail,
        string recipientName,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(recipientEmail)) return;

        if (!_options.Enabled)
        {
            _logger.LogInformation("Envío de correos deshabilitado en configuración. Registro: {Email}", recipientEmail);
            return;
        }

        if (string.IsNullOrWhiteSpace(_options.Password) && string.Equals(_options.Host, "smtp.gmail.com", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("Se omitió el envío SMTP de bienvenida a {Email}: Mail:Password no está configurado aún.", recipientEmail);
            return;
        }

        try
        {
            using var message = new MailMessage
            {
                From = new MailAddress(_options.FromEmail, _options.FromName),
                Subject = "¡Bienvenido a Firmeza! Materiales de Construcción",
                IsBodyHtml = true,
                Body = BuildWelcomeHtml(recipientName, recipientEmail)
            };
            message.To.Add(new MailAddress(recipientEmail, recipientName));

            await _transport.SendMailAsync(message, cancellationToken);
            _logger.LogInformation("Correo de bienvenida enviado exitosamente a {Email}.", recipientEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Fallo al enviar correo de bienvenida a {Email}.", recipientEmail);
        }
    }

    public async Task SendAccountApprovedEmailAsync(
        string recipientEmail,
        string recipientName,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(recipientEmail)) return;

        if (!_options.Enabled)
        {
            _logger.LogInformation("Envío de correos deshabilitado en configuración. Aprobación: {Email}", recipientEmail);
            return;
        }

        if (string.IsNullOrWhiteSpace(_options.Password) && string.Equals(_options.Host, "smtp.gmail.com", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("Se omitió el envío SMTP de aprobación a {Email}: Mail:Password no está configurado aún.", recipientEmail);
            return;
        }

        try
        {
            using var message = new MailMessage
            {
                From = new MailAddress(_options.FromEmail, _options.FromName),
                Subject = "¡Su cuenta en Firmeza ha sido aprobada y activada!",
                IsBodyHtml = true,
                Body = BuildAccountApprovedHtml(recipientName, recipientEmail)
            };
            message.To.Add(new MailAddress(recipientEmail, recipientName));

            await _transport.SendMailAsync(message, cancellationToken);
            _logger.LogInformation("Correo de cuenta aprobada enviado exitosamente a {Email}.", recipientEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Fallo al enviar correo de cuenta aprobada a {Email}.", recipientEmail);
        }
    }

    private static string BuildReceiptHtml(string name, Sale sale)
    {
        var culture = new CultureInfo("es-CO");
        var taxes = InventoryCalculator.SplitTaxInclusive(sale.Total);
        var encodedName = System.Web.HttpUtility.HtmlEncode(name);

        var (statusLabel, statusStyle) = sale.Status switch
        {
            SaleStatus.Delivered => ("Entregada", "background-color: #dcfce7; color: #15803d; border: 1px solid #86efac;"),
            SaleStatus.Confirmed => ("Confirmada", "background-color: #dbeafe; color: #1d4ed8; border: 1px solid #93c5fd;"),
            SaleStatus.Cancelled => ("Cancelada", "background-color: #ffe4e6; color: #be123c; border: 1px solid #fecdd3;"),
            _ => ("Pendiente (En revisión)", "background-color: #fef3c7; color: #b45309; border: 1px solid #fde68a;")
        };

        var itemsRows = new System.Text.StringBuilder();
        if (sale.Details is { Count: > 0 })
        {
            foreach (var detail in sale.Details)
            {
                var prodName = System.Web.HttpUtility.HtmlEncode(detail.Product?.Name ?? $"Material (Ref: {detail.ProductId.ToString()[..8]})");
                itemsRows.Append($@"
                  <tr style=""border-bottom: 1px solid #f1f5f9;"">
                    <td style=""padding: 10px 12px; font-size: 13px; color: #0f172a; font-weight: 600;"">{prodName}</td>
                    <td style=""padding: 10px 12px; font-size: 13px; color: #475569; text-align: center;"">{detail.Quantity}</td>
                    <td style=""padding: 10px 12px; font-size: 13px; color: #475569; text-align: right;"">{detail.UnitPrice.ToString("C2", culture)}</td>
                    <td style=""padding: 10px 12px; font-size: 13px; color: #0f172a; text-align: right; font-weight: 700;"">{detail.Subtotal.ToString("C2", culture)}</td>
                  </tr>");
            }
        }

        var itemsTableSection = itemsRows.Length > 0
            ? $@"
              <div style=""margin: 22px 0 20px;"">
                <div style=""font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 8px;"">
                  Detalle de Materiales Solicitados
                </div>
                <table role=""presentation"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; border-collapse: collapse;"">
                  <thead>
                    <tr style=""background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;"">
                      <th style=""padding: 10px 12px; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; text-align: left;"">Producto</th>
                      <th style=""padding: 10px 12px; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; text-align: center;"">Cant.</th>
                      <th style=""padding: 10px 12px; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; text-align: right;"">Precio Unit.</th>
                      <th style=""padding: 10px 12px; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; text-align: right;"">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemsRows}
                  </tbody>
                </table>
              </div>"
            : string.Empty;

        return $@"<!DOCTYPE html>
<html lang=""es"">
<head>
  <meta charset=""utf-8"" />
  <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"" />
  <title>Comprobante de Venta {sale.SaleNumber} - Firmeza</title>
</head>
<body style=""margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #334155;"">
  <div style=""display: none; font-size: 1px; color: #0b0f19; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;"">
    Comprobante Oficial {sale.SaleNumber} · Firmeza Materiales de Construcción. Documento PDF adjunto.
  </div>

  <table role=""presentation"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""background-color: #0b0f19; padding: 32px 12px;"">
    <tr>
      <td align=""center"">
        <table role=""presentation"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""max-width: 620px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 60px -15px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.08);"">
          
          <!-- BANNER HERO PRINCIPAL -->
          <tr>
            <td style=""background: linear-gradient(135deg, #090d16 0%, #0f172a 50%, #1d4ed8 100%); padding: 36px 32px 30px; text-align: center; border-bottom: 3px solid #2563eb;"">
              <table role=""presentation"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"">
                <tr>
                  <td align=""center"">
                    <span style=""display: inline-block; padding: 4px 14px; background: rgba(59, 130, 246, 0.2); border: 1px solid rgba(96, 165, 250, 0.4); border-radius: 9999px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #93c5fd; margin-bottom: 12px;"">
                      ✦ Comprobante Oficial de Venta
                    </span>
                    <h1 style=""margin: 0 0 4px; font-size: 28px; font-weight: 900; letter-spacing: 2px; color: #ffffff; text-transform: uppercase;"">
                      FIRMEZA
                    </h1>
                    <div style=""margin-top: 6px; font-size: 16px; font-weight: 800; color: #60a5fa; letter-spacing: 0.5px;"">
                      Orden #{sale.SaleNumber}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CONTENIDO -->
          <tr>
            <td style=""padding: 32px 32px 24px; background-color: #ffffff;"">
              <h2 style=""margin: 0 0 10px; font-size: 18px; font-weight: 800; color: #0f172a;"">
                Estimado/a {encodedName},
              </h2>
              <p style=""margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #475569;"">
                Le confirmamos que su orden de materiales de construcción ha sido procesada exitosamente en nuestro sistema ERP. A continuación, compartimos el resumen oficial y la liquidación tributaria de su compra:
              </p>

              <!-- TARJETA DE RESUMEN FINANCIERO -->
              <table role=""presentation"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; margin-bottom: 16px; overflow: hidden;"">
                <tr>
                  <td style=""padding: 18px 20px;"">
                    <table role=""presentation"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"">
                      <tr>
                        <td style=""padding: 6px 0; font-size: 13px; color: #64748b;"">Número de Venta:</td>
                        <td style=""padding: 6px 0; font-size: 13px; font-weight: 700; color: #0f172a; text-align: right; font-family: monospace;"">{sale.SaleNumber}</td>
                      </tr>
                      <tr>
                        <td style=""padding: 6px 0; font-size: 13px; color: #64748b;"">Fecha de Emisión:</td>
                        <td style=""padding: 6px 0; font-size: 13px; font-weight: 600; color: #0f172a; text-align: right;"">{sale.SaleDate.ToLocalTime():dd/MM/yyyy HH:mm}</td>
                      </tr>
                      <tr>
                        <td style=""padding: 6px 0; font-size: 13px; color: #64748b;"">Estado Comercial:</td>
                        <td style=""padding: 6px 0; text-align: right;"">
                          <span style=""display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: 800; text-transform: uppercase; {statusStyle}"">
                            {statusLabel}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style=""padding: 6px 0; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 10px;"">Base Gravable (Subtotal):</td>
                        <td style=""padding: 6px 0; font-size: 13px; font-weight: 600; color: #0f172a; text-align: right; border-top: 1px solid #e2e8f0; padding-top: 10px;"">{taxes.SubtotalBase.ToString("C2", culture)}</td>
                      </tr>
                      <tr>
                        <td style=""padding: 6px 0; font-size: 13px; color: #64748b;"">IVA Liquidado ({InventoryCalculator.TaxRate:P0}):</td>
                        <td style=""padding: 6px 0; font-size: 13px; font-weight: 600; color: #0f172a; text-align: right;"">{taxes.Tax.ToString("C2", culture)}</td>
                      </tr>
                      <tr>
                        <td style=""padding: 10px 0 4px; font-size: 15px; font-weight: 800; color: #0f172a; border-top: 2px solid #cbd5e1;"">Total Facturado:</td>
                        <td style=""padding: 10px 0 4px; font-size: 20px; font-weight: 900; color: #2563eb; text-align: right; border-top: 2px solid #cbd5e1;"">{sale.Total.ToString("C2", culture)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- TABLA DE PRODUCTOS (SI ESTÁN DISPONIBLES) -->
              {itemsTableSection}

              <!-- AVISO DE ADJUNTO PDF -->
              <table role=""presentation"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; margin: 18px 0 24px;"">
                <tr>
                  <td style=""padding: 16px 18px;"">
                    <table role=""presentation"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"">
                      <tr>
                        <td width=""32"" valign=""top"">
                          <span style=""font-size: 22px;"">📎</span>
                        </td>
                        <td style=""padding-left: 10px;"">
                          <div style=""font-size: 13px; font-weight: 800; color: #1e40af;"">
                            Comprobante Oficial en Formato PDF Adjunto
                          </div>
                          <div style=""margin-top: 3px; font-size: 12px; line-height: 1.5; color: #1e3a8a;"">
                            Hemos adjuntado a este correo su documento oficial <strong>comprobante_{sale.SaleNumber}.pdf</strong> con desglose fiscal completo, firma autorizada y especificaciones para control en obra.
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- BOTÓN CTA -->
              <table role=""presentation"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""margin: 16px 0 24px;"">
                <tr>
                  <td align=""center"">
                    <a href=""http://localhost:5000/mis-compras"" target=""_blank"" style=""display: inline-block; padding: 13px 32px; background-color: #2563eb; color: #ffffff; font-size: 13px; font-weight: 800; text-decoration: none; border-radius: 10px; box-shadow: 0 6px 16px -2px rgba(37,99,235,0.35); text-transform: uppercase; letter-spacing: 0.5px;"">
                      Consultar Estado de mi Pedido →
                    </a>
                  </td>
                </tr>
              </table>

              <p style=""margin: 0; font-size: 12.5px; line-height: 1.55; color: #64748b; text-align: center;"">
                Si requiere soporte técnico, despacho programado o asesoría en sitio, puede responder a este mensaje o comunicarse a nuestra línea PBX (601) 745-9000.
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style=""background-color: #0f172a; padding: 22px 32px; text-align: center; color: #94a3b8; font-size: 11px; line-height: 1.6;"">
              <strong style=""color: #ffffff; font-size: 12px; letter-spacing: 0.5px;"">FIRMEZA S.A.S.</strong> · NIT 901.458.789-1<br />
              Cifrado TLS 1.3 · ERP Firmeza Cloud v2.0 · Documento Oficial Generado Electrónicamente
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>";
    }

    private static string BuildWelcomeHtml(string name, string? email = null)
    {
        var encodedName = System.Web.HttpUtility.HtmlEncode(name);

        return $@"<!DOCTYPE html>
<html lang=""es"">
<head>
  <meta charset=""utf-8"" />
  <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"" />
  <title>Bienvenido a Firmeza</title>
</head>
<body style=""margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #334155;"">
  <div style=""display: none; font-size: 1px; color: #0b0f19; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;"">
    Bienvenido a Firmeza · Su cuenta ha sido registrada con éxito. Centralice el suministro de materiales para sus obras.
  </div>

  <table role=""presentation"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""background-color: #0b0f19; padding: 32px 12px;"">
    <tr>
      <td align=""center"">
        <table role=""presentation"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""max-width: 620px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 60px -15px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.08);"">
          
          <!-- BANNER HERO PRINCIPAL -->
          <tr>
            <td style=""background: linear-gradient(135deg, #090d16 0%, #0f172a 50%, #1e3a8a 100%); padding: 40px 32px 34px; text-align: center; border-bottom: 3px solid #2563eb;"">
              <table role=""presentation"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"">
                <tr>
                  <td align=""center"">
                    <span style=""display: inline-block; padding: 4px 14px; background: rgba(59, 130, 246, 0.2); border: 1px solid rgba(96, 165, 250, 0.4); border-radius: 9999px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #93c5fd; margin-bottom: 16px;"">
                      ✦ Plataforma Oficial de Construcción
                    </span>
                    <h1 style=""margin: 0 0 6px; font-size: 32px; font-weight: 900; letter-spacing: 2px; color: #ffffff; text-transform: uppercase;"">
                      FIRMEZA
                    </h1>
                    <p style=""margin: 0; font-size: 12px; font-weight: 600; color: #94a3b8; letter-spacing: 1px; text-transform: uppercase;"">
                      Materiales de Construcción & Soluciones Estructurales
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CUERPO PRINCIPAL -->
          <tr>
            <td style=""padding: 36px 32px 28px; background-color: #ffffff;"">
              <h2 style=""margin: 0 0 14px; font-size: 20px; font-weight: 800; color: #0f172a;"">
                ¡Bienvenido/a, {encodedName}!
              </h2>
              <p style=""margin: 0 0 20px; font-size: 14px; line-height: 1.65; color: #475569;"">
                Su cuenta ha sido registrada satisfactoriamente en el ecosistema digital de <strong>Ferretería Firmeza</strong>. Desde este momento cuenta con un aliado estratégico para el suministro ágil y confiable de materiales certificados para sus proyectos constructivos, remodelaciones e infraestructura.
              </p>

              <!-- CAJA DE ESTADO DE LA CUENTA -->
              <table role=""presentation"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 14px; margin: 20px 0 26px; overflow: hidden;"">
                <tr>
                  <td style=""padding: 16px 20px;"">
                    <table role=""presentation"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"">
                      <tr>
                        <td width=""36"" valign=""top"">
                          <div style=""width: 28px; height: 28px; background-color: #16a34a; border-radius: 8px; text-align: center; line-height: 28px; color: #ffffff; font-weight: 900; font-size: 14px;"">
                            ✓
                          </div>
                        </td>
                        <td style=""padding-left: 10px;"">
                          <div style=""font-size: 13px; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;"">
                            Solicitud Registrada · En Proceso de Activación
                          </div>
                          <div style=""margin-top: 4px; font-size: 12.5px; line-height: 1.5; color: #15803d;"">
                            Un asesor de Firmeza verificará sus datos fiscales para habilitar compras directas y líneas de despacho. Mientras tanto, ya puede consultar el catálogo público completo.
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- BENEFICIOS CORPORATIVOS -->
              <div style=""font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 12px;"">
                Beneficios de su cuenta corporativa
              </div>

              <!-- Tarjeta 1: Catálogo -->
              <table role=""presentation"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""margin-bottom: 10px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;"">
                <tr>
                  <td style=""padding: 14px 16px;"">
                    <table role=""presentation"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"">
                      <tr>
                        <td width=""36"" valign=""top"">
                          <span style=""font-size: 20px;"">📦</span>
                        </td>
                        <td style=""padding-left: 8px;"">
                          <div style=""font-size: 13.5px; font-weight: 700; color: #0f172a;"">Catálogo y Existencias en Vivo</div>
                          <div style=""font-size: 12px; line-height: 1.45; color: #64748b; margin-top: 2px;"">
                            Aceros, cementos, arenas, tuberías y acabados con inventario sincronizado en tiempo real.
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Tarjeta 2: Facturas PDF -->
              <table role=""presentation"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""margin-bottom: 10px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;"">
                <tr>
                  <td style=""padding: 14px 16px;"">
                    <table role=""presentation"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"">
                      <tr>
                        <td width=""36"" valign=""top"">
                          <span style=""font-size: 20px;"">🧾</span>
                        </td>
                        <td style=""padding-left: 8px;"">
                          <div style=""font-size: 13.5px; font-weight: 700; color: #0f172a;"">Comprobantes Oficiales en PDF</div>
                          <div style=""font-size: 12px; line-height: 1.45; color: #64748b; margin-top: 2px;"">
                            Liquidación automática de IVA (19%) y envío inmediato del PDF oficial a su correo electrónico.
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Tarjeta 3: Logística -->
              <table role=""presentation"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""margin-bottom: 24px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;"">
                <tr>
                  <td style=""padding: 14px 16px;"">
                    <table role=""presentation"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"">
                      <tr>
                        <td width=""36"" valign=""top"">
                          <span style=""font-size: 20px;"">🚚</span>
                        </td>
                        <td style=""padding-left: 8px;"">
                          <div style=""font-size: 13.5px; font-weight: 700; color: #0f172a;"">Trazabilidad y Despacho en Obra</div>
                          <div style=""font-size: 12px; line-height: 1.45; color: #64748b; margin-top: 2px;"">
                            Seguimiento transparente de pedidos: desde la cotización hasta la entrega final en su sitio de obra.
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- BOTÓN DE ACCIÓN (CTA) -->
              <table role=""presentation"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""margin: 16px 0 28px;"">
                <tr>
                  <td align=""center"">
                    <a href=""http://localhost:5000/tienda"" target=""_blank"" style=""display: inline-block; padding: 14px 36px; background-color: #2563eb; color: #ffffff; font-size: 14px; font-weight: 800; text-decoration: none; border-radius: 12px; box-shadow: 0 8px 20px -4px rgba(37,99,235,0.4); text-transform: uppercase; letter-spacing: 0.5px;"">
                      Explorar Catálogo Público →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- CANALES DE SOPORTE -->
              <table role=""presentation"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""border-top: 1px solid #f1f5f9; padding-top: 20px;"">
                <tr>
                  <td align=""center"" style=""font-size: 12px; color: #64748b; line-height: 1.6;"">
                    <strong>Canales de atención al cliente:</strong><br />
                    PBX: (601) 745-9000 · WhatsApp: +57 310 123 4567<br />
                    Correo: contacto@firmeza.com · Horario: Lunes a Sábado 7:00 a.m. - 6:00 p.m.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER CORPORATIVO -->
          <tr>
            <td style=""background-color: #0f172a; padding: 24px 32px; text-align: center; color: #94a3b8; font-size: 11px; line-height: 1.6;"">
              <strong style=""color: #ffffff; font-size: 12px; letter-spacing: 0.5px;"">FIRMEZA S.A.S.</strong> · NIT 901.458.789-1<br />
              Av. Carrera 68 # 45-20, Bogotá D.C., Colombia<br />
              Cifrado TLS 1.3 · Sistema ERP & E-Commerce Firmeza Cloud v2.0
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>";
    }

    private static string BuildAccountApprovedHtml(string name, string? email = null)
    {
        var encodedName = System.Web.HttpUtility.HtmlEncode(name);

        return $@"<!DOCTYPE html>
<html lang=""es"">
<head>
  <meta charset=""utf-8"" />
  <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"" />
  <title>Cuenta Aprobada - Firmeza</title>
</head>
<body style=""margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #334155;"">
  <table role=""presentation"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""background-color: #0b0f19; padding: 32px 12px;"">
    <tr>
      <td align=""center"">
        <table role=""presentation"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""max-width: 620px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 60px -15px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.08);"">
          
          <!-- BANNER HERO -->
          <tr>
            <td style=""background: linear-gradient(135deg, #090d16 0%, #064e3b 50%, #0f172a 100%); padding: 36px 32px 30px; text-align: center; border-bottom: 3px solid #10b981;"">
              <table role=""presentation"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"">
                <tr>
                  <td align=""center"">
                    <span style=""display: inline-block; padding: 4px 14px; background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(52, 211, 153, 0.4); border-radius: 9999px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #6ee7b7; margin-bottom: 12px;"">
                      ✦ Validación Exitosa
                    </span>
                    <h1 style=""margin: 0 0 4px; font-size: 28px; font-weight: 900; letter-spacing: 2px; color: #ffffff; text-transform: uppercase;"">
                      FIRMEZA
                    </h1>
                    <div style=""margin-top: 6px; font-size: 15px; font-weight: 700; color: #34d399;"">
                      ¡Su cuenta ha sido aprobada y activada!
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CUERPO -->
          <tr>
            <td style=""padding: 32px 32px 24px; background-color: #ffffff;"">
              <h2 style=""margin: 0 0 12px; font-size: 18px; font-weight: 800; color: #0f172a;"">
                Estimado/a {encodedName},
              </h2>
              <p style=""margin: 0 0 20px; font-size: 14px; line-height: 1.65; color: #475569;"">
                Nos complace informarle que nuestro equipo administrativo ha verificado sus datos y su cuenta en <strong>Firmeza</strong> ha sido habilitada exitosamente. A partir de este momento puede realizar órdenes de compra, solicitar materiales y gestionar sus pedidos con despacho en obra.
              </p>

              <!-- CAJA VERDE -->
              <table role=""presentation"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; margin-bottom: 24px;"">
                <tr>
                  <td style=""padding: 16px 18px;"">
                    <div style=""font-size: 13px; font-weight: 800; color: #166534;"">
                      ✓ Acceso Inmediato Habilitado
                    </div>
                    <div style=""margin-top: 4px; font-size: 12.5px; line-height: 1.5; color: #15803d;"">
                      Inicie sesión con su correo o documento registrado para acceder a precios de cliente y gestionar compras.
                    </div>
                  </td>
                </tr>
              </table>

              <!-- BOTÓN CTA -->
              <table role=""presentation"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""margin: 16px 0 24px;"">
                <tr>
                  <td align=""center"">
                    <a href=""http://localhost:5000/login"" target=""_blank"" style=""display: inline-block; padding: 13px 36px; background-color: #059669; color: #ffffff; font-size: 13.5px; font-weight: 800; text-decoration: none; border-radius: 10px; box-shadow: 0 6px 16px -2px rgba(5,150,105,0.35); text-transform: uppercase; letter-spacing: 0.5px;"">
                      Iniciar Sesión y Comprar →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style=""background-color: #0f172a; padding: 22px 32px; text-align: center; color: #94a3b8; font-size: 11px; line-height: 1.6;"">
              <strong style=""color: #ffffff; font-size: 12px; letter-spacing: 0.5px;"">FIRMEZA S.A.S.</strong> · NIT 901.458.789-1<br />
              Cifrado TLS 1.3 · ERP Firmeza Cloud v2.0
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>";
    }
}
