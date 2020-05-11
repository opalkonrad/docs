const editor = new EditorJS({
    holder: 'editorjs',
    placeholder: 'Waiting for connection...',
    onChange: () => { console.log('Now I know that Editor\'s content changed!') },
    autofocus: true,
    minHeight: 0
});

editor.isReady.then(() => {
    console.log('Editor.js is ready to work!');

    editor.blocks.insert('paragraph', { text: 'new paragraph' }, {}, 0);

}).catch((reason) => {
    console.log(`Editor.js initialization failed because of ${reason}`);
});

var saveBtn = document.getElementById('save');

saveBtn.addEventListener('click', function () {
    editor.save().then((outputData) => {
        console.log('Article data: ', outputData);
    }).catch((error) => {
        console.log('Saving failed: ', error);
    });
});
