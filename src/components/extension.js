/**
 * @file Chat Engine plugin to work with notifications using ReactNative bridge to native API.
 * @author Serhii Mamontov <sergey@pubnub.com>
 */
import { Platform } from 'react-native';
import CENotificationFormatter from '../helpers/formatter';
import CENotifications from './notifications';
import { TypeValidator, throwError } from '../helpers/utils';

/**
 * Stores reference on instances for which `destruct` function has been used. This function should
 * be used when current used is leaving (switching user).
 * @type {CENotificationsExtension[]}
 * @private
 */
const destructingInstances = [];

/**
 * Maximum length of string with channel names which can be sent with PubNub API at once.
 * @type {number}
 */
const pushNotificationMaximumChannelsLength = 20000;

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
 * Plugin utilize React Native features to make it possible to communicate from JS to native
 * counterpart. This allow to register for notifications (specify notification handling categories
 * for iOS) and be notified when registration completes or when notification has been received.
 */
export class CENotificationsExtension extends ChatEnginePlugin {
    /**
     * Create and configure {@link ChatEngine} plugin to work with push notifications.
     *
     * @param {!CEConfiguration} configuration - Push notification registration/handling options.
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
     *             return nil;
     *         }
     *         // Send as regular message without notification.
     *         return {};
     *     }
     * }));
     */
    constructor(configuration) {
        if (!CENotificationsExtension.validateConfiguration(configuration)) {
            super(configuration);
            return;
        }

        CENotificationsExtension.applyDefaultConfigurationValues(configuration);
        super(configuration);
        /**
         * @type {CEConfiguration}
         * @private
         */
        this.configuration = configuration;

        /**
         * Stores whether instance is de-initializing.
         * @type {boolean}
         * @private
         */
        this.destructing = false;

        /**
         * Stores reference on notification handler for plugin.
         * @type {CENotifications}
         * @private
         */
        this.notifications = new CENotifications();
        /** @public */
        this.notifications.enable = this.enable.bind(this);
        /** @public */
        this.notifications.disable = this.disable.bind(this);
        /** @public */
        this.notifications.disableAll = this.disableAll.bind(this);
        /** @public */
        this.notifications.markNotificationAsSeen = this.markNotificationAsSeen.bind(this);
        /** @public */
        this.notifications.markAllNotificationAsSeen = this.markAllNotificationAsSeen.bind(this);
        this.notifications._destruct = this.notifications.destruct;
        this.notifications.destruct = () => {
            this.notifications._destruct();
            this.destruct();
        };
    }

    /**
     * Function used by plugin management system to complete plugin initialization.
     * @private
     */
    construct() {
        /** @type CENotifications */
        this.parent.notifications = this.notifications;
    }

    /**
     * Gracefully de-initialization.
     * Function should be used for cases like: user logout or user switch.
     */
    destruct() {
        this.destructing = true;
        destructingInstances.push(this);

        // Try to clean up in case if there is no more observed chats is left.
        this.cleanUp();
    }

    /**
     * Clean up de-initialized notifications plugin.
     * @private
     */
    cleanUp() {
        let instanceIdx = destructingInstances.indexOf(this);
        destructingInstances.splice(instanceIdx, 1);
        this.parent.notifications = null;
    }

    /**
     * Enable push notifications on specified list of {@link Chat}s.
     * Device push token can be obtained by subscribing on '$notifications.registered' event as
     * shown in example below.
     *
     * @example <caption>Obtain device push token</caption>
     * ChatEngine.me.notifications.on('$notifications.registered', (devicePushToken) => {
     *     this.devicePushToken = devicePushToken;
     * });
     *
     * @example <caption>Usage example</caption>
     * ChatEngine.me.notifications.enable(ChatEngine.global, this.devicePushToken, (errorStatuses) => {
     *     if (errorStatuses) {
     *         // Handle push notification state change error statues.
     *     } else {
     *         // Push notification for global has been enabled.
     *     }
     * });
     *
     * @param {Array<Chat>} chats List of {@link Chat}s for which remote notification should be
     *     triggered.
     * @param {String} token Device token which has been provided by OS through ReactNative.
     * @param {?function(errorStatuses: Object)} [completion] - Function which will be called at
     *     the end of registration process and pass error (if any).
     */
    enable(chats, token, completion) {
        if (!TypeValidator.isTypeOf(token, String) || !token.length || !chats.length) {
            return;
        }

        this.addChannels(true, chats, token, completion);
    }

