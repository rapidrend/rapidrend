const { QSizePolicyPolicy, QComboBox, WidgetEventTypes, QFont, QWidget, QBoxLayout, Direction, QFontWeight, QFontStretch } = require("@nodegui/nodegui");

const { updateArgFields } = require("../../utils/args");
const { translate } = require("#functions/translate");

const getFonts = require("#utils/fontFetcher");

class FontField extends QWidget {
    constructor(key) {
        super();

        this.updatingStyles = false;
        this.desiredStyle = {
            weight: 400,
            style: "Normal",
            stretch: "Normal"
        };

        this.setSizePolicy(QSizePolicyPolicy.Expanding, QSizePolicyPolicy.Expanding);
        this.setMinimumWidth(270);

        this.layout = new QBoxLayout(Direction.LeftToRight);
        this.layout.setContentsMargins(0, 0, 0, 0);
        this.layout.setSpacing(5);
        this.setLayout(this.layout);

        this.fontDropdown = new QComboBox();
        this.fontDropdown.setSizePolicy(QSizePolicyPolicy.Expanding, QSizePolicyPolicy.Expanding);
        this.fontDropdown.setMinimumWidth(135);
        this.fontDropdown.setMaxVisibleItems(15);
        this.layout.addWidget(this.fontDropdown);

        this.styleDropdown = new QComboBox();
        this.styleDropdown.setSizePolicy(QSizePolicyPolicy.Expanding, QSizePolicyPolicy.Expanding);
        this.styleDropdown.setMinimumWidth(135);
        this.styleDropdown.setMaxVisibleItems(15);
        this.styleDropdown.setVisible(false);
        this.layout.addWidget(this.styleDropdown);

        [this.fontDropdown, this.styleDropdown].forEach(dropdown => {
            dropdown.addEventListener(WidgetEventTypes.FocusIn, () => {
                guiApp.selectedArg = this;
            });

            dropdown.addEventListener(WidgetEventTypes.FocusOut, () => {
                if (guiApp.selectedArg == this) delete guiApp.selectedArg;
            });

            dropdown.addEventListener("currentIndexChanged", () => {
                if (!this.fonts || this.updatingStyles || guiApp.selectedArg != this) return;

                const fontName = this.getSelectedFontValue();

                if (!guiApp.modifiedArgs.includes(key)) guiApp.modifiedArgs.push(key);
                guiApp.argFields[key] = fontName;
                this.setValue(fontName, dropdown == this.styleDropdown);
                updateArgFields();
            });
        });

        guiApp.argFields[key] = null;
    }

    async setValue(fontValue, isStyleChange) {
        if (!this.fonts) {
            this.fonts = await getFonts();
            this.fontDropdown.addItems([translate("gui.argFields.font"), ...Object.keys(this.fonts)]);
            this.styleDropdown.addItem(undefined, translate("gui.argFields.fontStyle"));
        }

        let fontFamily = null;

        if (fontValue) {
            fontFamily = Object.keys(this.fonts).find(family => {
                return this.fonts[family].some(style => style.name === fontValue) ||
                    family === fontValue;
            });

            let fontIndex = Object.keys(this.fonts).findIndex(family => family == fontFamily);
            if (fontIndex <= -1) fontIndex = 0;

            this.fontDropdown.setFont(new QFont(fontFamily));
            if (this.fontDropdown.currentIndex() != (fontIndex + 1))
                this.fontDropdown.setCurrentIndex(fontIndex + 1);
        } else {
            this.fontDropdown.setFont(new QFont());
            if (this.fontDropdown.currentIndex() != 0)
                this.styleDropdown.setCurrentIndex(0);
        }

        this.updateStyleDropdown(fontFamily, isStyleChange ? fontValue : null);
    }

    updateStyleDropdown(fontFamily, fontValue) {
        this.updatingStyles = true;

        this.styleDropdown.clear();

        if (!fontFamily || !this.fonts[fontFamily]) {
            this.styleDropdown.setFont(new QFont());
            this.styleDropdown.addItem(undefined, translate("gui.argFields.fontStyle"));
            this.styleDropdown.setVisible(false);
            this.updatingStyles = false;
            this.desiredStyle = {
                weight: 400,
                style: "Normal",
                stretch: "Normal"
            };
            return;
        }

        const fontStyles = this.fonts[fontFamily];

        this.styleDropdown.addItems(fontStyles.map(this.mapStyleName));
        this.styleDropdown.setVisible(fontStyles.length > 1);

        let styleIndex = fontStyles.findIndex(
            s => s.name == fontValue
        );

        if (styleIndex <= -1) {
            styleIndex = fontStyles.findIndex(
                s => (s.style == this.desiredStyle.style && s.weight == this.desiredStyle.weight && s.stretch == this.desiredStyle.stretch)
                    || (s.style == "Normal" && s.weight == 400 && s.stretch == "Normal")
            );
            if (styleIndex <= -1) styleIndex = 0;
        }

        const style = fontStyles[styleIndex];
        this.desiredStyle = { ...style };

        const font = new QFont(fontFamily);
        font.setWeight(style.weight);
        font.setItalic(style.style != "Normal");
        font.setStretch(QFontStretch[style.stretch] ?? QFontStretch.Unstretched);

        this.styleDropdown.setFont(font);

        if (!fontValue) this.updatingStyles = false

        if (this.styleDropdown.currentIndex() != styleIndex)
            this.styleDropdown.setCurrentIndex(styleIndex);

        this.updatingStyles = false;
    }

    mapStyleName(style) {
        const styleName = [];

        const weightValues = {
            100: "Thin",
            200: "ExtraLight",
            300: "Light",
            500: "Medium",
            600: "DemiBold",
            700: "Bold",
            800: "ExtraBold",
            900: "Black"
        };

        if (style.stretch != "Normal") {
            styleName.push(style.stretch);
        }

        if (weightValues[style.weight]) {
            styleName.push(weightValues[style.weight]);
        }

        if (style.style != "Normal") {
            styleName.push(style.style);
        }

        const translatedName = styleName.length > 0
            ? styleName.map(part => translate(`argValues.fontStyle.${part}`)).join(" ")
            : translate(`argValues.fontStyle.Normal`);

        return translatedName;
    }

    getSelectedFontValue() {
        const fontName = Object.keys(this.fonts)[this.fontDropdown.currentIndex() - 1];

        if (!fontName) return null;

        const fontStyles = this.fonts[fontName];
        const currentStyle = fontStyles[this.styleDropdown.currentIndex()];

        if (!currentStyle) return (
            fontStyles.find(s => (s.style == "Normal" && s.weight == 400 && s.stretch == "Normal")
            ) ?? fontStyles[0]).name;

        return currentStyle.name;
    }
}

module.exports = FontField;