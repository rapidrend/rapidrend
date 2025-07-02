const {
    QWidget, QLabel, QScrollArea, QBoxLayout,
    QLineEdit, QSizePolicyPolicy, QPushButton,
    QIcon, QGraphicsDropShadowEffect, QColor,
    QDrag, QMouseEvent, QPoint, QUrl, QMimeData,

    AlignmentFlag, Direction, ScrollBarPolicy,
    AspectRatioMode, TransformationMode,
    WidgetEventTypes, CursorShape,
} = require("@nodegui/nodegui");

const FileEmbed = require("#classes/FileEmbed");

const open = require("open");

const { translate } = require("#functions/translate");
const { writeAllConfigs } = require("#functions/filesystem");
const { validateFile, scaledDimensions } = require("#functions/media");

const { displayOutput, createPreview, clearOutput } = require("../utils/media");
const { displayPopup, addConnection, removeConnection, removeAllConnections } = require("../utils/general");
const { updateArgFields } = require("../utils/args");

class TasklistContainer extends QWidget {
    constructor() {
        super();

        guiApp.tasklistVisible = false;
        this.setVisible(false);

        const tasklistLayout = new QBoxLayout(Direction.TopToBottom);

        this.setLayout(tasklistLayout);
        this.setProperty("class", "container");
        this.setFixedWidth(220);
        this.setSizePolicy(QSizePolicyPolicy.Maximum, QSizePolicyPolicy.Expanding);

        const title = new QLabel();
        title.setText(translate("gui.tasks.title"));
        title.setProperty("class", "title");
        title.setAlignment(AlignmentFlag.AlignCenter);

        tasklistLayout.addWidget(title);

        const searchInput = new QLineEdit();
        searchInput.setPlaceholderText(translate("gui.searchPlaceholder"));
        searchInput.setObjectName("searchBox");
        searchInput.addEventListener("textChanged", (text) => this.handleSearch(text));
        tasklistLayout.addWidget(searchInput);

        const tasksContainer = new QScrollArea();
        const tasksWidget = new QWidget();

        tasksContainer.setVerticalScrollBarPolicy(ScrollBarPolicy.ScrollBarAlwaysOff);
        tasksContainer.setWidget(tasksWidget);
        tasksContainer.setWidgetResizable(true);

        guiApp.tasklistTasks = new QBoxLayout(Direction.TopToBottom);
        guiApp.tasklistTasks.addStretch();
        guiApp.tasklistTasks.addStretch();
        tasksWidget.setLayout(guiApp.tasklistTasks);

        tasklistLayout.addWidget(tasksContainer);

        this.setupEventListeners();
    }

    async setupEventListeners() {
        app.emitters.commandTask.on("start", (task) => {
            this.displayCommandTask(task);
        });

        app.emitters.commandTask.on("end", (task) => {
            this.updateTaskStatus(task);
        });

        app.emitters.childProcess.on("create", (proc) => {
            this.updateProcessStatus(proc);
        });

        app.emitters.childProcess.on("end", (proc) => {
            this.updateProcessStatus(proc);
        });
    }

    handleToggle() {
        const assets = guiApp.theme.assets;
        const commandContainer = guiApp.commandContainer;

        guiApp.tasklistVisible = !guiApp.tasklistVisible;

        this.setVisible(guiApp.tasklistVisible);
        commandContainer.tasklistButton.setToolTip(translate(
            guiApp.tasklistVisible
                ? "gui.menu.hideTasklist"
                : "gui.menu.showTasklist"
        ));
        commandContainer.tasklistButton.setIcon(new QIcon(
            guiApp.tasklistVisible
                ? assets.tasklistFilledIcon
                : assets.tasklistIcon
        ));

        appConfigs.cache.tasklistVisible = guiApp.tasklistVisible;
        writeAllConfigs();
    }

    updateView() {
        for (const widget of Object.values(guiApp.widgets.tasks)) {
            widget.close();
            guiApp.tasklistTasks.removeWidget(widget);
        }

        if (guiApp.noTasksLabel) {
            guiApp.noTasksLabel.close();
            guiApp.tasklistTasks.removeWidget(guiApp.noTasksLabel);
            delete guiApp.noTasksLabel;
        }

        guiApp.widgets.tasks = {};

        if (Object.keys(app.commandTasks).length === 0) {
            const noTasksLabel = new QLabel();
            noTasksLabel.setAlignment(AlignmentFlag.AlignCenter);
            noTasksLabel.setText(translate("gui.tasks.none"));

            guiApp.tasklistTasks.insertWidget(1, noTasksLabel);
            guiApp.noTasksLabel = noTasksLabel;
            return;
        }

        for (const task of Object.values(app.commandTasks)) {
            this.displayCommandTask(task);
        }
    }

