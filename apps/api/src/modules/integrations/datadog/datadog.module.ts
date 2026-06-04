import { Module } from '@nestjs/common';

import { IncidentsModule } from '../../incidents/incidents.module';

import { DatadogController } from './datadog.controller';

@Module({
  imports: [IncidentsModule],
  controllers: [DatadogController],
})
export class DatadogModule {}
