const {
    QWidget, QPixmap, QPainter, QPen, QColor, QBrush,
    QPoint, QRect, QMouseEvent, QWheelEvent, QPainterPath,

    CursorShape, AspectRatioMode, TransformationMode, PenStyle,
    KeyboardModifier, RenderHint, WidgetEventTypes, MouseButton
} = require("@nodegui/nodegui");

const { createPreview, createAnimatedPreview } = require("../utils/media");

const { scaledDimensions } = require("#functions/media");
const { translate } = require("#functions/translate");

class OverlayEditor extends QWidget {
    constructor(editorName, command, args) {
        super();

        this.editorName = editorName;
        this.command = command;
        this.args = args;

        this.scale = 1.0;
        this.offset = new QPoint(0, 0);
        this.isPanning = false;
        this.panStart = new QPoint();
        this.overlayRect = new QRect(0, 0, 0, 0);
        this.isMovingOverlay = false;
        this.isResizingOverlay = false;
        this.resizeDirection = "";
        this.dragStartImagePos = new QPoint();
        this.initialOverlayRect = new QRect();
        this.aspectRatio = 1;
        this.showGuide = false;
        this.guideLines = [];
        this.setMouseTracking(true);
        this.setCursor(CursorShape.ArrowCursor);
        this.setObjectName("imageEditor");

        this.addEventListener(WidgetEventTypes.Paint, this.paintEvent.bind(this));
        this.addEventListener(WidgetEventTypes.MouseButtonPress, this.mousePressEvent.bind(this));
        this.addEventListener(WidgetEventTypes.MouseMove, this.mouseMoveEvent.bind(this));
        this.addEventListener(WidgetEventTypes.MouseButtonRelease, this.mouseReleaseEvent.bind(this));
        this.addEventListener(WidgetEventTypes.Wheel, this.wheelEvent.bind(this));
    }

    async setArgValues() {
        await this.setBasePixmap(this.args.base);
        await this.setOverlayPixmap(this.args.overlay);
    }

    async setBasePixmap(fileInfo) {
        fileInfo = Array.isArray(fileInfo) ? fileInfo[0] : fileInfo;

        if (!fileInfo?.path)
            throw translate("editors.error", translate("commands.overlay.args.base.name"));

        this.movie = await createAnimatedPreview(fileInfo);

        if (this.movie) {
            this.basePixmap = this.movie.currentPixmap();
            this.movie.addEventListener("frameChanged", () => {
                this.basePixmap = this.movie.currentPixmap();
                this.update();
            });
            this.movie.start();
        } else {
            this.basePixmap = await createPreview(fileInfo);
        }

        this.update();
    }

    async setOverlayPixmap(fileInfo) {
        fileInfo = Array.isArray(fileInfo) ? fileInfo[0] : fileInfo;

        if (!fileInfo?.path)
            throw translate("editors.error", translate("commands.overlay.args.overlay.name"));

        this.overlayMovie = await createAnimatedPreview(fileInfo);

        if (this.overlayMovie) {
            this.overlayPixmap = this.overlayMovie.currentPixmap();
            this.overlayMovie.addEventListener("frameChanged", () => {
                this.overlayPixmap = this.overlayMovie.currentPixmap();
                this.update();
            });
            this.overlayMovie.start();
        } else {
            this.overlayPixmap = await createPreview(fileInfo);
        }

        this.aspectRatio = this.overlayPixmap.width() / this.overlayPixmap.height();

        const baseWidth = this.basePixmap.width();
        const baseHeight = this.basePixmap.height();
        const overlayWidth = this.args.width;
        const overlayHeight = this.args.height;

        const origins = {
            x: {
                left: 0,
                center: Math.round((baseWidth - overlayWidth) / 2),
                right: baseWidth - overlayWidth
            },
            y: {
                top: 0,
                middle: Math.round((baseHeight - overlayHeight) / 2),
                bottom: baseHeight - overlayHeight
            }
        };

        let x = origins.x[this.args.originX] + this.args.x;
        let y = origins.y[this.args.originY] + this.args.y;

        this.overlayRect = new QRect(x, y, overlayWidth, overlayHeight);
        this.update();
    }

    resetArgValues() {
        const baseWidth = this.basePixmap.width();
        const baseHeight = this.basePixmap.height();
        const scaledSize = scaledDimensions(this.overlayPixmap, {
            width: Math.round(baseWidth / 3),
            height: Math.round(baseHeight / 3)
        });
        const overlayWidth = scaledSize.width;
        const overlayHeight = scaledSize.height;

        let x = (baseWidth - overlayWidth) / 2;
        let y = (baseHeight - overlayHeight) / 2;

        this.overlayRect = new QRect(x, y, overlayWidth, overlayHeight);

        this.update();
    }

