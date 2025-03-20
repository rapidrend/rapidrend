#include <windows.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <direct.h> // For _getcwd
#include <shellapi.h> // For ShellExecute

char* add_quotes(const char* path) {
    char* quoted_path = malloc(strlen(path) + 3); // +2 for quotes, +1 for null terminator
    sprintf(quoted_path, "\"%s\"", path);
    return quoted_path;
}

BOOL is_vc_redist_installed() {
    HKEY hKey;
    LONG result = RegOpenKeyExA(HKEY_LOCAL_MACHINE, "SOFTWARE\\Microsoft\\VisualStudio\\14.0\\VC\\Runtimes\\x64", 0, KEY_READ, &hKey);
    if (result == ERROR_SUCCESS) {
        DWORD installed;
        DWORD dataSize = sizeof(DWORD);
        result = RegQueryValueExA(hKey, "Installed", NULL, NULL, (LPBYTE)&installed, &dataSize);
        RegCloseKey(hKey);
        if (result == ERROR_SUCCESS && installed == 1) {
            return TRUE;
        }
    }
    return FALSE;
}

int APIENTRY WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    // Check if Visual C++ Redistributable is installed
    if (!is_vc_redist_installed()) {
        int msgboxID = MessageBoxA(NULL, "Visual C++ Redistributable is not installed. Do you want to download it?", "Visual C++ Redistributable", MB_ICONQUESTION | MB_YESNO);
        if (msgboxID == IDYES) {
            ShellExecuteA(NULL, "open", "https://aka.ms/vs/17/release/vc_redist.x64.exe", NULL, NULL, SW_SHOWNORMAL);
        }
        return 1;
    }

    // Get the path of the running binary
    char exe_path[MAX_PATH];
    if (!GetModuleFileNameA(NULL, exe_path, MAX_PATH)) {
        MessageBoxA(NULL, "Failed to determine binary path.", "Error", MB_ICONERROR);
        return 1;
    }

    // Get the directory containing the binary
    char *last_slash = strrchr(exe_path, '\\');
    if (last_slash != NULL) {
        *last_slash = '\0'; // Remove the executable name from the path
    }

    // QT library path
    char qt_path[MAX_PATH];
    snprintf(qt_path, sizeof(qt_path), "%s\\node_modules\\@nodegui\\nodegui\\miniqt\\6.6.0\\msvc2019_64\\bin;%s\\node_modules\\@nodegui\\nodegui\\miniqt\\6.6.0\\msvc2019_64\\plugins\\iconengines;%s\\node_modules\\@nodegui\\nodegui\\miniqt\\6.6.0\\msvc2019_64\\plugins\\imageformats;%s\\node_modules\\@nodegui\\nodegui\\miniqt\\6.6.0\\msvc2019_64\\plugins\\platforms;%s\\node_modules\\@nodegui\\nodegui\\miniqt\\6.6.0\\msvc2019_64\\plugins\\styles", exe_path, exe_path, exe_path, exe_path, exe_path);

    // Qode path
    char qode_path[MAX_PATH];
    snprintf(qode_path, sizeof(qode_path), "%s\\node_modules\\@nodegui\\qode\\binaries\\qode.exe", exe_path);

    // Program path
    char program_path[MAX_PATH];
    snprintf(program_path, sizeof(program_path), "%s\\dist\\index.js", exe_path);

    // Get the current PATH environment variable
    char current_path[32767]; // Maximum length for environment variables on Windows
    if (!GetEnvironmentVariableA("PATH", current_path, sizeof(current_path))) {
        MessageBoxA(NULL, "Failed to get PATH environment variable.", "Error", MB_ICONERROR);
        return 1;
    }

    // Append the qt_path to the current PATH
    char new_path[32767];
    snprintf(new_path, sizeof(new_path), "%s;%s", current_path, qt_path);

    // Set the updated PATH environment variable
    if (!SetEnvironmentVariableA("PATH", new_path)) {
        MessageBoxA(NULL, "Failed to set PATH environment variable.", "Error", MB_ICONERROR);
        return 1;
    }

    // Allocate memory for the new argument array
    int argc = __argc;
    char **argv = __argv;
    int new_argc = 2 + (argc - 1); // "qode" + "./dist/index.js" + additional arguments
    char **pargv = malloc((new_argc + 1) * sizeof(char *));
    if (pargv == NULL) {
        MessageBoxA(NULL, "Memory allocation failed.", "Error", MB_ICONERROR);
        return 1;
    }

    // Set the first two arguments with quotes
    pargv[0] = add_quotes(qode_path);
    pargv[1] = add_quotes(program_path);

    // Append additional arguments from argv
    for (int i = 1; i < argc; i++) {
        pargv[i + 1] = argv[i];
    }

    // Null-terminate the argument array
    pargv[new_argc] = NULL;

    // Launch the program
    int result = _spawnv(_P_WAIT, qode_path, (const char *const *)pargv);
    if (result == -1) {
        MessageBoxA(NULL, "Failed to execute qode.", "Error", MB_ICONERROR);
        free(pargv);
        return 1;
    }

    // Clean up
    free(pargv);
    return 0;
}