//
//  CENUtils.h
//  NativeToReact
//
//  Created by Sergey Mamontov on 9/24/17.
//  Copyright © 2017 PubNub. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "CENDefines.h"


NS_ASSUME_NONNULL_BEGIN

/**
 * @brief  Check whether user provided permissions to work with remote/local notifications or not.
 *
 * @param block Reference on block which called at the end of verification process. Block pass two arguments:
 *              \c granted - whether remote/local notifications can be used by application; \c requested - whether
 *              access rights has been requested earlier.
 */
CEN_EXTERN void CENGrantedAnyPermissions(void(^block)(BOOL granted, BOOL requested));

/**
 * @brief      Convert provided permissions to target permissions data type.
 * @discussion All enabled fields (value is set to @YES) will be added to permission. If passed dictionary is empty, all
 *             permissions will be included.
 *
 * @param permissions Reference on dictionary which contain keys (alert, sound, badge) which should be translated to
 *                    native permission data type.
 *
 * @return Depending from OS version different data types can be returned.
 */
CEN_EXTERN NSUInteger CENPermissionFromNSDictionary(NSDictionary *permissions);

/**
 * @brief      Convert notification permission to dictionary.
 * @discussion If certain permission granted, it will be stored under corresponding key and @YES as value.
 *
 * @param permissions Reference on bit field which hold information about granted permissions which should be
 *                    serialized.
 *
 * @return Dictionary with serialiced notification permissions.
 */
CEN_EXTERN NSDictionary *CENNSDictionaryFromPermissions(NSUInteger permissions);

/**
 * @brief      Check whether application code is running from application extension bundle.
 * @discussion This function used in cases when certain API access should be limited to real application and can't be
 *             used within extension.
 *
 * @return \c YES in case if application code is running from extension bundle.
 */
CEN_EXTERN BOOL CENRunningFromExtensionBundle(void);

/**
 * @brief      Retrieve reference on shared application instance.
 * @discussion Shortcut function to make code cleaner and take into account whether application is running from
 *             extension bundle or not.
 *
 * @return Reference on shared application instance or \c nil in case if running from extension bundle.
 */
CEN_EXTERN UIApplication *CENSharedApplication(void);

#pragma mark -

NS_ASSUME_NONNULL_END
