import { applyDecorators, Type } from "@nestjs/common";
import { ApiExtraModels, ApiResponse, getSchemaPath } from "@nestjs/swagger";
import { PaginationMetaDto } from "./pagination-meta.dto";

export interface ApiDataResponseOptions {
  /** DTO class của `data` (hoặc item khi isArray/paginated). Bỏ trống = data: null */
  type?: Type<unknown>;
  isArray?: boolean;
  /** data = { items: T[], meta: PaginationMeta } */
  paginated?: boolean;
  /** data là primitive (boolean/string/number) — dùng khi không có DTO class */
  primitive?: "boolean" | "string" | "number";
  description?: string;
  status?: number;
}

/**
 * Mô tả response thành công theo envelope { error:false, message, data }.
 * Ví dụ: @ApiDataResponse({type: StudentDto, paginated: true})
 */
export function ApiDataResponse(opts: ApiDataResponseOptions = {}) {
  const data = opts.primitive
    ? { type: opts.primitive }
    : !opts.type
      ? { type: "object", nullable: true }
      : opts.paginated
        ? {
            type: "object",
            properties: {
              items: { type: "array", items: { $ref: getSchemaPath(opts.type) } },
              meta: { $ref: getSchemaPath(PaginationMetaDto) },
            },
          }
        : opts.isArray
          ? { type: "array", items: { $ref: getSchemaPath(opts.type) } }
          : { $ref: getSchemaPath(opts.type) };

  return applyDecorators(
    ApiExtraModels(PaginationMetaDto, ...(opts.type ? [opts.type] : [])),
    ApiResponse({
      status: opts.status ?? 200,
      description: opts.description,
      schema: {
        type: "object",
        properties: {
          error: { type: "boolean", example: false },
          message: { type: "string", example: "Thành công" },
          data,
        },
      },
    }),
  );
}
