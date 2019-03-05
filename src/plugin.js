/* eslint class-methods-use-this:["error",{"exceptMethods":["applicationIconBadgeNumber"]}] */
/**
 * @file {@link ChatEngine} plugin to work with notifications using ReactNative bridge to native API.
 * @author Serhii Mamontov <sergey@pubnub.com>
 */
import CENInvitationNotificationCategory from './models/invitation-notification-category';
import CENMessageNotificationCategory from './models/message-notification-category';
import CENotificationCategory from './models/notification-category';
import CENotificationAction from './models/notification-action';
import { CENotificationsExtension } from './components/extension';

/**
 * Function which allow to create and configure {@link ChatEngine} plugin to work with push
 * notifications.
 * After plugin installation new property will be added to {@link Me} named `notifications` which
 * has same interface as {@link CENotifications}.
 *
 * @example <caption>Simple setup</caption>
 * import { plugin } from 'chat-engine-notifications';
 *
 * ChatEngine.me.plugin(plugin({
 *     events: ['$.invite', 'message'],
 *     platforms: { ios: true, android: true }
 * }));
 * @example <caption>Setup with notification formatter</caption>
 * import { plugin } from 'chat-engine-notifications';
 *
 * ChatEngine.me.plugin(plugin({
 *     events: ['$.invite', 'message'],
 *     platforms: { ios: true, android: true },
 *     formatter: (payload) => {
 *         if (payload.event === 'custom.event') {
 *             return {
 *                 pn_apns: {
 *                     aps: { alert: 'New event received' },
 *                     sender: payload.sender,
 *                     event: payload.event,
 *                     sentToChat: payload.chat.channel,
 *                     sentData: payload.data
 *                 }
  *            };
 *         } else if (payload.event === '$.invite') {
 *             // Use one of default formatter (there is for '$.invite' and 'message' events).
 *             return null;
 *         }
 *         // Send as regular message without notification.
 *         return {};
 *     }
 * }));
 *
 * @param {CEConfiguration} configuration - Plugin configuration object.
 *
 * @return {Object} Configured push notification plugin object.
 */
const plugin = configuration => ({
    namespace: 'chatEngineNotifications.me',
    extends: {
        Me: class Wrapper {
            constructor() { return new CENotificationsExtension(configuration); }
        }
    }
});

module.exports = {
    CENInvitationNotificationCategory,
    CENMessageNotificationCategory,
    CENotificationCategory,
    CENotificationAction,
    plugin
};
