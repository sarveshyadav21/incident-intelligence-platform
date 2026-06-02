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

  emitJobProgress(
    jobId: string,
    stage: string,
    options?: { data?: unknown; incidentId?: string },
  ) {
    this.server.emit('incident-progress', {
      jobId,
      incidentId: options?.incidentId ?? null,
      stage,
      data: options?.data ?? null,
    });
  }

  emitIncidentCompleted(
    jobId: string,
    result: unknown,
    incidentId?: string,
  ) {
    this.server.emit('incident-completed', {
      jobId,
      incidentId: incidentId ?? null,
      result,
    });
  }

  emitAgentToken(
    incidentId: string,
    jobId: string,
    agent: string,
    token: string,
  ) {
    this.server.emit('agent-token', {
      incidentId,
      jobId,
      agent,
      token,
    });
  }

  emitAgentComplete(
    incidentId: string,
    jobId: string,
    agent: string,
    content: string,
  ) {
    this.server.emit('agent-complete', {
      incidentId,
      jobId,
      agent,
      content,
    });
  }
}
