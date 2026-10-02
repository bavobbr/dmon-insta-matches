// Return Response so callers retain their existing status/JSON parsing behavior.
export const twizzitApi = {
  getMatches(startDate: string, endDate: string, force = false): Promise<Response> {
    return fetch(`/api/twizzit/matches?startDate=${startDate}&endDate=${endDate}${force ? '&force=true' : ''}`);
  },
  getStatus(): Promise<Response> { return fetch('/api/twizzit/status'); },
  clearCache(): Promise<Response> { return fetch('/api/twizzit/cache/clear', { method: 'POST' }); },
  updateDefaultTtl(ttlMinutes: number): Promise<Response> {
    return fetch('/api/twizzit/cache/ttl', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ttlMinutes }),
    });
  },
};
