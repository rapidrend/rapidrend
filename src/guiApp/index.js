const path = require("path");
const os = require("os");
const open = require("open");

const {
    QMainWindow, QWidget, QLabel, QPushButton, QScrollArea,
    QBoxLayout, QLineEdit, QSize, QCheckBox, QFileDialog,
    QSizePolicyPolicy, QPixmap, QComboBox, QMovie,
    QDragEnterEvent, QDropEvent, QIcon, QApplication,

    AlignmentFlag, Direction, FileMode, ScrollBarPolicy,
    AspectRatioMode, WidgetEventTypes, TransformationMode,
    CursorShape, TextInteractionFlag, WindowType, ColorGroup,
    ColorRole
} = require("@nodegui/nodegui");

const { FileEmbed } = require("#modules");
const globalArgs = require("#utils/globalArgs");

const { addDefaultArgs, validateArg, getDefaultArgs } = require("#functions/arguments");
const { translate } = require("#functions/translate");
const { makeOutputPath } = require("#functions/filesystem");
const { validateFile } = require("#functions/media");
const { generateId, infoPost } = require("#functions/general");

let selectedCommand, selectedButton;

let args = {};
let argFields = {};

let modifiedArgs = [];
let validFiles = {};
let widgets = {
    commands: {},
    args: {},
    movies: {},
    errors: {}
}

let commandGroups;

class GUIApp {
    constructor(app) {
        const appPalette = QApplication.instance().palette();
        const windowTextColor = appPalette.color(ColorGroup.Active, ColorRole.WindowText);

        this.app = app;

        this.minSize = new QSize(800, 600);
        this.isDarkTheme = windowTextColor.red() > 128 && windowTextColor.green() > 128 && windowTextColor.blue() > 128;
        this.executing = false;

        this.appWindow = new QMainWindow();
        this.appWindow.setWindowIcon(new QIcon("assets/gui/app.svg"));
        this.appWindow.setWindowTitle("RapidRend");
        this.appWindow.resize(this.minSize.width(), this.minSize.height());

        this.appWindow.addEventListener(WidgetEventTypes.Close, () => Object.values(widgets.errors).forEach(errBox => errBox.close()))

        // Stylesheet with Theme Adaptation
        this.styleSheet = require("./stylesheet")(this.isDarkTheme);
        this.appWindow.setStyleSheet(this.styleSheet);

        // Main Widget
        this.centralWidget = new QWidget();
        this.centralLayout = new QBoxLayout(Direction.LeftToRight);
        this.centralWidget.setLayout(this.centralLayout);

        // Sidebar
        this.sidebarWidget = new QWidget();
        this.sidebarLayout = new QBoxLayout(Direction.TopToBottom);
        this.sidebarWidget.setLayout(this.sidebarLayout);
        this.sidebarWidget.setProperty("class", "container");
        this.sidebarWidget.setMinimumWidth(200);
        this.sidebarWidget.setSizePolicy(QSizePolicyPolicy.Maximum, QSizePolicyPolicy.Expanding);

        this.sidebarTitleLabel = new QLabel();
        this.sidebarTitleLabel.setText(translate("ui.sidebarTitle"));
        this.sidebarTitleLabel.setProperty("class", "title");
        this.sidebarTitleLabel.setAlignment(AlignmentFlag.AlignCenter);
        this.sidebarLayout.addWidget(this.sidebarTitleLabel);

        // Search Input
        this.searchInput = new QLineEdit();
        this.searchInput.setPlaceholderText(translate("ui.searchPlaceholder"));
        this.searchInput.setProperty("class", "search");
        this.searchInput.addEventListener("textChanged", (text) => this.handleSearch(text));
        this.sidebarLayout.addWidget(this.searchInput);

        // Commands
        this.commandsContainer = new QScrollArea();
        this.commandsWidget = new QWidget();
        this.commandsLayout = new QBoxLayout(Direction.TopToBottom);
        this.commandsLayout.addStretch();
        this.commandsWidget.setLayout(this.commandsLayout);
        this.commandsContainer.setVerticalScrollBarPolicy(ScrollBarPolicy.ScrollBarAlwaysOff);
        this.commandsContainer.setWidget(this.commandsWidget);
        this.commandsContainer.setWidgetResizable(true);
        this.sidebarLayout.addWidget(this.commandsContainer);

        // Main Container
        this.mainWidget = new QWidget();
        this.mainLayout = new QBoxLayout(Direction.TopToBottom);
        this.mainWidget.setProperty("class", "container");

        this.startWidget = new QWidget();
        this.startLayout = new QBoxLayout(Direction.TopToBottom);
        this.startWidget.setProperty("class", "container");
        this.startLayout.addStretch();

        this.titleLabel = new QLabel();
        this.titleLabel.setText(translate("ui.mainTitle"));
        this.titleLabel.setProperty("class", "title");
        this.titleLabel.setAlignment(AlignmentFlag.AlignCenter);
        this.startLayout.addWidget(this.titleLabel);

        this.descriptionLabel = new QLabel();
        this.descriptionLabel.setText(translate("ui.mainDescription"));
        this.descriptionLabel.setAlignment(AlignmentFlag.AlignCenter);
        this.startLayout.addWidget(this.descriptionLabel);

        this.startLayout.addStretch();

        // Command Title
        this.commandTitleLabel = new QLabel();
        this.commandTitleLabel.setProperty("class", "title");
        this.commandTitleLabel.setAlignment(AlignmentFlag.AlignCenter);
        this.mainLayout.addWidget(this.commandTitleLabel);

        // Command Description
        this.commandDescriptionLabel = new QLabel();
        this.commandDescriptionLabel.setAlignment(AlignmentFlag.AlignCenter);
        this.mainLayout.addWidget(this.commandDescriptionLabel);

        this.mainWidget.setLayout(this.mainLayout);
        this.startWidget.setLayout(this.startLayout);

        // Command Container
        this.argsContainer = new QScrollArea();
        this.argsWidget = new QWidget();
        this.argsLayout = new QBoxLayout(Direction.TopToBottom);
        this.argsWidget.setSizePolicy(QSizePolicyPolicy.Minimum, QSizePolicyPolicy.Minimum);
        this.argsWidget.setLayout(this.argsLayout);
        this.argsContainer.setWidget(this.argsWidget);
        this.argsContainer.setWidgetResizable(true);

        // File Args Container
        this.fileArgsWidget = new QWidget();
        this.fileArgsLayout = new QBoxLayout(Direction.LeftToRight);
        this.fileArgsLayout.addStretch();
        this.fileArgsWidget.setSizePolicy(QSizePolicyPolicy.Minimum, QSizePolicyPolicy.Minimum);
        this.fileArgsWidget.setLayout(this.fileArgsLayout);
        this.argsLayout.addWidget(this.fileArgsWidget);

        this.mainLayout.addWidget(this.argsContainer);

        // Add Execute Button
        this.executeWidget = new QWidget();
        this.executeLayout = new QBoxLayout(Direction.TopToBottom);
        this.executeButton = new QPushButton();
        this.executeLabel = new QLabel();
        this.executeLabel.setVisible(false);
        this.executeLabel.setProperty("class", "small");
        this.executeButton.setText(translate("ui.executeButton"));
        this.executeButton.setProperty("class", "execute");
        this.executeButton.setSizePolicy(QSizePolicyPolicy.Fixed, QSizePolicyPolicy.Fixed);
        this.executeButton.addEventListener("clicked", () => this.handleExecute());
        this.executeLayout.addWidget(this.executeButton, 0, AlignmentFlag.AlignCenter);
        this.executeLayout.addWidget(this.executeLabel, 0, AlignmentFlag.AlignCenter);
        this.executeWidget.setLayout(this.executeLayout);

        this.mainLayout.addWidget(this.executeWidget);

        // Add Sidebar and Main Container to Central Layout
        this.centralLayout.addWidget(this.sidebarWidget);
        this.centralLayout.addWidget(this.startWidget);

        this.appWindow.setCentralWidget(this.centralWidget);
    }

