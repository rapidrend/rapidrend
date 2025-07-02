const {
    QWidget, QLabel, QScrollArea, QBoxLayout,
    QLineEdit, QSizePolicyPolicy, QPushButton,
    QIcon,

    AlignmentFlag, Direction, ScrollBarPolicy, CursorShape
} = require("@nodegui/nodegui");

const ArgsContainer = require("./Args");

const { addArgField, updateArgFields } = require("../utils/args");
const { wrapText } = require("../utils/general");
const { displayEditor } = require("../utils/media");

const { translate } = require("#functions/translate");
const { writeAllConfigs } = require("#functions/filesystem");

class SidebarContainer extends QWidget {
    constructor() {
        const assets = guiApp.theme.assets;

        super();

        guiApp.sidebarVisible = true;
        guiApp.currentView = "all";
        guiApp.views = ["all", "favorites", "recents"];
        guiApp.currentSearch = "";

        const sidebarLayout = new QBoxLayout(Direction.TopToBottom);

        this.setLayout(sidebarLayout);
        this.setProperty("class", "container");
        this.setFixedWidth(220);
        this.setSizePolicy(QSizePolicyPolicy.Maximum, QSizePolicyPolicy.Expanding);

        const titleRow = new QWidget();
        const titleRowLayout = new QBoxLayout(Direction.LeftToRight);
        titleRow.setLayout(titleRowLayout);

        const leftButton = new QPushButton();
        leftButton.setIcon(new QIcon(assets.leftArrow));
        leftButton.setObjectName("flatButton");
        leftButton.setFixedSize(24, 24);
        leftButton.addEventListener("clicked", () => this.switchView(-1));
        titleRowLayout.addWidget(leftButton);

        this.title = new QLabel();
        this.title.setText(translate("gui.sidebar.commands"));
        this.title.setProperty("class", "title");
        this.title.setAlignment(AlignmentFlag.AlignCenter);
        titleRowLayout.addWidget(this.title);

        const rightButton = new QPushButton();
        rightButton.setIcon(new QIcon(assets.rightArrow));
        rightButton.setObjectName("flatButton");
        rightButton.setFixedSize(24, 24);
        rightButton.addEventListener("clicked", () => this.switchView(1));
        titleRowLayout.addWidget(rightButton);

        sidebarLayout.addWidget(titleRow);

        const searchInput = new QLineEdit();
        searchInput.setPlaceholderText(translate("gui.searchPlaceholder"));
        searchInput.setObjectName("searchBox");
        searchInput.addEventListener("textChanged", (text) => this.handleSearch(text));
        sidebarLayout.addWidget(searchInput);

        const commandsContainer = new QScrollArea();
        const commandsWidget = new QWidget();

        commandsContainer.setVerticalScrollBarPolicy(ScrollBarPolicy.ScrollBarAlwaysOff);
        commandsContainer.setWidget(commandsWidget);
        commandsContainer.setWidgetResizable(true);

        guiApp.sidebarCommands = new QBoxLayout(Direction.TopToBottom);
        guiApp.sidebarCommands.addStretch();
        guiApp.sidebarCommands.addStretch();
        commandsWidget.setLayout(guiApp.sidebarCommands);

        sidebarLayout.addWidget(commandsContainer);
    }

    handleToggle() {
        if (guiApp.startWidget) return;

        const assets = guiApp.theme.assets;
        const commandContainer = guiApp.commandContainer;

        guiApp.sidebarVisible = !guiApp.sidebarVisible;

        this.setVisible(guiApp.sidebarVisible);
        commandContainer.sidebarButton.setToolTip(translate(
            guiApp.sidebarVisible
                ? "gui.menu.hideSidebar"
                : "gui.menu.showSidebar"
        ));
        commandContainer.sidebarButton.setIcon(new QIcon(
            guiApp.sidebarVisible
                ? assets.sidebarFilledIcon
                : assets.sidebarIcon
        ));

        appConfigs.cache.sidebarVisible = guiApp.sidebarVisible;
        writeAllConfigs();
    }

