/* eslint class-methods-use-this: ["error", { "exceptMethods": ["applicationIconBadgeNumber","setApplicationIconBadgeNumber","requestPermissions","registerNotificationChannels","registerNotificationActions","deliverInitialNotification","deliveredNotifications","markNotificationAsSeen","markAllNotificationAsSeen","formatNotificationPayload"]}] */
/**
 * @file Module which utilize React Native features to communicate with native counterpart.
 * @author Serhii Mamontov <sergey@pubnub.com>
 */
import { DeviceEventEmitter, NativeModules, Platform } from 'react-native';
import { EventEmitter2 } from 'eventemitter2';
import CENotificationCategory from '../models/notification-category';
import { TypeValidator, throwError } from '../helpers/utils';

const { CENNotifications } = NativeModules;

/**
 * Notifications handler for {@link ChatEngine}.
 * Module utilize React Native features to make it possible to communicate from JS to native counterpart. This allow to register for notifications
 * (specify notification handling categories for iOS) and be notified when registration completes or when notification has been received.
 */
export default class CENotifications extends EventEmitter2 {
    /**
     * Constant key to access user input for textInput action type (**iOS only**).
     * @type {string}
     */
    static get USER_INPUT() {
        return 'UIUserNotificationActionResponseTypedTextKey';
    }

    /**
     * Create and configure chat engine notifications handler and represented.
     */
    constructor() {
        super({ newListener: false, maxListeners: 50, verboseMemoryLeak: true });

        /**
         * Stores whether instance is de-initializing.
         * @type {boolean}
         * @private
         */
        this.destructing = false;

        this.subscribeOnNativeModuleEvents();

        /**
         * Inform native module, what React Native part is ready and would like to receive any missed events.
         */
        CENNotifications.receiveMissedEvents();
    }

    /**
     * Gracefully de-initialization.
     * Function should be used for cases like: user logout or user switch.
     */
    destruct() {
        this.destructing = true;
        DeviceEventEmitter.removeAllListeners('CENRegistered');
        DeviceEventEmitter.removeAllListeners('CENFailedToRegister');
        DeviceEventEmitter.removeAllListeners('CENReceivedRemoteNotification');
    }

    /**
     * Retrieve number which is currently shown on application's icon badge.
     *
     * @param {CENApplicationBadgeNumberCallback} callback - Reference on callback function which will be called when native module will be ready to
     *     return value.
     *
     * @example <caption>Get current application icon badge number</caption>
     * import { plugin } from 'chat-engine-notifications';
     *
     * ChatEngine.proto('Me', plugin({
     *     events: ['$.invite', 'message'],
     *     platforms: { ios: true, android: true }
     * }));
     *
     * // Since plugin extend Me, it first should be initialized with Chat Engine connection. As soon as Chat Engine connect user, it will issue
     * // '$.ready' event.
     * ChatEngine.on('$.ready', () => {
     *     ChatEngine.me.notifications.applicationIconBadgeNumber(number =>
     *         console.log('Current icon badge number is:', number));
     * });
     *
     * @throws {TypeError} in case if passed `callback` is not type of _function_.
     */
    applicationIconBadgeNumber(callback) {
        if (Platform.OS === 'ios') {
            if (!TypeValidator.isTypeOf(callback, 'function')) {
                throwError(new TypeError('Unexpected callback: undefined or has unexpected data type (function expected).'));
                return;
            }
            CENNotifications.applicationIconBadgeNumber(callback);
        }
    }

