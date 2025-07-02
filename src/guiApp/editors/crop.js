const {
    QWidget, QPixmap, QPainter, QPen, QColor, QBrush, QPoint,
    QRect, QMouseEvent, QWheelEvent, QPainterPath,

    CursorShape, KeyboardModifier, PenStyle,
    MouseButton, RenderHint, WidgetEventTypes
} = require("@nodegui/nodegui");

const { createPreview, createAnimatedPreview } = require("../utils/media");

const { hexToRgb } = require("#functions/math");
const { translate } = require("#functions/translate");

class CropEditor extends QWidget {
    constructor(editorName, command, args) {
        super();

        this.editorName = editorName;
        this.command = command;
        this.args = args;

        this.scale = 1.0;
        this.offset = new QPoint(0, 0);
        this.selectionStart = null;
        this.currentSelection = null;
        this.isPanning = false;
        this.isDraggingSelection = false;
        this.dragStartPos = null;
        this.selectionOffset = null;
        this.panStart = new QPoint();

        this.setMouseTracking(true);
        this.setCursor(CursorShape.CrossCursor);
        this.setObjectName("imageEditor");

        this.addEventListener(WidgetEventTypes.Paint, this.paintEvent.bind(this));
        this.addEventListener(WidgetEventTypes.MouseButtonPress, this.mousePressEvent.bind(this));
        this.addEventListener(WidgetEventTypes.MouseMove, this.mouseMoveEvent.bind(this));
        this.addEventListener(WidgetEventTypes.MouseButtonRelease, this.mouseReleaseEvent.bind(this));
        this.addEventListener(WidgetEventTypes.Wheel, this.wheelEvent.bind(this));
    }

    async setArgValues() {
        await this.setPixmap(this.args.input);
        this.setCurrentSelection();
    }

    async setPixmap(fileInfo) {
        fileInfo = Array.isArray(fileInfo) ? fileInfo[0] : fileInfo;

        if (!fileInfo?.path)
            throw translate("editors.error", translate("commands.crop.args.input.name"));

        this.movie = await createAnimatedPreview(fileInfo);

        if (this.movie) {
            this.pixmap = this.movie.currentPixmap();
            this.movie.addEventListener("frameChanged", () => {
                this.pixmap = this.movie.currentPixmap();
                this.update();
            });
            this.movie.start();
        } else {
            this.pixmap = await createPreview(fileInfo);
        }
        this.update();
    }

    setCurrentSelection() {
        if (
            this.args.width <= 0 || this.args.height <= 0 ||
            (this.args.width == this.pixmap.width() && this.args.height == this.pixmap.height())
        ) this.currentSelection = null;
        else this.currentSelection = new QRect(this.args.x, this.args.y, this.args.width, this.args.height);
        this.update();
    }

    resetArgValues() {
        this.currentSelection = null;

        this.update();
    }

    paintEvent() {
        const painter = new QPainter(this);
        painter.setRenderHint(RenderHint.Antialiasing, true);

        const imgW = this.pixmap.width() * this.scale;
        const imgH = this.pixmap.height() * this.scale;
        const tx = (this.width() - imgW) / 2 + this.offset.x();
        const ty = (this.height() - imgH) / 2 + this.offset.y();

        painter.save();
        painter.translate(tx, ty);
        painter.scale(this.scale, this.scale);

        const transparentBrush = new QBrush();
        transparentBrush.setTexture(new QPixmap(guiApp.theme.assets.transparentBackground));
        const painterPath = new QPainterPath();
        painterPath.addRect(0, 0, this.pixmap.width(), this.pixmap.height());
        painter.fillPath(painterPath, transparentBrush);

        painter.drawPixmap(0, 0, this.pixmap);
        painter.restore();

        painter.drawRect(tx, ty, imgW, imgH);

        if (this.currentSelection) {
            const sel = this.currentSelection;

            const selX = tx + sel.left() * this.scale;
            const selY = ty + sel.top() * this.scale;
            const selW = sel.width() * this.scale;
            const selH = sel.height() * this.scale;

            const outline = new QPen();
            outline.setColor(new QColor(...hexToRgb(guiApp.theme.colors.background), 100));
            outline.setStyle(PenStyle.SolidLine);

            const fillColor = new QColor(...hexToRgb(guiApp.theme.colors.primary), 100);
            painter.setPen(outline);
            painter.setBrush(fillColor);
            painter.drawRect(selX, selY, selW, selH);

            outline.setColor(new QColor(guiApp.theme.colors.text));
            outline.setStyle(PenStyle.DashLine);

            painter.setPen(outline);
            painter.setBrush(new QBrush(0, 0, 0, 0));
            painter.drawRect(selX, selY, selW, selH);
        }

        painter.end();
    }

