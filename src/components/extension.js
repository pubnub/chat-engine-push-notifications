/**
 * @file Chat Engine plugin to work with notifications using ReactNative bridge to native API.
 * @author Serhii Mamontov <sergey@pubnub.com>
 */
import { Platform } from 'react-native';
import CENotificationFormatter from '../helpers/formatter';
import CENotifications from './notifications';
import TypeValidator from '../helpers/utils';

/**
 * Stores reference on instances for which `destruct` function has been used. This function should be used when current used is leaving (switching
 * user).
 * @type {CENotificationsExtension[]}
 * @private
 */
const destructingInstances = [];

/**
 * How many times notification state change attempts should be done in case if previous failed because of PAM error.
 * @type {number}
 */
const pamRetryCount = 5;

/**
 * Delay which should be used by timer to retry failed operations submission.
 * @type {number}
 */
const retryDelay = 1000;

/**
 * Basic interface for {@link Chat} class extensions.
 * @private
 */
export class ChatEnginePlugin {
    constructor() {
        /** @type {ChatEngine} */
        this.ChatEngine = null;
        /** @type {Me} */
        this.parent = null;
    }
}


/**
 * Plugin utilize React Native features to make it possible to communicate from JS to native counterpart. This allow to register for notifications
 * (specify notification handling categories for iOS) and be notified when registration completes or when notification has been received.
 */
export class CENotificationsExtension extends ChatEnginePlugin {
    /**
     * Create and configure {@link ChatEngine} plugin to work with push notifications.
     *
     * @param {!CEConfiguration} configuration - Push notification registration/handling options.
     * @listens {$.notifications.registered} listen event to start push notification management for chat which requested it.
     * @listens {$.notifications.received} listen event to mark received notification as `seen` (if `configuration.markAsSeen` is set to `true`).
     * @listens {$.created.chat} listen event to enable push notifications on just created chat if it explicitly not ignored
     *     (`configuration.ignoredChats`).
     * @listens {$.notifications.connected} listen event to enable push notifications on chat if it explicitly not ignored
     *     (`configuration.ignoredChats`).
     * @listens {$.notifications.disconnected} listen event to disable push notifications on chat.
     * @example <caption>Simple setup</caption>
     * import { plugin } from 'chat-engine-notifications';
     *
     * ChatEngine.protoPlugin('Me', plugin({
     *     events: ['$.invite', 'message'],
     *     platforms: { ios: true, android: true }
     * }));
     * @example <caption>Setup with notification formatter</caption>
     * import { plugin } from 'chat-engine-notifications';
     *
     * ChatEngine.protoPlugin('Me', plugin({
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
     *             return nil;
     *         }
     *         // Send as regular message without notification.
     *         return {};
     *     }
     * }));
     */
    constructor(configuration) {
        CENotificationsExtension.validateConfiguration(configuration);
        CENotificationsExtension.applyDefaultConfigurationValues(configuration);
        super(configuration);
        /**
         * @type {CEConfiguration}
         * @private
         */
        this.configuration = configuration;

        /**
         * Reference on token which has been received by device during registration for remote notifications.
         * @type {?String}
         * @private
         */
        this.notificationToken = null;

        /**
         * Reference on object which store information about current state of things with notifications for {@link Me}'s chats.
         * @type {Object<String, ObservedChatData>}
         * @private
         */
        this.chatsState = {};

        /**
         * Stores whether instance is de-initializing.
         * @type {boolean}
         * @private
         */
        this.destructing = false;

        /**
         * Stores reference on timer which is used to retry push notifications state change for previously failed {@link Chat}s.
         * @type {Number}
         * @private
         */
        this.retryInterval = null;

        /**
         * Stores reference on notification handler for plugin.
         * @type {CENotifications}
         * @private
         */
        this.notifications = new CENotifications(configuration.senderID);
        this.notifications._markNotificationAsSeen = this.notifications.markNotificationAsSeen;
        this.notifications.markNotificationAsSeen = (notification) => {
            this.notifications._markNotificationAsSeen(notification);
            this.markNotificationAsSeen(notification);
        };
        this.notifications._destruct = this.notifications.destruct;
        this.notifications.destruct = () => {
            this.notifications._destruct();
            this.destruct();
        };

        // Register for important notifications.
        /** @type {function(notificationToken: String)} */
        this._onDeviceRegister = token => this.onDeviceRegister(token);
        /** @type {function(notificationToken: CENNotificationPayload)} */
        this._onNotification = payload => this.onNotification(payload);
        /** @type {function(data: Object, chat: Chat)} */
        this._onChatCreate = (data, chat) => this.onChatCreate(data, chat);
        /** @type {function(data: Object, chat: Chat)} */
        this._onChatConnect = (data, chat) => this.onChatConnect(data, chat);
        /** @type {function(data: Object, chat: Chat)} */
        this._onChatDisconnect = (data, chat) => this.onChatDisconnect(data, chat);
    }

