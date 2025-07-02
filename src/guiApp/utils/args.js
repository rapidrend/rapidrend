const {
    QWidget, QBoxLayout, QLineEdit, QTime,
    QLabel, QSizePolicyPolicy, QComboBox,
    QAbstractSpinBox, QCheckBox, QTextEdit,

    AlignmentFlag, Direction
} = require("@nodegui/nodegui");

const { displayPopup } = require("./general");

const { getDefaultArgs, validateArg, addDefaultArgs } = require("#functions/arguments");
const { translate } = require("#functions/translate");

function fieldVal(val, dft, args) {
    if (typeof val == "function") return (args && val(args)) ?? dft;
    return val ?? dft;
}

async function parseArgs(argsObj, {
    fieldMode = false,
    keywordMode = false,
    skipRequired = true,
    forceValidateFiles = false
}) {
    const { selectedCommand } = guiApp;
    const keywordStorage = {};

    let err, errored;

    for (const argName in argsObj) {
        const argData = selectedCommand.data.args?.[argName] || app.globalArgs[argName];
        if (argData == undefined || argsObj[argName] == undefined) continue;
        if (!guiApp.keywordMode && (argData.type == "file" || argData.type == "multi-file") && !forceValidateFiles && guiApp.validFiles[argName]) {
            argsObj[argName] = fieldMode ? guiApp.argFields[argName] : guiApp.args[argName];
            continue;
        }

        const argValue = await validateArg(argsObj[argName], argData, guiApp.args, {
            fieldMode,
            keywordStorage,
            keywordMode
        }).catch((e) => {
            err = e;
            if (!errored && !fieldMode && skipRequired) {
                errored = true;
                displayPopup("error", translate("popupDisplay.status.error.argumentValidate"), err);
            }
        });

        if (err && !skipRequired) throw err;
        if (argValue == undefined) continue;

        argsObj[argName] = argValue;

        if (
            (argData.type == "file" || argData.type == "multi-file")
            && !fieldMode
        ) guiApp.validFiles[argName] = true;
    }

    await addDefaultArgs(
        argsObj, selectedCommand.data, guiApp.args,
        { fieldMode, modifiedArgs: guiApp.modifiedArgs, keywordMode, skipRequired }
    ).catch((e) => {
        err = e;
        if (!errored && !fieldMode && skipRequired) {
            errored = true;
            displayPopup("error", translate("popupDisplay.status.error.argumentValidate"), err);
        }
    });

    if (err && !skipRequired) throw err;

    return argsObj;
}

