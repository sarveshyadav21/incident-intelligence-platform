import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { AgentEvent } from '../../modules/incidents/types/agent-event.type';
import { Socket, Server } from 'socket.io';

export type AnalysisJobStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'RETRYING'
  | 'COMPLETED'
  | 'FAILED';

@WebSocketGateway({
  cors: {
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  },
})
export class IncidentsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('join-incident')
  async handleJoinIncident(
    @MessageBody() incidentId: string,
    @ConnectedSocket() client: Socket,
  ) {
    await client.join(this.incidentRoom(incidentId));

    return { joined: incidentId };
  }

  @SubscribeMessage('leave-incident')
  async handleLeaveIncident(
    @MessageBody() incidentId: string,
    @ConnectedSocket() client: Socket,
  ) {
    await client.leave(this.incidentRoom(incidentId));

    return { left: incidentId };
  }

  emitAgentLifecycleEvent(incidentId: string, event: AgentEvent) {
    this.broadcast('agent.lifecycle', incidentId, {
      incidentId,
      ...event,
    });
  }

  emitJobProgress(
    jobId: string,
    stage: string,
    options?: { data?: unknown; incidentId?: string },
  ) {
    this.broadcast('incident-progress', options?.incidentId, {
      jobId,
      incidentId: options?.incidentId ?? null,
      stage,
      data: options?.data ?? null,
    });
  }

  emitJobStatus(jobId: string, status: AnalysisJobStatus, incidentId?: string) {
    this.broadcast('job-status', incidentId, {
      jobId,
      incidentId: incidentId ?? null,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  emitTimelineEvent(
    incidentId: string,
    jobId: string,
    event: {
      id: string;
      stage: string;
      createdAt: Date;
      metadata?: unknown;
    },
  ) {
    this.broadcast('timeline-event', incidentId, {
      incidentId,
      jobId,
      event: {
        id: event.id,
        stage: event.stage,
        createdAt: event.createdAt.toISOString(),
        metadata: event.metadata ?? null,
      },
    });
  }

  emitIncidentCompleted(jobId: string, result: unknown, incidentId?: string) {
    this.broadcast('incident-completed', incidentId, {
      jobId,
      incidentId: incidentId ?? null,
      result,
    });
  }

  handleConnection(client: Socket) {
    console.log(`Socket connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Socket disconnected: ${client.id}`);
  }

  emitAgentToken(
    incidentId: string,
    jobId: string,
    agent: string,
    token: string,
  ) {
    this.broadcast('agent-token', incidentId, {
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
    this.broadcast('agent-complete', incidentId, {
      incidentId,
      jobId,
      agent,
      content,
    });
  }

  private incidentRoom(incidentId: string) {
    return `incident:${incidentId}`;
  }

  private broadcast(
    event: string,
    incidentId: string | null | undefined,
    payload: unknown,
  ) {
    if (incidentId) {
      this.server.to(this.incidentRoom(incidentId)).emit(event, payload);
    }

    this.server.emit(event, payload);
  }
}
