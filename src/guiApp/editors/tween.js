const {
    QWidget, QPixmap, QPainter, QPen, QColor, QBrush, QFont,
    QPoint, QRect, QMouseEvent, QWheelEvent, QPainterPath,
    QFontMetrics, QShortcut, QKeySequence, QAction, QMenu,

    CursorShape, AspectRatioMode, TransformationMode, MouseButton,
    KeyboardModifier, PenStyle, RenderHint, WidgetEventTypes
} = require("@nodegui/nodegui");

const { createPreview, createAnimatedPreview } = require("../utils/media");

const { roundTo, hexToRgb } = require("#functions/math");
const { scaledDimensions } = require("#functions/media");
const { translate } = require("#functions/translate");

class TweenEditor extends QWidget {
    constructor(_, command, args) {
        super();

        this.command = command;
        this.args = args;

        this.currentFileIndex = 0;
        this.files = [];

        this.properties = {
            x: translate("commands.tween.args.keyframes.columns.x.name"),
            y: translate("commands.tween.args.keyframes.columns.y.name"),
            w: translate("commands.tween.args.keyframes.columns.w.name"),
            h: translate("commands.tween.args.keyframes.columns.h.name"),
            r: translate("commands.tween.args.keyframes.columns.r.name"),
            o: translate("commands.tween.args.keyframes.columns.o.name")
        };

        if (args.files) {
            this.files = args.files.map((fileInfo, index) => {
                const fileKeyframes = args.keyframes
                    ? args.keyframes.filter(kp => kp.f === index)
                    : [];

                const keyframes = [];
                for (const kp of fileKeyframes) {
                    for (const prop in this.properties) {
                        if (kp[prop] !== undefined) {
                            keyframes.push({
                                f: index,
                                t: kp.t,
                                prop: prop,
                                value: kp[prop],
                                e: kp.e || "sine",
                                d: kp.d || "inOut"
                            });
                        }
                    }
                }
                keyframes.sort((a, b) => a.t - b.t);

                const firstKeyframe = keyframes[0] ?? null;
                return {
                    fileInfo,
                    keyframes,
                    overlayPixmap: null,
                    movie: null,
                    aspectRatio: 1,
                    overlayRect: new QRect(
                        firstKeyframe?.x ?? 0,
                        firstKeyframe?.y ?? 0,
                        firstKeyframe?.w ?? 100,
                        firstKeyframe?.h ?? 100
                    ),
                    overlayRotation: firstKeyframe?.r ?? 0,
                    unsnappedRotation: 0,
                    overlayOpacity: firstKeyframe?.o ?? 1
                };
            });
        }

        this.history = [];
        this.redoStack = [];
        this.historyLimit = 100;
        this.clipboard = null;

        this.scale = 1.0;
        this.offset = new QPoint(0, 0);
        this.panStart = new QPoint();

        this.isPanning = false;
        this.isMovingOverlay = false;
        this.isResizingOverlay = false;
        this.isScrubbing = false;
        this.isRotatingOverlay = false;
        this.isPlaying = false;

        this.resizeDirection = "";

        this.rotationStartAngle = 0;
        this.rotationLastAngle = 0;

        this.showGuide = false;
        this.guideLines = [];

        this.dragStartImagePos = new QPoint();
        this.initialOverlayRect = new QRect();

        this.duration = args.duration || 5;
        this.playbackSpeed = 1.0;
        this.currentTime = 0;

        this.propertyRowHeight = 22;
        this.rulerHeight = 20;
        this.timelineHeight = Object.keys(this.properties).length * this.propertyRowHeight + this.rulerHeight;
        this.timelinePadding = 40;
        this.labelWidth = 80;
        this.snapInterval = 0.05;

        this.selectedKeyframes = new Set();
        this.tempSelectedKeyframes = new Set();

        this.selectionBox = null;
        this.hoveredKeyframe = null;
        this.playbackInterval = null;

        this.setMouseTracking(true);
        this.setCursor(CursorShape.ArrowCursor);
        this.setObjectName("imageEditor");

        this.easings = {
            linear: translate("argValues.easingStyle.linear"),
            constant: translate("argValues.easingStyle.constant"),
            sine: translate("argValues.easingStyle.sine"),
            quad: translate("argValues.easingStyle.quad"),
            cubic: translate("argValues.easingStyle.cubic"),
            quart: translate("argValues.easingStyle.quart"),
            quint: translate("argValues.easingStyle.quint"),
            expo: translate("argValues.easingStyle.expo"),
            circ: translate("argValues.easingStyle.circ"),
            back: translate("argValues.easingStyle.back"),
            elastic: translate("argValues.easingStyle.elastic"),
            bounce: translate("argValues.easingStyle.bounce")
        };

        this.directions = {
            in: translate("argValues.easingDirection.in"),
            out: translate("argValues.easingDirection.out"),
            inOut: translate("argValues.easingDirection.inOut")
        };

        this.addEventListener(WidgetEventTypes.Paint, this.paintEvent.bind(this));
        this.addEventListener(WidgetEventTypes.MouseButtonPress, this.mousePressEvent.bind(this));
        this.addEventListener(WidgetEventTypes.MouseMove, this.mouseMoveEvent.bind(this));
        this.addEventListener(WidgetEventTypes.MouseButtonRelease, this.mouseReleaseEvent.bind(this));
        this.addEventListener(WidgetEventTypes.MouseButtonDblClick, this.mouseDoubleClickEvent.bind(this));
        this.addEventListener(WidgetEventTypes.Wheel, this.wheelEvent.bind(this));
        this.addEventListener(WidgetEventTypes.Resize, this.calculateSnapInterval.bind(this));
        this.addEventListener(WidgetEventTypes.Close, this.closeEvent.bind(this));
        this.setupShortcuts();
        this.setupContextMenu();
        this.calculateSnapInterval();
    }

    async setArgValues() {
        this.setDimensions(this.args.width ?? 300, this.args.height ?? 300);
        await this.setOverlayPixmaps(this.args.files);
    }

    setDimensions(width, height) {
        this.canvasWidth = width;
        this.canvasHeight = height;
    }

    async setOverlayPixmaps(files) {
        for (let i = 0; i < files.length; i++) {
            const fileInfo = files[i];
            if (!fileInfo?.path)
                throw translate("editors.error", translate("commands.tween.args.input.name"));

            const movie = await createAnimatedPreview(fileInfo);
            let overlayPixmap;

            if (movie) {
                overlayPixmap = movie.currentPixmap();
                movie.addEventListener("frameChanged", () => {
                    this.files[i].overlayPixmap = movie.currentPixmap();
                    this.update();
                });
                movie.start();
            } else {
                overlayPixmap = await createPreview(fileInfo);
            }

            const aspectRatio = overlayPixmap.width() / overlayPixmap.height();

            this.files[i] = {
                ...this.files[i],
                movie,
                overlayPixmap,
                aspectRatio
            };
        }

        this.updateOverlayPosition();
        this.saveState();
        this.update();
    }

    resetArgValues() {
        const currentFile = this.files[this.currentFileIndex];
        currentFile.overlayRotation = 0;
        currentFile.unsnappedRotation = 0;
        currentFile.overlayOpacity = 1;

        const baseWidth = this.canvasWidth;
        const baseHeight = this.canvasHeight;
        const scaledSize = scaledDimensions(currentFile.overlayPixmap, {
            width: Math.round(baseWidth / 3),
            height: Math.round(baseHeight / 3)
        });

        currentFile.overlayRect = new QRect(0, 0, scaledSize.width, scaledSize.height);

        this.updateKeyframe("x", currentFile.overlayRect.left());
        this.updateKeyframe("y", currentFile.overlayRect.top());
        this.updateKeyframe("w", currentFile.overlayRect.width());
        this.updateKeyframe("h", currentFile.overlayRect.height());
        this.updateKeyframe("r", currentFile.overlayRotation);
        this.updateKeyframe("o", currentFile.overlayOpacity);

        this.update();
    }

