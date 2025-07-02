const {
    QWidget, QLabel, QScrollArea, QPushButton,
    QBoxLayout, QSizePolicyPolicy, QMenu, QIcon,
    QAction,

    AlignmentFlag, Direction, CursorShape,
    QFileDialog,
    FileMode,
    AcceptMode
} = require("@nodegui/nodegui");

const ArgsContainer = require("./Args");
const CommandTask = require("#classes/CommandTask");

const fs = require("fs-extra");

const { updateArgFields, parseArgs } = require("../utils/args");
const { displayOutput, clearOutput } = require("../utils/media");
const { displayPopup } = require("../utils/general");

const { translate } = require("#functions/translate");
const { getLocalCommands } = require("#functions/commands");
const { writeAllConfigs } = require("#functions/filesystem");

class CommandContainer extends QWidget {
    constructor() {
        const assets = guiApp.theme.assets;

        super();

        const commandContainer = guiApp.commandContainer = new QBoxLayout(Direction.TopToBottom);
        this.setProperty("class", "container");

        const titleLayout = new QBoxLayout(Direction.LeftToRight);

        commandContainer.title = new QLabel();
        commandContainer.title.setObjectName("commandTitle");
        commandContainer.title.setProperty("class", "title");
        commandContainer.title.setAlignment(AlignmentFlag.AlignCenter);
        commandContainer.title.setWordWrap(true);

        commandContainer.sidebarButton = new QPushButton();
        commandContainer.sidebarButton.setObjectName("flatLeftButton");
        commandContainer.sidebarButton.setIcon(new QIcon(assets.sidebarFilledIcon));
        commandContainer.sidebarButton.setToolTip(translate("gui.menu.hideSidebar"));
        commandContainer.sidebarButton.setFixedSize(37, 24);
        commandContainer.sidebarButton.addEventListener("clicked", () => guiApp.sidebarWidget.handleToggle());

        titleLayout.addWidget(commandContainer.sidebarButton);

        titleLayout.addStretch();
        titleLayout.addWidget(commandContainer.title);
        titleLayout.addStretch();

        commandContainer.tasklistButton = new QPushButton();
        commandContainer.tasklistButton.setObjectName("flatButton");
        commandContainer.tasklistButton.setIcon(new QIcon(assets.tasklistIcon));
        commandContainer.tasklistButton.setToolTip(translate("gui.menu.showTasklist"));
        commandContainer.tasklistButton.setFixedSize(24, 24);
        commandContainer.tasklistButton.addEventListener("clicked", () => guiApp.tasklistWidget.handleToggle());

        commandContainer.favoriteButton = new QPushButton();
        commandContainer.favoriteButton.setObjectName("flatButton");
        commandContainer.favoriteButton.setIcon(new QIcon(assets.starIcon));
        commandContainer.favoriteButton.setToolTip(translate("gui.menu.addFavorite"));
        commandContainer.favoriteButton.setFixedSize(24, 24);
        commandContainer.favoriteButton.addEventListener("clicked", () => this.handleFavorite());

        commandContainer.menuButton = new QPushButton();
        commandContainer.menuButton.setObjectName("menuButton");
        commandContainer.menuButton.setIcon(new QIcon(assets.menuIcon));
        commandContainer.menuButton.setToolTip(translate("gui.menu.desc"));
        commandContainer.menuButton.setFixedSize(37, 24);

        this.createMenu();

        titleLayout.addWidget(commandContainer.tasklistButton);
        titleLayout.addWidget(commandContainer.favoriteButton);
        titleLayout.addWidget(commandContainer.menuButton);

        commandContainer.addLayout(titleLayout);

        commandContainer.description = new QLabel();
        commandContainer.description.setAlignment(AlignmentFlag.AlignCenter);
        commandContainer.description.setWordWrap(true);
        commandContainer.addWidget(commandContainer.description);

        guiApp.argsContainer = new QScrollArea();
        guiApp.argsWidget = new ArgsContainer();

        guiApp.argsContainer.setWidget(guiApp.argsWidget);

        commandContainer.addWidget(guiApp.argsContainer);

        guiApp.executeButton = new QPushButton();
        guiApp.executeButton.setText(translate("gui.executeButton"));
        guiApp.executeButton.setProperty("class", "hugeButton");
        guiApp.executeButton.setSizePolicy(QSizePolicyPolicy.Fixed, QSizePolicyPolicy.Fixed);
        guiApp.executeButton.addEventListener("clicked", () => this.handleExecute());

        commandContainer.addWidget(guiApp.executeButton, 0, AlignmentFlag.AlignCenter);

        const executeLabelWidget = new QWidget();
        const executeLabelLayout = new QBoxLayout(Direction.LeftToRight);
        executeLabelLayout.setContentsMargins(0, 0, 0, 0);
        executeLabelLayout.setSpacing(5);

        guiApp.executeLabel = new QLabel();
        guiApp.executeLabel.setVisible(false);
        guiApp.executeLabel.setAlignment(AlignmentFlag.AlignCenter);
        guiApp.executeLabel.setProperty("class", "small");
        guiApp.executeLabel.setWordWrap(true);

        executeLabelLayout.addWidget(guiApp.executeLabel);
        executeLabelWidget.setLayout(executeLabelLayout);

        commandContainer.addWidget(executeLabelWidget);

        this.setLayout(commandContainer);
    }

