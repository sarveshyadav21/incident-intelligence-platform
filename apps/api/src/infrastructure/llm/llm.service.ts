import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ZodSchema } from 'zod';

import { parseJsonResponse } from '../../common/utils/parse-json-response.util';

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