    /**
     * Update number which is shown on application's icon badge.
     *
     * @param {Number} number - Reference on value which should be set as application icon badge number.
     *
     * @example <caption>Set current application icon badge number</caption>
     * import { plugin } from 'chat-engine-notifications';
     *
     * ChatEngine.proto('Me', plugin({
     *     events: ['$.invite', 'message'],
     *     platforms: { ios: true, android: true }
     * }));
     *
     * // Since plugin extend Me, it first should be initialized with Chat Engine connection. As soon as Chat Engine connect user, it will issue
     * // '$.ready' event.
     * ChatEngine.on('$.ready', () => {
     *     ChatEngine.me.notifications.setApplicationIconBadgeNumber(2);
     * });
     *
     * @throws {TypeError} in case if passed `number` is not type of _number_.
     */
    setApplicationIconBadgeNumber(number) {
        if (!TypeValidator.isTypeOf(number, Number)) {
            throwError(new TypeError('Unexpected icon badge number: undefined or has unexpected data type (number expected).'));
            return;
        }
        CENNotifications.setApplicationIconBadgeNumber(number);
    }

    /**
     * Ask native module to request feature access permission with specified categories.
     *
     * @param {CEPermissions} [permissions] - List of features to which push notification would like to have access (**iOS only**).
     * @param {CENotificationCategory[]} [categories] - List of push notifications handling categories (**iOS only**).
     * @throws {Object} Error in case if user refused to grant requested permissions.
     * @return {Promise} Reference on {@link Promise} object which allow to handle request process completion with success or failure.
     *
     * @example <caption>Permissions request</caption>
     * import { plugin } from 'chat-engine-notifications';
     *
     * ChatEngine.proto('Me', plugin({
     *     events: ['$.invite', 'message'],
     *     platforms: { ios: true, android: true }
     * }));
     *
     * // Since plugin extend Me, it first should be initialized with Chat Engine connection. As soon as Chat Engine connect user, it will issue
     * // '$.ready' event.
     * ChatEngine.on('$.ready', () => {
     *     // Passed permissions for multi-platform (iOS/Android) will be ignored when Android will be requested for permissions.
     *     // For Android only application there is no need to pass permissions.
     *     ChatEngine.me.notifications.requestPermissions({alert: true, badge: false, sound: true})
     *         .then(permissions => console.log('Granted with permissions:', JSON.stringify(permissions)))
     *         .catch(error => console.log('Permissions request did fail:', error));
     * });
     *
     * @throws {TypeError} in case if passed `permissions` is not type of _object_ or has unknown keys with non-boolean values.
     * @throws {TypeError} in case if passed `categories` is not type of _array_ of {@link CENotificationCategory} instances.
     */
    async requestPermissions(permissions, categories) {
        if (Platform.OS === 'ios') {
            if (!TypeValidator.sequence(permissions, ['notEmpty', ['hasKnownKeys', ['alert', 'sound', 'badge']], ['hasValuesOf', Boolean]])) {
                return Promise.reject(TypeError('Unexpected permissions: empty or has unexpected data type (object expected) with unknown keys and ' +
                    'value types (boolean expected).'));
            } else if (TypeValidator.notEmpty(categories) && !TypeValidator.isArrayOf(categories, CENotificationCategory)) {
                return Promise.reject(TypeError('Unexpected categories: unexpected categories entry data type (CENotificationCategory instance ' +
                    'expected).'));
            }

            try {
                const serializedCategories = (categories || []).map(category => category.payload());
                return await CENNotifications.requestPermissions(permissions, serializedCategories);
            } catch (error) {
                throw error;
            }
        } else {
            return Promise.resolve({});
        }
    }

    /**
     * Ask native module to register notification channels on Android.
     *
     * @param {NotificationChannelConfiguration[]} channels - List of notification channel configuration objects.
     *
     * @example <caption>Permissions request</caption>
     * import { plugin } from 'chat-engine-notifications';
     *
     * ChatEngine.proto('Me', plugin({
     *     events: ['$.invite', 'message'],
     *     platforms: { ios: true, android: true }
     * }));
     *
     * // Since plugin extend Me, it first should be initialized with Chat Engine connection. As soon as Chat Engine connect user, it will issue
     * // '$.ready' event.
     * ChatEngine.on('$.ready', () =>
     *     ChatEngine.me.notifications.registerNotificationChannels([
     *         { id: 'unique-id , name: 'defaultChannel', lights: false }
     *     ])
     * );
     *
     * @throws {TypeError} in case if passed `actions` is not type of _Array_ or values has unexpected data type.
     */
    registerNotificationChannels(channels) {
        if (Platform.OS === 'android') {
            if (!TypeValidator.isArrayOf(channels, Object)) {
                throwError(new TypeError('Unexpected channels: has unexpected data type (array expected) with unknown value types (object ' +
                    'expected).'));
                return;
            }
            CENNotifications.registerNotificationChannels(channels);
        }
    }