    /**
     * Function used by plugin management system to complete plugin initialization.
     * @private
     */
    construct() {
        /** @type CENotifications */
        this.parent.notifications = this.notifications;
        this.parent.notifications.on('$.notifications.registered', this._onDeviceRegister);
        if (this.configuration.markAsSeen) {
            this.parent.notifications.on('$.notifications.received', this._onNotification);
        }
        this.ChatEngine.on('$.created.chat', this._onChatCreate);
        this.ChatEngine.on('$.connected', this._onChatConnect);
        this.ChatEngine.on('$.disconnected', this._onChatDisconnect);
        Object.keys(this.ChatEngine.chats).forEach(chatChannel => this.onChatCreate({}, this.ChatEngine.chats[chatChannel]));
    }

    /**
     * Gracefully de-initialization.
     * Function should be used for cases like: user logout or user switch.
     */
    destruct() {
        this.destructing = true;
        destructingInstances.push(this);

        // Stop listening events from other modules.
        this.parent.notifications.off('$.notifications.registered', this._onDeviceRegister);
        if (this.configuration.markAsSeen) {
            this.parent.notifications.off('$.notifications.received', this._onNotification);
        }
        this.ChatEngine.off('$.created.chat', this._onChatCreate);
        this.ChatEngine.off('$.connected', this._onChatConnect);
        this.ChatEngine.off('$.disconnected', this._onChatDisconnect);

        // Disable push notifications for all previously enabled chats.
        Object.keys(this.chatsState).forEach((channel) => {
            if (this.chatsState[channel].states.includes('ignored')) {
                delete this.chatsState[channel];
            } else {
                const chat = this.ChatEngine.chats[channel];
                if (chat !== null && chat !== undefined) {
                    this.setPushNotificationState(chat, 'disable');
                } else {
                    delete this.chatsState[channel];
                }
            }
        });
        // Try to clean up in case if there is no more observed chats is left.
        this.cleanUp();
    }

    /**
     * Clean up de-initialized notifications plugin.
     * @private
     */
    cleanUp() {
        if (!Object.keys(this.chatsState).length) {
            let instanceIdx = destructingInstances.indexOf(this);
            destructingInstances.splice(instanceIdx, 1);
            this.parent.notifications = null;
        }
    }

    /**
     * Replacement for function which is used to mark passed `notification` as seen on all devices which is registered for push notification for
     * current user.
     *
     * @param {CENNotificationPayload} notification - Reference on notification which should be marked by native module as 'seen'.
     * @private
     */
    markNotificationAsSeen(notification) {
        if (!TypeValidator.sequence(notification, [['isTypeOf', Object], 'notEmpty',
            ['hasKnownKeys', ['notification', 'foreground', 'userInteraction', 'action', 'completion']]])) {
            throw new TypeError('Unexpected notification: empty or has unexpected data type (object expected) with unknown keys.');
        }
        if (!TypeValidator.sequence(notification.notification, [['isTypeOf', Object], 'notEmpty'])) {
            throw new TypeError('Unexpected notification payload: empty or has unexpected data type (object expected).');
        }
        const { ceid } = notification.notification;
        this.ChatEngine.me.direct.emit('$.notifications.seen', { ceid });
    }

