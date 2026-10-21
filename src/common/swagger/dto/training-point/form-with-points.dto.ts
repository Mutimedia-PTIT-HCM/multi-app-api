import { ApiProperty } from "@nestjs/swagger";
import { FormPointDto } from "./form-point.dto";

export class FormWithPointsDto {
  @ApiProperty()
  id: number;
  @ApiProperty({ nullable: true })
  orderNo: number | null;
  @ApiProperty()
  content: string;
  @ApiProperty({ nullable: true })
  maxPoint: number | null;
  @ApiProperty()
  type: string;
  @ApiProperty({ nullable: true })
  parentId: number | null;
  @ApiProperty({ type: [FormPointDto] })
  points: FormPointDto[];
}
