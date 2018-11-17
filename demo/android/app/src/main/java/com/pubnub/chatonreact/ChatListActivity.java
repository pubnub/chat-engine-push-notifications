package com.pubnub.chatonreact;

import javax.annotation.Nullable;
import java.util.*;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Bundle;
import android.support.v7.widget.Toolbar;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.RelativeLayout;

import com.facebook.react.ReactRootView;
import com.pubnub.cennotifications.helpers.CENCollections;
import com.pubnub.cennotifications.helpers.CENNotificationsHelper;
import com.pubnub.cennotifications.helpers.CENSerialization;
import com.pubnub.cennotifications.models.CENNotificationsFormatter;
import com.pubnub.cennotifications.modules.CENNotifications;
import com.pubnub.chatonreact.module.CEPNBridgeManager;


public class ChatListActivity extends CEPNReactActivity {

    /**
     * Stores reference on list of added toolbar button identifiers (tags).
     */
    final private List<Integer> barButtonIdentifiers = new ArrayList<>();


    @Nullable
    @Override
    protected String getMainComponentName() {
        return "CEPNChatsListView";
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        String packageName = this.getApplicationContext().getPackageName();
        IntentFilter listTitleVisibleIntentFilter = new IntentFilter(packageName + ".CENListTitleVisible");
        IntentFilter addBarButtonsIntentFilter = new IntentFilter(packageName + ".CENAddBarButtons");

        this.getApplicationContext().registerReceiver(new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                Toolbar toolbar = findViewById(R.id.toolbar);
                toolbar.setTitle(intent.getBooleanExtra("visible", false) ? "Chats" : "");
            }
        }, listTitleVisibleIntentFilter);

        this.getApplicationContext().registerReceiver(new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                Bundle extras = intent.getExtras();
                try {
                    //noinspection unchecked
                    addToolbarButtons((List<Map>) CENCollections.getFromBundle(extras, "buttons"),
                            intent.getStringExtra("position"));
                } catch (Exception exception) {
                    CENNotificationsHelper.Loge("Unable to add buttons", exception);
                }
            }
        }, addBarButtonsIntentFilter);
    }

    @Override
    public void onNewIntent(Intent intent) {
        CENNotifications.onNotification(this, intent, null);
    }

    @Override
    protected void onResume() {
        super.onResume();
        
        if (getIntent() != null)
            onNewIntent(getIntent());
    }

    void addReactNativeView(ReactRootView reactRootView) {
        setContentView(R.layout.activity_chat_list);
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

    private void addToolbarButtons(List<Map> buttons, String position) {
        Toolbar toolbar = findViewById(R.id.toolbar);

        for (Integer buttonID : this.barButtonIdentifiers) {
            Button button = findViewById(buttonID);
            if (button != null) {
                toolbar.removeView(button);
            }
        }
        this.barButtonIdentifiers.clear();

        for (final Map buttonData : buttons) {
            Random random = new Random(System.currentTimeMillis());
            int gravity = Gravity.START;
            if (!position.equalsIgnoreCase("left")) {
                gravity = position.equalsIgnoreCase("center") ? Gravity.CENTER : Gravity.END;
            }
            final Button button = new Button(this);
            Toolbar.LayoutParams buttonLayout = new Toolbar.LayoutParams(116,
                    Toolbar.LayoutParams.WRAP_CONTENT);

            button.setText((String) buttonData.get("title"));
            button.setId(random.nextInt());
            button.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View view) {
                    onButtonClick((String) buttonData.get("identifier"));
                }
            });
            buttonLayout.gravity = gravity;
            button.setLayoutParams(buttonLayout);
            this.barButtonIdentifiers.add(button.getId());
            toolbar.addView(button);
        }
    }


    private void onButtonClick(String identifier) {
        Map<String, String> data = new HashMap<>();
        data.put("identifier", identifier);

        CEPNBridgeManager.sendEvent(this, "$.barButton.tap", data);
    }
}
