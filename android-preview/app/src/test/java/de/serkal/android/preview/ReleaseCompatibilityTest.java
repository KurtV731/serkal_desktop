package de.serkal.android.preview;
import org.json.*;
import org.junit.Test;
import java.util.*;
import static org.junit.Assert.*;

public class ReleaseCompatibilityTest {
 @Test public void sharedNumberIsThirtyTwo(){assertEquals(32,ArchiveCodec.RELEASE);assertEquals("1.2.0-alpha.32",BuildConfig.VERSION_NAME);}
 @Test public void matchingAndLegacyRecordsAreAccepted()throws Exception{
  JSONObject r=new ArchiveCopyTest().record();ArchiveCodec.validate(r,"123");r.put("releaseNumber",30);ArchiveCodec.validate(r,"123");
  ArchiveCodec.assertRelease("32");
  r.put("releaseNumber",31);ArchiveCodec.validate(r,"123");
 }
 @Test public void otherReleasesCannotBeLoadedOrChosenAsAuthority()throws Exception{
  for(int version:new int[]{0,33}){
   JSONObject r=new ArchiveCopyTest().record().put("releaseNumber",version);
   try{ArchiveCodec.validate(r,"123");fail();}catch(Exception expected){assertEquals("COPY_VERSION_MISMATCH",expected.getMessage());}
   try{ArchiveAuthority.select(r,"123","2026-10-25T00:00:00Z");fail();}catch(Exception expected){assertEquals("COPY_VERSION_MISMATCH",expected.getMessage());}
   JSONObject meta=new ArchiveCopyTest().metadata(r);meta.getJSONObject("appProperties").put("releaseNumber",String.valueOf(version));
   try{ArchiveCopyClient.head(Arrays.asList(meta),"123");fail();}catch(Exception expected){assertEquals("COPY_VERSION_MISMATCH",expected.getMessage());}
  }
 }
 @Test public void authorityOfLegacyRecordGetsReleaseThirtyTwoWithoutChangingFiles()throws Exception{
  JSONObject r=new ArchiveCopyTest().record(),selected=ArchiveAuthority.select(r,"123","2026-10-25T00:00:00Z");
  assertEquals(32,selected.getInt("releaseNumber"));assertEquals(r.getJSONArray("files").toString(),selected.getJSONArray("files").toString());
 }
 @Test public void uploadRejectsMismatchedVersionBeforeNetwork()throws Exception{
  final int[] writes={0};ArchiveCopyClient client=new ArchiveCopyClient("test"){@Override JSONObject request(String u,String m,String b,String t)throws Exception{writes[0]++;return new JSONObject().put("id","unused");}};
  try{client.upload(new ArchiveCopyTest().record().put("releaseNumber",33));fail();}catch(Exception e){assertEquals("COPY_VERSION_MISMATCH",e.getMessage());}
  assertEquals(0,writes[0]);
 }
}
