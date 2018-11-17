/**
 * @file Published event formatter.
 * @author Serhii Mamontov <sergey@pubnub.com>
 */
import { NativeModules } from 'react-native';
import { TypeValidator, throwError } from './utils';

const { CENNotifications } = NativeModules;

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
     * @return {String} Formatted category based on event or `null` in case if unexpected data has been passed.
     *
     * @throws {TypeError} in case if passed `event` is empty or has unexpected data type (string expected).
     */
    static category(event) {
        if (!TypeValidator.isTypeOf(event, String) || TypeValidator.isEmpty(event)) {
            throwError(new TypeError('Unexpected event: empty or has unexpected data type (string expected).'));
            return null;
        }
        return `com.pubnub.chat-engine.${event.indexOf('$') === 0 ? event.slice(event.indexOf('.') === 1 ? 2 : 1) : event}`;
    }

    /**
     * Extract chat name from {@link Chat} channel name (last component).
     *
     * @param {String} chatChannel - Reference on {@link Chat} channel name.
     * @return {String} Reference on real chat name which has been passed by {@link Me} or `null` in case if unexpected data has been passed.
     *
     * @throws {TypeError} in case if passed `chatChannel` is empty or has unexpected data type (string expected).
     * @private
     */
    static chatName(chatChannel) {
        if (!TypeValidator.isTypeOf(chatChannel, String) || TypeValidator.isEmpty(chatChannel)) {
            throwError(new TypeError('Unexpected chat channel name: empty or has unexpected data type (string expected).'));
            return null;
        }
        const components = chatChannel.split('#');
        return components.length === 1 ? components[0] : components[components.length - 1];
    }

    /**
     * Default notification payload formatter which is used if user didn't provided any to react native or native module counterpart.
     *
     * @param {ChatEngineEventPayload} eventPayload - Reference on payload which has been emitted with {@link Event}.
     * @param {CEPlatforms} platforms - Reference on list of platforms for which payload should be composed.
     * @param {String} [messageKey='message'] - Name of key under which stored published message, which should be handled by default formatter.
     * @return {Object} Reference on modified {@link Event} payload which include keys required to trigger remote notification sending for requested
     *     {@link CEPlatforms}.
     */
    static notifications(eventPayload, platforms, messageKey = 'message') {
        if (!CENotificationFormatter.verifyChatEnginePayload(eventPayload)) {
            return {};
        }

        let chatName = CENotificationFormatter.chatName(eventPayload.chat.channel);

        if (chatName === null || chatName === undefined) {
            return {};
        }

        let notificationsPayload = {};
        const gatewayMap = { ios: 'apns', android: 'gcm' };
        let notificationTitle = null;
        let notificationBody = null;
        let notificationTicker = null;
        let notificationCategory = null;
        if (eventPayload.event === 'message') {
            notificationTitle = `${eventPayload.sender} send message in ${chatName}`;
            notificationBody = eventPayload.data[messageKey];
            notificationTicker = 'New chat message';
            notificationCategory = CENNotifications.CATEGORY_MESSAGE;
        } else if (eventPayload.event === '$.invite') {
            chatName = CENotificationFormatter.chatName(eventPayload.data.channel);
            if (chatName === null || chatName === undefined) {
                return {};
            }

            notificationTitle = `Invitation from ${eventPayload.sender}`;
            notificationBody = `${eventPayload.sender} invited you to join '${chatName}'`;
            notificationTicker = 'New invitation to chat';
            notificationCategory = CENNotifications.CATEGORY_SOCIAL;
        }

        if (TypeValidator.isDefined(notificationTitle) && TypeValidator.isDefined(notificationBody)) {
            Object.keys(platforms).forEach((platform) => {
                let notificationPayload = {};
                if (platforms[platform] === true) {
                    if (platform === 'ios') {
                        notificationPayload.aps = { alert: { title: notificationTitle, body: notificationBody } };
                    } else {
                        notificationPayload.data = { contentTitle: notificationTitle, contentText: notificationBody, ticker: notificationTicker };
                        if (TypeValidator.isDefined(notificationCategory)) {
                            notificationPayload.data.category = notificationCategory;
                        }

                        if (eventPayload.event === '$.invite') {
                            notificationPayload.data.actions = ['Accept', 'Ignore'];
                        }
                    }
                    notificationsPayload[gatewayMap[platform]] = notificationPayload;
                }
            });
        }

        return notificationsPayload;
    }

    /**
     * Construct payload of notification which is used to notify other user devices what particular notification already seen.
     *
     * @param {ChatEngineEventPayload} payload - Reference on payload which has been emitted with {@link Event}.
     * @param {CEPlatforms} platforms - Reference on list of platforms for which payload should be composed.
     * @return {Object} Reference on modified {@link Event} payload which include keys required to trigger remote notification sending for requested
     *     {@link CEPlatforms}.
     */
    static seenNotification(payload, platforms) {
        if (!CENotificationFormatter.verifyChatEnginePayload(payload)) {
            return {};
        }
        if (!TypeValidator.isDefined(payload.data.eid) || !TypeValidator.sequence(payload.data.eid, [['isTypeOf', String], 'notEmpty'])) {
            throwError(new TypeError('Unexpected EID: empty or has unexpected type (string expected).'));
            return {};
        }

        const cepayload = Object.assign({ }, { data: payload.data });
        const notification = {};
        Object.keys(platforms).forEach((platform) => {
            if (platforms[platform] === true) {
                if (platform === 'ios') {
                    notification.apns = { aps: { 'content-available': 1, sound: '' }, cepayload };
                } else {
                    notification.gcm = { data: { cepayload } };
                }
            }
        });

        return notification;
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
        if (!CENotificationFormatter.verifyChatEnginePayload(eventPayload)) {
            return eventPayload;
        }

        let category = CENotificationFormatter.category(eventPayload.event);
        const normalizedPayload = Object.assign({}, notificationsPayload);
        let chatEnginePayload = {
            sender: eventPayload.sender,
            chat: eventPayload.chat.channel,
            event: eventPayload.event,
            data: eventPayload.data,
            eid: uuidv4(),
            category
        };

        Object.keys(normalizedPayload).forEach((key) => {
            if (key === 'apns' || key === 'gcm') {
                const notificationPayload = Object.assign({}, normalizedPayload[key]);
                let notificationCEPayload = notificationPayload.cepayload || (notificationPayload.data || {}).cepayload;
                if (!TypeValidator.isDefined(notificationCEPayload)) {
                    notificationCEPayload = {};
                }
                let cepayload = Object.assign({}, chatEnginePayload);
                cepayload.data = Object.assign({}, chatEnginePayload.data, notificationCEPayload.data || {});
                cepayload.category = notificationCEPayload.category || cepayload.category;

                if (key === 'apns') {
                    if (TypeValidator.isDefined(notificationPayload.aps.category)) {
                        cepayload.category = notificationPayload.aps.category;
                    }
                    notificationPayload.aps.category = cepayload.category;
                    notificationPayload.cepayload = cepayload;
                } else {
                    if (notificationPayload.data === null || notificationPayload.data === undefined) {
                        notificationPayload.data = {};
                    }
                    if (TypeValidator.isDefined(notificationPayload.data.category)) {
                        cepayload.category = notificationPayload.data.category;
                    }
                    notificationPayload.data = Object.assign({}, notificationPayload.data, { cepayload });
                }
                delete normalizedPayload[key];
                normalizedPayload[`pn_${key}`] = notificationPayload;
            }
        });
        return Object.assign({}, eventPayload, normalizedPayload);
    }

    /**
     * Verify `payload` which has been received from {@link ChatEngine}.
     *
     * @param {ChatEngineEventPayload} payload - Reference on object which has been sent along with {@link Event}.
     * @return {Boolean} `true` in case if passed object correspond to expected payload from {@link ChatEngine}.
     *
     * @throws {TypeError} in case if one of required parameters is empty or any passed parameters has unexpected data type.
     * @private
     */
    static verifyChatEnginePayload(payload) {
        if (!TypeValidator.isDefined(payload) || !TypeValidator.sequence(payload, [['isTypeOf', Object], 'notEmpty'])) {
            throwError(new TypeError('Unexpected payload: not defined or has unexpected type (Object expected).'));
            return false;
        } else if (!TypeValidator.isDefined(payload.chat) || TypeValidator.isTypeOf(payload.chat, String)) {
            throwError(new TypeError('Unexpected chat: not defined or has unexpected type (Chat instance expected).'));
            return false;
        } else if (!TypeValidator.isDefined(payload.event) || !TypeValidator.sequence(payload.event, [['isTypeOf', String], 'notEmpty'])) {
            throwError(new TypeError('Unexpected event: empty or has unexpected type (string expected).'));
            return false;
        } else if (!TypeValidator.isDefined(payload.sender) || !TypeValidator.sequence(payload.sender, [['isTypeOf', String], 'notEmpty'])) {
            throwError(new TypeError('Unexpected sender: empty or has unexpected type (string expected).'));
            return false;
        } else if (!TypeValidator.isDefined(payload.data) || !TypeValidator.isTypeOf(payload.data, Object)) {
            throwError(new TypeError('Unexpected data: empty or has unexpected type (object expected).'));
            return false;
        }
        return true;
    }
}
