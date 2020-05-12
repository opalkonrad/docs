using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Docs.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.VisualStudio.Web.CodeGeneration.Contracts.Messaging;

namespace Docs.Controllers
{
    public class DocsController : Controller
    {
        [HttpPost, ValidateAntiForgeryToken]
        public IActionResult Index(ConnectionInfo connInfo)
        {
            return View(connInfo);
        }
    }
}