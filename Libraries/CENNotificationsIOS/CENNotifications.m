/**
 * @author Serhii Mamontov
 * @copyright © 2009-2017 PubNub, Inc.
 */
#import "CENNotifications.h"
#import <UserNotifications/UserNotifications.h>
#import "RCTConvert+CENUIUserNotification.h"
#import "RCTConvert+CENUNNotification.h"
#import <React/RCTConvert.h>
#import "CENUtils.h"


#pragma mark Static

static NSString * const CENRegisteredForRemoteNotifications = @"CENRegisteredForRemoteNotifications";
static NSString * const CENFailedToRegisterForRemoteNotifications = @"CENFailedToRegisterForRemoteNotifications";
static NSString * const CENReceivedRemoteNotification = @"CENReceivedRemoteNotification";

static NSString * const CENErrorUnableToRequestPermissions = @"E_UNABLE_TO_REQUEST_PERMISSIONS";
static NSString * const CENErrorUnableToRegisterBecauseOfUserReject = @"E_FAILED_TO_REGISTER_BECAUSE_OF_USER_REJECT";

/**
 * @brief  Stores reference on block which should be used for push notification payload pre-processing.
 */
static NSDictionary *(^CENPushNotificationFormatter)(NSDictionary *payload);
static void(^CENPermissionRequestCompletion)(BOOL granted, BOOL rejected, NSError * _Nullable error);


/**
 * @brief  Whether native module has event listeners from React Native side or not.
 */
static BOOL CENHasEventListeners = NO;

/**
 * @brief  Whether device push token has been received or not.
 */
static BOOL CENHasDevicePushToken = NO;


NS_ASSUME_NONNULL_BEGIN

@interface CENNCompanionObject

@end



@interface CENNotifications ()


#pragma mark - State

/**
 * @brief      Stores reference on list which temporary store events which has not been delivered to React Native.
 * @discussion React Native require some time to load and initialize environment and while it happens native component
 *             may receive few critical updates which should be delivered to React Native event listeners.
 *             This storage will keep events and used to publish them all as soon as React Native side will request
 *             missed events.
 */
+ (NSMutableArray<NSDictionary *> *)missedNativeEvents;

/**
 * @brief  Store event which should be delivered after React Native component is ready.
 *
 * @param event    Name of notification which should be delivered later.
 * @param userInfo Reference on \c userInfo object which should be sent along with notification.
 */
+ (void)storeMissedEvent:(NSString *)event withUserInfo:(id)userInfo;

#pragma mark - Notifications

/**
 * @brief      Send notification to React Native.
 * @discussion This method allow to send notification immediately or store it in special storage for time when React
 *             Native counter part will be ready to accept notifications (so no critical data will be lost).
 *
 * @param notification Reference on name of notification which should be sent.
 * @param userInfo     Additional data which should be sent along with notification to React Native.
 */
+ (void)sendNotification:(NSString *)notification withUserInfo:(NSDictionary *)userInfo;

/**
 * @brief  Construct notification payload for React Native part.
 *
 * @param notification     Referenceon original notification payload.
 * @param onUserActivity   Whether notification has been reported in response on user-activity.
 * @param actionIdentifier Reference on identifier of action button which used tapped for notification.
 * @param responseInfo     Reference on action/user-provided data.
 * @param completion       Reference on silent notification processing completion block.
 *
 * @return Reference on pre-formatted notification object for React Native counterpart.
 */
+ (NSDictionary *)notification:(NSDictionary *)notification
                  onUserAction:(BOOL)onUserActivity
                        action:(nullable NSString *)actionIdentifier
              withResponseInfo:(nullable NSDictionary *)responseInfo
                    completion:(nullable id)completion;

#pragma mark - Misc

/**
 * @brief      Merge existing categories with one which has been passed as \c additional.
 * @discussion Method used in case if existing (previously registered) categories should merge with new user-provided.
 */
+ (nullable NSSet *)mergedCategories:(nullable NSSet *)categories with:(nullable NSArray *)additionalCategories;

/**
 * @brief  Translate categories passed from React Native (array of dictionary objects) to native categories for
 *         notifications.
 *
 * @param rnCategories Reference on array with dictionary objects which represent serialized categories.
 *
 * @return Array with native category instances.
 */
