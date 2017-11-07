#import "CEPNChatsViewController.h"
#import "CEPNChatViewController.h"
#import "CEPNBridgeManager.h"
#import <React/RCTLog.h>


#pragma mark Private interface declaration

@interface CEPNChatsViewController ()

/**
 * @brief  Reference on React Native view which render content.
 */
@property (nonatomic, strong) RCTRootView *rootView;

#pragma mark -


@end


#pragma mark Interface implementation

@implementation CEPNChatsViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    self.view.backgroundColor = [UIColor colorWithRed:219.f/255.f green:219.f/255.f blue:219.f/255.f alpha:1.f];

    self.rootView = [CEPNBridgeManager chatsListView];
    self.rootView.backgroundColor = self.view.backgroundColor;
    [self.view addSubview:self.rootView];
}

- (void)viewDidLayoutSubviews {
    [super viewDidLayoutSubviews];
    self.rootView.frame = self.view.bounds;
}


#pragma mark - Segues

- (void)prepareForSegue:(UIStoryboardSegue *)segue sender:(id)sender {
    if ([[segue identifier] isEqualToString:@"showDetail"]) {
        CEPNChatViewController *controller = (CEPNChatViewController *)[[segue destinationViewController] topViewController];
        controller.chat = self.selectedChat;
        controller.navigationItem.leftItemsSupplementBackButton = YES;
    }
}

#pragma mark -


@end
