package de.serkal.android.preview;
import android.content.Context;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import org.json.JSONObject;
import java.security.KeyStore;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

final class KeyCache {
    private static SecretKey key() throws Exception {
        KeyStore store=KeyStore.getInstance("AndroidKeyStore"); store.load(null);
        String alias="serkal.tmdb.cache.v1";
        if(!store.containsAlias(alias)) {
            KeyGenerator generator=KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES,"AndroidKeyStore");
            generator.init(new KeyGenParameterSpec.Builder(alias,KeyProperties.PURPOSE_ENCRYPT|KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).build());
            generator.generateKey();
        }
        return (SecretKey)store.getKey(alias,null);
    }
    static void save(Context context, String owner, String credential) throws Exception {
        Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding"); cipher.init(Cipher.ENCRYPT_MODE,key());
        byte[] plain=new JSONObject().put("owner",owner).put("apiKey",credential).toString().getBytes("UTF-8");
        String value=Base64.encodeToString(cipher.getIV(),Base64.NO_WRAP)+":"+
            Base64.encodeToString(cipher.doFinal(plain),Base64.NO_WRAP);
        if(!context.getSharedPreferences("serkal_key_cache",Context.MODE_PRIVATE).edit().putString("encrypted",value).commit())
            throw new Exception("CACHE_SAVE_FAILED");
    }
    static String load(Context context, String owner) throws Exception {
        String value=context.getSharedPreferences("serkal_key_cache",Context.MODE_PRIVATE).getString("encrypted","");
        if(value.isEmpty())return "";
        String[] parts=value.split(":");
        Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE,key(),new GCMParameterSpec(128,Base64.decode(parts[0],Base64.NO_WRAP)));
        JSONObject plain=new JSONObject(new String(cipher.doFinal(Base64.decode(parts[1],Base64.NO_WRAP)),"UTF-8"));
        return owner.equals(plain.optString("owner")) ? plain.optString("apiKey") : "";
    }
}
