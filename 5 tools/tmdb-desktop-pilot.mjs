import { createServer } from 'node:http';
const key = process.env.TMDB_API_KEY?.trim();
if (!key) throw new Error('TMDB_API_KEY fehlt.');
const routes = /^\/(?:configuration|search\/tv|tv\/[1-9]\d{0,9}(?:\/season\/(?:0|[1-9]\d{0,2})|\/watch\/providers)?)$/;
const filters = ['language', 'query', 'include_adult', 'page', 'first_air_date_year', 'year', 'append_to_response'];
const server = createServer(async (req, res) => {
    const reply = (status, value) => {
        res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        res.end(JSON.stringify(value));
    };
    try {
        const url = new URL(req.url, 'http://127.0.0.1');
        if (req.method !== 'GET' || !routes.test(url.pathname)) return reply(404, {});
        const target = new URL('https://api.themoviedb.org/3' + url.pathname);
        const headers = { accept: 'application/json' };
        if (/^[a-f0-9]{32}$/i.test(key)) target.searchParams.set('api_key', key);
        else headers.Authorization = 'Bearer ' + key;
        for (const name of filters) {
            const value = url.searchParams.get(name);
            if (value && value.length <= 160) target.searchParams.set(name, value);
        }
        const upstream = await fetch(target, { headers, signal: AbortSignal.timeout(8000), redirect: 'error' });
        if (!upstream.ok) return reply(upstream.status, { status_message: 'TMDB request failed.' });
        return reply(200, await upstream.json());
    } catch {
        return reply(502, { status_message: 'TMDB is unavailable.' });
    }
});
server.listen(8787, '127.0.0.1', () => console.log('TMDB pilot ready on 127.0.0.1:8787'));
