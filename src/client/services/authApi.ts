export const authApi = {
  login(username: string, password: string): Promise<Response> {
    return fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.trim(), password: password.trim() }),
    });
  },
};
