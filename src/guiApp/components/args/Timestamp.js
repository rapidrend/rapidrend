const { QDateTimeEdit, QSizePolicyPolicy, QTime, WidgetEventTypes } = require("@nodegui/nodegui");
const { fieldVal, updateArgFields } = require("../../utils/args");

class TimestampField extends QDateTimeEdit {
    constructor(key, arg) {
        super();

        this.setSizePolicy(QSizePolicyPolicy.Expanding, QSizePolicyPolicy.Expanding);
        this.setCalendarPopup(false);

        const defaultTime = fieldVal(arg.settings?.dft, "");
        if (defaultTime) {
            const timestamp = new Date(defaultTime * 1000).toISOString().slice(11, 23);
            const [hours, minutes, seconds, milliseconds] = timestamp.split(/[:.]/g).map(i => Number(i));
            const time = new QTime(hours, minutes, seconds, milliseconds);
            this.setTime(time);
        } else {
            this.setTime(new QTime(0, 0, 0));
        }

        this.updateDisplayFormat(false);

        this.addEventListener(WidgetEventTypes.FocusIn, () => {
            guiApp.selectedArg = this;
            this.updateDisplayFormat(true);
        });

        this.addEventListener(WidgetEventTypes.FocusOut, () => {
            if (guiApp.selectedArg == this) delete guiApp.selectedArg;
            this.updateDisplayFormat(false);
        });

        this.addEventListener("timeChanged", (time) => {
            if (guiApp.selectedArg != this) return;

            if (!guiApp.modifiedArgs.includes(key)) guiApp.modifiedArgs.push(key);
            guiApp.argFields[key] = time.msecsSinceStartOfDay() / 1000;
            updateArgFields();
            this.updateDisplayFormat(this.hasFocus());
        });
    }

    updateDisplayFormat(focused, val) {
        const lastFormat = this.currentFormat;

        const time = val ?? this.time();
        const hours = time.hour();
        const minutes = time.minute();
        const seconds = time.second();
        const msec = time.msec();

        const decimals = focused ? 3 : String(msec / 1000)
            .replace(/^-/, "")
            .slice(2)
            .replace(/[09]{5,}[0-9]+$/, "").length;

        const ms = decimals > 0 ? `.${"z".repeat(decimals)}` : "";

        if (hours > 9)
            this.currentFormat = `HH:mm:ss${ms}`;
        else if (hours > 0 || minutes == 59)
            this.currentFormat = `H:mm:ss${ms}`;
        else if (minutes > 9)
            this.currentFormat = `mm:ss${ms}`;
        else if (minutes > 0 || seconds == 59)
            this.currentFormat = `m:ss${ms}`;
        else if (seconds > 9)
            this.currentFormat = `ss${ms}`;
        else
            this.currentFormat = `s${ms}`;

        if (this.currentFormat != lastFormat) this.setDisplayFormat(this.currentFormat);
    }
}

module.exports = TimestampField;