/**
 * @file File contain only @typedefs for native {@link ChatEngine} notifications module, so there is no need to import it.
 *
 * @author Serhii Mamontov <sergey@pubnub.com>
 */

/**
 * React native module native counterpart.
 *
 * @typedef {Object} CENNotifications
 * @property {function} receiveMissedEvents - Inform native module what React native module is ready to listen events and would like to get any missed
 *     events (which has been sent while React native code has been loaded and initialized).
 * @property {CENApplicationIconBadgeNumberFunction} applicationIconBadgeNumber - Retrieve current application icon badge number (**iOS only**).
 * @property {CENApplicationIconBadgeNumberChangeFunction} setApplicationIconBadgeNumber - Update application's icon badge number to specified value.
 * @property {CENRequestPermissionsFunction} requestPermissions - Request notification feature usage permissions (**iOS only**).
 * @property {CENRegisterNotificationChannelsFunction} registerNotificationChannels - Register notification channels which contain information about
 *     notification presentation (**Android only**).
 * @property {CENRegisterNotificationActionsFunction} registerNotificationActions - Register notification handling actions (**Android only**).
 * @property {function} deliverInitialNotification - Request native module to retrieve reference on notification which has been used to launch
 *     application.
 * @property {CENGetDeliveredNotificationsFunction} deliveredNotifications - Retrieve list of notifications which has been delivered to device from
 *     {@link ChatEngine} users.
 * @property {CENFormatNotificationPayloadFunction} formatNotificationPayload - Format event payload and return resulting value with callback
 *     function.
 */

/**
 * Function which allow to retrieve number which currently displayed on application's icon.
 *
 * @typedef {function} CENApplicationIconBadgeNumberFunction
 * @param {CENApplicationBadgeNumberCallback} callback - Reference on function which should be called when native module finish value retrieval.
 */

/**
 * Native module badge number fetch completion callback.
 *
 * @typedef {function} CENApplicationBadgeNumberCallback
 * @param {Number} number - Current value which is shown on application icon badge.
 */

/**
 * Function which allow to change number which currently displayed on application's icon.
 *
 * @typedef {function} CENApplicationIconBadgeNumberChangeFunction
 * @param {Number} number - value which should be shown on application's badge.
 */

/**
 * Function which allow to request required set of permissions for notifications.
 *
 * @typedef {function} CENRequestPermissionsFunction
 * @param {CEPermissions} permissions - Reference on object which contain set of required permissions.
 */

/**
 * Function which allow to register set of notification channels with pre-configurated notification handling.
 *
 * @typedef {function} CENRegisterNotificationChannelsFunction
 * @param {NotificationChannelConfiguration[]} channels - Reference on array of notification channel configuration objects.
 */

/**
 * Function which allow to register set of notification handling actions name along with activities which should handle notification.
 *
 * @typedef {function} CENRegisterNotificationActionsFunction
 * @param {Object} actions - Reference on object where each key is name and identifier of action and as value passed name of activity which should
 *     handle notification. Name should conform to following template `<package-name>.<path-to-class>.<activity-class-name>`.
 */

/**
 * Function which allow to pre-format notification's layout.
 *
 * @typedef {function} CENFormatNotificationPayloadFunction
 * @param {CENRNNotificationPayload} payload - Reference on object which contain all information which can be useful for notification formatting.
 * @param {CENNotificationsFormatterCallback} callback - Reference on function which will be called by native module formatter method at the end of
 *     data processing.
 */

/**
 * Native module notification formatter callback.
 *
 * @typedef {function} CENNotificationsFormatterCallback
 * @param {Object} payload - Reference on formatted notification payload.
 * @param {Boolean} canFormat - Whether native module is able to format notification payload or not.
 */

/**
 * ReactNative event payload representation for notification formatter.
 *
 * @typedef {Object} CENRNNotificationPayload
 * @property {!String} event - Reference on name of event for which notification should be prepared.
 * @property {!String} sender - Reference on name of user which sent event for push notification.
 * @property {!String} chat - Reference on name of chat inside of which event for notification has been emitted.
 * @property {!Object} data - Reference on user-provided object which should be delivered along with notification.
 */

/**
 * Function which allow to receive all notifications which is delivered to device from {@link ChatEngine} (**iOS only**).
 *
 * @typedef {function} CENGetDeliveredNotificationsFunction
 * @param {CENDeliveredNotificationsCallback} callback - Reference on function which should be called when native module will finish fetching list of
 *     delivered {@link ChatEngine} notifications.
 */

/**
 * Native module badge number fetch completion callback (**iOS only**).
 *
 * @typedef {function} CENDeliveredNotificationsCallback
 * @param {CENDeliveredNotificationPayload[]} notifications - List of notifications which has been sent from another {@link ChatEngine} users.
 */


/**
 * Native module remote notification representation.
 *
 * @typedef {Object} CENNotificationPayload
 * @property {!Object} notification - Received notification payload object.
 * @property {!Boolean} foreground - Whether notification has been received while application was in foreground or not.
 * @property {!Boolean} userInteraction - Whether notification has been reported after user action or not.
 * @property {?CENNotificationActionPayload} [action] - Reference on notification handling action information payload (**iOS only**).
 * @property {?function(result: String)} [completion] - Reference on notification handling completion callback. This function should be called by user
 *     function (if passed) and pass one of values: `newData`, `noData` or `failed` (**iOS only**).
 */

/**
 * Native module remote notification action representation (**iOS only**).
 *
 * @typedef {Object} CENNotificationActionPayload
 * @property {String} category - Reference on notification handling category identifier.
 * @property {String} identifier - Unique action identifier for _category_.
 * @property {Object} [response] - Any user response (useful for `textInput` actions).
 * @property {function} [completion] - Reference on notification handling completion callback.
 */

/**
 * Native module delivered remote notification representation.
 *
 * @typedef {Object} CENDeliveredNotificationPayload
 * @property {!Date} date - When notification has been delivered to the user.
 * @property {!CENNotificationPayload} data - Reference on notification information object.
 */
