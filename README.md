# React Native Push Notification Plugin for ChatEngine

Adds ability to provide remote notification payload for events sent by user to 
[Chat](https://github.com/pubnub/chat-engine/blob/master/src/components/chat.js) and manage notifications in 
notifications center.  
[React Native](https://facebook.github.io/react-native/) used by plugin to register device for 
remote notifications (receive token) and manage remote notifications list in notifications centers 
(mostly to mark notification as `seen`).  

### Documentation

Documentation can be found [here](docs).

### Pre-requirements 

1. PubNub Function with ChatEngine code.  
   ChatEngine use PubNub Function as backend and it's configuration can be completed if you follow 
   [this](https://chatengine-quickstart-app.pubnub.com/login) url and login with PubNub account 
   credentials.    
   This page is automated ChatEngine application configurator. After it will complete, you should use
   keys from newly created ChatEngine application (in PubNub [Admin Console](https://admin.pubnub.com)).
2. Complete required steps from [this](https://gist.github.com/parfeon/c2733f7257ab80909d19571d33ec9b9c) 
   guide to prepare application for **iOS** application to use _Push Notifications_.  
   For `seen` functionality we also need to enable one of _Background Modes_ from `Capabilities` tab:
   ![Enable background mode](https://user-images.githubusercontent.com/794617/53302598-70b25380-3868-11e9-8ab3-78a0ff870aae.png)
3. Complete required steps from [this](https://gist.github.com/parfeon/c438d5175adff86b8a0830a8a96d0301) 
   guide to prepare application for **Android** application to use _FCM_ service.

### Integration

In this document we will use codebase created by `react-native-cli`.  
[React Native](https://facebook.github.io/react-native/) toolchain is depends from OS and platform 
for this application should be generated. Please see read 
[this ReactNative Getting Started](https://facebook.github.io/react-native/docs/getting-started) 
page under **Building Projects with Native Code** - this is required, because plugin use callbacks 
from iOS / Android to notify [React Native](https://facebook.github.io/react-native/) JS code about those 
events.  

Following command has been used to create application which will be used to demonstrate integration 
steps:  
```text
react-native init ChatEnginePushIntegration
cd ChatEnginePushIntegration
``` 

After we created demo application, we need to install required dependencies from 
[yarn](https://yarnpkg.com) by running following command:  
```text
yarn add chat-engine chat-engine-notifications 
```  

Demo application will require from user tap on `Connect` button on all tested devices and on some 
devices send application to background, so notifications will appear on screen. There is two buttons
after `Connect` which allow to send different event types.  
At the end, there is two buttons, which allow to hide last received messages (one-by-on) or hide all
notifications from device's notifications center.  


#### React Native

1. Open `App.js` and import installed dependencies:  
   ```javascript
   import { plugin } from 'chat-engine-notifications';
   import ChatEngineCore from 'chat-engine'
   ```
2. Update default imports for react native application in `App.js`:
   ```javascript
   import { TouchableHighlight, Platform, StyleSheet, Alert, Text, View } from 'react-native';
   ```
3. Update default application layout in `App.js` by replacing oof default App component and styles 
   with following code:
   ```javascript
   export default class App extends Component {
     constructor(properties) {
       super(properties);
   
       this.state = { shouldConnect: true, canSendMessages: false };
     }
    
     render() {
       return (
         <View style={styles.container}>
           <TouchableHighlight
             activeOpacity={1}
             onPress={this.onPressConnect.bind(this)}
             style={this.state.shouldConnect ? styles.button : [styles.button, { opacity: 0.3 }]}
             underlayColor={this.state.shouldConnect ? '#f9efef' : null}>
             <Text style={styles.buttonTitle}>Connect</Text>
           </TouchableHighlight>
           <TouchableHighlight
             activeOpacity={1}
             onPress={this.onPressSendLike.bind(this)}
             style={!this.state.canSendMessages ? styles.button : [styles.button, { opacity: 0.3 }]}
             underlayColor='#f9efef'>
             <Text style={styles.buttonTitle}>Send 'like' event</Text>
           </TouchableHighlight>
           <TouchableHighlight
             activeOpacity={1}
             onPress={this.onPressSendMessage.bind(this)}
             style={!this.state.canSendMessages ? styles.button : [styles.button, { opacity: 0.3 }]}
             underlayColor='#f9efef'>
             <Text style={styles.buttonTitle}>Send message</Text>
           </TouchableHighlight>
              <TouchableHighlight
                activeOpacity={1}
                onPress={this.onPressSeeLast.bind(this)}
                style={this.state.canSendMessages ? styles.button : [styles.button, { opacity: 0.3 }]}
                underlayColor='#f9efef'>
                  <Text style={styles.buttonTitle}>Mark last notification as seen</Text>
              </TouchableHighlight>
              <TouchableHighlight
                activeOpacity={1}
                onPress={this.onPressSeeAll.bind(this)}
                style={this.state.canSendMessages ? styles.button : [styles.button, { opacity: 0.3 }]}
                underlayColor='#f9efef'>
                  <Text style={styles.buttonTitle}>Mark all notifications as seen</Text>
              </TouchableHighlight>
         </View>
       );
     }
  
     onChatEngineReady() {
       // Register plugin and subscribe on events from plugin explained in next paragraph.
     }
   
     onPressConnect () {
       const userName = '<unique user name>';

        if (!this.state.shouldConnect) {
            return;
        }
    
       // Subscribe on '$.ready' event after which plugin will be accessible.
       ChatEngine.once('$.ready', this.onChatEngineReady.bind(this));  
    
       ChatEngine.once('$.error.*', (error) => {
         // Enable connection button.
         this.setState({ shouldConnect: true, canSendMessages: false });
      
         Alert.alert(
           'Connection error', 
           `ChatEngine connection did fail: ${error.error.message}`,
           [{ text: 'OK' }],
           { cancelable: true }
         );
       });
    
       /**
        * Connect ChatEngine. Make sure to use different 'userName' when running code on another 
        * device.
        * Or use same name across multiple devices to test 'markAsSeen' functionality.
        */
       ChatEngine.connect(userName, {}, `${userName}-secret`);
    
       // Disable connection button.
       this.setState({ shouldConnect: false });
     }
   
     onPressSendLike () {
        if (!this.state.canSendMessages) {
            return;
        }
     
       ChatEngine.global.emit('like', { text: 'ReactNative Push Notification Plugin' });
     }
   
     onPressSendMessage () {
        if (!this.state.canSendMessages) {
            return;
        }
     
       ChatEngine.global.emit('message', { text: 'This is test message from ReactNative'});
     }
  
     onPressSeeLast () {
       let notification = notifications.length ? notifications.pop() : null;

       if (notification !== null) {
         ChatEngine.me.notifications.markNotificationAsSeen(notification);
       }
     }

     onPressSeeAll () {
       notifications = [];
       ChatEngine.me.notifications.markAllNotificationAsSeen();
     }
   }
   
   const styles = StyleSheet.create({
     container: {
       flex: 1,
       flexDirection: 'column',
       justifyContent: 'center',
       alignItems: 'stretch',
       backgroundColor: '#ffffff',
     },
     button: {
       borderColor: '#be3532',
       alignItems: 'center',
       borderRadius: 5,
       borderWidth: 1,
       padding: 10,
       margin: 5
     },
     buttonTitle: {
       color: '#be3532',
       fontWeight: 'bold'
     }
   });
   ```
4. Create [ChatEngine](https://www.pubnub.com/docs/chat-engine/reference/chatengine) by adding 
   following code before `export default class App extends Component`:  
   ```javascript
   // Device token storage.
   let deviceToken = null;

   // Store received notifications.
   let notifications = [];
   
   // Create ChatEngine.
   const ChatEngine = ChatEngineCore.create({
     publishKey: '<publish-key>',
     subscribeKey: '<subscribe-key>'
   });
   ```
   Make sure to replace `<publish-key>` and `<subscribe-key>` keys with actual values for your 
   project from PubNub [Admin Console](https://admin.pubnub.com).
5. Add plugin inside of `onChatEngineReady()` function. _proto_ plugin may not work for Android, 
   because it may event some events before application code wil subscribe on them:
   ```javascript
   ChatEngine.me.plugin(plugin({
     events: ['$.invite', 'message', 'like'],
     platforms: { ios: true, android: true },
     messageKey: 'text',
     formatter: (event) => {
       let payload = null;
   
       if (event.event === 'like') {
         const { chat, sender, data } = event;
         let title = `${sender} liked your message in ${chat.channel.split('#').pop()}`;
         let ticker = 'New message like';
         let body = data.text;
         
         payload = {
           apns: { aps: { alert: { title, body } } },
           gcm: { data: { contentTitle: title, contentText: body, ticker } }
         };
       } else if (event.event === '$.invite') {
         // Don't send push notifications for invite by providing empty remote notification 
         // payloads ('apns' and 'gcm' not specified).
         payload = {};
       }
        
       return payload;
     }
   }));
   ```
   Plugin bundled with default `formatter` for `$.invite` and `message` events. Bundled formatter 
   will be used by default, if `formatter` not specified during configuration. In code snippet we 
   used custom `formatter` function which decide on what to do basing on `event` name:  
   
   * use own remote notifications payload for `like` event where notification title will include 
     sender's `uuid` and name of chat on which event has been received (extracted from `chat.channel`) 
   * don't send any notifications when inviting remote user (`$.invite`) by returning empty object 
     w/o `apns` and `gcm` keys. 
   * use bundled formatter for `message` event by simply returning `null` from `formatter` function.
6. Subscribe on events which is sent by plugin by adding following code at the end of
   `onChatEngineReady()` function body:  
   ```javascript
   ChatEngine.me.notifications.on('$notifications.registered', (token) => {   
     // Store token, because we will need it later to enable push notifications on chat.
     deviceToken = token;  

     /**
      * For simplicity, we will enable push notifications on global chat, but it can be any
      * chat.
      *
      * Local user 'direct' chat required if application should be able to mark particular
      * notifications as seen and hide them from device notification center.
      */
     let chats = [ChatEngine.global, ChatEngine.me.direct];
     ChatEngine.me.notifications.enable(chats, deviceToken, (error) => {
       if (error !== null) {
         Alert.alert(
           'Push Notification error',
           `Unable to enable notifications for global: ${error.message}`,
           [{ text: 'OK' }],
           { cancelable: true }
         );
       } else {
         // Enable message publish button.
         this.setState({ canSendMessages: true });
       }
     });
   });

   ChatEngine.me.notifications.on('$notifications.registration.fail', (error) => {
     let errorMessage = error.message || error.error.message;
  
     Alert.alert(
       'Device registration error',
       `Something went wrong during device registration: ${errorMessage}`,
       [{ text: 'OK' }],
       { cancelable: true }
     );
   });

   ChatEngine.me.notifications.on('$notifications.received', (notification) => {
     /**
      * We received remote notification. Store it for this moment and we cam mark it as seen
      * later with buttons.
      */
     notifications.push(notification);
   });
   ```
7. Register notifications channel (required for Android starting from _Oreo_) by adding following 
   code at the end of `onChatEngineReady()` function body:
   ```javascript
   ChatEngine.me.notifications.registerNotificationChannels([
     { id: 'cennotifications', name: 'CENNotifications Channel' }
   ]);
   ```
   **Note:** `cennotifications` is ID, which also used during Android configuration for 
   `com.google.firebase.messaging.default_notification_channel_id`.
8. Request permissions (also trigger device token request) to use notification features (_iOS only_)
   adding following code at the end of `onChatEngineReady()` function body:
   ```javascript
   ChatEngine.me.notifications.requestPermissions({ alert: true, badge: false, sound: true })
     .then(permissions => console.log('Granted with permissions:', JSON.stringify(permissions)))
     .catch(error => console.log('Permissions request did fail:', error));
   ```
   This is last step of plugin integration and preparation, so we can use plugins's functions from 
   this point.
   
   
#### iOS

1. [CocoaPods](https://cocoapods.org) required for integration completion. Tool can be installed by 
   running following command:
   ```text
   sudo gem install cocoapods
   ```
2. Configure and install project dependencies:
   ```text
   cd ios
   ```
   Using preferred text editor create `Podfile` with following content:
   ```ruby
   platform :ios, '10.0'
   
   target 'ChatEnginePushIntegration' do
       pod 'React', :path => '../node_modules/react-native', :subspecs => [ 'Core' ]
       pod 'yoga', :path => '../node_modules/react-native/ReactCommon/yoga'
       pod 'CENNotifications', :path => '../node_modules/chat-engine-notifications'
   end
   ```
   Complete dependencies setup by running following command:
   ```text
   pod install
   ```
3. After commandline tool will complete, make sure to remove certain folders, because of possible
   conflict between ReactNative packager files and files which has ben copied with CocoaPods:
   ```text
   rm ios/Pods/React/package.json
   rm -R ios/Pods/React/node_modules
   ```
   **Note:** This clean up will be required each time when you call `pod install`.
3. When commandline tool will complete installation process, you should be able to find 
   `ChatEnginePushIntegration.xcworkspace` and open it.
4. If iOS application is expected to run only on iOS 10+, then we can import another API to work 
   with push notifications.  
   Use combination `Shift+Cmd+O` from opened Xcode where type or paste `AppDelegate.h` and hit enter
   to open this file. Before `#import <UIKit/UIKit.h>` paste following code:  
   ```objc
   #import <UserNotifications/UserNotifications.h>
   ```
   Also, we need to add another protocol from this newly added API to our application delegate like
   this:  
   ```objc
   @interface AppDelegate : UIResponder <UNUserNotificationCenterDelegate, UIApplicationDelegate>
   ```
5. Use combination `Shift+Cmd+O` from opened Xcode where type or paste `AppDelegate.h` and hit enter
   to open this file to add imports of just installed dependency by placing following line 
   before/after `#import <React/RCTBundleURLProvider.h>`:  
   ```objc
   #import <CENNotifications/CENNotifications.h>
   ```
6. Now we need to add plugin callbacks to this file:
   ```objc
   - (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
       
       // ReactNative initialization code.
  
       [CENNotifications application:application didFinishLaunchingWithOptions:launchOptions];
       
       // Next required only if you completed step #4.
       if (@available(iOS 10.0, *)) {
           UNUserNotificationCenter.currentNotificationCenter.delegate = self;
       
       
       return YES;
   }
   
   - (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken {
  
       [CENNotifications application:application didRegisterForRemoteNotificationsWithDeviceToken:deviceToken];
   }

   - (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error {
  
       [CENNotifications application:application didFailToRegisterForRemoteNotificationsWithError:error];
   }

   - (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo
       fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler {
  
       [CENNotifications application:application didReceiveRemoteNotification:userInfo
              fetchCompletionHandler:completionHandler];
   }

   - (void)application:(UIApplication *)application handleActionWithIdentifier:(NSString *)identifier
       forRemoteNotification:(NSDictionary *)userInfo completionHandler:(void (^)())completionHandler {
  
       [CENNotifications application:application handleActionWithIdentifier:identifier
               forRemoteNotification:userInfo completionHandler:completionHandler];
   }

   - (void)application:(UIApplication *)application handleActionWithIdentifier:(NSString *)identifier
       forRemoteNotification:(NSDictionary *)userInfo withResponseInfo:(NSDictionary *)responseInfo
           completionHandler:(void (^)())completionHandler {
  
       [CENNotifications application:application handleActionWithIdentifier:identifier
               forRemoteNotification:userInfo withResponseInfo:responseInfo
                   completionHandler:completionHandler];
   }

   - (void)userNotificationCenter:(UNUserNotificationCenter *)center
          willPresentNotification:(UNNotification *)notification
            withCompletionHandler:(void (^)(UNNotificationPresentationOptions))completionHandler {
  
       [CENNotifications userNotificationCenter:center willPresentNotification:notification
                          withCompletionHandler:completionHandler];
   }

   - (void)userNotificationCenter:(UNUserNotificationCenter *)center
       didReceiveNotificationResponse:(UNNotificationResponse *)response
                withCompletionHandler:(void (^)(void))completionHandler {
  
      [CENNotifications userNotificationCenter:center didReceiveNotificationResponse:response
                         withCompletionHandler:completionHandler];
   }
   
   
   #pragma mark - Pre-iOS 10 notification delegates

   - (void)application:(UIApplication *)application
       didRegisterUserNotificationSettings:(UIUserNotificationSettings *)notificationSettings {
  
       [CENNotifications application:application didRegisterUserNotificationSettings:notificationSettings];
   }
   ```
7. Ensure what proper `Bundle Identifier` and `Team` in `Signing` section is set to proper values.  
   ![Signing Team Information](https://user-images.githubusercontent.com/794617/53342242-3bfcd580-3916-11e9-8f23-83d591796873.png)

   
#### Android

1. Open Android project from `android` directory with Android studio.
2. Use combination `Shift+Cmd+O` from opened Android Studio where type or paste `build.gradle` and 
   pick from suggested `build.gradle (app)`. Find `applicationId` field in it and replace value with
   application identifier which has been assigned to application which you registered by following 
   [this](https://gist.github.com/parfeon/c438d5175adff86b8a0830a8a96d0301#file-1-configure-fcm-md) 
   guide.
3. While in `build.gradle` remove `implementation 'com.google.firebase:firebase-core:16.0.1'` which 
   has been added during _Firebase SDK_ integration (`chat-engine-notifications` module integrate
   newer SDK version).
4. From project tree root select `ChatEnginePushIntegration` and use combination `Cmd+N` to import
   new module.
   ![Import plugin module](https://user-images.githubusercontent.com/794617/53346586-fb09be80-391f-11e9-9fa5-cda34b343710.png)
5. From opened dialogue pick `Import Gradle Project`.
6. With opened file browser navigate to react-native project root and then follow this path and 
   click `Finish` when done:
   ```text
   node_modules/chat-engine-notifications/Libraries/android/chat-engine-notifications
   ``` 
7. From project tree root select `ChatEnginePushIntegration` and use combination `Cmd+↓` to open 
   module settings.
8. From opened interface pick `app` from `Modules` in sidebar and open `Dependencies` tab on the 
   right.
9. Click `+` at the bottom to add new module dependency.
   ![Add module dependency](https://user-images.githubusercontent.com/794617/53347657-3b6a3c00-3922-11e9-8507-12e1558e6de8.png)
10. Click on `:chat-engine-notifications` and confirm buttons to leave dependency addition and 
   project structure windows.
11. Use combination `Shift+Cmd+O` from opened Android Studio where type or paste
    `MainApplication.java` and hit enter to open it. In opened file find `getPackages()` function 
    and add `CENNotificationsPackage` to it:
    ```java
    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
        new MainReactPackage(),
        new CENNotificationsPackage()
      );
    }
    ```
12. Use combination `Shift+Cmd+O` from opened Android Studio where type or paste
    `MainActivity.java` and hit enter to open it. Add or modify `onNewIntent()`:
    ```java
    @Override
    public void onNewIntent(Intent intent) {
        CENNotifications.onNotification(this, intent, null);
    }
    ```
13. Use combination `Shift+Cmd+O` from opened Android Studio where type or paste
    `AndroidManifest.xml` pick from suggested `AndroidManifest.xml (app/src/main)`. And add 
    permissions and and intention handlers: 
    1. Add permissions request after `<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />`
       ```xml
       <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
       ```
    2. Add intention handlers right before `<activity android:name="MainActivity"... />`:
       ```xml
       <receiver android:name="com.pubnub.cennotifications.modules.CENNotificationsBroadcastListener">
         <intent-filter>
           <action android:name="android.intent.action.BOOT_COMPLETED" />
           <action android:name="com.pubnub.cennotifications.NOTIFICATION_DELETED" />
         </intent-filter>
       </receiver>
            
       <service android:name="com.pubnub.cennotifications.modules.CENNotificationsMessagingService">
         <intent-filter>
           <action android:name="com.google.firebase.MESSAGING_EVENT"/>
         </intent-filter>
       </service>
       ```
    3. Add Firebase channel information (since Oreo channel is required) before 
       `<receiver android:name="com.pubnub.cennotifications.modules.CENNotificationsBroadcastListener">`:
       ```xml
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_channel_id"
            android:value="cennotifications"/>
       ```
       We user `cennotifications` for channel name and also use it in example with 
       `registerNotificationChannels()` function call.