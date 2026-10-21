import { PRISMA_PORT } from "@app-contracts";
import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

@Global()
@Module({
  providers: [{ provide: PRISMA_PORT, useClass: PrismaService }],
  exports: [PRISMA_PORT],
})
export class PrismaModule {}
