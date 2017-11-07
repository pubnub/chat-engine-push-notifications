package com.pubnub.cennotifications.models;

import java.util.Map;


public abstract class CENNotificationsFormatter {

    /**
     * Function which should be used to create notification payloads for required platforms.
     * Payload should contain 'apns' and/or 'gcm' keys for platforms which should be reachable for notification. Content
     * for those keys should conform to target platform requirements to notification payload.
     *
     * @param payload Reference on hash map which contain original Chat Engine content which should be sent to remote
     *                data consumers.
     * @return Formatted
     */
    public abstract Map<String, Map> format(Map payload);
}