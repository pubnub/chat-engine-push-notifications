#import <UserNotifications/UserNotifications.h>
#import <CENNotifications/CENNotifications.h>
#import "CEPNCtatViewController.h"
#import "CEPNBridgeManager.h"
#import "CEPNAppDelegate.h"
#import "CEPNChatManager.h"
#import <React/RCTLog.h>


#pragma mark Private interface declaration

@interface CEPNAppDelegate () <UNUserNotificationCenterDelegate, UISplitViewControllerDelegate>

#pragma mark -


@end


#pragma mark - Interface implementation

@implementation CEPNAppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {

    [CENNotifications application:application didFinishLaunchingWithOptions:launchOptions];
    [CEPNBridgeManager setupWithJSBundleURL:[NSURL URLWithString:@"http://<react-native server IP>:8081/index.ios.bundle?platform=ios"]
                              launchOptions:launchOptions];
    [CEPNChatManager prepare];

    if (@available(iOS 10.0, *)) {
        UNUserNotificationCenter.currentNotificationCenter.delegate = self;
    }

    UISplitViewController *splitViewController = (UISplitViewController *)self.window.rootViewController;
    splitViewController.preferredDisplayMode = UISplitViewControllerDisplayModeAllVisible;
    splitViewController.delegate = self;
    return YES;
}

- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken {
    [CENNotifications application:application didRegisterForRemoteNotificationsWithDeviceToken:deviceToken];
}

- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error {
    [CENNotifications application:application didFailToRegisterForRemoteNotificationsWithError:error];
}

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler {
    [CENNotifications application:application didReceiveRemoteNotification:userInfo fetchCompletionHandler:completionHandler];
}

- (void)application:(UIApplication *)application handleActionWithIdentifier:(NSString *)identifier forRemoteNotification:(NSDictionary *)userInfo
  completionHandler:(void (^)(void))completionHandler {
    [CENNotifications application:application handleActionWithIdentifier:identifier forRemoteNotification:userInfo
                completionHandler:completionHandler];
}

- (void)application:(UIApplication *)application handleActionWithIdentifier:(NSString *)identifier forRemoteNotification:(NSDictionary *)userInfo
   withResponseInfo:(NSDictionary *)responseInfo completionHandler:(void (^)(void))completionHandler {
    [CENNotifications application:application handleActionWithIdentifier:identifier forRemoteNotification:userInfo
                 withResponseInfo:responseInfo completionHandler:completionHandler];
}

- (void)userNotificationCenter:(UNUserNotificationCenter *)center willPresentNotification:(UNNotification *)notification withCompletionHandler:(void (^)(UNNotificationPresentationOptions))completionHandler {
    if (![notification.request.content.userInfo[@"aps"][@"category"] isEqualToString:@"com.pubnub.chat-engine.invite"]) {
        [CENNotifications userNotificationCenter:center willPresentNotification:notification
                           withCompletionHandler:completionHandler];
    } else {
        completionHandler(UNNotificationPresentationOptionAlert);
    }
}

- (void)userNotificationCenter:(UNUserNotificationCenter *)center didReceiveNotificationResponse:(UNNotificationResponse *)response withCompletionHandler:(void (^)(void))completionHandler {
    [CENNotifications userNotificationCenter:center didReceiveNotificationResponse:response withCompletionHandler:completionHandler];
    completionHandler();
}


#pragma mark - Pre-iOS 10 notification delegates

- (void)application:(UIApplication *)application didRegisterUserNotificationSettings:(UIUserNotificationSettings *)notificationSettings {
    [CENNotifications application:application didRegisterUserNotificationSettings:notificationSettings];
}


#pragma mark - Split view

- (BOOL)splitViewController:(UISplitViewController *)splitViewController collapseSecondaryViewController:(UIViewController *)secondaryViewController
  ontoPrimaryViewController:(UIViewController *)primaryViewController {
    if ([secondaryViewController isKindOfClass:[UINavigationController class]] &&
        [[(UINavigationController *)secondaryViewController topViewController] isKindOfClass:[CEPNCtatViewController class]]) {
        return YES;
    } else {
        return NO;
    }
}

#pragma mark -


@end
