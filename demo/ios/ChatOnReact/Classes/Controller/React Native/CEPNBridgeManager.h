#import <Foundation/Foundation.h>
#import <React/RCTRootView.h>


NS_ASSUME_NONNULL_BEGIN

@interface CEPNBridgeManager : NSObject


#pragma mark - Initialization and configuration

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
+ (void)setupWithJSBundleURL:(NSURL *)url launchOptions:(NSDictionary *)launchOptions;


#pragma mark - Views

/**
 * @brief  Retrieve reference authorization view.
 *
 * @return React Native view instance which is configured to layout required interface.
 */
+ (RCTRootView *)authorizationView;

/**
 * @brief  Retrieve reference on chats list view.
 *
 * @return React Native view instance which is configured to layout required interface.
 */
+ (RCTRootView *)chatsListView;

/**
 * @brief  Retrieve reference on chat creation view.
 *
 * @return React Native view instance which is configured to layout required interface.
 */
+ (RCTRootView *)chatCreateView;

/**
 * @brief  Retrieve reference on chat communication view.
 *
 * @param data Reference on dictionary which contain information about chat which should be rendered in this controller.
 *
 * @return React Native view instance which is configured to layout required interface.
 */
+ (RCTRootView *)chatViewWithData:(NSDictionary *)data;

/**
 * @brief  Retrieve reference on user invitation view.
 *
 * @param data Reference on dictionary which contain information about chat to which new user should be invited.
 *
 * @return React Native view instance which is configured to layout required interface.
 */
+ (RCTRootView *)inviteUserViewWithData:(NSDictionary *)data;


#pragma mark - Events

/**
 * @brief  Emit event on React Native side with passed value.
 *
 * @param event Reference on name of event which should be emitted.
 * @param data  Reference on object which should be sent along with event.
 */
+ (void)sendEvent:(NSString *)event withData:(id)data;

#pragma mark -

NS_ASSUME_NONNULL_END


@end