+ (nullable NSArray *)nativeCategoriesFromArray:(nullable NSArray *)rnCategories;

#pragma mark -


@end

NS_ASSUME_NONNULL_END


@implementation CENNotifications

// Export Native Module to make it accessible from React Native code.
RCT_EXPORT_MODULE()


#if !TARGET_OS_TV && !TARGET_OS_OSX && !TARGET_OS_WATCH

#pragma mark - Initialization and Configuration

- (instancetype)init {

    if ((self = [super init])) {

        /**
         * React Native counter part doesn't add itself as event listener directly to this object, so we need to force
         * it to start generating events.
         */
        [self addListener:@"CENRegistered"];

        dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(5 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
            [[NSNotificationCenter defaultCenter] postNotificationName:@"RCTBRIDGEDATA" object:self
                                                              userInfo:@{@"data": self.bridge.launchOptions ?: @"none"}];
        });
    }

    return self;
}

- (dispatch_queue_t)methodQueue {
    return dispatch_get_main_queue();
}


#pragma mark - State

+ (NSMutableArray<NSDictionary *> *)missedNativeEvents {

    static NSMutableArray<NSDictionary *> *_missedEvents;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        _missedEvents = [NSMutableArray array];
    });

    return _missedEvents;
}

+ (void)storeMissedEvent:(NSString *)event withUserInfo:(id)userInfo {

    [[self missedNativeEvents] addObject:@{ @"event": event, @"userInfo": userInfo ?: @{} }];
}

#pragma mark - Notifications

+ (void)sendNotification:(NSString *)notification withUserInfo:(NSDictionary *)userInfo {

    if (CENHasEventListeners) {
        [NSNotificationCenter.defaultCenter postNotificationName:notification object:self userInfo:userInfo];
    } else {
        [CENNotifications storeMissedEvent:notification withUserInfo:userInfo];
    }
}

+ (NSDictionary *)notification:(NSDictionary *)notification
                  onUserAction:(BOOL)onUserActivity
                        action:(nullable NSString *)actionIdentifier
              withResponseInfo:(nullable NSDictionary *)responseInfo
                    completion:(nullable id)completion {

    NSMutableDictionary *payload = [@{
        @"notification": notification,
        @"userInteraction": (actionIdentifier != nil ? @YES : @NO)
    } mutableCopy];
    if (onUserActivity) {
        payload[@"foreground"] = @NO;
    } else {
        payload[@"foreground"] = @(CENSharedApplication().applicationState == UIApplicationStateActive);
    }
    if(actionIdentifier) {
        payload[@"action"] = [@{
            @"category": notification[@"aps"][@"category"],
            @"identifier": actionIdentifier
        } mutableCopy];
        if (responseInfo) {
            payload[@"action"][@"response"] = responseInfo;
        }
        if (completion) {
            payload[@"action"][@"completion"] = completion;
        }
    } else if (completion) {
        payload[@"completion"] = completion;
    }

    return [payload copy];
}

+ (void)setNotificationPayloadFormatter:(NSDictionary *(^)(NSDictionary *payload))block {

    CENPushNotificationFormatter = block;
}

RCT_EXPORT_METHOD(formatNotificationPayload:(NSDictionary *)payload callback:(RCTResponseSenderBlock)callback) {

    NSDictionary *formattedPayload = nil;

    if (CENPushNotificationFormatter) {
        formattedPayload = CENPushNotificationFormatter(payload);
    }
    callback(@[formattedPayload ?: [NSNull null], @(CENPushNotificationFormatter != nil)]);
}


/**
 * @brief      Deliver (if any) information about notification passed on launch.
 * @discussion Application can be started in response on user tap on notification. This method allow to retrieve this
 *             notification data from launch option and send it back to React Native counterpart so event listeners will
 *             be called.
 */
RCT_EXPORT_METHOD(deliverInitialNotification) {

    NSDictionary *launchOptions = self.bridge.launchOptions;
    if (launchOptions && launchOptions[UIApplicationLaunchOptionsRemoteNotificationKey]) {
        if (launchOptions[UIApplicationLaunchOptionsRemoteNotificationKey][@"ceid"]) {
            NSMutableDictionary *notification = [[CENNotifications notification:launchOptions[UIApplicationLaunchOptionsRemoteNotificationKey]
                                                                   onUserAction:YES action:nil withResponseInfo:nil completion:nil] mutableCopy];
            notification[@"foreground"] = @NO;
            [CENNotifications sendNotification:CENReceivedRemoteNotification withUserInfo:notification];
        }
    }
}