    /**
     * Change push notification state for passed {@link Chat}.
     *
     * @param {Chat} chat - Reference on chat instance from which push notification state should be changed.
     * @param {String} state - Reference on one of: enable or disable.
     * @param {Boolean} [chained=false] - Whether state change has been called for channel which has few states (additional state change has been
     *     issued while previous request wasn't completed).
     * @private
     */
    setPushNotificationState(chat, state, chained = false) {
        if (state === 'erredEnable' || state === 'erredDisable') {
            state = state === 'erredEnable' ? 'enable' : 'disable';
        }
        // Intermediate and unknown states should be ignored.
        if (state !== 'enable' && state !== 'disable') {
            return;
        }
        const enable = state === 'enable';
        let { channel } = chat;

        // Check whether state change for chat is still processing. While there is active requests, new state change should be recorded to be
        // performed after completion.
        const currentState = this.chatsState[channel].states[0];
        if ((currentState === 'enabling' && !enable) || (currentState === 'disabling' && enable)) {
            this.chatsState[channel].states.push(state);
            return;
        }

        // Check whether previous change request not even started and new one switch to opposite state. In this case previous state should be replaced
        // with new one.
        if ((currentState === 'enable' && !enable) || (currentState === 'disable' && enable)) {
            this.chatsState[channel].states = [state];
            chained = true;
        }

        const tokenAvailable = this.notificationToken !== null && this.notificationToken !== undefined;
        if (tokenAvailable && (CENotificationsExtension.canChangeState(this.chatsState[channel].states, state) || chained)) {
            const pushGateway = Platform.OS === 'ios' ? 'apns' : 'gcm';
            const endpoint = this.ChatEngine.pubnub.push[enable ? 'addChannels' : 'removeChannels'];
            this.chatsState[channel].states[0] = enable ? 'enabling' : 'disabling';
            endpoint({ channels: [channel], device: this.notificationToken, pushGateway }, status =>
                this.onPushNotificationStateChangeCompletion(chat, enable, status));
        } else if (!tokenAvailable && this.chatsState[channel].states.length && this.chatsState[channel].states[0] === 'created') {
            this.onPushNotificationStateChangeCompletion(chat, enable, { error: {} });
        }
    }

    /**
     * Retry change of push notification state for previously not completed/failed operations.
     * @private
     */
    startDelayedNotificationStateChange() {
        if (this.retryInterval !== null) {
            clearInterval(this.retryInterval);
        }

        this.retryInterval = setInterval(() => {
            clearInterval(this.retryInterval);
            this.retryInterval = null;
            Object.keys(this.chatsState).forEach((channel) => {
                const states = this.chatsState[channel].states || [];
                const chat = this.ChatEngine.chats[channel];
                if (states.length && chat !== null && chat !== undefined) {
                    this.setPushNotificationState(chat, states[0]);
                }
            });
        }, retryDelay);
    }

    /**
     * Construct `emit` middleware for {@link Chat}.
     *
     * @return {{namespace: String, middleware: { emit: Object }}} Reference on middleware configuration which will allow to handle specified (by
     *     configuration) set of events and modify events payload.
     * @private
     */
    chatMiddlewareExtension() {
        let emit = {};
        this.configuration.events.forEach((event) => { emit[event] = (payload, next) => this.notificationFormatter(event, payload, next); });
        return { namespace: 'chatEngineNotifications.chat', middleware: { emit } };
    }

    /**
     * Event payload formatter.
     * User function will be used to format notification layout (if provided in React environment or through native module) or builtin formatter will
     * be used if there is no other options.
     *
     * @param {String} event - Reference on event for which `payload` should be formatted for notification.
     * @param {ChatEngineEventPayload} payload - Reference on object which contain information sent along with `event`.
     * @param {function(error: Object, payload: Object)} next - Reference on function which should be used to notify about formatting process
     *     completion.
     * @private
     */
    notificationFormatter(event, payload, next) {
        const formatterProvided = (this.configuration.formatter !== null && this.configuration.formatter !== undefined);
        /** @type {Object} */
        let formattedPayload = null;
        payload.event = event;
        payload.data = payload.data || {};

        // Mark notification as seen event.
        if (event === '$.notifications.seen') {
            formattedPayload = CENotificationFormatter.seenNotification(payload);
            next(null, CENotificationFormatter.normalized(payload, formattedPayload));
            return;
        }

        // Process all other events
        if (formatterProvided) {
            formattedPayload = this.configuration.formatter(payload);
        }
        if (!formatterProvided || (formatterProvided && formattedPayload === null)) {
            let nativePayload = {
                event,
                sender: payload.sender,
                chat: payload.chat.channel,
                data: payload.data
            };
            this.parent.notifications.formatNotificationPayload(nativePayload, (nativeFormattedPayload, canFormat) => {
                if (!canFormat || nativeFormattedPayload === null) {
                    formattedPayload = CENotificationFormatter.notifications(payload, this.configuration.platforms);
                } else {
                    formattedPayload = nativeFormattedPayload;
                }
                next(null, CENotificationFormatter.normalized(payload, formattedPayload));
            });
        } else if (formattedPayload !== null && Object.keys(formattedPayload).length) {
            next(null, CENotificationFormatter.normalized(payload, formattedPayload));
        } else {
            next(null, payload);
        }
    }

