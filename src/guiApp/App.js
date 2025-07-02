const App = require("#main");

const {
    QMainWindow, QWidget, QIcon,
    QBoxLayout,

    Direction, WidgetEventTypes
} = require("@nodegui/nodegui");

const SidebarContainer = require("./containers/Sidebar");
const CommandContainer = require("./containers/Command");
const StartContainer = require("./containers/Start");
const TasklistContainer = require("./containers/Tasklist");

const path = require("path");

const { getThemeStyle } = require("./styles/GlobalStyles");
const { detectTheme, createTheme } = require("./styles/Themes");

const { killAllProcesses } = require("#functions/monitoring");

class GUIApp extends App {
    constructor() {
        super();

        global.app = this;
        global.guiApp = {};

        this.initGUIVars();
    }

    initGUIVars() {
        guiApp.keywordMode = false;

        guiApp.selectedCommand = {
            name: null,
            data: null,
            button: null
        };
        delete guiApp.selectedArg;

        guiApp.args = {};
        guiApp.argFields = {};

        guiApp.modifiedArgs = [];
        guiApp.validFiles = {};
        guiApp.connections = {};

        guiApp.widgets = {
            commands: {},
            args: {},
            editors: {},
            movies: {},
            tasks: {},
            dialogs: []
        };
    }

    async initUI() {
        guiApp.isDarkTheme = await detectTheme();
        guiApp.theme = createTheme(guiApp.isDarkTheme);

        guiApp.window = new QMainWindow();
        guiApp.window.setWindowIcon(new QIcon(path.join(__appPath, "assets", "gui", "app.svg")));
        guiApp.window.setWindowTitle("RapidRend");

        guiApp.window.resize(appConfigs.cache.windowState.width, appConfigs.cache.windowState.height);
        if (appConfigs.cache.windowState.maximized) guiApp.window.showMaximized();
        else guiApp.window.showNormal();

        guiApp.styleSheet = getThemeStyle(guiApp.isDarkTheme);
        guiApp.window.setStyleSheet(guiApp.styleSheet);

        guiApp.centralWidget = new QWidget();
        guiApp.centralLayout = new QBoxLayout(Direction.LeftToRight);
        guiApp.centralWidget.setLayout(guiApp.centralLayout);

        guiApp.sidebarWidget = new SidebarContainer();

        guiApp.commandWidget = new CommandContainer();
        guiApp.startWidget = new StartContainer();

        guiApp.tasklistWidget = new TasklistContainer();

        guiApp.centralLayout.insertWidget(0, guiApp.sidebarWidget);
        guiApp.centralLayout.insertWidget(1, guiApp.startWidget);
        guiApp.centralLayout.insertWidget(2, guiApp.tasklistWidget);

        guiApp.window.setCentralWidget(guiApp.centralWidget);
    }

    async initWindow() {
        await this.initUI();

        guiApp.window.show();
        
        guiApp.sidebarWidget.updateView(true);
        if (!appConfigs.cache.sidebarVisible) guiApp.sidebarWidget.handleToggle();

        guiApp.tasklistWidget.updateView();
        if (appConfigs.cache.tasklistVisible) guiApp.tasklistWidget.handleToggle();

        this.emitters.infoPost.on("event", (m) => {
            guiApp.executeLabel.setVisible(!!m);
            guiApp.executeLabel.setText(m);
        });

        guiApp.window.addEventListener(WidgetEventTypes.Close, () => {
            app.stopApp();
            guiApp.widgets.dialogs.forEach(dialog => dialog.close());
        });

        guiApp.window.addEventListener(WidgetEventTypes.WindowStateChange, () => this.changeWindowState());
        guiApp.window.addEventListener(WidgetEventTypes.Resize, () => this.changeWindowState());
    }

    changeWindowState() {
        appConfigs.cache.windowState = {
            width: guiApp.window.width(),
            height: guiApp.window.height(),
            maximized: guiApp.window.isMaximized()
        };
    }
}

module.exports = GUIApp;