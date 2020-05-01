using Microsoft.AspNetCore.Http;
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
    public class WebSocketManagerMiddleware
    {
        private readonly RequestDelegate _next;
        private WebSocketHandler _webSocketHandler { get; set; }
        //private Socket socket;

        public WebSocketManagerMiddleware(RequestDelegate next, WebSocketHandler webSocketHandler)
        {
            _next = next;
            _webSocketHandler = webSocketHandler;
        }

        public async Task Invoke(HttpContext context)
        {
            if (!context.WebSockets.IsWebSocketRequest)
            {
                return;
            }

            // Create websocket to communicate with client
            WebSocket webSocket = await context.WebSockets.AcceptWebSocketAsync();
            _webSocketHandler.OnConnected(webSocket);

            // Create socket to communicate with server
            IPAddress ipAddress = IPAddress.Parse("25.144.142.114");
            int port = 1944;

            // Test
            IPHostEntry ipHostInfo = Dns.GetHostEntry("localhost");
            ipAddress = ipHostInfo.AddressList[0];
            port = 11000;

            IPEndPoint remoteEP = new IPEndPoint(ipAddress, port);
            Socket socket;

            try
            {
                socket = new Socket(ipAddress.AddressFamily, SocketType.Stream, ProtocolType.Tcp);
                socket.Connect(remoteEP);

                Thread serverReceiver = new Thread(new ThreadStart(() => receiveFromServer(socket, webSocket)));
                serverReceiver.Start();
            }
            catch (Exception)
            {
                await _webSocketHandler.SendMessageAsync(webSocket, "Could not connect to external server");
                await _webSocketHandler.OnDisconnected(webSocket);
                return;
            }

            await receiveFromClient(webSocket, socket);

        }


        private async Task receiveFromClient(WebSocket webSocket, Socket socket)
        {
            byte[] buffer = new byte[1024 * 4];
            CancellationTokenSource cts = new CancellationTokenSource();
            WebSocketReceiveResult result;

            try
            {
                while (webSocket.State == WebSocketState.Open)
                {
                    // Set timeout
                    cts.CancelAfter(50000);

                    // Receive data from websocket
                    result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), cts.Token);

                    // Get rid of zeros
                    /*char[] msgReceived = Encoding.UTF8.GetChars(buffer, 0, result.Count);
                    char[] end = { Convert.ToChar('\n') };
                    char[] msg = msgReceived.Concat(end).ToArray();*/

                    // Send the data to the remote device
                    //socket.Send(Encoding.UTF8.GetBytes(msg, 0, result.Count + 1));
                    socket.Send(buffer);
                }
            }
            catch (OperationCanceledException)
            {
                // TODO Close socket connection with server in c++
                await _webSocketHandler.OnDisconnected(webSocket);
                socket.Close();
            }
            await _webSocketHandler.OnDisconnected(webSocket);
        }

        private void receiveFromServer(Socket socket, WebSocket webSocket)
        {
            while (socket.Connected)
            {
                byte[] buffer = new byte[1024 * 4];
                socket.ReceiveTimeout = 50000;
                try
                {
                    int bytesReceived = socket.Receive(buffer);
                    string msg = Encoding.UTF8.GetString(buffer);

                    _webSocketHandler.SendMessageAsync(webSocket, msg);
                }
                catch (SocketException e)
                {
                    _webSocketHandler.OnDisconnected(webSocket);
                    socket.Close();
                }
            }
        }
    }
}
