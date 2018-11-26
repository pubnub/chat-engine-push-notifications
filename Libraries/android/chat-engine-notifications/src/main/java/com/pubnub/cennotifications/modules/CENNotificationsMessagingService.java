package com.pubnub.cennotifications.modules;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import com.pubnub.cennotifications.helpers.CENNotificationsHelper;


/**
 * Firebase service extension which listens for new remote messages.
 */
public class CENNotificationsMessagingService extends FirebaseMessagingService {

    /**
     * Handle new notifications delivered by FCM.
     * If notification has been sent by Chat Engine it will be serialized and sent to JS counterpart with
     * 'CENReceivedRemoteNotification' event.
     *
     * @param remoteMessage Reference on instance which represent remote notification with extras (if has been sent).
     */
    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        CENNotifications.onNotification(this, remoteMessage, null);
    }

    @Override
    public void onNewToken(String registrationToken) {
        super.onNewToken(registrationToken);

        CENNotificationsHelper.storeRegistrationToken(this, registrationToken);
        CENNotificationsHelper.Logi("CENNotifications#instanceID: did register device with token: " + registrationToken);
        CENNotifications.onRegistrationComplete(this, registrationToken);
    }
}