    /**
     * Disable push notifications on specified list of {@link Chat}s.
     * Device push token can be obtained by subscribing on '$notifications.registered' event as
     * shown in example below.
     *
     * @example <caption>Obtain device push token</caption>
     * ChatEngine.me.notifications.on('$notifications.registered', (devicePushToken) => {
     *     this.devicePushToken = devicePushToken;
     * });
     *
     * @example <caption>Usage example</caption>
     * ChatEngine.me.notifications.disable(ChatEngine.global, this.devicePushToken, (errorStatuses) => {
     *     if (errorStatuses) {
     *         // Handle push notification state change error statues.
     *     } else {
     *         // Push notification for global has been disabled.
     *     }
     * });
     *
     * @param {Array<Chat>} chats List of {@link Chat}s for which remote notification should be
     *     removed.
     * @param {String} token Device token which has been provided by OS through ReactNative.
     * @param {?function(errorStatuses: Object)} [completion] - Function which will be called at
     *     the end of unregister process and pass error (if any).
     */
    disable(chats, token, completion) {
        if (!TypeValidator.isTypeOf(token, String) || !token.length || !chats.length) {
            return;
        }

        this.addChannels(false, chats, token, completion);
    }

    /**
     * Disable all push notifications for device.
     * Device push token can be obtained by subscribing on '$notifications.registered' event as
     * shown in example below.
     *
     * @example <caption>Obtain device push token</caption>
     * ChatEngine.me.notifications.on('$notifications.registered', (devicePushToken) => {
     *     this.devicePushToken = devicePushToken;
     * });
     *
     * @example <caption>Usage example</caption>
     * ChatEngine.me.notifications.disableAll(this.devicePushToken, (errorStatuses) => {
     *     if (errorStatuses) {
     *         // Handle push notification unregister error statuses.
     *     } else {
     *         // Device has been unregistered from push notification.
     *     }
     * });
     *
     * @param {String} token Device token which has been provided by OS through ReactNative.
     * @param {?function(errorStatuses: Object)} [completion] - Function which will be called at
     *     the end of unregister process and pass error (if any).
     */
    disableAll(token, completion) {
        if (!TypeValidator.isTypeOf(token, String) || !token.length) {
            return;
        }

        this.addChannels(false, null, token, completion);
    }

    /**
     * Change notifications state for specified chats on device.
     * @private
     *
     * @param {Boolean} shouldAddChannels Whether chats has been added to device push notifications
     *     or not.
     * @param {Array<Chat>} chats List of chats for which push notification state has been changed
     *     on device.
     * @param {String} device Device token which has been provided by OS through ReactNative.
     * @param {?function(error: Error)} [completion] - Function which will be called at
     *     the end of modification process and pass error (if any).
     */
    addChannels(shouldAddChannels, chats, device, completion) {
        /** @tuype {Array<Array<String>>} */
        const channelSeries = chats !== null ? CENotificationsExtension.channelSeriesFromChats(chats) : [];
        /** @type {String} */
        const pushGateway = Platform.OS === 'ios' ? 'apns' : 'gcm';
        /** @type {PubNub} */
        const pubNub = this.ChatEngine.pubnub;
        let endpoint = pubNub.push[shouldAddChannels ? 'addChannels' : 'removeChannels'];
        let seriesProcessed = 0;
        /** @type {Array} */
        let errors = [];

        const statusHandler = (status) => {
            seriesProcessed += 1;

            if (status.error) {
                /** @type {Error} */
                let error = status.errorData || null;

                if (error && error.response && error.response.text) {
                    const response = JSON.parse(status.errorData.response.text);

                    if (response && response.payload && response.payload.channels) {
                        const channelNames = response.payload.channels;
                        error.chats = CENotificationsExtension.chatListFromChannelNames(channelNames, this.ChatEngine.me);
                    }
                }

                if (error) {
                    errors.push(error);
                }
            }

            if (seriesProcessed === channelSeries.length || chats === null) {
                if (this.destructing) {
                    return;
                }

                this.onChatsNotificationStateChange(shouldAddChannels, chats, errors, completion);
            }
        };

        if (chats === null) {
            pubNub.push.deleteDevice({ device, pushGateway }, statusHandler);
            return;
        }

        channelSeries.forEach(channels => endpoint({ channels, device, pushGateway }, statusHandler));
    }

