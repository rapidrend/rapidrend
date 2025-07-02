const {
    QWidget, QBoxLayout, QPushButton, QTableWidget,
    QComboBox, QLineEdit, QHeaderViewResizeMode,
    QSizePolicyPolicy, QIcon,

    Direction
} = require("@nodegui/nodegui");

const { updateArgFields, fieldVal } = require("../../utils/args");

const { validateArg } = require("#functions/arguments");
const { translate } = require("#functions/translate");
const { deepEqual } = require("#functions/general");

class ArgumentsField extends QWidget {
    constructor(key, arg) {
        super();

        const rowsData = arg.settings.rows || [];

        this.key = key;

        this.objectify = arg.settings.objectify;
        this.columnsMap = arg.settings.columns || {};
        this.columns = Object.entries(this.columnsMap)
            .map(([colKey, def]) => ({
                key: colKey,
                name: def.name || colKey,
                field: def.field || {},
                ...def
            }))
            .filter(col => !col.field?.hide);

        this.rows = [];
        this.rowsData = this.objectify ? {} : [];

        this.layout = new QBoxLayout(Direction.TopToBottom);
        this.setLayout(this.layout);
        this.setMinimumWidth(600);
        this.setObjectName("tableArgument");

        this.table = new QTableWidget();
        this.table.setColumnCount(this.columns.length + 1);
        this.table.setRowCount(0);

        const names = this.columns.map(c => c.name).concat([""]);
        this.table.setHorizontalHeaderLabels(names);
        this.columns.forEach((col, index) => {
            const mode = col.resizeMode || QHeaderViewResizeMode.Stretch;
            this.table.horizontalHeader().setSectionResizeMode(index, mode);
        });

        this.table.horizontalHeader()
            .setSectionResizeMode(this.columns.length, QHeaderViewResizeMode.ResizeToContents);

        this.layout.addWidget(this.table);

        const addBtn = new QPushButton();
        addBtn.setText(translate("gui.argFields.arguments"));
        addBtn.addEventListener("clicked", () => this.addRow());
        this.layout.addWidget(addBtn);

        this.setRows(rowsData);
    }

    addRow(initial = {}) {
        const rowIndex = this.rows.length;
        const rowData = {
            index: rowIndex,
            columns: {}
        };

        this.table.insertRow(rowIndex);
        this.rows.push(rowData);

        this.columns.forEach((col, colIndex) => {
            let widget;

            let value;
            const settings = typeof col.settings == "function" ? col.settings({}, guiApp.args) : col.settings;

            if (col.field?.object) value = initial[col.field.object]?.[col.key];
            else value = initial[col.key];

            const finalValue = value != null ? String(value) : String(fieldVal(settings.dft, null, guiApp.args) ?? "");

            if (settings.allowed) {
                widget = new QComboBox();
                const allowedKeys = Object.keys(settings.allowed);
                const allowedNames = Object.values(settings.allowed);

                allowedKeys.forEach((_, idx) => {
                    widget.addItem(undefined, allowedNames[idx]);
                });

                const idx = allowedKeys.indexOf(finalValue);
                widget.setCurrentIndex(idx >= 0 ? idx : 0);

                widget.addEventListener("currentIndexChanged", () => this.sync());

                widget.getSelectedKey = () => allowedKeys[widget.currentIndex()];
            } else {
                widget = new QLineEdit();
                widget.setText(finalValue);
                widget.addEventListener("textChanged", () => this.sync());
            }

            widget.setToolTip(col.desc);

            this.table.setCellWidget(rowIndex, colIndex, widget);
            rowData.columns[col.key] = { widget, field: col.field?.object || null };
        });

        const delBtn = new QPushButton();
        delBtn.setProperty("class", "danger");
        delBtn.setIcon(new QIcon(guiApp.theme.assets.closeIcon));
        delBtn.setSizePolicy(QSizePolicyPolicy.Fixed, QSizePolicyPolicy.Fixed);
        delBtn.addEventListener("clicked", () => {
            for (let r = 0; r < this.rows.length; r++) {
                const row = this.rows[r];
                if (row.index === rowData.index) {
                    this.table.removeRow(row.index);
                    this.rows.splice(r, 1);
                    this.sync();
                    break;
                }
            }
        });

        this.table.setCellWidget(rowIndex, this.columns.length, delBtn);
        rowData.delBtn = delBtn;
    }

