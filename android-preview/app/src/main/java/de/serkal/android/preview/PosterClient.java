package de.serkal.android.preview;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/** Public TMDB images only; no API key or Google token is sent to the image host. */
final class PosterClient {
    static final int MAX_BYTES = 2 * 1024 * 1024;
    static boolean validPath(String path) {
        return path != null && path.matches("/[A-Za-z0-9_-]+\\.(jpg|png|webp)");
    }
    static byte[] readBounded(InputStream input) throws Exception {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192]; int count;
            while ((count = input.read(buffer)) != -1) {
                if (out.size() + count > MAX_BYTES) throw new Exception("POSTER_TOO_LARGE");
                out.write(buffer, 0, count);
            }
            return out.toByteArray();
        }
    }
    static byte[] load(String path) throws Exception {
        if (!validPath(path)) throw new Exception("POSTER_PATH_INVALID");
        HttpURLConnection connection = (HttpURLConnection) new URL("https://image.tmdb.org/t/p/w342" + path).openConnection();
        connection.setConnectTimeout(10000); connection.setReadTimeout(15000);
        connection.setInstanceFollowRedirects(false);
        try {
            if (connection.getResponseCode() != 200) throw new Exception("POSTER_UNAVAILABLE");
            if (connection.getContentLengthLong() > MAX_BYTES) throw new Exception("POSTER_TOO_LARGE");
            try (InputStream input = connection.getInputStream()) { return readBounded(input); }
        } finally { connection.disconnect(); }
    }
}
