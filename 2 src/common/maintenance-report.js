'use strict';
const { validDate, evaluate } = require('./season-policy');
function build(groups,snapshot,today=new Date().toISOString().slice(0,10)) {
    const items=[];
    for(const group of groups){
        const r=snapshot.get(String(group.tmdbId));if(!r || !r.ok)continue;
        const title=String(r.tv.name||group.entries[0].title||group.entries[0].titel||'');
        const existing=new Map(group.entries.map(e=>[Number(String(e.seasonLabel||e.staffelLabel).replace(/\D/g,'')),e]));
        const floor=Math.min(...[...existing.keys()].filter(n=>n>0));
        for(const [number,season] of Object.entries(r.seasons||{})){
            if(Number(number)<floor)continue;
            const entry=existing.get(Number(number)),data=season.data||{},episodes=data.episodes||[];
            const seasonDate=String(data.air_date||episodes.find(e=>Number(e.episode_number)===1)?.air_date||'');
            if(!entry && /^\d{4}-\d{2}-\d{2}$/.test(seasonDate) && seasonDate<=today)items.push({kind:'missing-season',tmdbId:group.tmdbId,title,season:Number(number),date:seasonDate,episodes:episodes.length});
            for(const ep of episodes){
                const date=String(ep.air_date||'');if(!/^\d{4}-\d{2}-\d{2}$/.test(date))continue;
                const episode = Number(ep.episode_number);
                const dates = entry?.datesOriginal || entry?.dates || [];
                const old = dates[episode - 1];
                const knownCount = Math.max(dates.length, Number(entry?.episoden || entry?.eps || 0));
                // The report is a change list, not a second copy of the calendar.
                if (entry && !entry.announcementOnly && episode > 0 && old !== date) {
                    items.push({kind:episode > knownCount ? 'new-episode' : old ? 'changed-episode' : 'dated-episode',
                        tmdbId:group.tmdbId,title,season:Number(number),episode,date,previousDate:old || ''});
                }
            }
        }
    }
    return items.sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999')||a.title.localeCompare(b.title)||a.season-b.season||(a.episode||0)-(b.episode||0));
}

function seasonNumber(entry) {
    return Number(String(entry.seasonLabel || entry.staffelLabel || '').replace(/\D/g, ''));
}

function outlook(group, record, today = new Date().toISOString().slice(0, 10)) {
    const tv = record?.ok ? record.tv || {} : {};
    const title = String(tv.name || group.entries[0].title || group.entries[0].titel || '');
    const archived = new Map(group.entries.map(entry => [seasonNumber(entry), entry]));
    const floor = Math.min(...archived.keys());
    const rows = new Map();
    function add(kind, season, date, episode = 0) {
        if (!Number.isInteger(season) || season < floor || season < 1) return;
        if (date && (!validDate(date) || date < today)) return;
        if (!date && kind !== 'season') return;
        rows.set([kind, season, episode].join(':'), {
            kind, tmdbId:group.tmdbId, title, season, episode, date
        });
    }

    for (const [season, entry] of archived) {
        if (entry.announcementOnly) {
            add('season', season, entry.start || '');
            continue;
        }
        (entry.activeDates || entry.dates || []).forEach((date, index) => {
            if (validDate(date)) add('episode', season, date, index + 1);
        });
    }
    for (const summary of tv.seasons || []) {
        const season = Number(summary.season_number);
        const entry = archived.get(season);
        const data = record.seasons?.[season]?.data || {};
        if (entry && !entry.announcementOnly) {
            if (entry.manualStart || entry.manualDates || entry.datesDE?.length) continue;
            for (const ep of data.episodes || []) {
                const episode = Number(ep.episode_number);
                if (episode > 0 && !entry.activeDates?.[episode - 1]) add('episode', season, ep.air_date, episode);
            }
            continue;
        }
        const plan = evaluate(data, summary);
        const saved = group.entries.flatMap(item => item.announcements || [])
            .find(item => Number(item.season) === season && validDate(item.date));
        add('season', season, entry?.startDE || ((entry?.manualStart || entry?.manualDates) ? entry.start : '') ||
            plan.announcedStart || saved?.date || entry?.start || '');
    }
    const next = tv.next_episode_to_air;
    if (next) {
        const season = Number(next.season_number);
        const episode = Number(next.episode_number);
        const entry = archived.get(season);
        if (!entry || entry.announcementOnly) {
            const key = 'season:' + season + ':0';
            if (episode === 1 && !rows.get(key)?.date && validDate(next.air_date)) add('season', season, next.air_date);
        } else if (episode > 0 && !entry.manualStart && !entry.manualDates && !entry.datesDE?.length) {
            add('episode', season, entry.activeDates?.[episode - 1] || next.air_date, episode);
        }
    }

    const latestRegular = Math.max(0, Number(tv.last_episode_to_air?.season_number || 0),
        ...group.entries.filter(entry => !entry.announcementOnly && !(entry.start >= today)).map(seasonNumber));
    const planned = [...rows.values()].some(item => item.season > latestRegular &&
        (item.kind === 'season' || archived.get(item.season)?.start >= today)) ||
        Number(next?.season_number || 0) > latestRegular ||
        (tv.seasons || []).some(item => Number(item.season_number) > latestRegular &&
            (!archived.has(Number(item.season_number)) || archived.get(Number(item.season_number)).announcementOnly) &&
            (!validDate(item.air_date) || item.air_date >= today));
    const status = ['Ended', 'Canceled'].includes(tv.status) ? 'ended' : planned ? 'planned' : 'unknown';
    return { status, rows:[...rows.values()] };
}

function markNew(rows, previous) {
    const key = row => [row.tmdbId, row.kind, row.season, row.episode].join(':');
    const known = new Map((previous || []).map(row => [key(row), row.date]));
    return rows.map(row => ({
        ...row, newlyAnnounced:Array.isArray(previous) &&
            (!known.has(key(row)) || Boolean(row.date && !known.get(key(row))))
    })).sort((a,b) => (a.date || '9999').localeCompare(b.date || '9999') ||
        a.title.localeCompare(b.title) || a.season - b.season || a.episode - b.episode);
}

module.exports = { build, outlook, markNew };