    paintEvent() {
        const painter = new QPainter(this);
        painter.setRenderHint(RenderHint.Antialiasing, true);

        const imgW = this.basePixmap.width() * this.scale;
        const imgH = this.basePixmap.height() * this.scale;
        const tx = (this.width() - imgW) / 2 + this.offset.x();
        const ty = (this.height() - imgH) / 2 + this.offset.y();

        painter.save();
        painter.translate(tx, ty);
        painter.scale(this.scale, this.scale);

        const transparentBrush = new QBrush();
        transparentBrush.setTexture(new QPixmap(guiApp.theme.assets.transparentBackground));
        const painterPath = new QPainterPath();
        painterPath.addRect(0, 0, this.basePixmap.width(), this.basePixmap.height());
        painter.fillPath(painterPath, transparentBrush);
        painter.drawPixmap(0, 0, this.basePixmap);

        const rect = this.overlayRect;

        const scaledOverlay = this.overlayPixmap.scaled(
            rect.width(),
            rect.height(),
            AspectRatioMode.IgnoreAspectRatio,
            TransformationMode.FastTransformation
        );
        painter.drawPixmap(rect.left(), rect.top(), scaledOverlay);
        painter.restore();

        if (this.showGuide) {
            for (const ln of this.guideLines) {
                const x1 = tx + ln.x1 * this.scale;
                const y1 = ty + ln.y1 * this.scale;
                const x2 = tx + ln.x2 * this.scale;
                const y2 = ty + ln.y2 * this.scale;

                painter.drawLine(x1, y1, x2, y2);
            }
        }

        painter.drawRect(tx, ty, imgW, imgH);

        const screenX = tx + rect.left() * this.scale;
        const screenY = ty + rect.top() * this.scale;
        const screenW = rect.width() * this.scale;
        const screenH = rect.height() * this.scale;

        const pen = new QPen();
        pen.setColor(new QColor(guiApp.theme.colors.text));
        pen.setStyle(PenStyle.DashLine);
        painter.setPen(pen);
        painter.drawRect(screenX, screenY, screenW + 1, screenH + 1);

        painter.end();
    }

    mousePressEvent(e) {
        const event = new QMouseEvent(e);
        const modifiers = event.modifiers();
        const pos = this.screenToImage(new QPoint(event.x(), event.y()));

        const isShift = !!(modifiers & KeyboardModifier.ShiftModifier);
        const isCtrl = !!(modifiers & KeyboardModifier.ControlModifier) || event.button() === MouseButton.MiddleButton;

        this.showGuide = false;
        this.guideLines = [];

        if (isCtrl) {
            this.isPanning = true;
            this.panStart = new QPoint(event.x(), event.y());
            this.setCursor(CursorShape.ClosedHandCursor);
        } else if (
            pos.x() >= this.overlayRect.left() &&
            pos.x() <= (this.overlayRect.left() + this.overlayRect.width()) &&
            pos.y() >= this.overlayRect.top() &&
            pos.y() <= (this.overlayRect.top() + this.overlayRect.height())
        ) {
            const handleSize = 10 / this.scale;
            const x = pos.x();
            const y = pos.y();
            const rect = this.overlayRect;

            const nearLeft = Math.abs(x - rect.left()) <= handleSize;
            const nearRight = Math.abs(x - (rect.left() + rect.width())) <= handleSize;
            const nearTop = Math.abs(y - rect.top()) <= handleSize;
            const nearBottom = Math.abs(y - (rect.top() + rect.height())) <= handleSize;

            let direction = "";
            if (nearLeft && nearTop) direction = "nw";
            else if (nearRight && nearTop) direction = "ne";
            else if (nearLeft && nearBottom) direction = "sw";
            else if (nearRight && nearBottom) direction = "se";
            else if (nearLeft) direction = "w";
            else if (nearRight) direction = "e";
            else if (nearTop) direction = "n";
            else if (nearBottom) direction = "s";

            if (direction) {
                this.isResizingOverlay = true;
                this.resizeDirection = direction;
                this.dragStartImagePos = pos;
                this.initialOverlayRect = new QRect(
                    rect.left(), rect.top(), rect.width(), rect.height()
                );
                this.setCursor(this.getResizeCursor(direction));
            } else {
                this.isMovingOverlay = true;
                this.dragStartImagePos = pos;
                this.initialOverlayRect = new QRect(
                    rect.left(), rect.top(), rect.width(), rect.height()
                );
                this.setCursor(CursorShape.SizeAllCursor);

                if (isShift) {
                    this.showGuide = true;

                    const baseW = this.basePixmap.width();
                    const baseH = this.basePixmap.height();
                    const cx = baseW / 2;
                    const cy = baseH / 2;
                    this.guideLines.push({ x1: cx, y1: 0, x2: cx, y2: baseH });
                    this.guideLines.push({ x1: 0, y1: cy, x2: baseW, y2: cy });
                }
            }
        }
        this.update();
    }

