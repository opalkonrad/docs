/* Editor */
var addBtn = document.getElementById('add');
var editorsList = document.getElementById("editor");


addBtn.addEventListener('click', function () {
    // Request new paragraph
    send("{\"action\":\"new_paragraph\",\"docsId\": \"" + docsId + "\",\"userId\":\"" + userId + "\"}");
});

function addParagraph(data, editorId) {
    // Append new inline editor
    var node = document.createElement("div");
    node.setAttribute("id", editorId);
    editorsList.appendChild(node);

    // Create editor instance
    tinymce.init({
        selector: "#" + editorId,
        inline: true,
        setup: function (editor) {
            // Additional button in toolbar to delete instance of editor(paragraph)
            editor.ui.registry.addButton("deleteParagraph", {
                icon: "remove",
                tooltip: "Delete paragraph",
                onAction: function () {
                    // Request to delete paragraph
                    editor.destroy();

                    var currEditorId = editor.getElement().id;
                    editorsList.removeChild(document.getElementById(currEditorId));
                    currSelectedEditor = null;
                }
            });

            editor.on('focus', function (e) {
                // Send request to edit current paragraph
                socket.send("{\"action\":\"block_paragraph\",\"docsid\":\"" + docsId + "\",\"paragraphId\":\"" + editor.getElement().id + "\"}");
            });

            editor.on('blur', function (e) {
                // Send content of paragraph before unblocking it and then unblock it
                sendCurrParagraphEdit();
                currSelectedEditor = null;

                send("{\"action\":\"unblock_paragraph\",\"docsId\":\"" + docsId + "\",\"paragraphId\":\"" + editor.getElement().id + "\",\"userId\":\"" + userId + "\"}");
            });

            editor.on('init', function (e) {
                // Set initial text
                this.setContent(data);

                // Block paragraph if in blocked paragraphs
                if (blockedParagraphs.includes(editor.getElement().id)) {
                    blockParagraph(editor.getElement().id);
                }
            });

            editor.on('keydown', function (e) {
                // Prevent adding new line using enter key
                if (13 === e.keyCode) {
                    e.preventDefault();
                }
            });

            editor.on("BeforeExecCommand", function (e) {
                // Select all text
                editor.selection.select(editor.getBody(), true);
            })

            editor.on("ExecCommand", function (e) {     
                // Unselect text and set cursor to the end
                editor.selection.collapse(false);

                // Apply new style
                changeStyle(editor.getElement().id, e.command);
            });
        },
        toolbar: "bold italic underline | fontselect fontsizeselect forecolor | copy cut paste | removeformat | deleteParagraph",
        menubar: false,
        font_formats: 'Arial=arial,helvetica,sans-serif; Courier New=courier new,courier,monospace; Times New Roman=times new roman,times'
    });
}


var userId;
var docsUsers;

var paragraphsStyles = {};
var blockedParagraphs = [];



var currSelectedEditor = null;


function changeStyle(editorId, command) {
    switch (command) {
        case "RemoveFormat":
            break;

        case "mceToggleFormat":
            switch (e.value) {
                case "bold":
                    paragraphsStyles[editorId].bold == 0 ? paragraphsStyles[editorId].bold = 1 : paragraphsStyles[editorId].bold = 0;
                    break;

                case "italic":
                    paragraphsStyles[editorId].italic == 0 ? paragraphsStyles[editorId].italic = 1 : paragraphsStyles[editorId].italic = 0;
                    break;

                case "underline":
                    paragraphsStyles[editorId].underline == 0 ? paragraphsStyles[editorId].underline = 1 : paragraphsStyles[editorId].underline = 0;
                    break;
            }
            break;

        case "FontName":
            switch (e.value) {
                case "arial,helvetica,sans-serif":
                    paragraphsStyles[editorId].fontType = "Arial";
                    break;

                case "courier new,courier,monospace":
                    paragraphsStyles[editorId].fontType = "Courier New";
                    break;

                case "times new roman,times":
                    paragraphsStyles[editorId].fontType = "Times New Roman";
                    break;
            }
            break;

        case "FontSize":
            // Delete pt at the end
            paragraphsStyles[editorId].fontSize = e.value.substring(0, e.value.length - 2);
            break;

        case "mceApplyTextcolor":
            paragraphsStyles[editorId].fontColor = e.value;
            break;
    }
}

function processOpen(response) {
    if (response.status == 'OK') {
        userId = response.userid;
        docsname = response.name;
        docsUsers = response.users;

        paragraphsToHtml(response.paragraphs);
        addToBlockedParagraphs(response.blockedParagraphs);
    }
}

function processCreate(response) {
    if (response.status == 'OK') {
        docsid = response.docsid;
        userId = response.userid;
    }
}

