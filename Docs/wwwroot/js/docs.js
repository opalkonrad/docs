var cntr = 0;
var AddBtn = document.getElementById('add');
var editor = document.getElementById('editor');

AddBtn.addEventListener('click', function () {
    var nodeLi = document.createElement("LI");
    var nodeDiv = document.createElement('DIV');
    nodeDiv.setAttribute("id", cntr);
    nodeLi.appendChild(nodeDiv);
    document.getElementById('editor').appendChild(nodeLi);

    addParagraph(cntr, 'init data');

    cntr++;
});

function addParagraph(name, data) {
    tinymce.init({
        selector: '#' + name,
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
        toolbar: [
            "styleselect | bold italic underline | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | help",
            "insertdatetime | fontselect | restoredraft | removeformat | fontsizeselect | template codesample | code"
        ]
    });
}
