#import <React/RCTConvert.h>
#import <UserNotifications/UserNotifications.h>


NS_ASSUME_NONNULL_BEGIN

/**
 * @brief      React data converter extension to work with serialized UNNotification objects.
 * @discussion Methods will help to convert serialized object passed from React Native to required object instances from
 *             UNNotification library.
 *
 * @since 0.0.1
 * @author Serhii Mamontov
 * @copyright © 2009-2017 PubNub, Inc.
 */
__IOS_AVAILABLE(10.0) __WATCHOS_PROHIBITED __TVOS_PROHIBITED
@interface RCTConvert (CENUNNotification)

/**
 * @brief  Translate native notification object to ReactNative representation.
 *
 * @param notification Reference on notification object which should be serialized.
 */
+ (nullable NSDictionary *)fromUNNotification:(UNNotification *)notification
    __IOS_AVAILABLE(10.0) __WATCHOS_PROHIBITED __TVOS_PROHIBITED;

/**
 * @brief  Translate caregory passed from React Native as dictionary object to native category for notifications.
 *
 * @param categoryData Reference dictionary object which represent serialized category.
 *
 * @return Native category instance.
 */
+ (nullable UNNotificationCategory *)CENUNNotificationCategory:(NSDictionary *)categoryData
    __IOS_AVAILABLE(10.0) __WATCHOS_PROHIBITED __TVOS_PROHIBITED;

/**
 * @brief  Translate action passed from React Native as dictionary object to native action for category.
 *
 * @param actionData Reference dictionary object which represent serialized action.
 *
 * @return Native action instance.
 */
+ (nullable UNNotificationAction *)CENUNNotificationAction:(NSDictionary *)actionData
    __IOS_AVAILABLE(10.0) __WATCHOS_PROHIBITED __TVOS_PROHIBITED;

/**
 * @brief  Translate background fetch result passed from React Native to one of \c UIBackgroundFetchResult enum fields.
 *
 * @param rnResult Reference on stringified fetch resul from React Native.
 *
 * @return One of \c UIBackgroundFetchResult enum fields or \b UIBackgroundFetchResultNoData in case if unknown or
 *         \c nil has been passed.
 */
+ (UIBackgroundFetchResult)CENUIBackgroundFetchResult:(NSString *)rnResult;

#pragma mark -

@end

NS_ASSUME_NONNULL_END