    /**
     * Mark passed `notification` as seen on all devices which is registered for push notification
     * for current user.
     *
     * @param {CENNotificationPayload} notification - Reference on notification which should be
     *     marked by native module as 'seen'.
     */
    markNotificationAsSeen(notification) {
        if (!TypeValidator.sequence(notification, [['isTypeOf', Object], 'notEmpty',
            ['hasKnownKeys', ['notification', 'foreground', 'userInteraction', 'action', 'completion']]])) {
            throwError(new TypeError('Unexpected notification: empty or has unexpected data type (object expected) with unknown keys.'));
            return;
        }
        if (!TypeValidator.sequence(notification.notification, [['isTypeOf', Object], 'notEmpty'])) {
            throwError(new TypeError('Unexpected notification payload: empty or has unexpected data type (object expected).'));
            return;
        }

        if (TypeValidator.isDefined(notification.notification.cepayload) && (notification.userInteraction || notification.foreground)) {
            const { eid, event } = notification.notification.cepayload;
            if (TypeValidator.isDefined(eid) && event !== '$notifications.seen') {
                this.parent.notifications.emit('$notifications.seen');
                this.ChatEngine.me.direct.emit('$notifications.seen', { eid });
            }
        }
    }

    /**
     * Mark all notifications as seen on all devices which is registered for push notifications for
     * current user.
     */
    markAllNotificationAsSeen() {
        this.parent.notifications.emit('$notifications.seen');
        this.ChatEngine.me.direct.emit('$notifications.seen', { eid: 'all' });
    }

    /**
     * Construct `emit` middleware for {@link Chat}.
     * @private
     *
     * @return {{namespace: String, middleware: { emit: Object }}} Reference on middleware
     *     configuration which will allow to handle specified (by configuration) set of events and
     *     modify events payload.
     */
    chatMiddlewareExtension() {
        let emit = {};

        this.configuration.events.forEach((event) => {
            emit[event] = (payload, next) => this.notificationFormatter(event, payload, next);
        });

        return { namespace: 'chatEngineNotifications.chat', middleware: { emit } };
    }