    mouseMoveEvent(e) {
        const event = new QMouseEvent(e);
        const pos = new QPoint(event.x(), event.y());
        const modifiers = event.modifiers();

        const isShift = !!(modifiers & KeyboardModifier.ShiftModifier);
        const isAlt = !!(modifiers & KeyboardModifier.AltModifier);
        const isCtrl = !!(modifiers & KeyboardModifier.ControlModifier) || event.button() === MouseButton.MiddleButton;

        this.showGuide = false;
        this.guideLines = [];

        if (this.isPanning) {
            const delta = new QPoint(pos.x() - this.panStart.x(), pos.y() - this.panStart.y());
            this.panStart = pos;
            this.offset = new QPoint(this.offset.x() + delta.x(), this.offset.y() + delta.y());
            this.update();
        } else if (this.isMovingOverlay) {
            const imagePos = this.screenToImage(pos);
            let deltaX = imagePos.x() - this.dragStartImagePos.x();
            let deltaY = imagePos.y() - this.dragStartImagePos.y();

            if (isAlt) {
                if (Math.abs(deltaX) > Math.abs(deltaY))
                    deltaY = 0;
                else
                    deltaX = 0;
            }

            let newX = this.initialOverlayRect.left() + deltaX;
            let newY = this.initialOverlayRect.top() + deltaY;

            if (isShift) {
                const baseW = this.basePixmap.width();
                const baseH = this.basePixmap.height();
                const overlayW = this.initialOverlayRect.width();
                const overlayH = this.initialOverlayRect.height();
                const centerX = (baseW - overlayW) / 2;
                const centerY = (baseH - overlayH) / 2;
                const maxX = baseW - overlayW;
                const maxY = baseH - overlayH;
                const snapThreshold = 10;

                if (Math.abs(newX - centerX) <= snapThreshold) newX = centerX;
                if (Math.abs(newX) <= snapThreshold) newX = 0;
                if (Math.abs(newX - maxX) <= snapThreshold) newX = maxX;

                if (Math.abs(newY - centerY) <= snapThreshold) newY = centerY;
                if (Math.abs(newY) <= snapThreshold) newY = 0;
                if (Math.abs(newY - maxY) <= snapThreshold) newY = maxY;
            }

            this.overlayRect = new QRect(
                newX,
                newY,
                this.initialOverlayRect.width(),
                this.initialOverlayRect.height()
            );

            if (isShift) {
                this.showGuide = true;

                const baseW = this.basePixmap.width();
                const baseH = this.basePixmap.height();
                const cx = baseW / 2;
                const cy = baseH / 2;
                this.guideLines.push({ x1: cx, y1: 0, x2: cx, y2: baseH });
                this.guideLines.push({ x1: 0, y1: cy, x2: baseW, y2: cy });
            }

            this.update();
        } else if (this.isResizingOverlay) {
            const imagePos = this.screenToImage(pos);
            let deltaX = (imagePos.x() - this.dragStartImagePos.x());
            let deltaY = (imagePos.y() - this.dragStartImagePos.y());

            let newX = this.initialOverlayRect.left();
            let newY = this.initialOverlayRect.top();
            let newWidth = this.initialOverlayRect.width();
            let newHeight = this.initialOverlayRect.height();

            if (isShift && isAlt) {
                const signX = this.resizeDirection.includes("w") ? -1 : 1;
                const signY = this.resizeDirection.includes("n") ? -1 : 1;

                const moveX = signX * deltaX;
                const moveY = signY * deltaY;

                const dragX = moveX;
                const dragY = moveY * this.aspectRatio;
                const drag = Math.abs(dragX) < Math.abs(dragY) ? dragX : dragY;

                const rawWidth = this.initialOverlayRect.width() + drag * 2;
                const rawHeight = rawWidth / this.aspectRatio;

                newWidth = Math.max(1, Math.round(rawWidth));
                newHeight = Math.max(1, Math.round(rawHeight));

                const dx = (newWidth - this.initialOverlayRect.width()) / 2;
                const dy = (newHeight - this.initialOverlayRect.height()) / 2;

                newX = this.initialOverlayRect.left() - dx;
                newY = this.initialOverlayRect.top() - dy;
            } else if (isShift) {
                const signX = this.resizeDirection.includes("w") ? -1 : 1;
                const signY = this.resizeDirection.includes("s") ? 1 : -1;

                const moveX = signX * deltaX;
                const moveY = signY * deltaY;

                const dragX = moveX;
                const dragY = moveY * this.aspectRatio;
                const drag = Math.abs(dragX) < Math.abs(dragY) ? dragX : dragY;

                const rawWidth = this.initialOverlayRect.width() + drag;
                const rawHeight = rawWidth / this.aspectRatio;

                newWidth = Math.max(1, Math.round(rawWidth));
                newHeight = Math.max(1, Math.round(rawHeight));

                newX = this.resizeDirection.includes("w")
                    ? this.initialOverlayRect.left() - (newWidth - this.initialOverlayRect.width())
                    : this.initialOverlayRect.left();
                newY = this.resizeDirection.includes("n")
                    ? this.initialOverlayRect.top() - (newHeight - this.initialOverlayRect.height())
                    : this.initialOverlayRect.top();
            } else if (isAlt) {
                switch (this.resizeDirection) {
                    case "nw":
                        deltaX = -deltaX;
                        deltaY = -deltaY;
                        newX = this.initialOverlayRect.left() - deltaX;
                        newY = this.initialOverlayRect.top() - deltaY;
                        newWidth = Math.max(1, this.initialOverlayRect.width() + deltaX * 2);
                        newHeight = Math.max(1, this.initialOverlayRect.height() + deltaY * 2);
                        break;
                    case "sw":
                        deltaX = -deltaX;
                        newX = this.initialOverlayRect.left() - deltaX;
                        newY = this.initialOverlayRect.top() - deltaY;
                        newWidth = Math.max(1, this.initialOverlayRect.width() + deltaX * 2);
                        newHeight = Math.max(1, this.initialOverlayRect.height() + deltaY * 2);
                        break;
                    case "ne":
                        deltaY = -deltaY;
                        newX = this.initialOverlayRect.left() - deltaX;
                        newY = this.initialOverlayRect.top() - deltaY;
                        newWidth = Math.max(1, this.initialOverlayRect.width() + deltaX * 2);
                        newHeight = Math.max(1, this.initialOverlayRect.height() + deltaY * 2);
                        break;
                    case "se":
                        newX = this.initialOverlayRect.left() - deltaX;
                        newY = this.initialOverlayRect.top() - deltaY;
                        newWidth = Math.max(1, this.initialOverlayRect.width() + deltaX * 2);
                        newHeight = Math.max(1, this.initialOverlayRect.height() + deltaY * 2);
                        break;
                    case "w":
                        deltaX = -deltaX;
                        newX = this.initialOverlayRect.left() - deltaX;
                        newWidth = Math.max(1, this.initialOverlayRect.width() + deltaX * 2);
                        break;
                    case "e":
                        newX = this.initialOverlayRect.left() - deltaX;
                        newWidth = Math.max(1, this.initialOverlayRect.width() + deltaX * 2);
                        break;
                    case "n":
                        deltaY = -deltaY;
                        newY = this.initialOverlayRect.top() - deltaY;
                        newHeight = Math.max(1, this.initialOverlayRect.height() + deltaY * 2);
                        break;
                    case "s":
                        newY = this.initialOverlayRect.top() - deltaY;
                        newHeight = Math.max(1, this.initialOverlayRect.height() + deltaY * 2);
                        break;
                }
            } else {
                switch (this.resizeDirection) {
                    case "nw":
                        newX = Math.min(newX + deltaX, newX + newWidth - 1);
                        newWidth = Math.max(1, newWidth - deltaX);
                        newY = Math.min(newY + deltaY, newY + newHeight - 1);
                        newHeight = Math.max(1, newHeight - deltaY);
                        break;
                    case "ne":
                        newWidth = Math.max(1, newWidth + deltaX);
                        newY = Math.min(newY + deltaY, newY + newHeight - 1);
                        newHeight = Math.max(1, newHeight - deltaY);
                        break;
                    case "sw":
                        newX = Math.min(newX + deltaX, newX + newWidth - 1);
                        newWidth = Math.max(1, newWidth - deltaX);
                        newHeight = Math.max(1, newHeight + deltaY);
                        break;
                    case "se":
                        newWidth = Math.max(1, newWidth + deltaX);
                        newHeight = Math.max(1, newHeight + deltaY);
                        break;
                    case "w":
                        newX = Math.min(newX + deltaX, newX + newWidth - 1);
                        newWidth = Math.max(1, newWidth - deltaX);
                        break;
                    case "e":
                        newWidth = Math.max(1, newWidth + deltaX);
                        break;
                    case "n":
                        newY = Math.min(newY + deltaY, newY + newHeight - 1);
                        newHeight = Math.max(1, newHeight - deltaY);
                        break;
                    case "s":
                        newHeight = Math.max(1, newHeight + deltaY);
                        break;
                }
            }

            this.overlayRect = new QRect(newX, newY, newWidth, newHeight);
            this.update();
        } else if (isCtrl) {
            this.setCursor(CursorShape.OpenHandCursor);
        } else {
            const imagePos = this.screenToImage(pos);
            if (
                imagePos.x() >= this.overlayRect.left() &&
                imagePos.x() <= (this.overlayRect.left() + this.overlayRect.width()) &&
                imagePos.y() >= this.overlayRect.top() &&
                imagePos.y() <= (this.overlayRect.top() + this.overlayRect.height())
            ) {
                this.setCursor(this.getHoverCursor(imagePos));
            } else {
                this.setCursor(CursorShape.ArrowCursor);
            }
        }
    }

