"use strict";

// Keep the same rule identifier and fixtures in the Android implementation.
const RULES = "season-plan-1";
function validDate(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const timestamp = Date.parse(value + "T00:00:00Z");
    return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0,10) === value;
}
function evaluate(season = {}, metadata = {}) {
    const episodes = Array.isArray(season.episodes) ? season.episodes : [];
    const expected = Number(metadata.episode_count) || 0;
    const episodeCount = Math.max(episodes.length, expected);
    const ordered = episodes.slice().sort((a,b) => Number(a?.episode_number) - Number(b?.episode_number));
    const first = ordered.find(episode => Number(episode?.episode_number) === 1);
    const announcedStart = [season.air_date, metadata.air_date, first?.air_date].find(validDate) || "";
    // A single TMDB placeholder never proves a one-episode season.
    const complete = episodeCount > 1 && ordered.length === episodeCount &&
        ordered.every((episode,index) => Number(episode?.episode_number) === index + 1 && validDate(episode?.air_date));
    const episodeDates = complete ? ordered.map(episode => episode.air_date) : [];
    return {
        rules:RULES, episodeCount, complete, episodeDates,
        seasonStart:complete ? episodeDates[0] : announcedStart,
        announcementOnly:!complete, announcedStart,
        dateFlag:complete ? "" : "ANNOUNCED", placeholderStart:""
    };
}
module.exports = { RULES, validDate, evaluate };
