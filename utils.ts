import crypto from "crypto";
import { Writable } from "stream";

const ONE_MB_DATA = crypto.randomBytes(1024 * 1024);

export function write100MB(writeStream: Writable, callback: () => void) {
    let counter = 0;

    function write() {
        if (counter++ < 100) {
            writeStream.write(ONE_MB_DATA);
            setTimeout(write, 10);
        } else {
            callback();
        }
    }

    setTimeout(write, 10);
}
