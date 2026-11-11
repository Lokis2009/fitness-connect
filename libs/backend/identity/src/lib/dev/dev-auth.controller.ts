import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Public } from '@fitness-connect/common';
import { DevAuthService } from './dev-auth.service';
// Value import on purpose: the validation pipe reads the class from decorator metadata.
import { DevLoginDto, type DevLoginResponseDto } from './dev-login.dto';

@Controller('dev')
export class DevAuthController {
  constructor(private readonly auth: DevAuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  login(@Body() body: DevLoginDto): Promise<DevLoginResponseDto> {
    return this.auth.login(body);
  }
}
