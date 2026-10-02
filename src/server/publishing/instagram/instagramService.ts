import { config } from '../../config/env';

const INSTAGRAM_ACCOUNT_ID = config.instagram.accountId;
const INSTAGRAM_ACCESS_TOKEN = config.instagram.accessToken;

export function getStatus() {
  const isConnected = Boolean(INSTAGRAM_ACCESS_TOKEN && INSTAGRAM_ACCOUNT_ID);
  return {
    connected: isConnected,
    accountId: INSTAGRAM_ACCOUNT_ID,
    accountName: 'D-MON Hockey',
    accountUsername: 'dmon_hockey',
    mode: isConnected ? 'live' : 'simulation',
    scopes: ['instagram_basic', 'instagram_content_publish', 'pages_show_list']
  };
}
