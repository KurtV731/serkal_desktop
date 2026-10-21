package de.serkal.android.preview;
import org.json.*;import org.junit.Test;import static org.junit.Assert.*;
public class TmdbTitleTest {
 @Test public void englishOriginalWinsOverFrenchAlias()throws Exception{
 JSONObject d=new JSONObject().put("original_language","en").put("original_name","The Testaments").put("name","Les Testaments");
 assertEquals("The Testaments",TmdbTitle.resolve(d,true));
 }
 @Test public void localizedAsianTitleAndExplicitTranslation()throws Exception{
 JSONObject d=new JSONObject().put("original_language","ko").put("original_name","한국").put("name","English title");
 assertEquals("English title",TmdbTitle.resolve(d,true));
 d.put("translations",new JSONObject().put("translations",new JSONArray().put(new JSONObject().put("iso_639_1","de").put("iso_3166_1","DE").put("data",new JSONObject().put("name","Deutscher Titel")))));
 assertEquals("Deutscher Titel",TmdbTitle.resolve(d,false));
 }
}
