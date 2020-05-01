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
        private ConcurrentDictionary<string, WebSocket> sockets = new ConcurrentDictionary<string, WebSocket>();

        public ConcurrentDictionary<string, WebSocket> GetAll()
        {
            return sockets;
        }

        public WebSocket GetWebSocket(string id)
        {
            return sockets.FirstOrDefault(p => p.Key == id).Value;
        }

        public string GetId(WebSocket webSocket)
        {
            return sockets.FirstOrDefault(p => p.Value == webSocket).Key;
        }

        public void AddSockets(WebSocket webSocket)
        {
            sockets.TryAdd(CreateConnectionId(), webSocket);
        }

        public async Task RemoveSockets(string id)
        {
            sockets.TryRemove(id, out WebSocket webSocket);

            await webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Normal closure", CancellationToken.None);
        }

        private string CreateConnectionId()
        {
            return Guid.NewGuid().ToString();
        }
    }
}


/*
 * private ConcurrentDictionary<string, Tuple<WebSocket, Socket>> sockets = new ConcurrentDictionary<string, Tuple<WebSocket, Socket>>();

        public ConcurrentDictionary<string, Tuple<WebSocket, Socket>> GetAll()
        {
            return sockets;
        }

        public Tuple<WebSocket, Socket> GetSockets(string id)
        {
            return sockets.FirstOrDefault(p => p.Key == id).Value;
        }

        public string GetId(WebSocket webSocket)
        {
            return sockets.FirstOrDefault(p => p.Value.Item1 == webSocket).Key;
        }

        public string GetId(Socket socket)
        {
            return sockets.FirstOrDefault(p => p.Value.Item2 == socket).Key;
        }

        public void AddSockets(WebSocket webSocket, Socket socket)
        {
            sockets.TryAdd(CreateConnectionId(), Tuple.Create(webSocket, socket));
        }

        public async Task RemoveSockets(string id)
        {
            sockets.TryRemove(id, out Tuple<WebSocket, Socket> socketPair);

            socketPair.Item2.Close();
            await socketPair.Item1.CloseAsync(WebSocketCloseStatus.NormalClosure, "Normal closure", CancellationToken.None);
        }

        private string CreateConnectionId()
        {
            return Guid.NewGuid().ToString();
        }
*/