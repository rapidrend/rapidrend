const {
    QSizePolicyPolicy, QWidget, QDragEnterEvent,
    QDropEvent, QBoxLayout, QLabel, QPushButton,
    QSize, QFileDialog, QColor, QGraphicsDropShadowEffect,
    QScrollArea, QGridLayout,

    AlignmentFlag, Direction, CursorShape, FileMode,
    WidgetEventTypes, AspectRatioMode, TransformationMode,
    FocusReason, Shape
} = require("@nodegui/nodegui");

const FileInfo = require("#classes/FileInfo");
const ExtendedMovie = require("../ExtendedMovie");

const path = require("path");

const { updateArgFields } = require("../../utils/args");
const { wrapText } = require("../../utils/general");
const { createPreview, createAnimatedPreview } = require("../../utils/media");

const { validateFile, scaledDimensions } = require("#functions/media");
const { arrayIncludes } = require("#functions/general");
const { hexToRgb } = require("#functions/math");

class MultiFileField extends QWidget {
    constructor(key, arg, fieldLabel, fieldLayout) {
        super();

        this.key = key;
        this.arg = arg;
        this.files = [];
        this.pendingFiles = [];
        this.grid = [];
        this.maxColumns = 4;
        this.addButton = null;

        fieldLabel.setAlignment(AlignmentFlag.AlignCenter);
        fieldLayout.setDirection(Direction.TopToBottom);

        this.setObjectName("galleryContainer");
        this.setSizePolicy(QSizePolicyPolicy.Expanding, QSizePolicyPolicy.Expanding);
        this.setMinimumSize(500, 300);
        this.setAcceptDrops(true);

        const mainLayout = new QBoxLayout(Direction.TopToBottom);
        this.setLayout(mainLayout);

        this.scrollArea = new QScrollArea();
        this.scrollArea.setObjectName("filesContainer");
        this.scrollArea.setWidgetResizable(true);
        this.scrollArea.setFrameShape(Shape.NoFrame);

        this.filesContainer = new QWidget();
        this.filesContainer.setObjectName("filesContainer");
        this.filesContainer.setSizePolicy(QSizePolicyPolicy.Expanding, QSizePolicyPolicy.Expanding);

        this.filesLayout = new QGridLayout();
        this.filesLayout.setSpacing(10);
        this.filesContainer.setLayout(this.filesLayout);

        this.scrollArea.setWidget(this.filesContainer);
        mainLayout.addWidget(this.scrollArea);

        this.addAddButton();

        this.glowEffect = new QGraphicsDropShadowEffect();
        this.glowEffect.setEnabled(false);
        this.glowEffect.setBlurRadius(20);
        this.glowEffect.setXOffset(0);
        this.glowEffect.setYOffset(0);
        this.glowEffect.setColor(new QColor(guiApp.theme.colors.primary));

        this.setGraphicsEffect(this.glowEffect);

        this.addEventListener(WidgetEventTypes.FocusIn, () => {
            guiApp.selectedArg = this;
        });

        this.addEventListener(WidgetEventTypes.FocusOut, () => {
            if (guiApp.selectedArg == this) delete guiApp.selectedArg;
        });

        this.addEventListener(WidgetEventTypes.DragEnter, (e) => {
            const event = new QDragEnterEvent(e);
            const mimeData = event.mimeData();
            if (mimeData.hasUrls())
                event.acceptProposedAction();
        });

        this.addEventListener(WidgetEventTypes.Drop, async (e) => {
            guiApp.selectedArg = this;

            const event = new QDropEvent(e);
            const mimeData = event.mimeData();
            const urls = mimeData.urls().map(url => url.toString());

            let selectedFiles = [];
            for (let url of urls) {
                if (url.startsWith("file://")) {
                    url = url.replace(/^file:\/\//, "");
                    if (process.platform === "win32" && url.startsWith("/"))
                        url = url.slice(1);
                    url = decodeURIComponent(url);
                }
                selectedFiles.push(url);
            }

            this.setFocus(FocusReason.MouseFocusReason);
            this.addFiles(selectedFiles);
            event.accept();

            if (guiApp.selectedArg == this && !this.hasFocus()) delete guiApp.selectedArg;
        });
    }

    addAddButton() {
        if (this.addButton) return;

        const addButton = new QPushButton();
        addButton.setText("+");
        addButton.setObjectName("addFileButton");
        addButton.setFixedSize(50, 50);
        addButton.setCursor(CursorShape.PointingHandCursor);

        addButton.addEventListener("clicked", () => {
            this.browseFiles();
        });

        this.addGridWidget(addButton);
        this.addButton = addButton;
    }

    addGridWidget(widget, initRow, initCol) {
        let row = initRow ?? this.grid[this.grid.length - 1]?.row ?? 0;
        let col = initCol ?? this.grid[this.grid.length - 1]?.col ?? -1;

        col++;
        if (col >= this.maxColumns) {
            col -= this.maxColumns;
            row++;
        }

        this.filesLayout.addWidget(
            widget, row, col,
            undefined, undefined, AlignmentFlag.AlignCenter
        );

        this.grid.push({ widget, row, col });
    }

    removeGridWidget(widget) {
        const gridIndex = this.grid.findIndex(item => item.widget == widget);
        if (gridIndex <= -1) return;

        this.filesLayout.removeWidget(widget);
        widget.hide();
        widget.delete();

        if (widget == this.addButton) this.addButton = null;

        this.grid.splice(gridIndex, 1);

        for (let i = gridIndex; i < this.grid.length; i++) {
            const gridItem = this.grid[i];

            let gridWidget = gridItem.widget;

            gridItem.col--;
            if (gridItem.col <= -1) {
                gridItem.col += this.maxColumns;
                gridItem.row--;
            }

            this.filesLayout.removeWidget(gridWidget);
            this.filesLayout.addWidget(
                gridWidget, gridItem.row, gridItem.col,
                undefined, undefined, AlignmentFlag.AlignCenter
            );
        }
    }

    browseFiles() {
        guiApp.selectedArg = this;

        const fileDialog = new QFileDialog();
        fileDialog.setFileMode(FileMode.ExistingFiles);
        fileDialog.setStyleSheet(guiApp.styleSheet);
        fileDialog.exec();
        let selectedFiles = fileDialog.selectedFiles();
        if (selectedFiles.length > 0)
            this.addFiles(selectedFiles);

        if (guiApp.selectedArg == this && !this.hasFocus()) delete guiApp.selectedArg;
    }

    addFiles(filePaths) {
        if (!filePaths || filePaths.length === 0) return;

        if (this.addButton) this.removeGridWidget(this.addButton);

        for (const filePath of filePaths) {
            const fileWidget = this.createFileWidget(filePath);
            this.addGridWidget(fileWidget);
            this.pendingFiles.push(filePath);
        }

        this.addAddButton();

        const files = [...this.files, ...this.pendingFiles];

        if (files.length >= (this.arg.settings?.min ?? 1)) {
            this.files = files;
            this.pendingFiles = [];
            this.validate(this.files);
        }
    }

    createFileWidget(filePath) {
        const [r, g, b] = hexToRgb(guiApp.theme.colors.button.bg);

        const container = new QWidget();
        container.setObjectName("fileContainer");
        container.setFixedSize(80, 100);

        const layout = new QBoxLayout(Direction.TopToBottom);
        layout.setSpacing(5);
        layout.setContentsMargins(0, 5, 0, 0);

        const preview = new QLabel();
        preview.setObjectName("filePreview");
        preview.setAlignment(AlignmentFlag.AlignCenter);
        preview.setFixedSize(70, 70);
        preview.setInlineStyle("background: none;")

        const fileName = new QLabel();
        fileName.setObjectName("fileName");
        fileName.setProperty("class", "small");
        fileName.setAlignment(AlignmentFlag.AlignCenter);
        fileName.setWordWrap(true);
        fileName.setText(wrapText(path.basename(filePath), container));
        fileName.setFixedWidth(70);
        fileName.setInlineStyle(`background: rgba(${r}, ${g}, ${b}, 0.8);`)

        const removeButton = new QPushButton();
        removeButton.setText("×");
        removeButton.setObjectName("removeFileButton");
        removeButton.setFixedSize(20, 20);
        removeButton.setCursor(CursorShape.PointingHandCursor);

        removeButton.addEventListener("clicked", () => {
            this.removeFile(filePath, container);
        });

        layout.addWidget(preview, 0, AlignmentFlag.AlignCenter);
        layout.addWidget(fileName, 0, AlignmentFlag.AlignCenter);
        layout.addWidget(removeButton, 0, AlignmentFlag.AlignRight);
        container.setLayout(layout);

        (async () => {
            const index = this.files.length + this.pendingFiles.length;
            const fileInfo = await validateFile(filePath);

            if (!fileInfo || !fileInfo.shortType) return;

            switch (fileInfo.shortType) {
                case "image":
                case "gif":
                case "video":
                case "audio": {
                    const movie = await createAnimatedPreview(fileInfo);
                    const pixmap = await createPreview(fileInfo);
                    const scaledSize = scaledDimensions(pixmap, 70);

                    if (movie) {
                        movie.start();
                        movie.setScaledSize(new QSize(
                            scaledSize.width,
                            scaledSize.height
                        ));
                        guiApp.widgets.movies[`${this.key}_${index}`] = movie;
                        if (movie instanceof ExtendedMovie) movie.setLabel(preview);
                        else preview.setMovie(movie);
                    } else if (pixmap) {
                        const scaledPixmap = pixmap.scaled(
                            scaledSize.width,
                            scaledSize.height,
                            AspectRatioMode.KeepAspectRatio,
                            TransformationMode.SmoothTransformation
                        );
                        preview.setPixmap(scaledPixmap);
                    }
                    break;
                }
            }
        })();

        return container;
    }

    removeFile(filePath, widget) {
        const pendingIndex = this.pendingFiles.indexOf(filePath);
        if (pendingIndex !== -1)
            this.pendingFiles.splice(pendingIndex, 1);
        else {
            const fileIndex = this.files.indexOf(filePath);
            if (fileIndex !== -1) {
                this.files.splice(fileIndex, 1);
                if (this.files.length >= (this.arg.settings?.min || 1))
                    this.validate(this.files);
                else {
                    guiApp.argFields[this.key] = undefined;
                    updateArgFields();
                }
            }
        }

        this.removeGridWidget(widget);
    }

    setFiles(selectedFiles) {
        this.pendingFiles = [];
        this.files = [];

        for (const gridItem of this.grid) {
            this.removeGridWidget(gridItem.widget);
        }

        this.addFiles(selectedFiles);
    }

    async validate(selectedFiles, forceValidateFiles) {
        if (forceValidateFiles) {
            this.setFiles(selectedFiles);
            return;
        }

        const includedFiles = arrayIncludes(guiApp.argFields[this.key], selectedFiles);
        if (selectedFiles != undefined && includedFiles && !forceValidateFiles) {
            guiApp.argFields[this.key] = includedFiles.map(index => guiApp.argFields[this.key][index]);
            guiApp.args[this.key] = includedFiles.map(index => guiApp.args[this.key][index]);
            return;
        }

        delete guiApp.validFiles[this.key];

        if (guiApp.widgets.movies[this.key]) {
            guiApp.widgets.movies[this.key].delete();
            delete guiApp.widgets.movies[this.key];
        }

        if (selectedFiles == undefined || selectedFiles.length === 0) {
            this.glowEffect.setEnabled(false);
            this.setInlineStyle("");
            return;
        }

        guiApp.window.setCursor(CursorShape.BusyCursor);

        if (!guiApp.modifiedArgs.includes(this.key)) guiApp.modifiedArgs.push(this.key);

        guiApp.argFields[this.key] = [...selectedFiles];
        await updateArgFields();

        const fileInfo = guiApp.args[this.key];
        const isFileInfo = Array.isArray(fileInfo)
            ? fileInfo.every(val => val instanceof FileInfo)
            : fileInfo instanceof FileInfo;

        this.glowEffect.setEnabled(isFileInfo);

        this.setInlineStyle(
            isFileInfo ? `border-color: ${guiApp.theme.colors.checkbox.hover};` : ""
        );

        guiApp.window.setCursor(CursorShape.ArrowCursor);
    }
}

module.exports = MultiFileField;