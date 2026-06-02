import { Module } from '@nestjs/common';

import { IncidentsGateway } from './incidents.gateway';

@Module({
  providers: [IncidentsGateway],

  exports: [IncidentsGateway],
})
export class WebsocketModule {}
