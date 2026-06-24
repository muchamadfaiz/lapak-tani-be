import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, Public, ResponseMessage } from '../../common';
import {
  LoginDto,
  RefreshTokenDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  ResendVerificationDto,
} from './dto';
import {
  LoginUseCase,
  RefreshTokenUseCase,
  LogoutUseCase,
  ChangePasswordUseCase,
  ForgotPasswordUseCase,
  ResetPasswordUseCase,
  VerifyEmailUseCase,
  ResendVerificationUseCase,
} from './use-cases';
import { FindUserByIdUseCase } from '../user/use-cases';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
    private readonly resendVerificationUseCase: ResendVerificationUseCase,
    private readonly findUserByIdUseCase: FindUserByIdUseCase,
  ) {}

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiResponse({ status: 200, description: 'Current user data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ResponseMessage('Success get profile')
  me(@CurrentUser('id') userId: string) {
    return this.findUserByIdUseCase.execute(userId);
  }

  // CATATAN KEAMANAN: endpoint publik `POST /auth/register` sengaja DINONAKTIFKAN
  // (dikomentari). Pembuatan akun petugas dilakukan ADMIN lewat menu "Kelola Staff"
  // (modul user). Pendaftaran mandiri terbuka = celah: orang asing bisa bikin akun
  // lalu membaca data warga. Untuk mengaktifkan lagi (TIDAK disarankan publik):
  // restore import `RegisterDto`, `RegisterUseCase`, injeksi `registerUseCase`,
  // dan beri proteksi role (mis. @Roles('ADMIN')) — jangan @Public.
  //
  // @Public()
  // @Throttle({ default: { limit: 3, ttl: 60_000 } })
  // @Post('register')
  // @ApiOperation({ summary: 'Register a new user account' })
  // @ApiResponse({ status: 201, description: 'User registered successfully' })
  // @ApiResponse({ status: 400, description: 'Email already exists or validation failed' })
  // @ResponseMessage('Success register')
  // register(@Body() dto: RegisterDto) {
  //   return this.registerUseCase.execute(dto);
  // }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } }) // anti brute-force: 5x/menit
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful, returns access and refresh tokens' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ResponseMessage('Success login')
  login(@Body() dto: LoginDto) {
    return this.loginUseCase.execute(dto);
  }

  @Public()
  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using a valid refresh token' })
  @ApiResponse({ status: 200, description: 'New access and refresh tokens issued' })
  @ApiResponse({ status: 403, description: 'Invalid, expired, or revoked refresh token' })
  @ResponseMessage('Success refresh token')
  refresh(
    @CurrentUser('id') userId: string,
    @CurrentUser('refreshToken') refreshToken: string,
    @Body() _dto: RefreshTokenDto,
  ) {
    return this.refreshTokenUseCase.execute({ userId, currentRefreshToken: refreshToken });
  }

  @ApiBearerAuth()
  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change own password (requires old password)' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Old password is incorrect' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ResponseMessage('Success change password')
  changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.changePasswordUseCase.execute({ userId, dto });
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset email' })
  @ApiResponse({ status: 200, description: 'If the email exists, a reset link will be sent' })
  @ResponseMessage('If your email is registered, you will receive a reset link')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.forgotPasswordUseCase.execute(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using token from email' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired reset token' })
  @ResponseMessage('Success reset password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.resetPasswordUseCase.execute(dto);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address using token from email' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired verification token' })
  @ResponseMessage('Email verified successfully')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.verifyEmailUseCase.execute(dto);
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend email verification link' })
  @ApiResponse({ status: 200, description: 'If the email exists and is not verified, a verification link will be sent' })
  @ResponseMessage('If your email is registered and not verified, you will receive a verification link')
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.resendVerificationUseCase.execute(dto);
  }

  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and revoke all refresh tokens' })
  @ApiResponse({ status: 200, description: 'All refresh tokens revoked' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ResponseMessage('Success logout')
  logout(@CurrentUser('id') userId: string) {
    return this.logoutUseCase.execute(userId);
  }
}
