using JabbR.ViewModels;
using Microsoft.AspNet.Mvc;

namespace JabbR.Controllers
{
    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            return View(new SettingsViewModel());
        }
    }
}