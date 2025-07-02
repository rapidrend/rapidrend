const { translate } = require("#functions/translate");
const {
    QWidget, QBoxLayout, QSizePolicyPolicy, Direction,
    AlignmentFlag, QPushButton, QIcon
} = require("@nodegui/nodegui");

class ArgsContainer extends QWidget {
    constructor() {
        const assets = guiApp.theme.assets;

        super();

        this.setSizePolicy(QSizePolicyPolicy.Minimum, QSizePolicyPolicy.Minimum);

        const argsContainerLayout = new QBoxLayout(Direction.LeftToRight);

        const fileWidget = new QWidget();
        fileWidget.setSizePolicy(QSizePolicyPolicy.Expanding, QSizePolicyPolicy.Minimum);
        guiApp.fileArgsLayout = new QBoxLayout(Direction.LeftToRight);
        guiApp.fileArgsLayout.setContentsMargins(0, 0, 0, 0);
        guiApp.fileArgsLayout.setSpacing(0);
        fileWidget.setLayout(guiApp.fileArgsLayout);

        const editorsWidget = new QWidget();
        editorsWidget.setSizePolicy(QSizePolicyPolicy.Expanding, QSizePolicyPolicy.Minimum);
        guiApp.editorsLayout = new QBoxLayout(Direction.LeftToRight);
        guiApp.editorsLayout.setContentsMargins(0, 0, 0, 0);
        editorsWidget.setLayout(guiApp.editorsLayout);

        const argsWidget = new QWidget();
        argsWidget.setSizePolicy(QSizePolicyPolicy.Expanding, QSizePolicyPolicy.Minimum);
        guiApp.argsLayout = new QBoxLayout(Direction.TopToBottom);
        guiApp.argsLayout.setContentsMargins(0, 0, 0, 0);
        guiApp.argsLayout.setSpacing(0);
        argsWidget.setLayout(guiApp.argsLayout);

        this.moreArgsContainer = new QWidget();
        this.moreArgsContainer.setSizePolicy(QSizePolicyPolicy.Expanding, QSizePolicyPolicy.Minimum);
        this.moreArgsContainer.hide();

        guiApp.moreArgsLayout = new QBoxLayout(Direction.TopToBottom);
        guiApp.moreArgsLayout.setContentsMargins(0, 0, 0, 0);
        guiApp.moreArgsLayout.setSpacing(0);
        this.moreArgsContainer.setLayout(guiApp.moreArgsLayout);

        this.moreArgsButton = new QPushButton();
        this.moreArgsButton.setVisible(false);
        this.moreArgsButton.setText(translate("gui.argFields.more"));
        this.moreArgsButton.setObjectName("flatButton");

        const arrowIcon = new QIcon(assets.downArrow);
        this.moreArgsButton.setIcon(arrowIcon);

        this.moreArgsButton.addEventListener("clicked", () => {
            const isVisible = this.moreArgsContainer.isVisible();
            this.moreArgsContainer.setVisible(!isVisible);

            const arrowIcon = new QIcon(!isVisible ? assets.upArrow : assets.downArrow);
            this.moreArgsButton.setIcon(arrowIcon);
        });

        guiApp.argsContainerLayout = new QBoxLayout(Direction.TopToBottom);
        guiApp.argsContainerLayout.addWidget(fileWidget);
        guiApp.argsContainerLayout.addWidget(editorsWidget);
        guiApp.argsContainerLayout.addWidget(argsWidget);
        guiApp.argsContainerLayout.addWidget(this.moreArgsButton, 0, AlignmentFlag.AlignCenter);
        guiApp.argsContainerLayout.addWidget(this.moreArgsContainer);

        const argsContainerWidget = new QWidget();
        argsContainerWidget.setSizePolicy(QSizePolicyPolicy.Expanding, QSizePolicyPolicy.Minimum);
        argsContainerWidget.setLayout(guiApp.argsContainerLayout);

        argsContainerLayout.addWidget(argsContainerWidget, 0, AlignmentFlag.AlignCenter);

        this.setLayout(argsContainerLayout);
    }
}

module.exports = ArgsContainer;