#pragma mark - Notification permissions

RCT_EXPORT_METHOD(applicationIconBadgeNumber:(RCTResponseSenderBlock)callback) {
    callback(@[@(CENSharedApplication().applicationIconBadgeNumber)]);
}

RCT_EXPORT_METHOD(setApplicationIconBadgeNumber:(NSInteger)number) {
    CENSharedApplication().applicationIconBadgeNumber = number;
}

+ (void)checkPermissionsWithCompletion:(void (^)(NSUInteger, BOOL))block {

    __block NSUInteger permissions = 0;
    if (@available(iOS 10.0, *)) {
        UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
        [center getNotificationSettingsWithCompletionHandler:^(UNNotificationSettings *settings) {
            if (settings.alertSetting == UNNotificationSettingEnabled) {
                permissions |= UNAuthorizationOptionAlert;
            }
            if (settings.badgeSetting == UNNotificationSettingEnabled) {
                permissions |= UNAuthorizationOptionBadge;
            }
            if (settings.soundSetting == UNNotificationSettingEnabled) {
                permissions |= UNAuthorizationOptionSound;
            }
            dispatch_async(dispatch_get_main_queue(), ^{
                block(permissions, settings.authorizationStatus != UNAuthorizationStatusNotDetermined);
            });
        }];
    } else {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
        UIUserNotificationSettings *settings = CENSharedApplication().currentUserNotificationSettings;
        if ((settings.types & UIUserNotificationTypeAlert) > 0) {
            permissions |= UIUserNotificationTypeAlert;
        }
        if ((settings.types & UIUserNotificationTypeBadge) > 0) {
            permissions |= UIUserNotificationTypeBadge;
        }
        if ((settings.types & UIUserNotificationTypeSound) > 0) {
            permissions |= UIUserNotificationTypeSound;
        }
        block(permissions, CENSharedApplication().isRegisteredForRemoteNotifications);
#pragma clang diagnostic pop
    }
}

+ (void)requestPermissions:(NSUInteger)permissions
             forCategories:(NSArray *)notificationCategories
                completion:(void(^)(BOOL granted, BOOL rejected, NSError *error))block {

    if (CENPermissionRequestCompletion != nil) {
        dispatch_async(dispatch_get_main_queue(), ^{
            block(NO, NO, nil);
        });
        return;
    }

    UIApplication *application = CENSharedApplication();
    [self checkPermissionsWithCompletion:^(NSUInteger currentPermissions, BOOL requested) {

        if (requested && currentPermissions == 0) {
            dispatch_async(dispatch_get_main_queue(), ^{
                block(NO, YES, nil);
            });
            return;
        }

        if (@available(iOS 10.0, *)) {
            UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
            [center getNotificationCategoriesWithCompletionHandler:^(NSSet<UNNotificationCategory *> *categories) {
                NSSet *updatedCategories = [self mergedCategories:categories with:notificationCategories];
                void(^notifyGranted)(BOOL, NSError *) = ^(BOOL granted, NSError *error) {
                    dispatch_async(dispatch_get_main_queue(), ^{
                        if (granted && !CENHasDevicePushToken) {
                            [application registerForRemoteNotifications];
                        }
                        block(granted, YES, error);
                    });
                };

                [center setNotificationCategories:updatedCategories];
                if (!requested) {
                    [center requestAuthorizationWithOptions:permissions completionHandler:^(BOOL granted, NSError *error) {
                        notifyGranted(granted, error);
                    }];
                } else {
                    notifyGranted(currentPermissions != 0, nil);
                }
            }];
        } else {
            CENPermissionRequestCompletion = block;
            NSSet<UIUserNotificationCategory *> *categories = application.currentUserNotificationSettings.categories;
            NSSet *updatedCategories = [self mergedCategories:categories with:notificationCategories];
            UIUserNotificationSettings *settings = [UIUserNotificationSettings settingsForTypes:permissions
                                                                                     categories:updatedCategories];

            [application registerUserNotificationSettings:settings];
        }
    }];
}

