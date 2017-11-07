/**
 * @file Represent interactive notifications action. Actions allow to get user decision on how notification should be handled or what should be
 * performed by application after it will be launched.
 * @author Serhii Mamontov <sergey@pubnub.com>
 */
import { TypeValidator, throwError } from '../helpers/utils';


export default class CENotificationAction {
    /**
     * Create instance which will be passed to native module to configure notification actions layout.
     *
     * @param {NotificationActionConfiguration} options - Set of action configuration options.
     * @see https://developer.apple.com/documentation/usernotifications/unnotificationaction
     * @see https://developer.apple.com/documentation/uikit/uiusernotificationaction
     * @example <caption>Simple configuration</caption>
     * import { CENotificationAction } from 'chat-engine-notifications';
     *
     * // Construct action which will bring application to foreground if user pick it.
     * const action = new CENotificationAction({
     *     identifier: 'my-action-identifier',
     *     title: 'My action title',
     *     activationMode: 'foreground',
     *     options: { foreground: true }
     * });
     */
    constructor(options) {
        /**
         * @type {NotificationActionConfiguration}
         * @private
         */
        this.options = options;
        this.options.activationMode = this.options.activationMode || 'background';
        this.options.behavior = this.options.behavior || 'default';
        CENotificationAction.validateOptions(this.options);
    }

    /**
     * Unique action identifier which will be returned back with handler if user tap on it.
     * @type {String}
     */
    get identifier() {
        return this.options.identifier;
    }

    /**
     * Title which should be shown on action button along with notification message.
     * @type {String}
     */
    get title() {
        return this.options.title;
    }

    /**
     * Serialize action data model.
     * @return {Object} Return payload which can be used by native module to create native action.
     */
    payload() {
        return this.options;
    }

    /**
     * Validate notification category action options.
     *
     * @param {NotificationActionConfiguration} options - Set of action configuration options.
     * @return {Boolean} `true` in case if passed object correspond to {@link NotificationActionConfiguration} object representation.
     *
     * @throws {TypeError} in case if one of required parameters is empty or any passed parameters has unexpected data type.
     */
    static validateOptions(options) {
        if (!TypeValidator.sequence(options.identifier, [['isTypeOf', String], 'notEmpty'])) {
            throwError(new TypeError('Unexpected identifier: empty or has unexpected data type (string expected).'));
            return false;
        } else if (!TypeValidator.sequence(options.title, [['isTypeOf', String], 'notEmpty'])) {
            throwError(new TypeError('Unexpected title: empty or has unexpected data type (string expected).'));
            return false;
        } else if (!TypeValidator.sequenceIfDefined(options.activationMode, [['isOneOf', ['foreground', 'background']]])) {
            throwError(new TypeError('Unexpected activation mode: empty or has unknown value (known: foreground and background).'));
            return false;
        } else if (!TypeValidator.sequenceIfDefined(options.authenticationRequired, [['isTypeOf', Boolean]])) {
            throwError(new TypeError('Unexpected authentication: unexpected data type (boolean expected).'));
            return false;
        } else if (!TypeValidator.sequenceIfDefined(options.destructive, [['isTypeOf', Boolean]])) {
            throwError(new TypeError('Unexpected destructive: unexpected data type (boolean expected).'));
            return false;
        } else if (!TypeValidator.sequenceIfDefined(options.behavior, [['isOneOf', ['default', 'textInput']]])) {
            throwError(new TypeError('Unexpected behavior: empty or has unknown value (known: default and textInput).'));
            return false;
        } else if (!TypeValidator.sequenceIfDefined(options.textInput, [['isTypeOf', Object], ['hasKnownKeys', ['title', 'placeholder']],
            ['hasValuesOf', String]])) {
            throwError(new TypeError('Unexpected text input: empty or has unknown parameters (known: title and placeholder) of unknown data type.'));
            return false;
        } else if (!TypeValidator.sequenceIfDefined(options.options, [['isTypeOf', Object],
            ['hasKnownKeys', ['authenticationRequired', 'destructive', 'foreground']], ['hasValuesOf', Boolean]])) {
            throwError(new TypeError('Unexpected options: empty or has unknown parameters (known: authenticationRequired, destructive and foreground) ' +
                'of unknown data type.'));
            return false;
        }
        return true;
    }
}
