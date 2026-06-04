import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { mkdir, writeFile, unlink } from 'fs/promises';
import { join } from 'path';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { FileParserService } from './file-parser.service';
import { IncidentAccessService } from './incident-access.service';

const UPLOAD_DIR = join(process.cwd(), 'uploads');

@Injectable()
export class IncidentUploadService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly fileParserService: FileParserService,
    private readonly incidentAccessService: IncidentAccessService,
  ) {}

  async uploadFile(
    incidentId: string,
    file: Express.Multer.File,
    userId: string,
  ) {
    await this.incidentAccessService.assertOwner(incidentId, userId);

    if (!file?.buffer && !file?.path) {
      throw new BadRequestException('No file provided');
    }

    await mkdir(UPLOAD_DIR, { recursive: true });

    const storageKey = `${incidentId}/${Date.now()}-${file.originalname}`;
    const filePath = join(UPLOAD_DIR, storageKey);
    const buffer = file.buffer ?? (await import('fs/promises')).readFile(file.path);

    await writeFile(filePath, buffer);

    let parsedText: string | null = null;
    let status: 'PARSED' | 'FAILED' = 'PARSED';

    try {
      parsedText = this.fileParserService.parse(
        buffer,
        file.mimetype,
        file.originalname,
      );
    } catch {
      status = 'FAILED';
    }

    const upload = await this.prismaService.upload.create({
      data: {
        incidentId,
        fileName: file.originalname,
        mimeType: file.mimetype,
        storageKey,
        parsedText,
        status,
        fileSize: buffer.length,
        previewUrl: file.mimetype.startsWith('image/')
          ? `data:${file.mimetype};base64,${buffer.toString('base64')}`
          : null,
      },
    });

    return upload;
  }

  async listUploads(incidentId: string) {
    return this.prismaService.upload.findMany({
      where: { incidentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteUpload(incidentId: string, uploadId: string) {
    const upload = await this.prismaService.upload.findFirst({
      where: { id: uploadId, incidentId },
    });

    if (!upload) {
      throw new NotFoundException('Upload not found');
    }

    try {
      await unlink(join(UPLOAD_DIR, upload.storageKey));
    } catch {
      // file may already be removed
    }

    await this.prismaService.upload.delete({ where: { id: uploadId } });

    return { deleted: true };
  }

  async getCombinedUploadText(incidentId: string): Promise<string> {
    const uploads = await this.prismaService.upload.findMany({
      where: { incidentId, status: 'PARSED' },
    });

    return uploads
      .filter((upload) => upload.parsedText)
      .map(
        (upload) =>
          `--- Upload: ${upload.fileName} ---\n${upload.parsedText}`,
      )
      .join('\n\n');
  }
}
