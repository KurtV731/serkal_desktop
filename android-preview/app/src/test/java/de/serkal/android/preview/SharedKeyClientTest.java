package de.serkal.android.preview;
import org.junit.Test;
import org.json.JSONObject;
import java.util.Arrays;
import java.util.Collections;
import static org.junit.Assert.*;
public class SharedKeyClientTest {
    private JSONObject record(String owner,String key) throws Exception {
        return new JSONObject().put("schema",1).put("owner",owner).put("apiKey",key);
    }
    @Test public void sameAccountDuplicatesCollapse() throws Exception {
        assertEquals("key",SharedKeyClient.resolve(Arrays.asList(record("A","key"),record("A","key")),"A"));
    }
    @Test public void noRecordMeansMissing() throws Exception {
        assertEquals("",SharedKeyClient.resolve(Collections.emptyList(),"A"));
    }
    @Test public void otherAccountRejected() throws Exception {
        try {SharedKeyClient.resolve(Arrays.asList(record("B","key")),"A");fail();}
        catch(Exception e){assertEquals("SHARED_KEY_INVALID",e.getMessage());}
    }
    @Test public void conflictingCredentialsNotChosenArbitrarily() throws Exception {
        try {SharedKeyClient.resolve(Arrays.asList(record("A","one"),record("A","two")),"A");fail();}
        catch(Exception e){assertEquals("SHARED_KEY_CONFLICT",e.getMessage());}
    }
    @Test public void emptyOrWrongSchemaRejected() throws Exception {
        try {SharedKeyClient.resolve(Arrays.asList(record("A","")),"A");fail();}
        catch(Exception e){assertEquals("SHARED_KEY_INVALID",e.getMessage());}
        try {SharedKeyClient.resolve(Arrays.asList(record("A","key").put("schema",2)),"A");fail();}
        catch(Exception e){assertEquals("SHARED_KEY_INVALID",e.getMessage());}
    }
}
