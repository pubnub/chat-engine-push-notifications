/**
 * @brief      React Native module.
 * @discussion Native module which allow JS code to communicate with native platform API.
 *
 * @since 0.1.0
 * @author Serhii Mamontov
 * @copyright © 2009-2017 PubNub, Inc.
 */
#import <Foundation/Foundation.h>
#import <React/RCTEventEmitter.h>


NS_ASSUME_NONNULL_BEGIN

@interface CENNotifications : RCTEventEmitter


#if !TARGET_OS_TV && !TARGET_OS_OSX && !TARGET_OS_WATCH

///------------------------------------------------
/// @name Notifications
///------------------------------------------------

/**
 * @brief      Register block which will be called each time when notification payload formatting will be required.
 * @discussion Chat enging plugin perform pre-formatting for messages which should be sent as push notifications, but it
 *             is possible to adjust this information by returning altered dictionary.
 *             Block will be called synchronously and it can be even called from background queue.
 * @note       If no block will be provided, chat engine payload will be used for push notification.
 * @discussion \b Important: if block provided, resulting dictionary should at least contain \b title. Please read
 *             https://developer.apple.com/library/content/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/CreatingtheNotificationPayload.html
 *             to get list of keys which can be passed under \b "aps" key for push notification.
 * @note       \b "aps" key should be excluded, only content stored under \b "aps" key (as shown in Apple's example)
 *             should be passed.
 *
 * @param block Reference on block which will be used by native module to pre-format message for push notification.
 *              Block pass only one argument - original data (before chat engine formatting) which may allow to device
 *              how it should look in notification. Block expected to return dictionary with valid payload for push
 *              notification under corresponding keys: \c apns (for Apple Push Notifications) and if required
 *              \c gcm (for Android notifications)
 */
+ (void)setNotificationPayloadFormatter:(NSDictionary *(^__nullable)(NSDictionary *payload))block;


///------------------------------------------------
/// @name Notification permissions
///------------------------------------------------

/**
 * @brief  Audit application permissions to use notifications.
 *
 * @param block Reference on block which will be called on main queue at the end of permissions audit. Block pass two
 *              arguments: \c permissions - currently granted permissions; \c requested - whether permissions has been
 *              requested from user before or not.
 */
+ (void)checkPermissionsWithCompletion:(void(^)(NSUInteger permissions, BOOL requested))block;

/**
 * @brief      Request permissions for specified categories.
 * @discussion Existing permissions will be checked before trying to request them one more time.
 *             Already registered categories won't be removed, but can be replaced in case if updated version provided.
 *
 * @param permissions             Bitfield which hold information about required permissions for notifications.
 * @param notificationCategories  Reference on list of categories for which permissions has been requested.
 * @param block                   Reference on block which is called at the end of permissions request process. Block
 *                                pass three arguments: \c granted - whether permissions has been granted;
 *                                \c rejected - whether \c granted set to \c NO because user rejected permissions
 *                                request; \c error - reference on error which has been generated by API usage.
 */
+ (void)requestPermissions:(NSUInteger)permissions
             forCategories:(nullable NSArray *)notificationCategories
                completion:(void(^)(BOOL granted, BOOL rejected, NSError * _Nullable error))block;

///------------------------------------------------
/// @name Application delegate callbacks
///------------------------------------------------

/**
 * @brief      Handle user push notification settings registration completilon.
 * @discussion This callback used for iOS version lower than 10.
 *
 * @param application          Reference on application instance which completed user notification settings
 *                             registration.
 * @param notificationSettings Reference on final settings which has been stored for application.
 */
+ (void)application:(UIApplication *)application didRegisterUserNotificationSettings:(UIUserNotificationSettings *)notificationSettings;

/**
 * @brief  Handle successful application registration for push notifications.
 *
 * @param application Reference on application instance which completed device registration for push notifications.
 * @param deviceToken Reference on received device push token which should be used with API to be able to send
 *                    notifications to this device.
 */
+ (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken;

/**
 * @brief  Handle application failure to register for push notifications.
 *
 * @param application Reference on application instance which tried to register device for push notifications.
 * @param error       Reference on error instance which describe failure reason.
 */
+ (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error;

/**
 * @brief      Handle silent remote push notification in background and all notifications while in foreground.
 * @discussion This method won't be called for non-silent notifications while application in background.
 *
 * @param application       Reference on application instance which received remote push notification.
 * @param userInfo          Reference on remote notification payload.
 * @param completionHandler Reference on remote data fetch completion handler.
 */
+ (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult result))completionHandler;

/**
 * @breif Handle user interaction with notification's action buttons.
 *
 * @param application       Reference on application instance which received notification action.
 * @param identifier        Reference on used action button identifier.
 * @param userInfo          Reference on handled notification payload.
 * @param completionHandler Reference on notification processing completion handler.
 */
+ (void)application:(UIApplication *)application handleActionWithIdentifier:(NSString *)identifier forRemoteNotification:(NSDictionary *)userInfo completionHandler:(void (^)(void))completionHandler;

/**
 * @breif Handle user interaction with notification's action buttons.
 *
 * @param application       Reference on application instance which received notification action.
 * @param identifier        Reference on used action button identifier.
 * @param userInfo          Reference on handled notification payload.
 * @param responseInfo      Reference on information provided by user during response.
 * @param completionHandler Reference on notification processing completion handler.
 */
+ (void)application:(UIApplication *)application handleActionWithIdentifier:(NSString *)identifier forRemoteNotification:(NSDictionary *)userInfo withResponseInfo:(NSDictionary *)responseInfo completionHandler:(void (^)(void))completionHandler;

#endif

#pragma mark -


@end

NS_ASSUME_NONNULL_END