    mouseReleaseEvent() {
        this.isPanning = false;
        this.isMovingOverlay = false;
        this.isResizingOverlay = false;
        this.showGuide = false;
        this.guideLines = [];
        this.setCursor(CursorShape.ArrowCursor);
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
            (this.width() - this.basePixmap.width() * newScale) / 2;
        const newOffsetY = mousePos.y - imagePos.y() * newScale -
            (this.height() - this.basePixmap.height() * newScale) / 2;

        this.scale = newScale;
        this.offset = new QPoint(newOffsetX, newOffsetY);
        this.update();
    }

    screenToImage(point) {
        const imgWidth = this.basePixmap.width() * this.scale;
        const imgHeight = this.basePixmap.height() * this.scale;
        const imageX = (this.width() - imgWidth) / 2 + this.offset.x();
        const imageY = (this.height() - imgHeight) / 2 + this.offset.y();

        return new QPoint(
            Math.round((point.x() - imageX) / this.scale),
            Math.round((point.y() - imageY) / this.scale)
        );
    }

    getResizeCursor(direction) {
        switch (direction) {
            case "nw": case "se": return CursorShape.SizeFDiagCursor;
            case "ne": case "sw": return CursorShape.SizeBDiagCursor;
            case "w": case "e": return CursorShape.SizeHorCursor;
            case "n": case "s": return CursorShape.SizeVerCursor;
            default: return CursorShape.ArrowCursor;
        }
    }

