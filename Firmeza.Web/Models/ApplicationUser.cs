using Microsoft.AspNetCore.Identity;

namespace Firmeza.Web.Models;

public class ApplicationUser : IdentityUser
{
    public string FullName { get; set; } = string.Empty;
}
