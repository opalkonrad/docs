using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Sockets;
using System.Net.WebSockets;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;

namespace Docs.Middleware
{
    public class SocketsMiddleware
    {
        private readonly RequestDelegate _next;
        private SocketsHandler _socketsHandler { get; set; }

        public SocketsMiddleware(RequestDelegate next, SocketsHandler socketsHandler)
        {
            _next = next;
            _socketsHandler = socketsHandler;
        }

        public async Task InvokeAsync(HttpContext httpContext)
        {
            if (!httpContext.WebSockets.IsWebSocketRequest)
            {
                await _next(httpContext);
            }

            // Create websocket to communicate with client and socket to communicate with server
            WebSocket webSocket = await httpContext.WebSockets.AcceptWebSocketAsync();
            Socket socket = _socketsHandler.CreateSocketConnWithWebSocket(webSocket);

            if (socket != null)
            {
                Task webSocketTask = _socketsHandler.ReceiveFromClient(webSocket, socket);
                Task socketTask = _socketsHandler.ReceiveFromServer(socket, webSocket);
                await webSocketTask;
                await socketTask;
            }

            await _next(httpContext);
        }
    }

    // Extension method used to add the middleware to the HTTP request pipeline
    public static class SocketsMiddlewareExtensions
    {
        public static IServiceCollection AddSocketsManager(this IServiceCollection services)
        {
            services.AddTransient<ConnectionManager>();
            services.AddTransient<SocketsHandler>();

            return services;
        }

        public static IApplicationBuilder MapSocketsMiddleware(this IApplicationBuilder app, PathString path, SocketsHandler handler)
        {
            return app.Map(path, (app) => app.UseMiddleware<SocketsMiddleware>(handler));
        }
    }
}
