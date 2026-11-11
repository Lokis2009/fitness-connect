import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Public } from '@fitness-connect/common';
import { DevAuthService } from './dev-auth.service';
import type { DevLoginDto, DevLoginResponseDto } from './dev-login.dto';

@Controller('dev')
export class DevAuthController {
  constructor(private readonly auth: DevAuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  login(@Body() body: DevLoginDto): Promise<DevLoginResponseDto> {
    void this.auth;
    void body;
    throw new Error('not implemented');
  }
}
