//
//  CENUtils.m
//  NativeToReact
//
//  Created by Sergey Mamontov on 9/24/17.
//  Copyright © 2017 PubNub. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <UserNotifications/UserNotifications.h>
#import <React/RCTConvert.h>
#import "CENUtils.h"


void CENGrantedAnyPermissions(void(^block)(BOOL granted, BOOL requested)) {
    if (@available(iOS 10.0, *)) {
        UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
        [center getNotificationSettingsWithCompletionHandler:^(UNNotificationSettings *settings) {

            BOOL requestedPermissionsBefore = settings.authorizationStatus != UNAuthorizationStatusNotDetermined;
            dispatch_async(dispatch_get_main_queue(), ^{
                block(settings.alertSetting == UNNotificationSettingEnabled, requestedPermissionsBefore);
            });
        }];
    } else {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
        UIUserNotificationSettings *settings = [UIApplication  sharedApplication].currentUserNotificationSettings;
        BOOL requestedPermissionsBefore = [[UIApplication sharedApplication] isRegisteredForRemoteNotifications];
        block(settings.types != UIUserNotificationTypeNone, requestedPermissionsBefore);
#pragma clang diagnostic pop
    }
}

CEN_EXTERN NSUInteger CENPermissionFromNSDictionary(NSDictionary *permissions) {
    NSUInteger notificationPermissions = 0;
    if (@available(iOS 10.0, *)) {
        if (!permissions.count) {
            notificationPermissions = (UNAuthorizationOptionAlert |
                                       UNAuthorizationOptionBadge |
                                       UNAuthorizationOptionSound);
        } else {
            if ([RCTConvert BOOL:permissions[@"alert"]]) {
                notificationPermissions |= UNAuthorizationOptionAlert;
            }
            if ([RCTConvert BOOL:permissions[@"badge"]]) {
                notificationPermissions |= UNAuthorizationOptionBadge;
            }
            if ([RCTConvert BOOL:permissions[@"sound"]]) {
                notificationPermissions |= UNAuthorizationOptionSound;
            }
        }
    } else {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
        if (!permissions.count) {
            notificationPermissions = (UIUserNotificationTypeAlert |
                                       UIUserNotificationTypeBadge |
                                       UIUserNotificationTypeSound);
        } else {
            if ([RCTConvert BOOL:permissions[@"alert"]]) {
                notificationPermissions |= UIUserNotificationTypeAlert;
            }
            if ([RCTConvert BOOL:permissions[@"badge"]]) {
                notificationPermissions |= UIUserNotificationTypeBadge;
            }
            if ([RCTConvert BOOL:permissions[@"sound"]]) {
                notificationPermissions |= UIUserNotificationTypeSound;
            }
        }
#pragma clang diagnostic pop
    }
    return notificationPermissions;
}

NSDictionary *CENNSDictionaryFromPermissions(NSUInteger permissions) {
    NSDictionary *serializedPermissions = nil;
    if (@available(iOS 10.0, *)) {
        serializedPermissions = @{
            @"alert": @((permissions & UNAuthorizationOptionAlert) > 0),
            @"badge": @((permissions & UNAuthorizationOptionBadge) > 0),
            @"sound": @((permissions & UNAuthorizationOptionSound) > 0),
        };
    } else {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
        serializedPermissions = @{
            @"alert": @((permissions & UIUserNotificationTypeAlert) > 0),
            @"badge": @((permissions & UIUserNotificationTypeBadge) > 0),
            @"sound": @((permissions & UIUserNotificationTypeSound) > 0),
        };
#pragma clang diagnostic pop
    }
    return serializedPermissions;
}

BOOL CENRunningFromExtensionBundle(void) {
    return [[NSBundle mainBundle].bundlePath.pathExtension isEqualToString:@"appex"];
}

UIApplication *CENSharedApplication(void) {

    if (CENRunningFromExtensionBundle()) {
        return nil;
    }

    return UIApplication.sharedApplication;
}
