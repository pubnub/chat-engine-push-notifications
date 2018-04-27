package com.pubnub.cennotifications.models;

import android.app.Notification;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import com.google.firebase.messaging.RemoteMessage;
import com.pubnub.cennotifications.helpers.CENCollections;
import com.pubnub.cennotifications.helpers.CENNotificationsHelper;
import com.pubnub.cennotifications.helpers.CENSerialization;
import com.pubnub.cennotifications.modules.CENNotificationsBroadcastListener;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.Accessors;

import javax.annotation.Nullable;
import java.util.*;


/**
 * De-serialized remote notification representation model.
 */
@SuppressWarnings({"WeakerAccess", "unused", "deprecation", "RedundantCast"})
@Accessors(fluent = true)
public class CENNotification extends Notification {
    private static final String CATEGORY_ALARM = "CATEGORY_ALARM";
    private static final String CATEGORY_CALL = "CATEGORY_CALL";
    private static final String CATEGORY_EMAIL = "CATEGORY_EMAIL";
    private static final String CATEGORY_ERROR = "CATEGORY_ERROR";
    private static final String CATEGORY_EVENT = "CATEGORY_EVENT";
    private static final String CATEGORY_MESSAGE = "CATEGORY_MESSAGE";
    private static final String CATEGORY_PROGRESS = "CATEGORY_PROGRESS";
    private static final String CATEGORY_PROMO = "CATEGORY_PROMO";
    private static final String CATEGORY_RECOMMENDATION = "CATEGORY_RECOMMENDATION";
    private static final String CATEGORY_REMINDER = "CATEGORY_REMINDER";
    private static final String CATEGORY_SERVICE = "CATEGORY_SERVICE";
    private static final String CATEGORY_SOCIAL = "CATEGORY_SOCIAL";
    private static final String CATEGORY_STATUS = "CATEGORY_STATUS";
    private static final String CATEGORY_SYSTEM = "CATEGORY_SYSTEM";
    private static final String CATEGORY_TRANSPORT = "CATEGORY_TRANSPORT";

    private static final String BADGE_ICON_NONE = "BADGE_ICON_NONE";
    private static final String BADGE_ICON_SMALL = "BADGE_ICON_SMALL";
    private static final String BADGE_ICON_LARGE = "BADGE_ICON_LARGE";

    private static final String DEFAULT_ALL = "DEFAULT_ALL";
    private static final String DEFAULT_SOUND = "DEFAULT_SOUND";
    private static final String DEFAULT_VIBRATE = "DEFAULT_VIBRATE";
    private static final String DEFAULT_LIGHTS = "DEFAULT_LIGHTS";

    private static final String GROUP_ALERT_ALL = "GROUP_ALERT_ALL";
    private static final String GROUP_ALERT_CHILDREN = "GROUP_ALERT_CHILDREN";
    private static final String GROUP_ALERT_SUMMARY = "GROUP_ALERT_SUMMARY";

    private static final String PRIORITY_DEFAULT = "PRIORITY_DEFAULT";
    private static final String PRIORITY_HIGH = "PRIORITY_HIGH";
    private static final String PRIORITY_LOW = "PRIORITY_LOW";
    private static final String PRIORITY_MAX = "PRIORITY_MAX";
    private static final String PRIORITY_MIN = "PRIORITY_MIN";

    private static final String VISIBILITY_PRIVATE = "VISIBILITY_PRIVATE";
    private static final String VISIBILITY_PUBLIC = "VISIBILITY_PUBLIC";
    private static final String VISIBILITY_SECRET = "VISIBILITY_SECRET";

    /**
     * Reference on list of keys which is known for decoding.
     * Unknown keys will be added as notification extra fields.
     */
    private List<String> knownKeys;

    // addAction (int icon, CharSequence title, PendingIntent intent) - before API 20 (after addAction (Notification.Action action))
    private List actions;

    /**
     * Reference on notification's data object.
     */
    private Map payload;

    /**
     * Reference on list of extra data which not related to notification layout.
     */
    @Getter @Setter(AccessLevel.PRIVATE) private Map<String, Object> extras;

    @Getter @Setter(AccessLevel.PRIVATE) String googleNotificationId = null;
    @Getter @Setter(AccessLevel.PRIVATE) int id;
    @Getter @Setter(AccessLevel.PRIVATE) String type = null;
    @Getter @Setter(AccessLevel.PRIVATE) long sentTime;
    @Getter @Setter(AccessLevel.PRIVATE) String sender = null;
    @Getter @Setter(AccessLevel.PRIVATE) String receiver = null;
    @Getter @Setter(AccessLevel.PRIVATE) String collapseKey = null;
    @Getter @Setter(AccessLevel.PRIVATE) long ttl = -1;

