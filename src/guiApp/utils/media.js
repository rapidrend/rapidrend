const { WidgetEventTypes, QMovie, QPixmap } = require("@nodegui/nodegui");

const ExtendedMovie = require("../components/ExtendedMovie");
const Message = require("#classes/Message");

const { removeAllConnections, displayPopup } = require("./general");
const { updateArgFields } = require("./args");

const { execPromise } = require("#functions/media");
const { translate } = require("#functions/translate");

async function displayOutput(commandTask) {
    const output = commandTask.output;
    if (output instanceof Message) {
        displayPopup(output.status, output.title, output.text);
        return;
    }

    const OutputPreview = require("../components/OutputPreview");

    clearOutput();

    guiApp.commandOutput = commandTask.output;

    const outputWidget = new OutputPreview(commandTask);
    guiApp.outputWidget = outputWidget;
    guiApp.commandContainer.addWidget(outputWidget);

    await outputWidget.load();

    outputWidget.closeButton.addEventListener("clicked", () => clearOutput());
}

function clearOutput() {
    if (guiApp.outputWidget) {
        removeAllConnections("output");

        if (guiApp.outputMovie)
            guiApp.outputMovie.delete();
        delete guiApp.outputMovie;

        guiApp.outputWidget.close();
        guiApp.commandContainer.removeWidget(guiApp.outputWidget);
        delete guiApp.outputWidget;

        delete guiApp.commandOutput;
    }
}

async function displayEditor(editorName, command) {
    const Editor = require("../components/Editor");

    let err;

    const editorDialog = new Editor(editorName, command, guiApp.args);
    if (editorDialog.error) return;

    guiApp.widgets.dialogs.push(editorDialog);

    editorDialog.addEventListener(
        WidgetEventTypes.Close,
        () => {
            guiApp.widgets.dialogs.splice(guiApp.widgets.dialogs.findIndex(d => d == editorDialog), 1);

            if (editorDialog.editor.movie)
                editorDialog.editor.movie.delete();

            if (editorDialog.editor.overlayMovie)
                editorDialog.editor.overlayMovie.delete();

            const argValues = editorDialog.getArgValues();
            for (const [key, value] of Object.entries(argValues)) {
                if (!guiApp.modifiedArgs.includes(key)) guiApp.modifiedArgs.push(key);
                guiApp.argFields[key] = value;
            }

            updateArgFields();
        }
    );

    editorDialog.undoButton.addEventListener("clicked", () => editorDialog.resetArgValues());

    await editorDialog.setArgValues().catch(e => err = e);
    if (err) {
        displayPopup("error", translate("popupDisplay.status.error.editorOpening"), err);
        return;
    }

    editorDialog.editor.fitToView();

    editorDialog.show();
}

async function createPreview(fileInfo) {
    const assets = guiApp.theme.assets;

    return new Promise(async (resolve) => {
        switch (fileInfo.shortType) {
            case "image": {
                resolve(new QPixmap(fileInfo.path));
                break;
            }

            case "gif": {
                const movie = new QMovie();
                movie.setFileName(fileInfo.path);
                resolve(movie.currentPixmap());
                break;
            }

            case "video": {
                let buffer;
                await execPromise(`ffmpeg -i "${fileInfo.path}" -vframes 1 -q:v 2 -f image2pipe -vcodec png -`, {
                    stdout: (chunk) => {
                        if (!buffer) buffer = chunk;
                        else buffer = Buffer.concat([buffer, chunk])

                        const bufferEnd = buffer.indexOf(Buffer.from([0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82]));
                        if (bufferEnd === -1) return;

                        const pngBuffer = buffer.slice(0, bufferEnd + 8);

                        const pixmap = new QPixmap();
                        pixmap.loadFromData(pngBuffer);
                        resolve(pixmap);
                    }
                });
                break;
            }

            case "audio": {
                resolve(new QPixmap(assets.audioIcon));
                break;
            }

            default: {
                resolve();
                break;
            }
        }
    });
}

async function createAnimatedPreview(fileInfo) {
    switch (fileInfo.shortType) {
        case "gif": {
            const movie = new QMovie();
            movie.setFileName(fileInfo.path);
            return movie;
        }

        case "video": {
            const movie = new ExtendedMovie();
            await movie.setFileName(fileInfo);
            return movie;
        }
    }
}

module.exports = {
    displayOutput,
    clearOutput,
    displayEditor,
    createPreview,
    createAnimatedPreview
};