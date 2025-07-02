#include <unistd.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <libgen.h>

int main(int argc, char *argv[]) {
    char exe_path[1024];
    ssize_t len = readlink("/proc/self/exe", exe_path, sizeof(exe_path) - 1);
    if (len == -1) {
        perror("Failed to determine binary path");
        return 1;
    }
    exe_path[len] = '\0';

    char *binary_dir = dirname(exe_path);

    char qt_path[1024];
    snprintf(qt_path, sizeof(qt_path), "%s/node_modules/@nodegui/nodegui/miniqt/6.6.0/gcc_64/lib", binary_dir);

    char qode_path[1024];
    snprintf(qode_path, sizeof(qode_path), "%s/node_modules/@nodegui/qode/binaries/qode", binary_dir);

    char program_path[1024];
    snprintf(program_path, sizeof(program_path), "%s/dist/index.js", binary_dir);

    if (setenv("LD_LIBRARY_PATH", qt_path, 1) != 0) {
        perror("Failed to set LD_LIBRARY_PATH");
        return 1;
    }

    int new_argc = 2 + (argc - 1);
    char **pargv = malloc((new_argc + 1) * sizeof(char *));
    if (pargv == NULL) {
        perror("malloc failed");
        return 1;
    }

    pargv[0] = "qode";
    pargv[1] = program_path;

    for (int i = 1; i < argc; i++) {
        pargv[i + 1] = argv[i];
    }

    pargv[new_argc] = NULL;

    execvp(qode_path, pargv);

    perror("execvp failed");
    free(pargv);
    return 1;
}
