//
//  CENDefines.h
//  NativeToReact
//
//  Created by Sergey Mamontov on 9/24/17.
//  Copyright © 2017 PubNub. All rights reserved.
//

#ifndef CENDefines_h
#define CENDefines_h

#define CEN_EXTERN extern __attribute__((visibility("default")))

#define CEN_SYSTEM_VERSION_GREATER_THAN_OR_EQUAL_TO(version) \
    ([[[UIDevice currentDevice] systemVersion] compare:version options:NSNumericSearch] != NSOrderedAscending)

#define CE_UN_NNOTIFICATION_AVAILABLE 0
#if (TARGET_OS_IOS && __IPHONE_OS_VERSION_MAX_ALLOWED >= 100000) || \
    (TARGET_OS_WATCH && __WATCH_OS_VERSION_MAX_ALLOWED >= 30000) || \
    (TARGET_OS_OSX && __MAC_OS_X_VERSION_MAX_ALLOWED >= 101200)
    #undef CE_UN_NNOTIFICATION_AVAILABLE
    #define CE_UN_NNOTIFICATION_AVAILABLE 1
#endif

#endif /* CENDefines_h */