    /**
     * Handle device registration for remote notification completion.
     *
     * @param {String} notificationToken - Reference on token which should be used by backend to identify target device to which notification for
     *     {@link Chat} should be delivered.
     * @private
     */
    onDeviceRegister(notificationToken) {
        this.notificationToken = notificationToken;
        this.startDelayedNotificationStateChange();
    }

    /**
     * Handle push notification state change REST request completion.
     *
     * @param {Chat} chat - Reference on {@link Chat} instance for which request has been performed.
     * @param {Boolean} enabling - Whether tried to enable or disable push notifications.
     * @param {Object} status - **PubNub** service API call status object.
     * @private
     */
    onPushNotificationStateChangeCompletion(chat, enabling, status) {
        let { channel } = chat;
        const channelState = this.chatsState[channel];

        if (status.error) {
            if (status.error.category === 'PNAccessDeniedCategory') {
                channelState.errorCount += 1;
                if (channelState.errorCount >= pamRetryCount) {
                    channelState.states = ['ignored'];
                }
            } else {
                channelState.states[0] = enabling ? 'erredEnable' : 'erredDisable';
                channelState.errorCount = 0;
            }
            this.startDelayedNotificationStateChange();
        } else {
            channelState.errorCount = 0;
            channelState.states[0] = enabling ? 'enabled' : 'disabled';
            if (channelState.states.length > 1) {
                channelState.states.shift();
                this.setPushNotificationState(chat, channelState.states[0], true);
            } else if (this.destructing) {
                delete this.chatsState[channel];
                this.cleanUp();
            }
        }
    }

    /**
     * Handle new notification received.
     *
     * @param {CENNotificationPayload} notification - Reference on notification which should be marked by native module as 'seen'.
     * @private
     */
    onNotification(notification) {
        this.parent.notifications.markNotificationAsSeen(notification);
    }

    /**
     * Handle new {@link Chat} instance creation.
     *
     * @param {Object} data - Reference on object which is passed along with {@link Chat} creation `event`.
     * @param {Chat} chat - Reference on object which has been created.
     * @private
     */
    onChatCreate(data, chat) {
        if (!this.shouldIgnoreChat(chat)) {
            if (!TypeValidator.isDefined(this.chatsState[chat.channel])) {
                this.chatsState[chat.channel] = { states: ['created'], errorCount: 0 };
                if (this.canManagePushNotifications(chat)) {
                    this.setPushNotificationState(chat, 'enable');
                } else {
                    this.chatsState[chat.channel].states = ['ignored'];
                }
            }

            if (!chat.plugins.filter(plugin => plugin.namespace === 'chatEngineNotifications.chat').length) {
                chat.plugin(this.chatMiddlewareExtension());
            }
        }
    }

    /**
     * Handle connection to {@link Chat}.
     *
     * @param {Object} data - Reference on object which is passed along with {@link Chat} connection `event`.
     * @param {Chat} chat - Reference on object to which {@link ChatEngine} connected.
     * @private
     */
    onChatConnect(data, chat) {
        if (chat.name === 'Chat' && !this.shouldIgnoreChat(chat)) {
            if (this.canManagePushNotifications(chat)) {
                this.setPushNotificationState(chat, 'enable');
            }
        }
    }

    /**
     * Handle disconnection from {@link Chat}.
     *
     * @param {Object} data - Reference on object which is passed along with {@link Chat} disconnection `event`.
     * @param {Chat} chat - Reference on object from which {@link ChatEngine} disconnected.
     * @private
     */
    onChatDisconnect(data, chat) {
        if (chat.name === 'Chat' && !this.shouldIgnoreChat(chat)) {
            if (this.canManagePushNotifications(chat)) {
                this.setPushNotificationState(chat, 'disable');
            }
        }
    }

    /**
     * Apply default values for fields which has been left empty by user.
     *
     * @param {CEConfiguration} configuration - reference on configuration object which should be completed with default values.
     * @private
     */
    static applyDefaultConfigurationValues(configuration) {
        if (!TypeValidator.isDefined(configuration.markAsSeen)) {
            configuration.markAsSeen = false;
        }
        // Add additional channel for exclusion. There is no use for remote users to receive messages for local user activity as notifications.
        configuration.ignoredChats = configuration.ignoredChats || [];
        if (!configuration.ignoredChats.includes('#read.#feed')) {
            configuration.ignoredChats.push('#read.#feed');
        }

        // Add additional event to list of events which should be pre-processed before sending.
        if (!configuration.events.includes('$.notifications.seen')) {
            configuration.events.push('$.notifications.seen');
        }
    }

