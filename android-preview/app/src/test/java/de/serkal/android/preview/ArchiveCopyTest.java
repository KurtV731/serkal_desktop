package de.serkal.android.preview;
import org.junit.Test;
import org.json.*;
import java.util.*;
import static org.junit.Assert.*;

public class ArchiveCopyTest {
    JSONObject record() throws Exception {
        String text="S01; startOriginal=2026-10-12; dates=12.10.,19.10.; tmdb=42; eps=2; descDE=Deutsch; note=; manualFlags=4; futureField=keep%20me\n";
        return new JSONObject().put("schema",2).put("owner","123").put("revision","12345678-1234-1234-1234-123456789abc").put("parent","")
            .put("generatedAt","2026-10-14T12:00:00.000Z").put("calendar",new JSONObject().put("mode","google").put("id","existing"))
            .put("files",new JSONArray().put(new JSONObject().put("name","Serie (2026).txt").put("content",text).put("sha256",ArchiveCodec.hash(text))));
    }
    @Test public void fullBytesAndUnknownFieldsSurviveOffsetEdits() throws Exception {
        JSONObject r=record();ArchiveCodec.validate(r,"123");
        JSONObject p=new JSONObject().put("tmdbId",42).put("seasonLabel","S01").put("note","OffsetDE: +1D");
        JSONObject plus=ArchiveCodec.edit(r,"notes",p);assertEquals("2026-10-13",ArchiveCodec.entries(plus).getJSONObject(0).getJSONArray("dates").getString(0));
        assertTrue(plus.getJSONArray("files").getJSONObject(0).getString("content").contains("futureField=keep%20me"));
        JSONObject minus=ArchiveCodec.edit(plus,"notes",p.put("note","OffsetDE: -1D"));
        assertEquals("2026-10-11",ArchiveCodec.entries(minus).getJSONObject(0).getJSONArray("dates").getString(0));
        JSONObject reset=ArchiveCodec.edit(minus,"notes",p.put("note","normal note"));
        assertEquals("2026-10-12",ArchiveCodec.entries(reset).getJSONObject(0).getJSONArray("dates").getString(0));
        assertEquals(4,ArchiveCodec.entries(reset).getJSONObject(0).getInt("manualFlags")&4);
        assertTrue(r.getJSONArray("files").getJSONObject(0).getString("content").contains("note=;"));
    }
    @Test public void unrelatedFilesAreByteExact() throws Exception {
        JSONObject r=record();String text="S01; tmdb=99; startOriginal=2026-01-01\r\n\r\n";
        r.getJSONArray("files").put(new JSONObject().put("name","다른 Serie (2026).txt").put("content",text).put("sha256",ArchiveCodec.hash(text)));
        JSONObject changed=ArchiveCodec.edit(r,"notes",new JSONObject().put("tmdbId",42).put("seasonLabel","S01").put("note","Test"));
        assertEquals(text,changed.getJSONArray("files").getJSONObject(1).getString("content"));
    }
    @Test public void authoritySelectionChangesMetadataOnlyAndPreservesAhsokaBytes() throws Exception {
        JSONObject local=record();String ahsoka="S04; tmdb=321; seen=1; note=unchanged\n";
        local.getJSONArray("files").put(new JSONObject().put("name","Ahsoka (2023).txt").put("content",ahsoka).put("sha256",ArchiveCodec.hash(ahsoka)));
        JSONObject selected=ArchiveAuthority.select(local,"123","2026-10-23T18:00:00.000Z");
        assertEquals("",selected.getString("parent"));assertNotEquals(local.getString("revision"),selected.getString("revision"));
        assertEquals(selected.getString("revision"),selected.getString("authorityId"));
        assertEquals(local.getJSONArray("files").toString(),selected.getJSONArray("files").toString());
        assertEquals(ahsoka,selected.getJSONArray("files").getJSONObject(1).getString("content"));
    }
    @Test public void badHashPathAndWrongAccountAreRejected() throws Exception {
        JSONObject r=record();try{ArchiveCodec.validate(r,"other");fail();}catch(Exception expected){assertEquals("COPY_INVALID",expected.getMessage());}
        r.getJSONArray("files").getJSONObject(0).put("name","../settings.txt");try{ArchiveCodec.validate(r,"123");fail();}catch(Exception expected){assertEquals("COPY_INVALID",expected.getMessage());}
        assertFalse(ArchiveCodec.safeName("!!SERKAL_LOG_today.txt"));assertFalse(ArchiveCodec.safeName("C:\\secret.txt"));
    }
    JSONObject metadata(JSONObject r) throws Exception {JSONObject p=new JSONObject().put("owner","123").put("revision",r.getString("revision")).put("parent",r.getString("parent").isEmpty()?"root":r.getString("parent"));
        if(r.has("authorityId"))p.put("authorityId",r.getString("authorityId"));
        return new JSONObject().put("id",r.getString("revision")).put("name",ArchiveCodec.PREFIX+r.getString("revision")+".json").put("md5Checksum","same").put("appProperties",p);}
    @Test public void concurrentChildrenAreRetainedAndRejected() throws Exception {
        JSONObject a=record(),b=new JSONObject(a.toString()).put("parent",a.getString("revision")).put("revision",UUID.randomUUID().toString()),c=new JSONObject(b.toString()).put("revision",UUID.randomUUID().toString());
        assertEquals(b.getString("revision"),ArchiveCopyClient.head(Arrays.asList(metadata(a),metadata(b)),"123").getString("id"));
        try{ArchiveCopyClient.head(Arrays.asList(metadata(a),metadata(b),metadata(c)),"123");fail();}catch(Exception expected){assertEquals("COPY_CONFLICT",expected.getMessage());}
    }
    @Test public void authoritativeLineageMarkerIsRequiredOnEveryActiveRevision() throws Exception {
        JSONObject a=record().put("authorityId","aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        JSONObject b=new JSONObject(a.toString()).put("revision",UUID.randomUUID().toString()).put("parent",a.getString("revision"));
        assertEquals(b.getString("revision"),ArchiveCopyClient.head(Arrays.asList(metadata(a),metadata(b)),"123").getJSONObject("appProperties").getString("revision"));
        JSONObject child=new JSONObject(b.toString()).put("authorityId","");
        try{ArchiveCopyClient.head(Arrays.asList(metadata(a),metadata(child)),"123");fail();}catch(Exception expected){assertEquals("COPY_CONFLICT",expected.getMessage());}
    }
    @Test public void authorityIsAppliedOnceThenLocalEditsMaySync() {
        String authority="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
        assertTrue(AndroidArchiveCopy.shouldInstallAuthority("",authority));
        assertFalse(AndroidArchiveCopy.shouldInstallAuthority(authority,authority));
        assertFalse(AndroidArchiveCopy.shouldInstallAuthority(authority,""));
    }
    @Test public void groupedEpisodesHaveStableCalendarIdentity() throws Exception {
        JSONObject r=record();List<JSONObject> events=CalendarCopy.desired(r);assertEquals(2,events.size());
        JSONObject first=events.get(0);assertEquals("Serie (2026) S01E01",first.getString("summary"));
        assertEquals("2026-10-13",first.getJSONObject("end").getString("date"));
        assertEquals(first.getJSONObject("extendedProperties").getJSONObject("private").getString("serkalSignature"),CalendarCopy.signature(first));
        assertEquals(first.getString("id"),CalendarCopy.desired(new JSONObject(r.toString())).get(0).getString("id"));
    }
    @Test public void calendarUsesStoredLanguageInsteadOfGermanFileName()throws Exception{
        JSONObject r=record();JSONObject f=r.getJSONArray("files").getJSONObject(0);
        String text=f.getString("content").trim()+"; calendarLanguage=en; titleEN=Dark%20Matter\n";
        f.put("name","Dark Matter - Der Zeitenläufer (2026).txt").put("content",text).put("sha256",ArchiveCodec.hash(text));
        List<JSONObject> events=CalendarCopy.desired(r);assertFalse(events.isEmpty());
        for(JSONObject e:events){assertTrue(e.getString("summary").startsWith("Dark Matter (2026)"));assertFalse(e.getString("summary").contains("Zeitenläufer"));}
    }
}