async function updateArgFields({
    noValidation = false,
    keywordMode = false,
    skipRequired = true,
    forceValidateFiles = false
} = {}) {
    const { selectedCommand } = guiApp;

    if (!selectedCommand.data || guiApp.keywordMode) return;

    const FileField = require("../components/args/File");
    const MultiFileField = require("../components/args/MultiFile");
    const TimestampField = require("../components/args/Timestamp");
    const NumberField = require("../components/args/Number");
    const PixelsField = require("../components/args/Pixels");
    const ArgumentsField = require("../components/args/Arguments");
    const DropdownField = require("../components/args/Dropdown");
    const ColorField = require("../components/args/Color");
    const FontField = require("../components/args/Font");

    let args, err;

    if (!noValidation) {
        args = await parseArgs({ ...guiApp.argFields }, { keywordMode, skipRequired, forceValidateFiles })
            .catch((e) => {
                err = e;
                if (skipRequired) displayPopup("error", translate("popupDisplay.status.error.argumentParse"), err);
            });

        if (!skipRequired && err) throw err;

        guiApp.args = args;

        await parseArgs(guiApp.argFields, { fieldMode: true, skipRequired: true, forceValidateFiles })
            .catch((err) => displayPopup("error", translate("popupDisplay.status.error.argumentFieldParse"), err));

        let defaultArgs = await getDefaultArgs(selectedCommand.data, guiApp.args, { keywordMode })
            .catch((err) => displayPopup("error", translate("popupDisplay.status.error.argumentParse"), err));

        for (const argName in guiApp.args) {
            if (!guiApp.modifiedArgs.includes(argName)) {
                guiApp.args[argName] = defaultArgs[argName];
                guiApp.argFields[argName] = defaultArgs[argName];
            }
        }
    }

    for (const [argName, argValue] of Object.entries(guiApp.argFields)) {
        const argData = selectedCommand.data.args?.[argName] || app.globalArgs[argName];
        const argField = guiApp.widgets.argFields[argName];

        if (!argField) continue;

        const hide = fieldVal(argData.gui?.hide, false, guiApp.args);
        argField.parentWidget().setVisible(!hide);

        if (argField instanceof QCheckBox)
            argField.setChecked(fieldVal(argValue, false));

        if (argField instanceof DropdownField) {
            const index = Object.keys(argData.settings.allowed).indexOf(argValue);
            if (index !== -1) {
                argField.setCurrentIndex(index);
            }
        }

        if (argField instanceof TimestampField) {
            const timestamp = new Date(fieldVal(argValue == Infinity ? 0 : argValue, 0) * 1000)
                .toISOString().slice(11, 23);
            const [hours, minutes, seconds, milliseconds] = timestamp.split(/[:.]/g).map(i => Number(i));
            const time = new QTime(hours, minutes, seconds, milliseconds);
            argField.updateDisplayFormat(argField.hasFocus(), time);
            argField.setTime(time);
        }

        if (argField instanceof NumberField || argField instanceof PixelsField) {
            argField.updateDisplayFormat(argField.hasFocus(), fieldVal(argValue, 0));
            argField.setValue(fieldVal(argValue, 0));
        }

        if (argField instanceof QLineEdit)
            argField.setText(fieldVal(argValue, ""));

        if (argField instanceof ColorField)
            argField.setValue(fieldVal(argValue, { r: 0, g: 0, b: 0 }));

        if (argField instanceof FontField)
            await argField.setValue(fieldVal(argValue, null), true);

        if (argField instanceof QTextEdit && argField.toPlainText() != fieldVal(argValue, ""))
            argField.setPlainText(fieldVal(argValue, ""));

        if (argField instanceof FileField || argField instanceof MultiFileField)
            argField.validate(fieldVal(argValue), forceValidateFiles);

        if (argField instanceof ArgumentsField)
            argField.setRows(fieldVal(argValue, argData.settings.objectify ? {} : []), true);
    }
}

