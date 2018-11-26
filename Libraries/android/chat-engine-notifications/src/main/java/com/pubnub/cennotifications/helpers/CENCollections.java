package com.pubnub.cennotifications.helpers;

import android.os.Bundle;
import com.facebook.react.bridge.*;
import org.json.JSONArray;
import org.json.JSONObject;

import javax.annotation.Nullable;
import java.util.*;

import static com.pubnub.cennotifications.helpers.CENNotificationsHelper.Loge;


/**
 * Entry point for collections conversion and data manipulation methods.
 */
public class CENCollections {

    /////////////////////////////////////////////////////////////////////////////////////////////////
    // Bundle
    /////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Convert passed key/value collection to Bundle instance.
     *
     * @param object Reference on key/value collection of different data type which should be converted to Bundle.
     * @return Bundle instance with values from passed key/value collection or 'null' if object can't be converted.
     */
    @Nullable
    public static Bundle bundleFrom(Object object) {
        Bundle bundle = null;
        if (object instanceof Bundle) {
            bundle = new Bundle();
            for (String key : ((Bundle) object).keySet()) {
                Object value = getFromBundle((Bundle) object, key);

                if (value != null)
                    putToBundle(bundle, key, value);
            }
        } else if (object instanceof Map) {
            bundle = new Bundle();

            for (Object key : ((Map) object).keySet())
                putToBundle(bundle, (String) key, ((Map) object).get(key));
        } else if (object instanceof JSONObject) {
            bundle = new Bundle();
            Iterator<String> iterator = ((JSONObject) object).keys();

            while (iterator.hasNext()) {
                String key = iterator.next();

                try {
                    Object value = ((JSONObject) object).get(key);

                    putToBundle(bundle, key, value);
                } catch (Exception exception) {
                    Loge("Unable to get value for " + key + " from JSONObject.", exception);
                }
            }
        }
        else if (object instanceof ReadableMap)
            bundle = bundleFrom(((ReadableMap) object).toHashMap());
        else
            Loge("Unable to convert passed object to Bundle.", null);

        return bundle;
    }

    /**
     * Put non-collection objects as-is and serialize collections before putting them into Bundle.
     *
     * @param bundle Reference on Bundle instance inside of which data should be stored.
     * @param key Reference on key under which data should be stored.
     * @param value Reference on value which should be stored inside of passed Bundle.
     */
    public static void putToBundle(Bundle bundle, String key, Object value) {
        if (value instanceof List || isJavaArray(value) || value instanceof Map || value instanceof Bundle ||
            value instanceof JSONArray || value instanceof JSONObject || value instanceof ReadableArray ||
            value instanceof ReadableMap) {
            String serializedCollection = CENSerialization.toJSONString(value);

            if (serializedCollection != null)
                bundle.putString(key, serializedCollection);
        } else if (value instanceof String)
            bundle.putString(key, (String) value);
        else if (value instanceof Number) {
            if (value instanceof Integer)
                bundle.putInt(key, (Integer) value);
            else if (value instanceof Long)
                bundle.putLong(key, (Long) value);
            else
                bundle.putDouble(key, ((Number) value).doubleValue());
        } else if (value instanceof Boolean)
                bundle.putBoolean(key, (Boolean) value);
        else
            Loge("Attempt to store unsupported object under '" + key + "' key into Bundle", null);
    }

