const FileInfo = require("#classes/FileInfo");
const { writeAllConfigs } = require("#functions/filesystem");

async function monitorCommandTasks(app) {
    app = global.app ?? app;

    const emitters = app.emitters;

    emitters.childProcess.on("create", (proc) => {
        for (const commandTask of Object.values(app.commandTasks).reverse())
            onChildAdded(commandTask, proc);
    });

    emitters.childProcess.on("end", (proc) => {
        for (const commandTask of Object.values(app.commandTasks))
            onChildRemoved(commandTask, proc);
    });
}

function onChildAdded(commandTask, proc) {
    const locateCommandFile = proc.spawnargs.find(
        procArg => (
            commandTask.paths.includes(procArg) || Object.values(commandTask.args).find(
                cmdArg => cmdArg instanceof FileInfo && cmdArg.path == procArg
            )
        )
        &&
        !Object.values(app.commandTasks).find(
            task => Object.keys(task.processes).find(pid => pid == proc.pid)
        )
    )

    if (locateCommandFile) {
        if (
            commandTask.status == "cancelling" ||
            commandTask.status == "cancelled" ||
            commandTask.status == "killed"
        ) {
            process.kill(proc.pid, commandTask.status == "killed" ? "SIGKILL" : "SIGINT");
            return;
        }
        
        commandTask.processes[proc.pid] = proc;
        commandTask.emitters.childProcess.emit("create", proc);

        for (const spawnArg of proc.spawnargs) {
            const isPath = spawnArg.match(/^([A-Z]:)?[\/\\]/);
            if (isPath && !commandTask.paths.includes(spawnArg)) {
                commandTask.paths.push(spawnArg);
                commandTask.emitters.path.emit("add", spawnArg);
            }
        }
    }
}

function onChildRemoved(commandTask, proc) {
    if (commandTask.processes[proc.pid]) {
        delete commandTask.processes[proc.pid];
        commandTask.emitters.childProcess.emit("end", proc);
    }
}

function killAllProcesses(childProcesses, folders, configs) {
    try {
        Object.keys(childProcesses).forEach(pid => process.kill(pid));
    } catch {}
    writeAllConfigs(folders, configs);
}

module.exports = {
    monitorCommandTasks,
    onChildAdded,
    onChildRemoved,
    killAllProcesses
};