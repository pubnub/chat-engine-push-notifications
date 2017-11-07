package com.pubnub.cennotifications.modules;

import android.app.Activity;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Bundle;

import com.facebook.react.bridge.*;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.pubnub.cennotifications.helpers.CENCollections;
import com.pubnub.cennotifications.helpers.CENNotificationsHelper;
import com.pubnub.cennotifications.models.CENNotification;
import com.pubnub.cennotifications.models.CENNotificationChannel;
import com.pubnub.cennotifications.models.CENNotificationsFormatter;
import me.leolin.shortcutbadger.ShortcutBadger;

import javax.annotation.Nullable;
import java.util.*;


@SuppressWarnings("unused")
public class CENNotifications extends ReactContextBaseJavaModule {

    final private static String BROADCAST_RECEIVED_REMOTE_NOTIFICATION = "CENReceivedRemoteNotification";
    final private static String JS_RECEIVED_REMOTE_NOTIFICATION = "CENReceivedRemoteNotification";
    final private static String BROADCAST_REMOTE_NOTIFICATION_REMOVED = "CENRemovedRemoteNotification";
    final private static String JS_REMOVED_REMOTE_NOTIFICATION = "CENRemovedRemoteNotification";
    final private static String BROADCAST_DID_REGISTER_DEVICE = "CENRegisteredForRemoteNotifications";
    final private static String JS_DID_REGISTER_DEVICE = "CENRegistered";

    final private static String CHAT_ENGINE_SEEN_EVENT = "$.notifications.seen";
    final private static String NOTIFICATION_DEFAULT_EVENT = "com.pubnub.cennotifications.default-event";

    /**
     * Stores reference on callback which is used by native module to pre-format published message.
     */
    private static CENNotificationsFormatter notificationPayloadFormatter = null;

    /**
     * Stores whether JS counterpart is loaded and reported what it is ready to accept events.
     */
    private static boolean listenerIsReady = false;

    /**
     * Stores reference on device's registration token.
     */
    private String registrationToken;

    /**
     * Stores reference on object which map actions to activity class names which should be presented when user tap on
     * corresponding action.
     */
    private Map actionsActivity;


    public CENNotifications(ReactApplicationContext reactContext) {
        super(reactContext);

        // Subscribe on events from Firebase notifications listener service.
        registerForEvents();
    }

    /**
     * React Native native module name.
     * This name used by React Native to map access to this native module from JS code.
     */
    @Override
    public String getName() {
        return "CENNotifications";
    }

    /**
     * Register formatter object which will be called each time when notification payload formatting will be required.
     * Chat engine plugin perform pre-formatting for messages which should be sent as push notifications, but it is
     * possible to adjust this information by returning altered dictionary. Formatter's 'format' function will be called
     * synchronously and it can be even called from background queue.
     *
     * If no formatter object will be provided, Chat Engine payload will be used for push notification.
     *
     * @param formatter Reference on object which will be used by native module to pre-format message for push
     *                  notification. Formatter's 'format' function accept only one argument - original data (before
     *                  chat engine formatting) which may allow to device how it should look in notification. Block
     *                  expected to return dictionary with valid payload for push notification under corresponding
     *                  keys: 'apns' (for Apple Push Notifications) and/or 'gcm' (for Android notifications).
     */
    public static void setNotificationPayloadFormatter(CENNotificationsFormatter formatter) {
        notificationPayloadFormatter = formatter;
    }

    @Nullable
    @Override
    public Map<String, Object> getConstants() {
        Map<String, Object> constants = CENNotification.constants();
        constants.putAll(CENNotificationChannel.constants());

        return constants;
    }

    /**
     * Format received message to PubNub package which is suitable for remote notifications triggering. Payload should
     * contain 'apns' and/or 'gcm' keys for platforms which should be reachable for notifications.
     *
     * @param payload  Reference on hash map which contain original Chat Engine content which should be sent to remote
     *                 data consumers.
     * @param callback Reference on function which is used to report formatting results back to module JS counterpart.
     *                 Function accept two parameters: payload - reference on user-formatted notification payload;
     *                 canHandle - whether native module is able to handle format request or not (in case if formatter
     *                 not passed).
     */
    @ReactMethod
    public void formatNotificationPayload(ReadableMap payload, Callback callback) {
        CENNotificationsHelper.Logi("NativeModule#formatNotificationPayload");

        Map<String, Map> formattedPayload = null;
        if (notificationPayloadFormatter != null) {

            formattedPayload = notificationPayloadFormatter.format(CENCollections.mapFrom(payload));
        }
        callback.invoke(CENCollections.rnCollectionFrom(formattedPayload),
                notificationPayloadFormatter != null);
    }

