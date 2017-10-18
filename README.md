# ChatEngine Native Notifications
This module allow to integrate with native platform (iOS) to register for notifications and receive them when they arrive.  

# Integration into existing iOS project
## Project structure
ReactNative has requirements for project structure so it will know location of components which 
required to run application.  
Move existing iOS project into new folder which will become root of ReactNative project. Xcode project 
folder should be renamed to **ios**.  
ReactNative powered by [NodeJS](https://nodejs.org/en/) and require `package.json` for configuration
and run. Place one into ReactNative project root (same level as **ios** folder) with next content:  

```json
{
  "name": "ReactNativeIntegration",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "node node_modules/react-native/local-cli/cli.js start"
  },
  "dependencies": {
    "chat-engine": "^0.5.2",
    "react": "16.0.0-alpha.12",
    "react-native": "^0.47.2"
  }
}
```  

To run iOS application, we need to create `index.ios.js` which will contain ReactNative components 
and ChatEngine initialization along with notifications management module.  

At the end, ReactNative project root should look like this:  

```yaml
ReactNativeIntegration
  - ios
  - index.ios.js
  - package.json
```

## Modules integration
### ReactNative
After all preparation will be completed, NPM need to install all required modules. Run next command 
in terminal from ReactNative project root:  

```shell
npm install
``` 
This command will install into `node_modules` folder ChatEngine along with ReactNative components.
  
### Xcode project
ReactNative consists from two parts: JS and native modules. Native modules is responsible for JS 
components layout using native components. JS code translated to native code which is used to build
interface and configure layout constraints.  
To add support into native project, CocaPods will be used. ReactNative contain local podspec for 
it's components which will be used to complete integration.  
Update (or create if doesn't exists) `Podfile` inside of **ios** folder with next content:  

```ruby
platform :ios, '10.0'

target '<name of target in Xcode>' do
	pod 'React', :path => '../node_modules/react-native', :subspecs => [
	    'Core',
	    'DevSupport', # Include this to enable In-App Devmenu if RN >= 0.43
	    'RCTText',
	    'RCTImage',
	    'RCTNetwork',
	    'BatchedBridge',
	    'RCTWebSocket', # needed for debugging
	]
	pod 'yoga', :path => '../node_modules/react-native/ReactCommon/yoga'
	pod 'CENNotifications', :path => '../node_modules/chat-engine-push-notifications'
end
```
Set of used subspecs depends from number of used ReactNative components and whether they require 
native counterpart.  
Last command which should be run from **ios** folder root is:  

```shell
pod install
```

## Usage
### ReactNative
To use ChatEngine and notification manager, they need to be initialized in `index.ios.js` like this:  

```js
import React from 'react';
import { AppRegistry } from 'react-native';
import ChatEngineCore from 'chat-engine'
import { CENotifications } from 'chat-engine-push-notifications';

// Chat engine configuration
const ChatEngine = ChatEngineCore.create(
    { publishKey: '<pub-key>', subscribeKey: '<subscribe-key>' }, 
    { endpoint: 'http://<server.js running machine IP address>:3000/insecure' });

// Notification manager configuration
const configuration = {
    events: ['$.invite', 'message'],
    platforms: {'ios': true, 'android': true},
    requestPermissions: true,
    popInitialNotification: true,
    onNotification: (payload) => {
        console.log(`Did receive notification: ${payload.notification}`);
        /**
         * Mark for other ChatEngine users with same 'uuid' notification as 'seen' and hide from 
         * notification center.
         */
        CENotifications.markNotificationAsSeen(payload);
    }
};
CENotifications.setup(ChatEngine, configuration);
```  
Full documentation about ChatEngine configuration can be found [here](https://chat-engine-docs.surge.sh/docs/).  

### iOS
To name things persist their state between window, `RCTBridge` should be used to initialize communication bridge:

```objc
@interface AppDelegate () <UNUserNotificationCenterDelegate, RCTBridgeDelegate>

@property (nonatomic, strong) RCTBridge *bridge;

@end

@implementation AppDelegate


- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {

    self.bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
    
    return YES;
}

- (void)application:(UIApplication *)application didRegisterUserNotificationSettings:(UIUserNotificationSettings *)notificationSettings {

    [CENNotifications application:application didRegisterUserNotificationSettings:notificationSettings];
}

- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken {

    [CENNotifications application:application didRegisterForRemoteNotificationsWithDeviceToken:deviceToken];
}

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo {

    [CENNotifications application:application didReceiveRemoteNotification:userInfo];
}

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo
fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler {

    [CENNotifications application:application
     didReceiveRemoteNotification:userInfo
           fetchCompletionHandler:completionHandler];
}

- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error {

    [CENNotifications application:application didFailToRegisterForRemoteNotificationsWithError:error];
}

- (void)application:(UIApplication *)application handleActionWithIdentifier:(NSString *)identifier forRemoteNotification:(NSDictionary *)userInfo completionHandler:(void (^)(void))completionHandler {

    [CENNotifications application:application
       handleActionWithIdentifier:identifier
            forRemoteNotification:userInfo
                completionHandler:completionHandler];
}

- (void)application:(UIApplication *)application handleActionWithIdentifier:(NSString *)identifier forRemoteNotification:(NSDictionary *)userInfo withResponseInfo:(NSDictionary *)responseInfo completionHandler:(void (^)(void))completionHandler {

    [CENNotifications application:application
       handleActionWithIdentifier:identifier
            forRemoteNotification:userInfo
                 withResponseInfo:responseInfo
                completionHandler:completionHandler];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge {
    return [NSURL URLWithString:@"http://<host machine IP address>:8081/index.ios.bundle?platform=ios"];
}

@end
```

Created `brdige` should be passed between controller which would like to display results (rendered
from ReactNative syntax) on screen (all coding done in JS file and view controller only present 
rendered view).

# To-do
1. Make use of upcoming ChatEngine updates to integrate into `Chat` class before it was instantiated 
so middleware functions will be called as required. At this moment list of active chats monitored by 
timer which cause delay in middleware plugin _installation_.
2. Add ability to reset singleton instance. During reset process it will have to unregister chats 
from push notification receiving. This can be required for cases, when user should log out and 
another user should not receive any push notifications from previous user.  
3. Try find a way to suppress notifications for messages which has been sent by current ChatEngine 
user. This issue has been observed when `textInput` action has been used to respond on received 
message.