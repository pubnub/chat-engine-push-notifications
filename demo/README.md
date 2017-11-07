Demo application to demonstrate how `chat-engine-notifications` can be used with [Chat Engine](https://chat-engine-docs.surge.sh/docs/).  
Few steps is required to use this application:  
1. install `npm` dependencies from demo project root:  
    ```bash
    npm install
    ```  
2. Change  PubNub keys and [Chat Engine](https://chat-engine-docs.surge.sh/docs/) server running machine IP address in `index.ios.js` and `index.android.js`:  
    ```js
    const ChatEngine = ChatEngineCore.create({
        publishKey: '<publish-key>',
        subscribeKey: '<subscribe-key>'
    }, { endpoint: 'http://<server.js running machine IP address>:3000/insecure' });
    ```
2. Configure and run  [Chat Engine](https://chat-engine-docs.surge.sh/docs/)'s `server.js` file to handle users/chats authorization.  
3. Follow [this](https://www.pubnub.com/docs/ios-objective-c/mobile-gateway#APNS_Prerequisites) tutorial to receive APNS certificate and register it with PubNub admin [portal](https://admin.pubnub.com).
4. From **ios** directory call `CocoaPods` dependencies installation:  
    ```bas
    cd ios
    pod install
    ```  
5. After `CocoaPod` complete dependencies installation open created `ChatOnReact.xcworkspace`  
6. Navigate to project's `General` settings and set there proper `Bundle Identifier` and `Team` to be able to use generated APNS certificate with PubNub service.
7. From project root (**ios** directory level) you need to run React Native deployment server to test application or follow [these](https://github.com/pubnub/chat-engine-push-notifications/wiki/integration#standalone) steps to make it standalone and upload to device.  
8. If remote React Native server used for deployment, make sure to change IP address in `CEPNAppDelegate.m` file:  
    ```objc
    - (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
        ...
        [CEPNBridgeManager setupWithJSBundleURL:[NSURL URLWithString:@"http://<react-native server IP>:8081/index.ios.bundle?platform=ios"]
                                  launchOptions:launchOptions];
        ...
    }
    ```
9. For standalone configuration `NSURL` with IP address should be replaced with path to `jsbundle` as shown in [this](https://github.com/pubnub/chat-engine-push-notifications/wiki/integration#standalone) manual.
