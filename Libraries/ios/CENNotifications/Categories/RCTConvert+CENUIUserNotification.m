/**
 * @since 0.0.1
 * @author Serhii Mamontov
 * @copyright © 2009-2017 PubNub, Inc.
 */
#import "RCTConvert+CENUIUserNotification.h"


NS_ASSUME_NONNULL_BEGIN

@interface RCTConvert (CENUIUserNotificationPrivate)

/**
 * @brief  Translate actions passed from React Native (array of dictionary objects) to native actions for category.
 *
 * @param rnActions Reference on array with dictionary objects which represent serialized actions.
 *
 * @return Array with native action instances.
 */
+ (nullable NSArray<UIMutableUserNotificationAction *> *)CENUIUserNotificationActionFromArray:(NSArray *)rnActions;

#pragma mark -

@end

NS_ASSUME_NONNULL_END


@implementation RCTConvert (CENUIUserNotification)

+ (UIUserNotificationCategory *)CENUIUserNotificationCategory:(NSDictionary *)categoryData {

    UIMutableUserNotificationCategory *category = nil;

    if (categoryData.count) {
        category = [[UIMutableUserNotificationCategory alloc] init];
        UIUserNotificationActionContext context = [self UIUserNotificationActionContext:categoryData[@"context"]];
        NSArray *actions = [self NSArray:categoryData[@"actions"]];

        category.identifier = [self NSString:categoryData[@"identifier"]];
        [category setActions:[self CENUIUserNotificationActionFromArray:actions] forContext:context];

        // In case if there is no category actions, there is no need in category itself.
        if (![category actionsForContext:UIUserNotificationActionContextDefault].count &&
            ![category actionsForContext:UIUserNotificationActionContextMinimal].count) {
            category = nil;
        }
    }

    return [category copy];
}

+ (NSArray<UIMutableUserNotificationAction *> *)CENUIUserNotificationActionFromArray:(NSArray *)rnActions {

    NSMutableArray *actions = [NSMutableArray array];

    [rnActions enumerateObjectsUsingBlock:^(id actionData, NSUInteger actionDataIdx, BOOL *actionsEnumeratorStop) {
        UIUserNotificationAction *action = [self CENUIUserNotificationAction:[self NSDictionary:actionData]];

        if (action) {
            [actions addObject:action];
        }
    }];

    return actions.count ? [actions copy] : nil;
}

+ (UIUserNotificationAction *)CENUIUserNotificationAction:(NSDictionary *)actionData {

    UIMutableUserNotificationAction *action = nil;

    if (actionData.count) {
        action = [[UIMutableUserNotificationAction alloc] init];

        action.identifier = [self NSString:actionData[@"identifier"]];
        action.title = [self NSString:actionData[@"title"]];
        action.activationMode = [self UIUserNotificationActivationMode:actionData[@"activationMode"]];
        action.authenticationRequired = [self BOOL:actionData[@"authenticationRequired"]];
        action.destructive = [RCTConvert BOOL:actionData[@"destructive"]];
        action.behavior = [self UIUserNotificationActionBehavior:actionData[@"behavior"]];
        if ([self NSDictionary:actionData[@"textInput"]].count) {
            NSDictionary *textInput = [self NSDictionary:actionData[@"textInput"]];
            NSString *submitButtonTitle = [self NSString:textInput[@"title"]];
            if (submitButtonTitle) {
                action.parameters = @{ UIUserNotificationTextInputActionButtonTitleKey: submitButtonTitle };
            }
        }

    }

    return [action copy];
}


#pragma mark - Misc

RCT_ENUM_CONVERTER(UIUserNotificationActivationMode, (@{
    @"foreground": @(UIUserNotificationActivationModeForeground),
    @"background": @(UIUserNotificationActivationModeBackground)
}), UIUserNotificationActivationModeBackground, integerValue)

RCT_ENUM_CONVERTER(UIUserNotificationActionBehavior, (@{
    @"default": @(UIUserNotificationActionBehaviorDefault),
    @"textInput": @(UIUserNotificationActionBehaviorTextInput)
}), UIUserNotificationActionBehaviorDefault, integerValue)

RCT_ENUM_CONVERTER(UIUserNotificationActionContext, (@{
    @"default": @(UIUserNotificationActionContextDefault),
    @"minimal": @(UIUserNotificationActionContextMinimal)
}), UIUserNotificationActionContextMinimal, integerValue)

#pragma mark -


@end
