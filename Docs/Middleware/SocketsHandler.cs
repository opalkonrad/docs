using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace Docs.Middleware
{
    public class SocketsHandler
    {
        // ManualResetEvent instances signal completion.  
        
        private ManualResetEvent connectDone = new ManualResetEvent(false);

        private readonly IPAddress ipAddress = IPAddress.Parse("25.144.142.114");
        private readonly int port = 1944;

        private ConnectionManager connectionManager { get; set; }

        public SocketsHandler(ConnectionManager connManager)
        {
            connectionManager = connManager;
        }

        public Socket CreateSocketConnWithWebSocket(WebSocket webSocket)
        {
            // Connect to a remote device.  
            try
            {
                connectDone = new ManualResetEvent(false);
                // Establish the remote endpoint for the socket
                IPEndPoint remoteEP = new IPEndPoint(ipAddress, port);


                // Create a TCP/IP socket.  
                Socket socket = new Socket(ipAddress.AddressFamily,
                    SocketType.Stream, ProtocolType.Tcp);

                // Connect to the remote endpoint.  
                socket.BeginConnect(remoteEP, new AsyncCallback(ConnectCallback), socket);
                connectDone.WaitOne();

                OnConnected(webSocket, socket);
                return socket;
            }
            catch (Exception)
            {
                return null;
            }
        }

        public void OnConnected(WebSocket webSocket, Socket socket)
        {
            connectionManager.AddSockets(webSocket, socket);
        }

        public async Task OnDisconnected(WebSocket webSocket)
        {
            await connectionManager.RemoveSockets(connectionManager.GetId(webSocket));
        }

        public async Task OnDisconnected(Socket socket)
        {
            await connectionManager.RemoveSockets(connectionManager.GetId(socket));
        }

        public async Task SendMsgToWebSocket(WebSocket webSocket, string message)
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
            await SendMsgToWebSocket(connectionManager.GetSockets(webSocketId).Item1, message);
        }



        public async Task ReceiveFromClient(WebSocket webSocket, Socket socket)
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
                    char[] msgReceived = Encoding.UTF8.GetChars(buffer, 0, result.Count);
                    char[] end = { Convert.ToChar('\n') };
                    char[] msg = msgReceived.Concat(end).ToArray();

                    // Send the data to the remote device
                    socket.Send(Encoding.UTF8.GetBytes(msg, 0, result.Count + 1));
                }
            }
            catch (OperationCanceledException)
            {
                // Close websocket and socket connections
                await OnDisconnected(socket);
            }
        }

        public async Task ReceiveFromServer(Socket socket, WebSocket webSocket)
        {
            JsonParser jsonParser = new JsonParser();
            List<string> parsedJsons;

            while (socket.Connected)
            {
                byte[] buffer = new byte[1024 * 4];
                socket.ReceiveTimeout = 50000;
                try
                {
                    int bytesReceived = socket.Receive(buffer);
                    string message = Encoding.UTF8.GetString(buffer, 0, bytesReceived);

                    parsedJsons = jsonParser.Parse(message);

                    foreach (string msg in parsedJsons)
                    {
                        await SendMsgToWebSocket(webSocket, msg);
                    }
                }
                catch (SocketException)
                {
                    await OnDisconnected(webSocket);
                }
            }
        }



        private void ConnectCallback(IAsyncResult ar)
        {
            try
            {
                // Retrieve the socket from the state object.  
                Socket client = (Socket)ar.AsyncState;

                // Complete the connection.  
                client.EndConnect(ar);

                // Signal that the connection has been made.  
                connectDone.Set();
            }
            catch (Exception)
            {
                connectDone.Set();
            }
        }
    }
}
