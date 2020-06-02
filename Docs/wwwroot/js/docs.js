/* Editor */
var editorsList = document.getElementById("editor");
var users = document.getElementById("users");

function createEditorsInstance(data, editorId) {
    // Append new inline editor
    var node = document.createElement("div");
    node.setAttribute("id", editorId);
    editorsList.appendChild(node);

    // Create editor instance
    tinymce.init({
        selector: "#" + editorId,
        inline: true,
        setup: function (editor) {
            // Additional button in toolbar to delete instance of editor (paragraph)
            editor.ui.registry.addButton("deleteParagraph", {
                icon: "remove",
                tooltip: "Delete paragraph",
                onAction: function () {
                    send("{\"action\":\"delete_paragraph\",\"paragraphId\":\"" + editor.getElement().id + "\"}");
                }
            });

            editor.on('input', function (e) {
                sendCurrParagraphEdit();
            });

            editor.on('focus', function (e) {
                // Send request to edit current paragraph
                socket.send("{\"action\":\"block_paragraph\",\"paragraphId\":\"" + editor.getElement().id + "\"}");
            });

            editor.on("blur", function (e) {
                // Set currently selected editor to null and informa server about releasing lock
                currSelectedEditor = null;

                send("{\"action\":\"unblock_paragraph\"}");
            });

            editor.on('init', function (e) {
                // Set initial text
                this.setContent(data);

                // Block paragraph if in blocked paragraphs
                if (blockedParagraphs.includes(editor.getElement().id)) {
                    blockParagraph(editor.getElement().id);
                }
            });

            editor.on("keydown", function (e) {
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

                // Apply new style and send changes
                changeStyle(editor.getElement().id, e.command, e.value);
                sendCurrParagraphEdit();
            });
        },
        toolbar: "bold italic underline | fontselect fontsizeselect forecolor | copy cut paste | removeformat | deleteParagraph",
        menubar: false,
        font_formats: "Arial=arial,helvetica,sans-serif; Courier New=courier new,courier,monospace; Times New Roman=times new roman,times"
    });
}

var currSelectedEditor = null;
var paragraphsStyles = {};
var blockedParagraphs = [];
var docsUsers = [];

function changeStyle(editorId, command, value) {
    switch (command) {
        case "RemoveFormat":
            break;

        case "mceToggleFormat":
            switch (value) {
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
            switch (value) {
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
            // Delete "pt" at the end
            paragraphsStyles[editorId].fontSize = parseInt(value.substring(0, value.length - 2));
            break;

        case "mceApplyTextcolor":
            paragraphsStyles[editorId].fontColor = value;
            break;
    }
}

function processOpen(response) {
    if (response.status == "OK") {
        docsUsers = response.users;
        users.innerHTML = response.users;

        addToBlockedParagraphs(response.blockedParagraphs);
        createParagraphs(response.paragraphs);
    }
    else {
        alert(response.details);
    }
}

function processCreate(response) {
    if (response.status == 'OK') {
        docsId = response.docsId;
    }
    else {
        alert(response.details);
    }
}

function processBlockParagraph(response) {
    if (response.status == "OK") {
        currSelectedEditor = response.paragraphId;
    }
    else {
        alert(response.details);
    }
}

function processNewParagraph(response) {
    if (response.status == "OK") {
        createParagraph(response.newParagraph);
    }
    else {
        alert(response.details);
    }
}

function createParagraphs(paragraphs) {
    for (let i = 0; i < paragraphs.length; i++) {
        createParagraph(paragraphs[i]);
    }
}

function createParagraph(paragraph) {
    let pId = paragraph.paragraphId;

    // Save style and add paragraph
    paragraphsStyles[pId] = paragraph.style;
    createEditorsInstance(initContentForEditor(paragraph), pId);
}

function initContentForEditor(paragraph) {
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

function sendCurrParagraphEdit() {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        alert("socket not connected");
    }

    if (currSelectedEditor != null) {
        // Get content of current paragraph and it's styling
        let currEditorText = tinymce.get(currSelectedEditor).getContent({ format: 'text' });
        let style = paragraphsStyles[currSelectedEditor];

        send(JSON.stringify(generateEditReq(currEditorText, style)));
    }
}

function generateEditReq(text, style) {
    let defaultEdit = {
        action:"edit",
        editedParagraph:{
            paragraphId: currSelectedEditor,
            text: text.replace(/\u00a0/g, " "),
            style: style
        }
    };

    return defaultEdit;
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

function unblockParagraph(id) {
    tinymce.get(id).show();
    tinymce.get(id).getBody().setAttribute('contenteditable', true);

    document.getElementById(id).classList.remove("blockedParagraph");

    removeFromBlockedParagraphs(id);
}

function blockParagraph(id) {
    tinymce.get(id).hide();
    tinymce.get(id).getBody().setAttribute('contenteditable', false);

    document.getElementById(id).classList.add("blockedParagraph");
}

function processUserOpen(name) {
    docsUsers.push(name);
    users.innerHTML = docsUsers;
}

function processUserLeave(name) {
    const index = docsUsers.indexOf(name);
    if (index > -1) {
        docsUsers.splice(index, 1);
    }

    users.innerHTML = docsUsers;
}


var addParagraphBtn = document.getElementById('addParagraph');

addParagraphBtn.addEventListener('click', function () {
    // Request new paragraph
    send("{\"action\":\"new_paragraph\"}");
});

function deleteParagraph(id) {
    currSelectedEditor = null;
    editorsList.removeChild(document.getElementById(id));
    tinymce.get(id).destroy();
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
    alert("Connection closed. Reason: " + event.reason);

    // Block editor
    editorsList.classList.add("disable");
};

socket.onerror = function (event) {
    alert("Error: " + event.data);
};

window.addEventListener('beforeunload', function (e) {
    send("\"action\":\"leave\"");
    socket.close();
});

socket.onmessage = function (event) {
    var response = JSON.parse(event.data);

    switch (response.action) {
        case "open":
            processOpen(response);
            break;

        case "create":
            processCreate(response);
            break;

        case "unblock_paragraph":
            break;

        case "block_paragraph":
            processBlockParagraph(response);
            break;

        case "new_paragraph":
            processNewParagraph(response);
            break;

        case "delete_paragraph":
            deleteParagraph(response.paragraphId);
            break;

        case "edit":
            break;

        case "open_others":
            processUserOpen(response.userId);
            break;

        case "leave_others":
            processUserLeave(response.userId);
            break;

        case "unblock_paragraph_others":
            unblockParagraph(response.paragraphId);
            break;

        case "block_paragraph_others":
            blockParagraph(response.paragraphId);
            break;

        case "new_paragraph_others":
            createParagraph(response.newParagraph);
            break;

        case "delete_paragraph_others":
            deleteParagraph(response.paragraphId);
            break;

        case "edit_others":
            tinymce.get(response.editedParagraph.paragraphId).setContent(initContentForEditor(response.editedParagraph));
            break;

        default:
            alert(event.data);
            break;
    }
};


/* Tinymce fixes */
const tinymceBind = window.tinymce.DOM.bind;
window.tinymce.DOM.bind = (target, name, func, scope) => {
    // TODO This is only necessary until https://github.com/tinymce/tinymce/issues/4355 is fixed
    if (name === 'mouseup' && func.toString().includes('throttle()')) {
        return func;
    }
    else {
        return tinymceBind(target, name, func, scope);
    }
};