    paintEvent() {
        const theme = guiApp.theme;
        const currentFile = this.files[this.currentFileIndex];

        const painter = new QPainter(this);
        painter.setRenderHint(RenderHint.Antialiasing, true);

        const availableHeight = this.height() - this.timelineHeight;

        const imgW = this.canvasWidth * this.scale;
        const imgH = this.canvasHeight * this.scale;
        const tx = (this.width() - imgW) / 2 + this.offset.x();
        const ty = (availableHeight - imgH) / 2 + this.offset.y();

        painter.save();
        painter.translate(tx, ty);
        painter.scale(this.scale, this.scale);

        const transparentBrush = new QBrush();
        transparentBrush.setTexture(new QPixmap(theme.assets.transparentBackground));
        const painterPath = new QPainterPath();
        painterPath.addRect(0, 0, this.canvasWidth, this.canvasHeight);
        painter.fillPath(painterPath, transparentBrush);

        painter.restore();

        this.files.forEach((file, index) => {
            if (!file.overlayPixmap) return;

            const rect = file.overlayRect;
            const isCurrent = index === this.currentFileIndex;

            const posX = (this.canvasWidth - rect.width()) / 2 + rect.left();
            const posY = (this.canvasHeight - rect.height()) / 2 + rect.top();

            const cx = posX + rect.width() / 2;
            const cy = posY + rect.height() / 2;

            painter.save();
            painter.translate(tx, ty);
            painter.scale(this.scale, this.scale);

            painter.save();
            painter.translate(cx, cy);
            painter.rotate(file.overlayRotation);
            painter.translate(-cx, -cy);

            const scaledOverlay = file.overlayPixmap.scaled(
                rect.width(),
                rect.height(),
                AspectRatioMode.IgnoreAspectRatio,
                TransformationMode.FastTransformation
            );

            painter.setOpacity(file.overlayOpacity);
            painter.drawPixmap(posX, posY, scaledOverlay);
            painter.setOpacity(1);

            painter.restore();
            painter.restore();

            if (isCurrent) {
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

                const screenX = tx + posX * this.scale;
                const screenY = ty + posY * this.scale;
                const screenW = rect.width() * this.scale;
                const screenH = rect.height() * this.scale;

                if (this.isRotatingOverlay) {
                    const text = `${String(roundTo(file.overlayRotation, 0.01)).replace(/[09]{5,}[0-9]+$/, "")}°`;

                    const fm = new QFontMetrics(new QFont());
                    const textW = fm.horizontalAdvance(text);
                    const textH = fm.height();

                    const tx = screenX + (screenW - textW) / 2;
                    const ty = screenY - textH - 4;

                    painter.setBrush(new QBrush(new QColor(0, 0, 0, 150)));
                    painter.setPen(PenStyle.NoPen);
                    painter.drawRect(tx - 4, ty - 2, textW + 8, textH + 4);

                    const textPen = new QPen();
                    textPen.setColor(new QColor(255, 255, 255));
                    painter.setPen(textPen);

                    painter.drawText(tx, ty + fm.ascent(), text);
                    painter.setBrush(new QBrush(0, 0, 0, 0));
                }

                const pen = new QPen();
                pen.setColor(new QColor(theme.colors.text));
                pen.setStyle(PenStyle.DashLine);
                painter.setPen(pen);
                painter.drawRect(screenX, screenY, screenW + 1, screenH + 1);
            }
        });

        const timelineY = availableHeight + this.rulerHeight;
        const timelineWidth = this.width() - this.labelWidth - this.timelinePadding;
        const timelineX = this.labelWidth;
        const propertyAreaHeight = this.propertyRowHeight * Object.keys(this.properties).length;

        painter.setPen(new QColor(theme.colors.group.border));
        painter.setBrush(new QColor(theme.colors.group.bg));

        painter.drawRect(0, timelineY - this.rulerHeight, this.width(), this.rulerHeight);

        const minorTickEvery = 1;
        const majorTickEvery = 5;
        const ticks = this.duration / this.snapInterval;

        const font = new QFont();
        font.setPointSize(8);
        painter.setFont(font);
        const fm = new QFontMetrics(font);
        const textHeight = fm.height();

        painter.setBrush(new QColor(theme.colors.background));

        Object.values(this.properties).forEach((prop, idx) => {
            const yPos = timelineY + idx * this.propertyRowHeight;

            painter.setPen(PenStyle.NoPen);
            painter.setBrush(new QColor(idx % 2 == 0 ? theme.colors.background : theme.colors.secondaryBg));
            painter.drawRect(
                0,
                yPos,
                this.width(),
                this.propertyRowHeight
            );

            painter.setPen(new QColor(theme.colors.text));
            painter.drawText(10, yPos + (this.propertyRowHeight + textHeight) / 2, prop);

            painter.setPen(new QColor(theme.colors.group.border));
        });

        const timeTextes = [];

        for (let tickIndex = 0; tickIndex <= ticks; tickIndex++) {
            const t = tickIndex * this.snapInterval;
            const xPos = timelineX + (t / this.duration) * timelineWidth;

            if (xPos >= timelineX && xPos <= timelineX + timelineWidth) {
                if (tickIndex % minorTickEvery === 0) {
                    const lineColor = tickIndex % majorTickEvery === 0
                        ? new QColor(theme.colors.button.bg)
                        : new QColor(theme.colors.group.bg);

                    painter.setPen(lineColor);
                    painter.drawLine(
                        xPos, timelineY,
                        xPos, timelineY + propertyAreaHeight
                    );
                }

                if (tickIndex % majorTickEvery === 0) {
                    const timeText = `${t.toFixed(2)}s`;

                    painter.setPen(new QColor(theme.colors.button.bg));
                    painter.drawLine(
                        xPos, timelineY - this.rulerHeight,
                        xPos, timelineY
                    );

                    timeTextes.push([
                        xPos,
                        timeText
                    ]);
                } else if (tickIndex % minorTickEvery === 0) {
                    painter.setPen(new QColor(theme.colors.button.bg));
                    painter.drawLine(
                        xPos, timelineY - this.rulerHeight * 0.5,
                        xPos, timelineY
                    );
                }
            }
        }

        painter.setPen(new QColor(theme.colors.secondaryText));

        for (const [xPos, timeText] of timeTextes) {
            painter.drawText(
                xPos + 5,
                timelineY - this.rulerHeight / 2 + fm.ascent() / 2,
                timeText
            );
        }

        const sliderX = timelineX + (this.currentTime / this.duration) * timelineWidth;
        const arrowSize = 5;
        const arrowY = timelineY - arrowSize;

        painter.setPen(new QColor(theme.colors.primary));
        painter.drawLine(
            sliderX,
            timelineY - this.rulerHeight / 2,
            sliderX,
            timelineY + propertyAreaHeight
        );

        painter.setBrush(new QColor(theme.colors.primary));

        const arrowPath = new QPainterPath();
        arrowPath.moveTo(Math.floor(sliderX - arrowSize / 2), Math.round(arrowY - this.rulerHeight / 2));
        arrowPath.lineTo(Math.ceil(sliderX + arrowSize / 2), Math.round(arrowY - this.rulerHeight / 2));
        arrowPath.lineTo(Math.round(sliderX), Math.round(arrowY + arrowSize - this.rulerHeight / 2));
        arrowPath.closeSubpath();

        painter.drawRect(
            Math.floor(sliderX - arrowSize + arrowSize / 2), Math.round(arrowY - arrowSize * 2 - this.rulerHeight / 2),
            arrowSize + 1, arrowSize * 2
        );
        painter.drawPath(arrowPath);

        Object.keys(this.properties).forEach((prop, idx) => {
            const yPos = timelineY + idx * this.propertyRowHeight;

            currentFile.keyframes.filter(kp => kp.prop === prop).forEach(kp => {
                const xPos = timelineX + (kp.t / this.duration) * timelineWidth;
                const isSelected = this.selectedKeyframes.has(kp);
                const keyPen = new QPen();
                keyPen.setColor(isSelected ? new QColor(theme.colors.primary) : new QColor(theme.colors.tweens[kp.e].border));
                keyPen.setWidth(isSelected ? 3 : 2);

                painter.setPen(keyPen);
                painter.setBrush(new QColor(theme.colors.tweens[kp.e].bg));

                const size = 5;
                const centerX = xPos;
                const centerY = yPos + this.propertyRowHeight / 2;

                const diamondPath = new QPainterPath();
                diamondPath.moveTo(centerX, centerY - size);
                diamondPath.lineTo(centerX + size, centerY);
                diamondPath.lineTo(centerX, centerY + size);
                diamondPath.lineTo(centerX - size, centerY);
                diamondPath.closeSubpath();

                painter.drawPath(diamondPath);
            });
        });

        if (this.selectionBox?.active) {
            const outline = new QPen();
            outline.setColor(new QColor(guiApp.theme.colors.text));
            outline.setStyle(PenStyle.DashLine);

            painter.setPen(outline);
            painter.setBrush(new QColor(...hexToRgb(theme.colors.primary), 100));
            painter.drawRect(
                Math.min(this.selectionBox.start.x(), this.selectionBox.end.x()),
                Math.min(this.selectionBox.start.y(), this.selectionBox.end.y()),
                Math.abs(this.selectionBox.end.x() - this.selectionBox.start.x()),
                Math.abs(this.selectionBox.end.y() - this.selectionBox.start.y())
            );
        }

        const buttonSize = 40;
        const buttonX = 10;
        const buttonY = this.height() - this.timelineHeight - buttonSize - 10;

        painter.setBrush(new QColor(theme.colors.button.bg));
        painter.setPen(new QColor(theme.colors.button.border));
        painter.drawRoundedRect(buttonX, buttonY, buttonSize, buttonSize, 4, 4);

        painter.setBrush(new QColor(theme.colors.text));
        if (this.isPlaying) {
            const barWidth = buttonSize / 6;
            const gap = buttonSize / 10;
            painter.drawRect(
                buttonX + buttonSize / 2 - barWidth - gap / 2,
                buttonY + buttonSize / 4,
                barWidth,
                buttonSize / 2
            );
            painter.drawRect(
                buttonX + (buttonSize + gap) / 2,
                buttonY + buttonSize / 4,
                barWidth,
                buttonSize / 2
            );
        } else {
            const trianglePath = new QPainterPath();
            trianglePath.moveTo(buttonX + buttonSize / 3, buttonY + buttonSize / 4);
            trianglePath.lineTo(buttonX + buttonSize / 3, buttonY + buttonSize * 3 / 4);
            trianglePath.lineTo(buttonX + buttonSize * 2 / 3, buttonY + buttonSize / 2);
            trianglePath.closeSubpath();
            painter.drawPath(trianglePath);
        }

        if (this.hoveredKeyframe) {
            const propIdx = Object.keys(this.properties).indexOf(this.hoveredKeyframe.prop);
            const yPos = timelineY + propIdx * this.propertyRowHeight;
            const xPos = timelineX + (this.hoveredKeyframe.t / this.duration) * timelineWidth;

            const easingName = this.easings[this.hoveredKeyframe.e] || this.hoveredKeyframe.e;
            const directionName = this.directions[this.hoveredKeyframe.d] || this.hoveredKeyframe.d;
            const tooltipText = `${easingName} ${directionName}`;

            const textWidth = fm.horizontalAdvance(tooltipText);
            const padding = 4;

            const tooltipX = xPos - textWidth / 2 - padding;
            const tooltipY = yPos - textHeight - padding * 2;

            painter.setBrush(new QColor(0, 0, 0, 220));
            painter.setPen(PenStyle.NoPen);
            painter.drawRoundedRect(
                tooltipX, tooltipY,
                textWidth + padding * 2, textHeight + padding * 2,
                3, 3
            );

            painter.setPen(new QColor(255, 255, 255));
            painter.drawText(
                tooltipX + padding,
                tooltipY + textHeight + padding - 2,
                tooltipText
            );
        }

        painter.end();
    }

