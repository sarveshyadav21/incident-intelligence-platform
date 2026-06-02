import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './modules/health/health.module';
import { validateEnvironment } from './config/env.validation';
import { AppLoggerModule } from './infrastructure/logger/logger.module';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { IncidentsModule } from './modules/incidents/incidents.module';
import { LLMModule } from './infrastructure/llm/llm.module';
import { EmbeddingModule } from './infrastructure/embeddings/embedding.module';
import { QueueModule } from './infrastructure/queue/queue.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),

    AppLoggerModule,

    PrismaModule,

    HealthModule,
    IncidentsModule,
    LLMModule,
    EmbeddingModule,
    QueueModule,
  ],
})
export class AppModule {}
