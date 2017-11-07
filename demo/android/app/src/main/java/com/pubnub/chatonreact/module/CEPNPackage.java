package com.pubnub.chatonreact.module;

import java.util.Collections;
import java.util.List;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import com.pubnub.cennotifications.modules.CENNotifications;


public class CEPNPackage implements ReactPackage {

    /**
     * List of view managers provided by this native modules package.
     *
     * @param reactContext Reference on context for which list has been requested.
     * @return View managers list.
     */
    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }

    /**
     * List of native modules which is bundled with this package.
     *
     * @param reactContext Reference on context for which list has been requested.
     * @return Native modules list.
     */
    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        return  Collections.<NativeModule>singletonList(new CEPNChatManager(reactContext));
    }
}
