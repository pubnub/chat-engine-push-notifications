#import "RCTConvert+CEPNChatManager.h"


#pragma mark Category implementation

@implementation RCTConvert (CEPNChatManager)

+ (UIModalPresentationStyle)CEPNUIModalPresentationStyle:(NSString *)style {
    static NSDictionary<NSString *, NSNumber *> *_presentationStyles;
    UIModalPresentationStyle presentationStyle = UIModalPresentationCurrentContext;

    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        _presentationStyles = @{
            @"fullScreen": @(UIModalPresentationFullScreen),
            @"pageSheet": @(UIModalPresentationPageSheet),
            @"formSheet": @(UIModalPresentationFormSheet),
            @"currentContext": @(UIModalPresentationCurrentContext),
            @"overFullScreen": @(UIModalPresentationOverFullScreen),
            @"overCurrentContext": @(UIModalPresentationOverCurrentContext),
            @"popover": @(UIModalPresentationPopover),
            @"none": @(UIModalPresentationNone)
        };
    });

    if (_presentationStyles[[RCTConvert NSString:style]]) {
        presentationStyle = _presentationStyles[[RCTConvert NSString:style]].integerValue;
    }

    return presentationStyle;
}

+ (UIBarButtonSystemItem)CEPNUIBarButtonSystemItem:(NSString *)type {
    static NSDictionary<NSString *, NSNumber *> *_systemItemTypes;
    UIBarButtonSystemItem systemItemType = UIBarButtonSystemItemDone;

    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        _systemItemTypes = @{
            @"done": @(UIBarButtonSystemItemDone),
            @"cancel": @(UIBarButtonSystemItemCancel),
            @"edit": @(UIBarButtonSystemItemEdit),
            @"save": @(UIBarButtonSystemItemSave),
            @"add": @(UIBarButtonSystemItemAdd),
            @"flexibleSpace": @(UIBarButtonSystemItemFlexibleSpace),
            @"fixedSpace": @(UIBarButtonSystemItemFixedSpace),
            @"compose": @(UIBarButtonSystemItemCompose),
            @"reply": @(UIBarButtonSystemItemReply),
            @"action": @(UIBarButtonSystemItemAction),
            @"organize": @(UIBarButtonSystemItemOrganize),
            @"bookmarks": @(UIBarButtonSystemItemBookmarks),
            @"search": @(UIBarButtonSystemItemSearch),
            @"refresh": @(UIBarButtonSystemItemRefresh),
            @"stop": @(UIBarButtonSystemItemStop),
            @"camera": @(UIBarButtonSystemItemCamera),
            @"trash": @(UIBarButtonSystemItemTrash),
            @"play": @(UIBarButtonSystemItemPlay),
            @"pause": @(UIBarButtonSystemItemPause),
            @"rewind": @(UIBarButtonSystemItemRewind),
            @"fastForward": @(UIBarButtonSystemItemFastForward),
            @"undo": @(UIBarButtonSystemItemUndo),
            @"redo": @(UIBarButtonSystemItemRedo)
        };
    });
    
    if (_systemItemTypes[[RCTConvert NSString:type]]) {
        systemItemType = _systemItemTypes[[RCTConvert NSString:type]].integerValue;
    }

    return systemItemType;
}

#pragma mark -


@end
