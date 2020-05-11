var scheme = document.location.protocol === "https:" ? "wss" : "ws";
var port = document.location.port ? (":" + document.location.port) : "";

var uri = scheme + "://" + document.location.hostname + port + "/ws";

var info = document.getElementById("info");
var docs = document.getElementById("docs");
var list = document.getElementById("messages");
var button = document.getElementById("sendButton");


socket = new WebSocket(uri);

socket.onopen = function (event) {
    info.value += "Opened connection to " + uri;
};

socket.onclose = function (event) {
    info.value += "Closed connection from " + uri;
};

socket.onerror = function (event) {
    info.value += "Error: " + event.data;
};

socket.onmessage = function (event) {
    event.data
    docs.value += event.data;
};

//setInterval(send, 5000);
var sendButton = document.getElementById("sendButton");
sendButton.onclick = function () {
    send();
};
function send() {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        alert("socket not connected");
    }

    socket.send(docs.value);
};