    handleSearch(text) {
        const searchText = text.toLowerCase();

        for (const commandGroup of Object.values(widgets.commands)) {
            let cmdGroupVisible = false;

            for (const cmdData of Object.values(commandGroup.list)) {
                const cmdName = cmdData.command.name;
                const commandMatch = !!cmdName.toLowerCase().includes(searchText);
                cmdData.widget.setVisible(commandMatch);
                cmdGroupVisible ||= commandMatch;
            }

            commandGroup.widget.setVisible(cmdGroupVisible);
        }
    }

    fieldVal(val, dft) {
        if (typeof val == "function") return dft;

        return val ?? dft;
    }

    async parseArgs(argsObj, fieldMode) {
        let err;

        for (const argName in argsObj) {
            const argData = selectedCommand.args?.[argName] || globalArgs[argName];
            if (argData == undefined) continue;
            if (argData.type == "file" && validFiles[argName]) {
                argsObj[argName] = fieldMode ? argFields[argName] : args[argName];
                continue;
            }

            const argValue = await validateArg(argsObj[argName], argData, args, fieldMode).catch((e) => err = e);
            if (!fieldMode && err) this.displayError(translate("errorDisplay.argumentValidate"), err);
            if (argValue == undefined || err) {
                continue;
            }

            argsObj[argName] = argValue;
            if (argData.type == "file" && !fieldMode) validFiles[argName] = argValue;
        }

        await addDefaultArgs(argsObj, selectedCommand, args, { fieldMode, modifiedArgs }).catch((err) => fieldMode && this.displayError(translate("errorDisplay.argumentValidate"), err));

        return argsObj;
    }

