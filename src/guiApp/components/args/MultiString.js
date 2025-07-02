const { QTextEdit, QSizePolicyPolicy, WidgetEventTypes, QTextEditLineWrapMode, WrapMode, QFontMetrics, QFont } = require("@nodegui/nodegui");
const { translate } = require("#functions/translate");
const { fieldVal, updateArgFields } = require("../../utils/args");

class MultiStringField extends QTextEdit {
    constructor(key, arg) {
        super();

        this.arg = arg;

        this.setSizePolicy(QSizePolicyPolicy.Expanding, QSizePolicyPolicy.Preferred);
        this.setMinimumSize(400, 30);
        this.setMaximumHeight(400 + (arg.gui?.extraHeight ?? 0));
        this.setWordWrapMode(WrapMode.WrapAnywhere);
        this.setLineWrapMode(QTextEditLineWrapMode.WidgetWidth);
        this.setTabChangesFocus(arg.gui?.tab ?? true);
        this.setPlaceholderText(arg.settings?.placeholder || `${translate("gui.argFields.string")} ${arg.name}`);
        this.setPlainText(fieldVal(arg.settings?.dft, ""));
        this.setAcceptRichText(false);

        if (arg.gui?.mono) {
            const monoFont = new QFont();
            monoFont.setFamily("monospace");
            this.setFont(monoFont);
        }

        this.addEventListener(WidgetEventTypes.FocusIn, () => {
            guiApp.selectedArg = this;
        });

        this.addEventListener(WidgetEventTypes.FocusOut, () => {
            if (guiApp.selectedArg == this) delete guiApp.selectedArg;
        });

        this.addEventListener("textChanged", () => {
            if (!guiApp.modifiedArgs.includes(key)) guiApp.modifiedArgs.push(key);
            guiApp.argFields[key] = this.toPlainText();
            this.updateHeight();
            updateArgFields();
        });

        this.updateHeight();
    }

    wrapText(text) {
        const fontMetrics = new QFontMetrics(this.font());
        const widgetWidth = this.width() - 20;

        if (!text.trim())
            return [""];

        let result = this.trySplitPreservingDelimiters(text, widgetWidth, fontMetrics);

        if (this.isAnyLineTooWide(result, widgetWidth, fontMetrics))
            result = this.splitByCharactersPreserving(text, widgetWidth, fontMetrics);

        return result;
    }

    trySplitPreservingDelimiters(text, maxWidth, fontMetrics) {
        const segments = this.splitPreservingDelimiters(text);
        let currentLine = "";
        const result = [];

        for (const segment of segments) {
            if (segment === "") continue;

            const testLine = currentLine + segment;
            const lineWidth = fontMetrics.horizontalAdvance(testLine);

            if (lineWidth <= maxWidth)
                currentLine = testLine;
            else {
                if (currentLine === "")
                    result.push(segment);
                else {
                    result.push(currentLine);
                    currentLine = segment;
                }
            }
        }

        if (currentLine !== "")
            result.push(currentLine);

        return result;
    }

    splitPreservingDelimiters(text) {
        const regex = new RegExp(`([^a-zA-Z0-9])`);
        return text.split(regex).filter(part => part !== "");
    }

    splitByCharactersPreserving(text, maxWidth, fontMetrics) {
        const result = [];
        let currentLine = "";

        for (const char of text) {
            const testLine = currentLine + char;
            const lineWidth = fontMetrics.horizontalAdvance(testLine);

            if (lineWidth <= maxWidth)
                currentLine = testLine;
            else {
                if (currentLine === "")
                    result.push(char);
                else {
                    result.push(currentLine);
                    currentLine = char;
                }
            }
        }

        if (currentLine !== "")
            result.push(currentLine);

        return result;
    }

    isAnyLineTooWide(lines, maxWidth, fontMetrics) {
        return lines.some(line => fontMetrics.horizontalAdvance(line) > maxWidth);
    }

    updateHeight() {
        const text = this.toPlainText();
        const fontMetrics = new QFontMetrics(this.font());
        const lineHeight = fontMetrics.height() + 1;
        const padding = 20;

        let lineCount = 0;
        if (this.width() > 0) {
            const explicitLines = text.split("\n");
            for (const line of explicitLines) {
                const wrappedLines = this.wrapText(line);
                lineCount += wrappedLines.length;
            }
        } else {
            lineCount = text.split("\n").length;
        }

        const desiredHeight = Math.min(
            Math.max(
                lineCount * lineHeight + padding,
                30
            ),
            400
        );

        if (this.height() !== desiredHeight)
            this.setFixedHeight(desiredHeight + (this.arg.gui?.extraHeight ?? 0));
    }
}

module.exports = MultiStringField;