    getHoverCursor(pos) {
        const handleSize = 10 / this.scale;
        const x = pos.x();
        const y = pos.y();
        const rect = this.overlayRect;

        const nearLeft = Math.abs(x - rect.left()) <= handleSize;
        const nearRight = Math.abs(x - (rect.left() + rect.width())) <= handleSize;
        const nearTop = Math.abs(y - rect.top()) <= handleSize;
        const nearBottom = Math.abs(y - (rect.top() + rect.height())) <= handleSize;

        if (nearLeft && nearTop) return CursorShape.SizeFDiagCursor;
        if (nearRight && nearTop) return CursorShape.SizeBDiagCursor;
        if (nearLeft && nearBottom) return CursorShape.SizeBDiagCursor;
        if (nearRight && nearBottom) return CursorShape.SizeFDiagCursor;
        if (nearLeft || nearRight) return CursorShape.SizeHorCursor;
        if (nearTop || nearBottom) return CursorShape.SizeVerCursor;
        return CursorShape.SizeAllCursor;
    }

    fitToView() {
        const scaleX = this.width() / (this.basePixmap.width() * 1.2);
        const scaleY = this.height() / (this.basePixmap.height() * 1.2);
        this.scale = Math.min(scaleX, scaleY);
        this.offset = new QPoint(0, 0);
        this.update();
    }

    getArgValues() {
        return {
            x: Math.round(this.overlayRect.left()),
            y: Math.round(this.overlayRect.top()),
            width: Math.round(this.overlayRect.width()),
            height: Math.round(this.overlayRect.height()),
            originX: "left",
            originY: "top"
        };
    }
}

module.exports = OverlayEditor;