    /**
     * Ask native module to register for notification actions on Android.
     *
     * @param {Object} actions - Object which contain name of actions and target activity name as values. Name should conform to following template
     *     `<package-name>.<path-to-class>.<activity-class-name>`. (**Android only**).
     *     Pass `default` as value to show launcher activity.
     *     Pass `none` as value to keep application closed.
     *
     * @example <caption>Permissions request</caption>
     * import { plugin } from 'chat-engine-notifications';
     *
     * ChatEngine.proto('Me', plugin({
     *     events: ['$.invite', 'message'],
     *     platforms: { ios: true, android: true }
     * }));
     *
     * // Since plugin extend Me, it first should be initialized with Chat Engine connection. As soon as Chat Engine connect user, it will issue
     * // '$.ready' event.
     * ChatEngine.on('$.ready', () => ChatEngine.me.notifications.registerNotificationActions({ Accept: 'JoinScreen', Reject: 'none' }));
     *
     * @throws {TypeError} in case if passed `actions` is not type of _Array_ or values has unexpected data type.
     */
    registerNotificationActions(actions) {
        if (Platform.OS === 'android') {
            if (!TypeValidator.sequence(actions, [['isTypeOf', Object], ['hasValuesOf', String]])) {
                throwError(new TypeError('Unexpected actions: empty or has unexpected data type (array expected) with unknown value types (string ' +
                    'expected).'));
                return;
            }
            CENNotifications.registerNotificationActions(actions);
        }
    }

    /**
     * Try to retrieve push notification payload which has been used to launch application.
     * If any remote notification has been used to open application it will be sent along with `$.notifications.received` event.
     *
     * @example <caption>Request for initial notification</caption>
     * import { plugin } from 'chat-engine-notifications';
     *
     * ChatEngine.proto('Me', plugin({
     *     events: ['$.invite', 'message'],
     *     platforms: { ios: true, android: true }
     *  }));
     *
     * // Since plugin extend Me, it first should be initialized with Chat Engine connection. As soon as Chat Engine connect user, it will issue
     * // '$.ready' event.
     * ChatEngine.on('$.ready', () => {
     *     ChatEngine.me.notifications.on('$.notifications.received', notification => {
     *          // Initial messages delivered with 'foreground' set to 'false'.
     *         if (!notification.foreground) {
     *             console.log(`Received initial notification: ${JSON.stringify(notification.notification)}`);
     *         }
     *     });
     *     ChatEngine.me.notifications.deliverInitialNotification();
     * });
     */
    deliverInitialNotification() {
        CENNotifications.deliverInitialNotification();
    }

    /**
     * Request list of notifications which has been delivered from another {@link ChatEngine} users.
     *
     * @param {CENDeliveredNotificationsCallback} callback - Reference on function which should be called when native module will finish fetching list
     *     of delivered {@link ChatEngine} notifications.
     *
     * @example <caption>Request for all delivered notifications</caption>
     * import { plugin } from 'chat-engine-notifications';
     *
     * ChatEngine.proto('Me', plugin({
     *     events: ['$.invite', 'message'],
     *     platforms: { ios: true, android: true }
     * }));
     *
     * // Since plugin extend Me, it first should be initialized with Chat Engine connection. As soon as Chat Engine connect user, it will issue
     * // '$.ready' event.
     * ChatEngine.on('$.ready', () => {
     *     ChatEngine.me.notifications.deliveredNotifications(notifications => {
     *         notifications.forEach(notification =>
     *             console.log(`Notification received at ${notification.date}: ${JSON.stringify(notification.notification)}`));
     *     });
     * });
     *
     * @throws {TypeError} in case if passed `callback` is not type of _function_.
     */
    deliveredNotifications(callback) {
        if (!TypeValidator.isTypeOf(callback, 'function')) {
            throwError(new TypeError('Unexpected callback: undefined or has unexpected data type (function expected).'));
            return;
        }
        CENNotifications.deliveredNotifications(callback);
    }