    mousePressEvent(e) {
        const event = new QMouseEvent(e);
        const modifiers = event.modifiers();
        const pos = this.screenToImage(new QPoint(event.x(), event.y()));

        if (modifiers & KeyboardModifier.ControlModifier || event.button() === MouseButton.MiddleButton) {
            this.isPanning = true;
            this.panStart = new QPoint(event.x(), event.y());
            this.setCursor(CursorShape.ClosedHandCursor);
        } else if (
            this.currentSelection &&
            pos.x() > this.currentSelection.left() &&
            pos.x() < (this.currentSelection.left() + this.currentSelection.width()) &&
            pos.y() > this.currentSelection.top() &&
            pos.y() < (this.currentSelection.top() + this.currentSelection.height())
        ) {
            this.isDraggingSelection = true;
            this.dragStartPos = pos;
            this.selectionOffset = new QPoint(
                pos.x() - this.currentSelection.left(),
                pos.y() - this.currentSelection.top()
            );
            this.setCursor(CursorShape.ClosedHandCursor);
        } else {
            this.selectionStart = this.clampToImage(pos);
            this.currentSelection = new QRect(this.selectionStart.x(), this.selectionStart.y(), 0, 0);
        }
        this.update();
    }

    mouseMoveEvent(e) {
        const event = new QMouseEvent(e);
        const pos = new QPoint(event.x(), event.y());
        const modifiers = event.modifiers();
        const imagePos = this.clampToImage(this.screenToImage(pos));

        if (this.isPanning) {
            const delta = new QPoint(pos.x() - this.panStart.x(), pos.y() - this.panStart.y());
            this.panStart = pos;
            this.offset = new QPoint(this.offset.x() + delta.x(), this.offset.y() + delta.y());
            this.update();
        } else if (this.isDraggingSelection && this.currentSelection) {
            const newTopLeftX = imagePos.x() - this.selectionOffset.x();
            const newTopLeftY = imagePos.y() - this.selectionOffset.y();

            const newX = Math.max(0, Math.min(this.pixmap.width() - this.currentSelection.width(), newTopLeftX));
            const newY = Math.max(0, Math.min(this.pixmap.height() - this.currentSelection.height(), newTopLeftY));

            this.currentSelection = new QRect(
                newX, newY,
                this.currentSelection.width(),
                this.currentSelection.height()
            );
            this.update();
        } else if (this.selectionStart) {
            let dx = imagePos.x() - this.selectionStart.x();
            let dy = imagePos.y() - this.selectionStart.y();

            if (modifiers & KeyboardModifier.ShiftModifier) {
                const absDx = Math.abs(dx);
                const absDy = Math.abs(dy);
                if (absDx > absDy)
                    dy = Math.sign(dy || 1) * absDx;
                else
                    dx = Math.sign(dx || 1) * absDy;
            }

            let x1, y1, x2, y2;
            if (modifiers & KeyboardModifier.AltModifier) {
                x1 = this.selectionStart.x() - dx;
                y1 = this.selectionStart.y() - dy;
                x2 = this.selectionStart.x() + dx;
                y2 = this.selectionStart.y() + dy;
            } else {
                x1 = this.selectionStart.x();
                y1 = this.selectionStart.y();
                x2 = this.selectionStart.x() + dx;
                y2 = this.selectionStart.y() + dy;
            }

            const tx1 = Math.max(0, Math.min(x1, x2));
            const ty1 = Math.max(0, Math.min(y1, y2));
            const tx2 = Math.min(this.pixmap.width(), Math.max(x1, x2));
            const ty2 = Math.min(this.pixmap.height(), Math.max(y1, y2));

            this.currentSelection = new QRect(tx1, ty1, tx2 - tx1, ty2 - ty1);

            this.update();
        } else if (
            (modifiers & KeyboardModifier.ControlModifier || event.button() === MouseButton.MiddleButton) ||
            (
                this.currentSelection &&
                imagePos.x() > this.currentSelection.left() &&
                imagePos.x() < (this.currentSelection.left() + this.currentSelection.width()) &&
                imagePos.y() > this.currentSelection.top() &&
                imagePos.y() < (this.currentSelection.top() + this.currentSelection.height())
            )
        ) {
            this.setCursor(CursorShape.OpenHandCursor);
        } else {
            this.setCursor(CursorShape.CrossCursor);
        }
    }

