#import <UIKit/UIKit.h>


NS_ASSUME_NONNULL_BEGIN

#pragma mark - Category interface declaration

@interface UIBarButtonItem (CEPNBarButtonItem)

/**
 * @brief  Create and configure \a UIBarButtonItem using data received from React Native code.
 *
 * @param data   Reference on Object which has been sent from React Native code to be used to construct buttons.
 * @param target Reference on object which should handle user actions.
 *
 * @return Configured and ready to use bar button item.
 */
+ (nullable UIBarButtonItem *)buttonWithData:(NSDictionary *)data target:(id)target;

#pragma mark -

NS_ASSUME_NONNULL_END


@end