    mousePressEvent(e) {
        let currentFile = this.files[this.currentFileIndex];

        const event = new QMouseEvent(e);
        const screenPos = new QPoint(event.x(), event.y());
        let pos = this.screenToImage(screenPos);
        const modifiers = event.modifiers();

        const availableHeight = this.height() - this.timelineHeight;
        const timelineWidth = this.width() - this.labelWidth - this.timelinePadding;
        const sliderX = this.labelWidth + (this.currentTime / this.duration) * timelineWidth;
        const arrowSize = 10;

        const rotHandleSize = 20;
        const isShift = !!(modifiers & KeyboardModifier.ShiftModifier);
        const isCtrl = !!(modifiers & KeyboardModifier.ControlModifier) || event.button() === MouseButton.MiddleButton;

        this.showGuide = false;
        this.guideLines = [];

        const clickingMarker = (
            screenPos.y() <= availableHeight + this.rulerHeight / 2 &&
            screenPos.y() >= availableHeight + this.rulerHeight / 2 - arrowSize - 5 &&
            Math.abs(screenPos.x() - sliderX) <= arrowSize
        );
        const clickingRuler = (
            screenPos.y() <= availableHeight + this.rulerHeight &&
            screenPos.y() >= availableHeight
        );

        const buttonSize = 40;
        const buttonX = 10;
        const buttonY = this.height() - this.timelineHeight - buttonSize - 10;

        if (screenPos.x() >= buttonX && screenPos.x() <= buttonX + buttonSize &&
            screenPos.y() >= buttonY && screenPos.y() <= buttonY + buttonSize) {
            this.togglePlayback();
            this.update();
            return;
        }

        if (event.button() === MouseButton.LeftButton && (clickingMarker || clickingRuler)) {
            this.isScrubbing = true;
            this.setCursor(CursorShape.SizeHorCursor);
            const timelineX = this.labelWidth;
            let newTime = ((screenPos.x() - timelineX) / timelineWidth) * this.duration;
            if (!(modifiers & KeyboardModifier.ShiftModifier)) {
                newTime = Math.round(newTime / this.snapInterval) * this.snapInterval;
            }
            this.currentTime = Math.max(0, Math.min(newTime, this.duration));
            this.updateOverlayPosition();
            this.update();
            return;
        }

        if (
            (event.button() === MouseButton.LeftButton || event.button() === MouseButton.RightButton)
            && screenPos.y() >= availableHeight
        ) {
            const timelineY = availableHeight + this.rulerHeight;
            const clickedPropRow = Math.floor((screenPos.y() - timelineY) / this.propertyRowHeight);

            if (clickedPropRow >= 0 && clickedPropRow < Object.keys(this.properties).length) {
                const prop = Object.keys(this.properties)[clickedPropRow];
                const timelineX = this.labelWidth;
                const timelineWidth = this.width() - this.labelWidth - this.timelinePadding;
                const clickedTime = ((screenPos.x() - timelineX) / timelineWidth) * this.duration;

                const threshold = 5;
                let clickedKeyframe = null;

                for (const kp of currentFile.keyframes) {
                    if (kp.prop !== prop) continue;

                    const kpX = timelineX + (kp.t / this.duration) * timelineWidth;
                    const kpY = timelineY + clickedPropRow * this.propertyRowHeight + this.propertyRowHeight / 2;

                    if (Math.sqrt(Math.pow(screenPos.x() - kpX, 2) +
                        Math.pow(screenPos.y() - kpY, 2)) < threshold) {
                        clickedKeyframe = kp;
                        break;
                    }
                }

                if (clickedKeyframe) {
                    if (isShift) {
                        if (this.selectedKeyframes.has(clickedKeyframe)) {
                            this.selectedKeyframes.delete(clickedKeyframe);
                        } else {
                            this.selectedKeyframes.add(clickedKeyframe);
                        }
                    } else {
                        if (this.selectedKeyframes.size <= 0 || !this.selectedKeyframes.has(clickedKeyframe)) {
                            this.selectedKeyframes.clear();
                            this.selectedKeyframes.add(clickedKeyframe);
                        }

                        if (event.button() === MouseButton.LeftButton) {
                            this.isDraggingKeyframes = true;
                            this.dragStartPos = screenPos;
                            this.dragStartTimes = new Map(
                                Array.from(this.selectedKeyframes).map(kp => [kp, kp.t])
                            );
                        }
                    }
                } else if (event.button() === MouseButton.LeftButton) {
                    if (!isShift) this.selectedKeyframes.clear();
                    this.tempSelectedKeyframes = new Set(this.selectedKeyframes);
                    this.selectionBox = {
                        start: screenPos,
                        end: screenPos,
                        active: true
                    };
                }
                if (event.button() === MouseButton.RightButton) {
                    this.showContextMenu(new QPoint(event.globalX(), event.globalY()))
                }
                this.update();
                return;
            }
        }

        if (event.button() === MouseButton.RightButton && screenPos.y() >= availableHeight) {
            this.showContextMenu(new QPoint(event.globalX(), event.globalY()));
            this.update();
            return;
        }

        if (isCtrl) {
            this.isPanning = true;
            this.panStart = new QPoint(event.x(), event.y());
            this.setCursor(CursorShape.ClosedHandCursor);
            this.update();
            return;
        }

        if (
            pos.x() >= currentFile.overlayRect.left() - rotHandleSize / this.scale &&
            pos.x() <= currentFile.overlayRect.left() + currentFile.overlayRect.width() + rotHandleSize / this.scale &&
            pos.y() >= currentFile.overlayRect.top() - rotHandleSize / this.scale &&
            pos.y() <= currentFile.overlayRect.top() + currentFile.overlayRect.height() + rotHandleSize / this.scale &&
            !(
                pos.x() >= currentFile.overlayRect.left() &&
                pos.x() <= currentFile.overlayRect.left() + currentFile.overlayRect.width() &&
                pos.y() >= currentFile.overlayRect.top() &&
                pos.y() <= currentFile.overlayRect.top() + currentFile.overlayRect.height()
            )
        ) {
            const canvasCenterX = this.width() / 2 + this.offset.x() + currentFile.overlayRect.left();
            const canvasCenterY = availableHeight / 2 + this.offset.y() + currentFile.overlayRect.top();

            const startAngle = Math.atan2(event.y() - canvasCenterY, event.x() - canvasCenterX) * 180 / Math.PI;

            this.isRotatingOverlay = true;
            this.rotationLastAngle = startAngle;
            currentFile.unsnappedRotation = currentFile.overlayRotation;
            this.setCursor(CursorShape.WaitCursor);
            this.update();
            return;
        }

        let clickedFileIndex = -1;
        this.files.forEach((file, index) => {
            if (
                file.overlayOpacity <= 0.1 && !file.keyframes.filter(k => k.prop == "o").every(k => k.value <= 0.1)
            ) return;

            const rect = file.overlayRect;
            const filePos = this.screenToImage(screenPos, false, file);

            if (
                filePos.x() >= rect.left() && filePos.x() <= rect.left() + rect.width() &&
                filePos.y() >= rect.top() && filePos.y() <= rect.top() + rect.height() &&
                (index > this.currentFileIndex || !(
                    pos.x() >= currentFile.overlayRect.left() &&
                    pos.x() <= (currentFile.overlayRect.left() + currentFile.overlayRect.width()) &&
                    pos.y() >= currentFile.overlayRect.top() &&
                    pos.y() <= (currentFile.overlayRect.top() + currentFile.overlayRect.height())
                ))
            ) {
                clickedFileIndex = index;
            }
        });

        if (clickedFileIndex != -1 && clickedFileIndex !== this.currentFileIndex) {
            this.currentFileIndex = clickedFileIndex;
            currentFile = this.files[this.currentFileIndex];
            pos = this.screenToImage(screenPos);
        }

        if (
            pos.x() >= currentFile.overlayRect.left() &&
            pos.x() <= (currentFile.overlayRect.left() + currentFile.overlayRect.width()) &&
            pos.y() >= currentFile.overlayRect.top() &&
            pos.y() <= (currentFile.overlayRect.top() + currentFile.overlayRect.height())
        ) {
            const handleSize = 10 / this.scale;
            const x = pos.x();
            const y = pos.y();
            const rect = currentFile.overlayRect;

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

            if (direction && clickedFileIndex == -1) {
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

                    const baseW = this.canvasWidth;
                    const baseH = this.canvasHeight;
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
        const currentFile = this.files[this.currentFileIndex];

        const event = new QMouseEvent(e);
        const screenPos = new QPoint(event.x(), event.y());
        const pos = this.screenToImage(screenPos);
        const modifiers = event.modifiers();
        const availableHeight = this.height() - this.timelineHeight;

        const isShift = !!(modifiers & KeyboardModifier.ShiftModifier);
        const isAlt = !!(modifiers & KeyboardModifier.AltModifier);
        const isCtrl = !!(modifiers & KeyboardModifier.ControlModifier) || event.button() === MouseButton.MiddleButton;

        const timelineWidth = this.width() - this.labelWidth - this.timelinePadding;
        const sliderX = this.labelWidth + (this.currentTime / this.duration) * timelineWidth;
        const arrowSize = 10;

        this.showGuide = false;
        this.guideLines = [];

        if (
            !this.isScrubbing && !this.isDraggingKeyframes && !this.selectionBox?.active
            && screenPos.y() <= availableHeight + this.rulerHeight / 2
            && screenPos.y() >= availableHeight + this.rulerHeight / 2 - arrowSize - 5
            && Math.abs(screenPos.x() - sliderX) <= arrowSize
        ) {
            this.setCursor(CursorShape.SizeHorCursor);
            return;
        }

        if (this.isScrubbing) {
            const timelineWidth = this.width() - this.labelWidth - this.timelinePadding;
            const timelineX = this.labelWidth;

            let newTime = ((event.x() - timelineX) / timelineWidth) * this.duration;
            if (!(modifiers & KeyboardModifier.ShiftModifier)) {
                newTime = Math.round(newTime / this.snapInterval) * this.snapInterval;
            }
            this.currentTime = Math.max(0, Math.min(newTime, this.duration));
            this.updateOverlayPosition();
            this.update();
            return;
        }

        if (this.isDraggingKeyframes) {
            const timelineWidth = this.width() - this.labelWidth - this.timelinePadding;
            const timelineX = this.labelWidth;
            const deltaX = screenPos.x() - this.dragStartPos.x();

            for (const [kp, originalTime] of this.dragStartTimes) {
                let newTime = originalTime + (deltaX / timelineWidth) * this.duration;
                if (!(modifiers & KeyboardModifier.ShiftModifier)) {
                    newTime = Math.round(newTime / this.snapInterval) * this.snapInterval;
                }
                kp.t = Math.max(0, Math.min(newTime, this.duration));
            }

            this.update();
            return;
        }

        if (this.selectionBox?.active) {
            this.selectionBox.end = screenPos;

            const timelineY = availableHeight + this.rulerHeight;
            const timelineWidth = this.width() - this.labelWidth - this.timelinePadding;
            const timelineX = this.labelWidth;

            const minX = Math.min(this.selectionBox.start.x(), this.selectionBox.end.x());
            const maxX = Math.max(this.selectionBox.start.x(), this.selectionBox.end.x());
            const minY = Math.min(this.selectionBox.start.y(), this.selectionBox.end.y());
            const maxY = Math.max(this.selectionBox.start.y(), this.selectionBox.end.y());

            const newSelection = new Set(this.tempSelectedKeyframes);

            Object.keys(this.properties).forEach((prop, idx) => {
                const yPos = timelineY + idx * this.propertyRowHeight;
                const rowHeight = this.propertyRowHeight;
                const yCenter = yPos + this.propertyRowHeight / 2;

                if (yCenter >= minY && yCenter <= maxY) {
                    currentFile.keyframes.filter(kp => kp.prop === prop).forEach(kp => {
                        const xPos = timelineX + (kp.t / this.duration) * timelineWidth;
                        if (xPos >= minX && xPos <= maxX) {
                            newSelection.add(kp);
                        }
                    });
                }
            });

            this.selectedKeyframes = newSelection;
            this.update();
            return;
        }

        if (this.isPanning) {
            const delta = new QPoint(screenPos.x() - this.panStart.x(), screenPos.y() - this.panStart.y());
            this.panStart = screenPos;
            this.offset = new QPoint(this.offset.x() + delta.x(), this.offset.y() + delta.y());
            this.update();
            return;
        }

        if (this.isRotatingOverlay) {
            const availableHeight = this.height() - this.timelineHeight;
            const canvasCenterX = this.width() / 2 + this.offset.x() + currentFile.overlayRect.left();
            const canvasCenterY = availableHeight / 2 + this.offset.y() + currentFile.overlayRect.top();

            const currentAngle = Math.atan2(event.y() - canvasCenterY, event.x() - canvasCenterX) * 180 / Math.PI;
            let delta = currentAngle - this.rotationLastAngle;

            if (delta > 180) delta -= 360;
            else if (delta < -180) delta += 360;

            currentFile.unsnappedRotation += delta;

            let newRotation = currentFile.unsnappedRotation;

            if (isShift && isAlt) {
                newRotation = roundTo(newRotation, 5);
            } else if (isShift) {
                newRotation = roundTo(newRotation, 15);
            } else if (isAlt) {
                newRotation = roundTo(newRotation, 1);
            }

            currentFile.overlayRotation = newRotation;

            this.updateKeyframe("r", currentFile.overlayRotation);

            this.rotationLastAngle = currentAngle;
            this.update();
            return;
        }

        if (this.isMovingOverlay) {
            let deltaX = pos.x() - this.dragStartImagePos.x();
            let deltaY = pos.y() - this.dragStartImagePos.y();

            if (isAlt) {
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    deltaY = 0;
                } else {
                    deltaX = 0;
                }
            }

            let newX = this.initialOverlayRect.left() + deltaX;
            let newY = this.initialOverlayRect.top() + deltaY;

            if (isShift) {
                const baseW = this.canvasWidth;
                const baseH = this.canvasHeight;
                const overlayW = this.initialOverlayRect.width();
                const overlayH = this.initialOverlayRect.height();
                const centerX = (baseW - overlayW) / 2;
                const centerY = (baseH - overlayH) / 2;
                const snapThreshold = 10;

                if (Math.abs(newX + centerX) <= snapThreshold) newX = -centerX;
                if (Math.abs(newX - centerX) <= snapThreshold) newX = centerX;
                if (Math.abs(newX) <= snapThreshold) newX = 0;

                if (Math.abs(newY + centerY) <= snapThreshold) newY = -centerY;
                if (Math.abs(newY - centerY) <= snapThreshold) newY = centerY;
                if (Math.abs(newY) <= snapThreshold) newY = 0;
            }

            const newOverlayRect = new QRect(
                newX,
                newY,
                this.initialOverlayRect.width(),
                this.initialOverlayRect.height()
            );

            if (newOverlayRect.left() != currentFile.overlayRect.left())
                this.updateKeyframe("x", newOverlayRect.left());

            if (newOverlayRect.top() != currentFile.overlayRect.top())
                this.updateKeyframe("y", newOverlayRect.top());

            currentFile.overlayRect = newOverlayRect;

            if (isShift) {
                this.showGuide = true;

                const baseW = this.canvasWidth;
                const baseH = this.canvasHeight;
                const cx = baseW / 2;
                const cy = baseH / 2;
                this.guideLines.push({ x1: cx, y1: 0, x2: cx, y2: baseH });
                this.guideLines.push({ x1: 0, y1: cy, x2: baseW, y2: cy });
            }

            this.update();
            return;
        }

        if (this.isResizingOverlay) {
            let deltaX = (pos.x() - this.dragStartImagePos.x());
            let deltaY = (pos.y() - this.dragStartImagePos.y());

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
                const dragY = moveY * currentFile.aspectRatio;
                const drag = Math.abs(dragX) < Math.abs(dragY) ? dragX : dragY;

                const rawWidth = this.initialOverlayRect.width() + drag * 2;
                const rawHeight = rawWidth / currentFile.aspectRatio;

                newWidth = Math.max(1, Math.round(rawWidth));
                newHeight = Math.max(1, Math.round(rawHeight));

                const dx = (newWidth - this.initialOverlayRect.width()) / 2;
                const dy = (newHeight - this.initialOverlayRect.height()) / 2;

                newX = this.initialOverlayRect.left() - dx;
                newY = this.initialOverlayRect.top() - dy;
            } else if (isShift) {
                if (this.resizeDirection.includes("w")) {
                    newWidth = Math.max(1, this.initialOverlayRect.width() - deltaX);
                    newHeight = newWidth / currentFile.aspectRatio;
                    newX = this.initialOverlayRect.left() + deltaX;
                } else if (this.resizeDirection.includes("e")) {
                    newWidth = Math.max(1, this.initialOverlayRect.width() + deltaX);
                    newHeight = newWidth / currentFile.aspectRatio;
                }

                if (this.resizeDirection.includes("n")) {
                    newHeight = Math.max(1, this.initialOverlayRect.height() - deltaY);
                    newWidth = newHeight * currentFile.aspectRatio;
                    newY = this.initialOverlayRect.top() + deltaY;
                } else if (this.resizeDirection.includes("s")) {
                    newHeight = Math.max(1, this.initialOverlayRect.height() + deltaY);
                    newWidth = newHeight * currentFile.aspectRatio;
                }
            } else {
                switch (this.resizeDirection) {
                    case "nw":
                        newWidth = Math.max(1, this.initialOverlayRect.width() - deltaX);
                        newHeight = Math.max(1, this.initialOverlayRect.height() - deltaY);
                        newX = this.initialOverlayRect.left() + deltaX;
                        newY = this.initialOverlayRect.top() + deltaY;
                        break;
                    case "ne":
                        newWidth = Math.max(1, this.initialOverlayRect.width() + deltaX);
                        newHeight = Math.max(1, this.initialOverlayRect.height() - deltaY);
                        newY = this.initialOverlayRect.top() + deltaY;
                        break;
                    case "sw":
                        newWidth = Math.max(1, this.initialOverlayRect.width() - deltaX);
                        newHeight = Math.max(1, this.initialOverlayRect.height() + deltaY);
                        newX = this.initialOverlayRect.left() + deltaX;
                        break;
                    case "se":
                        newWidth = Math.max(1, this.initialOverlayRect.width() + deltaX);
                        newHeight = Math.max(1, this.initialOverlayRect.height() + deltaY);
                        break;
                    case "w":
                        newWidth = Math.max(1, this.initialOverlayRect.width() - deltaX);
                        newX = this.initialOverlayRect.left() + deltaX;
                        break;
                    case "e":
                        newWidth = Math.max(1, this.initialOverlayRect.width() + deltaX);
                        break;
                    case "n":
                        newHeight = Math.max(1, this.initialOverlayRect.height() - deltaY);
                        newY = this.initialOverlayRect.top() + deltaY;
                        break;
                    case "s":
                        newHeight = Math.max(1, this.initialOverlayRect.height() + deltaY);
                        break;
                }
            }

            const newOverlayRect = new QRect(newX, newY, newWidth, newHeight);

            if (newOverlayRect.left() != currentFile.overlayRect.left())
                this.updateKeyframe("x", newOverlayRect.left());

            if (newOverlayRect.top() != currentFile.overlayRect.top())
                this.updateKeyframe("y", newOverlayRect.top());

            if (newOverlayRect.width() != currentFile.overlayRect.width())
                this.updateKeyframe("w", newOverlayRect.width());

            if (newOverlayRect.height() != currentFile.overlayRect.height())
                this.updateKeyframe("h", newOverlayRect.height());

            currentFile.overlayRect = newOverlayRect;

            this.update();
            return;
        }

        if (isCtrl) {
            this.setCursor(CursorShape.OpenHandCursor);
            this.update();
            return;
        }

        if (screenPos.y() >= availableHeight) {
            const timelineY = availableHeight + this.rulerHeight;
            const clickedPropRow = Math.floor((screenPos.y() - timelineY) / this.propertyRowHeight);

            if (clickedPropRow >= 0 && clickedPropRow < Object.keys(this.properties).length) {
                const prop = Object.keys(this.properties)[clickedPropRow];
                const timelineX = this.labelWidth;
                const timelineWidth = this.width() - this.labelWidth - this.timelinePadding;

                const threshold = 8;
                let newHoveredKeyframe = null;

                for (const kp of currentFile.keyframes) {
                    if (kp.prop !== prop) continue;

                    const kpX = timelineX + (kp.t / this.duration) * timelineWidth;
                    const kpY = timelineY + clickedPropRow * this.propertyRowHeight + this.propertyRowHeight / 2;

                    if (Math.sqrt(Math.pow(screenPos.x() - kpX, 2) +
                        Math.pow(screenPos.y() - kpY, 2)) < threshold) {
                        newHoveredKeyframe = kp;
                        break;
                    }
                }

                if (newHoveredKeyframe !== this.hoveredKeyframe) {
                    this.hoveredKeyframe = newHoveredKeyframe;
                    this.update();
                }
            }
        } else {
            this.hoveredKeyframe = null;
        }

        const rotHandleSize = 20;

        if (
            pos.x() >= currentFile.overlayRect.left() - rotHandleSize / this.scale &&
            pos.x() <= currentFile.overlayRect.left() + currentFile.overlayRect.width() + rotHandleSize / this.scale &&
            pos.y() >= currentFile.overlayRect.top() - rotHandleSize / this.scale &&
            pos.y() <= currentFile.overlayRect.top() + currentFile.overlayRect.height() + rotHandleSize / this.scale &&
            !(
                pos.x() >= currentFile.overlayRect.left() &&
                pos.x() <= currentFile.overlayRect.left() + currentFile.overlayRect.width() &&
                pos.y() >= currentFile.overlayRect.top() &&
                pos.y() <= currentFile.overlayRect.top() + currentFile.overlayRect.height()
            )
        ) {
            this.setCursor(CursorShape.WaitCursor);
        } else if (
            pos.x() >= currentFile.overlayRect.left() &&
            pos.x() <= (currentFile.overlayRect.left() + currentFile.overlayRect.width()) &&
            pos.y() >= currentFile.overlayRect.top() &&
            pos.y() <= (currentFile.overlayRect.top() + currentFile.overlayRect.height())
        ) {
            this.setCursor(this.getHoverCursor(pos));
        } else {
            this.setCursor(CursorShape.ArrowCursor);
        }

        this.update();
    }