function addArgField([key, arg]) {
    const BooleanField = require("../components/args/Boolean");
    const StringField = require("../components/args/String");
    const MultiStringField = require("../components/args/MultiString");
    const DropdownField = require("../components/args/Dropdown");
    const NumberField = require("../components/args/Number");
    const PixelsField = require("../components/args/Pixels");
    const TimestampField = require("../components/args/Timestamp");
    const ColorField = require("../components/args/Color");
    const FontField = require("../components/args/Font");
    const PathField = require("../components/args/Path");
    const FileField = require("../components/args/File");
    const MultiFileField = require("../components/args/MultiFile");
    const ArgumentsField = require("../components/args/Arguments");

    const createInputField = (key, arg, fieldContainer, fieldLabel, fieldLayout) => {
        if (guiApp.keywordMode) return new StringField(key, arg);
        switch (arg.type) {
            case "boolean": return new BooleanField(key, arg, fieldContainer);
            case "string":
                return arg.settings?.allowed ? new DropdownField(key, arg)
                    : arg.gui?.multiline ? new MultiStringField(key, arg)
                        : new StringField(key, arg);
            case "path": return new PathField(key, arg);
            case "integer": case "number": return new NumberField(key, arg);
            case "pixels": return new PixelsField(key, arg);
            case "timestamp": return new TimestampField(key, arg);
            case "color": return new ColorField(key, arg);
            case "font": return new FontField(key, arg);
            case "file": return new FileField(key, arg, fieldLabel, fieldLayout);
            case "multi-file": return new MultiFileField(key, arg, fieldLabel, fieldLayout);
            case "arguments": return new ArgumentsField(key, arg);
            default:
                console.warn(`${translate("gui.argFields.unsupported")}: ${arg.type}`);
                return null;
        }
    };

    const createFieldContainer = (arg, isGroup, isMultiline) => {
        const direction = (isGroup || isMultiline) ? Direction.TopToBottom : Direction.LeftToRight;

        const fieldContainer = new QWidget();
        fieldContainer.setToolTip(arg.desc);

        const fieldLayout = new QBoxLayout(direction);
        fieldContainer.setLayout(fieldLayout);

        const fieldLabel = new QLabel();
        fieldLabel.setText(arg.name);

        if (isGroup) {
            fieldLabel.setAlignment(AlignmentFlag.AlignCenter);
            fieldContainer.setSizePolicy(QSizePolicyPolicy.Expanding, QSizePolicyPolicy.Minimum);
        } else {
            fieldContainer.setSizePolicy(QSizePolicyPolicy.Minimum, QSizePolicyPolicy.Minimum);
            fieldContainer.setMinimumWidth(isMultiline ? 400 : 200);
        }

        fieldLayout.addWidget(fieldLabel);
        return { fieldContainer, fieldLayout, fieldLabel };
    };

    const addSeparator = (hasMore, separatorKey) => {
        const separator = new QWidget();
        separator.setObjectName("separator");
        separator.setFixedHeight(1);

        const separatorContainer = new QWidget();
        const separatorLayout = new QBoxLayout(Direction.TopToBottom);
        separatorLayout.setContentsMargins(30, 10, 30, 10);
        separatorLayout.addWidget(separator);
        separatorContainer.setLayout(separatorLayout);
        separatorContainer.setSizePolicy(QSizePolicyPolicy.Expanding, QSizePolicyPolicy.Fixed);

        const targetLayout = hasMore ? guiApp.moreArgsLayout : guiApp.argsLayout;
        targetLayout.addWidget(separatorContainer);

        guiApp.widgets.args[separatorKey] = separatorContainer;
    };

    const groupName = arg.gui?.group;

    if (groupName) {
        if (!guiApp.widgets.args[arg.gui.group]) {
            const groupContainer = new QWidget();
            const groupLayout = new QBoxLayout(Direction.LeftToRight);
            groupLayout.setContentsMargins(0, 0, 0, 0);
            groupLayout.setSpacing(0);
            groupContainer.setSizePolicy(QSizePolicyPolicy.Expanding, QSizePolicyPolicy.Minimum);
            groupContainer.setMinimumWidth(200);
            groupContainer.setLayout(groupLayout);

            guiApp.widgets.args[arg.gui.group] = {
                container: groupContainer,
                layout: groupLayout,
                fields: {}
            };

            if (arg.type === "file") {
                guiApp.fileArgsLayout.addWidget(groupContainer);
            } else if (arg.gui?.more) {
                guiApp.moreArgsLayout.addWidget(groupContainer);
            } else {
                guiApp.argsLayout.addWidget(groupContainer);
            }
        }
    }

    const { fieldContainer, fieldLayout, fieldLabel } = createFieldContainer(arg, groupName, arg.gui?.multiline);
    const inputField = createInputField(key, arg, fieldContainer, fieldLabel, fieldLayout);

    if (inputField) {
        if (
            groupName &&
            (
                inputField instanceof QLineEdit ||
                inputField instanceof QAbstractSpinBox
            )
        )
            inputField.setAlignment(AlignmentFlag.AlignCenter);

        if (arg.gui?.style) inputField.setInlineStyle(arg.gui.style);
        if (arg.gui?.width) inputField.setMaximumWidth(arg.gui.width);

        if (groupName)
            fieldLayout.addWidget(inputField, 0, AlignmentFlag.AlignCenter);
        else
            fieldLayout.addWidget(inputField);

        if (arg.settings?.dft !== undefined) guiApp.argFields[key] = arg.settings.dft;
    }

    if (groupName) {
        const group = guiApp.widgets.args[groupName];

        group.fields[key] = fieldContainer;
        group.layout.insertWidget(arg.gui.order || 0, fieldContainer);
    } else {
        if (inputField instanceof FileField || inputField instanceof MultiFileField)
            guiApp.fileArgsLayout.addWidget(fieldContainer, 0, AlignmentFlag.AlignCenter);
        else if (arg.gui?.more)
            guiApp.moreArgsLayout.addWidget(fieldContainer);
        else if (inputField instanceof BooleanField)
            guiApp.argsLayout.addWidget(fieldContainer, 0, AlignmentFlag.AlignCenter);
        else
            guiApp.argsLayout.addWidget(fieldContainer);

        guiApp.widgets.args[key] = fieldContainer;
    }

    guiApp.widgets.argFields[key] = inputField;

    if (arg.gui?.separator)
        addSeparator(arg.gui.more, arg.gui.separator);
}

module.exports = {
    fieldVal,
    parseArgs,
    updateArgFields,
    addArgField
};