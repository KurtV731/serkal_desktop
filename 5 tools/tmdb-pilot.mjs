import { pathToFileURL } from 'node:url';
import { createServer } from 'node:http';

export function createTmdbPilot(apiKey, fetchTmdb = fetch) {
  if (!apiKey) throw new Error('TMDB_API_KEY is required');
  return createServer(async (req, res) => {
    const reply = (status, body) => {
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(body));
    };
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return reply(405, { error: 'method_not_allowed' });
    }
    const url = new URL(req.url, 'http://localhost');
    const language = url.searchParams.get('language') ?? 'de-DE';
    if (!['de-DE', 'en-US'].includes(language)) return reply(400, { error: 'invalid_language' });

    let path;
    const params = new URLSearchParams({ api_key: apiKey, language });
    if (url.pathname === '/search') {
      const query = url.searchParams.get('q')?.trim();
      if (!query || query.length > 120) return reply(400, { error: 'invalid_query' });
      path = '/search/tv';
      params.set('query', query);
    } else {
      const season = /^\/tv\/([1-9]\d{0,9})\/season\/(0|[1-9]\d{0,2})$/.exec(url.pathname);
      if (!season) return reply(404, { error: 'not_found' });
      path = url.pathname;
    }

    try {
      const upstream = await fetchTmdb('https://api.themoviedb.org/3' + path + '?' + params, {
        signal: AbortSignal.timeout(8000),
        redirect: 'error',
      });
      if (!upstream.ok) {
        if (upstream.status === 404) return reply(404, { error: 'not_found' });
        return reply(upstream.status === 429 ? 503 : 502, { error: 'tmdb_unavailable' });
      }
      const data = await upstream.json();
      if (path === '/search/tv') {
        return reply(200, { results: data.results.map(({ id, name, first_air_date }) => ({
          id, name, first_air_date,
        })) });
      }
      return reply(200, { episodes: data.episodes.map(({ episode_number, name, air_date }) => ({
        episode_number, name, air_date,
      })) });
    } catch {
      return reply(502, { error: 'tmdb_unavailable' });
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = createTmdbPilot(process.env.TMDB_API_KEY);
  server.listen(8787, '127.0.0.1', () => console.log('SerKal TMDB pilot: http://127.0.0.1:8787'));
}
