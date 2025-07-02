const {
    QWidget, QBoxLayout, QLabel, QSizePolicyPolicy,
    QSize, QPushButton, QFileDialog, QScrollArea, QIcon,
    QMouseEvent, QCursor, QPoint, QMimeData, QDrag, QUrl,

    AlignmentFlag, AspectRatioMode, TransformationMode, CursorShape,
    TextInteractionFlag, WidgetEventTypes, FileMode, Direction,
    AcceptMode,
} = require("@nodegui/nodegui");

const FileEmbed = require("#classes/FileEmbed");
const ExtendedMovie = require("./ExtendedMovie");

const os = require("os");
const path = require("path");
const open = require("open");
const prettyBytes = require("pretty-bytes");

const { validateFile, scaledDimensions } = require("#functions/media");
const { translate } = require("#functions/translate");
const { makeOutputPath } = require("#functions/filesystem");

const { createPreview, createAnimatedPreview } = require("../utils/media");
const { displayPopup, addConnection, removeConnection, wrapText } = require("../utils/general");

class OutputPreview extends QWidget {
    constructor(commandTask) {
        super();

        this.commandTask = commandTask;
        this.output = commandTask.output;

        this.isResizing = false;
        this.startPos = 0;
        this.startHeight = 0;

        this.isDraggable = false;
        this.dragStartPos = null;

        this.setObjectName("outputPreview");
        this.setSizePolicy(QSizePolicyPolicy.Expanding, QSizePolicyPolicy.Preferred);
        this.setMinimumHeight(100);

        this.mainLayout = new QBoxLayout(Direction.TopToBottom);
        this.mainLayout.setContentsMargins(0, 0, 0, 0);
        this.mainLayout.setSpacing(0);
        this.setLayout(this.mainLayout);

        this.resizeHandle = new QLabel();
        this.resizeHandle.setObjectName("resizeHandle");
        this.resizeHandle.setCursor(new QCursor(CursorShape.SizeVerCursor));
        this.resizeHandle.setFixedHeight(8);
        this.mainLayout.addWidget(this.resizeHandle);

        this.contentWidget = new QWidget();
        this.mainLayout.addWidget(this.contentWidget);

        this.outputLayout = new QBoxLayout(Direction.TopToBottom);
        this.outputLayout.setContentsMargins(0, 0, 0, 0);
        this.contentWidget.setLayout(this.outputLayout);

        this.titleBar = new QWidget();
        this.titleBarLayout = new QBoxLayout(Direction.LeftToRight);
        this.titleBarLayout.setContentsMargins(0, 0, 0, 0);
        this.titleBar.setLayout(this.titleBarLayout);

        const outputTitle = new QLabel();
        outputTitle.setProperty("class", "title");
        outputTitle.setObjectName("outputTitle");
        outputTitle.setText(`${translate("gui.commandOutput")} (${translate("gui.tasks.task")} #${commandTask.id})`);
        outputTitle.setAlignment(AlignmentFlag.AlignCenter);

        this.closeButton = new QPushButton();
        this.closeButton.setIcon(new QIcon(guiApp.theme.assets.closeIcon));
        this.closeButton.setObjectName("flatRightButton");
        this.closeButton.setFixedSize(37, 24);

        this.titleBarLayout.addWidget(outputTitle, 1);
        this.titleBarLayout.addWidget(this.closeButton, 0, AlignmentFlag.AlignRight);

        this.outputLayout.addWidget(this.titleBar);

        this.outputName = new QLabel();
        this.outputName.setVisible(false);
        this.outputName.setAlignment(AlignmentFlag.AlignCenter);

        this.outputLayout.addWidget(this.outputName);

        this.outputSize = new QLabel();
        this.outputSize.setProperty("class", "small");
        this.outputSize.setVisible(false);
        this.outputSize.setAlignment(AlignmentFlag.AlignCenter);

        this.outputLayout.addWidget(this.outputSize);

        this.scrollArea = new QScrollArea();
        this.scrollArea.setWidgetResizable(true);
        this.scrollArea.setSizePolicy(QSizePolicyPolicy.Expanding, QSizePolicyPolicy.Expanding);

        this.scrollContent = new QWidget();
        this.scrollContent.setSizePolicy(QSizePolicyPolicy.Expanding, QSizePolicyPolicy.Expanding);
        this.scrollLayout = new QBoxLayout(Direction.TopToBottom);
        this.scrollContent.setLayout(this.scrollLayout);

        this.scrollArea.setWidget(this.scrollContent);
        this.outputLayout.addWidget(this.scrollArea);

        this.setupEventListeners();
    }

