#import "CEPNInviteUserViewController.h"
#import "CEPNBridgeManager.h"


#pragma mark Private interface declaration

@interface CEPNInviteUserViewController ()


#pragma mark - Information

/**
 * @brief  Reference on React Native view which render content.
 */
@property (nonatomic, strong) RCTRootView *rootView;


#pragma mark - Handlers

/**
 * @brief  Handle user tap on 'Cancel' button.
 *
 * @param sender Reference on bar button which has been tapped.
 */
- (IBAction)cancelButtonTap:(id)sender;

#pragma mark -


@end


#pragma mark - Interface implementation

@implementation CEPNInviteUserViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    self.view.backgroundColor = [UIColor colorWithRed:219.f/255.f green:219.f/255.f blue:219.f/255.f alpha:1.f];

    self.rootView = [CEPNBridgeManager inviteUserViewWithData:self.chat];
    self.rootView.backgroundColor = self.view.backgroundColor;
    [self.view addSubview:self.rootView];
}

- (void)viewDidLayoutSubviews {
    [super viewDidLayoutSubviews];
    self.rootView.frame = self.view.bounds;
}


#pragma mark - Handlers

- (IBAction)cancelButtonTap:(id)sender {

    [self.navigationController dismissViewControllerAnimated:YES completion:nil];
}

@end
