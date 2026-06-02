import { Injectable } from '@nestjs/common';

import {
  incidentInputProfileSchema,
  IncidentInputProfile,
} from '../types/input-profile.type';

@Injectable()
export class IncidentInputNormalizerService {
  normalize(input: unknown): IncidentInputProfile {
    const warnings: string[] = [];
    const observedSignals: string[] = [];
    const parsed = this.tryParseJson(input);
    const normalizedLogs = this.stringifyInput(parsed.value);

    if (normalizedLogs.length < 10) {
      warnings.push('Input is very short; analysis confidence should be low.');
    }

    if (normalizedLogs.length > 15000) {
      warnings.push('Input was truncated to keep local LLM context stable.');
    }

    this.collectSignals(normalizedLogs, observedSignals);

    return incidentInputProfileSchema.parse({
      inputType: parsed.inputType,
      normalizedLogs: normalizedLogs.slice(0, 15000),
      observedSignals,
      warnings,
    });
  }

  private tryParseJson(input: unknown): {
    inputType: IncidentInputProfile['inputType'];
    value: unknown;
  } {
    if (typeof input !== 'string') {
      return {
        inputType: Array.isArray(input) ? 'json_array' : 'json',
        value: input,
      };
    }

    const trimmed = input.trim();

    if (!trimmed) {
      return {
        inputType: 'unknown',
        value: input,
      };
    }

    try {
      const parsed = JSON.parse(trimmed) as unknown;

      return {
        inputType: Array.isArray(parsed) ? 'json_array' : 'json',
        value: parsed,
      };
    } catch {
      return {
        inputType: 'plain_text',
        value: input,
      };
    }
  }

  private stringifyInput(input: unknown): string {
    if (typeof input === 'string') {
      return input.trim();
    }

    return JSON.stringify(input, null, 2);
  }

  private collectSignals(logs: string, signals: string[]) {
    const normalized = logs.toLowerCase();

    const signalChecks: Array<[string, string[]]> = [
      ['errors', ['error', 'exception', 'failed', 'failure', '500']],
      ['latency', ['latency', 'timeout', 'slow', 'p95', 'p99']],
      ['outage', ['outage', 'unavailable', 'down', 'degraded']],
      ['security', ['unauthorized', 'breach', 'token', 'exfiltration']],
      ['deployment', ['deploy', 'release', 'rollback', 'version']],
      ['resource_pressure', ['cpu', 'memory', 'disk', 'oom', 'saturation']],
    ];

    for (const [signal, keywords] of signalChecks) {
      if (keywords.some((keyword) => normalized.includes(keyword))) {
        signals.push(signal);
      }
    }
  }
}
