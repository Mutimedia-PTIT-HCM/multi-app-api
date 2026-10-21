import {
  ApiDataResponse,
  ApiResult,
  ChiefLoginResultDto,
  rethrowError,
  StudentAuthGuard,
  StudentLoginResultDto,
} from "@app-common";
import { AUTH_PORT, IAuthService } from "@app-contracts";
import { ChiefLoginResult, StudentLoginResult } from "@app-type";
import { Body, Controller, Get, Inject, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { LoginDto } from "./dto";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(@Inject(AUTH_PORT) private readonly auth: IAuthService) {}

  /** Đăng nhập sinh viên — trả student token (+ chief token nếu có quyền). */
  @Post("student/login")
  @ApiOperation({ summary: "Đăng nhập sinh viên — trả student token (+chief token nếu có quyền)" })
  @ApiDataResponse({ type: StudentLoginResultDto })
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
  @ApiDataResponse({ type: ChiefLoginResultDto })
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
  @ApiDataResponse()
  check(): ApiResult<null> {
    return new ApiResult("Thành công", null);
  }
}
