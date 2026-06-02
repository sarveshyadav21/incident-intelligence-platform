import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';

import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
  },
})
export class IncidentsGateway {
  @WebSocketServer()
  server: Server;

  emitJobProgress(jobId: string, stage: string, data?: unknown) {
    this.server.emit('incident-progress', {
      jobId,
      stage,
      data: data ?? null,
    });
  }
  emitIncidentCompleted(jobId: string, result: unknown) {
    this.server.emit('incident-completed', {
      jobId,
      result,
    });
  }
}
