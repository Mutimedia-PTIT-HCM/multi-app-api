import { getSchemaPath, OpenAPIObject } from "@nestjs/swagger";
import { ErrorResponseDto } from "./error-response.dto";

const ERROR_SCHEMA = { $ref: getSchemaPath(ErrorResponseDto) };

/**
 * Gắn error envelope { error:true, code, message, data:null } vào "default"
 * response của MỌI operation trong swagger document — gọi sau createDocument.
 */
export function registerErrorResponses(document: OpenAPIObject): void {
  for (const path of Object.values(document.paths ?? {})) {
    for (const operation of Object.values(path)) {
      if (typeof operation === "object" && "responses" in operation) {
        operation.responses.default = {
          description: "Lỗi — envelope chuẩn (xem `code` để map message phía client)",
          content: { "application/json": { schema: ERROR_SCHEMA } },
        };
      }
    }
  }
}