    /**
     * Validate notification category action options.
     *
     * @param {CEConfiguration} configuration - reference on configuration object which should be completed with default values.
     *
     * @throws {TypeError} in case if one of required parameters is empty or any passed parameters has unexpected data type.
     */
    static validateConfiguration(configuration) {
        if (!TypeValidator.sequence(configuration, [['isTypeOf', Object], 'notEmpty'])) {
            throw new TypeError('Unexpected configuration: empty or has unexpected data type (object expected).');
        } else if (!TypeValidator.sequence(configuration.events, [['isArrayOf', String], 'notEmpty'])) {
            throw new TypeError('Unexpected events: empty or has unexpected data type (array expected) with unexpected data entry type (string ' +
                'expected).');
        } else if (TypeValidator.isDefined(configuration.ignoredChats) && !TypeValidator.isArrayOf(configuration.ignoredChats, String)) {
            throw new TypeError('Unexpected ignored chats: unexpected entries data type (string expected).');
        } else if (!TypeValidator.sequence(configuration.platforms, [['isTypeOf', Object], 'notEmpty', ['hasKnownKeys', ['ios', 'android']],
            ['hasValuesOf', Boolean]])) {
            throw new TypeError('Unexpected platforms: empty or has unexpected type (string expected) with unknown keys and unexpected data entry ' +
                'type (boolean expected).');
        } else if (Platform.OS === 'android' && !TypeValidator.sequence(configuration.senderID, [['isTypeOf', String], 'notEmpty'])) {
            throw new TypeError('Unexpected sender ID: empty or has unexpected data type (string expected).');
        } else if (TypeValidator.isDefined(configuration.markAsSeen) && !TypeValidator.isTypeOf(configuration.markAsSeen, Boolean)) {
            throw new TypeError('Unexpected mark as seen: has unexpected data type (boolean expected).');
        } else if (TypeValidator.isDefined(configuration.formatter) && !TypeValidator.isTypeOf(configuration.formatter, 'function')) {
            throw new TypeError('Unexpected formatter: has unexpected data type (function expected).');
        }
    }

    /**
     * Check whether passed {@link Chat} should be ignored according to passed list or not.
     * @param {Chat} chat - Reference on chat which should be checked.
     * @return {Boolean} `true` in case if chat name is inside of `ignoredChats` list.
     */
    shouldIgnoreChat(chat) {
        let shouldIgnore = false;
        this.configuration.ignoredChats.forEach((chatChannelName) => {
            if (!shouldIgnore && chat.channel.endsWith(chatChannelName)) {
                shouldIgnore = true;
            }
        });
        return shouldIgnore;
    }

    /**
     * Check whether push notifications should be managed for passed {@link Chat} or not.
     * Notifications can be managed for all non-ignored chats and excluding direct {@link Chat} for non-local user.
     *
     * @param {Chat} chat - Reference on {@link Chat} instance for which verification should be done.
     * @return {Boolean} `true` in Case if notification should be enabled.
     * @private
     */
    canManagePushNotifications(chat) {
        let shouldEnabled = true;
        const localUserName = this.ChatEngine.me.uuid;

        // If direct chat, ensure what it is for local user.
        if (chat.channel.endsWith('#write.#direct')) {
            shouldEnabled = chat.channel.endsWith(`${localUserName}#write.#direct`);
        }

        return shouldEnabled;
    }

    /**
     * Check whether chat state can change to specified state or not.
     *
     * @param {String[]} currentStates - Current observed {@link Chat} states (there can be two in case if additional change has been requested when
     *     another request was active).
     * @param {String} targetState - Target state for {@link Chat}.
     * @return {boolean} Whether state transition allowed or not.
     * @private
     */
    static canChangeState(currentStates, targetState) {
        /** @type {Object<String, String[]>} */
        const changeDirections = {
            created: ['enable', 'disable'],
            disable: ['disabling', 'enable'],
            disabling: ['disabled', 'enable'],
            erredDisable: ['disable', 'enable'],
            disabled: ['enable'],
            enable: ['enabling', 'disable'],
            enabling: ['enabled', 'disable'],
            erredEnable: ['enable', 'disable'],
            enabled: ['disable']
        };

        return changeDirections[currentStates[currentStates.length - 1]].includes(targetState);
    }
}
