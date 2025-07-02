const {
    QWidget, QPixmap, QPainter, QPen, QColor, QBrush,
    QMouseEvent, QWheelEvent, QPainterPath, QPoint,

    CursorShape, KeyboardModifier, PenStyle,
    MouseButton, RenderHint, WidgetEventTypes
} = require("@nodegui/nodegui");

const { createPreview, createAnimatedPreview } = require("../utils/media");

const { hexToRgb } = require("#functions/math");
const { translate } = require("#functions/translate");

class PerspectiveEditor extends QWidget {
    constructor(editorName, command, args) {
        super();

        this.editorName = editorName;
        this.command = command;
        this.args = args;

        this.scale = 1.0;
        this.offset = new QPoint(0, 0);
        this.isPanning = false;
        this.panStart = new QPoint();
        this.draggedCorner = null;
        this.handleSize = 8;
        this.isMovingPerspective = false;
        this.dragStartImagePos = null;
        this.initialCorners = null;
        this.showGuide = false;
        this.guideLines = [];
        this.snapThreshold = 10 / this.scale;

        this.corners = {
            tl: new QPoint(0, 0),
            tr: new QPoint(0, 0),
            bl: new QPoint(0, 0),
            br: new QPoint(0, 0)
        };

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
        await this.setPixmap(this.args.input);
        this.setCurrentPerspective();
    }