    @Getter @Setter private String clickAction = null;
    @Getter @Setter private int badge = -1;

    @Getter @Setter private Boolean autoCancel = true;
    @Getter @Setter private CharSequence contentText = null;
    @Getter @Setter private CharSequence contentTitle = null;
    @Getter @Setter private int defaults = Notification.DEFAULT_LIGHTS;
    @Getter @Setter private Bitmap largeIcon;
    @Getter @Setter private String largeIconName;
    @Getter @Setter private int[] lights = null;
    @Getter @Setter private int number = -1;
    @Getter @Setter private Boolean ongoing = false;
    @Getter @Setter private Boolean onlyAlertOnce = true;
    @Getter @Setter private int priority = Notification.PRIORITY_HIGH;
    @Getter @Setter private int[] progress = null;
    @Getter @Setter private Boolean showWhen = false;
    @Getter @Setter private int smallIcon = 0;
    @Getter @Setter private String smallIconName = null;
    @Getter @Setter private Uri sound = null;
    @Getter @Setter private String subText = null;
    @Getter @Setter private String ticker = null;
    @Getter @Setter private Boolean usesChronometer = false;
    @Getter @Setter private long[] vibrate = new long[] { 1000 };
    @Getter @Setter private long when = -1;
    @Getter @Setter private Uri link = null;
    @Getter @Setter private String tag = null;

    // Available since API 20.
    @Getter @Setter private String sortKey = null;
    @Getter @Setter private String group = null;
    @Getter @Setter private Boolean groupSummary = false;
    @Getter @Setter private Boolean localOnly = true;

    // Available since API 21.
    @Getter @Setter private String person = null;
    @Getter @Setter private int color = -1;
    @Getter @Setter private String category = null;
    @Getter @Setter private int visibility;

    // Available since API 24.
    @Getter @Setter private Boolean chronometerCountDown = false;

    // Available since API 26.
    @Getter @Setter private int badgeIconType = -1;
    @Getter @Setter private String channelId = null;
    @Getter @Setter private Boolean colorized = false;
    @Getter @Setter private int groupAlertBehavior = -1;
    @Getter @Setter private String settingsText = null;
    @Getter @Setter private int timeoutAfter = -1;


    public CENNotification(Context context, Object payload) {
        this(context, payload, null);
    }

    public CENNotification(Context context, Object payload, @Nullable String sender) {
        String[] knownKeys = new String[] { "actions", "person", "autoCancel", "badgeIconType", "category", "channelId",
                "chronometerCountDown", "color", "colorized", "contentText", "contentTitle", "defaults", "group",
                "groupAlertBehavior", "groupSummary", "largeIcon", "lights", "localOnly", "number", "ongoing",
                "onlyAlertOnce", "priority", "progress", "settingsText", "showWhen", "smallIcon", "sortKey", "sound",
                "subText", "ticker", "timeoutAfter", "usesChronometer", "vibrate", "visibility", "when", "tag", "link"
        };
        this.knownKeys = new ArrayList<>(Arrays.asList(knownKeys));
        setDefaults(context);

        if (payload != null) {
            if (payload instanceof Bundle || payload instanceof Map) {
                Bundle bundle = payload instanceof Map ? CENCollections.bundleFrom(payload) : (Bundle) payload;
                this.parseFromBundle(context, bundle, sender);
            } else if (payload instanceof RemoteMessage) {
                this.parseFromRemoteMessage(context, (RemoteMessage) payload);
            } else {
                throw new ClassCastException("Passed 'payload' should be instance of Bundle or RemoteMessage.");
            }
        } else {
            throw new NullPointerException("Attempted to pass null to CENNotification constructor.");
        }
        // Parse rest of notification information which has been sent under 'data' key.
        parseNotificationData(context.getApplicationContext().getPackageName(),
                context.getApplicationContext().getResources(), this.payload);
        setDefaultTitle(context);
    }

    public Notification notification(Context context) {
        Notification notification = builder(context).build();
        if (extras() != null && extras().size() > 0 && Build.VERSION.SDK_INT == Build.VERSION_CODES.KITKAT) {
            Bundle extrasBundle = CENCollections.bundleFrom(extras());
            if (extrasBundle != null)
                notification.extras.putAll(extrasBundle);
        }

        return notification;
    }

