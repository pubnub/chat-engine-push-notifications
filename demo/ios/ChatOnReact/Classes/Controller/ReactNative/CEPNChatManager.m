#import "UIBarButtonItem+CEPNBarButtonItem.h"
#import "RCTConvert+CEPNChatManager.h"
#import "CEPNChatsViewController.h"
#import "CEPNBridgeManager.h"
#import "CEPNChatManager.h"
#import <React/RCTLog.h>
#import <objc/runtime.h>


#pragma mark Static

static NSString * const kCEPNAuthorizationController = @"CEPNAuthorizationViewController";
static NSString * const kCEPNCreateChatViewController = @"CEPNCreateChatViewController";
static NSString * const kCEPNChatInviteViewController = @"CEPNInviteUserViewController";
static NSString * const kCEPNChatViewController = @"CEPNChatViewController";


/**
 * @brief Stores reference on split view controller's master view controller.
 */
static UINavigationController<UINavigationBarDelegate> *masterViewController;


/**
 * @brief Stores reference on split view controller's detail view controller.
 */
static UINavigationController<UINavigationBarDelegate> *detailViewController;


NS_ASSUME_NONNULL_BEGIN

#pragma mark - Private interface declaration

@interface CEPNChatManager () <RCTBridgeModule, UINavigationControllerDelegate>

/**
 * @brief  Stores reference on view controller which has been presented during previous call and not dismissed yet.
 */
@property (nonatomic, strong, nullable) UIViewController *presentedViewController;

/**
 * @brief  Stores whether previous controller has been shown with animation or not.
 */
@property (nonatomic, assign) BOOL presentedWithAnimation;

/**
 * @brief  Stores reference map between button action selector and event which should be fired when button is tapped.
 */
@property (nonatomic, strong) NSMutableDictionary<NSString *, NSString *> *buttonEventsMap;


#pragma mark - Controllers hierarchy

/**
 * @brief  Retrieve reference on key window root view controller.
 *
 * @return Reference on root view controller.
 */
+ (UIViewController *)rootViewController;

/**
 * @brief  Retrieve reference on instantiated view controller using it's storyboard identifier.
 *
 * @param storyboardID Reference on unique view controller identifier which is assigned to it in storyboard.
 *
 * @return Instantiated and ready to use view controller.
 */
+ (UIViewController *)viewControllerWithID:(NSString *)storyboardID;

#pragma mark -

NS_ASSUME_NONNULL_END


@end


#pragma mark - Interface implementation

@implementation CEPNChatManager

// Export Native Module to make it accessible from React Native code.
RCT_EXPORT_MODULE()


#pragma mark - Initialization and configuration

+ (void)prepare {

    UISplitViewController *controller = (UISplitViewController *)UIApplication.sharedApplication.windows.firstObject.rootViewController;
    masterViewController = controller.viewControllers.firstObject;
    detailViewController = controller.viewControllers.lastObject;
}

- (instancetype)init {

    if ((self = [super init])) {
        self.buttonEventsMap = [NSMutableDictionary dictionary];
    }

    return self;
}

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

- (dispatch_queue_t)methodQueue {
    return dispatch_get_main_queue();
}


#pragma mark - Controllers hierarchy

+ (UIViewController *)rootViewController {

    return [UIApplication sharedApplication].keyWindow.rootViewController;
}

+ (UIViewController *)viewControllerWithID:(NSString *)storyboardID {

    return [[self rootViewController].storyboard instantiateViewControllerWithIdentifier:storyboardID];
}


/**
 * @brief      Present view controller which can be identified by it's \c storyboardID.
 * @discussion Use key window root controller to present requested view controller.
 *
 * @param storyboardID Reference on unique view controller identifier which is assigned to it in storyboard.
 * @param animated     Whether presentation should be animated or not.
 * @param style        Reference on string which represent field from \c UIModalPresentationStyle enum and configure how
 *                     controller is shown on screen.
 * @param data         Reference on data object which should be passed to controller (and controller may pass it to
 *                     React Native view initialization).
 */
RCT_EXPORT_METHOD(presentController:(NSString *)storyboardID animated:(BOOL)animated withStyle:(NSString *)style
                               data:(NSDictionary *)data) {

    [self dismissViewController];

    dispatch_async(dispatch_get_main_queue(), ^{
        self.presentedWithAnimation = animated;
        self.presentedViewController = [CEPNChatManager viewControllerWithID:storyboardID];
        self.presentedViewController.modalPresentationStyle = [RCTConvert CEPNUIModalPresentationStyle:style];
        if (data) {
            UIViewController *controller = self.presentedViewController;
            if ([controller isKindOfClass:[UINavigationController class]]) {
                controller = ((UINavigationController *)controller).viewControllers.firstObject;
            }
            NSString *dataKey = data.allKeys.firstObject;
            [controller setValue:data[dataKey] forKey:dataKey];
        }
        [[CEPNChatManager rootViewController] presentViewController:self.presentedViewController
                                                           animated:animated completion:nil];
    });
}

/**
 * @brief  Dismiss currently presented view controller (if was presented).
 */
