import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ZodSchema } from 'zod';

import { parseJsonResponse } from '../../common/utils/parse-json-response.util';

type StreamTokenCallback = (token: string) => void;

@Injectable()
export class LLMService {
  async generateTextCompletion(prompt: string): Promise<string> {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3:8b',
        prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new InternalServerErrorException(
        'Failed to communicate with Ollama',
      );
    }

    type OllamaResponse = {
      response: string;
    };

    const data: OllamaResponse = (await response.json()) as OllamaResponse;

    return data.response;
  }

  async generateTextCompletionStream(
    prompt: string,
    onToken: StreamTokenCallback,
  ): Promise<string> {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3:8b',
        prompt,
        stream: true,
      }),
    });

    if (!response.ok || !response.body) {
      throw new InternalServerErrorException(
        'Failed to communicate with Ollama',
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.trim()) {
          continue;
        }

        try {
          const chunk = JSON.parse(line) as { response?: string; done?: boolean };
          const token = chunk.response ?? '';

          if (token) {
            fullText += token;
            onToken(token);
          }
        } catch {
          // skip malformed stream chunks
        }
      }
    }

    return fullText.trim();
  }

  async generateJsonCompletion<T>(
    prompt: string,
    schema: ZodSchema<T>,
  ): Promise<T> {
    const response = await this.generateTextCompletion(prompt);

    try {
      return parseJsonResponse(response, schema);
    } catch {
      const repairResponse = await this.generateTextCompletion(`
The previous response was invalid.

Return ONLY valid JSON matching the requested schema.
Do not include markdown, commentary, or extra text.

Original task:
${prompt}
`);

      return parseJsonResponse(repairResponse, schema);
    }
  }
}
