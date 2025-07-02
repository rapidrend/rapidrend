const {
    QWidget, QLabel, QBoxLayout,

    AlignmentFlag, Direction
} = require("@nodegui/nodegui");

const { translate } = require("#functions/translate");

class StartContainer extends QWidget {
    constructor() {
        super();

        this.setProperty("class", "container");

        const startLayout = new QBoxLayout(Direction.TopToBottom);
        startLayout.addStretch();

        const titleLabel = new QLabel();
        titleLabel.setText(translate("gui.mainTitle"));
        titleLabel.setProperty("class", "title");
        titleLabel.setAlignment(AlignmentFlag.AlignCenter);
        startLayout.addWidget(titleLabel);

        const descriptionLabel = new QLabel();
        descriptionLabel.setText(translate("gui.mainDescription"));
        descriptionLabel.setAlignment(AlignmentFlag.AlignCenter);
        startLayout.addWidget(descriptionLabel);

        startLayout.addStretch();

        this.setLayout(startLayout);
    }
}

module.exports = StartContainer;