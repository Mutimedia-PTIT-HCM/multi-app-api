import { Controller, Get, Res } from "@nestjs/common";
import { ApiExcludeEndpoint } from "@nestjs/swagger";
import { Response } from "express";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

@Controller()
export class RootController {
  @Get("/")
  @ApiExcludeEndpoint()
  health() {
    return { status: "ok" };
  }

  @Get("/app-ads.txt")
  @ApiExcludeEndpoint()
  adsTxt(@Res() res: Response) {
    const file = join(process.cwd(), "public", "ads", "app-ads.txt");
    if (existsSync(file)) {
      res.type("text/plain").send(readFileSync(file, "utf8"));
    } else {
      res.status(404).send("not found");
    }
  }
}
