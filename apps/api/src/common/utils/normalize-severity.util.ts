import { Severity } from '../../modules/incidents/types/severity.type';

export function normalizeSeverity(response: string): Severity {
  const normalized = response.toUpperCase();

  if (normalized.includes('CRITICAL')) {
    return 'CRITICAL';
  }

  if (normalized.includes('HIGH')) {
    return 'HIGH';
  }

  if (normalized.includes('MEDIUM')) {
    return 'MEDIUM';
  }

  return 'LOW';
}
