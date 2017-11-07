package com.pubnub.chatonreact.module;

import android.content.Context;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.pubnub.cennotifications.helpers.CENCollections;
import com.pubnub.cennotifications.helpers.CENNotificationsHelper;
import com.pubnub.chatonreact.ChatApplication;

import javax.annotation.Nullable;
import java.util.Map;

public class CEPNBridgeManager {

    static public void sendEvent(Context context, String event, @Nullable Map data) {
        ReactNativeHost nativeHost = ((ChatApplication) context.getApplicationContext()).getReactNativeHost();
        ReactContext reactContext = nativeHost.getReactInstanceManager().getCurrentReactContext();
        if (reactContext != null) {
            Object payload = CENCollections.rnCollectionFrom(data);

            reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit(event, payload);
        }
    }
}
