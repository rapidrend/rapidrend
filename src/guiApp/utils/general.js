const { WidgetEventTypes, QFontMetrics, QFont } = require("@nodegui/nodegui");

const { generateID, infoPost } = require("#functions/general");

function displayPopup(status, title, text) {
    const PopupDialog = require("../components/PopupDialog");

    const popupDialog = new PopupDialog(status, title, text);
    popupDialog.show();
    popupDialog.setFixedHeight(popupDialog.height());

    infoPost(text);

    guiApp.widgets.dialogs.push(popupDialog);
    popupDialog.addEventListener(
        WidgetEventTypes.Close,
        () => guiApp.widgets.dialogs.splice(guiApp.widgets.dialogs.findIndex(d => d == popupDialog), 1)
    );
}

function addConnection(category, type, data) {
    if (!guiApp.connections[category])
        guiApp.connections[category] = {};

    const id = generateID();
    const connection = { id, category, type, ...data };

    guiApp.connections[category][id] = connection;

    switch (type) {
        case "listener": {
            connection.widget = Array.isArray(connection.widget)
                ? connection.widget
                : [connection.widget];

            for (const widget of connection.widget)
                widget.addEventListener(connection.signal, connection.callback);
            break;
        }

        case "interval": {
            const interval = setInterval(connection.callback, connection.delay);
            connection.interval = interval;
            break;
        }
    }

    return connection;
}

function removeConnection(connection) {
    if (!connection || !guiApp.connections[connection.category]) return;
    delete guiApp.connections[connection.category][connection.id];

    switch (connection.type) {
        case "listener": {
            for (const widget of connection.widget)
                widget.removeEventListener(connection.signal, connection.callback);
            break;
        }

        case "interval": {
            clearInterval(connection.interval);
            break;
        }
    }
}

function removeAllConnections(category) {
    if (!guiApp.connections[category]) return;

    for (const connection of Object.values(guiApp.connections[category]))
        removeConnection(connection)

    guiApp.connections[category] = {};
}

function wrapText(text, widget) {
    const fontMetrics = new QFontMetrics(new QFont(widget.font?.()));
    const widgetWidth = (widget.width?.() ?? widget) - 20;

    let result = trySplitPreservingDelimiters(
        text, widgetWidth, fontMetrics
    );

    if (isAnyLineTooWide(result, widgetWidth, fontMetrics)) {
        result = splitByCharactersPreserving(
            text, widgetWidth, fontMetrics
        );
    }

    return result.join("\n");
}

function trySplitPreservingDelimiters(text, maxWidth, fontMetrics) {
    const segments = splitPreservingDelimiters(text);
    let currentLine = "";
    const result = [];

    for (const segment of segments) {
        if (segment === "") continue;

        const testLine = currentLine + segment;
        const lineWidth = fontMetrics.horizontalAdvance(testLine);

        if (lineWidth <= maxWidth) {
            currentLine = testLine;
        } else {
            if (currentLine === "")
                result.push(segment);
            else {
                result.push(currentLine);
                currentLine = segment;
            }
        }
    }

    if (currentLine !== "")
        result.push(currentLine);

    return result;
}

function splitPreservingDelimiters(text) {
    const regex = new RegExp(`([^a-zA-Z0-9])`);

    return text.split(regex)
        .filter(part => part !== "");
}

function splitByCharactersPreserving(text, maxWidth, fontMetrics) {
    const result = [];
    let currentLine = "";

    for (const char of text) {
        const testLine = currentLine + char;
        const lineWidth = fontMetrics.horizontalAdvance(testLine);

        if (lineWidth <= maxWidth) {
            currentLine = testLine;
        } else {
            if (currentLine === "") {
                result.push(char);
            } else {
                result.push(currentLine);
                currentLine = char;
            }
        }
    }

    if (currentLine !== "") {
        result.push(currentLine);
    }

    return result;
}

function isAnyLineTooWide(lines, maxWidth, fontMetrics) {
    return lines.some(line => fontMetrics.horizontalAdvance(line) > maxWidth);
}

module.exports = {
    displayPopup,
    addConnection,
    removeConnection,
    removeAllConnections,
    wrapText
};