export async function authenticate(username: string, password: string) {
  const response = await fetch('https://app.twizzit.com/v2/api/authenticate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      username,
      password
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Twizzit authentication failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  if (!data.token) {
    throw new Error('No token returned from Twizzit authentication');
  }

  return data;
}

export async function fetchSeasons(token: string, orgId: string) {
  const seasonsRes = await fetch(`https://app.twizzit.com/v2/api/seasons?organization-ids[]=${orgId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return seasonsRes.json();
}

export async function fetchEvents(token: string, orgId: string, startDate: string, endDate: string) {
  const url = new URL('https://app.twizzit.com/v2/api/events');
  url.searchParams.append('organization-ids[]', orgId);
  url.searchParams.append('start-date', startDate);
  url.searchParams.append('end-date', endDate);
  url.searchParams.append('limit', '150');
  const eventsRes = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!eventsRes.ok) {
    const errText = await eventsRes.text();
    throw new Error(`Twizzit Events API error (${eventsRes.status}): ${errText}`);
  }
  const rawEvents: import('./types').TwizzitEvent[] = await eventsRes.json();
  if (!Array.isArray(rawEvents)) {
    throw new Error('Unexpected response format from Twizzit events API');
  }
  return rawEvents;
}
