/**
 * @file Published event formatter.
 * @author Serhii Mamontov <sergey@pubnub.com>
 */
import { Platform } from 'react-native';
import TypeValidator from './utils';

const uuidv4 = require('uuid/v4');


/**
 * Notification formatter helper. Used by {@link CENotifications} to generate default or normalize user-provided notification.
 */
export default class CENotificationFormatter {
    /**
     * Prepare notification cation category name from `event`.
     * Function will clean up event name from `$.` and prepend it with PubNub reverse URI.
     *
     * @param {String} event - Reference on fired by {@link Event} name which should be translated to unique category identifier.
     * @return {String} Formatted category for events.
     *
     * @throws {TypeError} in case if passed `event` is empty or has unexpected data type (string expected).
     */
    static category(event) {
        if (!TypeValidator.isTypeOf(event, String) || TypeValidator.isEmpty(event)) {
            throw new TypeError('Unexpected event: empty or has unexpected data type (string expected).');
        }
        return `com.pubnub.chat-engine.${event.indexOf('$.') === 0 ? event.slice(2) : event}`;
    }

    /**
     * Extract chat name from {@link Chat} channel name (last component).
     *
     * @param {String} chatChannel - Reference on {@link Chat} channel name.
     * @return {String} Reference on real chat name which has been passed by {@link Me}.
     *
     * @throws {TypeError} in case if passed `chatChannel` is empty or has unexpected data type (string expected).
     * @private
     */
    static chatName(chatChannel) {
        if (!TypeValidator.isTypeOf(chatChannel, String) || TypeValidator.isEmpty(chatChannel)) {
            throw new TypeError('Unexpected chat channel name: empty or has unexpected data type (string expected).');
        }
        let components = chatChannel.split('#');
        return components.length === 1 ? components[0] : components[components.length - 1];
    }

    /**
     * Default notification payload formatter which is used if user didn't provided any to react native or native module counterpart.
     *
     * @param {ChatEngineEventPayload} eventPayload - Reference on payload which has been emitted with {@link Event}.
     * @param {CEPlatforms} platforms - Reference on list of platforms for which payload should be composed.
     * @return {Object} Reference on modified {@link Event} payload which include keys required to trigger remote notification sending for requested
     *     {@link CEPlatforms}.
     */
    static notifications(eventPayload, platforms) {
        CENotificationFormatter.verifyChatEnginePayload(eventPayload);
        let notificationsPayload = {};
        let chatName = CENotificationFormatter.chatName(eventPayload.chat.channel);
        const gatewayMap = { ios: 'apns', android: 'gcm' };
        const notificationMap = { ios: 'alert', android: 'notification' };
        const dataKeyMap = { ios: 'cepayload', android: 'data' };
        let chatEnginePayload = {
            sender: eventPayload.sender,
            chat: eventPayload.chat.channel,
            event: eventPayload.event,
            data: eventPayload.data
        };
        Object.keys(platforms).forEach((platform) => {
            if (platforms[platform] === true) {
                let notificationPayload = {};
                if (eventPayload.event === 'message') {
                    notificationPayload[notificationMap[platform]] = {
                        title: `${eventPayload.sender} send message in ${chatName}`,
                        body: eventPayload.data.message
                    };
                } else if (eventPayload.event === '$.invite') {
                    chatName = CENotificationFormatter.chatName(eventPayload.data.channel);
                    notificationPayload[notificationMap[platform]] = {
                        title: `Invitation from ${eventPayload.sender}`,
                        body: `${eventPayload.sender} invited you to join '${chatName}'`
                    };
                }

                if (Object.keys(notificationPayload).length) {
                    if (platform === 'ios') {
                        const alert = notificationPayload[notificationMap[platform]];
                        delete notificationPayload[notificationMap[platform]];
                        notificationPayload.aps = { [notificationMap[platform]]: alert };
                    }
                    notificationPayload[dataKeyMap[platform]] = chatEnginePayload;
                    notificationsPayload[gatewayMap[platform]] = notificationPayload;
                }
            }
        });
        return notificationsPayload;
    }

    /**
     * Construct payload of notification which is used to notify other user devices what particular notification already seen.
     *
     * @param {ChatEngineEventPayload} payload - Reference on payload which has been emitted with {@link Event}.
     * @return {Object} Reference on modified {@link Event} payload which include keys required to trigger remote notification sending for requested
     *     {@link CEPlatforms}.
     */
    static seenNotification(payload) {
        CENotificationFormatter.verifyChatEnginePayload(payload);
        if (Platform.OS === 'ios') {
            return { apns: { aps: { 'content-available': 1, sound: '' }, cepayload: payload.data } };
        }
        return {};
    }

    /**
     * Normalize keys for `notification` layout and merge with `event` payload.
     *
     * @param {ChatEngineEventPayload} eventPayload - Reference on object which has been sent along with {@link Event}.
     * @param {Object} notificationsPayload - Reference on object which contain proper notifications payload for required {@link CEPlatforms}.
     * @return {Object} Reference on  {@link Event} payload which include keys required to trigger remote notification sending for requested
     *     {@link CEPlatforms} and original {@link Event} payload.
     */
    static normalized(eventPayload, notificationsPayload) {
        CENotificationFormatter.verifyChatEnginePayload(eventPayload);
        const chatEngineNotificationID = uuidv4();
        Object.keys(notificationsPayload).forEach((key) => {
            if (key === 'apns' || key === 'gcm') {
                const notificationPayload = notificationsPayload[key];
                if (key === 'apns') {
                    if (eventPayload.event !== '$.notifications.seen') {
                        notificationPayload.aps.category = CENotificationFormatter.category(eventPayload.event);
                    }
                    notificationPayload.ceid = chatEngineNotificationID;
                } else {
                    if (notificationPayload.data === null || notificationPayload.data === undefined) {
                        notificationPayload.data = {};
                    }
                    notificationPayload.data.ceid = chatEngineNotificationID;
                }
                delete notificationsPayload[key];
                notificationsPayload[`pn_${key}`] = notificationPayload;
            }
        });
        return Object.assign({}, eventPayload, notificationsPayload);
    }

    /**
     * Verify `payload` which has been received from {@link ChatEngine}.
     *
     * @param {ChatEngineEventPayload} payload - Reference on object which has been sent along with {@link Event}.
     *
     * @throws {TypeError} in case if one of required parameters is empty or any passed parameters has unexpected data type.
     * @private
     */
    static verifyChatEnginePayload(payload) {
        if (!TypeValidator.isDefined(payload.chat) || TypeValidator.isTypeOf(payload.chat, String)) {
            throw new TypeError('Unexpected chat: not defined or has unexpected type (Chat instance expected).');
        } else if (!TypeValidator.isDefined(payload.event) || !TypeValidator.sequence(payload.event, [['isTypeOf', String], 'notEmpty'])) {
            throw new TypeError('Unexpected event: empty or has unexpected type (string expected).');
        } else if (!TypeValidator.isDefined(payload.sender) || !TypeValidator.sequence(payload.sender, [['isTypeOf', String], 'notEmpty'])) {
            throw new TypeError('Unexpected sender: empty or has unexpected type (string expected).');
        } else if (!TypeValidator.isDefined(payload.data) || !TypeValidator.isTypeOf(payload.data, Object)) {
            throw new TypeError('Unexpected data: empty or has unexpected type (object expected).');
        }
    }
}
