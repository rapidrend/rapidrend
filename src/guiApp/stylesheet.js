const stylesheet = (isDarkTheme) => `
/* General style */

* {
    background-color: ${isDarkTheme ? "#121212" : "#f0f0f0"};
    border: none;
}

QPushButton, QToolButton, QLineEdit, QMenu, QComboBox, QToolTip,
QComboBox QAbstractItemView, QComboBox QListView {
    background-color: ${isDarkTheme ? "#333333" : "#ffffff"};
    color: ${isDarkTheme ? "#ffffff" : "#000000"};
    border: 1px solid ${isDarkTheme ? "#555555" : "#dddddd"};
    padding: 5px;
    border-radius: 5px;
}

QComboBox QAbstractItemView, QMenu, QToolTip {
    padding: 5px;
    border-radius: 1px;
}

QComboBox QAbstractItemView {
    border: none;
    margin: 0px 5px;
}

QToolTip, QToolButton {
    padding: 0px;
}

QMenu {
    padding: 5px;
    icon-size: 0px;
}

QComboBox::item, QMenu::item {
    background-color: ${isDarkTheme ? "#333333" : "#ffffff"};
}

QComboBox::item:selected, QMenu::item:selected {
    background-color: ${isDarkTheme ? "#444444" : "#eeeeee"};
}

QComboBox::item:disabled, QMenu::item:disabled {
    color: ${isDarkTheme ? "#777777" : "#bbbbbb"};
}

QComboBox::down-arrow {
    background: none;
    color: none;
    border: none;
    image: url("assets/gui/${isDarkTheme ? "dark" : "light"}/dropdown.svg");
}

QScrollBar {
    background-color: transparent;
}

QScrollBar::handle {
    background-color: ${isDarkTheme ? "#555555" : "#dddddd"};
    margin: 5px;
    border-radius: 2px;
}

QScrollBar::up-arrow, QScrollBar::down-arrow, QScrollBar::right-arrow,
QScrollBar::left-arrow, QScrollBar::add-line, QScrollBar::sub-line,
QScrollBar::add-page, QScrollBar::sub-page, QComboBox::drop-down,
QSizeGrip {
    background: none;
    color: none;
    border: none;
}

QLabel {
    color: ${isDarkTheme ? "#dddddd" : "#333333"};
    margin-bottom: 5px;
}

QLineEdit:hover, QComboBox:hover, QPushButton:hover, QToolButton:hover, QScrollBar::handle:hover{
    background-color: ${isDarkTheme ? "#444444" : "#eeeeee"};
}

QLineEdit:pressed, QComboBox:pressed, QPushButton:pressed, QToolButton:pressed, QScrollBar::handle:pressed {
    background-color: ${isDarkTheme ? "#222222" : "#dddddd"};
}

/* QCheckBox Styles */
QCheckBox {
    color: ${isDarkTheme ? "#ffffff" : "#000000"};
    spacing: 5px;
}

QCheckBox::indicator {
    width: 16px;
    height: 16px;
    border: 2px solid ${isDarkTheme ? "#555555" : "#dddddd"};
    border-radius: 4px;
    background-color: ${isDarkTheme ? "#333333" : "#ffffff"};
}

QCheckBox::indicator:hover {
    border-color: ${isDarkTheme ? "#777777" : "#999999"};
}

QCheckBox::indicator:checked {
    background-color: ${isDarkTheme ? "#4CAF50" : "#4CAF50"};
    border-color: ${isDarkTheme ? "#4CAF50" : "#4CAF50"};
    image: url("assets/gui/checkmark.svg");
}

QCheckBox::indicator:disabled {
    background-color: ${isDarkTheme ? "#555555" : "#cccccc"};
    border-color: ${isDarkTheme ? "#777777" : "#bbbbbb"};
}

/* Class styles */

#selected, QToolButton:pressed {
    background: ${isDarkTheme ? "#555555" : "#dddddd"};
}

.container {
    border: 1px solid ${isDarkTheme ? "#333333" : "#cccccc"};
    padding: 5px;
    border-radius: 5px;
}

.title {
    font-size: 20px;
    font-weight: 600;
    padding: 10px;
}

.small {
    font-size: 12px;
}

.group {
    border: 1px solid ${isDarkTheme ? "#333333" : "#cccccc"};
    background: ${isDarkTheme ? "#222222" : "#f5f5f5"};
    padding: 5px;
    border-radius: 5px;
}

.group-label {
    background: ${isDarkTheme ? "#222222" : "#f5f5f5"};
    font-size: 15px;
    font-weight: 600;
    padding: 5px;
}

.execute {
    font-size: 20px;
    padding: 10px 20px;
}

.search {
    margin: 0 10px;
    padding: 5px;
}

.close {
    font-size: 30px;
    padding: 3px 5px 7px 5px;
    background-color: ${isDarkTheme ? "#aa2222" : "#ff5555"};
    border-color: ${isDarkTheme ? "#cc4444" : "#aa2222"};
    color: #ffffff;
}

.close:hover {
    background-color: ${isDarkTheme ? "#cc4444" : "#ff8888"};
}

.close:pressed {
    background-color: ${isDarkTheme ? "#881111" : "#ffaaaa"};
}

/* Gallery Styles */
#galleryContainer {
    background-color: ${isDarkTheme ? "#333333" : "#ffffff"};
    border: 2px dashed ${isDarkTheme ? "#555555" : "#cccccc"};
    border-radius: 10px;
    margin: 5px;
}

#galleryContainer QLabel {
    background-color: ${isDarkTheme ? "#333333" : "#ffffff"};
}

#galleryContainer:hover {
    border-color: ${isDarkTheme ? "#777777" : "#999999"};
}

#galleryButton {
    font-size: 16px;
    padding: 20px;
}

#galleryContainer QPixmap, #galleryContainer QMovie {
    border-radius: 10px;
}
`;

module.exports = stylesheet;