    updateView(appStart) {
        const views = {
            all: {
                title: translate("gui.sidebar.commands"),
                group: true,
                commands: () => Object.entries(app.commands.groups)
            },

            favorites: {
                title: translate("gui.sidebar.favorites"),
                commands: () => appConfigs.settings.favorites
            },

            recents: {
                title: translate("gui.sidebar.recents"),
                commands: () => appConfigs.cache.recents
            }
        };

        const currentView = views[guiApp.currentView];

        this.title.setText(currentView.title);

        for (const commandGroup of Object.values(guiApp.widgets.commands)) {
            for (const cmdData of Object.values(commandGroup.list)) {
                cmdData.widget.close();
                if (commandGroup.widget) commandGroup.widget.layout().removeWidget(cmdData.widget);
                else guiApp.sidebarCommands.removeWidget(cmdData.widget);
            }

            if (commandGroup.widget) {
                commandGroup.widget.close();
                guiApp.sidebarCommands.removeWidget(commandGroup.widget);
            }
        }

        if (guiApp.noCommandsLabel) {
            guiApp.noCommandsLabel.close();
            guiApp.sidebarCommands.removeWidget(guiApp.noCommandsLabel);
            delete guiApp.noCommandsLabel;
        }

        guiApp.widgets.commands = {};

        const viewCommands = currentView.commands();

        if (viewCommands.length <= 0) {
            guiApp.noCommandsLabel = new QLabel();
            guiApp.noCommandsLabel.setAlignment(AlignmentFlag.AlignCenter);
            guiApp.noCommandsLabel.setText(translate("gui.sidebar.none"));

            guiApp.sidebarCommands.insertWidget(1, guiApp.noCommandsLabel);
            return;
        }

        if (currentView.group) viewCommands.forEach(cmdEntry => this.displayCommandGroup(cmdEntry, appStart));
        else viewCommands.forEach(cmdName => this.displayCommandButton(cmdName, appStart));

        this.filterSearchCommands();
    }

    switchView(direction) {
        const currentIndex = guiApp.views.indexOf(guiApp.currentView);
        let newIndex = currentIndex + direction;

        if (newIndex < 0) newIndex = guiApp.views.length - 1;
        if (newIndex >= guiApp.views.length) newIndex = 0;

        guiApp.currentView = guiApp.views[newIndex];
        this.updateView();
    }

    createCommandButton(cmdName, command, isGroup) {
        const { selectedCommand } = guiApp;

        const commandButton = new QPushButton();
        commandButton.setText(wrapText(command.name, isGroup ? 165 : 190));
        commandButton.setToolTip(command.description);
        commandButton.addEventListener("clicked", () => {
            this.handleCommandSelection(cmdName, command, commandButton);
        });

        if (cmdName == selectedCommand.name) {
            commandButton.setObjectName("selectedCommand");
            selectedCommand.button = commandButton;
        }

        return commandButton;
    }

    displayCommandButton(cmdName, appStart) {
        const command = app.commands.all[cmdName];
        if (!command) return;

        const category = command.category;

        if (!guiApp.widgets.commands[category]) guiApp.widgets.commands[category] = {
            list: {}
        };

        const commandGroupData = guiApp.widgets.commands[category];
        const commandButton = this.createCommandButton(cmdName, command);

        commandGroupData.list[cmdName] = {
            widget: commandButton,
            command: command
        };

        const position = Object.values(guiApp.widgets.commands)
            .reduce((sum, commandGroup) => sum + Object.values(commandGroup.list).length, -1);
        guiApp.sidebarCommands.insertWidget(position, commandButton);

        if (appStart && appConfigs.cache.lastCommand == cmdName)
            this.handleCommandSelection(cmdName, command, commandButton);
    }

    displayCommandGroup([category, commands], appStart) {
        const commandGroup = new QWidget();
        const commandGroupLayout = new QBoxLayout(Direction.TopToBottom);
        commandGroup.setProperty("class", "group");
        commandGroup.setLayout(commandGroupLayout);

        const commandCategory = new QLabel();
        commandCategory.setText(translate(`categories.${category}`));
        commandCategory.setAlignment(AlignmentFlag.AlignCenter);
        commandCategory.setProperty("class", "groupLabel");
        commandGroupLayout.addWidget(commandCategory);

        if (!guiApp.widgets.commands[category])
            guiApp.widgets.commands[category] = {
                widget: commandGroup,
                list: {}
            };

        for (const [cmdName, command] of Object.entries(commands)) {
            const commandGroupData = guiApp.widgets.commands[category];
            const commandButton = this.createCommandButton(cmdName, command, commandGroup);

            if (command.forLocalCommand)
                commandButton.setProperty("class", "bold");

            commandGroup.layout().addWidget(commandButton);
            commandGroupData.list[cmdName] = {
                widget: commandButton,
                command: command
            };

            if (appStart && appConfigs.cache.lastCommand == cmdName)
                this.handleCommandSelection(cmdName, command, commandButton);
        }

        const position = Object.keys(guiApp.widgets.commands).length - 1;
        guiApp.sidebarCommands.insertWidget(position, commandGroup);
    }

