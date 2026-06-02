import { Controller, Get } from '@nestjs/common';
@Controller('health')
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
