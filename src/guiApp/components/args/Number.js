const { QDoubleSpinBox, QSizePolicyPolicy, CorrectionMode, WidgetEventTypes } = require("@nodegui/nodegui");
const { fieldVal, updateArgFields } = require("../../utils/args");

class NumberField extends QDoubleSpinBox {
    constructor(key, arg) {
        super();

        this.setSizePolicy(QSizePolicyPolicy.Expanding, QSizePolicyPolicy.Expanding);

        const min = arg.settings?.min ?? -Infinity;
        const max = arg.settings?.max ?? Infinity;

        this.round = arg.settings?.round;
        this.decimals = this.round ? 0 : arg.gui?.decimals ?? 1;
        this.decimalsFocus = this.round ? 0 : arg.gui?.decimalsFocus ?? 3;

        this.setRange(min, max);
        this.setValue(fieldVal(arg.settings?.dft, 0));

        this.updateDisplayFormat(false);
        this.setSingleStep(Math.pow(10, -this.decimals));
        this.setSuffix(arg.gui?.suffix ?? "");

        this.setCorrectionMode(CorrectionMode.CorrectToPreviousValue);

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
        const decimalCases = String((val ?? this.value()) % 1)
            .replace(/^-/, "")
            .slice(2)
            .replace(/[09]{5,}[0-9]+$/, "").length;

        if (focused)
            this.setDecimals(this.decimalsFocus);
        else
            this.setDecimals(this.round ? 0 : decimalCases);
    }
}

module.exports = NumberField;