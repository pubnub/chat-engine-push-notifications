package com.pubnub.chatonreact;

import javax.annotation.Nullable;

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


public class InviteUserActivity extends CEPNReactActivity {

    @Nullable
    @Override
    protected String getMainComponentName() {
        return "CEPNInviteUserView";
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Toolbar toolbar = findViewById(R.id.toolbar);
        toolbar.setTitle("Invite");
    }

    void addReactNativeView(ReactRootView reactRootView) {
        setContentView(R.layout.activity_invite_user);
        LinearLayout container = findViewById(R.id.react_native_holder);

        RelativeLayout.LayoutParams params = new RelativeLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        );

        container.addView(reactRootView, params);

        Toolbar toolbar = findViewById(R.id.toolbar);
        Button cancelButton = new Button(this);
        cancelButton.setText("Cancel");
        cancelButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                onCancelButtonTap(view);
            }
        });
        Toolbar.LayoutParams cancelButtonLayout = new Toolbar.LayoutParams(Toolbar.LayoutParams.WRAP_CONTENT,
                Toolbar.LayoutParams.WRAP_CONTENT);
        cancelButtonLayout.gravity = Gravity.END;
        cancelButton.setLayoutParams(cancelButtonLayout);
        toolbar.addView(cancelButton);
    }

    @Nullable
    Bundle launchOptions() {
        return CENCollections.bundleFrom(CENCollections.getFromBundle(instanceState, "chat"));
    }

    private void onCancelButtonTap(View button) {
        this.finish();
    }
}
