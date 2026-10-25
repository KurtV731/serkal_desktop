package de.serkal.android.preview;

import org.json.JSONObject;
import java.util.UUID;

/** Creates a new archive root without changing any archived file bytes. */
final class ArchiveAuthority {
    private ArchiveAuthority() {}
    static JSONObject select(JSONObject local, String owner, String generatedAt) throws Exception {
        return select(local,owner,generatedAt,UUID.randomUUID().toString());
    }
    static JSONObject select(JSONObject local, String owner, String generatedAt, String revision) throws Exception {
        ArchiveCodec.assertRelease(local.opt("releaseNumber"));
        JSONObject chosen=new JSONObject(local.toString()).put("releaseNumber",ArchiveCodec.RELEASE);
        chosen.put("revision",revision).put("parent","").put("generatedAt",generatedAt);
        chosen.put("authorityId",chosen.getString("revision"));
        ArchiveCodec.validate(chosen,owner);
        if(!chosen.getJSONArray("files").toString().equals(local.getJSONArray("files").toString()))
            throw new Exception("COPY_INVALID");
        return chosen;
    }
}