RCT_EXPORT_METHOD(requestPermissions:(NSDictionary *)permissions
                  categories:(NSArray *)categories
                  withPromiseResolve:(RCTPromiseResolveBlock)resolver
                  promiseReject:(RCTPromiseRejectBlock)reject) {

    if (CENRunningFromExtensionBundle()) {
        reject(CENErrorUnableToRequestPermissions, @"Push notifications not supported in application extension.", nil);
        return;
    }

    if (CENPermissionRequestCompletion != nil) {
        reject(CENErrorUnableToRequestPermissions,
               @"Unable to request permissions while previous request not completed",
               nil);
        return;
    }

    [CENNotifications requestPermissions:CENPermissionFromNSDictionary(permissions)
                           forCategories:[CENNotifications nativeCategoriesFromArray:categories]
                              completion:^(BOOL granted, BOOL rejected, NSError *error) {
        if (granted) {
            resolver(permissions);
        } else {
            reject(CENErrorUnableToRegisterBecauseOfUserReject,
                   @"User doesn't grant permissions. Notifications permissions should be granted manually.",
                   error);
        }
    }];
}

RCT_EXPORT_METHOD(deliveredNotifications:(RCTResponseSenderBlock)callback) {

    if (@available(iOS 10.0, *)) {
        UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
        [center getDeliveredNotificationsWithCompletionHandler:^(NSArray<UNNotification *> *notifications) {
            NSMutableArray *chatEngineNotifications = [NSMutableArray array];

            [notifications enumerateObjectsUsingBlock:^(UNNotification *notification,
                                                        NSUInteger notificationIdx,
                                                        BOOL *notificationsEnumeratorStop) {
                NSDictionary *notificationRepresentation = [RCTConvert fromUNNotification:notification];
                if (notificationRepresentation) {
                    [chatEngineNotifications addObject:notificationRepresentation];
                }
            }];
            dispatch_async(dispatch_get_main_queue(), ^{
                callback(@[chatEngineNotifications]);
            });
        }];
    } else {
        dispatch_async(dispatch_get_main_queue(), ^{
            callback(@[@[]]);
        });
    }
}

RCT_EXPORT_METHOD(markNotificationAsSeen:(NSDictionary *)notification) {

    if (@available(iOS 10.0, *)) {
        NSDictionary *chatEngineNotificationPayload = notification[@"notification"];
        NSString *targetNotificationCEID = (chatEngineNotificationPayload[@"cepayload"] ?: @{})[@"ceid"];
        if (!targetNotificationCEID) {
            targetNotificationCEID = chatEngineNotificationPayload[@"ceid"];
        }
        UIBackgroundTaskIdentifier backgroundTaskIdentifier = 0;
        if (CENSharedApplication().applicationState != UIApplicationStateActive) {
            backgroundTaskIdentifier = [CENSharedApplication() beginBackgroundTaskWithExpirationHandler:^{
                [CENSharedApplication() endBackgroundTask:backgroundTaskIdentifier];
            }];
        }
        UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
        [center getDeliveredNotificationsWithCompletionHandler:^(NSArray<UNNotification *> *notifications) {

            [notifications enumerateObjectsUsingBlock:^(UNNotification *deliveredNotification,
                                                        NSUInteger notificationIdx,
                                                        BOOL *notificationsEnumeratorStop) {
                UNNotificationContent *content = deliveredNotification.request.content;
                if (content.userInfo && content.userInfo[@"ceid"]) {
                    if ([content.userInfo[@"ceid"] isEqualToString:targetNotificationCEID]) {
                        [center removeDeliveredNotificationsWithIdentifiers:@[deliveredNotification.request.identifier]];
                        *notificationsEnumeratorStop = YES;
                    }
                }
            }];
            if (backgroundTaskIdentifier) {
                [CENSharedApplication() endBackgroundTask:backgroundTaskIdentifier];
            }
        }];
    }
}

