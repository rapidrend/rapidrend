const { QSizePolicyPolicy, QComboBox, WidgetEventTypes } = require("@nodegui/nodegui");
const { updateArgFields } = require("../../utils/args");

class DropdownField extends QComboBox {
    constructor(key, arg) {
        super();

        this.setSizePolicy(QSizePolicyPolicy.Expanding, QSizePolicyPolicy.Expanding);
        this.setMinimumWidth(135);
        this.addItems(Object.values(arg.settings.allowed));

        const defaultValue = arg.settings.dft || Object.keys(arg.settings.allowed)[0];
        const index = Object.keys(arg.settings.allowed).indexOf(defaultValue);
        if (index !== -1)
            this.setCurrentIndex(index);
        else
            this.setCurrentIndex(0);

        this.addEventListener(WidgetEventTypes.FocusIn, () => {
            guiApp.selectedArg = this;
        });

        this.addEventListener(WidgetEventTypes.FocusOut, () => {
            if (guiApp.selectedArg == this) delete guiApp.selectedArg;
        });

        this.addEventListener("currentIndexChanged", (i) => {
            if (guiApp.selectedArg != this) return;

            if (!guiApp.modifiedArgs.includes(key)) guiApp.modifiedArgs.push(key);
            guiApp.argFields[key] = Object.keys(arg.settings.allowed)[i];
            updateArgFields();
        });

        guiApp.argFields[key] = this.currentText();
    }
}

module.exports = DropdownField;