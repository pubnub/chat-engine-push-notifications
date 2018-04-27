package com.pubnub.cennotifications.helpers;

import javax.annotation.Nullable;
import java.util.List;
import java.util.Map;

import org.json.JSONArray;
import org.json.JSONObject;

import android.os.Bundle;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;

import static com.pubnub.cennotifications.helpers.CENNotificationsHelper.Loge;


/**
 * Entry point for objects serialization / deserialization methods.
 */
public class CENSerialization {

    /**
     * Serialize passed collection to JSON object.
     * Non-collection objects serialization will return 'null'.
     *
     * @param object Reference on object which should be serialized if possible.
     * @return JSON string for passed object data.
     */
    @Nullable
    public static String toJSONString(Object object) {
        if (object instanceof List || CENCollections.isJavaArray(object) || object instanceof JSONArray ||
            object instanceof ReadableArray) {
            JSONArray jsonArray = CENCollections.toJSONArray(object);

            if (jsonArray != null)
                return jsonArray.toString();
        } else if (object instanceof Map || object instanceof Bundle || object instanceof JSONObject ||
            object instanceof ReadableMap) {
            JSONObject jsonObject = CENCollections.toJSONObject(object);

            if (jsonObject != null)
                return jsonObject.toString();
        } else
            Loge("Unable to serialize passed object to JSON string.", null);

        return null;
    }

    @Nullable
    public static Object toObject(String json) {
        return toObject(json, true);
    }

    @Nullable
    public static Object toObject(String json, Boolean logException) {
        Object object = toJSONObject(json, logException);
        if (object != null)
            return CENCollections.mapFrom(object);

        object = toJSONArray(json, logException);
        if (object != null)
            return CENCollections.listFrom(object);
        else if (logException)
            Loge("Unable to de-serialize passed JSON string to object.", null);

        return null;
    }

    /**
     * Convert passed JSON string to JSONObject instance.
     *
     * @param json Reference on object representation JSON string.
     * @return JSONObject instance for passed JSON string or 'null' in case of de-serialization failure.
     */
    @Nullable
    private static JSONObject toJSONObject(String json) {
        return toJSONObject(json, true);
    }

    /**
     * Convert passed JSON string to JSONObject instance.
     *
     * @param json Reference on object representation JSON string.
     * @param logException Whether conversion error should be logged out.
     * @return JSONObject instance for passed JSON string or 'null' in case of de-serialization failure.
     */
    @Nullable
    private static JSONObject toJSONObject(String json, Boolean logException) {
        try {
            return new JSONObject(json);
        } catch (Exception exception) {
            if (logException)
                Loge("Unable to convert JSON string to JSONObject", exception);
            return null;
        }
    }

    /**
     * Convert passed JSON string to JSONArray instance.
     *
     * @param json Reference on array representation JSON string.
     * @return JSONArray instance for passed JSON string or 'null' in case of de-serialization failure.
     */
    @Nullable
    static JSONArray toJSONArray(String json) {
        return toJSONArray(json, true);
    }

    /**
     * Convert passed JSON string to JSONArray instance.
     *
     * @param json Reference on array representation JSON string.
     * @param logException Whether conversion error should be logged out.
     * @return JSONArray instance for passed JSON string or 'null' in case of de-serialization failure.
     */
    @Nullable
    static JSONArray toJSONArray(String json, Boolean logException) {
        try {
            return new JSONArray(json);
        } catch (Exception exception) {
            if (logException)
                Loge("Unable to convert JSON string to JSONArray", exception);
            return null;
        }
    }
}
