import type { PrismaClient } from "@prisma/client";

/** Port DB — consumer chỉ phụ thuộc type này, không biết implementation. */
export type PrismaPort = PrismaClient;