    async updateArgFields() {
        if (!selectedCommand) return;

        args = await this.parseArgs({ ...argFields }).catch((err) => this.displayError(translate("errorDisplay.argumentParse"), err));
        await this.parseArgs(argFields, true).catch((err) => this.displayError(translate("errorDisplay.argumentFieldParse"), err));

        let defaultArgs = await getDefaultArgs(selectedCommand, args).catch((err) => this.displayError(translate("errorDisplay.argumentParse"), err));

        for (const argName in args) {
            if (!modifiedArgs.includes(argName)) {
                args[argName] = defaultArgs[argName];
                argFields[argName] = defaultArgs[argName];
            }
        }

        for (const [argName, argValue] of Object.entries(argFields)) {
            const argData = selectedCommand.args?.[argName] || globalArgs[argName];
            const argField = widgets.argFields[argName];

            if (!argField) continue;

            if (argField instanceof QCheckBox) {
                argField.setChecked(this.fieldVal(argValue, false));
            } else if (argField instanceof QLineEdit) {
                argField.setText(this.fieldVal(argValue, ""));
            } else if (argField instanceof QComboBox) {
                const index = argData.settings.allowed.indexOf(argValue);
                if (index !== -1) {
                    argField.setCurrentIndex(index);
                }
            }
        }
    }

    displayError(title, text) {
        const errorID = generateId();

        const errLayout = new QBoxLayout(Direction.TopToBottom);
        const errBox = new QWidget();
        errBox.setWindowTitle(translate("errorDisplay.title"));
        errBox.setStyleSheet(this.styleSheet);
        errBox.setWindowFlag(WindowType.Dialog, true);
        errBox.setFixedWidth(400);
        errBox.setMaximumSize(600, 175);
        errBox.adjustSize();

        const errIcon = new QLabel();
        const errImage = new QPixmap();
        errImage.load("assets/gui/warn.png");
        errIcon.setPixmap(errImage);
        errIcon.setAlignment(AlignmentFlag.AlignCenter);
        errLayout.addWidget(errIcon);

        const errMessage = new QLabel();
        errMessage.setText(translate("errorDisplay.format").replace("%s", title));
        errMessage.setAlignment(AlignmentFlag.AlignCenter);
        errMessage.setProperty("class", "title");
        errLayout.addWidget(errMessage);

        const errDescription = new QLabel();
        errDescription.setText(text);
        errDescription.setAlignment(AlignmentFlag.AlignCenter);
        errLayout.addWidget(errDescription);

        errBox.setLayout(errLayout);

        errBox.show();

        widgets.errors[errorID] = errBox;
        errBox.addEventListener(WidgetEventTypes.Close, () => delete widgets.errors[errorID]);
    }