    async setPixmap(fileInfo) {
        fileInfo = Array.isArray(fileInfo) ? fileInfo[0] : fileInfo;

        if (!fileInfo?.path)
            throw translate("editors.error", translate("commands.perspective.args.input.name"));

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

    setCurrentPerspective() {
        const width = this.pixmap.width();
        const height = this.pixmap.height();

        this.corners = {
            tl: new QPoint(this.args.tlX ?? 0, this.args.tlY ?? 0),
            tr: new QPoint(this.args.trX ?? width, this.args.trY ?? 0),
            bl: new QPoint(this.args.blX ?? 0, this.args.blY ?? height),
            br: new QPoint(this.args.brX ?? width, this.args.brY ?? height)
        };
        this.update();
    }

    resetArgValues() {
        const width = this.pixmap.width();
        const height = this.pixmap.height();

        this.corners = {
            tl: new QPoint(0, 0),
            tr: new QPoint(width, 0),
            bl: new QPoint(0, height),
            br: new QPoint(width, height)
        };
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

        if (this.showGuide) {
            const gridPen = new QPen();
            gridPen.setColor(new QColor(...hexToRgb(guiApp.theme.colors.text), 100));
            gridPen.setStyle(PenStyle.DashLine);
            painter.setPen(gridPen);

            for (const ln of this.guideLines) {
                const start = this.imageToScreen(new QPoint(ln.x1, ln.y1));
                const end = this.imageToScreen(new QPoint(ln.x2, ln.y2));
                painter.drawLine(start.x(), start.y(), end.x(), end.y());
            }
        }

        painter.setPen(PenStyle.NoPen);
        painter.drawRect(tx, ty, imgW, imgH);

        const screenCorners = {};
        for (const [key, point] of Object.entries(this.corners)) {
            screenCorners[key] = this.imageToScreen(point);
        }

        const gridColor = new QColor(...hexToRgb(guiApp.theme.colors.text));
        gridColor.setAlpha(180);

        const path = new QPainterPath();
        path.moveTo(screenCorners.tl.x(), screenCorners.tl.y());
        path.lineTo(screenCorners.tr.x(), screenCorners.tr.y());
        path.lineTo(screenCorners.br.x(), screenCorners.br.y());
        path.lineTo(screenCorners.bl.x(), screenCorners.bl.y());
        path.closeSubpath();

        const fillColor = new QColor(...hexToRgb(guiApp.theme.colors.primary), 50);
        painter.setPen(PenStyle.NoPen);
        painter.setBrush(fillColor);
        painter.drawPath(path);
        painter.setBrush(new QBrush(0, 0, 0, 0));

        const gridPen = new QPen();
        gridPen.setColor(new QColor(...hexToRgb(guiApp.theme.colors.background), 100));
        gridPen.setStyle(PenStyle.SolidLine);
        painter.setPen(gridPen);
        painter.drawPath(path);

        gridPen.setColor(new QColor(guiApp.theme.colors.text));
        gridPen.setStyle(PenStyle.DashLine);
        painter.setPen(gridPen);
        painter.drawPath(path);

        const handlePen = new QPen();
        handlePen.setColor(new QColor(guiApp.theme.colors.background));
        handlePen.setWidth(2);
        painter.setPen(handlePen);

        for (const [key, point] of Object.entries(screenCorners)) {
            const isActive = this.draggedCorner === key;
            const handleColor = isActive ?
                new QColor(guiApp.theme.colors.primary) :
                new QColor(guiApp.theme.colors.text);

            painter.setBrush(new QBrush(handleColor));
            painter.drawEllipse(
                point.x() - this.handleSize / 2,
                point.y() - this.handleSize / 2,
                this.handleSize,
                this.handleSize
            );
        }

        painter.end();
    }

    mousePressEvent(e) {
        const event = new QMouseEvent(e);
        const modifiers = event.modifiers();
        const pos = new QPoint(event.x(), event.y());

        if (modifiers & KeyboardModifier.ControlModifier || event.button() === MouseButton.MiddleButton) {
            this.isPanning = true;
            this.panStart = pos;
            this.setCursor(CursorShape.ClosedHandCursor);
        } else {
            const imagePos = this.screenToImage(pos);
            const inside = this.isPointInsidePerspective(imagePos);

            for (const [key, corner] of Object.entries(this.corners)) {
                const screenCorner = this.imageToScreen(corner);
                const distance = Math.sqrt(
                    Math.pow(pos.x() - screenCorner.x(), 2) +
                    Math.pow(pos.y() - screenCorner.y(), 2)
                );

                if (distance <= this.handleSize) {
                    this.draggedCorner = key;
                    this.setCursor(CursorShape.SizeAllCursor);
                    break;
                }
            }

            if (inside && !this.draggedCorner) {
                this.isMovingPerspective = true;
                this.dragStartImagePos = imagePos;
                this.initialCorners = { ...this.corners };
                this.setCursor(CursorShape.ClosedHandCursor);

                if (modifiers & KeyboardModifier.ShiftModifier) {
                    this.showGuide = true;
                    this.updateGuideLines();
                }
            }
        }
        this.update();
    }

    mouseMoveEvent(e) {
        const event = new QMouseEvent(e);
        const pos = new QPoint(event.x(), event.y());
        const modifiers = event.modifiers();

        if (this.isPanning) {
            const delta = new QPoint(pos.x() - this.panStart.x(), pos.y() - this.panStart.y());
            this.panStart = pos;
            this.offset = new QPoint(this.offset.x() + delta.x(), this.offset.y() + delta.y());
            this.update();
        } else if (this.isMovingPerspective) {
            const imagePos = this.screenToImage(pos);
            let deltaX = imagePos.x() - this.dragStartImagePos.x();
            let deltaY = imagePos.y() - this.dragStartImagePos.y();

            if (modifiers & KeyboardModifier.ShiftModifier) {
                const width = this.pixmap.width();
                const height = this.pixmap.height();

                const centerX = width / 2;
                const centerY = height / 2;

                const newCorners = {};
                for (const [key, corner] of Object.entries(this.initialCorners)) {
                    newCorners[key] = new QPoint(
                        corner.x() + deltaX,
                        corner.y() + deltaY
                    );
                }

                const minX = Math.min(...Object.values(newCorners).map(p => p.x()));
                const maxX = Math.max(...Object.values(newCorners).map(p => p.x()));
                const minY = Math.min(...Object.values(newCorners).map(p => p.y()));
                const maxY = Math.max(...Object.values(newCorners).map(p => p.y()));

                if (Math.abs((minX + maxX) / 2 - centerX) < this.snapThreshold)
                    deltaX = centerX - (minX + maxX) / 2 + deltaX;

                if (Math.abs((minY + maxY) / 2 - centerY) < this.snapThreshold)
                    deltaY = centerY - (minY + maxY) / 2 + deltaY;

                this.showGuide = true;
                this.updateGuideLines();
            } else {
                this.showGuide = false;
            }

            for (const [key, corner] of Object.entries(this.initialCorners)) {
                this.corners[key] = new QPoint(
                    corner.x() + deltaX,
                    corner.y() + deltaY
                );
            }
            this.update();
        } else if (this.draggedCorner) {
            const newPos = this.screenToImage(pos);

            if (modifiers & KeyboardModifier.ShiftModifier) {
                const width = this.pixmap.width();
                const height = this.pixmap.height();

                if (Math.abs(newPos.x()) < this.snapThreshold) newPos.setX(0);
                if (Math.abs(newPos.x() - width) < this.snapThreshold) newPos.setX(width);
                if (Math.abs(newPos.x() - width / 2) < this.snapThreshold) newPos.setX(width / 2);

                if (Math.abs(newPos.y()) < this.snapThreshold) newPos.setY(0);
                if (Math.abs(newPos.y() - height) < this.snapThreshold) newPos.setY(height);
                if (Math.abs(newPos.y() - height / 2) < this.snapThreshold) newPos.setY(height / 2);

                this.showGuide = true;
                this.updateGuideLines();
            } else {
                this.showGuide = false;
            }

            this.corners[this.draggedCorner] = newPos;
            this.update();
        } else {
            let isOverCorner = false;
            for (const corner of Object.values(this.corners)) {
                const screenCorner = this.imageToScreen(corner);
                const distance = Math.sqrt(
                    Math.pow(pos.x() - screenCorner.x(), 2) +
                    Math.pow(pos.y() - screenCorner.y(), 2)
                );

                if (distance <= this.handleSize) {
                    isOverCorner = true;
                    break;
                }
            }

            const imagePos = this.screenToImage(pos);
            const inside = this.isPointInsidePerspective(imagePos);

            if (isOverCorner)
                this.setCursor(CursorShape.SizeAllCursor);
            else if (inside || modifiers & KeyboardModifier.ControlModifier || event.button() === MouseButton.MiddleButton)
                this.setCursor(CursorShape.OpenHandCursor);
            else
                this.setCursor(CursorShape.ArrowCursor);
        }
    }

    mouseReleaseEvent() {
        this.isPanning = false;
        this.draggedCorner = null;
        this.isMovingPerspective = false;
        this.dragStartImagePos = null;
        this.initialCorners = null;
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
            (this.width() - this.pixmap.width() * newScale) / 2;
        const newOffsetY = mousePos.y - imagePos.y() * newScale -
            (this.height() - this.pixmap.height() * newScale) / 2;

        this.scale = newScale;
        this.offset = new QPoint(newOffsetX, newOffsetY);
        this.update();
    }

    isPointInsidePerspective(point) {
        const { tl, tr, br, bl } = this.corners;
        const points = [tl, tr, br, bl];

        const minX = Math.min(tl.x(), tr.x(), bl.x(), br.x());
        const maxX = Math.max(tl.x(), tr.x(), bl.x(), br.x());
        const minY = Math.min(tl.y(), tr.y(), bl.y(), br.y());
        const maxY = Math.max(tl.y(), tr.y(), bl.y(), br.y());

        if (point.x() < minX || point.x() > maxX || point.y() < minY || point.y() > maxY) {
            return false;
        }

        return true;
    }

    updateGuideLines() {
        const width = this.pixmap.width();
        const height = this.pixmap.height();

        this.guideLines = [
            { x1: width / 2, y1: 0, x2: width / 2, y2: height },
            { x1: 0, y1: height / 2, x2: width, y2: height / 2 }
        ];
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

    imageToScreen(point) {
        const imgWidth = this.pixmap.width() * this.scale;
        const imgHeight = this.pixmap.height() * this.scale;
        const imageX = (this.width() - imgWidth) / 2 + this.offset.x();
        const imageY = (this.height() - imgHeight) / 2 + this.offset.y();

        return new QPoint(
            imageX + point.x() * this.scale,
            imageY + point.y() * this.scale
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
            tlX: Math.round(this.corners.tl.x()),
            tlY: Math.round(this.corners.tl.y()),
            trX: Math.round(this.corners.tr.x()),
            trY: Math.round(this.corners.tr.y()),
            blX: Math.round(this.corners.bl.x()),
            blY: Math.round(this.corners.bl.y()),
            brX: Math.round(this.corners.br.x()),
            brY: Math.round(this.corners.br.y())
        };
    }
}

module.exports = PerspectiveEditor;