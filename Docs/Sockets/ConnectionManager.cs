using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Net.Sockets;
using System.Net.WebSockets;
using System.Threading;
using System.Threading.Tasks;

namespace Docs.Sockets
{
    public class ConnectionManager
    {
        private ConcurrentDictionary<string, WebSocket> webSockets = new ConcurrentDictionary<string, WebSocket>();

        public ConcurrentDictionary<string, WebSocket> GetAll()
        {
            return webSockets;
        }

        public WebSocket GetWebSocket(string id)
        {
            return webSockets.FirstOrDefault(p => p.Key == id).Value;
        }

        public string GetId(WebSocket webSocket)
        {
            return webSockets.FirstOrDefault(p => p.Value == webSocket).Key;
        }

        public void AddSocket(WebSocket webSocket)
        {
            webSockets.TryAdd(CreateConnectionId(), webSocket);
        }

        public async Task RemoveSocket(string id)
        {
            webSockets.TryRemove(id, out WebSocket webSocket);

            await webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Normal closure", CancellationToken.None);
        }

        private string CreateConnectionId()
        {
            return Guid.NewGuid().ToString();
        }
    }
}
