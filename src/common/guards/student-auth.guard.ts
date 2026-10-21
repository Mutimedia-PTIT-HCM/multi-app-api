import { Injectable } from "@nestjs/common";
import { createAuthGuard } from "./auth-guard.factory";

@Injectable()
export class StudentAuthGuard extends createAuthGuard("student") {}