    filterSearchCommands() {
        for (const commandGroup of Object.values(guiApp.widgets.commands)) {
            let visible = false;

            for (const cmdData of Object.values(commandGroup.list)) {
                const cmdName = cmdData.command.name;
                const commandMatch = !!cmdName.toLowerCase().includes(guiApp.currentSearch);
                cmdData.widget.setVisible(commandMatch);
                visible ||= commandMatch;
            }

            if (commandGroup.widget) commandGroup.widget.setVisible(visible);
        }
    }

    handleSearch(text) {
        guiApp.currentSearch = text.toLowerCase();

        this.filterSearchCommands();
    }

    async handleCommandSelection(name, command, button) {
        const { commandContainer, selectedCommand } = guiApp;
        const assets = guiApp.theme.assets;

        for (const movie of Object.values(guiApp.widgets.movies)) movie.delete();
        guiApp.widgets.movies = {};

        for (const argGroup of Object.values(guiApp.widgets.args)) {
            if (argGroup.fields && argGroup.container) {
                for (const arg of Object.values(argGroup.fields)) {
                    arg.close();
                }
                argGroup.container.close();
            } else argGroup.close();
        }
        guiApp.widgets.args = {};
        guiApp.widgets.argFields = {};

        for (const editorButton of Object.values(guiApp.widgets.editors)) editorButton.close();
        guiApp.widgets.editors = {};

        if (Object.keys(app.commandTasks).length > 0 && !guiApp.tasklistVisible)
            guiApp.tasklistWidget.handleToggle();

        if (selectedCommand.button) selectedCommand.button.setObjectName("");

        selectedCommand.name = name;
        selectedCommand.button = button;
        selectedCommand.data = command;

        selectedCommand.button.setObjectName("selectedCommand");

        appConfigs.cache.lastCommand = name;
        writeAllConfigs();

        commandContainer.title.setText(wrapText(command.name, guiApp.commandWidget));
        commandContainer.description.setText(wrapText(command.description, guiApp.commandWidget));
        commandContainer.favoriteButton.setIcon(new QIcon(
            appConfigs.settings.favorites.includes(name)
                ? assets.starFilledIcon
                : assets.starIcon
        ));
        commandContainer.favoriteButton.setToolTip(
            appConfigs.settings.favorites.includes(name)
                ? translate("gui.menu.removeFavorite")
                : translate("gui.menu.addFavorite")
        );
        guiApp.commandWidget.createMenu();

        guiApp.executeLabel.setVisible(false);
        guiApp.executeButton.setCursor(CursorShape.ArrowCursor);
        guiApp.executeButton.setText(translate("gui.executeButton"));

        guiApp.argFields = {};
        guiApp.validFiles = {};
        guiApp.modifiedArgs = [];

        if (guiApp.startWidget) {
            guiApp.startWidget.close();
            guiApp.centralLayout.insertWidget(1, guiApp.commandWidget);
            delete guiApp.startWidget;
        }

        guiApp.argsWidget.close();
        guiApp.argsWidget = new ArgsContainer();

        guiApp.argsContainer.setWidget(guiApp.argsWidget);
        guiApp.argsContainer.setWidgetResizable(true);

        if (command.editors)
            command.editors.forEach((editorName) => {
                const editorButton = new QPushButton();
                editorButton.setText(translate("editors.title", translate(`editors.commands.${editorName}`)))
                editorButton.setSizePolicy(QSizePolicyPolicy.Fixed, QSizePolicyPolicy.Fixed);
                editorButton.addEventListener("clicked", () => displayEditor(editorName, command));

                guiApp.editorsLayout.addWidget(editorButton);
                guiApp.widgets.editors[editorName] = editorButton;
            });

        let hasMore = Object.values(command.args ?? {}).some(arg => arg.gui?.more) ||
            (command.globalArgs ?? []).some(arg => app.globalArgs[arg].gui?.more);

        guiApp.argsWidget.moreArgsButton.setVisible(hasMore);

        if (command.args)
            Object.entries(command.args)
                .forEach((arg) => addArgField(arg));

        if (command.globalArgs)
            command.globalArgs.map((argName) => [argName, app.globalArgs[argName]])
                .forEach((arg) => addArgField(arg));

        guiApp.argsContainerLayout.addStretch();
        updateArgFields();
    }
}

module.exports = SidebarContainer;