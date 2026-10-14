package de.serkal.android.preview;

import org.junit.Test;
import java.io.ByteArrayInputStream;
import static org.junit.Assert.*;

public class PosterClientTest {
    @Test public void onlyTmdbFilePathsAreAccepted() {
        assertTrue(PosterClient.validPath("/abc123_X-y.jpg"));
        assertFalse(PosterClient.validPath("https://example.org/a.jpg"));
        assertFalse(PosterClient.validPath("/../secret.jpg"));
        assertFalse(PosterClient.validPath("/a.jpg?api_key=secret"));
        assertFalse(PosterClient.validPath("null"));
    }
    @Test public void incompleteOrSmallStreamsAreReturnedExactly() throws Exception {
        byte[] bytes={1,2,3,4};
        assertArrayEquals(bytes,PosterClient.readBounded(new ByteArrayInputStream(bytes)));
    }
    @Test public void oversizedImageIsRejectedBeforeDecoding() throws Exception {
        try {
            PosterClient.readBounded(new ByteArrayInputStream(new byte[PosterClient.MAX_BYTES+1]));
            fail("Unbounded image must not be accepted");
        } catch(Exception expected) { assertEquals("POSTER_TOO_LARGE",expected.getMessage()); }
    }
}
