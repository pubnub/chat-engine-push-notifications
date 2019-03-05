/**
 * @file Represent notifications handling category. Category allow to group set of actions which can be performed for specific notification.
 * @author Serhii Mamontov <sergey@pubnub.com>
 */
import CENotificationAction from './notification-action';
import { TypeValidator, throwError } from '../helpers/utils';


export default class CENotificationCategory {
    /**
     * Create notification category instance which contain set of actions for specified notification.
     * Target notification defined by 'category' name passed in it and 'identifier' value passed to this instance.
     *
     * @param {NotificationCategoryConfiguration} options - Set of category configuration options.
     * @return {CENotificationCategory} Reference on configured notification category.
     * @see https://developer.apple.com/documentation/usernotifications/unnotificationcategory
     * @see https://developer.apple.com/documentation/uikit/uiusernotificationcategory
     * @example <caption>Simple configuration</caption>
     * import { CENotificationCategory, CENotificationAction } from 'chat-engine-notifications';
     *
     * const openAction = new CENotificationAction({
     *     identifier: 'open-action-identifier',
     *     title: 'Open',
     *     activationMode: 'foreground',
     *     options: { foreground: true }
     * });
     * const ignoreAction = new CENotificationAction({
     *     identifier: 'ignore-action-identifier',
     *     title: 'Ignore',
     *     options: { background: true, destructive: true }
     * });
     *
     * const category = new CENotificationCategory({ identifier: 'my-category-identifier', actions: [openAction, ignoreAction] });
     *
     * @throws {Error} In case if `identifier` is empty/missing or has unexpected data type in passed `options`.
     * @throws {Error} In case if `actions` is empty/missing or has unexpected data type in passed `options`.
     */
    constructor(options) {
        /**
         * @type {NotificationCategoryConfiguration}
         * @private
         */
        this.options = options;
        this.options.context = this.options.context || 'minimal';
        this.options.actions = this.options.actions || [];
        CENotificationCategory.validateOptions(this.options);
    }

    /**
     * Category identifier.
     * @type {String}
     */
    get identifier() {
        return this.options.identifier;
    }

    /**
     * Currently registered notification handling actions.
     * @type {CENotificationAction[]}
     */
    get actions() {
        return this.options.actions;
    }

    /**
     * Serialize category data model.
     *
     * @return {Object} Return payload which can be used by native module to create native category.
     */
    payload() {
        return Object.assign({}, this.options, {
            actions: this.options.actions.map(action => action.payload())
        });
    }

    /**
     * Validate notification category options.
     *
     * @param {NotificationCategoryConfiguration} options - Set of category configuration options.
     * @return {Boolean} `true` in case if passed object correspond to {@link NotificationCategoryConfiguration} object representation.
     *
     * @throws {TypeError} in case if one of required parameters is empty or any passed parameters has unexpected data type.
     */
    static validateOptions(options) {
        if (!TypeValidator.sequence(options.identifier, [['isTypeOf', String], 'notEmpty'])) {
            throwError(new TypeError('Unexpected identifier: empty or has unexpected data type (string expected).'));
            return false;
        }

        if (!TypeValidator.sequenceIfDefined(options.bodyPlaceholder, [['isTypeOf', String], 'notEmpty'])) {
            throwError(new TypeError('Unexpected placeholder: empty or has unexpected data type (string expected).'));
            return false;
        }

        if (!TypeValidator.sequenceIfDefined(options.context, [['isTypeOf', String], ['isOneOf', ['default', 'minimal']]])) {
            throwError(new TypeError('Unexpected context: empty or has unknown value (known: default and minimal).'));
            return false;
        }

        if (!TypeValidator.sequenceIfDefined(options.actions, ['notEmpty', ['isArrayOf', CENotificationAction]])) {
            throwError(new TypeError('Unexpected actions: empty or has unexpected data type (CENotificationAction expected).'));
            return false;
        }
        return true;
    }
}
