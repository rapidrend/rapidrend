const { regexClean } = require("#functions/general");

const absolutePathRegex = new RegExp(`^${regexClean(__appPath)}[\\/\\\\]`);

const relativePath = (path) => path.replace(absolutePathRegex, "").replace(/\\/g, "/");

const generateGlobalStyle = (theme) => `
  /* Base Styles */
  * {
    background-color: ${theme.colors.background};
    color: ${theme.colors.text};
    border: none;
  }

  /* Interactive Elements */
  QPushButton, QToolButton, QLineEdit, QTextEdit, QMenu, QComboBox, QToolTip,
  QDoubleSpinBox, QDateTimeEdit, QComboBox QAbstractItemView, QComboBox QListView {
    background-color: ${theme.colors.button.bg};
    color: ${theme.colors.button.text};
    border: 1px solid ${theme.colors.button.border};
    padding: ${theme.sizes.padding};
    border-radius: ${theme.sizes.smallBorderRadius};
  }

  QPushButton:hover, QToolButton:hover, QLineEdit:hover, QTextEdit:hover, QComboBox:hover,
  QDoubleSpinBox:hover, QDateTimeEdit:hover {
    background-color: ${theme.colors.button.hover};
  }

  QPushButton:pressed, QToolButton:pressed, QLineEdit:pressed, QTextEdit:pressed, QComboBox:pressed,
  QDoubleSpinBox:hover, QDateTimeEdit:hover {
    background-color: ${theme.colors.button.pressed};
  }

  QLabel {
    color: ${theme.colors.text};
  }

  QComboBox QAbstractItemView, QMenu, QToolTip {
    padding: ${theme.sizes.padding};
    border-radius: 1px;
  }

  QComboBox QAbstractItemView {
    border: none;
    margin: 0px ${theme.sizes.padding};
  }

  QToolTip, QToolButton {
    padding: 0px;
  }

  QMenu {
    icon-size: 0px;
  }

  QTextEdit QScrollBar, QComboBox::item, QMenu::item {
    background-color: ${theme.colors.button.bg};
  }

  QComboBox::item:selected, QMenu::item:selected {
    background-color: ${theme.colors.button.hover};
  }

  QComboBox::item:disabled, QMenu::item:disabled {
    color: ${theme.colors.input.placeholder};
  }

  QComboBox::down-arrow {
    background: none;
    color: none;
    border: none;
    image: url("${relativePath(theme.assets.downArrow)}");
  }

  /* Scrollbar Styles */
  QScrollBar {
    background-color: transparent;
  }

  QScrollBar::handle {
    background-color: ${theme.colors.scrollbar.handle};
    margin: ${theme.sizes.padding};
    border-radius: 2px;
  }

  QScrollBar::handle:hover {
    background-color: ${theme.colors.scrollbar.hover};
  }

  QScrollBar::handle:pressed {
    background-color: ${theme.colors.button.pressed};
  }

  QScrollBar::up-arrow, QScrollBar::down-arrow, QScrollBar::right-arrow,
  QScrollBar::left-arrow, QScrollBar::add-line, QScrollBar::sub-line,
  QScrollBar::add-page, QScrollBar::sub-page, QComboBox::drop-down,
  QSizeGrip {
    background: none;
    color: none;
    border: none;
  }

  /* Checkbox Styles */
  QCheckBox {
    margin-left: ${theme.sizes.padding};
  }

  QCheckBox::indicator {
    width: 16px;
    height: 16px;
    border: 2px solid ${theme.colors.checkbox.border};
    border-radius: ${theme.sizes.smallBorderRadius};
    background-color: ${theme.colors.checkbox.bg};
  }

  QCheckBox::indicator:checked {
    background-color: ${theme.colors.checkbox.checked};
    border-color: ${theme.colors.checkbox.checked};
    image: url("${relativePath(theme.assets.checkmark)}");
  }

  QCheckBox::indicator:hover {
    border-color: ${theme.colors.checkbox.hover};
  }

  QCheckBox::indicator:disabled {
    background-color: ${theme.colors.checkbox.disabledBg};
    border-color: ${theme.colors.checkbox.disabledBorder};
  }

  /* Spinbox Styles */
  QDoubleSpinBox::up-button,
  QDateTimeEdit::up-button {
    background-image: url("${relativePath(theme.assets.upArrow)}");
    background-position: center;
    background-repeat: no-repeat;
  }

  QDoubleSpinBox::down-button,
  QDateTimeEdit::down-button {
    background-image: url("${relativePath(theme.assets.downArrow)}");
    background-position: center;
    background-repeat: no-repeat;
  }

  /* Class Styles */
  .title {
    font-size: ${theme.fonts.title.size};
    font-weight: ${theme.fonts.title.weight};
    padding: ${theme.sizes.largePadding};
  }

  .small {
    font-size: ${theme.fonts.small.size};
  }

  .bold {
    font-weight: 600;
  }

  .container {
    border: 1px solid ${theme.colors.group.border};
    padding: ${theme.sizes.padding};
    border-radius: ${theme.sizes.borderRadius};
  }

  .group {
    border: 1px solid ${theme.colors.group.border};
    background: ${theme.colors.group.bg};
    padding: ${theme.sizes.padding};
    border-radius: ${theme.sizes.borderRadius};
  }

  .group QLabel {
    background: ${theme.colors.group.bg};
  }

  .groupLabel {
    background: ${theme.colors.group.bg};
    font-size: ${theme.fonts.groupLabel.size};
    font-weight: ${theme.fonts.groupLabel.weight};
    padding: ${theme.sizes.padding};
  }

  .hugeButton {
    font-size: ${theme.fonts.title.size};
    border-radius: ${theme.sizes.borderRadius};
    padding: ${theme.sizes.largePadding} 20px;
  }

  .danger {
    background-color: ${theme.colors.danger.main};
    border-color: ${theme.colors.danger.border};
    color: #ffffff;
  }

  .danger:hover {
    background-color: ${theme.colors.danger.hover};
  }

  .danger:pressed {
    background-color: ${theme.colors.danger.pressed};
  }

  /* Object Name Styles */
  #selectedCommand, QToolButton:pressed {
    background: ${theme.colors.selected};
  }

  #flatButton, #flatRightButton, #flatLeftButton, #menuButton, #menuButton::menu-indicator {
    border: none;
    background: transparent;
    margin: 0;
  }

  #flatButton:hover, #flatRightButton:hover, #flatLeftButton:hover, #menuButton:hover {
    background: ${theme.colors.button.bg};
  }

  #flatButton:pressed, #flatRightButton:pressed, #flatLeftButton:pressed, #menuButton:checked {
    background: ${theme.colors.button.hover};
  }

  #menuButton, #flatRightButton {
    margin-right: 13px;
  }

  #flatLeftButton {
    margin-left: 13px;
  }

  #outputPreview {
    border-top: 2px dashed ${theme.colors.group.border};
  }

  #resizeHandle {
    background-color: transparent;
  }

  #searchBox {
    margin: 0 ${theme.sizes.largePadding};
    padding: ${theme.sizes.padding};
  }

  #separator {
    background-color: ${theme.colors.group.border};
    border: none;
  }

  #imageEditor {
    background: none;
  }

  #commandTitle {
    margin-left: ${30 + (24 + 5)}px;
  }

  #outputTitle {
    margin-left: ${40}px;
  }

  #terror {
    background-color: #000000;
    border-color: #ff0000;
    color: #ff0000;
  }

  #terror:hover {
    background-color: #550000;
  }

  #terror:pressed {
    background-color: #aa0000;
  }

  #taskGroup-running, #taskGroup-running QLabel {
    border-color: ${theme.colors.group.border};
    background: ${theme.colors.group.bg};
  }

  #taskGroup-completed, #taskGroup-completed QLabel {
    border-color: ${theme.colors.taskGroups.completed.border};
    background: ${theme.colors.taskGroups.completed.main};
  }

  #taskGroup-failed, #taskGroup-failed QLabel {
    border-color: ${theme.colors.taskGroups.failed.border};
    background: ${theme.colors.taskGroups.failed.main};
  }

  #taskGroup-cancelling, #taskGroup-cancelled,
  #taskGroup-cancelling QLabel, #taskGroup-cancelled QLabel {
    border-color: ${theme.colors.taskGroups.cancelled.border};
    background: ${theme.colors.taskGroups.cancelled.main};
  }

  #taskGroup-killed, #taskGroup-killed QLabel {
    border-color: ${theme.colors.taskGroups.killed.border};
    background: ${theme.colors.taskGroups.killed.main};
  }

  /* ArgumentsField Styles */
  #tableArgument QTableWidget {
    border: 1px solid ${theme.colors.group.border};
  }

  #tableArgument QTableView::item {
    background: ${theme.colors.button.bg};
    border: 1px solid ${theme.colors.button.border};
  }

  #tableArgument QTableView QLineEdit, 
  #tableArgument QTableView QComboBox {
    background: ${theme.colors.button.bg};
    padding: 4px;
    margin: 0px;
    border: none;
    border-radius: 0px;
  }

  #tableArgument QTableView QPushButton {
    margin: 0px;
    border-radius: 0px;
  }

  /* FileField Styles */
  #galleryContainer {
    background-color: ${theme.colors.input.bg};
    border: 2px dashed ${theme.colors.input.border};
    border-radius: 20px;
    margin: ${theme.sizes.padding};
  }

  #galleryContainer:hover {
    border-color: ${theme.colors.checkbox.hover};
  }
    
  #galleryContainer QLabel {
    background-color: ${theme.colors.input.bg};
    border-radius: 20px;
  }

  #galleryButton {
    font-size: 16px;
    border-radius: ${theme.sizes.borderRadius};
    padding: 20px;
  }

  /* MultiFileField Styles */
  #filesContainer {
    background-color: ${theme.colors.input.bg};
    border-radius: 20px;
  }
  #fileContainer {
    border-radius: ${theme.sizes.smallBorderRadius};
    background-color: ${theme.colors.button.bg};
    color: ${theme.colors.button.text};
    border: 1px solid ${theme.colors.input.border};
  }
  #fileRow {
    background-color: ${theme.colors.input.bg};
  }
  #fileName, #filePreview {
    background-color: red;
  }
  #removeFileButton {
    border-radius: ${theme.sizes.smallBorderRadius};
    border-color: ${theme.colors.danger.border};
    background-color: ${theme.colors.danger.main};
  }
  #removeFileButton:hover {
    background-color: ${theme.colors.danger.hover};
  }
  #removeFileButton:pressed {
    background-color: ${theme.colors.danger.pressed};
  }
`;

module.exports = {
  generateGlobalStyle,
  getThemeStyle: (isDark) => {
    const { light, dark } = require("./Themes");
    return generateGlobalStyle(isDark ? dark : light);
  }
};