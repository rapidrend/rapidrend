const EventEmitter = require("events");
const FileInfo = require("./FileInfo");

const { translate } = require("#functions/translate");
const { infoPost } = require("#functions/general");

class CommandTask {
    constructor(command, args) {
        this.command = command;
        this.args = { ...args };

        this.id = ++app.counters.commandTasks;
        this.startTime = new Date();

        this.paths = [];
        this.processes = {};
        this.keywordData = {};
        this.emitters = {
            childProcess: new EventEmitter(),
            path: new EventEmitter()
        };

        this.arrayArgs = {};
        for (const [argName, argValue] of Object.entries(this.getFileArgs())) {
            if (Array.isArray(argValue) && argValue.length > 0) {
                this.args[argName] = argValue[0];

                if (argValue.length > 1) {
                    this.arrayArgs[argName] = argValue.slice(1);
                }
            }
        }

        this.status = "created";
        this.multiFiles = Object.keys(this.arrayArgs).length > 0;
    }

    async start() {
        this.status = "running";

        app.commandTasks[this.id] = this;
        app.emitters.commandTask.emit("start", this);

        this.task = this.command.execute(this.args);
        this.task
            .then((out) => this.cleanup(out))
            .catch((err) => this.cleanup(err, true));

        if (Object.keys(this.arrayArgs).length > 0) {
            new Promise(async (resolve) => {
                const combinations = this.computeFileCombinations(this.arrayArgs);

                const batchSize = 1;
                for (let i = 0; i < combinations.length; i += batchSize) {
                    const batch = combinations.slice(i, i + batchSize);

                    const batchSubtasks = batch.map(comb => {
                        const newArgs = { ...this.args };
                        for (const [argName, argValue] of Object.entries(comb))
                            newArgs[argName] = argValue;

                        const subTask = new CommandTask(this.command, newArgs);
                        subTask.start();
                        return subTask.task;
                    });

                    try {
                        await Promise.all(batchSubtasks);
                    } catch (error) {
                        console.error("Error in batch processing:", error);
                    }
                }

                resolve();
            });
        }
    }

    cancel() {
        if (this.status == "killed" || this.status == "cancelled") return;
        else if (this.status == "cancelling") this.status = "killed";
        else this.status = "cancelling";

        Object.keys(this.processes).forEach(
            pid => process.kill(pid, this.status == "killed" ? "SIGKILL" : "SIGINT")
        );

        if (this.status == "killed") this.cleanup();
    }

    cleanup(output, isError) {
        if (this.status == "cancelling") this.status = "cancelled";

        if (this.status != "cancelled" && this.status != "killed") {
            if (isError) {
                this.status = "failed";
                this.error = output;
            } else {
                this.status = "completed";
                this.output = output;
            }
        }

        infoPost(
            translate("infoPost.commandTask", this.id, translate(`infoPost.taskStatus.${this.status}`))
        );

        delete app.commandTasks[this.id];
        app.emitters.commandTask.emit("end", this);
    }

    getFileArgs() {
        const fileArgs = {};

        for (const [argName, argValue] of Object.entries(this.args)) {
            const argData = this.command.args[argName] ?? app.globalArgs[argName];
            if (argData.type == "file" && (
                argValue instanceof FileInfo ||
                (Array.isArray(argValue) && argValue.every(v => v instanceof FileInfo))
            )) {
                fileArgs[argName] = argValue;
            }
        }

        return fileArgs;
    }

    computeFileCombinations(arrayArgs) {
        const names = Object.keys(arrayArgs);
        const lists = names.map(n => arrayArgs[n]);

        const results = [];
        const recur = (idx, current) => {
            if (idx === names.length) {
                results.push({ ...current });
                return;
            }
            const name = names[idx];
            for (const val of lists[idx]) {
                current[name] = val;
                recur(idx + 1, current);
            }
        };

        recur(0, {});
        return results;
    }
};

module.exports = CommandTask;
