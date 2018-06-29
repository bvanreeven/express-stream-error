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

        // TODO: archive.on("error", next);

        archive.pipe(res);

        const passThrough = new PassThrough();
        archive.append(passThrough, { name: "some-file.dat" });

        write100MB(passThrough, () => {
            passThrough.end(() => console.log("Done writing data!"));
        });

        archive.finalize();

        return res;
    }

}
