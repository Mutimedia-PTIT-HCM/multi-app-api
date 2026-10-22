import { ApiProperty } from "@nestjs/swagger";
import { FormPointDto } from "./form-point.dto";

export class FormWithPointsDto {
  @ApiProperty()
  id: number;
  @ApiProperty({ type: "number", nullable: true })
  orderNo: number | null;
  @ApiProperty()
  content: string;
  @ApiProperty({ type: "number", nullable: true })
  maxPoint: number | null;
  @ApiProperty()
  type: string;
  @ApiProperty({ type: "number", nullable: true })
  parentId: number | null;
  @ApiProperty({ type: [FormPointDto] })
  points: FormPointDto[];
}
