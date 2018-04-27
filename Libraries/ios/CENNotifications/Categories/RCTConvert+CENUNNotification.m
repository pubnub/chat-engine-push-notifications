/**
 * @since 0.0.1
 * @author Serhii Mamontov
 * @copyright © 2009-2017 PubNub, Inc.
 */
#import "RCTConvert+CENUNNotification.h"


NS_ASSUME_NONNULL_BEGIN

__IOS_AVAILABLE(10.0) __TVOS_PROHIBITED
@interface RCTConvert (CENUNNotificationPrivate)

/**
 * @brief  Translate actions passed from React Native (array of dictionary objects) to native actions for category.
 *
 * @param rnActions Reference on array with dictionary objects which represent serialized actions.
 *
 * @return Array with native action instances.
 */
+ (nullable NSArray<UNNotificationAction *> *)CENUNNotificationActionFromArray:(NSArray *)rnActions
    __IOS_AVAILABLE(10.0) __WATCHOS_PROHIBITED __TVOS_PROHIBITED;

/**
 * @brief  Translate action options from React Native to bitfield.
 *
 * @param rnOptions Reference on dictionary which contain options as keys and boolean values to specify whther option
 *                  active or not.
 *
 * @return Composed bitfield which tell how action should be performed.
 */
+ (UNNotificationActionOptions)UNNotificationActionOptions:(NSDictionary *)rnOptions
    __IOS_AVAILABLE(10.0) __WATCHOS_PROHIBITED __TVOS_PROHIBITED;

#pragma mark -

@end

NS_ASSUME_NONNULL_END


@implementation RCTConvert (CENUNNotification)

+ (NSDictionary *)fromUNNotification:(UNNotification *)notification {

    UNNotificationContent *notificationContent = notification.request.content;
    NSDictionary *notificationRepresentation = nil;
    if (notificationContent.userInfo && notificationContent.userInfo[@"ceid"]) {
        notificationRepresentation = @{
            @"date": notification.date,
            @"data": @{ @"notification": notificationContent.userInfo, @"foreground": @NO, @"userInteraction": @NO }
        };
    }

    return notificationRepresentation;
}

+ (UNNotificationCategory *)CENUNNotificationCategory:(NSDictionary *)categoryData {

    UNNotificationCategory *category = nil;

    if (categoryData.count) {
        NSString *identifier = [self NSString:categoryData[@"identifier"]];
        NSArray *actions = [self CENUNNotificationActionFromArray:[self NSArray:categoryData[@"actions"]]];
        NSArray *intentIdentifiers = [self NSArray:categoryData[@"intentIdentifiers"]];
        NSString *bodyPlaceholder = [self NSString:categoryData[@"bodyPlaceholder"]];
        UNNotificationCategoryOptions options = [self NSUInteger:categoryData[@"options"]];

        if (@available(iOS 11.0, *)) {
            category = [UNNotificationCategory categoryWithIdentifier:identifier
                                                              actions:actions
                                                    intentIdentifiers:intentIdentifiers
                                        hiddenPreviewsBodyPlaceholder:bodyPlaceholder
                                                              options:options];
        } else {
            category = [UNNotificationCategory categoryWithIdentifier:[self NSString:categoryData[@"identifier"]]
                                                              actions:actions
                                                    intentIdentifiers:@[]
                                                              options:options];
        }

        // In case if there is no category actions, there is no need in category itself.
        if (!category.actions.count) {
            category = nil;
        }
    }

    return category;
}

+ (NSArray<UNNotificationAction *> *)CENUNNotificationActionFromArray:(NSArray *)rnActions {

    NSMutableArray<UNNotificationAction *> *actions = [NSMutableArray array];

    [rnActions enumerateObjectsUsingBlock:^(id actionData, NSUInteger actionDataIdx, BOOL *actionsEnumeratorStop) {
        UNNotificationAction *action = [self CENUNNotificationAction:[self NSDictionary:actionData]];

        if (action) {
            [actions addObject:action];
        }
    }];

    return actions.count ? [actions copy] : nil;
}

+ (UNNotificationAction *)CENUNNotificationAction:(NSDictionary *)actionData {

    UNNotificationAction *action = nil;

    if (actionData.count) {
        UNNotificationActionOptions options = [self UNNotificationActionOptions:[self NSDictionary:actionData[@"options"]]];
        if ([self NSDictionary:actionData[@"textInput"]].count) {
            NSDictionary *textInput = [self NSDictionary:actionData[@"textInput"]];
            action = [UNTextInputNotificationAction actionWithIdentifier:[self NSString:actionData[@"identifier"]]
                                                                   title:[self NSString:actionData[@"title"]]
                                                                 options:options
                                                    textInputButtonTitle:[self NSString:textInput[@"title"]]
                                                    textInputPlaceholder:[self NSString:textInput[@"placeholder"]]];
        } else {
            action = [UNNotificationAction actionWithIdentifier:[self NSString:actionData[@"identifier"]]
                                                          title:[self NSString:actionData[@"title"]]
                                                        options:options];
        }
    }

    return action;
}

#pragma mark - Misc

+ (UNNotificationActionOptions)UNNotificationActionOptions:(NSDictionary *)rnOptions {

    UNNotificationActionOptions actionOptions = 0;

    if ([self BOOL:rnOptions[@"authenticationRequired"]]) {
        actionOptions |= UNNotificationActionOptionAuthenticationRequired;
    }

    if ([self BOOL:rnOptions[@"destructive"]]) {
        actionOptions |= UNNotificationActionOptionDestructive;
    }

    if ([self BOOL:rnOptions[@"foreground"]]) {
        actionOptions |= UNNotificationActionOptionForeground;
    }

    return actionOptions;
}

+ (UIBackgroundFetchResult)CENUIBackgroundFetchResult:(NSString *)rnResult {

    UIBackgroundFetchResult fetchResult = UIBackgroundFetchResultNoData;
    static NSDictionary<NSString *, NSNumber *> *_resultMapping;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        _resultMapping = @{ @"newData" : @(UIBackgroundFetchResultNewData),
                            @"noData" : @(UIBackgroundFetchResultNoData),
                            @"failed" : @(UIBackgroundFetchResultFailed) };
    });
    if (rnResult && _resultMapping[rnResult]) {
        fetchResult = _resultMapping[rnResult].integerValue;
    }

    return fetchResult;
}

#pragma mark -


@end
