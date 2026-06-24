import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { TokenService } from './services/token.service';
import {
  RegisterUseCase,
  LoginUseCase,
  RefreshTokenUseCase,
  LogoutUseCase,
  ChangePasswordUseCase,
  ForgotPasswordUseCase,
  ResetPasswordUseCase,
  SendVerificationEmailUseCase,
  VerifyEmailUseCase,
  ResendVerificationUseCase,
} from './use-cases';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

@Module({
  imports: [PassportModule, JwtModule.register({}), UserModule],
  controllers: [AuthController],
  providers: [
    TokenService,
    RegisterUseCase,
    LoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    ChangePasswordUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
    SendVerificationEmailUseCase,
    VerifyEmailUseCase,
    ResendVerificationUseCase,
    JwtStrategy,
    JwtRefreshStrategy,
  ],
  exports: [TokenService],
})
export class AuthModule {}