RCT_EXPORT_METHOD(dismissViewController) {

    UIViewController *presentedViewController = self.presentedViewController;
    self.presentedViewController = nil;
    if (presentedViewController) {
        dispatch_async(dispatch_get_main_queue(), ^{
            [presentedViewController dismissViewControllerAnimated:YES completion:nil];
        });
    }
}

RCT_EXPORT_METHOD(setChatsListTitleVisible:(BOOL)visible) {

    UIViewController *targetController = masterViewController.viewControllers.firstObject;
    dispatch_async(dispatch_get_main_queue(), ^{
        targetController.title = visible ? @"Chats" : nil;
        targetController.navigationItem.title = targetController.title;
    });
}

RCT_EXPORT_METHOD(addBarButtons:(NSArray<NSDictionary *> *)buttons position:(NSString *)position forMasterController:(BOOL)master) {

    NSMutableArray<UIBarButtonItem *> *barButtons = [NSMutableArray array];
    [buttons enumerateObjectsUsingBlock:^(NSDictionary *data, NSUInteger buttonIdx, BOOL *buttonsEnumeratorStop) {
        NSDictionary *buttonData = [RCTConvert NSDictionary:data];
        NSString *identifier = [RCTConvert NSString:buttonData[@"identifier"]];
        UIBarButtonItem *button = [UIBarButtonItem buttonWithData:buttonData target:self];

        if (button) {
            self.buttonEventsMap[NSStringFromSelector(button.action)] = [identifier copy];
            [barButtons addObject:button];
        }
    }];

    UIViewController *targetController = masterViewController .viewControllers.firstObject;
    dispatch_async(dispatch_get_main_queue(), ^{
        if ([position isEqualToString:@"right"]) {
            [targetController.navigationItem setRightBarButtonItems:barButtons];
        } else {
            [targetController.navigationItem setLeftBarButtonItems:barButtons];
        }
    });
}

RCT_EXPORT_METHOD(showAuthorizationView) {

    [self presentController:kCEPNAuthorizationController animated:YES withStyle:@"formSheet" data:nil];
}

RCT_EXPORT_METHOD(showChatCreationView) {

    [self presentController:kCEPNCreateChatViewController animated:YES withStyle:@"formSheet" data:nil];
}

RCT_EXPORT_METHOD(showChat:(NSDictionary *)chat) {
    dispatch_async(dispatch_get_main_queue(), ^{
        NSDictionary *chatData = [RCTConvert NSDictionary:chat];
        CEPNChatsViewController *chatsController = masterViewController.viewControllers.firstObject;
        chatsController.selectedChat = [RCTConvert NSDictionary:chat];
        masterViewController.delegate = self;
        [chatsController performSegueWithIdentifier:@"showDetail" sender:chatsController];
//        if (chatData.allKeys.count || UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad) {
//            masterViewController.delegate = self;
//            [chatsController performSegueWithIdentifier:@"showDetail" sender:chatsController];
//        } else {
//            UINavigationController *navigationController = (UINavigationController *)[CEPNChatManager viewControllerWithID:kCEPNChatViewController];
//            [detailViewController setViewControllers:navigationController.viewControllers];
//        }
    });
}

RCT_EXPORT_METHOD(showInviteToChat:(NSDictionary *)chat) {
    dispatch_async(dispatch_get_main_queue(), ^{
        [self presentController:kCEPNChatInviteViewController animated:YES withStyle:@"formSheet"
                           data:@{ @"chat": [RCTConvert NSDictionary:chat] }];
    });
}

RCT_EXPORT_METHOD(closeChat) {
    dispatch_async(dispatch_get_main_queue(), ^{
    });
}


#pragma mark - Events

+ (BOOL)resolveInstanceMethod:(SEL)sel {

    if ([NSStringFromSelector(sel) rangeOfString:@"button_" options:NSCaseInsensitiveSearch].location != NSNotFound) {
        IMP implementation = class_getMethodImplementation([self class], @selector(handleButtonTap:));
        class_addMethod([self class], sel, implementation, "v@:@");
    }
    return YES;
}

- (void)handleButtonTap:(id)button {

    NSString *selector = NSStringFromSelector(_cmd);
    NSString *buttonType = [selector componentsSeparatedByString:@"_"][0];
    NSString *buttonEvent = self.buttonEventsMap[selector];
    [CEPNBridgeManager sendEvent:[NSString stringWithFormat:@"$.%@.tap", buttonType]
                        withData:@{ @"identifier": buttonEvent }];
}

- (NSArray<NSString *> *)supportedEvents {
    return @[];
}

#pragma mark - Navigation bar delegate

- (void)navigationController:(UINavigationController *)navigationController
      willShowViewController:(UIViewController *)viewController animated:(BOOL)animated {

    if ([viewController isKindOfClass:[CEPNChatsViewController class]]) {

        [CEPNBridgeManager sendEvent:@"$.chat-on-react.chat.close"
                            withData:@{ @"data": ((CEPNChatsViewController *)viewController).selectedChat }];
    }
}

#pragma mark -


@end
