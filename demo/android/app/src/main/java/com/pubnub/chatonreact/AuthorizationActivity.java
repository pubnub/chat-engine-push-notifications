package com.pubnub.chatonreact;

import javax.annotation.Nullable;

import android.os.Bundle;
import android.support.v7.widget.Toolbar;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.RelativeLayout;

import com.facebook.react.ReactRootView;
import com.pubnub.cennotifications.helpers.CENNotificationsHelper;


public class AuthorizationActivity extends CEPNReactActivity {

    @Nullable
    @Override
    protected String getMainComponentName() {
        return "CEPNAuthorizeUserView";
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Toolbar toolbar = findViewById(R.id.toolbar);
        toolbar.setTitle("Authorize");
    }

    void addReactNativeView(ReactRootView reactRootView) {
        setContentView(R.layout.activity_user_authorize);
        LinearLayout container = findViewById(R.id.react_native_holder);

        RelativeLayout.LayoutParams params = new RelativeLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        );

        container.addView(reactRootView, params);
    }

    @Nullable
    Bundle launchOptions() {
        return null;
    }
}