    createMenu() {
        const { commandContainer, selectedCommand } = guiApp;

        const commandName = selectedCommand.name;

        const menu = new QMenu();
        menu.setStyleSheet(guiApp.styleSheet);

        const loadStateAction = new QAction();
        loadStateAction.setText(translate("gui.menu.loadState"));
        const loadStateItem = menu.addAction(loadStateAction);

        loadStateItem.addEventListener("triggered", () => {
            const fileDialog = new QFileDialog();
            fileDialog.setNameFilter("JSON files (*.json)");
            fileDialog.setStyleSheet(guiApp.styleSheet);
            fileDialog.exec();

            const selectedFiles = fileDialog.selectedFiles();
            if (selectedFiles.length > 0) {
                try {
                    const filePath = selectedFiles[0];
                    const argsData = fs.readJSONSync(filePath);

                    guiApp.modifiedArgs = Object.keys(argsData);
                    guiApp.argFields = argsData;

                    updateArgFields({ forceValidateFiles: true })
                        .catch((err) => {
                            displayPopup("error", translate("popupDisplay.status.error.argumentValidate"), err);
                        });
                } catch (err) {
                    displayPopup("error", translate("popupDisplay.status.error.loadState"), err.message);
                }
            }
        });

        const saveStateAction = new QAction();
        saveStateAction.setText(translate("gui.menu.saveState"));
        const saveStateItem = menu.addAction(saveStateAction);

        saveStateItem.addEventListener("triggered", () => {
            const fileDialog = new QFileDialog();
            fileDialog.setFileMode(FileMode.AnyFile);
            fileDialog.setAcceptMode(AcceptMode.AcceptSave);
            fileDialog.setNameFilter("JSON files (*.json)");
            fileDialog.setStyleSheet(guiApp.styleSheet);
            fileDialog.setDefaultSuffix("json");
            fileDialog.exec();

            const selectedFiles = fileDialog.selectedFiles();
            if (selectedFiles.length > 0) {
                try {
                    const filePath = selectedFiles[0];
                    const argsJSON = JSON.stringify(guiApp.argFields, null, 2);
                    fs.writeFileSync(filePath, argsJSON);
                    displayPopup("success", translate("popupDisplay.status.success.saveStateTitle"), translate("popupDisplay.status.success.saveStateDesc"));
                } catch (err) {
                    displayPopup("error", translate("popupDisplay.status.error.saveState"), err.message);
                }
            }
        });

        const keywordAction = new QAction();
        keywordAction.setText(translate("gui.menu.keywords"));
        keywordAction.setCheckable(true);
        keywordAction.setChecked(guiApp.keywordMode);
        const keywordItem = menu.addAction(keywordAction);

        keywordItem.addEventListener("toggled", (checked) => {
            guiApp.keywordMode = checked;
            guiApp.sidebarWidget.handleCommandSelection(...Object.values(selectedCommand));
        });

        const resetAction = new QAction();
        resetAction.setText(translate("gui.menu.reset"));
        const resetItem = menu.addAction(resetAction);

        resetItem.addEventListener(
            "triggered",
            () => guiApp.sidebarWidget.handleCommandSelection(...Object.values(selectedCommand))
        );

        if (selectedCommand?.data?.isLocalCommand) {
            const deleteAction = new QAction();
            deleteAction.setText(translate("gui.menu.deleteLocalCommand"));
            const deleteItem = menu.addAction(deleteAction);

            deleteItem.addEventListener("triggered", () => {
                const localCommand = require("#commands/local/localcommand");

                // See that button? No shit!
                const localCommandButton = guiApp.widgets.commands.local?.list?.localcommand?.widget
                    ?? Object.values(Object.values(guiApp.widgets.commands)[0].list)[0].widget;

                delete appConfigs.settings.localCommands[commandName];
                delete app.commands.all[commandName];

                getLocalCommands();

                guiApp.sidebarWidget.updateView();
                if (localCommandButton)
                    guiApp.sidebarWidget.handleCommandSelection("localcommand", localCommand, localCommandButton);
            });
        }

        commandContainer.menuButton.setMenu(menu);
    }

