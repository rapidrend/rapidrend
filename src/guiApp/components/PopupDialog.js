const {
    QBoxLayout, QWidget, QLabel, QPixmap,

    WindowType, AlignmentFlag, Direction
} = require("@nodegui/nodegui");

const path = require("path");

const { translate } = require("#functions/translate");
const { wrapText } = require("../utils/general");

class PopupDialog extends QWidget {
    constructor(status, title, text) {
        super();

        const popupLayout = new QBoxLayout(Direction.TopToBottom);
        this.setWindowTitle(translate(`popupDisplay.status.${status}.title`));
        this.setStyleSheet(guiApp.styleSheet);
        this.setWindowFlag(WindowType.Dialog, true);
        this.setWindowFlag(WindowType.WindowStaysOnTopHint, true);
        this.setFixedWidth(400);
        this.adjustSize();

        const popupIcon = new QLabel();
        const popupImage = new QPixmap();
        popupImage.load(guiApp.theme.assets.statuses[status]);
        popupIcon.setPixmap(popupImage);
        popupIcon.setAlignment(AlignmentFlag.AlignCenter);
        popupLayout.addWidget(popupIcon);

        const popupMessage = new QLabel();
        popupMessage.setText(wrapText(translate(`popupDisplay.status.${status}.format`, title), this));
        popupMessage.setWordWrap(true);
        popupMessage.setAlignment(AlignmentFlag.AlignCenter);
        popupMessage.setProperty("class", "title");
        popupLayout.addWidget(popupMessage);

        const popupDescription = new QLabel();
        popupDescription.setText(text);
        popupDescription.setWordWrap(true);
        popupDescription.setAlignment(AlignmentFlag.AlignCenter);
        popupLayout.addWidget(popupDescription);

        this.setLayout(popupLayout);
    }
}

module.exports = PopupDialog;