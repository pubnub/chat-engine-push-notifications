#import "CEPNBridgeManager.h"
#import <React/RCTBridge.h>


NS_ASSUME_NONNULL_BEGIN

#pragma mark Private interface declaration

@interface CEPNBridgeManager() <RCTBridgeDelegate>


#pragma mark - Information

/**
 * @brief Reference on URL which allow to load JS bundle which should be used to render React Native application (it can
 *        be network address with pre-defined format or local file bundled within native application).
 */
@property (nonatomic, strong) NSURL *jsBundleURL;

/**
 * @brief  Reference on initialized RCTBridge which is used to communicate with JS environment.
 */
@property (nonatomic, strong) RCTBridge *bridge;


#pragma mark - Initialization and configuration

/**
 * @brief  Create and configure singleton instance which will manage communication with RCTBridge instance.
 *
 * @return Reference on singleton with initialized bridge instance.
 */
+ (CEPNBridgeManager *)sharedInstance;

/**
 * @brief      Setup RCTBridge manager.
 * @discussion Singleton will be created to manage access to RCTBridge instance. Manager will allow to send commands to
 *             bridge and load views into controller.
 *
 * @param url           Reference on URL which allow to load JS bundle which should be used to render React Native
 *                      application (it can be network address with pre-defined format or local file bundled within
 *                      native application)
 * @param launchOptions Reference on dictionary which may contain list of keys which should be passed to instantiated
 *                      React Native application.
 */
- (void)setupWithJSBundleURL:(NSURL *)url launchOptions:(NSDictionary *)launchOptions;


#pragma mark -

NS_ASSUME_NONNULL_END


@end


#pragma mark - Interface implementation

@implementation CEPNBridgeManager


#pragma mark - Initialization and configuration

+ (CEPNBridgeManager *)sharedInstance {

    static CEPNBridgeManager *_sharedManager;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        _sharedManager = [CEPNBridgeManager new];
    });

    return _sharedManager;
}

+ (void)setupWithJSBundleURL:(NSURL *)url launchOptions:(NSDictionary *)launchOptions {

    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        [[self sharedInstance] setupWithJSBundleURL:url launchOptions:launchOptions];
    });
}

- (void)setupWithJSBundleURL:(NSURL *)url launchOptions:(NSDictionary *)launchOptions {
    self.jsBundleURL = url;
    self.bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
}


#pragma mark - Views

+ (RCTRootView *)authorizationView {

    return [[RCTRootView alloc] initWithBridge:[self sharedInstance].bridge moduleName:@"CEPNAuthorizeUserView"
                             initialProperties:[self sharedInstance].bridge.launchOptions];
}

+ (RCTRootView *)chatsListView {

    return [[RCTRootView alloc] initWithBridge:[self sharedInstance].bridge moduleName:@"CEPNChatsListView"
                             initialProperties:[self sharedInstance].bridge.launchOptions];
}

+ (RCTRootView *)chatCreateView {

    return [[RCTRootView alloc] initWithBridge:[self sharedInstance].bridge moduleName:@"CEPNCreateChatView"
                             initialProperties:[self sharedInstance].bridge.launchOptions];
}

+ (RCTRootView *)chatViewWithData:(NSDictionary *)data {

    NSMutableDictionary *launchOptions = [(data ?: @{}) mutableCopy];
    [launchOptions addEntriesFromDictionary:[self sharedInstance].bridge.launchOptions];
    return [[RCTRootView alloc] initWithBridge:[self sharedInstance].bridge moduleName:@"CEPNChatView"
                             initialProperties:launchOptions];;
}

+ (RCTRootView *)inviteUserViewWithData:(NSDictionary *)data {

    NSMutableDictionary *launchOptions = [(data ?: @{}) mutableCopy];
    [launchOptions addEntriesFromDictionary:[self sharedInstance].bridge.launchOptions];
    return [[RCTRootView alloc] initWithBridge:[self sharedInstance].bridge moduleName:@"CEPNInviteUserView"
                             initialProperties:launchOptions];
}


#pragma mark - Events

+ (void)sendEvent:(NSString *)event withData:(id)data {

    [[self sharedInstance].bridge enqueueJSCall:@"RCTDeviceEventEmitter.emit" args:data ? @[event, data] : @[event]];
}


#pragma mark - React Native

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge {
    return self.jsBundleURL;
}

@end