    mouseReleaseEvent() {
        const currentFile = this.files[this.currentFileIndex];

        this.isPanning = false;
        this.isRotatingOverlay = false;
        this.isMovingOverlay = false;
        this.isResizingOverlay = false;
        this.showGuide = false;
        this.isScrubbing = false;

        if (this.isDraggingKeyframes) {
            const draggedKeyframes = Array.from(this.selectedKeyframes);
            const existingKeyframes = currentFile.keyframes.filter(kp => !this.selectedKeyframes.has(kp));

            draggedKeyframes.forEach(draggedKp => {
                const sameTimeSameProp = existingKeyframes.filter(existingKp =>
                    existingKp.t === draggedKp.t &&
                    existingKp.prop === draggedKp.prop
                );

                sameTimeSameProp.forEach(existingKp => {
                    const index = currentFile.keyframes.indexOf(existingKp);
                    if (index !== -1) {
                        currentFile.keyframes.splice(index, 1);
                    }
                });
            });

            currentFile.keyframes.sort((a, b) => a.t - b.t);
            this.isDraggingKeyframes = false;
        }

        if (this.selectionBox?.active) {
            this.selectionBox.active = false;
            this.tempSelectedKeyframes = new Set();
        }

        this.updateOverlayPosition();

        this.guideLines = [];
        this.setCursor(CursorShape.ArrowCursor);

        this.saveState();
        this.update();
    }

