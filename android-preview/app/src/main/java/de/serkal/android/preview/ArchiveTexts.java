package de.serkal.android.preview;

final class ArchiveTexts {
    static String text(boolean english,String key) {
        switch(key) {
            case "LOADING": return english ? "Loading archive…" : "Archiv wird geladen…";
            case "MISSING": return english ? "No archive snapshot yet. On Desktop tap TMDB · Google." : "Noch kein Archivstand. Am Desktop TMDB · Google drücken.";
            case "CONFLICT": return english ? "Several archive sources found. Nothing overwritten." : "Mehrere Archivquellen gefunden. Nichts überschrieben.";
            case "CONNECT": return english ? "Tap Google to connect again." : "Zum Verbinden erneut Google drücken.";
            case "FAILED": return english ? "Archive could not be loaded. Please retry." : "Archiv konnte nicht geladen werden. Bitte erneut versuchen.";
            case "INITIAL": return english ? "Connect Google to load your archive." : "Google verbinden, um dein Archiv zu laden.";
            case "SNAPSHOT": return english ? "Read-only Desktop snapshot · " : "Desktop-Archivstand · nur lesen · ";
            case "COUNT": return english ? " entries\nUpdated: " : " Einträge\nStand: ";
            case "EMPTY_ARCHIVE": return english ? "The Desktop archive is empty." : "Das Desktop-Archiv ist leer.";
            case "DESCRIPTION_FIELD": return english ? "descEN" : "descDE";
            case "EPISODES": return english ? " · Episodes: " : " · Folgen: ";
            case "DATES": return english ? "\n\nDates:\n" : "\n\nTermine:\n";
            case "NOTES": return english ? "\nNotes:\n" : "\nNotizen:\n";
            case "READ_ONLY": return english ? "Archive read-only in this preview" : "Archiv in dieser Vorschau nur lesen";
            case "RELOAD": return english ? "Reload archive" : "Archiv laden";
            default: throw new IllegalArgumentException(key);
        }
    }
}
