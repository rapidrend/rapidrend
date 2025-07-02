const {
    QMainWindow, QWidget, QBoxLayout,
    QPushButton, QSizePolicyPolicy,

    Direction, WindowType,
    FocusPolicy
} = require("@nodegui/nodegui");

const editors = require("../editors");

const { displayPopup } = require("../utils/general");
const { translate } = require("#functions/translate");

class Editor extends QMainWindow {
    constructor(editorName, command, args) {
        super();

        const CommandEditor = editors[editorName];

        this.setWindowTitle(translate("editors.title", translate(`editors.commands.${editorName}`)));
        this.setMinimumSize(640, 480);
        this.setStyleSheet(guiApp.styleSheet);
        this.setWindowFlag(WindowType.Dialog, true);
        this.setWindowFlag(WindowType.WindowStaysOnTopHint, true);

        const centralWidget = new QWidget();
        this.setCentralWidget(centralWidget);
        const layout = new QBoxLayout(Direction.TopToBottom);
        layout.setContentsMargins(0, 0, 0, 0);
        centralWidget.setLayout(layout);

        try {
            this.editor = new CommandEditor(editorName, command, args);
            layout.addWidget(this.editor);
        } catch (err) {
            this.error = err;
            displayPopup("error", translate("popupDisplay.status.error.editorOpening"), err);
        }

        const undoLayout = new QBoxLayout(Direction.LeftToRight);
        undoLayout.setContentsMargins(8, 0, 8, 8);

        this.undoButton = new QPushButton();
        this.undoButton.setProperty("class", "danger");
        this.undoButton.setText(translate("editors.undo"));
        this.undoButton.setSizePolicy(QSizePolicyPolicy.Fixed, QSizePolicyPolicy.Fixed);
        this.undoButton.setFocusPolicy(FocusPolicy.NoFocus);
        undoLayout.addWidget(this.undoButton);

        layout.addLayout(undoLayout);
    }

    async setArgValues() {
        await this.editor.setArgValues();
    }

    getArgValues() {
        return this.editor.getArgValues();
    }

    resetArgValues() {
        this.editor.resetArgValues();
    }
}

module.exports = Editor;