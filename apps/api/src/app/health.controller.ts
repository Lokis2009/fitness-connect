import { Controller, Get } from '@nestjs/common';
import { Public } from '@fitness-connect/common';
import type { components } from '@fitness-connect/api-contract';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  health(): components['schemas']['HealthStatus'] {
    throw new Error('not implemented');
  }
}
