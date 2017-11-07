package com.pubnub.cennotifications.helpers;

import javax.annotation.Nullable;
import java.io.Serializable;
import java.util.*;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.res.Resources;
import android.media.RingtoneManager;
import android.net.Uri;
import com.facebook.react.bridge.ReadableMap;
import com.pubnub.cennotifications.models.CENNotification;
import org.json.JSONArray;
import org.json.JSONObject;

import android.app.ActivityManager;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.util.Log;

import com.google.firebase.messaging.RemoteMessage;

import com.facebook.react.ReactApplication;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;


@SuppressWarnings("unused")
public class CENNotificationsHelper {

    /**
     * Tag which is prepended to log entries in console.
     */
    private static String LOGGER_TAG = "CENNotifications";


    /////////////////////////////////////////////////////////////////////////////////////////////////
    // Application utility
    /////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Check whether among running module services is application as well.
     *
     * @param context Reference on execution context.
     * @return 'true' in case if application is running in foreground.
     */
    public static boolean isApplicationInForeground(Context context) {
        ActivityManager manager = (ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);
        List<ActivityManager.RunningAppProcessInfo> processes = manager.getRunningAppProcesses();

        if (processes != null)
            for (ActivityManager.RunningAppProcessInfo process : processes)
                if (process.processName.equalsIgnoreCase(context.getPackageName()))
                    if (process.importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND)
                        return true;
        return false;
    }

    /**
     * Check whether React Native instance manager is loaded or not.
     * If manager not ready, listeners may be unloaded as well and not ready to accept events.
     * @param context Reference on execution context.
     * @return 'true' in case if React Native has been initialized and ready to use.
     */
    public static boolean isReactNativeReady(Context context) {
        return ((ReactApplication) context.getApplicationContext()).getReactNativeHost().hasInstance();
    }

    @Nullable
    public static Class launcherActivity(Context context) {
        Context appContext = context.getApplicationContext();
        Intent launchIntent = appContext.getPackageManager().getLaunchIntentForPackage(appContext.getPackageName());
        String activityClassName = launchIntent.getComponent().getClassName();

        try {
            return Class.forName(activityClassName);
        } catch (ClassNotFoundException exception) {
            Loge("Unable to get application launch activity class.", exception);
        }

        return null;
    }


    /////////////////////////////////////////////////////////////////////////////////////////////////
    // Key-value storage management
    /////////////////////////////////////////////////////////////////////////////////////////////////

    private static SharedPreferences sharedPreferences(Context context, String name) {
        Context appContext = context.getApplicationContext();
        return appContext.getSharedPreferences(name, Context.MODE_PRIVATE);
    }

    /**
     * Reference on storage which is used by module to store it's settings.
     * @param context Reference on execution context.
     * @return Configured and ready to use key/value storage to work with settings.
     */
    public static SharedPreferences settingsStorage(Context context) {
        return sharedPreferences(context, "@CENNotifications:settings");
    }

    /**
     * Reference on storage which is used to store list of events which is missed by JS counterpart.
     * @param context Reference on execution context.
     * @return Configured and ready to use key/value storage to work with emitted events.
     */
    private static SharedPreferences eventsStorage(Context context) {
        return sharedPreferences(context, "@CENNotifications:events");
    }

    /**
     * Reference on storage which is used to store list of delivered notifications.
     * @param context Reference on execution context.
     * @return Configured and ready to use key/value storage to work with delivered notifications.
     */
    private static SharedPreferences notificationsStorage(Context context) {
        return sharedPreferences(context, "@CENNotifications:notifications");
    }

    /**
     * Retrieve reference on registration token which has been received during previous device registration session.
     * @param context Reference on execution context.
     * @return Device's registration token.
     */
    @Nullable
    public static String registrationToken(Context context) {
        return settingsStorage(context).getString("@CENNotifications:registrationToken", null);
    }

    /**
     * Store device's registration token. in key/value storage.
     * @param context Reference on execution context.
     * @param registrationToken Device's registration token. which should be stored.
     */
    public static void storeRegistrationToken(Context context, String registrationToken) {
        SharedPreferences.Editor edit = settingsStorage(context).edit();
        edit.putString("@CENNotifications:registrationToken", registrationToken);
        edit.apply();
    }

