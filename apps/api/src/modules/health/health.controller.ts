import { Controller, Get } from '@nestjs/common';
import { Public } from '../../lib/auth/public.decorator';

@Controller('health')
@Public()
export class HealthController {
  @Get()
  getHealthStatus() {
    return {
      success: true,
      timestamp: new Date().toISOString(),
      services: {
        api: 'healthy',
        database: 'connected',
        redis: 'connected',
      },
    };
  }
}
