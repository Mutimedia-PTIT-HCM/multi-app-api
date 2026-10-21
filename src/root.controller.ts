import { Controller, Get, Res } from "@nestjs/common";
import { Response } from "express";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

@Controller()
export class RootController {
  @Get("/")
  health() {
    return { status: "ok" };
  }

  @Get("/app-ads.txt")
  adsTxt(@Res() res: Response) {
    const file = join(process.cwd(), "legacy", "public", "ads", "app-ads.txt");
    if (existsSync(file)) {
      res.type("text/plain").send(readFileSync(file, "utf8"));
    } else {
      res.status(404).send("not found");
    }
  }
}
