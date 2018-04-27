package com.pubnub.chatonreact;

import javax.annotation.Nullable;

import android.content.Intent;
import android.graphics.Typeface;
import android.os.Bundle;
import android.support.v7.widget.Toolbar;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;

import com.facebook.react.ReactRootView;
import com.pubnub.cennotifications.helpers.CENCollections;
import com.pubnub.cennotifications.helpers.CENNotificationsHelper;
import com.pubnub.chatonreact.module.CEPNBridgeManager;

import java.util.HashMap;
import java.util.Map;


public class ChatActivity extends CEPNReactActivity {

    private HashMap chatData;

    @Nullable
    @Override
    protected String getMainComponentName() {
        return "CEPNChatView";
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        chatData = (HashMap) CENCollections.getFromBundle(instanceState, "chat");
        Toolbar toolbar = findViewById(R.id.toolbar);
        toolbar.setTitle((String) chatData.get("name"));
    }

    void addReactNativeView(ReactRootView reactRootView) {
        setContentView(R.layout.activity_chat);
        LinearLayout container = findViewById(R.id.react_native_holder);
        container.addView(reactRootView);

        Typeface materialIcons = Typeface.createFromAsset(getApplicationContext().getAssets(), "fonts/SimpleLineIcons.ttf");
        Toolbar toolbar = findViewById(R.id.toolbar);
        Button inviteButton = new Button(this);
        inviteButton.setText("\uE002");
        inviteButton.setTypeface(materialIcons);
        inviteButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                onInviteButtonTap(view);
            }
        });
        Toolbar.LayoutParams cancelButtonLayout = new Toolbar.LayoutParams(90,
                Toolbar.LayoutParams.WRAP_CONTENT);
        cancelButtonLayout.gravity = Gravity.END;
        inviteButton.setLayoutParams(cancelButtonLayout);
        toolbar.addView(inviteButton);
    }

    @Nullable
    Bundle launchOptions() {
        return CENCollections.bundleFrom(CENCollections.getFromBundle(instanceState, "chat"));
    }

    private void onInviteButtonTap(View button) {
        Map<String, Object> data = new HashMap<>();
        data.put("identifier", "invite.user.button");
        data.put("data", chatData);

        CEPNBridgeManager.sendEvent(this, "$.barButton.tap", data);
    }

    @Override
    public void onBackPressed() {
        super.onBackPressed();

        Map<String, Object> data = new HashMap<>();
        data.put("data", chatData);
        CEPNBridgeManager.sendEvent(this, "$.chat-on-react.chat.close", data);
    }
}
