import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import OpenAI from 'openai';

@Injectable()
export class OpenAIService {
  private readonly openaiClient: OpenAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      throw new InternalServerErrorException('OPENAI_API_KEY is missing');
    }

    this.openaiClient = new OpenAI({
      apiKey,
    });
  }

  async generateTextCompletion(prompt: string): Promise<string> {
    const response = await this.openaiClient.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert SRE and incident analysis AI assistant.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
    });

    return response.choices[0]?.message?.content ?? 'No response generated';
  }
}
