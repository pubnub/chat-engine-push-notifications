package com.pubnub.chatonreact;

import javax.annotation.Nullable;

import android.os.Bundle;
import android.view.KeyEvent;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactRootView;
import com.pubnub.cennotifications.helpers.CENNotificationsHelper;


abstract class CEPNReactActivity extends ReactActivity {
    protected Bundle instanceState;
    private ReactRootView mReactRootView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        this.instanceState = getIntent().getExtras();
        super.onCreate(savedInstanceState);
    }

    @Override
    protected ReactActivityDelegate createReactActivityDelegate() {
        final CEPNReactActivity context = this;

        return new ReactActivityDelegate(this, getMainComponentName()) {
            /**
             * Override react root view content set to add it inside of existing interface layout.
             * @param savedInstanceState Reference on Bundle which may hold additional information required for activity
             *                           layout.
             */
            @Override
            protected void onCreate(Bundle savedInstanceState) {
                Bundle activityLaunchOptions = context.launchOptions();
                Bundle launchOptions = getLaunchOptions();
                if (launchOptions == null && activityLaunchOptions != null)
                    launchOptions = new Bundle();

                if (activityLaunchOptions != null)
                    launchOptions.putAll(activityLaunchOptions);

                context.mReactRootView = createRootView();
                context.mReactRootView.startReactApplication(
                        getReactNativeHost().getReactInstanceManager(),
                        getMainComponentName(),
                        launchOptions);
                context.addReactNativeView(context.mReactRootView);
            }

            @Override
            public boolean onKeyUp(int keyCode, KeyEvent event) {
                if (getReactNativeHost().hasInstance() && getReactNativeHost().getUseDeveloperSupport()) {
                    if (keyCode == KeyEvent.KEYCODE_MENU) {
                        getReactNativeHost().getReactInstanceManager().showDevOptionsDialog();
                        return true;
                    }
                }
                return false;
            }

            @Override
            protected void onDestroy() {
                if (context.mReactRootView != null) {
                    context.mReactRootView.unmountReactApplication();
                    context.mReactRootView = null;
                }
                if (getReactNativeHost().hasInstance()) {
                    getReactNativeHost().getReactInstanceManager().onHostDestroy(context);
                }
            }
        };
    }

    abstract void addReactNativeView(ReactRootView reactRootView);

    @Nullable
    abstract Bundle launchOptions();
}
