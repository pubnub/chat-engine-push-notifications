#import "UIBarButtonItem+CEPNBarButtonItem.h"
#import "RCTConvert+CEPNChatManager.h"


#pragma mark - Private category interface declaration

@interface UIBarButtonItem (CEPNBarButtonItemPrivate)


#pragma mark - Misc

/**
 * @brief  Create selector for bar button item with random name.
 *
 * @return Random selector.
 */
+ (SEL)randomBarButtonAction;

#pragma mark -


@end


#pragma mark Category interface implementation

@implementation UIBarButtonItem (CEPNBarButtonItem)

+ (UIBarButtonItem *)buttonWithData:(NSDictionary *)data target:(id)target {
    UIBarButtonItem *button = nil;
    NSDictionary *buttonData = [RCTConvert NSDictionary:data];
    NSString *type = [RCTConvert NSString:buttonData[@"type"]];
    NSString *title = [RCTConvert NSString:buttonData[@"title"]];
    SEL action = [self randomBarButtonAction];

    if ([type isEqualToString:@"system"]) {
        button = [[UIBarButtonItem alloc] initWithBarButtonSystemItem:[RCTConvert CEPNUIBarButtonSystemItem:title]
                                                               target:target action:action];
    } else if ([type isEqualToString:@"text"] || [type isEqualToString:@"icon"]) {
        button = [[UIBarButtonItem alloc] initWithTitle:title style:UIBarButtonItemStylePlain target:target action:action];

        if ([type isEqualToString:@"icon"]) {
            NSDictionary *attributes = @{ NSFontAttributeName: [UIFont fontWithName:@"simple-line-icons" size:18.f] };
            [button setTitleTextAttributes:attributes forState:UIControlStateNormal];
            [button setTitleTextAttributes:attributes forState:UIControlStateHighlighted];
        }
    }

    return button;
}


#pragma mark - Misc

+ (SEL)randomBarButtonAction {
    NSString *randomName = [[[NSUUID UUID] UUIDString] stringByReplacingOccurrencesOfString:@"-" withString:@""];

    return NSSelectorFromString([NSString stringWithFormat:@"barButton_%@:", randomName]);
}

#pragma mark -


@end