    /**
     * Event payload formatter.
     * User function will be used to format notification layout (if provided in React environment or
     * through native module) or builtin formatter will be used if there is no other options.
     * @private
     *
     * @param {String} event - Reference on event for which `payload` should be formatted for
     *     notification.
     * @param {ChatEngineEventPayload} payload - Reference on object which contain information sent
     *     along with `event`.
     * @param {function(error: Object, payload: Object)} next - Reference on function which should
     *     be used to notify about formatting process completion.
     */
    notificationFormatter(event, payload, next) {
        const formatterProvided = (this.configuration.formatter !== null && this.configuration.formatter !== undefined);
        /** @type {Object} */
        let formattedPayload = null;
        payload.event = event;
        payload.data = payload.data || {};

        // Mark notification as seen event.
        if (event === '$notifications.seen') {
            formattedPayload = CENotificationFormatter.seenNotification(payload, this.configuration.platforms);
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
                    formattedPayload = CENotificationFormatter.notifications(payload, this.configuration.platforms, this.configuration.messageKey);
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
     * Push notification state change request results handler.
     * @private
     *
     * @param {Boolean} addingChannels Whether chats has been added to device push notifications or
     *     not.
     * @param {Array<Chat>} chats List of chats for which push notification state has been changed
     *     on device.
     * @param {?Array<Error>} errors List of error statuses which has been generated during state change.
     * @param {?function(error: Error)} [completion] - Function which will be called at
     *     the end of modification process and pass error (if any).
     */
    onChatsNotificationStateChange(addingChannels, chats, errors, completion) {
        chats = chats !== null && chats.length ? chats : Object.values(this.ChatEngine.chats);
        let error = errors.length >= 1 ? errors[0] : null;

        if (errors.length > 1) {
            let failedChats = [];

            errors.forEach((storedError) => {
                if (storedError.chats) {
                    failedChats = failedChats.concat(storedError.chats);
                }
            });

            error.chats = failedChats;
        }

        chats.forEach((chat) => {
            const chatPlugins = chat.plugins;
            const registeredPlugin = chatPlugins.filter(plugin => plugin.namespace === 'chatEngineNotifications.chat');

            if (!registeredPlugin.length) {
                if (addingChannels && !errors.length) {
                    chat.plugin(this.chatMiddlewareExtension());
                }
            } else if (!addingChannels) {
                chatPlugins.splice(chatPlugins.indexOf(registeredPlugin[0]), 1);
            }
        });

        if (completion) {
            if (error !== null && error.chats === undefined) {
                error.chats = [];
            }

            completion(errors.length ? error : null);
        }
    }

    /**
     * Apply default values for fields which has been left empty by user.
     * @private
     *
     * @param {CEConfiguration} configuration - reference on configuration object which should be completed with default values.
     * @private
     */
    static applyDefaultConfigurationValues(configuration) {
        if (!TypeValidator.isDefined(configuration.messageKey)) {
            configuration.messageKey = 'message';
        }

        // Add additional event to list of events which should be pre-processed before sending.
        if (!configuration.events.includes('$notifications.seen')) {
            configuration.events.push('$notifications.seen');
        }
    }

    /**
     * Validate notification category action options.
     * @private
     *
     * @param {CEConfiguration} configuration - reference on configuration object which should be completed with default values.
     * @return {Boolean} `true` in case if passed object correspond to {@link CEConfiguration} object representation.
     *
     * @throws {TypeError} in case if one of required parameters is empty or any passed parameters has unexpected data type.
     */
    static validateConfiguration(configuration) {
        if (!TypeValidator.sequence(configuration, [['isTypeOf', Object], 'notEmpty'])) {
            throwError(new TypeError('Unexpected configuration: empty or has unexpected data type (object expected).'));
            return false;
        }

        if (!TypeValidator.sequence(configuration.events, [['isArrayOf', String], 'notEmpty'])) {
            throwError(new TypeError('Unexpected events: empty or has unexpected data type (array expected) with unexpected data entry type (string '
              + 'expected).'));
            return false;
        }

        if (!TypeValidator.sequence(configuration.platforms, [['isTypeOf', Object], 'notEmpty', ['hasKnownKeys', ['ios', 'android']],
            ['hasValuesOf', Boolean]])) {
            throwError(new TypeError('Unexpected platforms: empty or has unexpected type (string expected) with unknown keys and unexpected data entry '
              + 'type (boolean expected).'));
            return false;
        }

        if (TypeValidator.isDefined(configuration.formatter) && !TypeValidator.isTypeOf(configuration.formatter, 'function')) {
            throwError(new TypeError('Unexpected formatter: has unexpected data type (function expected).'));
            return false;
        }
        return true;
    }

    /**
     * Get list of channel name series on which push notification state change should be done.
     * Because there is limit on URI string length, huge list of names should be splitted into
     * series of names.
     * @private
     *
     * @param {Array<Chat>} chats List of chats for which channels should be splitted into sessions.
     *
     * @return {Array<Array<String>>} Series of chat channel names.
     */
    static channelSeriesFromChats(chats) {
        /** @type {Array<String>} */
        const channelsList = chats.map(chat => chat.channel);
        /** @type {String} */
        const encodedChannelsList = encodeURIComponent(channelsList.join(','));
        /** @type {number} */
        let listLength = encodedChannelsList.length;

        if (listLength < pushNotificationMaximumChannelsLength) {
            return listLength === 0 ? [] : [channelsList];
        }

        /** @type {Array<Array<String>>} */
        let series = [];
        /** @type {Array<String>} */
        let currentSequence = [];
        /** @type {String} */
        let queryString = encodedChannelsList;

        for (let channelIdx = 0; channelIdx < channelsList.length; channelIdx += 1) {
            const channel = channelsList[channelIdx];
            let percentEncodedChannel = encodeURIComponent(channel);

            if (!queryString.length) {
                queryString = percentEncodedChannel;
            } else {
                queryString = [queryString, percentEncodedChannel].join(',');
            }

            if (queryString.length < pushNotificationMaximumChannelsLength) {
                currentSequence.push(channel);
            } else {
                if (currentSequence.length) {
                    series.push(currentSequence);
                    currentSequence = [];
                }

                queryString = '';
                channelIdx -= 1;
            }
        }

        if (currentSequence.length) {
            series.push(currentSequence);
        }

        return series;
    }

    /**
     * Create list of {@link Chat} instances from channel names.
     * @private
     *
     * @param {Array<String>} channels List of channel names for which corresponding {@link Chat}
     *     instance should be returned.
     * @param {User} user User for which push notifications managed.
     */
    static chatListFromChannelNames(channels, user) {
        /** @type {Object<String, Chat>} */
        const knownChats = user.chatEngine.chats;
        let chats = [];

        channels.forEach((channelName) => {
            if (knownChats[channelName]) {
                chats.push(knownChats[channelName]);
            }
        });

        return chats;
    }
}