    async setupEventListeners() {
        let mouseMoveConnection,
            mouseReleaseConnection;

        const mouseMove = (e) => {
            if (!this.isResizing) return;
            const event = new QMouseEvent(e);
            const windowSize = guiApp.window.size();
            const delta = this.startPos - event.globalY();
            const newHeight = Math.clamp(this.startHeight + delta, 5, windowSize.height() - 300);

            this.setFixedHeight(newHeight);
            this.update();
        };

        const mouseRelease = () => {
            if (!this.isResizing) return;
            this.isResizing = false;
            removeConnection(mouseMoveConnection);
            removeConnection(mouseReleaseConnection);
        };

        addConnection("output", "listener", {
            widget: this.resizeHandle,
            signal: WidgetEventTypes.MouseButtonPress,
            callback: (e) => {
                const event = new QMouseEvent(e);
                this.isResizing = true;
                this.startPos = event.globalY();
                this.startHeight = this.height();

                mouseMoveConnection = addConnection("output", "listener", {
                    widget: guiApp.window,
                    signal: WidgetEventTypes.MouseMove,
                    callback: mouseMove
                });

                mouseReleaseConnection = addConnection("output", "listener", {
                    widget: guiApp.window,
                    signal: WidgetEventTypes.MouseButtonRelease,
                    callback: mouseRelease
                });
            }
        });
    }

