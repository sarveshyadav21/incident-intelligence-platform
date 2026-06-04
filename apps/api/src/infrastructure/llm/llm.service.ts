import {
  Injectable,
  InternalServerErrorException,
  RequestTimeoutException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ZodSchema } from 'zod';

import { parseJsonResponse } from '../../common/utils/parse-json-response.util';

type StreamTokenCallback = (token: string) => void;

@Injectable()
export class LLMService {
  private readonly defaultTimeoutMs: number;

  constructor(private readonly configService: ConfigService) {
    const timeout = this.configService.get<number>('LLM_TIMEOUT_MS');

    console.log('LLM_TIMEOUT_MS =', timeout);

    this.defaultTimeoutMs = timeout ?? 300_000;
  }

  async generateTextCompletion(
    prompt: string,
    model = 'llama3:8b',
    timeoutMs = this.defaultTimeoutMs,
  ): Promise<string> {
    console.log('Model:', model);
    console.log('Timeout:', timeoutMs);
    const response = await this.fetchOllama(
      {
        model,
        prompt,
        stream: false,
      },
      timeoutMs,
    );

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
    model = 'llama3:8b',
    timeoutMs = this.defaultTimeoutMs,
  ): Promise<string> {
    const response = await this.fetchOllama(
      {
        model,
        prompt,
        stream: true,
      },
      timeoutMs,
    );

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
          const chunk = JSON.parse(line) as {
            response?: string;
            done?: boolean;
          };
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
    model = 'llama3:8b',
    timeoutMs = this.defaultTimeoutMs,
  ): Promise<T> {
    const response = await this.generateTextCompletion(
      prompt,
      model,
      timeoutMs,
    );

    try {
      return parseJsonResponse(response, schema);
    } catch {
      const repairResponse = await this.generateTextCompletion(
        `
The previous response was invalid.

Return ONLY valid JSON matching the requested schema.
Do not include markdown, commentary, or extra text.

Original task:
${prompt}
`,
        model,
        timeoutMs,
      );

      return parseJsonResponse(repairResponse, schema);
    }
  }

  private async fetchOllama(
    body: object,
    timeoutMs: number,
  ): Promise<Response> {
    try {
      return await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError') {
        throw new RequestTimeoutException(
          `Ollama request timed out after ${timeoutMs}ms`,
        );
      }

      throw error;
    }
  }
}
