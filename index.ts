import archiver from "archiver";
import crypto from "crypto";
import express, { NextFunction, Request, Response } from "express";
import { PassThrough, Writable } from "stream";

const ONE_MB_DATA = crypto.randomBytes(1024 * 1024);

const app = express();

const requestLogger = function (req: Request, res: Response, next: NextFunction) {
    console.log(`${req.method} ${req.url}`);
    next();
};

const errorHandler = function (err: any, req: Request, res: Response, next: NextFunction) {
    console.log("Custom error handler:", err.message);
    if (res.headersSent) {
        console.log("Headers already sent, calling next");
        return next(err);
    }
    res.status(500);
    res.send("ERROR: " + err.message);
};

function writeData(writeStream: Writable, callback: () => void) {
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

app.use(requestLogger);

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.get("/zip100mb", (req, res, next) => {
    const archive = archiver("zip");

    archive.on("error", next);

    archive.pipe(res);

    const passThrough = new PassThrough();
    archive.append(passThrough, { name: "some-file.dat" });

    writeData(passThrough, () => {
        passThrough.end(() => console.log("Done writing data!"));
    });

    archive.finalize();
});

app.get("/zip100mberror", (req, res, next) => {
    const archive = archiver("zip");

    archive.on("error", next);

    archive.pipe(res);

    const passThrough = new PassThrough();
    archive.append(passThrough, { name: "some-file.dat" });

    writeData(passThrough, () => {
        passThrough.emit("error", new Error("OH NOES! ERROR IN SOME FILE STREAM!"));
    });

    archive.finalize();
});

app.get("/ziperror", (req, res, next) => {
    const archive = archiver("zip");

    archive.on("error", next);

    archive.pipe(res);

    const passThrough = new PassThrough();
    archive.append(passThrough, { name: "some-file.dat" });

    setTimeout(() => passThrough.emit("error", new Error("OH NOES! ERROR IN SOME FILE STREAM!")), 10);

    archive.finalize();
});

app.get("/error", () => {
    throw new Error("KA-BOOM!");
});

app.use(errorHandler);

app.listen(3000, () => console.log("Example app listening on port 3000!"));