    public Notification.Builder builder(Context context) {
        Notification.Builder builder = new Notification.Builder(context)
                .setContentTitle(contentTitle())
                .setContentText(contentText())
                .setDefaults(defaults())
                .setOngoing(ongoing())
                .setAutoCancel(autoCancel())
                .setPriority(priority())
                .setLargeIcon(largeIcon())
                .setSmallIcon(smallIcon())
                .setSound(sound())
                .setSubText(subText())
                .setTicker(ticker())
                .setVibrate(vibrate());

        if (lights() != null)
            builder.setLights(lights()[0], lights()[1], lights()[2]);
        if (number() >= 0)
            builder.setNumber(number());
        if (progress() != null)
            builder.setProgress(progress()[0], progress()[1], progress()[2] != 0);
        if (this.payload.containsKey("showWhen") && Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR1)
            builder.setShowWhen(showWhen());
        if (when() >= 0)
            builder.setWhen(when());
        if (this.payload.containsKey("usesChronometer"))
            builder.setUsesChronometer(usesChronometer());
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT_WATCH) {
            if (sortKey() != null)
                builder.setSortKey(sortKey());
            if (group() != null)
                builder.setGroup(group());
            if (this.payload.containsKey("groupSummary"))
                builder.setGroupSummary(groupSummary());
            if (this.payload.containsKey("localOnly"))
                builder.setLocalOnly(localOnly());
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            if (person() != null)
                builder.addPerson(person());
            if (color() != 0)
                builder.setColor(color());
            if (category() != null)
                builder.setCategory(category());
            if (this.payload.containsKey("visibility"))
                builder.setVisibility(visibility());
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            if (this.payload.containsKey("chronometerCountDown"))
                builder.setChronometerCountDown(chronometerCountDown());
        }
        if (Build.VERSION.SDK_INT >= 26) {
            if (this.payload.containsKey("badgeIconType"))
                builder.setBadgeIconType(badgeIconType());
            if (channelId() != null)
                builder.setChannelId(channelId());
            if (this.payload.containsKey("colorized"))
                builder.setColorized(colorized());
            if (groupAlertBehavior() >= 0)
                builder.setGroupAlertBehavior(groupAlertBehavior());
            if (settingsText() != null)
                builder.setSettingsText(settingsText());
            if (timeoutAfter() >= 0)
                builder.setTimeoutAfter(timeoutAfter());
        }

        if (extras() != null && extras().size() > 0 && Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT_WATCH) {
            Bundle extrasBundle = CENCollections.bundleFrom(extras());

            if (extrasBundle != null)
                builder.addExtras(extrasBundle);
            if (color() != 0)
                builder.setGroupSummary(groupSummary());
        }

        addHandlers(context, builder);