    mouseDoubleClickEvent(e) {
        const currentFile = this.files[this.currentFileIndex];

        const event = new QMouseEvent(e);
        const screenPos = new QPoint(event.x(), event.y());
        const availableHeight = this.height() - this.timelineHeight;

        if (screenPos.y() < availableHeight) return;

        const timelineY = availableHeight + this.rulerHeight;
        const clickedPropRow = Math.floor((screenPos.y() - timelineY) / this.propertyRowHeight);
        if (clickedPropRow < 0 || clickedPropRow >= Object.keys(this.properties).length) return;

        const prop = Object.keys(this.properties)[clickedPropRow];
        const timelineX = this.labelWidth;
        const timelineWidth = this.width() - this.labelWidth - this.timelinePadding;
        const clickedTime = ((screenPos.x() - timelineX) / timelineWidth) * this.duration;

        const threshold = 5;
        let clickedKeyframe = null;

        for (const kp of currentFile.keyframes) {
            if (kp.prop !== prop) continue;

            const kpX = timelineX + (kp.t / this.duration) * timelineWidth;
            const kpY = timelineY + clickedPropRow * this.propertyRowHeight + this.propertyRowHeight / 2;

            if (Math.sqrt(Math.pow(screenPos.x() - kpX, 2) +
                Math.pow(screenPos.y() - kpY, 2)) < threshold) {
                clickedKeyframe = kp;
                break;
            }
        }

        if (clickedKeyframe) {
            const selectedTime = clickedKeyframe.t;
            const sameTimeKeyframes = currentFile.keyframes.filter(kp => kp.t === selectedTime);
            this.selectedKeyframes.clear();
            sameTimeKeyframes.forEach(kp => this.selectedKeyframes.add(kp));
            this.currentTime = selectedTime;
            this.updateOverlayPosition();
            this.update();
        }
    }

