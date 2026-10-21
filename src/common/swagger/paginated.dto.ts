import { ApiProperty } from "@nestjs/swagger";
import { PaginationMetaDto } from "./pagination-meta.dto";

/** Base cho schema data của list endpoint — extend + override `items` trong từng DTO. */
export class PaginatedDto {
  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
