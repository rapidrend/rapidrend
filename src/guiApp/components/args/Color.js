const {
    QWidget,
    QLineEdit,
    QPushButton,
    QColor,
    QColorDialog,
    QBoxLayout,
    Direction,
    QSizePolicyPolicy,
    WidgetEventTypes,
    CursorShape
} = require("@nodegui/nodegui");
const { translate } = require("#functions/translate");
const { fieldVal, updateArgFields } = require("../../utils/args");

class ColorField extends QWidget {
    constructor(key, arg) {
        super();

        this.key = key;
        this.arg = arg;
        this.currentColor = null;

        this.layout = new QBoxLayout(Direction.LeftToRight);
        this.layout.setContentsMargins(0, 0, 0, 0);
        this.layout.setSpacing(5);
        this.setLayout(this.layout);

        this.previewButton = new QPushButton();
        this.previewButton.setFixedSize(24, 24);
        this.previewButton.setObjectName("colorPreview");
        this.previewButton.setCursor(CursorShape.PointingHandCursor);

        this.inputField = new QLineEdit();
        this.inputField.setSizePolicy(QSizePolicyPolicy.Expanding, QSizePolicyPolicy.Expanding);
        this.inputField.setPlaceholderText(arg.settings?.placeholder || `${translate("gui.argFields.color")} ${arg.name}`);

        this.layout.addWidget(this.previewButton);
        this.layout.addWidget(this.inputField);

        const initialValue = fieldVal(arg.settings?.dft, "");
        this.setValue(initialValue);

        this.previewButton.addEventListener("clicked", this.showColorPicker.bind(this));

        this.inputField.addEventListener(WidgetEventTypes.FocusIn, () => {
            guiApp.selectedArg = this;
        });

        this.inputField.addEventListener(WidgetEventTypes.FocusOut, () => {
            if (guiApp.selectedArg == this) delete guiApp.selectedArg;
        });

        this.inputField.addEventListener("textChanged", () => {
            this.updateColorPreview(this.inputField.text());
            this.handleValueChange();
        });
    }

    setValue(value) {
        if (typeof value === 'object' && value !== null && 'r' in value && 'g' in value && 'b' in value) {
            this.inputField.setText(`${value.r}, ${value.g}, ${value.b}`);
        } else {
            this.inputField.setText(value);
        }
        this.updateColorPreview(this.inputField.text());
    }

    getValue() {
        return this.parseColor(this.inputField.text());
    }

    showColorPicker() {
        const colorDialog = new QColorDialog();
        colorDialog.setStyleSheet(guiApp.styleSheet);

        if (this.currentColor) {
            colorDialog.setCurrentColor(this.currentColor);
        }

        colorDialog.addEventListener("colorSelected", (color) => {
            const rgb = { r: color.red(), g: color.green(), b: color.blue() };
            this.setValue(rgb);
            this.handleValueChange();
        });

        colorDialog.exec();
    }

    handleValueChange() {
        if (!guiApp.modifiedArgs.includes(this.key)) {
            guiApp.modifiedArgs.push(this.key);
        }
        guiApp.argFields[this.key] = this.getValue();
        updateArgFields();
    }

    updateColorPreview(colorText) {
        const color = this.parseColor(colorText);
        if (color) {
            this.currentColor = new QColor(color.r, color.g, color.b);
            this.previewButton.setStyleSheet(`background-color: rgb(${color.r}, ${color.g}, ${color.b});`);
        } else {
            this.currentColor = null;
            this.previewButton.setStyleSheet(`background-color: transparent;`);
        }
    }

    parseColor(colorText) {
        if (!colorText || typeof colorText !== 'string') return null;

        const namedColor = this.parseNamedColor(colorText);
        if (namedColor) return namedColor;

        const hexColor = this.parseHexColor(colorText);
        if (hexColor) return hexColor;

        const rgbColor = this.parseRgbColor(colorText);
        if (rgbColor) return rgbColor;

        return null;
    }

    parseNamedColor(colorText) {
        const colorMap = {
            'black': { r: 0, g: 0, b: 0 },
            'white': { r: 255, g: 255, b: 255 },
            'red': { r: 255, g: 0, b: 0 },
            'green': { r: 0, g: 255, b: 0 },
            'blue': { r: 0, g: 0, b: 255 },
            'yellow': { r: 255, g: 255, b: 0 },
            'cyan': { r: 0, g: 255, b: 255 },
            'magenta': { r: 255, g: 0, b: 255 },
            'gray': { r: 128, g: 128, b: 128 },
            'grey': { r: 128, g: 128, b: 128 },
            'orange': { r: 255, g: 165, b: 0 },
            'purple': { r: 128, g: 0, b: 128 },
            'pink': { r: 255, g: 192, b: 203 },
            'brown': { r: 165, g: 42, b: 42 }
        };

        const lowerColor = colorText.toLowerCase().trim();
        return colorMap[lowerColor] || null;
    }

    parseHexColor(colorText) {
        const hexRegex = /^#?([0-9a-f]{3,8})$/i;
        const match = colorText.match(hexRegex);
        if (!match) return null;

        let hex = match[1];
        if (hex.length === 3 || hex.length === 4) {
            hex = hex.split('').map(c => c + c).join('');
        }

        if (hex.length >= 6) {
            return {
                r: parseInt(hex.substring(0, 2), 16),
                g: parseInt(hex.substring(2, 4), 16),
                b: parseInt(hex.substring(4, 6), 16)
            };
        }

        return null;
    }

    parseRgbColor(colorText) {
        const rgbRegex = /^(?:rgba?\()?\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*[\d.]+\s*)?\)?$/i;
        const match = colorText.match(rgbRegex);
        if (!match) return null;

        return {
            r: Math.min(255, parseInt(match[1], 10)),
            g: Math.min(255, parseInt(match[2], 10)),
            b: Math.min(255, parseInt(match[3], 10))
        };
    }
}

module.exports = ColorField;