    wheelEvent(e) {
        const currentFile = this.files[this.currentFileIndex];
        const event = new QWheelEvent(e);
        const delta = event.angleDelta().y || event.angleDelta().x;
        const availableHeight = this.height() - this.timelineHeight;

        const modifiers = event.modifiers();
        const isAlt = !!(modifiers & KeyboardModifier.AltModifier);

        if (isAlt) {
            const delta = event.angleDelta().y || event.angleDelta().x;
            const opacityDelta = delta > 0 ? 0.05 : -0.05;
            currentFile.overlayOpacity = Math.max(0, Math.min(1, currentFile.overlayOpacity + opacityDelta));
            this.updateKeyframe("o", currentFile.overlayOpacity);
            this.update();
            return;
        }

        const newScale = delta > 0 ? this.scale * 1.1 : this.scale / 1.1;
        if (newScale < 0.1 || newScale > 20) return;

        const screenPos = event.position();
        const pos = this.screenToImage(new QPoint(screenPos.x, screenPos.y), true);

        const newOffsetX = screenPos.x - pos.x() * newScale -
            (this.width() - this.canvasWidth * newScale) / 2;
        const newOffsetY = screenPos.y - pos.y() * newScale -
            (availableHeight - this.canvasHeight * newScale) / 2;

        this.scale = newScale;
        this.offset = new QPoint(newOffsetX, newOffsetY);
        this.update();
    }

    closeEvent() {
        this.pauseAnimation();
    }

    calculateSnapInterval() {
        const timelineWidth = this.width() - this.labelWidth - this.timelinePadding;
        const pixelsPerSecond = timelineWidth / this.duration;

        const targetPixelsPerTick = 10;
        const secondsPerTick = targetPixelsPerTick / pixelsPerSecond;

        const pow10 = Math.pow(10, Math.floor(Math.log10(secondsPerTick)));
        const fraction = secondsPerTick / pow10;

        let niceFraction;
        if (fraction <= 1) niceFraction = 1;
        else if (fraction <= 2) niceFraction = 2;
        else if (fraction <= 5) niceFraction = 5;
        else niceFraction = 10;

        this.snapInterval = niceFraction * pow10;

        this.update();
    }

    updateKeyframe(prop, value) {
        const currentFile = this.files[this.currentFileIndex];

        let kp = currentFile.keyframes.find(k => k.t === this.currentTime && k.prop === prop);

        if (!kp) {
            const propertyKeyframes = currentFile.keyframes.filter(k => k.prop === prop).sort((a, b) => a.t - b.t);

            let prevKp = null;
            let nextKp = null;

            for (let i = 0; i < propertyKeyframes.length; i++) {
                if (propertyKeyframes[i].t < this.currentTime) {
                    prevKp = propertyKeyframes[i];
                } else if (propertyKeyframes[i].t > this.currentTime) {
                    nextKp = propertyKeyframes[i];
                    break;
                }
            }

            let easing = "sine";
            let direction = "inOut";

            if (prevKp) {
                easing = prevKp.e;
                direction = prevKp.d;
            } else if (nextKp) {
                easing = nextKp.e;
                direction = nextKp.d;
            }

            kp = {
                t: this.currentTime,
                prop: prop,
                value: value,
                e: easing,
                d: direction
            };
            currentFile.keyframes.push(kp);
            currentFile.keyframes.sort((a, b) => a.t - b.t);
        } else {
            kp.value = value;
        }

        this.update();
    }

    getInterpolatedValue(prop, time, file) {
        const currentFile = file ?? this.files[this.currentFileIndex];
        const keyframes = currentFile.keyframes
            .filter(kp => kp.prop === prop)
            .sort((a, b) => a.t - b.t);

        const baseWidth = this.canvasWidth;
        const baseHeight = this.canvasHeight;
        const scaledSize = scaledDimensions(currentFile.overlayPixmap, {
            width: Math.round(baseWidth / 3),
            height: Math.round(baseHeight / 3)
        });

        if (keyframes.length === 0) {
            switch (prop) {
                case "x": return 0;
                case "y": return 0;
                case "w": return scaledSize.width;
                case "h": return scaledSize.height;
                case "r": return 0;
                case "o": return 1;
                default: return 0;
            }
        }

        if (keyframes.length === 1) {
            return keyframes[0].value;
        }

        let prev = keyframes[0];
        let next = keyframes[keyframes.length - 1];

        for (let i = 0; i < keyframes.length - 1; i++) {
            if (keyframes[i].t <= time && keyframes[i + 1].t >= time) {
                prev = keyframes[i];
                next = keyframes[i + 1];
                break;
            }
        }

        if (time <= prev.t) return prev.value;
        if (time >= next.t) return next.value;

        const progress = (time - prev.t) / (next.t - prev.t);

        if (prev.e && prev.e !== "linear") {
            return this.applyEasing(prev, next, progress);
        }

        return prev.value + (next.value - prev.value) * progress;
    }

    applyEasing(prev, next, progress) {
        const easingType = prev.e ?? "sine";
        const easingDirection = prev.d ?? "inOut";

        const start = prev.value;
        const end = next.value;

        switch (easingType) {
            case "linear":
                return start + (end - start) * progress;

            case "constant":
                return start;

            case "sine":
                switch (easingDirection) {
                    case "in": return start + (end - start) * (1 - Math.cos(progress * Math.PI / 2));
                    case "out": return start + (end - start) * Math.sin((progress * Math.PI) / 2);
                    case "inOut": return start + (end - start) * (-(Math.cos(Math.PI * progress) - 1) / 2);
                }
                break;

            case "quad":
                switch (easingDirection) {
                    case "in": return start + (end - start) * (progress * progress);
                    case "out": return start + (end - start) * (1 - (1 - progress) * (1 - progress));
                    case "inOut":
                        return start + (end - start) * (
                            progress < 0.5
                                ? 2 * progress * progress
                                : 1 - Math.pow(-2 * progress + 2, 2) / 2
                        );
                }
                break;

            case "cubic":
                switch (easingDirection) {
                    case "in": return start + (end - start) * (progress * progress * progress);
                    case "out": return start + (end - start) * (1 - Math.pow(1 - progress, 3));
                    case "inOut":
                        return start + (end - start) * (
                            progress < 0.5
                                ? 4 * progress * progress * progress
                                : 1 - Math.pow(-2 * progress + 2, 3) / 2
                        );
                }
                break;

            case "quart":
                switch (easingDirection) {
                    case "in": return start + (end - start) * (progress * progress * progress * progress);
                    case "out": return start + (end - start) * (1 - Math.pow(1 - progress, 4));
                    case "inOut":
                        return start + (end - start) * (
                            progress < 0.5
                                ? 8 * progress * progress * progress * progress
                                : 1 - Math.pow(-2 * progress + 2, 4) / 2
                        );
                }
                break;

            case "quint":
                switch (easingDirection) {
                    case "in": return start + (end - start) * (progress * progress * progress * progress * progress);
                    case "out": return start + (end - start) * (1 - Math.pow(1 - progress, 5));
                    case "inOut":
                        return start + (end - start) * (
                            progress < 0.5
                                ? 16 * progress * progress * progress * progress * progress
                                : 1 - Math.pow(-2 * progress + 2, 5) / 2
                        );
                }
                break;

            case "expo":
                switch (easingDirection) {
                    case "in":
                        return start + (end - start) * (
                            progress === 0 ? 0 : Math.pow(2, 10 * progress - 10)
                        );
                    case "out":
                        return start + (end - start) * (
                            progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
                        );
                    case "inOut":
                        return start + (end - start) * (
                            progress === 0 ? 0 :
                                progress === 1 ? 1 :
                                    progress < 0.5 ? Math.pow(2, 20 * progress - 10) / 2 :
                                        (2 - Math.pow(2, -20 * progress + 10)) / 2
                        );
                }
                break;

            case "circ":
                switch (easingDirection) {
                    case "in": return start + (end - start) * (1 - Math.sqrt(1 - Math.pow(progress, 2)));
                    case "out": return start + (end - start) * Math.sqrt(1 - Math.pow(progress - 1, 2));
                    case "inOut":
                        return start + (end - start) * (
                            progress < 0.5
                                ? (1 - Math.sqrt(1 - Math.pow(2 * progress, 2))) / 2
                                : (Math.sqrt(1 - Math.pow(-2 * progress + 2, 2)) + 1) / 2
                        );
                }
                break;

            case "back":
                const c1 = 1.70158;
                const c2 = c1 * 1.525;
                const c3 = c1 + 1;

                switch (easingDirection) {
                    case "in":
                        return start + (end - start) * (c3 * progress * progress * progress - c1 * progress * progress);
                    case "out":
                        return start + (end - start) * (1 + c3 * Math.pow(progress - 1, 3) + c1 * Math.pow(progress - 1, 2));
                    case "inOut":
                        return start + (end - start) * (
                            progress < 0.5
                                ? (Math.pow(2 * progress, 2) * ((c2 + 1) * 2 * progress - c2) / 2)
                                : (Math.pow(2 * progress - 2, 2) * ((c2 + 1) * (progress * 2 - 2) + c2) + 2) / 2
                        );
                }
                break;

            case "elastic":
                const c4 = (2 * Math.PI) / 3;
                const c5 = (2 * Math.PI) / 4.5;

                switch (easingDirection) {
                    case "in":
                        return start + (end - start) * (
                            progress === 0 ? 0 :
                                progress === 1 ? 1 :
                                    -Math.pow(2, 10 * progress - 10) * Math.sin((progress * 10 - 10.75) * c4)
                        );
                    case "out":
                        return start + (end - start) * (
                            progress === 0 ? 0 :
                                progress === 1 ? 1 :
                                    Math.pow(2, -10 * progress) * Math.sin((progress * 10 - 0.75) * c4) + 1
                        );
                    case "inOut":
                        return start + (end - start) * (
                            progress === 0 ? 0 :
                                progress === 1 ? 1 :
                                    progress < 0.5
                                        ? -(Math.pow(2, 20 * progress - 10) * Math.sin((20 * progress - 11.125) * c5)) / 2
                                        : (Math.pow(2, -20 * progress + 10) * Math.sin((20 * progress - 11.125) * c5)) / 2 + 1
                        );
                }
                break;

            case "bounce":
                const n1 = 7.5625;
                const d1 = 2.75;

                const bounceOut = (p) => {
                    if (p < 1 / d1) {
                        return n1 * p * p;
                    } else if (p < 2 / d1) {
                        return n1 * (p -= 1.5 / d1) * p + 0.75;
                    } else if (p < 2.5 / d1) {
                        return n1 * (p -= 2.25 / d1) * p + 0.9375;
                    } else {
                        return n1 * (p -= 2.625 / d1) * p + 0.984375;
                    }
                };

                const bounceIn = (p) => {
                    return 1 - bounceOut(1 - p);
                };

                switch (easingDirection) {
                    case "in": return start + (end - start) * bounceIn(progress);
                    case "out": return start + (end - start) * bounceOut(progress);
                    case "inOut":
                        return start + (end - start) * (
                            progress < 0.5
                                ? (1 - bounceOut(1 - 2 * progress)) / 2
                                : (1 + bounceOut(2 * progress - 1)) / 2
                        );
                }
                break;

            default:
                return start + (end - start) * progress;
        }

        return start + (end - start) * progress;
    }