    displayCommandTask(commandTask) {
        if (guiApp.noTasksLabel) {
            guiApp.noTasksLabel.close();
            guiApp.tasklistTasks.removeWidget(guiApp.noTasksLabel);
            delete guiApp.noTasksLabel;
        }

        const taskWidget = new QWidget();
        taskWidget.setProperty("class", "group");
        taskWidget.setObjectName("taskGroup-running");
        taskWidget.setToolTip(Object.entries(commandTask.args).map(
            ([argName, argValue]) => {
                const argData = commandTask.command.args[argName] ?? app.globalArgs[argName];
                return `${argData.name}: ${String(argValue?.path ?? argData.settings?.allowed?.[String(argValue)] ?? argValue) || "<none>"}`
            }
        ).join("\n"));

        const layout = new QBoxLayout(Direction.TopToBottom);
        taskWidget.setLayout(layout);

        const header = new QLabel();
        header.setText(`${translate("gui.tasks.task")} #${commandTask.id}`);
        header.setProperty("class", "groupLabel");
        header.setObjectName("taskGroup-running");
        header.setAlignment(AlignmentFlag.AlignCenter);
        header.setWordWrap(true);
        layout.addWidget(header);

        const previewLabel = new QLabel();
        previewLabel.setObjectName("taskGroup-running");
        previewLabel.setAlignment(AlignmentFlag.AlignCenter);
        previewLabel.setVisible(false);
        layout.addWidget(previewLabel);

        const commandName = new QLabel();
        commandName.setText(
            `<b>${translate("gui.tasks.command")}:</b> ${commandTask.command.name}`
        );
        commandName.setObjectName("taskGroup-running");
        commandName.setWordWrap(true);
        layout.addWidget(commandName);

        const statusLabel = new QLabel();
        statusLabel.setObjectName("taskGroup-running");
        statusLabel.setWordWrap(true);
        layout.addWidget(statusLabel);

        const processesLabel = new QLabel();
        processesLabel.setObjectName("taskGroup-running");
        processesLabel.setWordWrap(true);
        layout.addWidget(processesLabel);

        const pathsLabel = new QLabel();
        pathsLabel.setObjectName("taskGroup-running");
        pathsLabel.setWordWrap(true);
        layout.addWidget(pathsLabel);

        const displayButton = new QPushButton();
        displayButton.setVisible(false);
        displayButton.setText(translate("gui.tasks.show"));
        displayButton.addEventListener("clicked", () => {
            if (commandTask.status == "completed")
                displayOutput(commandTask);
            if (commandTask.status == "failed")
                displayPopup("error", translate("popupDisplay.status.error.commandExecute"), commandTask.error);
        });
        layout.addWidget(displayButton);

        const cancelButton = new QPushButton();
        cancelButton.setText(translate("gui.tasks.cancel"));
        cancelButton.setProperty("class", "danger");
        cancelButton.addEventListener("clicked", () => {
            if (
                commandTask.status != "running" &&
                commandTask.status != "cancelling"
            ) {
                this.removeCommandTask(commandTask);
                return
            }

            cancelButton.setText(translate("gui.tasks.forceCancel"));
            cancelButton.setObjectName("terror");
            commandTask.cancel();

            this.updateTaskStatus(commandTask);
        });
        layout.addWidget(cancelButton);

        const glowEffect = new QGraphicsDropShadowEffect();
        glowEffect.setEnabled(false);
        glowEffect.setBlurRadius(10);
        glowEffect.setXOffset(0);
        glowEffect.setYOffset(0);

        taskWidget.setGraphicsEffect(glowEffect);

        guiApp.tasklistTasks.insertWidget(0, taskWidget);
        guiApp.widgets.tasks[commandTask.id] = taskWidget;

        taskWidget.commandTask = commandTask;

        taskWidget.header = header;
        taskWidget.previewLabel = previewLabel;
        taskWidget.commandLabel = commandName;
        taskWidget.statusLabel = statusLabel;
        taskWidget.processesLabel = processesLabel;
        taskWidget.pathsLabel = pathsLabel;
        taskWidget.displayButton = displayButton;
        taskWidget.cancelButton = cancelButton;
        taskWidget.glowEffect = glowEffect;

        this.updateTaskStatus(commandTask);
    }

