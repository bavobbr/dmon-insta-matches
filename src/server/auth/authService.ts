import { config } from '../config/env';
import { ServiceError } from '../errors/ServiceError';

const APP_AUTH_USER = config.auth.username;
const APP_AUTH_PASSWORD = config.auth.password;
const AUTH_SECRET_TOKEN = config.auth.secret;

export function login(input: any) {
  const { username, password } = input || {};
  if (!APP_AUTH_USER || !APP_AUTH_PASSWORD) {
    throw new ServiceError(500, {
      error: 'Inloggegevens (APP_AUTH_USER / APP_AUTH_PASSWORD) ontbreken in de omgevingsvariabelen.'
    });
  }
  if (
    username &&
    password &&
    username.trim().toLowerCase() === APP_AUTH_USER.toLowerCase() &&
    password.trim() === APP_AUTH_PASSWORD
  ) {
    return {
      success: true,
      token: AUTH_SECRET_TOKEN,
      user: {
        username: APP_AUTH_USER,
        displayName: 'D-Mon Staff'
      }
    };
  }
  throw new ServiceError(401, {
    success: false,
    error: 'Onjuiste gebruikersnaam of wachtwoord. Neem contact op met het clubbestuur.'
  });
}

export function verify(authHeader?: string) {
  if (authHeader && authHeader.replace('Bearer ', '').trim() === AUTH_SECRET_TOKEN) {
    return {
      authenticated: true,
      user: { username: APP_AUTH_USER, displayName: 'D-Mon Staff' }
    };
  }
  throw new ServiceError(401, { authenticated: false });
}