    updateOverlayPosition() {
        this.files.forEach(file => {
            const x = this.getInterpolatedValue("x", this.currentTime, file);
            const y = this.getInterpolatedValue("y", this.currentTime, file);
            const w = this.getInterpolatedValue("w", this.currentTime, file);
            const h = this.getInterpolatedValue("h", this.currentTime, file);
            const r = this.getInterpolatedValue("r", this.currentTime, file);
            const o = this.getInterpolatedValue("o", this.currentTime, file);

            file.overlayRect = new QRect(x, y, w, h);
            file.overlayRotation = r;
            file.unsnappedRotation = r;
            file.overlayOpacity = o;
        });
        this.update();
    }

    togglePlayback() {
        if (this.isPlaying) {
            this.pauseAnimation();
        } else {
            this.playAnimation();
        }
    }

    playAnimation() {
        if (this.isPlaying) return;

        this.isPlaying = true;
        const frameRate = 60;
        const frameTime = 1000 / frameRate;
        let lastTime = Date.now();

        this.playbackInterval = setInterval(() => {
            const now = Date.now();
            const delta = (now - lastTime) * this.playbackSpeed;
            lastTime = now;

            this.currentTime += delta / 1000;
            if (this.currentTime >= this.duration) {
                this.currentTime = 0;
            }

            this.updateOverlayPosition();
            this.update();
        }, frameTime);
    }

    pauseAnimation() {
        if (!this.isPlaying) return;

        this.isPlaying = false;
        if (this.playbackInterval) {
            clearInterval(this.playbackInterval);
            this.playbackInterval = null;
        }
    }

    setupShortcuts() {
        const delShortcut = new QShortcut(this);
        delShortcut.setKey(new QKeySequence("Del"));
        delShortcut.setEnabled(true);
        delShortcut.addEventListener("activated", () => {
            const currentFile = this.files[this.currentFileIndex];

            if (this.selectedKeyframes.size > 0) {
                currentFile.keyframes = currentFile.keyframes.filter(kp => !this.selectedKeyframes.has(kp));
                this.selectedKeyframes.clear();
                this.saveState();
                this.updateOverlayPosition();
                this.update();
            }
        });

        const undoShortcut = new QShortcut(this);
        undoShortcut.setKey(new QKeySequence("Ctrl+Z"));
        undoShortcut.setEnabled(true);
        undoShortcut.addEventListener("activated", () => {
            this.undo();
        });

        const redoShortcut = new QShortcut(this);
        redoShortcut.setKey(new QKeySequence("Ctrl+Y"));
        redoShortcut.setEnabled(true);
        redoShortcut.addEventListener("activated", () => {
            this.redo();
        });

        const cutShortcut = new QShortcut(this);
        cutShortcut.setKey(new QKeySequence("Ctrl+X"));
        cutShortcut.setEnabled(true);
        cutShortcut.addEventListener("activated", () => {
            const currentFile = this.files[this.currentFileIndex];

            if (this.selectedKeyframes.size > 0) {
                this.clipboard = Array.from(this.selectedKeyframes).map(k => JSON.parse(JSON.stringify(k)));
                currentFile.keyframes = currentFile.keyframes.filter(k => !this.selectedKeyframes.has(k));
                this.selectedKeyframes.clear();
                this.saveState();
                this.updateOverlayPosition();
                this.update();
            }
        });

        const copyShortcut = new QShortcut(this);
        copyShortcut.setKey(new QKeySequence("Ctrl+C"));
        copyShortcut.setEnabled(true);
        copyShortcut.addEventListener("activated", () => {
            if (this.selectedKeyframes.size > 0) {
                this.clipboard = Array.from(this.selectedKeyframes).map(k => JSON.parse(JSON.stringify(k)));
            }
        });

        const pasteShortcut = new QShortcut(this);
        pasteShortcut.setKey(new QKeySequence("Ctrl+V"));
        pasteShortcut.setEnabled(true);
        pasteShortcut.addEventListener("activated", () => {
            const currentFile = this.files[this.currentFileIndex];

            if (this.clipboard?.length > 0) {
                const currentTime = this.currentTime;
                const originalTimes = this.clipboard.map(k => k.t);
                const minOriginalTime = Math.min(...originalTimes);
                const timeDiff = currentTime - minOriginalTime;

                const newKeyframes = this.clipboard.map(k => ({
                    ...k,
                    t: Math.max(0, Math.min(k.t + timeDiff, this.duration))
                }));

                newKeyframes.forEach(newKp => {
                    currentFile.keyframes = currentFile.keyframes.filter(existingKp =>
                        !(existingKp.t === newKp.t && existingKp.prop === newKp.prop)
                    );
                });

                currentFile.keyframes.push(...newKeyframes);
                currentFile.keyframes.sort((a, b) => a.t - b.t);
                this.selectedKeyframes = new Set(newKeyframes);
                this.saveState();
                this.updateOverlayPosition();
                this.update();
            }
        });

        const selectAllShortcut = new QShortcut(this);
        selectAllShortcut.setKey(new QKeySequence("Ctrl+A"));
        selectAllShortcut.setEnabled(true);
        selectAllShortcut.addEventListener("activated", () => {
            const currentFile = this.files[this.currentFileIndex];
            this.selectedKeyframes = new Set(currentFile.keyframes);
            this.update();
        });

        const playShortcut = new QShortcut(this);
        playShortcut.setKey(new QKeySequence("Space"));
        playShortcut.setEnabled(true);
        playShortcut.addEventListener("activated", () => {
            this.togglePlayback();
            this.update();
        });
    }

    setupContextMenu() {
        this.contextMenu = new QMenu();
        this.contextMenu.setStyleSheet(guiApp.styleSheet);

        this.cutAction = new QAction();
        this.cutAction.setText(translate("gui.menu.cut"));

        this.copyAction = new QAction();
        this.copyAction.setText(translate("gui.menu.copy"));

        this.pasteAction = new QAction();
        this.pasteAction.setText(translate("gui.menu.paste"));

        this.selectAllAction = new QAction();
        this.selectAllAction.setText(translate("gui.menu.selectAll"));

        this.deleteAction = new QAction();
        this.deleteAction.setText(translate("gui.menu.delete"));

        this.easingStyleAction = new QAction();
        this.easingStyleAction.setText(translate("gui.menu.easingStyle"));

        this.easingDirectionAction = new QAction();
        this.easingDirectionAction.setText(translate("gui.menu.easingDirection"));

        this.easingStyleMenu = new QMenu();
        this.easingStyleMenu.setStyleSheet(guiApp.styleSheet);
        this.easingStyleActions = {};

        Object.entries(this.easings).forEach(([easingKey, easingName]) => {
            const action = new QAction();
            action.setText(easingName);
            action.setCheckable(true);
            action.addEventListener("triggered", () => {
                if (this.selectedKeyframes.size === 0) return;
                this.selectedKeyframes.forEach(kp => kp.e = easingKey);
                this.update();
                this.saveState();
            });
            this.easingStyleActions[easingKey] = action;
            this.easingStyleMenu.addAction(action);

        });

        this.easingDirectionMenu = new QMenu();
        this.easingDirectionMenu.setStyleSheet(guiApp.styleSheet);
        this.easingDirectionActions = {};

        Object.entries(this.directions).forEach(([dirKey, dirName]) => {
            const action = new QAction();
            action.setText(dirName);
            action.setCheckable(true);
            action.addEventListener("triggered", () => {
                if (this.selectedKeyframes.size === 0) return;
                this.selectedKeyframes.forEach(kp => kp.d = dirKey);
                this.update();
                this.saveState();
            });
            this.easingDirectionActions[dirKey] = action;
            this.easingDirectionMenu.addAction(action);
        });

        this.easingStyleAction.setMenu(this.easingStyleMenu);
        this.easingDirectionAction.setMenu(this.easingDirectionMenu);

        this.contextMenu.addAction(this.cutAction);
        this.contextMenu.addAction(this.copyAction);
        this.contextMenu.addAction(this.pasteAction);
        this.contextMenu.addAction(this.selectAllAction);
        this.contextMenu.addAction(this.deleteAction);
        this.contextMenu.addAction(this.easingStyleAction);
        this.contextMenu.addAction(this.easingDirectionAction);

        this.cutAction.addEventListener("triggered", () => this.cutKeyframes());
        this.copyAction.addEventListener("triggered", () => this.copyKeyframes());
        this.pasteAction.addEventListener("triggered", () => this.pasteKeyframes());
        this.selectAllAction.addEventListener("triggered", () => this.selectAllKeyframes());
        this.deleteAction.addEventListener("triggered", () => this.deleteKeyframes());
    }

