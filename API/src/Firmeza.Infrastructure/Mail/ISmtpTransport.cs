using System.Net.Mail;
using System.Threading;
using System.Threading.Tasks;

namespace Firmeza.Infrastructure.Mail;

public interface ISmtpTransport
{
    Task SendMailAsync(MailMessage message, CancellationToken cancellationToken = default);
}
