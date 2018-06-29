import archiver from "archiver";
import { Request, Response } from "express";
import { Body, Controller, Delete, Get, Param, Post, Put, Req, Res } from "routing-controllers";
import { PassThrough } from "stream";
import { write100MB } from "./utils";

@Controller()
export class ZipController {

    @Get("/rc-zip100mb")
    public getZip100MB(@Req() req: Request, @Res() res: Response) {
        const archive = archiver("zip");

        archive.on("error", (err) => req.destroy(err));

        archive.pipe(res);

        const passThrough = new PassThrough();
        archive.append(passThrough, { name: "some-file.dat" });

        write100MB(passThrough, () => {
            passThrough.end(() => console.log("Done writing data!"));
        });

        archive.finalize();

        return res;
    }

    @Get("/rc-zip100mberror")
    public getZip100MBError(@Req() req: Request, @Res() res: Response) {
        const archive = archiver("zip");

        archive.on("error", (err) => {
            console.log("Error in ZIP stream:", err.message);
            // archive.abort();
            //req.abort();
            //res.connection.destroy(err);
            //res.end();
            req.destroy(err);
        });

        archive.pipe(res);

        const passThrough = new PassThrough();
        archive.append(passThrough, { name: "some-file.dat" });

        write100MB(passThrough, () => {
            passThrough.emit("error", new Error("OH NOES! ERROR IN SOME FILE STREAM!"));
        });

        archive.finalize();

        return res;
    }

}