    showContextMenu(screenPos) {
        const currentFile = this.files[this.currentFileIndex];

        const hasSelection = this.selectedKeyframes.size > 0;
        const hasClipboard = !!(this.clipboard && this.clipboard.length > 0);
        const hasKeyframes = currentFile.keyframes.length > 0;

        this.cutAction.setEnabled(hasSelection);
        this.copyAction.setEnabled(hasSelection);
        this.pasteAction.setEnabled(hasClipboard);
        this.selectAllAction.setEnabled(hasKeyframes);
        this.deleteAction.setEnabled(hasSelection);
        this.easingStyleAction.setEnabled(hasSelection);
        this.easingDirectionAction.setEnabled(hasSelection);

        if (hasSelection) this.updateEasingMenuStates();

        this.contextMenu.popup(screenPos);
    }

    cutKeyframes() {
        const currentFile = this.files[this.currentFileIndex];

        if (this.selectedKeyframes.size > 0) {
            this.clipboard = Array.from(this.selectedKeyframes).map(k => JSON.parse(JSON.stringify(k)));
            currentFile.keyframes = currentFile.keyframes.filter(k => !this.selectedKeyframes.has(k));
            this.selectedKeyframes.clear();
            this.saveState();
            this.updateOverlayPosition();
            this.update();
        }
    }

    copyKeyframes() {
        if (this.selectedKeyframes.size > 0) {
            this.clipboard = Array.from(this.selectedKeyframes).map(k => JSON.parse(JSON.stringify(k)));
        }
    }

    pasteKeyframes() {
        const currentFile = this.files[this.currentFileIndex];

        if (!this.clipboard || this.clipboard.length === 0) return;

        const currentTime = this.currentTime;
        const originalTimes = this.clipboard.map(k => k.t);
        const minOriginalTime = Math.min(...originalTimes);
        const timeDiff = currentTime - minOriginalTime;

        const newKeyframes = this.clipboard.map(k => ({
            ...k,
            t: Math.max(0, Math.min(k.t + timeDiff, this.duration))
        }));

        newKeyframes.forEach(newKp => {
            currentFile.keyframes = currentFile.keyframes.filter(existingKp =>
                !(existingKp.t === newKp.t && existingKp.prop === newKp.prop)
            );
        });

        currentFile.keyframes.push(...newKeyframes);
        currentFile.keyframes.sort((a, b) => a.t - b.t);
        this.selectedKeyframes = new Set(newKeyframes);
        this.saveState();
        this.updateOverlayPosition();
        this.update();
    }

    selectAllKeyframes() {
        const currentFile = this.files[this.currentFileIndex];

        this.selectedKeyframes = new Set(currentFile.keyframes);
        this.update();
    }

    deleteKeyframes() {
        const currentFile = this.files[this.currentFileIndex];

        if (this.selectedKeyframes.size > 0) {
            currentFile.keyframes = currentFile.keyframes.filter(k => !this.selectedKeyframes.has(k));
            this.selectedKeyframes.clear();
            this.saveState();
            this.updateOverlayPosition();
            this.update();
        }
    }

    updateEasingMenuStates() {
        const easingStyles = new Set();
        const easingDirections = new Set();

        this.selectedKeyframes.forEach(kp => {
            easingStyles.add(kp.e);
            easingDirections.add(kp.d);
        });

        Object.entries(this.easingStyleActions).forEach(([easingKey, action]) => {
            if (easingStyles.size >= 1 && easingStyles.has(easingKey)) {
                action.setChecked(true);
            } else {
                action.setChecked(false);
            }
        });

        Object.entries(this.easingDirectionActions).forEach(([dirKey, action]) => {
            if (easingDirections.size >= 1 && easingDirections.has(dirKey)) {
                action.setChecked(true);
            } else {
                action.setChecked(false);
            }
        });
    }

    saveState() {
        const currentFile = this.files[this.currentFileIndex];

        const currentState = JSON.parse(JSON.stringify(currentFile.keyframes));
        if (this.history.length === 0 ||
            !this.areStatesEqual(currentState, this.history[this.history.length - 1])) {
            this.history.push(currentState);
            if (this.history.length > this.historyLimit) {
                this.history.shift();
            }
            this.redoStack = [];
        }
    }

    areStatesEqual(state1, state2) {
        if (state1.length !== state2.length) return false;

        for (let i = 0; i < state1.length; i++) {
            const kp1 = state1[i];
            const kp2 = state2[i];

            if (kp1.t !== kp2.t ||
                kp1.prop !== kp2.prop ||
                kp1.value !== kp2.value ||
                kp1.e !== kp2.e ||
                kp1.d !== kp2.d) {
                return false;
            }
        }

        return true;
    }

    undo() {
        const currentFile = this.files[this.currentFileIndex];

        if (this.history.length === 0) return;
        const currentState = JSON.parse(JSON.stringify(currentFile.keyframes));
        this.redoStack.push(currentState);
        const prevState = this.history.pop();
        currentFile.keyframes = prevState.map(k => ({ ...k }));
        this.selectedKeyframes.clear();
        this.updateOverlayPosition();
        this.update();
    }

    redo() {
        const currentFile = this.files[this.currentFileIndex];

        if (this.redoStack.length === 0) return;
        const currentState = JSON.parse(JSON.stringify(currentFile.keyframes));
        this.history.push(currentState);
        const nextState = this.redoStack.pop();
        currentFile.keyframes = nextState.map(k => ({ ...k }));
        this.selectedKeyframes.clear();
        this.updateOverlayPosition();
        this.update();
    }

    screenToImage(point, noCenter, file) {
        const currentFile = file ?? this.files[this.currentFileIndex];

        const availableHeight = this.height() - this.timelineHeight;
        const imgW = this.canvasWidth * this.scale;
        const imgH = this.canvasHeight * this.scale;

        const tx = (this.width() - imgW) / 2 + this.offset.x();
        const ty = (availableHeight - imgH) / 2 + this.offset.y();

        let x = (point.x() - tx) / this.scale;
        let y = (point.y() - ty) / this.scale;

        if (!noCenter) {
            x -= (this.canvasWidth - currentFile.overlayRect.width()) / 2;
            y -= (this.canvasHeight - currentFile.overlayRect.height()) / 2;
        }

        return new QPoint(Math.round(x), Math.round(y));
    }

    getResizeCursor(direction) {
        switch (direction) {
            case "nw": case "se": return CursorShape.SizeFDiagCursor;
            case "ne": case "sw": return CursorShape.SizeBDiagCursor;
            case "w": case "e": return CursorShape.SizeHorCursor;
            case "n": case "s": return CursorShape.SizeVerCursor;
            default: return CursorShape.SizeAllCursor;
        }
    }

    getHoverCursor(pos) {
        const currentFile = this.files[this.currentFileIndex];

        const handleSize = 10 / this.scale;
        const x = pos.x();
        const y = pos.y();
        const rect = currentFile.overlayRect;

        let direction = "";

        if (Math.abs(y - rect.top()) <= handleSize)
            direction += "n";
        if (Math.abs(y - (rect.top() + rect.height())) <= handleSize)
            direction += "s";
        if (Math.abs(x - rect.left()) <= handleSize)
            direction += "w";
        if (Math.abs(x - (rect.left() + rect.width())) <= handleSize)
            direction += "e";

        return this.getResizeCursor(direction);
    }

    fitToView() {
        const availableHeight = this.height() - this.timelineHeight;
        const scaleX = this.width() / (this.canvasWidth * 1.2);
        const scaleY = availableHeight / (this.canvasWidth * 1.2);
        this.scale = Math.min(scaleX, scaleY);
        this.offset = new QPoint(0, 0);
        this.update();
    }

    getArgValues() {
        const combinedKeyframes = [];

        this.files.forEach((file, index) => {
            for (const kp of file.keyframes) {
                if (kp.value == null) continue;

                let combinedKeyframe = combinedKeyframes.find(k => k.f == index && k.t == kp.t && k.e == kp.e && k.d == kp.d);
                if (!combinedKeyframe) {
                    combinedKeyframe = {
                        f: index,
                        t: kp.t,
                        e: kp.e,
                        d: kp.d
                    };
                    combinedKeyframes.push(combinedKeyframe);
                }

                combinedKeyframe[kp.prop] = kp.value;
            }
        });

        const keyframes = combinedKeyframes.sort((a, b) => a.t - b.t);

        return {
            keyframes,
            duration: this.duration,
            width: this.canvasWidth,
            height: this.canvasHeight
        };
    }
}

module.exports = TweenEditor;