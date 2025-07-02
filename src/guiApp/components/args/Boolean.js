const { QCheckBox, QSizePolicyPolicy, WidgetEventTypes } = require("@nodegui/nodegui");
const { fieldVal, updateArgFields } = require("../../utils/args");

class BooleanField extends QCheckBox {
    constructor(key, arg, fieldContainer) {
        super();

        fieldContainer.setMinimumWidth(50);

        this.setSizePolicy(QSizePolicyPolicy.Expanding, QSizePolicyPolicy.Expanding);
        this.setChecked(fieldVal(arg.settings?.dft, false));

        this.addEventListener(WidgetEventTypes.FocusIn, () => {
            guiApp.selectedArg = this;
        });

        this.addEventListener(WidgetEventTypes.FocusOut, () => {
            if (guiApp.selectedArg == this) delete guiApp.selectedArg;
        });

        this.addEventListener("toggled", (checked) => {
            if (guiApp.selectedArg != this) return;

            if (!guiApp.modifiedArgs.includes(key)) guiApp.modifiedArgs.push(key);
            guiApp.argFields[key] = checked;
            updateArgFields();
        });
    }
}

module.exports = BooleanField;