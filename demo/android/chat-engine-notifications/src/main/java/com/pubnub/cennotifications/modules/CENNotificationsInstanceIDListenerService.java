package com.pubnub.cennotifications.modules;

import com.google.firebase.iid.FirebaseInstanceId;
import com.google.firebase.iid.FirebaseInstanceIdService;

import com.pubnub.cennotifications.helpers.CENNotificationsHelper;


/**
 * Firebase service extension which listens for changes in device registration token.
 */
public class CENNotificationsInstanceIDListenerService extends FirebaseInstanceIdService {

    @Override
    public void onTokenRefresh() {
        String registrationToken = FirebaseInstanceId.getInstance().getToken();

        CENNotificationsHelper.storeRegistrationToken(this, registrationToken);
        CENNotificationsHelper.Logi("CENNotifications#instanceID: did register device with token: " + registrationToken);
        CENNotifications.onRegistrationComplete(this, registrationToken);
    }
}
