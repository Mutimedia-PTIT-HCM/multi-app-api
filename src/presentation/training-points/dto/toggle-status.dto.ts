import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean } from "class-validator";
import { toBool } from "./to-bool";

export class ToggleStatusDto {
  @ApiProperty({ example: true, description: "Mở/khoá chấm điểm cho lớp" })
  @Transform(toBool)
  @IsBoolean()
  isOpen!: boolean;
}
