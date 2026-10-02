import { getTwizzitConfig } from '../config/env';
import { authenticate } from './twizzitClient';

// In-memory token cache for Twizzit
let twizzitTokenCache: {
  token: string;
  validTill: number;
} | null = null;

// Authenticate and get Bearer JWT
export async function getTwizzitToken(): Promise<string> {
  const nowUnix = Math.floor(Date.now() / 1000);
  if (twizzitTokenCache && twizzitTokenCache.validTill > nowUnix + 60) {
    return twizzitTokenCache.token;
  }

  const { username, password } = getTwizzitConfig();

  if (!username || !password) {
    throw new Error('Twizzit credentials (TWIZZIT_USERNAME of TWIZZIT_PASSWORD) ontbreken in de omgevingsvariabelen.');
  }

  const data = await authenticate(username, password);

  twizzitTokenCache = {
    token: data.token,
    validTill: data['valid-till'] || nowUnix + 1800
  };

  return data.token;
}
