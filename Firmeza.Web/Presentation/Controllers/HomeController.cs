using System.Diagnostics;
using Firmeza.Web.Presentation.ViewModels;
using Firmeza.Domain.Identity;
using Firmeza.Infrastructure.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Firmeza.Web.Presentation.Controllers;

public class HomeController : Controller
{
    public IActionResult Index()
    {
        if (User.IsInRole(ApplicationRoles.Administrator))
        {
            return RedirectToAction("Index", "Dashboard");
        }

        return View();
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}
