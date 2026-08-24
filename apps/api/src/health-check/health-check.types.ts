export type ServiceStatus = 'running' | 'down';

export interface HealthStatus {
  postgres: ServiceStatus;
  redis: ServiceStatus;
}
