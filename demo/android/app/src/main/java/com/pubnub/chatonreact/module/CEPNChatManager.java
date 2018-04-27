package com.pubnub.chatonreact.module;

import android.app.Activity;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Bundle;
import android.util.Log;
import com.facebook.react.bridge.*;
import com.pubnub.cennotifications.helpers.CENNotificationsHelper;
import com.pubnub.cennotifications.helpers.CENSerialization;
import com.pubnub.chatonreact.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class CEPNChatManager extends ReactContextBaseJavaModule {

    @Override
    public String getName() {
        return "CEPNChatManager";
    }


    public CEPNChatManager(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @ReactMethod
    public void setChatsListTitleVisible(Boolean visible) {
        String packageName = this.getReactApplicationContext().getPackageName();
        Intent intent = new Intent(packageName + ".CENListTitleVisible");
        intent.putExtra("visible", visible);
        this.getReactApplicationContext().sendBroadcast(intent);
    }

    @ReactMethod
    public void addBarButtons(ReadableArray buttons, String position, Boolean forMasterActivity) {
        String packageName = this.getReactApplicationContext().getPackageName();
        Intent intent = new Intent(packageName + ".CENAddBarButtons");
        intent.putExtra("buttons", CENSerialization.toJSONString(buttons.toArrayList()));
        intent.putExtra("position", position);
        this.getReactApplicationContext().sendBroadcast(intent);
    }

    @ReactMethod
    public void dismissViewController() {
        ReactApplicationContext context = getReactApplicationContext();
        Activity activeActivity = context.getCurrentActivity();
        if (activeActivity != null) {
            if (!(activeActivity instanceof ChatListActivity)) {
                activeActivity.finish();
            }
        }
    }

    @ReactMethod
    public void showAuthorizationView() {
        ReactApplicationContext context = getReactApplicationContext();
        context.startActivity(new Intent(context, AuthorizationActivity.class));
    }

    @ReactMethod
    public void showChatCreationView() {
        ReactApplicationContext context = getReactApplicationContext();
        context.startActivity(new Intent(context, CreateChatActivity.class));
    }

    @ReactMethod
    public void showChat(ReadableMap chat) {
        ReactApplicationContext context = getReactApplicationContext();
        Intent showIntent = new Intent(context, ChatActivity.class);
        showIntent.putExtra("chat", CENSerialization.toJSONString(chat.toHashMap()));
        context.startActivity(showIntent);
    }

    @ReactMethod
    public void showInviteToChat(ReadableMap chat) {
        ReactApplicationContext context = getReactApplicationContext();
        Intent showIntent = new Intent(context, InviteUserActivity.class);
        showIntent.putExtra("chat", CENSerialization.toJSONString(chat.toHashMap()));
        context.startActivity(showIntent);
    }

}
