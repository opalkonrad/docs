/* editor */
var cntr = 0;
var addBtn = document.getElementById('add');
var editor = document.getElementById('editor');


addBtn.addEventListener('click', function () {
    // Add paragraph
    addParagraph('init data');
});

function addParagraph(data) {
    // Append div element
    var node = document.createElement('DIV');
    node.setAttribute("id", cntr);
    document.getElementById('editor').appendChild(node);

    // Create editor instance
    tinymce.init({
        selector: '#' + cntr,
        inline: true,
        setup: function (editor) {
            editor.on('click', function (e) {
                console.log('instance clicked');
            });

            editor.on('init', function (e) {
                this.setContent(data);
            });

            editor.on('keydown', function (e) {
                if (13 === e.keyCode) {
                    e.preventDefault();
                    alert('pressed enter');
                }
            });
        },
        toolbar: "bold italic underline | copy cut paste | fontselect fontsizeselect | backcolor forecolor | h1 h2 h3 h4 h5 h6 | removeformat",
        menubar: false,
        font_formats: 'Arial=arial,helvetica,sans-serif; Courier New=courier new,courier,monospace; Times New Roman=times new roman,times'
    });

    // Increase counter for next paragraph (div's id)
    cntr++;
}


/* web socket */
var scheme = document.location.protocol === "https:" ? "wss" : "ws";
var port = document.location.port ? (":" + document.location.port) : "";
var connMode = document.currentScript.getAttribute('data-conn-mode');
var docsId = document.currentScript.getAttribute('data-docs-id');

var uri = scheme + "://" + document.location.hostname + port + "/ws";


socket = new WebSocket(uri);

var uid;

socket.onopen = function (event) {
    console.log("Opened connection to " + uri);

    if (connMode == 'Open') {
        socket.send('{"action":"open","uid":"' + docsId + '"}');
    }
    else if (connMode == 'Create') {
        socket.send('{"action":"create","name":"' + docsId + '"}');
    }
};

socket.onclose = function (event) {
    console.log("Closed connection from " + uri);
};

socket.onerror = function (event) {
    console.log(info.value += "Error: " + event.data);
};

socket.onmessage = function (event) {
    console.log(event.data);

    var response = JSON.parse(event.data);

    if (response.action == 'open') {
        if (response.status == 'OK') {
            uid = response.uid;

            addParagraph(response.document.name);
        }
    }

    if (response.action == 'create') {
        if (response.status == 'OK') {
            uid = response.uid;

            addParagraph(event.data);
        }
        else {
            addParagraph(response.details);
        }
    }
};

//setInterval(send, 5000);
var sendBtn = document.getElementById("send");

sendBtn.onclick = function () {
    send();
};

function send() {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        alert("socket not connected");
    }

    socket.send(tinymce.get(0).getContent());
};