    async removeCommandTask(commandTask) {
        const taskWidgets = guiApp.widgets.tasks;

        if (taskWidgets[commandTask.id]) {
            taskWidgets[commandTask.id].close();
            guiApp.tasklistTasks.removeWidget(taskWidgets[commandTask.id]);
            delete taskWidgets[commandTask.id];
        }

        if (guiApp.outputWidget?.commandTask?.id == commandTask.id)
            clearOutput();

        if (commandTask.output && commandTask.output instanceof FileEmbed) {
            for (const [key, val] of Object.entries(guiApp.argFields)) {
                if (Array.isArray(val) && val.every(val => val instanceof FileEmbed)) {
                    for (let v of val) {
                        if (commandTask.output.tempPath == v)
                            val.splice(val.findIndex(vv => vv == v), 1);
                    }
                }

                if (commandTask.output.tempPath == val)
                    guiApp.argFields[key] = null;
            }
            await updateArgFields();
            commandTask.output.remove();
        }

        removeAllConnections(`task${commandTask.id}`);

        if (Object.keys(taskWidgets).length === 0) {
            this.handleToggle();
            this.updateView();
        }
    }

    async updateTaskStatus(task) {
        const colors = guiApp.theme.colors;

        const taskWidget = guiApp.widgets.tasks[task.id];
        if (!taskWidget) return;

        // it doesn wanna update
        taskWidget.setObjectName(`taskGroup-${task.status}`);
        taskWidget.header.setObjectName(`taskGroup-${task.status}`);
        taskWidget.commandLabel.setObjectName(`taskGroup-${task.status}`);
        taskWidget.previewLabel.setObjectName(`taskGroup-${task.status}`);
        taskWidget.statusLabel.setObjectName(`taskGroup-${task.status}`);
        taskWidget.processesLabel.setObjectName(`taskGroup-${task.status}`);
        taskWidget.pathsLabel.setObjectName(`taskGroup-${task.status}`);

        taskWidget.glowEffect.setEnabled(task.status != "running");
        taskWidget.glowEffect.setColor(new QColor(colors.taskGroups[task.status].border));

        taskWidget.statusLabel.setText(
            `<b>${translate("gui.tasks.status")}:</b> ${translate(`gui.tasks.statusText.${task.status}`)}`
        );

        taskWidget.processesLabel.setText(
            `<b>${translate("gui.tasks.processes")}:</b> ${Object.keys(task.processes).length}`
        );
        taskWidget.processesLabel.setToolTip(`${Object.keys(task.processes).map(p => `- ${p}`).join("\n")}`);

        taskWidget.pathsLabel.setText(`<b>${translate("gui.tasks.paths")}:</b> ${task.paths.length}`);
        taskWidget.pathsLabel.setToolTip(`${task.paths.map(p => `- ${p}`).join("\n")}`);

        if (
            task.status != "running" &&
            task.status != "cancelling"
        ) {
            taskWidget.cancelButton.setObjectName("");
            taskWidget.cancelButton.setText(translate("gui.tasks.delete"));

            if (task.status == "completed" || task.status == "failed") {
                taskWidget.displayButton.setVisible(true);
                if (task.output && task.output instanceof FileEmbed) {
                    const fileInfo = await validateFile(task.output.currentPath);
                    if (!fileInfo) return;

                    let pixmap = await createPreview(fileInfo);
                    if (!pixmap) return;

                    const scaledSize = scaledDimensions(pixmap, 140);
                    pixmap = pixmap.scaled(
                        scaledSize.width,
                        scaledSize.height,
                        AspectRatioMode.KeepAspectRatio,
                        TransformationMode.SmoothTransformation
                    );

                    taskWidget.previewLabel.setVisible(true);
                    taskWidget.previewLabel.setPixmap(pixmap);
                    taskWidget.previewLabel.setCursor(CursorShape.PointingHandCursor);

                    this.initDragListeners(taskWidget);
                }
            }
        }
    }

    updateProcessStatus(proc) {
        for (const [taskId, task] of Object.entries(app.commandTasks)) {
            if (task.processes[proc.pid]) {
                const taskWidget = guiApp.widgets.tasks[taskId];
                if (taskWidget)
                    taskWidget.processesLabel.setText(
                        `<b>${translate("gui.tasks.processes")}:</b> ${Object.keys(task.processes).length}`
                    );
            }
        }
    }

