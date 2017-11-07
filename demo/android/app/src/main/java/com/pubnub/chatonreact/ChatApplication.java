package com.pubnub.chatonreact;

import java.util.Arrays;
import java.util.List;

import android.app.Application;

import android.content.Intent;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;

import com.pubnub.cennotifications.CENNotificationsPackage;
import com.pubnub.cennotifications.helpers.CENNotificationsHelper;
import com.pubnub.chatonreact.module.CEPNPackage;

public class ChatApplication extends Application implements ReactApplication {

    private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
        @Override
        public boolean getUseDeveloperSupport() {
            return BuildConfig.DEBUG;
        }

        @Override
        protected List<ReactPackage> getPackages() {
            return Arrays.<ReactPackage>asList(
                    new MainReactPackage(),
                    new CENNotificationsPackage(),
                    new CEPNPackage()
            );
        }
    };

    @Override
    public ReactNativeHost getReactNativeHost() { return mReactNativeHost; }

    @Override
    public void onCreate() {
        super.onCreate();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (!Settings.canDrawOverlays(this)) {
                Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:" + getPackageName()));
                startActivity(intent);
            }
        }
        SoLoader.init(this, false);
    }
}
