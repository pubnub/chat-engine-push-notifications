/**
 * @file Default category extension to handle message notifications.
 * @author Serhii Mamontov <sergey@pubnub.com>
 */
import CENotificationCategory from './notification-category';
import CENotificationAction from './notification-action';

/**
 * Describe notification handling category for `message` events (**iOS only**).
 * This class enclose creation of category and actions which is bound to it and will be presented to user, when notification for `message` event will
 * be received.
 *
 * **NOTE:** This notification category will cause notification to appear on sender's device as well. This happen because notification delivered
 * though real-time channels on which device enabled push notification. Since notification is enabled on {@link Chat} it cause all subscribers to
 * receive messages and notifications as well.
 */
export default class CENMessageNotificationCategory extends CENotificationCategory {

    /**
     * Construct message notification handling category.
     *
     * @example <caption>Simple configuration</caption>
     * import { CENInvitationNotificationCategory } from 'chat-engine-notifications';
     *
     * // Initialize with default action buttons: 'Respond' and 'Ignore'.
     * const category = new CENInvitationNotificationCategory();
     */
    constructor() {
        super({ identifier: 'com.pubnub.chat-engine.message', actions: CENMessageNotificationCategory.defaultActions() });
    }

    /**
     * Prepare configuration for default message actions.
     *
     * @return {CENotificationAction[]} List of configuration actions configuration.
     * @private
     */
    static defaultActions() {
        let actions = [];

        actions.push(new CENotificationAction({
            title: 'Respond',
            identifier: 'respond',
            activationMode: 'foreground',
            options: { foreground: true }
        }));

        actions.push(new CENotificationAction({
            title: 'Ignore',
            identifier: 'ignore',
            activationMode: 'background',
            destructive: true,
            options: { foreground: false, destructive: true }
        }));

        return actions;
    }
}
