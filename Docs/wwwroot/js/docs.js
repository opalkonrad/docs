var scheme = document.location.protocol === "https:" ? "wss" : "ws";
var port = document.location.port ? (":" + document.location.port) : "";

var uri = scheme + "://" + document.location.hostname + port + "/ws";

//var uri = "ws://" + window.location.host + "/ws";

function connect() {
    socket = new WebSocket(uri);

    socket.onopen = function (event) {
        console.log("opened connection to " + uri);
    };

    socket.onclose = function (event) {
        console.log("closed connection from " + uri);
    };

    socket.onmessage = function (event) {
        appendItem(list, event.data);
        console.log(event.data);
    };

    socket.onerror = function (event) {
        console.log("error: " + event.data);
    };
}
connect();

var list = document.getElementById("messages");
var button = document.getElementById("sendButton");


button.addEventListener("click", function () {

    var input = document.getElementById("textInput");
    sendMessage(input.value);

    input.value = "";
});

function sendMessage(message) {
    console.log("Sending: " + message);
    socket.send(message);
}

function appendItem(list, message) {
    var item = document.createElement("li");
    item.appendChild(document.createTextNode(message));
    list.appendChild(item);
}