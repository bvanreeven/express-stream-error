import "reflect-metadata";

import archiver from "archiver";
import express, { NextFunction, Request, Response } from "express";
import { useExpressServer } from "routing-controllers";
import { PassThrough } from "stream";
import { write100MB } from "./utils";
import { ZipController } from "./ZipController";

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

    write100MB(passThrough, () => {
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

    write100MB(passThrough, () => {
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

useExpressServer(app, {
    controllers: [ZipController],
});

app.use(errorHandler);

app.listen(3000, () => console.log("Example app listening on port 3000!"));