    /**
     * Placeholder function which can't be used in a way as iOS allow to. Caller will receive default value which is set
     * to -1.
     *
     * @param callback Reference on function which is used by React Native to return calling code requested data.
     */
    @ReactMethod
    public void applicationIconBadgeNumber(Callback callback) {
        CENNotificationsHelper.Logi("CENNotifications#applicationIconBadgeNumber");
        callback.invoke(-1);
    }

    /**
     * Update application's icon badge number with passed value.
     *
     * @param number Value which should be shown on application's badge number. Zero and less will remove badge from
     *               application's icon.
     */
    @ReactMethod
    public void setApplicationIconBadgeNumber(Integer number) {
        CENNotificationsHelper.Logi("CENNotifications#setApplicationIconBadgeNumber: " + number);
        ShortcutBadger.applyCount(getReactApplicationContext(), number);
    }

    @ReactMethod
    public void registerNotificationChannels(ReadableArray channels) {
        CENNotificationsHelper.Logi("CENNotifications#registerNotificationChannels");
        final Context context = this.getReactApplicationContext();
        List channelsList = CENCollections.listFrom(channels);
        if (channelsList != null) {
            for (Object channel : channelsList)
                (new CENNotificationChannel(context, channel)).register(context);
        }
    }

    @ReactMethod
    public void registerNotificationActions(ReadableMap actions) {
        CENNotificationsHelper.Logi("CENNotifications#registerNotificationActions");
        final Context context = this.getReactApplicationContext();
        Map actionsMap = CENCollections.mapFrom(actions);
        if (actionsMap != null) {
            actionsActivity = actionsMap;
            final ReactContext reactContext = getReactApplicationContext();
            String packageName = reactContext.getPackageName();
            IntentFilter filter = new IntentFilter();
            Set actionsList = actionsMap.keySet();
            for (Object action : actionsList)
                filter.addAction(packageName + "." + action);

            reactContext.registerReceiver(new BroadcastReceiver() {

                @Override
                public void onReceive(Context context, Intent intent) {
                    Map notificationActionPayload = CENCollections.mapFrom(intent.getBundleExtra("notification"));
                    if (notificationActionPayload != null && notificationActionPayload.containsKey("notification")) {
                        String action = (String) notificationActionPayload.get("action");
                        Map payload = (Map) notificationActionPayload.get("notification");
                        if (payload != null)
                            handleNotificationAction(context, action, payload);
                    }
                }
            }, filter);
        }
    }

    /**
     * Deliver (if any) information about notification passed on launch.
     * Application can be started in response on user tap on notification. This method allow to retrieve this
     * notification data from launch option and send it back to React Native counterpart so event listeners will be
     * called.
     */
    @ReactMethod
    public void deliverInitialNotification() {
        CENNotificationsHelper.Logi("CENNotifications#deliverInitialNotification");
        Activity activity = getCurrentActivity();
        if (activity != null && activity.getIntent().getExtras() != null &&
            activity.getIntent().getExtras().containsKey("notification")) {
            CENNotifications.onNotification(getReactApplicationContext(), activity.getIntent(), null);
        }
    }

    /**
     * Placeholder function which can't be used in a way as iOS allow to. Caller will receive default value which is set
     * to empty dictionary.
     *
     * @param callback Reference on function which is used by React Native to return calling code requested data.
     */
    @ReactMethod
    public void deliveredNotifications(Callback callback) {
        CENNotificationsHelper.Logi("CENNotifications#deliveredNotifications");
        Context context = getReactApplicationContext();
        List<Map<String, Object>> jsPayload = new ArrayList<>();
        List<Map<String, Object>> deliveredNotifications = CENNotificationsHelper.deliveredNotifications(context);

        for (Map<String, Object> payload : deliveredNotifications) {
            CENNotification notification = new CENNotification(getReactApplicationContext(), payload);
            Map<String, Object> deliveredPayload = new HashMap<>();
            Map<String, Object> notificationData = new HashMap<>();

            notificationData.put("notification", notification.toMap());
            notificationData.put("foreground", false);
            notificationData.put("userInteraction", false);

            deliveredPayload.put("date", notification.sentTime());
            deliveredPayload.put("data", notificationData);
            jsPayload.add(deliveredPayload);
        }

        callback.invoke(CENCollections.rnCollectionFrom(jsPayload));
    }

