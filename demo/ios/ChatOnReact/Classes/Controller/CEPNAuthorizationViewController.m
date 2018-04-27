#import "CEPNAuthorizationViewController.h"
#import "CEPNBridgeManager.h"


#pragma mark Private interface declaration

@interface CEPNAuthorizationViewController ()

/**
 * @brief  Reference on React Native view which render content.
 */
@property (nonatomic, strong) RCTRootView *rootView;

#pragma mark -


@end


#pragma mark Interface implementation

@implementation CEPNAuthorizationViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    self.view.backgroundColor = [UIColor colorWithRed:219.f/255.f green:219.f/255.f blue:219.f/255.f alpha:1.f];
    
    self.rootView = [CEPNBridgeManager authorizationView];
    self.rootView.backgroundColor = self.view.backgroundColor;
    [self.view addSubview:self.rootView];
}

- (void)viewDidLayoutSubviews {
    [super viewDidLayoutSubviews];
    self.rootView.frame = self.view.bounds;
}

#pragma mark -


@end
