const {
    QSizePolicyPolicy, QLineEdit, QFileDialog, QPushButton,

    WidgetEventTypes, FileMode
} = require("@nodegui/nodegui");

const { translate } = require("#functions/translate");
const { updateArgFields } = require("../../utils/args");

class PathField extends QLineEdit {
    constructor(key, arg) {
        super();

        this.setSizePolicy(QSizePolicyPolicy.Expanding, QSizePolicyPolicy.Expanding);
        this.addEventListener("editingFinished", () => {
            guiApp.argFields[key] = this.text();
            this.updateArgFields();
        });

        this.addEventListener(WidgetEventTypes.FocusIn, () => {
            guiApp.selectedArg = this;
        });

        this.addEventListener(WidgetEventTypes.FocusOut, () => {
            if (guiApp.selectedArg == this) delete guiApp.selectedArg;
        });

        this.addEventListener("editingFinished", () => {
            if (guiApp.selectedArg != this) return;

            if (!guiApp.modifiedArgs.includes(key)) guiApp.modifiedArgs.push(key);
            guiApp.argFields[key] = this.text();
            updateArgFields();
        });

        const browseButton = new QPushButton();
        browseButton.setText(translate("gui.argFields.file"));
        browseButton.addEventListener("clicked", () => {
            guiApp.selectedArg = this;

            const fileDialog = new QFileDialog();
            fileDialog.setFileMode(FileMode.AnyFile);
            fileDialog.setStyleSheet(guiApp.styleSheet);
            fileDialog.exec();

            const selectedPath = fileDialog.selectedFiles()[0];
            if (selectedPath) {
                if (!guiApp.modifiedArgs.includes(key)) guiApp.modifiedArgs.push(key);
                this.setText(selectedPath);
                guiApp.argFields[key] = selectedPath;
            }
            updateArgFields();

            if (guiApp.selectedArg == this && !this.hasFocus()) delete guiApp.selectedArg;
        });
        fieldLayout.addWidget(browseButton);
    }
}

module.exports = PathField;