    /**
     * Reschedule all events which has been generated by application and native module before JS counterpart has been
     * loaded and subscribed on them.
     */
    @ReactMethod
    public void receiveMissedEvents() {
        CENNotifications.listenerIsReady = true;
        ReactApplicationContext context = getReactApplicationContext();
        List<Map<String, Object>> storedEvents = CENNotificationsHelper.storedEvents(context);
        CENNotificationsHelper.Logi("CENNotifications#receiveMissedEvents: there is " + storedEvents.size() + " missed events.");

        if (storedEvents.size() > 0) {
            for (Map<String, Object> eventData : storedEvents)
                if (!((String) eventData.get("eventName")).equalsIgnoreCase("CENRegistered"))
                    sendEvent(context, eventData);
            CENNotificationsHelper.clearStoredEvents(context);
        }
        sendRegistrationCompleteEvent(context);
    }


    /////////////////////////////////////////////////////////////////////////////////////////////////
    // Events
    /////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Register on intentions which is broadcast'ed by native module static functions.
     * This is required, because only initialized instances has access to react application context which is required to
     * send event to JS counterpart.
     */
    @SuppressWarnings("unchecked")
    private void registerForEvents() {
        final ReactContext reactContext = getReactApplicationContext();
        String packageName = reactContext.getPackageName();
        IntentFilter registrationIntentFilter = new IntentFilter(packageName + "." + BROADCAST_DID_REGISTER_DEVICE);
        IntentFilter notificationIntentFilter = new IntentFilter(packageName + "." + BROADCAST_RECEIVED_REMOTE_NOTIFICATION);

        reactContext.registerReceiver(new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                Map<String, Object> eventPayload = CENCollections.mapFrom(intent.getExtras());

                sendEvent(reactContext, eventPayload);
            }
        }, registrationIntentFilter);

        reactContext.registerReceiver(new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                Map<String, Object> eventPayload = CENCollections.mapFrom(intent.getExtras());
                if (eventPayload != null) {
                    Map<String, Object> eventBody = (Map<String, Object>) eventPayload.get("eventBody");
                    HashMap<String, Map> notificationPayload = (HashMap<String, Map>)eventBody.get("notification");
                    Map cePayload = notificationPayload.get("cepayload");

                    if (((String) cePayload.get("event")).equalsIgnoreCase(CHAT_ENGINE_SEEN_EVENT))
                        CENNotifications.markNotificationAsSeen(context, new CENNotification(reactContext, notificationPayload));
                    else
                        sendEvent(reactContext, eventPayload);
                }
            }
        }, notificationIntentFilter);
    }

    /**
     * Re-send device registration event if possible.
     *
     * @param reactContext Reference on context from which handler has been called (usually activity or service).
     */
    private void sendRegistrationCompleteEvent(ReactContext reactContext) {
        if (CENNotificationsHelper.registrationToken(reactContext) != null) {
            CENNotifications.onRegistrationComplete(reactContext, CENNotificationsHelper.registrationToken(reactContext));
        }
    }

    /**
     * Send event to JS counterpart with passed payload.
     *
     * @param reactContext Reference on context from which handler has been called (usually activity or service).
     * @param payload      Reference on data which should be sent along with event.
     */
    @SuppressWarnings("unchecked")
    private void sendEvent(ReactContext reactContext, Map<String, Object> payload) {
        if (CENNotifications.listenerIsReady && CENNotificationsHelper.isReactNativeReady(getReactApplicationContext())) {
            String eventName = (String) payload.get("eventName");
            Map<String, Object> eventData = (Map<String, Object>) payload.get("eventBody");
            WritableMap jsPayload = (WritableMap) CENCollections.rnCollectionFrom(eventData);

            if (jsPayload != null)
                reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit(eventName, jsPayload);
        } else {
            CENNotificationsHelper.Logi("CENNotifications#sendEvent: React Native not ready. Store event.");
            CENNotifications.listenerIsReady = false;
            CENNotificationsHelper.storeEvent(reactContext, payload);
        }
    }

    /**
     * Broadcast intention event to all subscribers who would like to process it.
     *
     * @param context         Reference on context from which handler has been called (usually activity or service).
     * @param broadcastFilter Reference on name of broadcast'ed event which is used by intention filters used to
     *                        register for events.
     * @param eventName       Reference on name of event which should be sent to JS counterpart.
     * @param payload         Reference on event's data which should be sent along with it.
     */
    private static void broadcastEvent(Context context, String broadcastFilter, String eventName,
                                       Map<String, Object> payload) {
        HashMap<String, Object> eventPayload = new HashMap<>();
        eventPayload.put("eventName", eventName);
        eventPayload.put("eventBody", payload);

        Bundle extras = CENCollections.bundleFrom(eventPayload);
        if (extras != null) {
            Intent intent = new Intent(context.getPackageName() + "." + broadcastFilter);
            intent.putExtras(extras);
            context.sendBroadcast(intent);
        }
    }

    private void handleNotificationAction(Context context, String action, Object payload) {
        CENNotification notification = new CENNotification(context, CENCollections.bundleFrom(payload));

        if (actionsActivity.get(action) != null && !((String) actionsActivity.get(action)).equalsIgnoreCase("none")) {
            try {
                Class cls;
                if (!((String) actionsActivity.get(action)).equalsIgnoreCase("default")) {
                    cls = Class.forName((String) actionsActivity.get(action));
                } else
                    cls = CENNotificationsHelper.launcherActivity(context.getApplicationContext());

                Intent activityIntent = new Intent(context, cls);
                PendingIntent pendingActionIntent = PendingIntent.getActivity(context,
                        notification.id(), activityIntent, PendingIntent.FLAG_UPDATE_CURRENT);
                pendingActionIntent.send();
            } catch (Exception exception) {
                CENNotificationsHelper.Loge("Unable to handle action", exception);
            }
        }

        CENNotifications.onNotification(context, notification, null, action, false);
    }


    /////////////////////////////////////////////////////////////////////////////////////////////////
    // Notifications
    /////////////////////////////////////////////////////////////////////////////////////////////////

    private static void scheduleNotification(Context context, CENNotification notification, Boolean reScheduled) {
        String chatEngineEvent = notification.chatEngineEvent();
        if (chatEngineEvent != null && !chatEngineEvent.equalsIgnoreCase(CHAT_ENGINE_SEEN_EVENT) && notification.canBeShown()) {
            if (!reScheduled)
                CENNotificationsHelper.storeNotification(context, notification);

            NotificationManager notificationManager = ((NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE));
            if (notificationManager != null) {
                if (notification.tag() != null)
                    notificationManager.notify(notification.tag(), notification.id(), notification.notification(context));
                else
                    notificationManager.notify(notification.id(), notification.notification(context));
            }
        }
    }

    /**
     * Placeholder function which can't be used in a way as iOS allow to.
     * There is no native support for list of received notifications.
     */
    @SuppressWarnings("unchecked")
    private static void markNotificationAsSeen(Context context, CENNotification notification) {
        Map<String, Object> chatEnginePayload = notification.chatEnginePayload();
        String chatEngineEvent = notification.chatEngineEvent();
        if (chatEnginePayload != null && chatEngineEvent != null && chatEngineEvent.equalsIgnoreCase(CHAT_ENGINE_SEEN_EVENT)) {
            NotificationManager notificationManager = ((NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE));
            Map cePayloadData = (Map) chatEnginePayload.get("data");
            if (cePayloadData != null && cePayloadData.containsKey("ceid") && notificationManager != null) {
                String ceid = (String) cePayloadData.get("ceid");

                if (ceid.equalsIgnoreCase("all")) {
                    CENNotificationsHelper.Logi("CENNotifications#markNotificationAsSeen: all notifications.");
                    CENNotificationsHelper.clearDeliveredNotifications(context);
                    notificationManager.cancelAll();
                } else {
                    CENNotificationsHelper.Logi("CENNotifications#markNotificationAsSeen: notifications with " + ceid + " id.");
                    CENNotification deliveredNotification = CENNotificationsHelper.deliveredNotification(context, ceid);
                    if (deliveredNotification != null) {
                        CENNotificationsHelper.removeDeliveredNotification(context, deliveredNotification);
                        notificationManager.cancel(deliveredNotification.id());
                    }
                }

            }
        }
    }


    /////////////////////////////////////////////////////////////////////////////////////////////////
    // Handlers
    /////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Handle device registration process completion.
     * This handler will be called each time when device registration token will be created or updated.
     *
     * @param context Reference on context from which handler has been called (usually activity or service).
     * @param token   Reference on device's registration token used with PubNub API to receive notifications from
     *                certain chats.
     */
    static void onRegistrationComplete(Context context, String token) {
        CENNotificationsHelper.Logi("CENNotifications#onRegistrationComplete: did register with " + token + " token.");
        CENNotificationsHelper.storeRegistrationToken(context, token);
        HashMap<String, Object> tokenPayload = new HashMap<>();
        tokenPayload.put("deviceToken", token);

        CENNotifications.broadcastEvent(context, BROADCAST_DID_REGISTER_DEVICE,
                JS_DID_REGISTER_DEVICE, tokenPayload);
    }

    /**
     * Handle notification which has been received after user tap from notification center (including actions). This
     * handler will mark notification as received on user activity and send with action notification event.
     *
     * @param context Reference on context from which handler has been called (usually activity or service).
     * @param payload Reference on object which contain data representing notification.
     */
    public static void onNotification(Context context, Object payload, @Nullable String sender) {
        String action = null;
        if (payload instanceof Intent) {
            if (((Intent) payload).hasExtra("notification")) {
                action = NOTIFICATION_DEFAULT_EVENT;
                Map notificationIntentPayload = CENCollections.mapFrom(((Intent) payload).getBundleExtra("notification"));

                if (notificationIntentPayload != null && notificationIntentPayload.containsKey("notification")) {
                    if (notificationIntentPayload.containsKey("action"))
                        action = (String) notificationIntentPayload.get("action");
                    payload = CENCollections.bundleFrom(notificationIntentPayload.get("notification"));
                }
            } else
                return;

        }
        onNotification(context, payload, sender, action, false);
    }

    /**
     * Handle notification which has been received from Firebase event listener or after user tap from notification
     * center.
     *
     * @param context     Reference on context from which handler has been called (usually activity or service).
     * @param payload     Reference on object which contain data representing notification.
     * @param action      Reference on name of action which user chosen.
     * @param reScheduled Whether notification has been re-scheduled after device restart or not.
     */
    @SuppressWarnings("unchecked")
    static void onNotification(Context context, Object payload, @Nullable String sender, @Nullable String action,
                               Boolean reScheduled) {

        CENNotification notification;
        if (payload instanceof CENNotification)
            notification = (CENNotification) payload;
        else
            notification = new CENNotification(context, payload, sender);

        // Handle only notifications which has been sent by Chat Engine (using PubNub).
        if (notification.chatEnginePayload() != null) {
            String chatEngineEvent = notification.chatEngineEvent();
            if (chatEngineEvent != null && !chatEngineEvent.equalsIgnoreCase(CHAT_ENGINE_SEEN_EVENT))
                CENNotificationsHelper.Logi("CENNotifications#onNotification: received notification with action: " + action);

            // Update application icon badge number (if any has been passed with notification).
            if (notification.badge() >= 0)
                ShortcutBadger.applyCount(context, notification.badge());

            // Construct notification payload for JS counterpart.
            Boolean foreground = CENNotificationsHelper.isApplicationInForeground(context);
            Map<String, Object> jsPayload = new HashMap<>();
            jsPayload.put("notification", notification.toMap());
            jsPayload.put("userInteraction", action != null);
            jsPayload.put("foreground", !reScheduled && action == null && foreground);
            if (action != null && !action.equalsIgnoreCase(NOTIFICATION_DEFAULT_EVENT)) {
                Map<String, Object> actionPayload = new HashMap<>();
                actionPayload.put("category", notification.chatEngineNotificationCategory());
                actionPayload.put("identifier", action);
                jsPayload.put("action", actionPayload);
            }
            CENNotifications.broadcastEvent(context, BROADCAST_RECEIVED_REMOTE_NOTIFICATION,
                    JS_RECEIVED_REMOTE_NOTIFICATION, jsPayload);

            if (!foreground && action == null)
                scheduleNotification(context, notification, reScheduled);
        }
    }

    static void onNotificationDelete(Context context, Object payload) {
        CENNotification notification = new CENNotification(context, payload);
        if (notification.chatEnginePayload() != null) {
            CENNotificationsHelper.Logi("CENNotifications#onNotificationDelete: remove notification with " +
                    notification.id() + " ID.");

            CENNotificationsHelper.removeDeliveredNotification(context, notification);
        }
    }
}