    async load() {
        if (this.output instanceof FileEmbed) {
            const filePath = this.output.currentPath;
            const fileInfo = await validateFile(filePath);

            this.isDraggable = true;

            this.outputName.setVisible(true);
            this.outputName.setText(`<b>${fileInfo.name}</b>`);

            this.outputSize.setVisible(true);
            this.outputSize.setText(`(${prettyBytes(fileInfo.sizeBytes)})`);

            switch (fileInfo.shortType) {
                case "image":
                case "gif":
                case "video":
                case "audio": {
                    this.previewWidget = await this.displayPreview(fileInfo);
                    break;
                }

                default: {
                    const fileLabel = new QLabel();
                    fileLabel.setText(`${translate("gui.processedFile")}: ${fileInfo.name}`);
                    fileLabel.setProperty("class", "container");
                    fileLabel.setTextInteractionFlags(TextInteractionFlag.TextSelectableByMouse);
                    fileLabel.setAlignment(AlignmentFlag.AlignCenter);
                    this.scrollLayout.addWidget(fileLabel);

                    this.previewWidget = fileLabel;
                    break;
                }
            }

            this.openFolderButton = new QPushButton();
            this.openFolderButton.setText(translate("gui.openFolder"));
            addConnection("output", "listener", {
                widget: this.openFolderButton,
                signal: "clicked",
                callback: () => {
                    const fileFolder = path.parse(this.output.currentPath).dir;
                    open(fileFolder).catch(err => {
                        displayPopup("error", translate("popupDisplay.status.error.openFile"), err.message);
                    });
                }
            });

            this.saveButton = new QPushButton();
            this.saveButton.setText(translate("gui.saveFile"));
            addConnection("output", "listener", {
                widget: this.saveButton,
                signal: "clicked",
                callback: () => {
                    const fileDialog = new QFileDialog();
                    fileDialog.setFileMode(FileMode.AnyFile);
                    fileDialog.setAcceptMode(AcceptMode.AcceptSave);
                    fileDialog.setStyleSheet(guiApp.styleSheet);
                    fileDialog.setWindowTitle(translate("gui.saveFile"));
                    fileDialog.setWindowFilePath(path.join(os.homedir(), fileInfo.name));
                    fileDialog.setDefaultSuffix(fileInfo.type.ext);
                    fileDialog.exec();

                    const selectedPath = fileDialog.selectedFiles()[0];
                    if (selectedPath) {
                        const outputPath = makeOutputPath(this.output.currentPath, selectedPath);
                        this.output.move(outputPath);

                        const successLabel = new QLabel();
                        successLabel.setText(`${translate("gui.fileSaved")}: ${selectedPath}`);
                        successLabel.setAlignment(AlignmentFlag.AlignCenter);
                        this.scrollLayout.addWidget(successLabel);
                    }
                }
            });

            this.initDragListeners();
        } else {
            const outputLabel = new QLabel();
            outputLabel.setText(wrapText(String(this.output), this.scrollContent));
            outputLabel.setProperty("class", "container");
            outputLabel.setCursor(CursorShape.IBeamCursor);
            outputLabel.setTextInteractionFlags(TextInteractionFlag.TextSelectableByMouse);
            outputLabel.setWordWrap(true);
            outputLabel.setSizePolicy(QSizePolicyPolicy.Expanding, QSizePolicyPolicy.Expanding);

            const viewport = this.scrollArea.viewport();
            const scrollBar = this.scrollArea.verticalScrollBar();

            let isSelecting = false;
            let lastMovePos;

            let mouseIntervalConnection,
                mouseMoveConnection,
                mouseReleaseConnection;

            const mouseInterval = () => {
                if (!lastMovePos) return;

                const viewportPos = viewport.mapFromGlobal(lastMovePos);
                const currentY = viewportPos.y();

                const scrollPos = scrollBar.value();
                const viewportHeight = viewport.height();

                let delta = scrollPos;

                if (currentY < 0)
                    delta = scrollPos + (currentY / 2);
                else if (currentY > viewportHeight)
                    delta = scrollPos + (currentY - viewportHeight) / 2;

                scrollBar.setValue(delta);
            }

            const mouseMove = (e) => {
                if (!isSelecting) return;

                const event = new QMouseEvent(e);
                lastMovePos = new QPoint(event.globalX(), event.globalY());
            };

            const mouseRelease = () => {
                isSelecting = false;
                removeConnection(mouseIntervalConnection);
                removeConnection(mouseMoveConnection);
                removeConnection(mouseReleaseConnection);
            };

            addConnection("output", "listener", {
                widget: outputLabel,
                signal: WidgetEventTypes.MouseButtonPress,
                callback: () => {
                    isSelecting = true;

                    mouseIntervalConnection = addConnection("output", "interval", {
                        delay: 16,
                        callback: mouseInterval
                    });

                    mouseMoveConnection = addConnection("output", "listener", {
                        widget: outputLabel,
                        signal: WidgetEventTypes.MouseMove,
                        callback: mouseMove
                    });

                    mouseReleaseConnection = addConnection("output", "listener", {
                        widget: outputLabel,
                        signal: WidgetEventTypes.MouseButtonRelease,
                        callback: mouseRelease
                    });
                }
            });

            this.scrollLayout.addWidget(outputLabel);

            this.previewWidget = outputLabel;
        }

        const buttonLayout = new QBoxLayout(Direction.LeftToRight);
        buttonLayout.addStretch();

        if (this.openFileButton) buttonLayout.addWidget(this.openFileButton);
        if (this.openFolderButton) buttonLayout.addWidget(this.openFolderButton);
        if (this.saveButton) buttonLayout.addWidget(this.saveButton);
        buttonLayout.addStretch();

        this.outputLayout.addLayout(buttonLayout);
    }