    /**
     * Retrieve list of previously stored events which wasn't received by JS counterpart.
     *
     * @param context Reference on execution context.
     * @return List of hash maps which represent stored event along with data which should be passed.
     */
    @SuppressWarnings("unchecked")
    public static List<Map<String, Object>> storedEvents(Context context) {
        List<Map<String, Object>> events = new ArrayList<>();
        SharedPreferences prefs = eventsStorage(context);
        Map<String, ?> eventEntries = prefs.getAll();
        String[] dates = eventEntries.keySet().toArray(new String[eventEntries.size()]);
        Arrays.sort(dates);

        for (String date : dates) {
            Map<String, Object> object = (Map<String, Object>) CENSerialization.toObject((String)eventEntries.get(date));

            if(object != null)
                events.add(object);
        }

        return events;
    }

    /**
     * Store passed object into persistent key/value storage.
     * @param context Reference on execution context.
     * @param event Reference on object which represent event and should be stored in key/value storage.
     */
    public static void storeEvent(Context context, Map<String, Object> event) {
        long eventDate = (new Date()).getTime() + System.nanoTime();
        String stringifiedEvent = CENSerialization.toJSONString(event);

        if (stringifiedEvent != null) {
            SharedPreferences.Editor edit = eventsStorage(context).edit();

            edit.putString(String.valueOf(eventDate), stringifiedEvent);
            edit.apply();
        }
    }

    /**
     * Clean up previously stored events.
     * @param context Reference on execution context.
     */
    public static void clearStoredEvents(Context context) {
        SharedPreferences.Editor edit = eventsStorage(context).edit();
        edit.clear();
        edit.apply();
    }

    /**
     * Retrieve list of notifications which has been delivered to this device while application was in background and
     * user didn't checked them yet.
     *
     * @param context Reference on execution context.
     * @return List of hash maps which represent delivered notifications along with data which should be passed.
     */
    @SuppressWarnings("unchecked")
    public static List<Map<String, Object>> deliveredNotifications(Context context) {
        List<Map<String, Object>> deliveredNotifications = new ArrayList<>();
        SharedPreferences prefs = notificationsStorage(context);
        Map<String, ?> notificationEntries = prefs.getAll();
        String[] dates = notificationEntries.keySet().toArray(new String[notificationEntries.size()]);
        Arrays.sort(dates);

        for (String date : dates) {
            Map<String, Object> object = (Map<String, Object>)(CENSerialization.toObject((String) notificationEntries.get(date)));

            if(object != null)
                deliveredNotifications.add(object);
        }

        return deliveredNotifications;
    }

    /**
     * Retrieve reference on delivered notification with specific chat engine identifier.
     *
     * @param context Reference on execution context.
     * @return Reference on notification representation instance or 'null' if notification with specified 'ceid' not
     *         found.
     */
    @SuppressWarnings("unchecked")
    public static CENNotification deliveredNotification(Context context, String ceid) {
        List<Map<String, Object>> deliveredNotifications = deliveredNotifications(context);
        CENNotification notification = null;

        for (Map<String, Object> payload : deliveredNotifications) {
            CENNotification deliveredNotification = new CENNotification(context, payload);
            Map<String, Object> cePayload = deliveredNotification.chatEnginePayload();

            if (ceid != null && cePayload != null && cePayload.containsKey("ceid")) {
                String deliveredNotificationCEId = (String) cePayload.get("ceid");

                if (deliveredNotificationCEId != null && deliveredNotificationCEId.equalsIgnoreCase(ceid)) {
                    notification = deliveredNotification;
                    break;
                }
            }
        }

        return notification;
    }

    /**
     * Store passed notification into persistent key/value storage.
     * @param context Reference on execution context.
     * @param notification Reference on notification which should be stored in serialized form into persistent storage.
     */
    public static void storeNotification(Context context, CENNotification notification) {
        long notificationDate = notification.sentTime() > 0 ? notification.sentTime() : (new Date()).getTime();
        String stringifiedNotification = CENSerialization.toJSONString(notification.toMap());

        if (stringifiedNotification != null) {
            SharedPreferences.Editor edit = notificationsStorage(context).edit();

            edit.putString(String.valueOf(notificationDate + System.nanoTime()), stringifiedNotification);
            edit.apply();
        }
    }