    /**
     * Retrieve value from Bundle and for Strings try to de-serialize in case if it was collection object.
     *
     * @param bundle Reference on bundle from which data should be retrieved.
     * @param key Reference on key which should be used to access data.
     * @return Reference on value which has been received from passed Bundle.
     */
    @Nullable
    public static Object getFromBundle(Bundle bundle, String key) {
        if (bundle.containsKey(key)) {
            Object value = bundle.get(key);

            switch (value.getClass().getName()) {
                case "java.lang.String":
                    Object collection = CENSerialization.toObject((String) value, false);

                    if (collection != null)
                        value = collection;
                    break;
            }
            return value;
        }

        return null;
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////
    // Map
    /////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Convert passed key/value collection to HashMap.
     *
     * @param object Reference on collection object which should be converted to HashMap.
     * @return HashMap created from another key/value collection data type.
     */
    @SuppressWarnings("unchecked")
    @Nullable
    public static Map<String, Object> mapFrom(Object object) {
        Map<String, Object> map = new HashMap<>();

        if (object instanceof Map)
            for (Object key : ((Map) object).keySet())
                putToMap(map, (String) key, ((Map) object).get(key), true);
        else if (object instanceof Bundle) {
            for (String key : ((Bundle) object).keySet()) {
                Object value = getFromBundle((Bundle) object, key);

                if (value != null)
                    putToMap(map, key, value, true);
            }
        } else if (object instanceof JSONObject) {
            Iterator<String> iterator = ((JSONObject) object).keys();

            while (iterator.hasNext()) {
                String key = iterator.next();

                try {
                    putToMap(map, key, ((JSONObject) object).get(key), true);
                } catch (Exception exception) {
                    Loge("Unable to get value for " + key + " from JSONObject.", exception);
                }
            }
        } else if (object instanceof ReadableMap) {
            Map value = ((ReadableMap) object).toHashMap();

            if (value != null)
                map.putAll(value);
        } else {
            map = null;
            Loge("Unable convert passed object to Map.", null);
        }

        return map;
    }

    /**
     * Put value into Map and if required, convert it to plain collection objects if required.
     *
     * @param map Reference on Map instance inside of which data should be stored.
     * @param key Reference on key under which data should be stored.
     * @param value Reference on value which should be stored inside of passed Map.
     */
    public static void putToMap(Map<String, Object> map, String key, Object value) {
        putToMap(map, key, value, false);
    }

    /**
     * Put value into Map and if required, convert it to plain collection objects if required.
     *
     * @param map Reference on Map instance inside of which data should be stored.
     * @param key Reference on key under which data should be stored.
     * @param value Reference on value which should be stored inside of passed Map.
     * @param deSerializeString Whether should try to de-serialize string values to values which may be serialized to
     *                          JSON string.
     */
    public static void putToMap(Map<String, Object> map, String key, Object value, Boolean deSerializeString) {
        if (value instanceof JSONObject || value instanceof Bundle || value instanceof ReadableMap)
            value = mapFrom(value);
        else if (isJavaArray(value) || value instanceof JSONArray || value instanceof ReadableArray)
            value = listFrom(value);
        else if (value instanceof String && deSerializeString) {
            Object objectFromString = CENSerialization.toObject((String) value, false);
            if (objectFromString != null) {
                putToMap(map, key, objectFromString, true);
                return;
            }
        }

        if (value != null)
            map.put(key, value);
    }

    /**
     * Retrieve value stores at specified key with fallback to default value.
     *
     * @param map Reference on Map instance from which data should be retrieved.
     * @param key Reference on key which should be used to access requested data.
     * @param defaultValue Reference on value which should be assigned to returned value if no value found.
     * @return Value stored in Map or default value.
     */
    public static Object getFromMap(Map map, String key, Object defaultValue) {
        Object value = defaultValue;
        if (map.containsKey(key))
            value = map.get(key);

        return value;
    }


    /////////////////////////////////////////////////////////////////////////////////////////////////
    // List
    /////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Convert passed list collection to List instance.
     *
     * @param object Reference on collection object which should be converted to List.
     * @return List created from another collection data type.
     */
    @SuppressWarnings("unchecked")
    @Nullable
    public static List<Object> listFrom(Object object) {
        List<Object> list = new ArrayList<>();

        if (object instanceof List)
            for (Object value : (List) object)
                putToList(list, value, true);
        else if (object instanceof JSONArray) {
            for (int entryIdx = 0; entryIdx < ((JSONArray) object).length(); entryIdx++) {
                try {
                    putToList(list, ((JSONArray) object).get(entryIdx), true);
                } catch (Exception exception) {
                    Loge("Unable to get value at index " + entryIdx + " from JSONArray.", exception);
                }
            }
        } else if (object instanceof ReadableArray) {
            List value = ((ReadableArray) object).toArrayList();

            if (value != null)
                list.addAll(value);
        } else if (isJavaArray(object)) {
            //noinspection ManualArrayToCollectionCopy
            for (int entryIdx = 0; entryIdx < ((Object[]) object).length; entryIdx++) {
                //noinspection UseBulkOperation
                putToList(list, ((Object[]) object)[entryIdx], true);
            }
        } else {
            list = null;
            Loge("Unable to convert passed object to List.", null);
        }

        return list;
    }

    /**
     * Put value into List and if required, convert it to plain collection objects if required.
     *
     * @param list Reference on List instance inside of which data should be stored.
     * @param value Reference on value which should be stored inside of passed List.
     */
    public static void putToList(List<Object> list, Object value) {
        putToList(list, value, false);
    }

    /**
     * Put value into List and if required, convert it to plain collection objects if required.
     *
     * @param list Reference on List instance inside of which data should be stored.
     * @param value Reference on value which should be stored inside of passed List.
     * @param deSerializeString Whether should try to de-serialize string values to values which may be serialized to
     *                          JSON string.
     */
    public static void putToList(List<Object> list, Object value, Boolean deSerializeString) {
        if (value instanceof JSONObject || value instanceof Bundle || value instanceof ReadableMap)
            value = mapFrom(value);
        else if (value instanceof JSONArray || isJavaArray(value) || value instanceof ReadableArray)
            value = listFrom(value);
        else if (value instanceof String && deSerializeString) {
            Object objectFromString = CENSerialization.toObject((String) value, false);
            if (objectFromString != null) {
                putToList(list, objectFromString, true);
                return;
            }
        }

        if (value != null)
            list.add(value);
    }


    /////////////////////////////////////////////////////////////////////////////////////////////////
    // React Native collections
    /////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Convert passed collection object to React Native collection instance (WritableMap or WritableArray).
     *
     * @param object Reference on which should be converted to Bundle.
     * @return React Native collection instance or 'null' if object can't be converted.
     */
    @Nullable
    public static Object rnCollectionFrom(Object object) {
        if (object instanceof Map || object instanceof Bundle || object instanceof JSONObject ||
            object instanceof ReadableMap)
            return writableMapFrom(object);
        else if (object instanceof List || isJavaArray(object) || object instanceof JSONArray ||
            object instanceof ReadableArray)
            return writableArrayFrom(object);
        else if (object != null)
            Loge("Unable to convert passed object to one of WritableMap or WritableArray.", null);

        return null;
    }

    /**
     * Convert passed key/value collection to WritableMap instance.
     *
     * @param object Reference on key/value collection of different data type which should be converted to WritableMap.
     * @return WritableMap instance with values from passed key/value collection or 'null' if object can't be converted.
     */
    @SuppressWarnings("unchecked")
    @Nullable
    public static WritableMap writableMapFrom(Object object) {
        WritableMap writableMap = null;

        if (object instanceof ReadableMap)
            writableMap = (WritableMap) object;
        else if (object instanceof Map) {
            writableMap = Arguments.createMap();

            for (Object key : ((Map) object).keySet())
                putToWritableMap(writableMap, (String) key, ((Map) object).get(key));
        } else if (object instanceof Bundle) {
            writableMap = Arguments.createMap();

            for (String key : ((Bundle) object).keySet())
                putToWritableMap(writableMap, key, ((Bundle) object).get(key));
        } else if (object instanceof JSONObject) {
            writableMap = Arguments.createMap();
            Iterator<String> iterator = ((JSONObject) object).keys();

            while (iterator.hasNext()) {
                String key = iterator.next();

                try {
                    putToWritableMap(writableMap, key, ((JSONObject) object).get(key));
                } catch (Exception exception) {
                    Loge("Unable to get value for " + key + " from JSONObject.", exception);
                }
            }
        } else if (object != null)
            Loge("Unable to convert passed object to WritableArray", null);

        return writableMap;
    }

    /**
     * Put value into WritableMap and if required, convert it to React Native collection objects if required.
     *
     * @param map Reference on WritableMap instance inside of which data should be stored.
     * @param key Reference on key under which data should be stored.
     * @param value Reference on value which should be stored inside of passed WritableMap.
     */
    public static void putToWritableMap(WritableMap map, String key, Object value) {
        if (value instanceof String)
            map.putString(key, (String) value);
        else if (value instanceof Number) {
            if (value instanceof Integer)
                map.putInt(key, (Integer) value);
            else
                map.putDouble(key, ((Number) value).doubleValue());
        } else if (value instanceof Boolean)
            map.putBoolean(key, (Boolean) value);
        else if (value instanceof List || isJavaArray(value) || value instanceof JSONArray) {
            WritableArray array = writableArrayFrom(value);

            if (array != null)
                map.putArray(key, array);
        } else if (value instanceof Map || value instanceof Bundle || value instanceof JSONObject) {
            WritableMap object = writableMapFrom(value);

            if (object != null)
                map.putMap(key, object);
        } else if (value instanceof ReadableArray)
            map.putArray(key, (WritableArray) value);
        else if (value instanceof ReadableMap)
            map.putMap(key, (WritableMap) value);
        else if (value != null)
            Loge("Attempt to store unsupported object under '" + key + "' key into WritableMap", null);
    }

    /**
     * Convert passed list collection to WritableArray instance.
     *
     * @param object Reference on collection object which should be converted to List.
     * @return WritableArray created from another collection data type.
     */
    @SuppressWarnings("unchecked")
    public static WritableArray writableArrayFrom(Object object) {
        WritableArray writableArray = null;

        if (object instanceof ReadableArray)
            writableArray = (WritableArray) object;
        else if(object instanceof List) {
            writableArray = Arguments.createArray();

            for (Object value: (List) object)
                putToWritableArray(writableArray, value);
        } else if(object instanceof JSONArray) {
            writableArray = Arguments.createArray();

            for (int entryIdx = 0; entryIdx < ((JSONArray) object).length(); entryIdx++) {
                try {
                    putToWritableArray(writableArray, ((JSONArray) object).get(entryIdx));
                } catch (Exception exception) {
                    Loge("Unable to get value at index " + entryIdx + " from JSONArray.", exception);
                }
            }
        } else if (isJavaArray(object))
            writableArray = writableArrayFrom(listFrom(object));
        else if (object != null)
            Loge("Unable to convert passed object to WritableArray", null);

        return writableArray;
    }

    /**
     * Put value into WritableArray and if required, convert it to React Native collection objects if required.
     *
     * @param array Reference on List instance inside of which data should be stored.
     * @param value Reference on value which should be stored inside of passed WritableArray.
     */
    public static void putToWritableArray(WritableArray array, Object value) {
        if (value instanceof Map) {
            value = writableMapFrom(value);

            if (value != null)
                array.pushMap((WritableMap) value);
        } else if (value instanceof List || isJavaArray(value)) {
            value = writableArrayFrom(value);

            if (value != null)
                array.pushArray((WritableArray) value);
        } else if (value instanceof String)
            array.pushString((String) value);
        else if (value instanceof Number) {
            if (value instanceof Integer)
                array.pushInt((Integer) value);
            else
                array.pushDouble(((Number) value).doubleValue());
        } else if (value instanceof Boolean)
            array.pushBoolean((Boolean) value);
        else if (value != null)
            Loge("Attempt to store unsupported into WritableArray", null);
    }


    /////////////////////////////////////////////////////////////////////////////////////////////////
    // JSON objects
    /////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Convert passed list to JSONArray instance.
     *
     * @param object Reference on collection of another data type which should be converted.
     * @return JSONArray instance for List with serializable content or 'null' in another case.
     */
    @Nullable
    public static JSONArray toJSONArray(Object object) {
        if (object instanceof JSONArray)
            return (JSONArray) object;
        else if (object instanceof List || isJavaArray(object)) {
            if (isJavaArray(object))
                object = listFrom(object);

            try {
                //noinspection ConstantConditions
                return new JSONArray((List) object);
            } catch (Exception exception) {
                Loge("Unable to convert List to JSONArray", exception);
                return null;
            }
        } else if (object instanceof ReadableArray)
            return toJSONArray(((ReadableArray) object).toArrayList());
        else if (object != null)
            Loge("Unable to convert passed object to JSONArray.", null);

        return null;
    }

    /**
     * Convert passed HashMap to JSONObject instance.
     *
     * @param object Reference on key/value collection of another data type which should be converted.
     * @return JSONObject instance for HashMap with serializable content or 'null' in another case.
     */
    @Nullable
    public static JSONObject toJSONObject(Object object) {
        if (object instanceof JSONObject)
            return (JSONObject) object;
        else if (object instanceof Map) {
            try {
                return new JSONObject((Map) object);
            } catch (Exception exception) {
                Loge("Unable to convert Map to JSONObject", exception);
                return null;
            }
        } else if (object instanceof Bundle)
            return toJSONObject(mapFrom(object));
        else if (object instanceof ReadableMap)
            return toJSONObject(((ReadableMap) object).toHashMap());
        else if (object != null)
            Loge("Unable to convert passed object to JSONObject.", null);

        return null;
    }


    /////////////////////////////////////////////////////////////////////////////////////////////////
    // Misc
    /////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Check whether passed object is array object.
     * @param object Reference on object against which check should be done.
     * @return 'true' in case if passed object is one of Object[] data types.
     */
    public static Boolean isJavaArray(Object object) {
        return (object instanceof String[] || object instanceof int[] || object instanceof float[] ||
                object instanceof double[] || object instanceof boolean[]);
    }
}