    handleFavorite() {
        const { commandContainer, selectedCommand } = guiApp;
        const assets = guiApp.theme.assets;

        if (!selectedCommand.data) return;

        const favoriteIndex = appConfigs.settings.favorites.findIndex(cmdName => cmdName == selectedCommand.name);
        const favorited = favoriteIndex > -1;

        if (!favorited) appConfigs.settings.favorites.push(selectedCommand.name);
        else appConfigs.settings.favorites.splice(favoriteIndex, 1);

        writeAllConfigs();

        commandContainer.favoriteButton.setIcon(new QIcon(!favorited ? assets.starFilledIcon : assets.starIcon));
        commandContainer.favoriteButton.setToolTip(
            !favorited
                ? translate("gui.menu.removeFavorite")
                : translate("gui.menu.addFavorite")
        );
        if (guiApp.currentView == "favorites") guiApp.sidebarWidget.updateView();
    }

    async handleExecute() {
        const { selectedCommand } = guiApp;

        if (!selectedCommand.data) return;

        const commandName = selectedCommand.name;

        guiApp.executeButton.setCursor(CursorShape.BusyCursor);
        guiApp.executeButton.setText(translate("gui.executingButton"));

        appConfigs.cache.recents = appConfigs.cache.recents.filter(cmd => cmd != commandName);
        appConfigs.cache.recents.unshift(commandName);

        writeAllConfigs();

        if (guiApp.currentView == "recents") guiApp.sidebarWidget.updateView();

        let args, err;

        if (guiApp.keywordMode) {
            args = await parseArgs({ ...guiApp.argFields }, { keywordMode: true, skipRequired: false })
                .catch((e) => err = e);
        } else {
            await updateArgFields({ keywordMode: true, skipRequired: false })
                .catch((e) => err = e);
            args = guiApp.args;
        }

        if (err) {
            displayPopup("error", translate("popupDisplay.status.error.argumentValidate"), err);
            guiApp.executeButton.setCursor(CursorShape.ArrowCursor);
            guiApp.executeButton.setText(translate("gui.executeButton"));
            return;
        };

        const commandTask = new CommandTask(selectedCommand.data, args);

        if (commandTask.multiFiles) {
            guiApp.executeButton.setCursor(CursorShape.ArrowCursor);
            guiApp.executeButton.setText(translate("gui.executeButton"));
        }

        if (
            !guiApp.tasklistVisible &&
            (Object.keys(app.commandTasks).length > 0 || commandTask.multiFiles)
        ) guiApp.tasklistWidget.handleToggle();

        guiApp.tasklistWidget.monitorCommandTask(commandTask);

        commandTask.start();
        await commandTask.task.catch((err) => {
            if (!commandTask.multiFiles && Object.keys(app.commandTasks).length <= 1)
                displayPopup("error", translate("popupDisplay.status.error.commandExecute"), err);
        });

        if (!commandTask.multiFiles && Object.keys(app.commandTasks).length <= 0) {
            if (commandTask.status == "completed") {
                clearOutput();
                await displayOutput(commandTask);
            }

            if (commandName == "localcommand") {
                getLocalCommands();
                guiApp.sidebarWidget.updateView();
            }

            guiApp.executeButton.setCursor(CursorShape.ArrowCursor);
            guiApp.executeButton.setText(translate("gui.executeButton"));
        }
    }
}

module.exports = CommandContainer;