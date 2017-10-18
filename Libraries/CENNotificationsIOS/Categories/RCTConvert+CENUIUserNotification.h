#import <React/RCTConvert.h>


NS_ASSUME_NONNULL_BEGIN

/**
 * @brief      React data converter exnetions to work with serialized UIUserNotification objects.
 * @discussion Methods will help to convert serialized object passed from React Native to required object instances from
 *             UIUserNotification library.
 *
 * @since 0.0.1
 * @author Serhii Mamontov
 * @copyright © 2009-2017 PubNub, Inc.
 */
@interface RCTConvert (CENUIUserNotification)

/**
 * @brief  Translate caregory passed from React Native as dictionary object to native category for notifications.
 *
 * @param categoryData Reference dictionary object which represent serialized category.
 *
 * @return Native category instance.
 */
+ (nullable UIUserNotificationCategory *)CENUIUserNotificationCategory:(NSDictionary *)categoryData;

/**
 * @brief  Translate action passed from React Native as dictionary object to native action for category.
 *
 * @param actionData Reference dictionary object which represent serialized action.
 *
 * @return Native action instance.
 */
+ (nullable UIUserNotificationAction *)CENUIUserNotificationAction:(NSDictionary *)actionData;

#pragma mark -

@end

NS_ASSUME_NONNULL_END
