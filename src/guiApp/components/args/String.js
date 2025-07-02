const { QLineEdit, QSizePolicyPolicy, WidgetEventTypes } = require("@nodegui/nodegui");
const { translate } = require("#functions/translate");
const { fieldVal, updateArgFields } = require("../../utils/args");

class StringField extends QLineEdit {
    constructor(key, arg) {
        super();

        this.setSizePolicy(QSizePolicyPolicy.Expanding, QSizePolicyPolicy.Expanding);
        this.setPlaceholderText(arg.settings?.placeholder || `${translate("gui.argFields.string")} ${arg.name}`);
        this.setText(fieldVal(arg.settings?.dft, ""));

        this.addEventListener(WidgetEventTypes.FocusIn, () => {
            guiApp.selectedArg = this;
        });

        this.addEventListener(WidgetEventTypes.FocusOut, () => {
            if (guiApp.selectedArg == this) delete guiApp.selectedArg;
        });

        this.addEventListener("textChanged", () => {
            if (!guiApp.modifiedArgs.includes(key)) guiApp.modifiedArgs.push(key);
            guiApp.argFields[key] = this.text();
            updateArgFields();
        });
    }
}

module.exports = StringField;