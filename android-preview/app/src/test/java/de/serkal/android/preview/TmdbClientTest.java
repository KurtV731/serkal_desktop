package de.serkal.android.preview;
import org.junit.Test;
import org.json.JSONObject;
import java.util.List;
import java.util.ArrayList;
import static org.junit.Assert.*;

public class TmdbClientTest {
    static class FakeClient extends TmdbClient {
        final List<String> requests = new ArrayList<>();
        final String response;
        FakeClient(String response) { super("unused"); this.response = response; }
        @Override JSONObject get(String path, String parameters) throws Exception {
            requests.add(parameters);
            return new JSONObject(response);
        }
    }
    @Test public void exactTitlePrecedesNewerUnrelatedTitleAndDuplicatesCollapse() throws Exception {
        FakeClient client = new FakeClient("{\"total_pages\":1,\"results\":["
            + "{\"id\":1,\"name\":\"Yellowstone\",\"first_air_date\":\"2018-01-01\"},"
            + "{\"id\":2,\"name\":\"Yellow Submarine\",\"first_air_date\":\"2025-01-01\"},"
            + "{\"id\":1,\"name\":\"Yellowstone\",\"first_air_date\":\"2018-01-01\"}]}");
        List<JSONObject> result = client.search("Yellowstone", false);
        assertEquals(2, result.size()); assertEquals(1, result.get(0).getInt("id"));
        assertTrue(client.requests.get(0).contains("language=de-DE"));
    }
    @Test public void prefixMatchesOrderedByDateAndEnglishRequested() throws Exception {
        FakeClient client = new FakeClient("{\"total_pages\":1,\"results\":["
            + "{\"id\":1,\"name\":\"Star Trek old\",\"first_air_date\":\"1966-01-01\"},"
            + "{\"id\":2,\"name\":\"Star Trek new\",\"first_air_date\":\"2025-01-01\"}]}");
        assertEquals(2, client.search("Star Trek", true).get(0).getInt("id"));
        assertTrue(client.requests.get(0).contains("language=en-US"));
    }
    @Test public void scarceMultiwordResultsTriggerCompactedQuery() throws Exception {
        FakeClient client = new FakeClient("{\"total_pages\":1,\"results\":[]}");
        client.search("Star Wars", false);
        assertEquals(2, client.requests.size());
        assertTrue(client.requests.get(1).contains("query=StarWars"));
    }
    @Test public void fetchesAtMostThreePagesAndSixSuggestions() throws Exception {
        FakeClient client = new FakeClient("{\"total_pages\":99,\"results\":["
            + "{\"id\":1},{\"id\":2},{\"id\":3},{\"id\":4},{\"id\":5},{\"id\":6},{\"id\":7}]}");
        assertEquals(6, client.search("abc", false).size());
        assertEquals(3, client.requests.size());
    }
    @Test public void whitespaceAndCompatibilityNormalization() {
        assertEquals("starwars", TmdbClient.normalize(" ＳＴＡＲ  WARS "));
    }
}

