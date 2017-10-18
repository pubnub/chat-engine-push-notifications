/**
 * @file Default category extension to handle invitation notifications.
 * @author Serhii Mamontov <sergey@pubnub.com>
 */
import CENotificationCategory from './notification-category';
import CENotificationAction from './notification-action';

/**
 * Describe notification handling category for `$.invite` events (**iOS only**).
 * This class enclose creation of category and actions which is bound to it and will be presented to user, when notification for `$.invite` event will
 * be received.
 */
export default class CENInvitationNotificationCategory extends CENotificationCategory {

    /**
     * Construct invitation notification handling category.
     *
     * @example <caption>Simple configuration</caption>
     * import { CENInvitationNotificationCategory } from 'chat-engine-notifications';
     *
     * // Initialize with default action buttons: 'Accept' and 'Ignore'.
     * const category = new CENInvitationNotificationCategory();
     */
    constructor() {
        super({ identifier: 'com.pubnub.chat-engine.invite', actions: CENInvitationNotificationCategory.defaultActions() });
    }

    /**
     * Prepare configuration for default invitation actions.
     *
     * @return {CENotificationAction[]} List of configuration actions configuration.
     * @private
     */
    static defaultActions() {
        let actions = [];

        actions.push(new CENotificationAction({
            title: 'Accept',
            identifier: 'accept',
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
