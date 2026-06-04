import { Injectable } from '@nestjs/common';

@Injectable()
export class FileParserService {
  parse(buffer: Buffer, mimeType: string, fileName: string): string {
    const lowerName = fileName.toLowerCase();

    if (mimeType.startsWith('image/')) {
      return `[Image upload: ${fileName}] — visual evidence attached for investigation context.`;
    }

    if (mimeType === 'application/pdf' || lowerName.endsWith('.pdf')) {
      const text = buffer.toString('utf-8');
      return text.length > 50
        ? text
        : `[PDF upload: ${fileName}] — document attached for investigation context.`;
    }

    const text = buffer.toString('utf-8');

    if (
      mimeType.includes('json') ||
      lowerName.endsWith('.json') ||
      lowerName.endsWith('.log') ||
      lowerName.endsWith('.txt') ||
      lowerName.endsWith('.csv')
    ) {
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
