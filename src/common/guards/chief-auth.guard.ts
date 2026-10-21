import { Injectable } from "@nestjs/common";
import { createAuthGuard } from "./auth-guard.factory";

@Injectable()
export class ChiefAuthGuard extends createAuthGuard("chief") {}
