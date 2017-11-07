package com.pubnub.cennotifications.modules;

import java.util.List;
import java.util.Map;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

import android.os.Bundle;
import com.pubnub.cennotifications.helpers.CENCollections;
import com.pubnub.cennotifications.helpers.CENNotificationsHelper;
import com.pubnub.cennotifications.models.CENNotification;


/**
 * System boot up listener to re-schedule delivered notifications.
 */
public class CENNotificationsBroadcastListener extends BroadcastReceiver {

    final private static String NOTIFICATION_DELETED = "com.pubnub.cennotifications.NOTIFICATION_DELETED";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent.getAction().equalsIgnoreCase(Intent.ACTION_BOOT_COMPLETED)) {
            CENNotificationsHelper.Logi("CENNotifications#boot: Reschedule delivered notifications.");
            List<Map<String, Object>> deliveredNotifications = CENNotificationsHelper.deliveredNotifications(context);

            for (Map<String, Object> notification : deliveredNotifications) {
                CENNotifications.onNotification(context, notification, null, null, true);
            }
        } else if (intent.getAction().equalsIgnoreCase(NOTIFICATION_DELETED)) {
            if (intent.hasExtra("notification")) {
                Map notificationIntentPayload = CENCollections.mapFrom(intent.getBundleExtra("notification"));

                if (notificationIntentPayload != null && notificationIntentPayload.containsKey("notification")) {
                    Bundle bundle = CENCollections.bundleFrom(notificationIntentPayload.get("notification"));

                    CENNotifications.onNotificationDelete(context, bundle);
                }
            }
        }
    }
}
