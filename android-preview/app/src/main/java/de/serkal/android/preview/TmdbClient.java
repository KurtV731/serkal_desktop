package de.serkal.android.preview;

import org.json.JSONArray;
import org.json.JSONObject;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.text.Normalizer;
import java.util.Locale;

/** Network calls must run off the UI thread. Credentials are never logged. */
class TmdbClient {
    private final String credential;
    TmdbClient(String credential) { this.credential = credential.trim(); }

    JSONObject get(String path, String parameters) throws Exception {
        String auth = credential.matches("[a-fA-F0-9]{32}")
            ? "&api_key=" + URLEncoder.encode(credential, "UTF-8") : "";
        HttpURLConnection connection = (HttpURLConnection) new URL(
            "https://api.themoviedb.org/3/" + path + "?" + parameters + auth).openConnection();
        connection.setConnectTimeout(10000);
        connection.setReadTimeout(15000);
        if (auth.isEmpty()) connection.setRequestProperty("Authorization", "Bearer " + credential);
        try {
            int status = connection.getResponseCode();
            if (status == 401 || status == 403) throw new Exception("KEY");
            if (status == 429) throw new Exception("RATE");
            if (status != 200) throw new Exception("HTTP " + status);
            try (InputStream in = connection.getInputStream(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                byte[] buffer = new byte[8192]; int count;
                while ((count = in.read(buffer)) != -1) out.write(buffer, 0, count);
                return new JSONObject(out.toString("UTF-8"));
            }
        } finally { connection.disconnect(); }
    }

    void validate() throws Exception { get("configuration", ""); }
    JSONObject details(int id, boolean english) throws Exception {
        return get("tv/" + id, "language=" + (english ? "en-US" : "de-DE"));
    }

    List<JSONObject> search(String query, boolean english) throws Exception {
        LinkedHashMap<Integer, JSONObject> unique = new LinkedHashMap<>();
        collect(query, english, unique);
        if (unique.size() <= 1 && query.trim().matches(".*\\s+.*"))
            collect(query.replaceAll("\\s+", ""), english, unique);
        List<JSONObject> results = new ArrayList<>(unique.values());
        final String normalized = normalize(query);
        results.sort((a, b) -> {
            int relevance = Integer.compare(rank(a, normalized), rank(b, normalized));
            if (relevance != 0) return relevance;
            int date = b.optString("first_air_date").compareTo(a.optString("first_air_date"));
            return date != 0 ? date : Double.compare(b.optDouble("popularity"), a.optDouble("popularity"));
        });
        return new ArrayList<>(results.subList(0, Math.min(6, results.size())));
    }

    private void collect(String query, boolean english, LinkedHashMap<Integer, JSONObject> unique) throws Exception {
        for (int page = 1; page <= 3; page++) {
            JSONObject response = get("search/tv", "language=" + (english ? "en-US" : "de-DE")
                + "&include_adult=false&query=" + URLEncoder.encode(query, "UTF-8") + "&page=" + page);
            JSONArray results = response.optJSONArray("results");
            if (results != null) for (int i = 0; i < results.length(); i++) {
                JSONObject entry = results.getJSONObject(i);
                int id = entry.optInt("id");
                if (id > 0) unique.put(id, entry);
            }
            if (page >= response.optInt("total_pages", 1)) break;
        }
    }

    static String normalize(String value) {
        return Normalizer.normalize(value, Normalizer.Form.NFKC).toLowerCase(Locale.ROOT).replaceAll("\\s+", "");
    }
    private static int rank(JSONObject entry, String query) {
        String name = normalize(entry.optString("name"));
        String original = normalize(entry.optString("original_name"));
        if (name.equals(query) || original.equals(query)) return 0;
        return name.startsWith(query) || original.startsWith(query) ? 1 : 2;
    }
}
