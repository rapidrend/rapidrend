const { QDoubleSpinBox, QSizePolicyPolicy, CorrectionMode, WidgetEventTypes, QKeyEvent, Key } = require("@nodegui/nodegui");
const { fieldVal, updateArgFields } = require("../../utils/args");
const { roundTo } = require("#functions/math");

class PixelsField extends QDoubleSpinBox {
    constructor(key, arg) {
        super();

        this.arg = arg;

        this.setSizePolicy(QSizePolicyPolicy.Expanding, QSizePolicyPolicy.Expanding);
        this.setMinimumWidth(100);

        this.setSingleStep(1);
        this.setDecimals(0);
        this.updateDisplayFormat(false);

        this.setValue(fieldVal(arg.settings?.dft, 0, guiApp.args));

        this.setCorrectionMode(CorrectionMode.CorrectToPreviousValue);

        this.addEventListener(WidgetEventTypes.KeyPress, (e) => {
            const event = new QKeyEvent(e);
            if (event.key() != Key.Key_Percent) return;

            const base = fieldVal(arg.settings?.base ?? arg.settings?.max, 1, guiApp.args);
            const value = base * (this.value() * 0.01);

            if (!guiApp.modifiedArgs.includes(key)) guiApp.modifiedArgs.push(key);
            this.setValue(value);
            guiApp.argFields[key] = value;
            updateArgFields();
            this.updateDisplayFormat(this.hasFocus());
        });

        this.addEventListener(WidgetEventTypes.FocusIn, () => {
            guiApp.selectedArg = this;
            this.updateDisplayFormat(true);
        });

        this.addEventListener(WidgetEventTypes.FocusOut, () => {
            if (guiApp.selectedArg == this) delete guiApp.selectedArg;
            this.updateDisplayFormat(false);
        });

        this.addEventListener("valueChanged", (value) => {
            if (guiApp.selectedArg != this) return;

            if (!guiApp.modifiedArgs.includes(key)) guiApp.modifiedArgs.push(key);
            guiApp.argFields[key] = value;
            updateArgFields();
            this.updateDisplayFormat(this.hasFocus());
        });
    }

    updateDisplayFormat(focused, val) {
        const min = fieldVal(this.arg.settings?.min, -Infinity, guiApp.args);
        const max = fieldVal(this.arg.settings?.max, Infinity, guiApp.args);
        const base = fieldVal(this.arg.settings?.base ?? this.arg.settings?.max, 1, guiApp.args);

        if (base == undefined) {
            this.setSuffix("px");
            this.setRange(min, max);
            return;
        }

        val = val ?? this.value();

        val /= base;
        val = String(roundTo(val * 100, 0.01));

        const decimalIndex = val.indexOf(".");
        if (decimalIndex > -1) val = val.substring(0, decimalIndex + 3);

        this.setSuffix(`px${focused ? ` = ${val}%` : ""}`);
        this.setRange(min, max);
    }
}

module.exports = PixelsField;