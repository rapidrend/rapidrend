const {
    QSizePolicyPolicy, QWidget, QDragEnterEvent,
    QDropEvent, QBoxLayout, QLabel, QPushButton,
    QSize, QFileDialog, QColor, QGraphicsDropShadowEffect,

    AlignmentFlag, Direction, CursorShape, FileMode,
    WidgetEventTypes, AspectRatioMode, TransformationMode,
    FocusReason,
} = require("@nodegui/nodegui");

const FileInfo = require("#classes/FileInfo");
const ExtendedMovie = require("../ExtendedMovie");

const path = require("path");

const { updateArgFields } = require("../../utils/args");
const { wrapText } = require("../../utils/general");
const { createPreview, createAnimatedPreview } = require("../../utils/media");

const { translate } = require("#functions/translate");
const { scaledDimensions } = require("#functions/media");
const { arrayIncludes } = require("#functions/general");

class FileField extends QWidget {
    constructor(key, arg, fieldLabel, fieldLayout) {
        super();

        this.key = key;
        this.arg = arg;

        fieldLabel.setAlignment(AlignmentFlag.AlignCenter);
        fieldLayout.setDirection(Direction.TopToBottom);

        this.setObjectName("galleryContainer");
        this.setSizePolicy(QSizePolicyPolicy.Expanding, QSizePolicyPolicy.Expanding);
        this.setFixedSize(200, 200);
        this.setAcceptDrops(true);

        const galleryLayout = new QBoxLayout(Direction.TopToBottom);
        galleryLayout.addStretch();

        this.setLayout(galleryLayout);

        this.browseButton = new QPushButton();
        this.browseButton.setText(translate("gui.argFields.file"));
        this.browseButton.setObjectName("galleryButton");
        this.browseButton.setSizePolicy(QSizePolicyPolicy.Expanding, QSizePolicyPolicy.Expanding);

        galleryLayout.addWidget(this.browseButton, 0, AlignmentFlag.AlignCenter);
        galleryLayout.addStretch();

        this.previewLabel = new QLabel();
        this.previewLabel.setAlignment(AlignmentFlag.AlignCenter);
        this.previewLabel.hide();

        this.fileNameLabel = new QLabel();
        this.fileNameLabel.setAlignment(AlignmentFlag.AlignCenter);
        this.fileNameLabel.setWordWrap(true);
        this.fileNameLabel.hide();

        galleryLayout.insertWidget(0, this.previewLabel);
        galleryLayout.addWidget(this.fileNameLabel);

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

        this.browseButton.addEventListener("clicked", () => {
            guiApp.selectedArg = this;

            const fileDialog = new QFileDialog();
            fileDialog.setFileMode(FileMode.ExistingFiles);
            fileDialog.setStyleSheet(guiApp.styleSheet);
            fileDialog.exec();
            let selectedFile = fileDialog.selectedFiles();
            if (selectedFile.length <= 1) selectedFile = selectedFile[0];
            if (selectedFile) this.validate(selectedFile);

            if (guiApp.selectedArg == this && !this.hasFocus()) delete guiApp.selectedArg;
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

            let selectedFile = [];
            for (let url of urls) {
                if (url.startsWith("file://")) {
                    url = url.replace(/^file:\/\//, "");
                    if (process.platform === "win32" && url.startsWith("/"))
                        url = url.slice(1);
                    url = decodeURIComponent(url);
                }
                selectedFile.push(url);
            }

            this.setFocus(FocusReason.MouseFocusReason);

            if (selectedFile.length <= 1) selectedFile = selectedFile[0];
            if (selectedFile) this.validate(selectedFile);

            event.accept();

            if (guiApp.selectedArg == this && !this.hasFocus()) delete guiApp.selectedArg;
        });
    }

    async validate(selectedFile, forceValidateFiles) {
        const includedFiles = arrayIncludes(guiApp.argFields[this.key], selectedFile);
        if (selectedFile != undefined &&
            (Array.isArray(selectedFile)
                ? includedFiles
                : guiApp.argFields[this.key] == selectedFile) && !forceValidateFiles
        ) {
            if (Array.isArray(selectedFile)) {
                guiApp.argFields[this.key] = includedFiles.map(index => guiApp.argFields[this.key][index]);
                guiApp.args[this.key] = includedFiles.map(index => guiApp.args[this.key][index]);

                this.fileNameLabel.setText(`${selectedFile.length} ${translate("gui.filesSelected")}`);
            }
            return;
        }

        delete guiApp.validFiles[this.key];

        if (guiApp.widgets.movies[this.key]) {
            guiApp.widgets.movies[this.key].delete();
            delete guiApp.widgets.movies[this.key];
        }

        if (selectedFile == undefined) {
            this.fileNameLabel.hide();
            this.browseButton.setObjectName("galleryButton");
            this.previewLabel.hide();
            this.glowEffect.setEnabled(false);
            this.setInlineStyle("");
            return;
        }

        guiApp.window.setCursor(CursorShape.BusyCursor);
        this.fileNameLabel.setText(translate("gui.readingFile"));
        this.fileNameLabel.show();

        if (!guiApp.modifiedArgs.includes(this.key)) guiApp.modifiedArgs.push(this.key);

        guiApp.argFields[this.key] = selectedFile;
        await updateArgFields();

        const fileInfo = guiApp.args[this.key];

        if (Array.isArray(selectedFile)) {
            this.browseButton.setObjectName("galleryButton");
            this.previewLabel.hide();
            this.fileNameLabel.setText(`${selectedFile.length} ${translate("gui.filesSelected")}`);
            this.glowEffect.setEnabled(fileInfo.every(val => val instanceof FileInfo));
            this.setInlineStyle(
                fileInfo.every(val => val instanceof FileInfo)
                    ? `border-color: ${guiApp.theme.colors.checkbox.hover};` : ""
            );

            guiApp.window.setCursor(CursorShape.ArrowCursor);
            return;
        }

        this.browseButton.setText(translate("gui.argFields.file"));
        this.fileNameLabel.setText(wrapText(path.basename(selectedFile), this));

        this.glowEffect.setEnabled(fileInfo instanceof FileInfo);
        this.setInlineStyle(
            fileInfo instanceof FileInfo
                ? `border-color: ${guiApp.theme.colors.checkbox.hover};` : ""
        );

        const containerWidth = this.width();
        const containerHeight = this.height() - this.fileNameLabel.height();

        switch (fileInfo?.shortType) {
            case "image":
            case "gif":
            case "video":
            case "audio": {
                const movie = await createAnimatedPreview(fileInfo);

                const pixmap = await createPreview(fileInfo);
                const scaledSize = scaledDimensions(pixmap, {
                    width: containerWidth,
                    height: containerHeight
                });

                if (movie) {
                    movie.start();
                    movie.setScaledSize(new QSize(
                        scaledSize.width,
                        scaledSize.height
                    ));
                    guiApp.widgets.movies[this.key] = movie;
                    if (movie instanceof ExtendedMovie) movie.setLabel(this.previewLabel);
                    else this.previewLabel.setMovie(movie);
                } else {
                    const scaledPixmap = pixmap.scaled(
                        scaledSize.width,
                        scaledSize.height,
                        AspectRatioMode.KeepAspectRatio,
                        TransformationMode.SmoothTransformation
                    );
                    this.previewLabel.setPixmap(scaledPixmap);
                }

                try {
                    this.browseButton.setObjectName("");
                    this.previewLabel.show();
                } catch {
                    if (movie) movie.delete();
                    return;
                }
                break;
            }

            default: {
                this.browseButton.setObjectName("galleryButton");
                this.previewLabel.hide();
                break;
            }
        }

        guiApp.window.setCursor(CursorShape.ArrowCursor);
    }
}

module.exports = FileField;