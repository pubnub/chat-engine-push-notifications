/**
 * @file File contain only @typedefs which help IDE to figure out what passed object is and provide auto-completion if it recognized. This file also
 * used during documentation generation and allow keep documentation notes in code cleaner.
 * @author Serhii Mamontov <sergey@pubnub.com>
 */

/**
 * React Native notification module configuration object.
 *
 * @typedef {Object} CEConfiguration
 * @property {!String[]} events - List of events for which push notification payload should be created.
 * @property {String[]} [ignoredChats='#read.#feed'] - List of chats for which it is not required to register on push notifications.
 * @property {!CEPlatforms} platforms Available platforms for push notification should be constructed when {@link ChatEngine} send events.
 * @property {Boolean} [markAsSeen=true] - Whether received notification should be marked as `seen` or not when received (when `$.notification` event
 *     is sent).
 * @property {CEFormatterCallback} [formatter] - Called each time when {@link ChatEngine} is about to send one of tracked `events` make layout
 *     formatting for notification.
 */

/**
 * Available platforms for push notification should be constructed when {@link ChatEngine} send events.
 *
 * @typedef {Object} CEPlatforms
 * @property {Boolean} [ios] - Whether push notification should be constructed for iOS or not.
 * @property {Boolean} [android] - Whether push notification should be constructed for Android or not.
 */

/**
 * List of features to which push notification would like to have access (**iOS only**).
 *
 * @typedef {Object} CEPermissions
 * @property {Boolean} alert - Whether it should be allowed to present notifications on device (as bar or alert view).
 * @property {Boolean} badge - Whether it should be allowed to change application badge number with push notification payload or not.
 * @property {Boolean} sound - Whether it should be allowed to play sound on notification receive or not.
 */

/**
 * Callback which can be used to change displayed by notification information (title, message or category for iOS).
 *
 * In case if callback not provided, plugin will use next fallback approaches:
 * 1. Try to use formatter which _may_ be provided on native side of this plugin.
 * 2. Use default schemes to format payload for known events: `$.invite` and `message`.
 *
 * If notification shouldn't be sent for `payload`, callback should return empty object: `{}`.
 * If default formatting should be used for `payload`, callback should return `null`.
 *
 * @typedef {function} CEFormatterCallback
 * @param {!ChatEngineEventPayload} payload - Reference on object which can be used for reference and change layout of push notification.
 * @return {?Object} Return object which contain values for notifications for required {@link CEPlatforms} (under `apns` and/or `gcm` keys).
 */

/**
 * Notification handling category.
 *
 * @typedef {Object} NotificationCategoryConfiguration
 * @property {!String} identifier - Unique category identifier which should match to notification category name to be able to handle it.
 * @property {String} [bodyPlaceholder] - A placeholder string to display when the user has disabled notification previews for the app
 *     (**only for iOS 10+**).
 * @property {String} [context=minimal] - Indicate the amount of space available for displaying actions in a notification. Possible values: `default`,
 *     `minimal`.
 * @property {!CENotificationAction[]} actions - List of notification handling actions ({@link CENotificationAction}) which can be presented to the
 *     user.
 */

/**
 * Notification channel configuration.
 *
 * @typedef {Object} NotificationChannelConfiguration
 * @property {String} id - Unique identifier.
 * @property {String} name - Displayable name.
 * @property {String} [importance=importanceHigh] - The custom notification layout importance. Possible values: `importanceNone`, `importanceMin`,
 *     `importanceLow`, `importanceHigh` and `importanceDefault`.
 * @property {Boolean} [vibration=true] - Whether notification which arrive to this channel should make phone vibrate or not.
 * @property {Number[]} [vibrationPattern=[1000]] - Device vibration pattern (sequence of timing for vibrate and pause).
 * @property {Boolean} [lights=true] - Whether notification which arrive to this channel should user lights or not.
 * @property {String} [lightColor=#00FF00] - HEX color code which should be used for light.
 * @property {String} [sound] - Name of sound which should be played when notification arrive to this channel.
 */

/**
 * New tpe here
 *
 * @typedef {Object} NotificationActionConfiguration
 * @property {!String} identifier - Unique action identifier which will be returned back with handler if user tap on it.
 * @property {!String} title - Title which should be shown on action button along with notification message.
 * @property {String} [activationMode=background] - The mode in which to run the app when the action is performed. Possible values: `foreground`,
 *     `background`.
 * @property {Boolean} [authenticationRequired] - Indicate whether the user must unlock the device before the action is performed.
 * @property {Boolean} [destructive] - Indicate whether the action is destructive.
 * @property {String} [behavior=default] - The custom behavior (if any) that the action supports. Possible values: `default`, `textInput`.
 * @property {NotificationTextInputActionConfiguration} [textInput] - Text input action configuration (**only for iOS 10+**).
 * @property {Object} [options] - How the action should be performed. Possible options: authenticationRequired, destructive, foreground. Boolean value
 *     should be set for active options (**only for iOS 10+**).
 */

/**
 * Notification handling category's text input action.
 *
 * @typedef {Object} NotificationTextInputActionConfiguration
 * @property {String} title - Send button title.
 * @property {String} placeholder - Text input field placeholder message.
 */

/**
 * Observed chat information.
 *
 * @typedef {Object} ObservedChatData
 * @property {String[]} states - Current observed {@link Chat} states (there can be two in case if additional change has been requested when another
 *     request was active).
 * @property {Number} errorCount - Stores how many times {@link Chat} state change failed.
 * @private
 */