        return builder;
    }

    /**
     * Check whether notification object contain enough information to be shown in notification center or not.
     * @return 'true' in case if notification object contain information to be shown in notification center.
     */
    public Boolean canBeShown() {
        return contentText() != null && contentText().length() > 0;
    }

    /**
     * Retrieve reference on data object which has been passed with notification from Chat Engine.
     *
     * @return Chat Engine data object.
     */
    @SuppressWarnings("unchecked")
    @Nullable
    public Map<String, Object> chatEnginePayload() {
        return extras() != null ? (Map<String, Object>) extras().get("cepayload") : null;
    }

    /**
     * Retrieve Chat Engine event with which this notification message has been created.
     *
     * @return Reference on name of event for which notification has been created.
     */
    @Nullable
    public String chatEngineEvent() {
        Map<String, Object> chatEnginePayload = chatEnginePayload();
        if (chatEnginePayload != null && chatEnginePayload.containsKey("event"))
            return (String) chatEnginePayload.get("event");

        return null;
    }

    /**
     * Retrieve reference on notification's category which has been set by Chat Engine basing on triggered event name.
     *
     * @return Reference on Chat Engine notification category name or 'null' in case of parsing error.
     */
    @Nullable
    public String chatEngineNotificationCategory() {
        Map<String, Object> chatEnginePayload = chatEnginePayload();
        if (chatEnginePayload != null && chatEnginePayload.containsKey("category"))
            return (String) chatEnginePayload.get("category");

        return null;
    }

    /**
     * Serialize notification instance to HashMap.
     *
     * @return HashMap notification representation (same as has been passed in 'data' notification).
     */
    public Map<String, Object> toMap() {
        Map<String, Object> map = new HashMap<>();
        CENCollections.putToMap(map, "google.message_id", googleNotificationId());
        CENCollections.putToMap(map, "id", id());
        CENCollections.putToMap(map, "type", type());
        if (sentTime() > 0)
            CENCollections.putToMap(map, "google.sent_time", sentTime());
        CENCollections.putToMap(map, "from", sender());
        CENCollections.putToMap(map, "to", receiver());
        CENCollections.putToMap(map, "collapse_key", collapseKey());
        if (ttl() > 0)
            CENCollections.putToMap(map, "ttl", ttl());


        CENCollections.putToMap(map, "contentTitle", contentTitle());
        CENCollections.putToMap(map, "contentText", contentText());
        if (defaults() > 0) {
            List<Integer> defaultsValues = new ArrayList<>();
            if (defaults == Notification.DEFAULT_ALL)
                defaultsValues.add(Notification.DEFAULT_ALL);
            else {
                if ((defaults & Notification.DEFAULT_SOUND) != 0)
                    defaultsValues.add(Notification.DEFAULT_SOUND);
                if ((defaults & Notification.DEFAULT_VIBRATE) != 0)
                    defaultsValues.add(Notification.DEFAULT_VIBRATE);
                if ((defaults & Notification.DEFAULT_LIGHTS) != 0)
                    defaultsValues.add(Notification.DEFAULT_LIGHTS);
            }
            CENCollections.putToMap(map, "defaults", defaultsValues);
        }
        if (this.payload.containsKey("ongoing"))
            CENCollections.putToMap(map, "ongoing", ongoing());
        CENCollections.putToMap(map, "autoCancel", autoCancel());
        CENCollections.putToMap(map, "priority", priority());
        CENCollections.putToMap(map, "largeIcon", largeIconName());
        CENCollections.putToMap(map, "smallIcon", smallIconName());
        if (sound() != null)
            CENCollections.putToMap(map, "sound", sound().getLastPathSegment());
        CENCollections.putToMap(map, "ticker", ticker());
        CENCollections.putToMap(map, "vibrate", vibrate());
        CENCollections.putToMap(map, "lights", lights());
        if (number() >= 0)
            CENCollections.putToMap(map, "number", number());
        CENCollections.putToMap(map, "progress", progress());
        if (this.payload.containsKey("showWhen"))
            CENCollections.putToMap(map, "showWhen", showWhen());
        if (when() >= 0)
            CENCollections.putToMap(map, "when", when());
        if (this.payload.containsKey("usesChronometer"))
            CENCollections.putToMap(map, "usesChronometer", usesChronometer());
        CENCollections.putToMap(map, "sortKey", sortKey());
        CENCollections.putToMap(map, "group", group());
        if (this.payload.containsKey("groupSummary"))
            CENCollections.putToMap(map, "groupSummary", groupSummary());
        if (this.payload.containsKey("localOnly"))
            CENCollections.putToMap(map, "localOnly", localOnly());
        CENCollections.putToMap(map, "person", person());
        if (color() != 0)
            CENCollections.putToMap(map, "color", color());
        if (category() != null)
            CENCollections.putToMap(map, "category", category());
        if (this.payload.containsKey("visibility"))
            CENCollections.putToMap(map, "visibility", visibility());
        if (this.payload.containsKey("chronometerCountDown"))
            CENCollections.putToMap(map, "chronometerCountDown", chronometerCountDown());
        if (this.payload.containsKey("badgeIconType"))
            CENCollections.putToMap(map, "badgeIconType", badgeIconType());
        CENCollections.putToMap(map, "channelId", channelId());
        if (this.payload.containsKey("colorized"))
            CENCollections.putToMap(map, "colorized", colorized());
        if (this.payload.containsKey("groupAlertBehavior"))
            CENCollections.putToMap(map, "groupAlertBehavior", groupAlertBehavior());
        CENCollections.putToMap(map, "settingsText", settingsText());
        if (timeoutAfter() >= 0)
            CENCollections.putToMap(map, "timeoutAfter", timeoutAfter());
        CENCollections.putToMap(map, "tag", tag());
        CENCollections.putToMap(map, "link", link());
        CENCollections.putToMap(map, "actions", actions);

        if (extras() != null && extras().size() > 0) {
            for (String key : extras().keySet())
                CENCollections.putToMap(map, key, CENCollections.getFromMap(extras(), key, null));
        }


        return map;
    }

    /**
     * De-serialize notification instance from Bundle contained data which has been passed from Intent or from legacy
     * message listener (GCM).
     *
     * @param context Reference on code execution context.
     * @param payload Reference on Bundle object which contain information about notification layout configuration.
     * @param sender Name of message sender (available for legacy message listener (GCM)).
     */
    private void parseFromBundle(Context context, Bundle payload, @Nullable String sender) {
        String packageName = context.getApplicationContext().getPackageName();
        Resources resources = context.getApplicationContext().getResources();

        Bundle notification = payload.getBundle("notification");
        if (notification != null) {
            contentTitle(notification.getString("title"));
            contentText(notification.getString("body"));
            if (notification.getString("click_action") != null)
                clickAction(packageName + '.' + notification.getString("click_action"));
            if (notification.getString("color") != null)
                color(Color.parseColor(notification.getString("color")));

            if (CENCollections.getFromBundle(notification, "badge") != null)
                badge(CENNotificationsHelper.getInteger(CENCollections.getFromBundle(notification, "badge"), -1));

            if (notification.getString("sound") != null) {
                defaults |= Notification.DEFAULT_SOUND;
                sound(CENNotificationsHelper.soundUri(packageName, resources, notification.getString("sound")));
            }
            tag(notification.getString("tag"));
        }
        if (sender != null)
            sender(sender);

        Map data = CENCollections.mapFrom(payload);
        if (data != null)
            data.remove("notification");
        this.payload = data;
    }

    /**
     * De-serialize notification instance from RemoteMessage contained data which has been passed from FCM message
     * listener service.
     *
     * @param context Reference on code execution context.
     * @param payload Reference on RemoteMessage object which contain information about notification layout
     *                configuration.
     */
    private void parseFromRemoteMessage(Context context, RemoteMessage payload) {
        String packageName = context.getApplicationContext().getPackageName();
        Resources resources = context.getApplicationContext().getResources();
        RemoteMessage.Notification notification = payload.getNotification();

        if (notification != null) {
            contentText(notification.getBody());
            if (notification.getClickAction() != null)
                clickAction(packageName + '.' + notification.getClickAction());

            if (notification.getColor() != null)
                color(Color.parseColor(notification.getColor()));

            if (notification.getIcon() != null) {
                int smallIconResourceId = resources.getIdentifier(notification.getIcon(), "mipmap", packageName);
                if (smallIconResourceId != 0)
                    smallIcon(smallIconResourceId);
            }

            link(notification.getLink());

            if (notification.getSound() != null) {
                defaults |= Notification.DEFAULT_SOUND;
                sound(CENNotificationsHelper.soundUri(packageName, resources, notification.getSound()));
            }

            tag(notification.getTag());
            contentTitle(notification.getTitle());
        }

        googleNotificationId(payload.getMessageId());
        type(payload.getMessageType());
        sentTime(payload.getSentTime());
        sender(payload.getFrom());
        receiver(payload.getTo());
        collapseKey(payload.getCollapseKey());
        ttl(payload.getTtl());

        this.payload = CENCollections.mapFrom(payload.getData());
    }

    /**
     * De-serialize notification object from 'data' notification container.
     *
     * @param packageName Name of application package for which code is running.
     * @param resources Reference on object which provide access to package's resources.
     * @param data Reference on object which store data notification data.
     */
    private void parseNotificationData(String packageName, Resources resources, Map data) {

        badge(CENNotificationsHelper.getInteger(data.get("badge"), badge()));
        autoCancel(CENNotificationsHelper.getBoolean(data.get("autoCancel"), autoCancel()));
        contentText((String) CENCollections.getFromMap(data, "contentText", contentText()));
        contentTitle((String) CENCollections.getFromMap(data, "contentTitle", contentTitle()));
        if (data.containsKey("click_action"))
            clickAction(packageName + '.' + data.get("click_action"));
        if (data.containsKey("actions"))
            actions = CENCollections.listFrom(data.get("actions"));

        if (data.containsKey("defaults")) {
            Object defaultsValues = data.get("defaults");
            if (defaultsValues != null && defaultsValues instanceof List) {
                for (Object defaultsValue : (List) defaultsValues) {
                    defaults |= (Integer) defaultsValue;
                }
            }
        }
        id(CENNotificationsHelper.getInteger(data.get("id"), id()));

        Bitmap largeIconBitmap = bitmapForIcon(packageName, resources, (String) data.get("largeIcon"));
        if (largeIconBitmap != null) {
            largeIconName((String) data.get("largeIcon"));
            largeIcon(largeIconBitmap);
        }

        if (data.containsKey("lights")) {
            Object lightsList = CENSerialization.toObject((String) data.get("lights"));
            if (lightsList != null && lightsList instanceof List && ((List)lightsList).size() == 3) {
                int[] lights = CENNotificationsHelper.getIntArray(lightsList, new int[]{});
                if (lights.length > 0)
                    lights(lights);
            }
        }
        number(CENNotificationsHelper.getInteger(data.get("number"), number()));
        ongoing(CENNotificationsHelper.getBoolean(data.get("ongoing"), ongoing()));
        onlyAlertOnce(CENNotificationsHelper.getBoolean(data.get("onlyAlertOnce"), onlyAlertOnce()));

        if (data.containsKey("priority")) {
            priority(CENNotificationsHelper.getInteger(data.get("priority"), Notification.PRIORITY_HIGH));
        }
        if (data.containsKey("progress")) {
            Object progressList = CENSerialization.toObject((String) data.get("progress"));
            if (progressList != null && progressList instanceof List && ((List)progressList).size() == 3) {
                int[] progress = CENNotificationsHelper.getIntArray(progressList, new int[]{});
                if (progress.length > 0)
                    progress(progress);
            }
        }

        showWhen(CENNotificationsHelper.getBoolean(data.get("showWhen"), showWhen()));

        if (data.containsKey("smallIcon")) {
            smallIconName((String) data.get("smallIcon"));
            int smallIconResourceId = iconResourceId(packageName, resources, (String) data.get("smallIcon"));
            if (smallIconResourceId != 0)
                smallIcon(smallIconResourceId);
        }

        if (data.containsKey("sound"))
            sound(CENNotificationsHelper.soundUri(packageName, resources, (String) data.get("sound")));
        subText((String) CENCollections.getFromMap(data, "subText", subText()));
        ticker((String) CENCollections.getFromMap(data, "ticker", ticker()));
        usesChronometer(CENNotificationsHelper.getBoolean(data.get("usesChronometer"), usesChronometer()));

        if (data.containsKey("vibrate")) {
            Object vibrateList = data.get("vibrate");
            if (vibrateList != null && vibrateList instanceof List) {
                long[] vibrate = CENNotificationsHelper.getLongArray(vibrateList, new long[]{});
                vibrate(vibrate);
            }
        }

        when(CENNotificationsHelper.getLong(data.get("when"), when()));
        if (data.containsKey("link"))
            link(Uri.parse((String) data.get("link")));
        tag((String) CENCollections.getFromMap(data, "tag", tag()));
        sortKey((String) CENCollections.getFromMap(data, "sortKey", sortKey()));
        group((String) CENCollections.getFromMap(data, "group", group()));
        groupSummary(CENNotificationsHelper.getBoolean(data.get("groupSummary"), groupSummary()));
        localOnly(CENNotificationsHelper.getBoolean(data.get("localOnly"), localOnly()));
        if (data.containsKey("person"))
            person((String) data.get("person"));
        if (data.containsKey("color"))
            color(CENNotificationsHelper.getInteger(data.get("color"), 0));
        if (data.containsKey("category"))
            category((String) data.get("category"));
        if (data.containsKey("visibility") && Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP)
            visibility(CENNotificationsHelper.getInteger(data.get("visibility"), Notification.VISIBILITY_PRIVATE));
        chronometerCountDown(CENNotificationsHelper.getBoolean(data.get("chronometerCountDown"), chronometerCountDown()));
        if (data.containsKey("badgeIconType")) {
            badgeIconType(CENNotificationsHelper.getInteger(data.get("badgeIconType"), -1));
        }
        channelId((String) CENCollections.getFromMap(data, "channelId", channelId()));
        colorized(CENNotificationsHelper.getBoolean(data.get("colorized"), colorized()));
        if (data.containsKey("groupAlertBehavior")) {
            groupAlertBehavior(CENNotificationsHelper.getInteger(data.get("groupAlertBehavior"), -1));
        }
        settingsText((String) CENCollections.getFromMap(data, "settingsText", settingsText()));
        timeoutAfter(CENNotificationsHelper.getInteger(data.get("timeoutAfter"), timeoutAfter()));

        googleNotificationId((String) CENCollections.getFromMap(data, "google.message_id", googleNotificationId()));
        sentTime((long) CENCollections.getFromMap(data, "google.sent_time", sentTime()));
        sender((String) CENCollections.getFromMap(data, "from", sender()));
        collapseKey((String) CENCollections.getFromMap(data, "collapse_key", collapseKey()));


        Map<String, Object> extraData = new HashMap<>();
        for (Object key: data.keySet()) {
            if (!knownKeys.contains((String) key))
                CENCollections.putToMap(extraData, (String) key,
                        CENCollections.getFromMap(data, (String) key, null));
        }
        extras(extraData);
    }

    /**
     * Add notification and action tap handle intentions.
     *
     * @param context Reference on context of execution.
     * @param builder Reference on currently active notification instance builder.
     */
    private void addHandlers(Context context, Notification.Builder builder) {
        if (canBeShown()) {
            Class activityAction = activityClass(context);
            if (activityAction != null) {
                String packageName = context.getApplicationContext().getPackageName();
                Map<String, Object> payload = new HashMap<>();
                payload.put("userInteraction", true);
                payload.put("foreground", false);
                payload.put("notification", toMap());

                Intent intent = new Intent(context, activityAction);
                intent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
                intent.putExtra("notification", CENCollections.bundleFrom(payload));

                PendingIntent pendingIntent = PendingIntent.getActivity(context, id(), intent,
                        PendingIntent.FLAG_UPDATE_CURRENT);
                builder.setContentIntent(pendingIntent);

                if (actions != null && actions.size() > 0) {
                    for (Object action : actions) {
                        Map<String, Object> actionPayload = new HashMap<>();
                        actionPayload.putAll(payload);
                        actionPayload.put("action", action);

                        Intent actionIntent = new Intent();
                        actionIntent.setAction(packageName + "." + action);
                        actionIntent.putExtra("notification", CENCollections.bundleFrom(actionPayload));

                        PendingIntent pendingActionIntent = PendingIntent.getBroadcast(context, id(), actionIntent,
                                PendingIntent.FLAG_UPDATE_CURRENT);
                        builder.addAction(0, (String) action, pendingActionIntent);
                    }
                }

                Intent deleteIntent = new Intent(context, CENNotificationsBroadcastListener.class);
                deleteIntent.setAction("com.pubnub.cennotifications.NOTIFICATION_DELETED");
                deleteIntent.putExtra("notification", CENCollections.bundleFrom(payload));
                PendingIntent pendingDeleteIntent = PendingIntent.getBroadcast(context, id(), deleteIntent,
                        PendingIntent.FLAG_UPDATE_CURRENT);
                builder.setDeleteIntent(pendingDeleteIntent);
            }
        }
    }

    /**
     * Extract activity class which should be shown on user-tap on notification's content.
     *
     * @param context Reference on code execution context.
     * @return Class build from click action activity name or main activity class (launcher activity).
     */
    private Class activityClass(Context context) {
        Class activityAction = null;
        if (clickAction() != null && clickAction().length() > 0) {
            try {
                activityAction = Class.forName(clickAction());
            } catch (ClassNotFoundException exception) {
                CENNotificationsHelper.Loge("Unable to get '" + clickAction() + "' activity class.", exception);
            }
        }

        return activityAction != null ? activityAction : CENNotificationsHelper.launcherActivity(context);
    }

    private Integer anyIconResourceId(String packageName, Resources resources, String[] resourceNames) {
        for (String resourceName : resourceNames) {
            Integer resourceId = resources.getIdentifier(resourceName, "mipmap", packageName);
            if (resourceId != 0)
                return resourceId;
        }
        return 0;
    }

    private Integer iconResourceId(String packageName, Resources resources, String resourceName) {
        return resourceName != null ? resources.getIdentifier(resourceName, "mipmap", packageName) : 0;
    }

    @Nullable
    private Bitmap bitmapForIcon(String packageName, Resources resources, String iconName) {
        Integer resourceId = iconResourceId(packageName, resources, iconName);
        if (resourceId != 0) {
            return BitmapFactory.decodeResource(resources, resourceId);
        }
        return null;
    }

    /**
     * Populate notification properties with default values which is available (AndroidManifest) or pre-defined by this
     * module.
     *
     * @param context Reference on code execution context.
     */
    private void setDefaults(Context context) {
        String packageName = context.getApplicationContext().getPackageName();
        Resources resources = context.getApplicationContext().getResources();

        Random random = new Random(System.currentTimeMillis());
        id(random.nextInt());
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            visibility(Notification.VISIBILITY_PUBLIC);
        }

        try {
            PackageManager packageManager = context.getApplicationContext().getPackageManager();
            ApplicationInfo applicationInfo = packageManager.getApplicationInfo(packageName, PackageManager.GET_META_DATA);

            // Check and use default notification channel from AndroidManifest file.
            if (applicationInfo.metaData.containsKey("com.google.firebase.messaging.default_notification_channel_id")) {
                channelId(applicationInfo.metaData.getString("com.google.firebase.messaging.default_notification_channel_id"));
            }
            // Check and use default notification icon from AndroidManifest file.
            if (applicationInfo.metaData.containsKey("com.google.firebase.messaging.default_notification_icon")) {
                smallIcon(applicationInfo.metaData.getInt("com.google.firebase.messaging.default_notification_icon"));
            }
            // Check and use default notification icon color from AndroidManifest file.
            if (applicationInfo.metaData.containsKey("com.google.firebase.messaging.default_notification_color")) {
                color(applicationInfo.metaData.getInt("com.google.firebase.messaging.default_notification_icon"));
            }
        } catch (Exception exception) {
            CENNotificationsHelper.Loge("Unable to get application information", exception);
        }

        if (smallIcon() == 0)
            smallIcon(anyIconResourceId(packageName, resources, new String[]{ "ic_notification", "ic_launcher" }));
        smallIconName(resources.getResourceEntryName(smallIcon()));
        largeIcon(bitmapForIcon(packageName, resources, "ic_launcher"));
        largeIconName("ic_launcher");
    }

    /**
     * Set default notification title using application's name.
     *
     * @param context Reference on code execution context.
     */
    private void setDefaultTitle(Context context) {
        if (contentTitle() == null) {
            PackageManager packageManager = context.getApplicationContext().getPackageManager();
            contentTitle(packageManager.getApplicationLabel(context.getApplicationInfo()).toString());
        }
    }

    /**
     * List of constants which bound to platform constants.
     * @return Map of JS constant name to platform constants.
     */
    public static Map<String, Object> constants() {
        final Map<String, Object> constants = new HashMap<>();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            constants.put(CATEGORY_ALARM, Notification.CATEGORY_ALARM);
            constants.put(CATEGORY_CALL, Notification.CATEGORY_CALL);
            constants.put(CATEGORY_EMAIL, Notification.CATEGORY_EMAIL);
            constants.put(CATEGORY_ERROR, Notification.CATEGORY_ERROR);
            constants.put(CATEGORY_EVENT, Notification.CATEGORY_EVENT);
            constants.put(CATEGORY_MESSAGE, Notification.CATEGORY_MESSAGE);
            constants.put(CATEGORY_PROGRESS, Notification.CATEGORY_PROGRESS);
            constants.put(CATEGORY_PROMO, Notification.CATEGORY_PROMO);
            constants.put(CATEGORY_RECOMMENDATION, Notification.CATEGORY_RECOMMENDATION);
            constants.put(CATEGORY_SERVICE, Notification.CATEGORY_SERVICE);
            constants.put(CATEGORY_SOCIAL, Notification.CATEGORY_SOCIAL);
            constants.put(CATEGORY_STATUS, Notification.CATEGORY_STATUS);
            constants.put(CATEGORY_SYSTEM, Notification.CATEGORY_SYSTEM);
            constants.put(CATEGORY_TRANSPORT, Notification.CATEGORY_TRANSPORT);

            constants.put(VISIBILITY_PRIVATE, Notification.VISIBILITY_PRIVATE);
            constants.put(VISIBILITY_PUBLIC, Notification.VISIBILITY_PUBLIC);
            constants.put(VISIBILITY_SECRET, Notification.VISIBILITY_SECRET);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            constants.put(CATEGORY_REMINDER, Notification.CATEGORY_REMINDER);
        }

        if (Build.VERSION.SDK_INT >= 26) {
            constants.put(BADGE_ICON_NONE, Notification.BADGE_ICON_NONE);
            constants.put(BADGE_ICON_SMALL, Notification.BADGE_ICON_SMALL);
            constants.put(BADGE_ICON_LARGE, Notification.BADGE_ICON_LARGE);

            constants.put(GROUP_ALERT_ALL, Notification.GROUP_ALERT_ALL);
            constants.put(GROUP_ALERT_CHILDREN, Notification.GROUP_ALERT_CHILDREN);
            constants.put(GROUP_ALERT_SUMMARY, Notification.GROUP_ALERT_SUMMARY);
        }

        constants.put(DEFAULT_ALL, Notification.DEFAULT_ALL);
        constants.put(DEFAULT_SOUND, Notification.DEFAULT_SOUND);
        constants.put(DEFAULT_VIBRATE, Notification.DEFAULT_VIBRATE);
        constants.put(DEFAULT_LIGHTS, Notification.DEFAULT_LIGHTS);

        constants.put(PRIORITY_DEFAULT, Notification.PRIORITY_DEFAULT);
        constants.put(PRIORITY_HIGH, Notification.PRIORITY_HIGH);
        constants.put(PRIORITY_LOW, Notification.PRIORITY_LOW);
        constants.put(PRIORITY_MAX, Notification.PRIORITY_MAX);
        constants.put(PRIORITY_MIN, Notification.PRIORITY_MIN);

        return constants;
    }
}
