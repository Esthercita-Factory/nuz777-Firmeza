namespace Firmeza.Infrastructure.Mail;

public sealed class MailOptions
{
    public const string SectionName = "Mail";

    /// <summary>
    /// Proveedor de correo: "Smtp" o "SendGrid".
    /// </summary>
    public string Provider { get; set; } = "Smtp";

    /// <summary>
    /// Habilita o deshabilita globalmente el envío de correos.
    /// </summary>
    public bool Enabled { get; set; } = true;

    /// <summary>
    /// Host del servidor SMTP (por ej: smtp.gmail.com).
    /// </summary>
    public string Host { get; set; } = "smtp.gmail.com";

    /// <summary>
    /// Puerto SMTP (587 para TLS/STARTTLS, 465 para SSL, 25 para local).
    /// </summary>
    public int Port { get; set; } = 587;

    /// <summary>
    /// Indica si se requiere conexión segura SSL/TLS.
    /// </summary>
    public bool EnableSsl { get; set; } = true;

    /// <summary>
    /// Usuario o correo para autenticación SMTP.
    /// </summary>
    public string UserName { get; set; } = "ivandavidmejiamendez@gmail.com";

    /// <summary>
    /// Contraseña de aplicación o clave SMTP.
    /// </summary>
    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// Dirección de remitente.
    /// </summary>
    public string FromEmail { get; set; } = "ivandavidmejiamendez@gmail.com";

    /// <summary>
    /// Nombre visible del remitente.
    /// </summary>
    public string FromName { get; set; } = "Firmeza Materiales";

    /// <summary>
    /// Clave de API en caso de usar SendGrid en lugar de SMTP directo.
    /// </summary>
    public string? SendGridApiKey { get; set; }
}