RCT_EXPORT_METHOD(markAllNotificationAsSeen) {

    if (@available(iOS 10.0, *)) {
        UIBackgroundTaskIdentifier backgroundTaskIdentifier = 0;
        if (CENSharedApplication().applicationState != UIApplicationStateActive) {
            backgroundTaskIdentifier = [CENSharedApplication() beginBackgroundTaskWithExpirationHandler:^{
                [CENSharedApplication() endBackgroundTask:backgroundTaskIdentifier];
            }];
        }
        NSMutableArray<NSString *> *notificationIdentifiers = [NSMutableArray array];
        UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
        [center getDeliveredNotificationsWithCompletionHandler:^(NSArray<UNNotification *> *notifications) {

            [notifications enumerateObjectsUsingBlock:^(UNNotification *deliveredNotification,
                                                        NSUInteger notificationIdx,
                                                        BOOL *notificationsEnumeratorStop) {
                UNNotificationContent *content = deliveredNotification.request.content;
                if (content.userInfo && content.userInfo[@"ceid"]) {
                    [notificationIdentifiers addObject:deliveredNotification.request.identifier];
                }
            }];
            if (notificationIdentifiers.count) {
                [center removeDeliveredNotificationsWithIdentifiers:notificationIdentifiers];
            }
            if (backgroundTaskIdentifier) {
                [CENSharedApplication() endBackgroundTask:backgroundTaskIdentifier];
            }
        }];
    }
}


#pragma mark - Events

- (void)startObserving {

    NSNotificationCenter *notificationCenter = NSNotificationCenter.defaultCenter;

    [notificationCenter addObserver:self
                           selector:@selector(handleDidRegisterForRemoteNotifications:)
                               name:CENRegisteredForRemoteNotifications
                             object:nil];
    [notificationCenter addObserver:self
                           selector:@selector(handleDidFailToRegisterForRemoteNotifications:)
                               name:CENFailedToRegisterForRemoteNotifications
                             object:nil];
    [notificationCenter addObserver:self
                           selector:@selector(handleDidReceiveRemoteNotification:)
                               name:CENReceivedRemoteNotification
                             object:nil];
}

- (NSArray<NSString *> *)supportedEvents {
    return @[ @"CENRegistered", @"CENFailedToRegister", @"CENReceivedRemoteNotification" ];
}

- (void)stopObserving {

    [NSNotificationCenter.defaultCenter removeObserver:self];
}

- (void)handleDidRegisterForRemoteNotifications:(NSNotification *)notification {

    if (!CENHasDevicePushToken) {
        CENHasDevicePushToken = YES;
        [self sendEventWithName:@"CENRegistered" body:notification.userInfo];
    }
}

- (void)handleDidFailToRegisterForRemoteNotifications:(NSNotification *)notification {

    NSError *error = notification.userInfo[@"error"];

    [self sendEventWithName:@"CENFailedToRegister" body:RCTMakeError(error.localizedDescription, nil, error.userInfo)];
}

- (void)handleDidReceiveRemoteNotification:(NSNotification *)notification {

    if (notification.userInfo[@"notification"] && notification.userInfo[@"notification"][@"aps"][@"category"]){
        [self sendEventWithName:@"CENReceivedRemoteNotification" body:notification.userInfo];
    } else if (notification.userInfo[@"notification"]) {
        [self markNotificationAsSeen:notification.userInfo];
    }
}

RCT_EXPORT_METHOD(receiveMissedEvents) {

    CENHasEventListeners = YES;
    NSNotificationCenter *notificationCenter = NSNotificationCenter.defaultCenter;
    [[[CENNotifications missedNativeEvents] copy] enumerateObjectsUsingBlock:^(NSDictionary *event,
                                                                               NSUInteger eventIdx,
                                                                               BOOL *eventsEnumeratorStop) {
        [notificationCenter postNotificationName:event[@"event"] object:self userInfo:event[@"userInfo"]];
    }];
    [[CENNotifications missedNativeEvents] removeAllObjects];
}


#pragma mark - Application delegate callbacks

+ (void)application:(UIApplication *)application didRegisterUserNotificationSettings:(UIUserNotificationSettings *)notificationSettings {

    BOOL granted = notificationSettings.types != UIUserNotificationTypeNone;

    if (CENPermissionRequestCompletion) {
        dispatch_async(dispatch_get_main_queue(), ^{
            CENPermissionRequestCompletion(granted, YES, nil);
            CENPermissionRequestCompletion = nil;
        });
    }

    if (granted && !CENHasDevicePushToken) {
        dispatch_async(dispatch_get_main_queue(), ^{
            [application registerForRemoteNotifications];
        });
    }
}

