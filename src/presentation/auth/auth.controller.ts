import { AuthService } from "@app-application/auth";
import { ApiResult, rethrowError, StudentAuthGuard } from "@app-common";
import { ChiefLoginResult, StudentLoginResult } from "@app-type";
import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { LoginDto } from "./dto/login.dto";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** Đăng nhập sinh viên — trả student token (+ chief token nếu có quyền). */
  @Post("student/login")
  @ApiOperation({ summary: "Đăng nhập sinh viên — trả student token (+chief token nếu có quyền)" })
  async loginStudent(@Body() dto: LoginDto): Promise<ApiResult<StudentLoginResult>> {
    try {
      return new ApiResult("Đăng nhập thành công", await this.auth.login(dto.studentCode, dto.password));
    } catch (e) {
      rethrowError(e);
    }
  }

  /** Đăng nhập ban cán sự — chỉ trả chief token. */
  @Post("chief/login")
  @ApiOperation({ summary: "Đăng nhập ban cán sự — chỉ trả chief token" })
  async loginChief(@Body() dto: LoginDto): Promise<ApiResult<ChiefLoginResult>> {
    try {
      return new ApiResult("Đăng nhập thành công", await this.auth.loginChief(dto.studentCode, dto.password));
    } catch (e) {
      rethrowError(e);
    }
  }

  /** Kiểm tra student token còn hiệu lực. */
  @Get("check")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Kiểm tra student token còn hiệu lực" })
  @UseGuards(StudentAuthGuard)
  check(): ApiResult<null> {
    return new ApiResult("Thành công", null);
  }
}
