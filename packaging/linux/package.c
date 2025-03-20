#include <unistd.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <libgen.h> // For dirname

int main(int argc, char *argv[]) {
    // Get the path of the running binary
    char exe_path[1024];
    ssize_t len = readlink("/proc/self/exe", exe_path, sizeof(exe_path) - 1);
    if (len == -1) {
        perror("Failed to determine binary path");
        return 1;
    }
    exe_path[len] = '\0'; // Null-terminate the path

    // Get the directory containing the binary
    char *binary_dir = dirname(exe_path);

    // QT library path
    char qt_path[1024];
    snprintf(qt_path, sizeof(qt_path), "%s/node_modules/@nodegui/nodegui/miniqt/6.6.0/gcc_64/lib", binary_dir);

    // Qode path
    char qode_path[1024];
    snprintf(qode_path, sizeof(qode_path), "%s/node_modules/@nodegui/qode/binaries/qode", binary_dir);

    // Program path
    char program_path[1024];
    snprintf(program_path, sizeof(program_path), "%s/dist/index.js", binary_dir);

    // Set the environment variable
    if (setenv("LD_LIBRARY_PATH", qt_path, 1) != 0) {
        perror("Failed to set LD_LIBRARY_PATH");
        return 1;
    }

    // Allocate memory for the new argument array
    int new_argc = 2 + (argc - 1); // "qode" + "./dist/index.js" + additional arguments
    char **pargv = malloc((new_argc + 1) * sizeof(char *));
    if (pargv == NULL) {
        perror("malloc failed");
        return 1;
    }

    // Set the first two arguments
    pargv[0] = "qode";
    pargv[1] = program_path;

    // Append additional arguments from argv
    for (int i = 1; i < argc; i++) {
        pargv[i + 1] = argv[i];
    }

    // Null-terminate the argument array
    pargv[new_argc] = NULL;

    // Execute the program
    execvp(qode_path, pargv);

    // If execvp fails, print an error and clean up
    perror("execvp failed");
    free(pargv);
    return 1;
}
