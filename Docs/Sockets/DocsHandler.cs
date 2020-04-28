using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace Docs.Sockets
{
    public class DocsHandler : WebSocketHandler
    {
        public DocsHandler(ConnectionManager webSocketConnectionManager) : base(webSocketConnectionManager)
        {

        }

        public override void OnConnected(WebSocket socket)
        {
            base.OnConnected(socket);
        }
    }
}
