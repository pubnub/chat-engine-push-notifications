Demo application to demonstrate how `chat-engine-notifications` can be used with [Chat Engine](https://chat-engine-docs.surge.sh/docs/).  
Few steps is required to use this application:  
1. install `npm` dependencies from demo project root:  
    ```bash
    npm install
    ```  
2. Change PubNub keys in `index.ios.js` and `index.android.js`:  
    ```js
    const ChatEngine = ChatEngineCore.create({
        publishKey: '<publish-key>',
        subscribeKey: '<subscribe-key>'
    });
    ```
2. Configure and run [Chat Engine](https://chat-engine-docs.surge.sh/docs/)'s PubNub functions to handle users/chats authorization.  
3. Follow [this](https://www.pubnub.com/docs/ios-objective-c/mobile-gateway#APNS_Prerequisites) tutorial to receive APNS certificate and register it with PubNub admin [portal](https://admin.pubnub.com).
4. Follow [this](https://github.com/pubnub/chat-engine-push-notifications/wiki/integration#integration-into-android-application) tutorial to configure FCM and register GCM key with PubNub admin [portal](https://admin.pubnub.com).
5. Specify application identifiers corresponding to account:    
    * for **iOS** navigate to project's `General` settings and set there proper `Bundle Identifier` and `Team` to be able to use generated APNS certificate with PubNub service.  
    * for **Android** open module's Gradle build configuration `app/build.gradle` and change `applicationId` to value which has been specified for FCM application identifier.  

**iOS** require additional steps to run application:  
1. From **ios** directory call `CocoaPods` dependencies installation:  
    ```bas
    cd ios
    pod install
    ```
2. After `CocoaPod` complete dependencies installation open created `ChatOnReact.xcworkspace`  
3. If remote React Native server used for deployment (**iOS** only), make sure to change IP address in `CEPNAppDelegate.m` file:  
   ```objc
   - (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
       ...
       NSURL *bundleURL = [NSURL URLWithString:@"http://<react-native server IP>:8081/index.ios.bundle?platform=ios"];
       ...
   }
   ```  

**Standalone** 
1. From project root (**ios** directory level) you need to run React Native deployment server to test application or follow [these](https://github.com/pubnub/chat-engine-push-notifications/wiki/integration#standalone) steps to make it standalone version for **iOS** and upload to device.
2. From project root (**android** directory level) you need to run React Native deployment server to test application or follow [these](https://github.com/pubnub/chat-engine-push-notifications/wiki/integration#standalone-1) steps to make it standalone version for **Android** and upload to device.  

**iOS** require additional steps to run application:  
1. For standalone configuration `NSURL` with IP address should be replaced with path to `jsbundle` as shown in [this](https://github.com/pubnub/chat-engine-push-notifications/wiki/integration#standalone) manual.
