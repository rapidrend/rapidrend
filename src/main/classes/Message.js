class Message {
    constructor(status, title, text, choices) {
        this.status = status;
        this.title = title;
        this.text = text;
        this.choices = choices;
    }
};

module.exports = Message;
