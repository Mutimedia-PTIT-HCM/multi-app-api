import { AuthService } from "@app-application/auth";
import { ApiResult, StudentAuthGuard } from "@app-common";
import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { LoginDto } from "./dto/login.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** Đăng nhập sinh viên — trả student token (+ chief token nếu có quyền). */
  @Post("student/login")
  async loginStudent(@Body() dto: LoginDto) {
    return new ApiResult("Đăng nhập thành công", await this.auth.login(dto.studentCode, dto.password));
  }

  /** Đăng nhập ban cán sự — chỉ trả chief token. */
  @Post("chief/login")
  async loginChief(@Body() dto: LoginDto) {
    return new ApiResult("Đăng nhập thành công", await this.auth.loginChief(dto.studentCode, dto.password));
  }

  /** Kiểm tra student token còn hiệu lực. */
  @Get("check")
  @UseGuards(StudentAuthGuard)
  check() {
    return new ApiResult("Thành công", null);
  }
}
