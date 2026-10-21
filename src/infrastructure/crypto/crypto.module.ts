import { CREDENTIAL_CIPHER_PORT } from "@app-contracts";
import { Global, Module } from "@nestjs/common";
import { CredentialCipherService } from "./credential-cipher.service";

@Global()
@Module({
  providers: [{ provide: CREDENTIAL_CIPHER_PORT, useClass: CredentialCipherService }],
  exports: [CREDENTIAL_CIPHER_PORT],
})
export class CryptoModule {}