    /**
     * Try format message using formatter function from native module (if specified).
     *
     * @param {CENRNNotificationPayload} payload - Reference on object which contain all information which can be useful for notification formatting.
     * @param {CENNotificationsFormatterCallback} callback - Reference on function which will be called by native module formatter method at the end
     *     of data processing.
     *
     * @throws {TypeError} in case if passed `payload` is not type of _object_ or empty.
     * @throws {TypeError} in case if passed `callback` is not type of _function_.
     * @private
     */
    formatNotificationPayload(payload, callback) {
        if (!TypeValidator.sequence(payload, ['notEmpty', ['isTypeOf', Object]])) {
            throwError(new TypeError('Unexpected payload: empty or has unexpected data type (object expected).'));
            return;
        } else if (!TypeValidator.isTypeOf(callback, 'function')) {
            throwError(new TypeError('Unexpected callback: undefined or has unexpected data type (function expected).'));
            return;
        }
        CENNotifications.formatNotificationPayload(payload, callback);
    }

    /**
     * Subscribe on events which is triggered by native part of Rect Native.
     * All {@link CENotifications} prefixed with 'CEN' to make it easier to track them. {@link DeviceEventEmitter} class emit many events and not only
     * from {@link CENotifications}.
     * @private
     */
    subscribeOnNativeModuleEvents() {
        DeviceEventEmitter.addListener('CENRegistered', event => this.onRegister(event));
        DeviceEventEmitter.addListener('CENFailedToRegister', event => this.onRegistrationFail(event));
        DeviceEventEmitter.addListener('CENReceivedRemoteNotification', event => this.onNotification(event));
    }

    /**
     * Handle successful registration on notifications handling.
     *
     * @param {Object} token - Received device push token information object.
     * @param {String} token.deviceToken - Reference on actual device push token which should be used with chat channels registration API.
     *
     * @emits {$.notifications.registered} emit event when native module reported back what device did receive notification token.
     * @private
     */
    onRegister(token) {
        this.emit('$.notifications.registered', token.deviceToken);
    }

    /**
     * Handle failed registration for notifications handling.
     *
     * @param {Object} error - Received registration error explanation.
     *
     * @emits {$.notifications.registration.fail} emit event when native module reported back what device registration did fail.
     * @private
     */
    onRegistrationFail(error) {
        this.emit('$.notifications.registration.fail', error);
    }

    /**
     * Handle incoming push notification.
     *
     * @param {CENNotificationPayload} payload - Reference on object which contain information about pushed data and completion callback (if passed).
     * @emits {$.notifications.received} emit when device receive new remote notification sent by **PubNub** service on request of remote user.
     *
     * @throws {TypeError} in case if passed `notification` is not type of _object_ or empty.
     * @private
     */
    onNotification(payload) {
        if (!TypeValidator.sequence(payload, ['notEmpty', ['isTypeOf', Object]])) {
            throwError(new TypeError('Unexpected payload: empty or has unexpected data type (object expected).'));
            return;
        }

        if (TypeValidator.isTypeOf(payload.action, Object)) {
            if (TypeValidator.isTypeOf(payload.action.completion, 'function')) {
                payload.action.completion();
            }
        } else if (TypeValidator.isTypeOf(payload.completion, 'function')) {
            payload.completion('noData');
        }
        this.emit('$.notifications.received', payload);
    }
}
