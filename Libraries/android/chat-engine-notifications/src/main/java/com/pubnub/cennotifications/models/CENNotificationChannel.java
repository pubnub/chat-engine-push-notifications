package com.pubnub.cennotifications.models;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.res.Resources;
import android.graphics.Color;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import com.pubnub.cennotifications.helpers.CENCollections;
import com.pubnub.cennotifications.helpers.CENNotificationsHelper;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.Accessors;

import java.util.HashMap;
import java.util.List;
import java.util.Map;


@SuppressWarnings({"WeakerAccess", "unused", "RedundantCast"})
@Accessors(fluent = true)
public class CENNotificationChannel {

    private static final String IMPORTANCE_NONE = "IMPORTANCE_NONE";
    private static final String IMPORTANCE_MIN = "IMPORTANCE_MIN";
    private static final String IMPORTANCE_LOW = "IMPORTANCE_LOW";
    private static final String IMPORTANCE_HIGH = "IMPORTANCE_HIGH";
    private static final String IMPORTANCE_DEFAULT = "IMPORTANCE_DEFAULT";

    @Getter @Setter private String id = null;
    @Getter @Setter private String name = null;
    @Getter @Setter private int importance = -1;
    @Getter @Setter private Boolean vibration = true;
    @Getter @Setter private long[] vibrationPattern = new long[] { 1000 };
    @Getter @Setter private Boolean lights = true;
    @Getter @Setter private int lightColor = Color.parseColor("#00FF00");
    @Getter @Setter private Uri sound = null;

    public CENNotificationChannel(Context context, Object payload) {

        setDefaults();
        parseChannelData(context, CENCollections.mapFrom(payload));
    }

    public void register(Context context) {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel channel = new NotificationChannel(id(), name(), importance());
            channel.enableVibration(vibration());
            if (vibration())
                channel.setVibrationPattern(vibrationPattern());
            channel.enableLights(lights());
            if (lights() && lightColor() != 0)
                channel.setLightColor(lightColor());

            if (sound() != null) {
                AudioAttributes audioAttributes = new AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                        .build();
                channel.setSound(sound(), audioAttributes);
            }
            NotificationManager notificationManager = ((NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE));
            notificationManager.createNotificationChannel(channel);
        }
    }

    /**
     * List of constants which bound to platform constants.
     * @return Map of JS constant name to platform constants.
     */
    public static Map<String, Object> constants() {
        final Map<String, Object> constants = new HashMap<>();

        if (Build.VERSION.SDK_INT >= 26) {
            constants.put(IMPORTANCE_NONE, NotificationManager.IMPORTANCE_NONE);
            constants.put(IMPORTANCE_MIN, NotificationManager.IMPORTANCE_MIN);
            constants.put(IMPORTANCE_LOW, NotificationManager.IMPORTANCE_LOW);
            constants.put(IMPORTANCE_HIGH, NotificationManager.IMPORTANCE_HIGH);
            constants.put(IMPORTANCE_DEFAULT, NotificationManager.IMPORTANCE_DEFAULT);
        }

        return constants;
    }

    private void parseChannelData(Context context, Map<String, Object> data) {
        id((String) CENCollections.getFromMap(data, "id", id()));
        name((String) CENCollections.getFromMap(data, "name", name()));
        if (data.containsKey("importance") && Build.VERSION.SDK_INT >= 26) {
            importance(CENNotificationsHelper.getInteger(data.get("importance"), NotificationManager.IMPORTANCE_HIGH));
        }

        vibration(CENNotificationsHelper.getBoolean(data.get("vibration"), vibration()));
        if (data.containsKey("vibrationPattern")) {
            Object vibrationPatternList = data.get("vibrationPattern");
            if (vibrationPatternList != null && vibrationPatternList instanceof List) {
                long[] vibrationPattern = CENNotificationsHelper.getLongArray(vibrationPatternList, new long[]{});
                vibrationPattern(vibrationPattern);
            }
        }

        lights(CENNotificationsHelper.getBoolean(data.get("lights"), lights()));
        if (data.containsKey("lightColor"))
            lightColor(CENNotificationsHelper.getInteger(data.get("lightColor"), 0));

        if (data.containsKey("sound")) {
            String packageName = context.getApplicationContext().getPackageName();
            Resources resources = context.getApplicationContext().getResources();
            sound(CENNotificationsHelper.soundUri(packageName, resources, (String) data.get("sound")));
        }
    }

    private void setDefaults() {
        if (Build.VERSION.SDK_INT >= 26)
            importance(NotificationManager.IMPORTANCE_HIGH);
    }
}
