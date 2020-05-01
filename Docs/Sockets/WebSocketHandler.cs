using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Sockets;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using static Docs.Sockets.DocsHandler;

namespace Docs.Sockets
{
    public abstract class WebSocketHandler
    {
        protected ConnectionManager connectionManager { get; set; }

        public WebSocketHandler(ConnectionManager connManager)
        {
            connectionManager = connManager;
        }

        public virtual void OnConnected(WebSocket webSocket)
        {
            connectionManager.AddSockets(webSocket);
        }

        public virtual async Task OnDisconnected(WebSocket webSocket)
        {
            await connectionManager.RemoveSockets(connectionManager.GetId(webSocket));
        }

        public async Task SendMessageAsync(WebSocket webSocket, string message)
        {
            if (webSocket.State != WebSocketState.Open)
            {
                return;
            }

            await webSocket.SendAsync(new ArraySegment<byte>(array: Encoding.ASCII.GetBytes(message),
                                                                    offset: 0,
                                                                    count: message.Length),
                                    WebSocketMessageType.Text,
                                    true,
                                    CancellationToken.None);
        }

        

        public async Task SendMessageAsync(string webSocketId, string message)
        {
            await SendMessageAsync(connectionManager.GetWebSocket(webSocketId), message);
        }

        public async Task SendMessageToAllAsync(string message)
        {
            foreach (var pair in connectionManager.GetAll())
            {
                if (pair.Value.State == WebSocketState.Open)
                    await SendMessageAsync(pair.Value, message);
            }
        }
    }
}
