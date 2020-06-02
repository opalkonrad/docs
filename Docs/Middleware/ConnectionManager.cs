using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Net.Sockets;
using System.Net.WebSockets;
using System.Threading;
using System.Threading.Tasks;

namespace Docs.Middleware
{
    public class ConnectionManager
    {
        private ConcurrentDictionary<string, Tuple<WebSocket, Socket>> sockets = new ConcurrentDictionary<string, Tuple<WebSocket, Socket>>();

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
            sockets.TryAdd(createConnectionId(), Tuple.Create(webSocket, socket));
        }

        public async Task RemoveSockets(string id, string message)
        {
            sockets.TryRemove(id, out Tuple<WebSocket, Socket> socketPair);

            // Close socket connection
            try
            {
                socketPair.Item2.Shutdown(SocketShutdown.Both);
            }
            finally
            {
                socketPair.Item2.Close();
            }

            // Close websocket connection
            await socketPair.Item1.CloseAsync(WebSocketCloseStatus.NormalClosure, message, CancellationToken.None);
        }

        private string createConnectionId()
        {
            return Guid.NewGuid().ToString();
        }
    }
}
