'use strict';

const ROOT = 'https://www.serienjunkies.de';
const LISTS = { V:'verlaengert', A:'abgesetzt' };
const months = 'Januar Februar März April Mai Juni Juli August September Oktober November Dezember'.split(' ');
const entities = { amp:'&', quot:'"', apos:"'", nbsp:' ', lt:'<', gt:'>', auml:'ä', ouml:'ö', uuml:'ü',
    Auml:'Ä', Ouml:'Ö', Uuml:'Ü', szlig:'ß', ndash:'–', mdash:'—', rsquo:'’', lsquo:'‘' };
const { validDate } = require('./season-policy');

function text(html) {
    return html.replace(/<[^>]*>/g,' ').replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi,(entity,key) => {
        if (key[0] !== '#') return entities[key] ?? entity;
        const code = /^#x/i.test(key) ? parseInt(key.slice(2),16) : Number(key.slice(1));
        return code <= 0x10ffff ? String.fromCodePoint(code) : entity;
    }).replace(/\s+/g,' ').trim();
}

function titleKey(title) {
    return String(title || '').normalize('NFKC').toLowerCase()
        .replace(/[’‘]/g,"'").replace(/[–—]/g,'-').replace(/\s+/g,' ').trim();
}

function parse(html, code, year) {
    const heading = code === 'V' ? 'Verlängerte Serien' : 'Abgesetzte Serien';
    if (!text(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '').startsWith(heading)) {
        throw new Error('Unexpected list heading');
    }
    const records = [];
    for (const row of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
        const main = row[1].match(/<strong\b[^>]*>[\s\S]*?<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/strong>\s*<p\b[^>]*>([\s\S]*?)<\/p>/i);
        if (!main || !/^\/[a-z\d-]+\/$/i.test(main[1])) continue;
        const dateParts = text(main[3]).match(/\b(\d{1,2})\.\s+(\p{L}+)\s+(\d{4})\s+wurde bekannt/iu);
        const month = dateParts ? months.indexOf(dateParts[2]) + 1 : 0;
        if (!month || Number(dateParts[3]) !== year) continue;
        const date = [year,String(month).padStart(2,'0'),dateParts[1].padStart(2,'0')].join('-');
        if (!validDate(date)) continue;
        const news = main[3].match(/href="(\/news\/[a-z\d/_%-]+\.html)"/i)?.[1];
        records.push({ code,date,title:text(main[2]),series:main[1].toLowerCase(),
            url:ROOT + (news || '/serien/' + LISTS[code] + '/' + year + '.html') });
    }
    if (!records.length && !/\bvon 0 Serien\b|\b(?:über|von) 0 Serien\b/.test(text(html))) {
        throw new Error('No dated entries could be read');
    }
    return records;
}

function match(entries, records) {
    const owners = new Map();
    const namesBySeries = new Map();
    const identity = entry => entry.tmdbId ? 'tmdb:' + entry.tmdbId : 'file:' + entry.fileName;
    for (const entry of entries) {
        const id = identity(entry);
        if (!namesBySeries.has(id)) namesBySeries.set(id,new Set());
        for (const key of [entry.title,entry.titel,entry.titleDE,entry.titleEN].map(titleKey).filter(Boolean)) {
            namesBySeries.get(id).add(key);
            if (!owners.has(key)) owners.set(key,new Set());
            owners.get(key).add(id);
        }
    }
    const index = new Map();
    for (const record of records) {
        const key = titleKey(record.title);
        if (!index.has(key)) index.set(key,[]);
        index.get(key).push(record);
    }
    return entries.map(entry => {
        const hits = [...namesBySeries.get(identity(entry))].filter(key => owners.get(key).size === 1)
            .flatMap(key => index.get(key) || [])
            .filter(hit => !Number(entry.year || entry.jahr) || Number(hit.date.slice(0,4)) >= Number(entry.year || entry.jahr));
        const slugs = new Set(hits.map(hit => hit.series));
        if (slugs.size !== 1) return null;
        hits.sort((a,b) => b.date.localeCompare(a.date));
        const latest = hits[0];
        if (hits.some(hit => hit.date === latest.date && hit.code !== latest.code)) return null;
        return { code:latest.code,date:latest.date,url:latest.url };
    });
}

async function scan(fetchPage, endYear = new Date().getFullYear(), progress = () => {}) {
    const records = [];
    const errors = [];
    let checked = 0;
    for (let year = endYear; year >= 2008; year--) {
        for (const [code,list] of Object.entries(LISTS)) {
            const url = ROOT + '/serien/' + list + '/' + year + '.html';
            try {
                records.push(...parse(await fetchPage(url),code,year));
            } catch (_) {
                errors.push(url);
            }
            progress(++checked,(endYear - 2007) * 2);
        }
    }
    return { records, errors, checked };
}

module.exports = { parse, match, scan };
