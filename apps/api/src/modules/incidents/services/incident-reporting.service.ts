import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { ExecutiveSummaryAgent } from '../agents/executive-summary.agent';
import { PostmortemAgent } from '../agents/postmortem.agent';
import { DependencyGraphAgent } from '../agents/dependency-graph.agent';
import { TimelineService } from '../timeline/incident-timeline.service';

@Injectable()
export class IncidentReportingService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly executiveSummaryAgent: ExecutiveSummaryAgent,
    private readonly postmortemAgent: PostmortemAgent,
    private readonly dependencyGraphAgent: DependencyGraphAgent,
    private readonly timelineService: TimelineService,
  ) {}

  async generateReportsForIncident(
    incidentId: string,
    analysisRunId?: string,
    jobId?: string,
  ) {
    const incident = await this.prismaService.incident.findUnique({
      where: { id: incidentId },
    });

    if (!incident) {
      return null;
    }

    const remediationSteps = Array.isArray(incident.remediationSteps)
      ? (incident.remediationSteps as string[])
      : [];

    const timeline = jobId
      ? await this.timelineService.getTimelineByJobId(jobId)
      : [];

    const timelineText = timeline
      .map((event) => `${event.createdAt}: ${event.stage}`)
      .join('\n');

    const [executive, postmortem, graph] = await Promise.all([
      this.executiveSummaryAgent.generate({
        title: incident.title,
        severity: incident.aiSeverity ?? incident.severity,
        aiSummary: incident.aiSummary ?? '',
        rootCause: incident.rootCause ?? '',
        impactAssessment: incident.impactAssessment ?? '',
        remediationSteps,
        affectedServices: incident.affectedServices,
      }),
      this.postmortemAgent.generate({
        title: incident.title,
        severity: incident.aiSeverity ?? incident.severity,
        timelineText,
        aiSummary: incident.aiSummary ?? '',
        rootCause: incident.rootCause ?? '',
        impactAssessment: incident.impactAssessment ?? '',
        remediationSteps,
      }),
      this.dependencyGraphAgent.generate({
        logs: incident.summary ?? '',
        affectedServices: incident.affectedServices,
        rootCause: incident.rootCause ?? '',
        impactAssessment: incident.impactAssessment ?? '',
      }),
    ]);

    const executiveSummary = await this.saveExecutiveSummary(
      incidentId,
      analysisRunId,
      executive,
    );

    const postmortemRecord = await this.savePostmortem(
      incidentId,
      analysisRunId,
      postmortem,
    );

    const dependencyGraph = await this.saveDependencyGraph(
      incidentId,
      analysisRunId,
      graph,
    );

    return {
      executiveSummary,
      postmortem: postmortemRecord,
      dependencyGraph,
    };
  }

  async getExecutiveSummary(incidentId: string) {
    return this.prismaService.executiveSummary.findFirst({
      where: { incidentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPostmortem(incidentId: string) {
    return this.prismaService.postmortem.findFirst({
      where: { incidentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDependencyGraph(incidentId: string) {
    return this.prismaService.dependencyGraph.findFirst({
      where: { incidentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async saveExecutiveSummary(
    incidentId: string,
    analysisRunId: string | undefined,
    executive: {
      overview: string;
      customerImpact: string;
      rootCause: string;
      actionsTaken: string;
      followUps: string;
    },
  ) {
    const data = {
      overview: executive.overview,
      customerImpact: executive.customerImpact,
      rootCause: executive.rootCause,
      actionsTaken: executive.actionsTaken,
      followUps: executive.followUps,
      fullContent: executive,
    };

    if (analysisRunId) {
      const existing = await this.prismaService.executiveSummary.findUnique({
        where: { analysisRunId },
      });

      if (existing) {
        return this.prismaService.executiveSummary.update({
          where: { id: existing.id },
          data,
        });
      }
    }

    return this.prismaService.executiveSummary.create({
      data: { incidentId, analysisRunId, ...data },
    });
  }

  private async savePostmortem(
    incidentId: string,
    analysisRunId: string | undefined,
    postmortem: { markdown: string; sections: object },
  ) {
    if (analysisRunId) {
      const existing = await this.prismaService.postmortem.findUnique({
        where: { analysisRunId },
      });

      if (existing) {
        return this.prismaService.postmortem.update({
          where: { id: existing.id },
          data: {
            markdown: postmortem.markdown,
            sections: postmortem.sections,
          },
        });
      }
    }

    return this.prismaService.postmortem.create({
      data: {
        incidentId,
        analysisRunId,
        markdown: postmortem.markdown,
        sections: postmortem.sections,
      },
    });
  }

  private async saveDependencyGraph(
    incidentId: string,
    analysisRunId: string | undefined,
    graph: { nodes: object; edges: object },
  ) {
    if (analysisRunId) {
      const existing = await this.prismaService.dependencyGraph.findUnique({
        where: { analysisRunId },
      });

      if (existing) {
        return this.prismaService.dependencyGraph.update({
          where: { id: existing.id },
          data: { nodes: graph.nodes, edges: graph.edges },
        });
      }
    }

    return this.prismaService.dependencyGraph.create({
      data: {
        incidentId,
        analysisRunId,
        nodes: graph.nodes,
        edges: graph.edges,
      },
    });
  }
}