    handleSearch(text) {
        const searchTerm = text.toLowerCase();

        for (const widget of Object.values(guiApp.widgets.tasks)) {
            const task = widget.commandTask;
            const matches = task.command.name.toLowerCase().includes(searchTerm) ||
                searchTerm.match(new RegExp(`^(#?${task.id}#?)$`)) ||
                Object.entries(task.args).find(
                    ([argName, argValue]) =>
                        `${argName.toLowerCase()}=${String(argValue).toLowerCase()}` === searchTerm
                );

            widget.setVisible(matches != undefined);
        }
    }

    initDragListeners(taskWidget) {
        let mouseMoveConnection, mouseReleaseConnection;

        taskWidget.isDraggable = true;

        const mouseMove = (e) => {
            if (!taskWidget.dragStartPos) return;
            const event = new QMouseEvent(e);
            const currentPos = new QPoint(event.globalX(), event.globalY());

            const distance = Math.sqrt(
                Math.pow(currentPos.x() - taskWidget.dragStartPos.x(), 2) +
                Math.pow(currentPos.y() - taskWidget.dragStartPos.y(), 2)
            );

            if (distance > 10) {
                taskWidget.dragStartPos = null;
                taskWidget.previewLabel.setCursor(CursorShape.ClosedHandCursor);

                this.startFileDrag(taskWidget);

                mouseRelease();
            }
        };

        const mouseRelease = () => {
            if (taskWidget.dragStartPos) {
                open(taskWidget.commandTask.output.currentPath).catch(err => {
                    displayPopup("error", translate("popupDisplay.status.error.openFile"), err.message);
                });
            }

            taskWidget.dragStartPos = null;
            taskWidget.previewLabel.setCursor(CursorShape.PointingHandCursor);

            removeConnection(mouseMoveConnection);
            removeConnection(mouseReleaseConnection);
        };

        addConnection(`task${taskWidget.commandTask.id}`, "listener", {
            widget: taskWidget.previewLabel,
            signal: WidgetEventTypes.MouseButtonPress,
            callback: (e) => {
                if (!taskWidget.isDraggable) return;

                const event = new QMouseEvent(e);
                taskWidget.dragStartPos = new QPoint(event.globalX(), event.globalY());

                mouseMoveConnection = addConnection(`task${taskWidget.commandTask.id}`, "listener", {
                    widget: taskWidget.previewLabel,
                    signal: WidgetEventTypes.MouseMove,
                    callback: mouseMove
                });

                mouseReleaseConnection = addConnection(`task${taskWidget.commandTask.id}`, "listener", {
                    widget: taskWidget.previewLabel,
                    signal: WidgetEventTypes.MouseButtonRelease,
                    callback: mouseRelease
                });
            }
        });
    }

    startFileDrag(taskWidget) {
        if (!taskWidget.isDraggable || !(taskWidget.commandTask.output instanceof FileEmbed)) return;

        const mimeData = new QMimeData();
        const filePath = taskWidget.commandTask.output.currentPath.replace(/\\/g, "/");
        const url = QUrl.fromLocalFile(filePath);

        mimeData.setUrls([url]);
        mimeData.setText(filePath);
        mimeData.setData("text/uri-list", Buffer.from(url.toString(), "utf-8"));

        const drag = new QDrag(taskWidget.previewLabel);
        drag.setMimeData(mimeData);

        const pixmap = taskWidget.previewLabel.movie()?.currentPixmap() ?? taskWidget.previewLabel.pixmap();

        if (pixmap) {
            const scaledSize = scaledDimensions(pixmap, 50);

            const scaledPixmap = pixmap.scaled(
                scaledSize.width,
                scaledSize.height,
                AspectRatioMode.KeepAspectRatio,
                TransformationMode.SmoothTransformation
            );

            drag.setPixmap(scaledPixmap);
        }

        drag.exec();
    }

    monitorCommandTask(commandTask) {
        commandTask.emitters.childProcess.on("create", (proc) => {
            this.updateProcessStatus(proc);
        });

        commandTask.emitters.childProcess.on("end", (proc) => {
            this.updateProcessStatus(proc);
        });

        commandTask.emitters.path.on("add", () => {
            this.updateTaskStatus(commandTask);
        });
    }
}

module.exports = TasklistContainer;