#import "CEPNCtatViewController.h"
#import "UIBarButtonItem+CEPNBarButtonItem.h"
#import "CEPNBridgeManager.h"


#pragma mark Private interface declaration

@interface CEPNCtatViewController ()

/**
 * @brief  Reference on React Native view which render content.
 */
@property (nonatomic, strong) RCTRootView *rootView;

#pragma mark -


@end


#pragma mark Interface implementation

@implementation CEPNCtatViewController

- (void)viewWillAppear:(BOOL)animated {
    [super viewWillAppear:animated];
    self.title = [self.chat valueForKey:@"name"];
    self.navigationItem.title = self.title;

    if (self.title){
        UIBarButtonItem *inviteUser = [UIBarButtonItem buttonWithData:@{@"title": @"\U0000E002", @"type": @"icon"} target:self];
        inviteUser.action = @selector(handleInviteUserTap:);
        self.navigationItem.rightBarButtonItem = inviteUser;
    } else {
        self.navigationItem.rightBarButtonItem = nil;
    }

}

- (void)viewDidLoad {
    [super viewDidLoad];
    self.view.backgroundColor = [UIColor colorWithRed:219.f/255.f green:219.f/255.f blue:219.f/255.f alpha:1.f];

    self.rootView = [CEPNBridgeManager chatViewWithData:(self.chat ?: @{})];
    self.rootView.backgroundColor = self.view.backgroundColor;
    [self.view addSubview:self.rootView];
}

- (void)viewDidLayoutSubviews {
    [super viewDidLayoutSubviews];
    self.rootView.frame = self.view.bounds;
}


#pragma mark - Handlers

- (void)handleInviteUserTap:(UIBarButtonItem *)button {

    [CEPNBridgeManager sendEvent:@"$.barButton.tap"
                        withData:@{ @"identifier": @"invite.user.button", @"data": self.chat }];
}

#pragma mark -


@end
