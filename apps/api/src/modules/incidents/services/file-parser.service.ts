import { Injectable } from '@nestjs/common';

@Injectable()
export class FileParserService {
  parse(buffer: Buffer, mimeType: string, fileName: string): string {
    const text = buffer.toString('utf-8');

    if (mimeType.includes('json') || fileName.endsWith('.json')) {
      try {
        const parsed = JSON.parse(text) as unknown;
        return JSON.stringify(parsed, null, 2);
      } catch {
        return text;
      }
    }

    return text;
  }
}