    async setRows(rowsData) {
        if (deepEqual(rowsData, this.rowsData)) return this.sync();

        for (let i = 0; i < this.rows.length; i++)
            this.table.removeRow(0);
        this.rows = [];

        rowsData.forEach(row => this.addRow(row));
        await this.sync();
    }

    async sync() {
        const data = this.objectify ? {} : [];

        for (let r = 0; r < this.rows.length; r++) {
            const row = this.rows[r];
            if (row.index !== r) row.index = r;

            const obj = {};

            const tempArg = {};
            for (const [key, { widget, field }] of Object.entries(row.columns)) {
                let val = widget instanceof QComboBox ? widget.getSelectedKey() : widget.text();
                if (field) {
                    if (!tempArg[field]) tempArg[field] = {};
                    tempArg[field][key] = val;
                } else {
                    tempArg[key] = val;
                }
            }

            for (const [colKey, colDef] of Object.entries(this.columnsMap)) {
                const def = colDef;

                let fullArgData = {};
                for (const [k, v] of Object.entries(def)) {
                    if (typeof v === "function") {
                        try {
                            fullArgData[k] = v(tempArg, guiApp.args);
                        } catch (e) {
                            console.warn(`Failed to resolve dynamic property "${k}" for "${colKey}":`, e);
                            fullArgData[k] = null;
                        }
                    } else {
                        fullArgData[k] = v;
                    }
                }

                if (typeof fullArgData.type === "function") {
                    try {
                        fullArgData.type = fullArgData.type(tempArg, guiApp.args);
                    } catch (e) {
                        console.warn(`Failed to resolve dynamic type for "${colKey}":`, e);
                        fullArgData.type = "string";
                    }
                }

                if (typeof fullArgData.settings === "function")
                    fullArgData.settings = fullArgData.settings(tempArg, guiApp.args);

                let val;
                if (!def.field?.hide) {
                    if (def.field?.object) {
                        val = tempArg[def.field.object]?.[colKey];
                    } else {
                        val = tempArg[colKey];
                    }
                } else {
                    val = fieldVal(fullArgData.settings?.dft, null, guiApp.args) ?? null;
                }

                try {
                    const validated = await validateArg(val, fullArgData, guiApp.argFields, { fieldMode: true });
                    val = validated;
                } catch (e) {
                    console.warn(`Validation failed for column ${colKey}:`, e);
                    val = null;
                }

                if (def.field?.object) {
                    if (!obj[def.field.object]) obj[def.field.object] = {};

                    if (val == null) delete obj[def.field.object][colKey];
                    else obj[def.field.object][colKey] = val;
                } else {
                    if (val == null) delete obj[colKey];
                    else obj[colKey] = val;
                }
            }

            if (this.objectify) {
                const keyVal = Object.entries(obj).find(([k, v]) => k === "name" && v)?.[1]
                    ?.trim().toLowerCase().replace(/[^a-z0-9_]/g, "") || `row_${r}`;
                data[keyVal] = obj;
            } else {
                data.push(obj);
            }
        }

        if (!deepEqual(this.rowsData, data)) {
            this.rowsData = data;

            if (!guiApp.modifiedArgs.includes(this.key))
                guiApp.modifiedArgs.push(this.key);
            guiApp.argFields[this.key] = this.objectify ? { ...data } : [...data];
            updateArgFields();
        }
    }
}

module.exports = ArgumentsField;