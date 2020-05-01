var scheme = document.location.protocol === "https:" ? "wss" : "ws";
var port = document.location.port ? (":" + document.location.port) : "";

var uri = scheme + "://" + document.location.hostname + port + "/ws";

var info = document.getElementById("info");
var docs = document.getElementById("docs");
var list = document.getElementById("messages");
var button = document.getElementById("sendButton");



function connect() {
    socket = new WebSocket(uri);

    socket.onopen = function (event) {
        info.value += "opened connection to " + uri;
    };

    socket.onclose = function (event) {
        info.value += "closed connection from " + uri;
    };

    socket.onmessage = function (event) {
        docs.value += event.data;
    };

    socket.onerror = function (event) {
        info.value += "error: " + event.data;
    };
}

connect();


setInterval(send, 5000);
function send() {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        alert("socket not connected");
    }

    socket.send(docs.value);
};