    async displayOutput(output) {
        // Clear previous output
        if (this.outputWidget) {
            this.outputWidget.close();
            this.mainLayout.removeWidget(this.outputWidget);

            if (this.outputMovie) this.outputMovie.delete();
            this.outputMovie = null;

            if (this.commandOutput instanceof FileEmbed) this.commandOutput.remove();
            
            if (this.outputResizeListener) this.appWindow.removeEventListener(this.outputResizeListener);
            this.outputResizeListener = null;
        }

        this.commandOutput = output;

        this.outputWidget = new QWidget();
        this.outputWidget.setProperty("class", "container");
        this.outputWidget.setSizePolicy(QSizePolicyPolicy.Expanding, QSizePolicyPolicy.Expanding);
        const outputLayout = new QBoxLayout(Direction.TopToBottom);
        this.outputWidget.setLayout(outputLayout);

        const outputName = new QLabel();
        outputName.setProperty("class", "title");
        outputName.setText(translate("ui.commandOutput"));
        outputName.setAlignment(AlignmentFlag.AlignCenter);

        outputLayout.addWidget(outputName);

        let openButton;
        let saveButton;

        if (output instanceof FileEmbed) {
            const filePath = output.currentPath;
            const fileInfo = await validateFile(filePath);

            outputName.setText(`${translate("ui.commandOutput")}${fileInfo ? `: ${fileInfo.name}` : ""}`);

            switch (fileInfo.shortType) {
                case "image": {
                    const imageLabel = new QLabel();
                    const pixmap = new QPixmap(filePath);

                    let containerSize = this.appWindow.size();
                    let scaledPixmap = pixmap.scaled(
                        Math.min(containerSize.width() / 2, pixmap.width()),
                        Math.min(containerSize.height() / 5, pixmap.height()),
                        AspectRatioMode.KeepAspectRatio,
                        TransformationMode.SmoothTransformation
                    );

                    imageLabel.setTextInteractionFlags(TextInteractionFlag.TextSelectableByMouse);
                    imageLabel.setAlignment(AlignmentFlag.AlignCenter);
                    imageLabel.setPixmap(scaledPixmap);
                    outputLayout.addWidget(imageLabel, 0, AlignmentFlag.AlignCenter);

                    this.outputResizeListener = this.appWindow.addEventListener(WidgetEventTypes.Resize, () => {
                        containerSize = this.appWindow.size();
                        scaledPixmap = pixmap.scaled(
                            Math.min(containerSize.width() / 2, pixmap.width()),
                            Math.min(containerSize.height() / 5, pixmap.height()),
                            AspectRatioMode.KeepAspectRatio,
                            TransformationMode.SmoothTransformation
                        );
                        imageLabel.setPixmap(scaledPixmap);
                    });
                    break;
                }

                case "gif": {
                    const movieLabel = new QLabel();
                    const movie = new QMovie();
                    movie.setFileName(filePath);

                    let containerSize = this.appWindow.size();
                    let pixmap = movie.currentPixmap();
                    movie.setScaledSize(new QSize(
                        Math.min(containerSize.width() / 2, pixmap.width()),
                        Math.min(containerSize.height() / 5, pixmap.height())
                    ));

                    movie.start();
                    movieLabel.setAlignment(AlignmentFlag.AlignCenter);
                    movieLabel.setMovie(movie);
                    outputLayout.addWidget(movieLabel, 0, AlignmentFlag.AlignCenter);

                    this.outputResizeListener = this.appWindow.addEventListener(WidgetEventTypes.Resize, () => {
                        if (!movie || !movie.currentPixmap || !movie.currentPixmap()) {
                            this.appWindow.removeEventListener(this.outputResizeListener);
                            return;
                        }

                        let containerSize = this.appWindow.size();
                        let pixmap = movie.currentPixmap();
                        movie.setScaledSize(new QSize(
                            Math.min(containerSize.width() / 2, pixmap.width()),
                            Math.min(containerSize.height() / 5, pixmap.height())
                        ));
                    });

                    this.outputMovie = movie;
                    break;
                }

                case "video": {
                    const imageLabel = new QLabel();
                    const pixmap = new QPixmap(`assets/gui/${this.isDarkTheme ? "dark" : "light"}/video.svg`);

                    let containerSize = this.appWindow.size();
                    let scaledPixmap = pixmap.scaled(
                        Math.min(containerSize.width() / 2, pixmap.width()),
                        Math.min(containerSize.height() / 5, pixmap.height()),
                        AspectRatioMode.KeepAspectRatio,
                        TransformationMode.SmoothTransformation
                    );

                    imageLabel.setAlignment(AlignmentFlag.AlignCenter);
                    imageLabel.setPixmap(scaledPixmap);
                    outputLayout.addWidget(imageLabel, 0, AlignmentFlag.AlignCenter);

                    this.outputResizeListener = this.appWindow.addEventListener(WidgetEventTypes.Resize, () => {
                        scaledPixmap = pixmap.scaled(
                            Math.min(containerSize.width() / 2, pixmap.width()),
                            Math.min(containerSize.height() / 5, pixmap.height()),
                            AspectRatioMode.KeepAspectRatio,
                            TransformationMode.SmoothTransformation
                        );
                        imageLabel.setPixmap(scaledPixmap);
                    });
                    break;
                }

                case "audio": {
                    const imageLabel = new QLabel();
                    const pixmap = new QPixmap(`assets/gui/${this.isDarkTheme ? "dark" : "light"}/audio.svg`);

                    let containerSize = this.appWindow.size();
                    let scaledPixmap = pixmap.scaled(
                        Math.min(containerSize.width() / 2, pixmap.width()),
                        Math.min(containerSize.height() / 5, pixmap.height()),
                        AspectRatioMode.KeepAspectRatio,
                        TransformationMode.SmoothTransformation
                    );

                    imageLabel.setAlignment(AlignmentFlag.AlignCenter);
                    imageLabel.setPixmap(scaledPixmap);
                    outputLayout.addWidget(imageLabel, 0, AlignmentFlag.AlignCenter);

                    this.outputResizeListener = this.appWindow.addEventListener(WidgetEventTypes.Resize, () => {
                        scaledPixmap = pixmap.scaled(
                            Math.min(containerSize.width() / 2, pixmap.width()),
                            Math.min(containerSize.height() / 5, pixmap.height()),
                            AspectRatioMode.KeepAspectRatio,
                            TransformationMode.SmoothTransformation
                        );
                        imageLabel.setPixmap(scaledPixmap);
                    });
                    break;
                }

                default: {
                    const fileLabel = new QLabel();
                    fileLabel.setText(`${translate("ui.processedFile")}: ${fileInfo.name}`);
                    fileLabel.setTextInteractionFlags(TextInteractionFlag.TextSelectableByMouse);
                    fileLabel.setAlignment(AlignmentFlag.AlignCenter);
                    outputLayout.addWidget(fileLabel);
                    break;
                }
            }

            // Add open file button
            openButton = new QPushButton();
            openButton.setText(translate("ui.openFile"));
            openButton.setProperty("class", "execute");
            openButton.addEventListener("clicked", () => {
                open(output.currentPath).catch(err => {
                    this.displayError(translate("errorDisplay.openFile"), err.message);
                });
            });

            // Add save button
            saveButton = new QPushButton();
            saveButton.setText(translate("ui.saveFile"));
            saveButton.setProperty("class", "execute");
            saveButton.addEventListener("clicked", () => {
                const fileDialog = new QFileDialog();
                fileDialog.setFileMode(FileMode.Directory);
                fileDialog.setStyleSheet(this.styleSheet);
                fileDialog.setWindowFilePath(path.join(os.homedir(), fileInfo.name));
                fileDialog.exec();

                const selectedPath = fileDialog.selectedFiles()[0];
                if (selectedPath) {
                    const outputPath = makeOutputPath(output.currentPath, selectedPath);
                    if (this.outputMovie) this.outputMovie.setFileName("");
                    output.move(outputPath);
                    if (this.outputMovie) this.outputMovie.setFileName(outputPath);

                    const successLabel = new QLabel();
                    successLabel.setText(`${translate("ui.fileSaved")}: ${selectedPath}`);
                    successLabel.setAlignment(AlignmentFlag.AlignCenter);
                    outputLayout.addWidget(successLabel);
                }
            });
        } else {
            const outputLabel = new QLabel();
            outputLabel.setText(String(output));
            outputLabel.setTextInteractionFlags(TextInteractionFlag.TextSelectableByMouse);
            outputLabel.setSizePolicy(QSizePolicyPolicy.Expanding, QSizePolicyPolicy.Expanding);
            outputLayout.addWidget(outputLabel, 0, AlignmentFlag.AlignLeft);
        }

        // Add close button
        const closeButton = new QPushButton();
        closeButton.setText("×");
        closeButton.setProperty("class", "close");
        closeButton.setFixedWidth(45);
        closeButton.addEventListener("clicked", () => {
            this.outputWidget.close();
            this.mainLayout.removeWidget(this.outputWidget);
            this.outputWidget = null;
            
            if (this.outputMovie) this.outputMovie.delete();
            this.outputMovie = null;

            if (this.outputResizeListener) this.appWindow.removeEventListener(this.outputResizeListener);
            this.outputResizeListener = null;
            
            if (this.commandOutput instanceof FileEmbed) this.commandOutput.remove();
            this.commandOutput = null;
        });

        // Add buttons to a horizontal layout
        const buttonLayout = new QBoxLayout(Direction.LeftToRight);
        if (!(output instanceof FileEmbed)) buttonLayout.addStretch();
        if (openButton) buttonLayout.addWidget(openButton);
        if (saveButton) buttonLayout.addWidget(saveButton);
        buttonLayout.addWidget(closeButton);
        outputLayout.addLayout(buttonLayout);

        this.mainLayout.addWidget(this.outputWidget);
    }

