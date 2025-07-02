#include <unistd.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <libgen.h>
#include <mach-o/dyld.h>

int main(int argc, char *argv[]) {
    char exe_path[1024];
    uint32_t size = sizeof(exe_path);
    if (_NSGetExecutablePath(exe_path, &size) != 0) {
        perror("Failed to determine binary path");
        return 1;
    }

    char *binary_dir = dirname(exe_path);

    char *app_bundle_check = strstr(binary_dir, ".app/Contents/MacOS");
    if (app_bundle_check != NULL) {
        char resources_path[1024];
        snprintf(resources_path, sizeof(resources_path), "%s/../Resources", binary_dir);
        if (chdir(resources_path) != 0) {
            perror("Failed to change directory to ../Resources");
            return 1;
        }
        binary_dir = resources_path;
    }

    char qt_path[1024];
    snprintf(qt_path, sizeof(qt_path), "%s/node_modules/@nodegui/nodegui/miniqt/6.6.0/macos/lib", binary_dir);

    char qode_path[1024];
    snprintf(qode_path, sizeof(qode_path), "%s/node_modules/@nodegui/qode/binaries/qode", binary_dir);

    char program_path[1024];
    snprintf(program_path, sizeof(program_path), "%s/dist/index.js", binary_dir);

    if (setenv("DYLD_LIBRARY_PATH", qt_path, 1) != 0) {
        perror("Failed to set DYLD_LIBRARY_PATH");
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