    initDragListeners() {
        let mouseMoveConnection, mouseReleaseConnection;

        const mouseMove = (e) => {
            if (!this.dragStartPos) return;
            const event = new QMouseEvent(e);
            const currentPos = new QPoint(event.globalX(), event.globalY());

            const distance = Math.sqrt(
                Math.pow(currentPos.x() - this.dragStartPos.x(), 2) +
                Math.pow(currentPos.y() - this.dragStartPos.y(), 2)
            );

            if (distance > 10) {
                this.dragStartPos = null;
                this.previewWidget.setCursor(CursorShape.ClosedHandCursor);

                this.startFileDrag();

                mouseRelease();
            }
        };

        const mouseRelease = () => {
            if (this.dragStartPos) {
                open(this.output.currentPath).catch(err => {
                    displayPopup("error", translate("popupDisplay.status.error.openFile"), err.message);
                });
            }

            this.dragStartPos = null;
            this.previewWidget.setCursor(CursorShape.PointingHandCursor);

            removeConnection(mouseMoveConnection);
            removeConnection(mouseReleaseConnection);
        };

        addConnection("output", "listener", {
            widget: this.previewWidget,
            signal: WidgetEventTypes.MouseButtonPress,
            callback: (e) => {
                if (!this.isDraggable) return;

                const event = new QMouseEvent(e);
                this.dragStartPos = new QPoint(event.globalX(), event.globalY());

                mouseMoveConnection = addConnection("output", "listener", {
                    widget: this.previewWidget,
                    signal: WidgetEventTypes.MouseMove,
                    callback: mouseMove
                });

                mouseReleaseConnection = addConnection("output", "listener", {
                    widget: this.previewWidget,
                    signal: WidgetEventTypes.MouseButtonRelease,
                    callback: mouseRelease
                });
            }
        });
    }

    startFileDrag() {
        if (!this.isDraggable || !(this.output instanceof FileEmbed)) return;

        const mimeData = new QMimeData();
        const filePath = this.output.currentPath.replace(/\\/g, "/");
        const url = QUrl.fromLocalFile(filePath);

        mimeData.setUrls([url]);
        mimeData.setText(filePath);
        mimeData.setData("text/uri-list", Buffer.from(url.toString(), "utf-8"));

        const drag = new QDrag(this.previewWidget);
        drag.setMimeData(mimeData);

        const pixmap = this.previewWidget.movie()?.currentPixmap() ?? this.previewWidget.pixmap();

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

    async displayPreview(fileInfo) {
        const previewLabel = new QLabel();
        const movie = await createAnimatedPreview(fileInfo);

        const pixmap = await createPreview(fileInfo);

        previewLabel.setTextInteractionFlags(TextInteractionFlag.TextSelectableByMouse);
        previewLabel.setAlignment(AlignmentFlag.AlignCenter);
        previewLabel.setCursor(CursorShape.PointingHandCursor);

        if (movie) {
            movie.start();
            this.scaleMovie(movie, pixmap, previewLabel);
            guiApp.outputMovie = movie;
        } else {
            this.scaleImage(pixmap, previewLabel);
        }

        this.scrollLayout.addWidget(previewLabel, 0, AlignmentFlag.AlignCenter);

        addConnection("output", "listener", {
            widget: [guiApp.window, this.scrollArea],
            signal: WidgetEventTypes.Resize,
            callback: () => movie ? this.scaleMovie(movie, pixmap, previewLabel) : this.scaleImage(pixmap, previewLabel)
        });

        return previewLabel;
    }

    scaleImage(pixmap, imageLabel) {
        const scaledSize = scaledDimensions(pixmap, {
            width: this.scrollArea.width() - 20,
            height: this.scrollArea.height() - 20
        });
        const scaledPixmap = pixmap.scaled(
            scaledSize.width,
            scaledSize.height,
            AspectRatioMode.KeepAspectRatio,
            TransformationMode.SmoothTransformation
        );
        imageLabel.setPixmap(scaledPixmap);
    }

    scaleMovie(movie, pixmap, movieLabel) {
        const scaledSize = scaledDimensions(pixmap, {
            width: this.scrollArea.width() - 20,
            height: this.scrollArea.height() - 20
        });
        movie.setScaledSize(new QSize(scaledSize.width, scaledSize.height));
        if (movie instanceof ExtendedMovie) movie.setLabel(movieLabel);
        else movieLabel.setMovie(movie);
    }
}

module.exports = OutputPreview;