    addArgField([key, arg]) {
        const fieldContainer = new QWidget();
        const fieldLayout = new QBoxLayout(Direction.LeftToRight);
        fieldContainer.setSizePolicy(QSizePolicyPolicy.Minimum, QSizePolicyPolicy.Minimum);
        fieldContainer.setMinimumWidth(200);
        fieldContainer.setMaximumWidth(400);
        fieldContainer.setLayout(fieldLayout);

        const fieldLabel = new QLabel();
        fieldLabel.setText(arg.name);
        fieldLayout.addWidget(fieldLabel);

        let inputField;
        switch (arg.type) {
            case "boolean": {
                inputField = new QCheckBox();
                inputField.setSizePolicy(QSizePolicyPolicy.Expanding, QSizePolicyPolicy.Expanding);
                inputField.setToolTip(arg.desc);
                inputField.setChecked(this.fieldVal(arg.settings?.dft, false));
                inputField.addEventListener("toggled", (checked) => {
                    if (!modifiedArgs.includes(key)) modifiedArgs.push(key);
                    argFields[key] = checked;
                    this.updateArgFields();
                });
                break;
            }

            case "string": {
                if (arg.settings?.allowed && Array.isArray(arg.settings.allowed)) {
                    inputField = new QComboBox();
                    inputField.setSizePolicy(QSizePolicyPolicy.Expanding, QSizePolicyPolicy.Expanding);
                    inputField.setToolTip(arg.desc);
                    inputField.setMinimumWidth(200);
                    inputField.addItems(arg.settings.allowed);

                    const defaultValue = arg.settings.dft || arg.settings.allowed[0];
                    const index = arg.settings.allowed.indexOf(defaultValue);
                    if (index !== -1) {
                        inputField.setCurrentIndex(index);
                    } else {
                        inputField.setCurrentIndex(0);
                    }

                    inputField.addEventListener("currentIndexChanged", (i) => {
                        if (!modifiedArgs.includes(key)) modifiedArgs.push(key);
                        argFields[key] = arg.settings.allowed[i];
                        this.updateArgFields();
                    });

                    argFields[key] = inputField.currentText();
                } else {
                    inputField = new QLineEdit();
                    inputField.setSizePolicy(QSizePolicyPolicy.Expanding, QSizePolicyPolicy.Expanding);
                    inputField.setToolTip(arg.desc);
                    inputField.setMinimumWidth(200);
                    inputField.setPlaceholderText(arg.settings?.placeholder || `${translate("ui.argFields.string")} ${arg.name}`);
                    inputField.setText(this.fieldVal(arg.settings?.dft, ""));
                    inputField.addEventListener("editingFinished", () => {
                        if (!modifiedArgs.includes(key)) modifiedArgs.push(key);
                        argFields[key] = inputField.text();
                        this.updateArgFields();
                    });
                }
                break;
            }

            case "path": {
                inputField = new QLineEdit();
                inputField.setSizePolicy(QSizePolicyPolicy.Expanding, QSizePolicyPolicy.Expanding);
                inputField.setToolTip(arg.desc);
                inputField.setMinimumWidth(200);
                inputField.addEventListener("editingFinished", () => {
                    argFields[key] = inputField.text();
                    this.updateArgFields();
                });

                const browseButton = new QPushButton();
                browseButton.setText(translate("ui.argFields.file"));
                browseButton.addEventListener("clicked", () => {
                    const fileDialog = new QFileDialog();
                    fileDialog.setFileMode(FileMode.AnyFile); // Directory mode
                    fileDialog.setStyleSheet(this.styleSheet);
                    fileDialog.exec();
                    const selectedPath = fileDialog.selectedFiles()[0];
                    if (selectedPath) {
                        if (!modifiedArgs.includes(key)) modifiedArgs.push(key);
                        inputField.setText(selectedPath);
                        argFields[key] = selectedPath;
                    }
                    this.updateArgFields();
                });
                fieldLayout.addWidget(browseButton);
                break;
            }

            case "file": {
                fieldLabel.setAlignment(AlignmentFlag.AlignCenter);
                fieldLayout.setDirection(Direction.TopToBottom);

                // Gallery container (square)
                inputField = new QWidget();
                inputField.setObjectName("galleryContainer");
                inputField.setToolTip(arg.desc);
                const galleryLayout = new QBoxLayout(Direction.TopToBottom);
                inputField.setLayout(galleryLayout);
                inputField.setSizePolicy(QSizePolicyPolicy.Expanding, QSizePolicyPolicy.Expanding);
                inputField.setFixedSize(200, 200);
                inputField.setAcceptDrops(true);

                // Preview label for images
                const previewLabel = new QLabel();
                previewLabel.setAlignment(AlignmentFlag.AlignCenter);
                previewLabel.hide();

                // Browse button (initially centered)
                const browseButton = new QPushButton();
                browseButton.setText(translate("ui.argFields.file"));
                browseButton.setObjectName("galleryButton");
                browseButton.setSizePolicy(QSizePolicyPolicy.Expanding, QSizePolicyPolicy.Expanding);

                // Filename label at the bottom
                const fileNameLabel = new QLabel();
                fileNameLabel.setAlignment(AlignmentFlag.AlignCenter);
                fileNameLabel.hide();

                // Layout setup with stretches to center the button vertically
                galleryLayout.addStretch();
                galleryLayout.addWidget(browseButton, 0, AlignmentFlag.AlignCenter);
                galleryLayout.addStretch();
                galleryLayout.insertWidget(0, previewLabel); // Insert preview between stretches
                galleryLayout.addWidget(fileNameLabel);

                async function validateFileArg(selectedFile) {
                    if (argFields[key] == selectedFile) return;

                    delete validFiles[key];

                    if (widgets.movies[key]) {
                        widgets.movies[key].delete();
                        delete widgets.movies[key];
                    }
                    this.appWindow.setCursor(CursorShape.WaitCursor);
                    fileNameLabel.setText(translate("ui.readingFile"));
                    fileNameLabel.show();

                    if (!modifiedArgs.includes(key)) modifiedArgs.push(key);

                    argFields[key] = selectedFile;
                    await this.updateArgFields();

                    browseButton.setText(translate("ui.argFields.file"));
                    fileNameLabel.setText(path.basename(selectedFile));

                    const fileInfo = args[key];

                    switch (fileInfo?.shortType) {
                        case "image": {
                            const pixmap = new QPixmap(selectedFile);
                            const containerSize = inputField.size();
                            const scaledPixmap = pixmap.scaled(
                                Math.min(containerSize.width(), pixmap.width()),
                                Math.min(containerSize.height() - fileNameLabel.height(), pixmap.height()),
                                AspectRatioMode.KeepAspectRatio,
                                TransformationMode.SmoothTransformation
                            );
                            previewLabel.setPixmap(scaledPixmap);
                            browseButton.setObjectName("");
                            previewLabel.show();
                            break;
                        }

                        case "gif": {
                            const movie = new QMovie();
                            movie.setFileName(selectedFile);
                            movie.start();

                            const containerSize = inputField.size();
                            const pixmap = movie.currentPixmap();
                            movie.setScaledSize(new QSize(
                                Math.min(containerSize.width(), pixmap.width()),
                                Math.min(containerSize.height() - fileNameLabel.height(), pixmap.height())
                            ));

                            widgets.movies[key] = movie;
                            previewLabel.setMovie(movie);
                            browseButton.setObjectName("");
                            previewLabel.show();
                            break;
                        }

                        case "video": {
                            const pixmap = new QPixmap(`assets/gui/${this.isDarkTheme ? "dark" : "light"}/video.svg`);
                            const containerSize = inputField.size();
                            const scaledPixmap = pixmap.scaled(
                                Math.min(containerSize.width(), pixmap.width()),
                                Math.min(containerSize.height() - fileNameLabel.height(), pixmap.height()),
                                AspectRatioMode.KeepAspectRatio,
                                TransformationMode.SmoothTransformation
                            );
                            previewLabel.setPixmap(scaledPixmap);
                            browseButton.setObjectName("");
                            previewLabel.show();
                            break;
                        }

                        case "audio": {
                            const pixmap = new QPixmap(`assets/gui/${this.isDarkTheme ? "dark" : "light"}/audio.svg`);
                            const containerSize = inputField.size();
                            const scaledPixmap = pixmap.scaled(
                                Math.min(containerSize.width(), pixmap.width()),
                                Math.min(containerSize.height() - fileNameLabel.height(), pixmap.height()),
                                AspectRatioMode.KeepAspectRatio,
                                TransformationMode.SmoothTransformation
                            );
                            previewLabel.setPixmap(scaledPixmap);
                            browseButton.setObjectName("");
                            previewLabel.show();
                            break;
                        }

                        default: {
                            browseButton.setObjectName("galleryButton");
                            previewLabel.hide();
                            break;
                        }
                    }

                    this.appWindow.setCursor(CursorShape.ArrowCursor);
                }

                // Handle file selection
                browseButton.addEventListener("clicked", () => {
                    const fileDialog = new QFileDialog();
                    fileDialog.setFileMode(FileMode.ExistingFile);
                    fileDialog.setStyleSheet(this.styleSheet);
                    fileDialog.exec();
                    const selectedFile = fileDialog.selectedFiles()[0];
                    if (selectedFile) {
                        validateFileArg.call(this, selectedFile);
                    }
                });

                // Handle drag enter event
                inputField.addEventListener(WidgetEventTypes.DragEnter, (e) => {
                    const event = new QDragEnterEvent(e);
                    const mimeData = event.mimeData();
                    if (mimeData.hasUrls()) {
                        event.acceptProposedAction();
                    }
                });

                // Handle drop event
                inputField.addEventListener(WidgetEventTypes.Drop, async (e) => {
                    const event = new QDropEvent(e);
                    const mimeData = event.mimeData();
                    const urls = mimeData.urls();
                    if (urls.length === 0) return;

                    const url = urls[0];
                    let selectedFile = url.toString();

                    // Convert file URI to filesystem path
                    if (selectedFile.startsWith('file://')) {
                        selectedFile = selectedFile.replace(/^file:\/\//, '');
                        // Windows-specific path handling
                        if (process.platform === 'win32' && selectedFile.startsWith('/')) {
                            selectedFile = selectedFile.slice(1);
                        }
                        selectedFile = decodeURIComponent(selectedFile);
                    }

                    await validateFileArg.call(this, selectedFile);

                    event.accept();
                });
                break;
            }

            case "number": {
                inputField = new QLineEdit();
                inputField.setSizePolicy(QSizePolicyPolicy.Expanding, QSizePolicyPolicy.Expanding);
                inputField.setToolTip(arg.desc);
                inputField.setPlaceholderText(`${translate("ui.argFields.number")} (${arg.settings?.min || 0} - ${arg.settings?.max || 100})`);
                inputField.setMinimumWidth(200);
                inputField.setText(this.fieldVal(arg.settings?.dft, ""));
                inputField.addEventListener("editingFinished", () => {
                    const value = parseFloat(inputField.text());
                    if (!isNaN(value)) {
                        if (!modifiedArgs.includes(key)) modifiedArgs.push(key);
                        argFields[key] = value;
                    }
                    this.updateArgFields();
                });
                break;
            }

            case "pixels": {
                inputField = new QLineEdit();
                inputField.setSizePolicy(QSizePolicyPolicy.Expanding, QSizePolicyPolicy.Expanding);
                inputField.setToolTip(arg.desc);
                inputField.setPlaceholderText(`${translate("ui.argFields.pixels")} (0%-100%)`);
                inputField.setMinimumWidth(200);
                inputField.setText(this.fieldVal(arg.settings?.dft, ""));
                inputField.addEventListener("editingFinished", () => {
                    if (!modifiedArgs.includes(key)) modifiedArgs.push(key);
                    argFields[key] = inputField.text();
                    this.updateArgFields();
                });
                break;
            }

            case "timestamp": {
                inputField = new QLineEdit();
                inputField.setSizePolicy(QSizePolicyPolicy.Expanding, QSizePolicyPolicy.Expanding);
                inputField.setToolTip(arg.desc);
                inputField.setPlaceholderText(`${translate("ui.argFields.timestamp")} (00:00:00)`);
                inputField.setMinimumWidth(200);
                inputField.setText(this.fieldVal(arg.settings?.dft, ""));
                inputField.addEventListener("editingFinished", () => {
                    if (!modifiedArgs.includes(key)) modifiedArgs.push(key);
                    argFields[key] = inputField.text();
                    this.updateArgFields();
                });
                break;
            }

            default:
                console.warn(`${translate("ui.argFields.unsupported")}: ${arg.type}`);
        }

        if (inputField) {
            fieldLayout.addWidget(inputField, 0, AlignmentFlag.AlignCenter);
            if (arg.settings?.dft !== undefined) argFields[key] = arg.settings.dft;
        }

        if (arg.type == "file") this.fileArgsLayout.addWidget(fieldContainer, 0, AlignmentFlag.AlignCenter);
        else this.argsLayout.addWidget(fieldContainer, 0, AlignmentFlag.AlignCenter);

        widgets.args[key] = fieldContainer;
        widgets.argFields[key] = inputField;
    }

    async handleCommandSelection(command, button) {
        if (this.executing) return;
        
        for (const movie of Object.values(widgets.movies)) movie.delete();
        widgets.movies = {};

        // Clear previous output
        if (this.outputWidget) {
            this.outputWidget.close();
            this.mainLayout.removeWidget(this.outputWidget);
            this.outputWidget = null;
            
            if (this.outputMovie) this.outputMovie.delete();
            this.outputMovie = null;

            if (this.outputResizeListener) this.appWindow.removeEventListener(this.outputResizeListener);
            this.outputResizeListener = null;

            if (this.commandOutput instanceof FileEmbed) this.commandOutput.remove();
            this.commandOutput = null;
        }

        for (let widget of Object.values(widgets.args)) {
            widget.close();
        }

        // Update the selected button style
        if (selectedButton) selectedButton.setObjectName("");
        selectedButton = button;
        selectedButton.setObjectName("selected");

        // Update the command title
        this.commandTitleLabel.setText(command.name);
        this.commandDescriptionLabel.setText(command.description);

        this.executeLabel.setVisible(false);

        selectedCommand = command;
        argFields = {};

        if (this.startWidget) {
            this.startWidget.close();
            this.centralLayout.addWidget(this.mainWidget);
        }

        this.argsWidget.close();

        this.argsWidget = new QWidget();
        this.argsLayout = new QBoxLayout(Direction.TopToBottom);
        this.argsWidget.setSizePolicy(QSizePolicyPolicy.Minimum, QSizePolicyPolicy.Minimum);
        this.argsWidget.setLayout(this.argsLayout);
        this.argsContainer.setWidget(this.argsWidget);
        this.argsContainer.setWidgetResizable(true);

        this.fileArgsWidget = new QWidget();
        this.fileArgsLayout = new QBoxLayout(Direction.LeftToRight);
        this.fileArgsLayout.addStretch();
        this.fileArgsWidget.setSizePolicy(QSizePolicyPolicy.Minimum, QSizePolicyPolicy.Minimum);
        this.fileArgsWidget.setLayout(this.fileArgsLayout);
        this.argsLayout.addWidget(this.fileArgsWidget);

        widgets.args = {};
        widgets.argFields = {};

        // Add Argument Fields
        if (command.args) Object.entries(command.args).forEach((arg) => this.addArgField(arg));
        if (command.globalArgs) command.globalArgs.map((argName) => [argName, globalArgs[argName]]).forEach((arg) => this.addArgField(arg));
        this.argsLayout.addStretch();
        this.fileArgsLayout.addStretch();

        modifiedArgs = [];
        this.updateArgFields();
    }

    async handleExecute() {
        if (!selectedCommand || this.executing) return;

        this.appWindow.setCursor(CursorShape.WaitCursor);
        this.executeButton.setText(translate("ui.executingButton"));
        this.executing = true;

        try {
            await this.updateArgFields();
            const result = await selectedCommand.execute(args);

            await this.displayOutput(result);
        } catch (err) {
            infoPost(err);
            this.displayError(translate("errorDisplay.commandExecute"), err);
        }

        this.appWindow.setCursor(CursorShape.ArrowCursor);
        this.executeButton.setText(translate("ui.executeButton"));
        this.executing = false;
    }

    init() {
        commandGroups = this.app.commands.groups;

        Object.entries(commandGroups).forEach(([category, commands]) => {
            const commandGroup = new QWidget();
            const commandGroupLayout = new QBoxLayout(Direction.TopToBottom);
            commandGroup.setProperty("class", "group");
            commandGroup.setLayout(commandGroupLayout);

            const commandCategory = new QLabel();
            commandCategory.setText(translate(`categories.${category}`));
            commandCategory.setAlignment(AlignmentFlag.AlignCenter);
            commandCategory.setProperty("class", "group-label");
            commandGroupLayout.addWidget(commandCategory);

            widgets.commands[category] = {
                widget: commandGroup,
                list: {}
            };

            Object.entries(commands).forEach(([cmdName, command]) => {
                const commandGroupData = widgets.commands[category];

                const commandButton = new QPushButton();
                commandButton.setText(command.name);
                commandButton.setToolTip(command.description);
                commandButton.addEventListener("clicked", () => {
                    this.handleCommandSelection(command, commandButton);
                });

                commandGroupLayout.addWidget(commandButton);
                commandGroupData.list[cmdName] = {
                    widget: commandButton,
                    command: command
                };
            });

            this.commandsLayout.insertWidget(Object.keys(widgets.commands).length - 1, commandGroup);
        });

        this.app.infoPostEmitter.on("event", (m) => {
            this.executeLabel.setVisible(true);
            this.executeLabel.setText(m);
        });

        this.appWindow.show();
    }
}

module.exports = GUIApp;