    mouseReleaseEvent() {
        this.isPanning = false;
        this.selectionStart = null;
        this.isDraggingSelection = false;
        this.dragStartPos = null;
        this.selectionOffset = null;
        this.setCursor(CursorShape.CrossCursor);
        if (this.currentSelection &&
            (this.currentSelection.width() <= 0 || this.currentSelection.height() <= 0)) {
            this.currentSelection = null;
        }
        this.update();
    }

    wheelEvent(e) {
        const event = new QWheelEvent(e);
        const delta = event.angleDelta().y || event.angleDelta().x;
        const newScale = delta > 0 ? this.scale * 1.1 : this.scale / 1.1;

        if (newScale < 0.1 || newScale > 20) return;

        const mousePos = event.position();
        const imagePos = this.screenToImage(new QPoint(mousePos.x, mousePos.y));

        const newOffsetX = mousePos.x - imagePos.x() * newScale -
            (this.width() - this.pixmap.width() * newScale) / 2;
        const newOffsetY = mousePos.y - imagePos.y() * newScale -
            (this.height() - this.pixmap.height() * newScale) / 2;

        this.scale = newScale;
        this.offset = new QPoint(newOffsetX, newOffsetY);
        this.update();
    }

    screenToImage(point) {
        const imgWidth = this.pixmap.width() * this.scale;
        const imgHeight = this.pixmap.height() * this.scale;
        const imageX = (this.width() - imgWidth) / 2 + this.offset.x();
        const imageY = (this.height() - imgHeight) / 2 + this.offset.y();

        return new QPoint(
            Math.round((point.x() - imageX) / this.scale),
            Math.round((point.y() - imageY) / this.scale)
        );
    }

    clampToImage(point) {
        return new QPoint(
            Math.max(0, Math.min(this.pixmap.width(), point.x())),
            Math.max(0, Math.min(this.pixmap.height(), point.y()))
        );
    }

    fitToView() {
        const scaleX = this.width() / (this.pixmap.width() * 1.2);
        const scaleY = this.height() / (this.pixmap.height() * 1.2);
        this.scale = Math.min(scaleX, scaleY);
        this.offset = new QPoint(0, 0);
        this.update();
    }

    getArgValues() {
        return {
            x: Math.round(this.currentSelection?.left() ?? 0),
            y: Math.round(this.currentSelection?.top() ?? 0),
            width: Math.round(this.currentSelection?.width() ?? this.pixmap.width()),
            height: Math.round(this.currentSelection?.height() ?? this.pixmap.height())
        };
    }
}

module.exports = CropEditor;