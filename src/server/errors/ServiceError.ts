// Expected service failures retain the existing API status and body.
export class ServiceError extends Error {
  constructor(public readonly status: number, public readonly body: Record<string, unknown>) {
    super(String(body.error || 'Service error'));
  }
}