function paragraphsToHtml(paragraphs) {
    for (let i = 0; i < paragraphs.length; i++) {
        pId = paragraphs[i].paragraphId;
        paragraphsStyles[pId] = paragraphs[i].style;

        addParagraph(createContentForEditor(paragraphs[i]), pId);
    }
}

function createContentForEditor(paragraph) {
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

function send(text) {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        alert("socket not connected");
    }

    socket.send(text);
}

setInterval(sendCurrParagraphEdit, 200);
function sendCurrParagraphEdit() {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        alert("socket not connected");
    }

    if (currSelectedEditor != null) {
        // Get content of current paragraph and it's styling
        let currEditorText = tinymce.get(currSelectedEditor).getContent({ format: 'text' });
        let style = paragraphsStyles[currSelectedEditor];

        console.log(generateEditReq(currEditorText, style));

        socket.send(generateEditReq(currEditorText, style))
    }
}

function generateEditReq(text, style) {
    console.log(text);

    let defaultEdit = "{"
                        + "\"action\":\"edit\","
                        + "\"docsId\":\"" + docsId + "\","
                        + "\"userId\":\"" + userId + "\","
                        + "\"editedParagraph\":{"
                        + "\"paragraphId\":\"" + currSelectedEditor + "\","
                                + "\"text\":\"" + text + "\","
                                + "\"style\":null"
                        + "}"
                    + "}";

    let editReq = JSON.parse(defaultEdit);
    console.log(editReq);

    // Add styling
    editReq.style = style;

    return editReq;
}

var spanStyles = ["fontType", "fontSize", "fontColor", "underline"];
var separateStyles = ["bold", "italic"];

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

            case "fontType":
                if (value == "Arial") {
                    return "font-family: arial, helvetica, sans-serif;";
                }
                else if (value == "Courier New") {
                    return "font-family: 'courier new', courier, monospace;";
                }
                else if (value == "Times New Roman") {
                    return "font-family: 'times new roman', times;";
                }

            case "fontSize":
                return "font-size: " + value + "pt;";

            case "fontColor":
                return "color: " + value + ";";
        }
    }
}

function addToBlockedParagraphs(id) {
    blockedParagraphs.push(id);
}

function addToBlockedParagraphs(ids) {
    for (let i = 0; i < ids.length; i++) {
        blockedParagraphs.push(ids[i]);
    }
}

function removeFromBlockedParagraphs(id) {
    const index = blockedParagraphs.indexOf(id);
    if (index > -1) {
        blockedParagraphs.splice(index, 1);
    }
}

function blockParagraph(id) {
    tinymce.get(id).hide();
    tinymce.get(id).getBody().setAttribute('contenteditable', false);

    document.getElementById(id).classList.add("blockedParagraph");
}

function unblockParagraph(id) {
    tinymce.get(id).show();
    tinymce.get(id).getBody().setAttribute('contenteditable', true);

    document.getElementById(id).classList.remove("blockedParagraph");

    removeFromBlockedParagraphs(id);
}

function deleteParagraph(id) {

}


/* Web socket */
var scheme = document.location.protocol === "https:" ? "wss" : "ws";
var port = document.location.port ? (":" + document.location.port) : "";
var connMode = document.currentScript.getAttribute('data-conn-mode');
var docsId = document.currentScript.getAttribute('data-docs-id');

var uri = scheme + "://" + document.location.hostname + port + "/ws";


socket = new WebSocket(uri);

socket.onopen = function (event) {
    console.log("Opened connection to " + uri);

    if (connMode == 'Open') {
        socket.send("{\"action\":\"open\",\"docsId\":\"" + docsId + "\"}");
    }
    else if (connMode == 'Create') {
        socket.send("{\"action\":\"create\",\"name\":\"" + docsId + "\"}");
    }
};

socket.onclose = function (event) {
    console.log("Closed connection from " + uri);
};

socket.onerror = function (event) {
    console.log(info.value += "Error: " + event.data);
};

socket.onmessage = function (event) {
    var response = JSON.parse(event.data);

    switch (response.action) {
        case "open":
            processOpen(response);
            break;

        case "create":
            processCreate(response);
            break;

        case "block_paragraph":
            if (response.status == "OK") {
                console.log(response);
                currSelectedEditor = response.paragraphId;
            }
            else {
                alert(response.details);
            }
            break;

        case "block_paragraph_others":
            blockParagraph(response.paragraphId);
            break;

        case "unblock_paragraph_others":
            unblockParagraph(response.paragraphId);
            break;

        case "delete_paragraph_others":
            deleteParagraph(response.paragraphId);
            break;

        case "new_paragraph":
            if (response.status == "OK") {
                addParagraph("", response.paragraphId);
            }
            else {
                alert(response.details);
            }
            break;

        default:
            console.log(event.data);
            break;
    }
};
