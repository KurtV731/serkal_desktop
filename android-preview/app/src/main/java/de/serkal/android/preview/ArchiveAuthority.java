package de.serkal.android.preview;

import org.json.JSONObject;
import java.util.UUID;

/** Creates a new archive root without changing any archived file bytes. */
final class ArchiveAuthority {
    private ArchiveAuthority() {}
    static JSONObject select(JSONObject local, String owner, String generatedAt) throws Exception {
        JSONObject chosen=new JSONObject(local.toString());
        chosen.put("revision",UUID.randomUUID().toString()).put("parent","").put("generatedAt",generatedAt);
        ArchiveCodec.validate(chosen,owner);
        if(!chosen.getJSONArray("files").toString().equals(local.getJSONArray("files").toString()))
            throw new Exception("COPY_INVALID");
        return chosen;
    }
}
