/* Editor */
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
        handle_event_callback : function (editor) {
            editor.selection.select(editor.getBody(), true);
        },
        setup: function (editor) {
            editor.on("click", function (e) {
                console.log(editor.getContent());
            });

            editor.on('focus', function (e) {
                // Send request to edit current paragraph
                console.log("focusik na");
            });

            editor.on('blur', function (e) {
                // Send info about releasing paragraph
                console.log("unfocusik na");
            });

            editor.on('init', function (e) {
                this.setContent(data);
            });

            editor.on('keydown', function (e) {
                // Prevent adding new line using enter key
                if (13 === e.keyCode) {
                    e.preventDefault();
                }
            });

            editor.on("BeforeExecCommand", function (e) {
                // Select text
                editor.selection.select(editor.getBody(), true);
            })

            editor.on("ExecCommand", function (e) {     
                // Unselect text and set cursor to the end
                editor.selection.collapse(false);

                // Block linked formattings

            });
        },
        toolbar: "bold italic underline | fontselect fontsizeselect forecolor | copy cut paste | removeformat",
        menubar: false,
        font_formats: 'Arial=arial,helvetica,sans-serif; Courier New=courier new,courier,monospace; Times New Roman=times new roman,times'
    });

    // Increase counter for next paragraph (div's id)
    cntr++;
}


/* Web socket */
var scheme = document.location.protocol === "https:" ? "wss" : "ws";
var port = document.location.port ? (":" + document.location.port) : "";
var connMode = document.currentScript.getAttribute('data-conn-mode');
var docsId = document.currentScript.getAttribute('data-docs-id');

var uri = scheme + "://" + document.location.hostname + port + "/ws";


socket = new WebSocket(uri);

// Used to indicate document and user to the server
var docsid;
var docsname;

var userid;
var docsusers;

var paragraphsMapper = [];

var spanStyles= ["font-type", "font-size", "font-color", "underline"];
var separateStyles  = ["bold", "italic"];


socket.onopen = function (event) {
    console.log("Opened connection to " + uri);

    if (connMode == 'Open') {
        docsid = docsId;
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

    switch (response.action) {
        case "open":
            processOpen(response);
            break;

        case "create":
            processCreate(response);
            break;
    }
};

function processOpen(response) {
    if (response.status == 'OK') {
        userid = response.userid;
        docsname = response.name;
        docsusers = response.users;

        paragraphsToHtml(response.paragraphs);
    }
}

function processCreate(response) {
    if (response.status == 'OK') {
        docsid = response.docsid;
        userid = response.userid;
    }
}

function paragraphsToHtml(paragraphs) {
    for (let paragraph = 0; paragraph < paragraphs.length; paragraph++) {
        // Add mapping between paragraph id and paragraph number from the beginning
        paragraphsMapper.push(paragraphs[paragraph].paragraphid);

        addParagraph(jsonToHtml(paragraphs[paragraph]));
    }
}

function jsonToHtml(paragraph) {
    let text = paragraph.text;

    for (let i = 0; i < separateStyles.length; i++) {
        let styleValue = paragraph.style[separateStyles[i]];

        text = addSeparateStyle(text, separateStyles[i], styleValue);
    }

    let spanBegin = "<span style=\"";

    for (let i = 0; i < spanStyles.length; i++) {
        let styleValue = paragraph.style[spanStyles[i]];
        
        spanBegin += addSpanStyle(spanStyles[i], styleValue);
    }

    spanBegin += "\">";

    text = spanBegin + text + "</span>";

    return text;
}



//setInterval(send, 5000);

function send() {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        alert("socket not connected");
    }

    socket.send(tinymce.get(0).getContent());
};


function addSeparateStyle(text, style, value) {
    if (value != 0) {
        switch (style) {
            case "bold":
                return "<strong>" + text + "</strong>";

            case "italic":
                return "<em>" + text + "</em>";

            case "underline":
                return "<span style=\"text-decoration: underline;\">" + text + "</span>";
        }
    }

    return text;
}

function addSpanStyle(style, value) {
    if (value != 0) {
        switch (style) {
            case "underline":
                return "text-decoration: underline;";

            case "font-type":
                if (value == "Arial") {
                    return "font-family: arial, helvetica, sans-serif;";
                }
                else if (value == "Courier New") {
                    return "font-family: 'courier new', courier, monospace;";
                }
                else if (value == "Times New Roman") {
                    return "font-family: 'times new roman', times;";
                }

            case "font-size":
                return "font-size: " + value + "pt;";

            case "font-color":
                return "color: " + value + ";";
        }
    }
}

/*function generateJson(text) {
    var bold, italic, underline, fontType, fontSize, fontColor, data;

    for (let i = 0; i < text.length; i++) {
        if (text[i] == "<") {
            i = parseTag(i+1, text);
        }
        else {
            data += text[i];
        }
    }
}

parseTag(startPos, text) {
    for (let i = startPos; i < text.length; i++) {
        // italic
        if (text[i] == "e") {

        }
    }
}*/