    /**
     * Try to remove specified notification from persistent storage.
     * @param context Reference on execution context.
     */
    public static void removeDeliveredNotification(Context context, CENNotification notification) {
        SharedPreferences prefs = notificationsStorage(context);
        Set<String> dates = prefs.getAll().keySet();

        for (String notificationDate : dates) {
            Map payload = (Map) CENSerialization.toObject(prefs.getString(notificationDate, null));
            if (payload != null) {
                CENNotification deliveredNotification = new CENNotification(context, payload);
                if (deliveredNotification.id() == notification.id()) {
                    SharedPreferences.Editor edit = prefs.edit();
                    edit.remove(notificationDate);
                    edit.apply();
                    break;
                }
            }
        }
    }

    /**
     * Clean up previously stored notifications.
     * @param context Reference on execution context.
     */
    public static void clearDeliveredNotifications(Context context) {
        SharedPreferences.Editor edit = notificationsStorage(context).edit();
        edit.clear();
        edit.apply();
    }


    /////////////////////////////////////////////////////////////////////////////////////////////////
    // Logger shortcut functions
    /////////////////////////////////////////////////////////////////////////////////////////////////

    public static void Logi(String message) {
        if (Log.isLoggable(LOGGER_TAG, Log.INFO)) {
            Log.i(LOGGER_TAG, message);
        }
    }

    public static void Loge(String message, Throwable error) {
        if (Log.isLoggable(LOGGER_TAG, Log.ERROR)) {
            Log.e(LOGGER_TAG, message, error);
        }
    }

    public static void Logw(String message) {
        if (Log.isLoggable(LOGGER_TAG, Log.WARN)) {
            Log.w(LOGGER_TAG, message);
        }
    }


    /////////////////////////////////////////////////////////////////////////////////////////////////
    // Data conversion
    /////////////////////////////////////////////////////////////////////////////////////////////////

    public static Integer getInteger(Object value, Integer defaultValue) {
        if (value instanceof String)
            value = Integer.valueOf((String) value);
        if (!(value instanceof Integer))
            value = defaultValue;

        return (Integer) value;
    }

    public static Long getLong(Object value, long defaultValue) {
        if (value instanceof String)
            value = Long.valueOf((String) value);
        if (!(value instanceof Long))
            value = defaultValue;

        return (Long) value;
    }

    public static Boolean getBoolean(Object value, Boolean defaultValue) {
        if (value instanceof String)
            value = Boolean.valueOf((String) value);
        if (!(value instanceof Boolean))
            value = defaultValue;

        return (Boolean) value;
    }

    public static String[] getStringArray(Object value, String[] defaultValue) {
        String[] array = defaultValue;
        if (value != null && value instanceof List) {
            array = new String[((List)value).size()];
            for (int entryIdx = 0; entryIdx < ((List)value).size(); entryIdx++) {
                array[entryIdx] = (String)((List) value).get(entryIdx);
            }
        }
        return array;
    }

    public static int[] getIntArray(Object value, int[] defaultValue) {
        int[] array = defaultValue;
        if (value != null && value instanceof List) {
            array = new int[((List)value).size()];
            for (int entryIdx = 0; entryIdx < ((List)value).size(); entryIdx++) {
                array[entryIdx] = (int)((List) value).get(entryIdx);
            }
        }
        return array;
    }

    public static long[] getLongArray(Object value, long[] defaultValue) {
        long[] array = defaultValue;
        if (value != null && value instanceof List) {
            array = new long[((List)value).size()];
            for (int entryIdx = 0; entryIdx < ((List)value).size(); entryIdx++) {
                array[entryIdx] = (int)((List) value).get(entryIdx);
            }
        }
        return array;
    }

    @Nullable
    public static Uri soundUri(String packageName, Resources resources, String soundName) {
        Uri notificationSound = null;
        if (soundName != null) {
            notificationSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);

            if (!"default".equalsIgnoreCase(soundName)) {
                int soundResourceId = resources.getIdentifier(soundName, "raw", packageName);
                if (soundResourceId == 0 && soundName.lastIndexOf('.') >= 0) {
                    String extensionLessSoundName = soundName.substring(0, soundName.lastIndexOf('.'));
                    soundResourceId = resources.getIdentifier(extensionLessSoundName, "raw", packageName);
                }
                notificationSound = Uri.parse("android.resource://" + packageName + "/" + soundResourceId);
            }
        }
        return notificationSound;
    }
}