+ (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken {

    NSUInteger capacity = deviceToken.length;
    NSMutableString *stringBuffer = [[NSMutableString alloc] initWithCapacity:capacity];
    const unsigned char *dataBuffer = deviceToken.bytes;
    for (NSUInteger i=0; i < deviceToken.length; i++) {

        [stringBuffer appendFormat:@"%02.2hhX", dataBuffer[i]];
    }
    [self sendNotification:CENRegisteredForRemoteNotifications withUserInfo:@{ @"deviceToken": [stringBuffer copy] }];
}

+ (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error {

    [self sendNotification:CENFailedToRegisterForRemoteNotifications withUserInfo:@{ @"error": error }];
}

+ (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult result))completionHandler {

    if (userInfo[@"ceid"]) {
        NSDictionary *notification = [CENNotifications notification:userInfo
                                                       onUserAction:NO
                                                             action:nil
                                                   withResponseInfo:nil
                                                         completion:^(NSString *result) {
            completionHandler([RCTConvert CENUIBackgroundFetchResult:result]);
        }];
        [self sendNotification:CENReceivedRemoteNotification withUserInfo:notification];
    }
}

+ (void)application:(UIApplication *)application handleActionWithIdentifier:(NSString *)identifier forRemoteNotification:(NSDictionary *)userInfo completionHandler:(void (^)(void))completionHandler {

    if (userInfo[@"ceid"]) {
        NSDictionary *notification = [CENNotifications notification:userInfo
                                                       onUserAction:YES
                                                             action:identifier
                                                   withResponseInfo:nil
                                                         completion:completionHandler];
        [self sendNotification:CENReceivedRemoteNotification withUserInfo:notification];
    }
}

+ (void)application:(UIApplication *)application handleActionWithIdentifier:(NSString *)identifier forRemoteNotification:(NSDictionary *)userInfo withResponseInfo:(NSDictionary *)responseInfo completionHandler:(void (^)(void))completionHandler {

    if (userInfo[@"ceid"]) {
        NSDictionary *notification = [CENNotifications notification:userInfo
                                                       onUserAction:YES
                                                             action:identifier
                                                   withResponseInfo:responseInfo
                                                         completion:completionHandler];
        [self sendNotification:CENReceivedRemoteNotification withUserInfo:notification];
    }
}


#pragma mark - Misc

+ (NSSet *)mergedCategories:(NSSet *)categories with:(NSArray *)additionalCategories {

    NSMutableSet *updatedCategories = [NSMutableSet setWithSet:(categories ?: [NSSet set])];
    [additionalCategories enumerateObjectsUsingBlock:^(id category,
                                                       NSUInteger categoryIdx,
                                                       BOOL *categoriesEnumeratorStop) {
        NSString *categoryIdentifier = [category valueForKey:@"identifier"];
        [categories enumerateObjectsUsingBlock:^(id registeredCategory, BOOL *registeredCategoriesEnumeratorStop) {
            if ([[registeredCategory valueForKey:@"identifier"] isEqualToString:categoryIdentifier]) {
                [updatedCategories removeObject:registeredCategory];
            }
        }];
    }];
    [updatedCategories addObjectsFromArray:(additionalCategories ?: @[])];

    return updatedCategories.count ? updatedCategories : nil;
}

+ (NSArray *)nativeCategoriesFromArray:(NSArray *)rnCategories {

    NSMutableArray *categories = [NSMutableArray array];

    [rnCategories enumerateObjectsUsingBlock:^(id categoryData, NSUInteger idx, BOOL * _Nonnull stop) {
        NSDictionary *categoryDictionary = [RCTConvert NSDictionary:categoryData];
        id category = nil;

        if (@available(iOS 10.0, *)) {
            category = [RCTConvert CENUNNotificationCategory:categoryDictionary];
        } else {
            category = [RCTConvert CENUIUserNotificationCategory:categoryDictionary];
        }
        if (category) {
            [categories addObject:category];
        }
    }];

    return categories.count ? [categories copy] : nil;
}

#else

- (NSArray<NSString *> *)supportedEvents {
    return @[];
}

#endif

#pragma mark -


@end

