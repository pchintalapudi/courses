const DEBUG_FILE_NAME = ".server_connection_debug_file";

function reset_debug_file() {
    localStorage.setItem(DEBUG_FILE_NAME, "File Start Time (UTC): " + new Date().toUTCString() + "\n");
}

function write_line(str: string) {
    localStorage.setItem(DEBUG_FILE_NAME, localStorage.getItem(DEBUG_FILE_NAME)! + str + "\n");
}

function print() {
    // tslint:disable-next-line: no-console
    console.debug(localStorage.getItem(DEBUG_FILE_NAME));
}

export function error(err: string) {
    write_line(`${new Date().toUTCString()} - Error: ${err}`);
}

export function log(info: string) {
    write_line(`${new Date().toUTCString()}: ${info}`);
}

(window as any).reset_debug_file = reset_debug_file;
(window as any).print_debug_file = print;
if (localStorage.getItem(DEBUG_FILE_NAME) === null) {
    reset_debug_file();
}
