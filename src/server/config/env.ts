import 'dotenv/config';
import path from 'path';

// Only this server module reads environment variables. Never import it into client code.
export const config = {
  get production() { return process.env.NODE_ENV === 'production'; },
  twizzit: {
    get username() { return process.env.TWIZZIT_USERNAME || ''; },
    get password() { return process.env.TWIZZIT_PASSWORD || ''; },
    get organizationId() { return process.env.TWIZZIT_ORG_ID || '32037'; },
  },
  instagram: {
    accountId: process.env.INSTAGRAM_ACCOUNT_ID || '',
    accessToken: process.env.INSTAGRAM_ACCESS_TOKEN || '',
  },
  auth: {
    username: process.env.APP_AUTH_USER || '',
    password: process.env.APP_AUTH_PASSWORD || '',
    secret: process.env.AUTH_SECRET_TOKEN || 'dmon_app_secure_session_token_authorized',
  },
  get baseUrl() { return process.env.APP_BASE_URL; },
  paths: {
    data: path.join(process.cwd(), 'data'),
    uploads: path.join(process.cwd(), 'public', 'uploads'),
    generated: path.join(process.cwd(), 'public', 'generated'),
    photos: path.join(process.cwd(), 'public', 'photos'),
    public: path.join(process.cwd(), 'public'),
    dist: path.join(process.cwd(), 'dist'),
  },
};

export function getTwizzitConfig() {
  return { username: config.twizzit.username, password: config.twizzit.password, orgId: config.twizzit.organizationId };
}
