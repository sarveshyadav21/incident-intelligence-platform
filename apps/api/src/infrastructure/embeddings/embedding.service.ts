import { Injectable, InternalServerErrorException } from '@nestjs/common';

type OllamaEmbeddingResponse = {
  embedding: number[];
};

@Injectable()
export class EmbeddingService {
  async generateEmbedding(text: string): Promise<number[]> {
    const response = await fetch('http://localhost:11434/api/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'nomic-embed-text',
        prompt: text,
      }),
    });

    if (!response.ok) {
      throw new InternalServerErrorException('Failed to generate embeddings');
    }

    const data = (await response.json()) as OllamaEmbeddingResponse;

    return data.embedding;
  }
}
