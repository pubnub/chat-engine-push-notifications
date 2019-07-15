Plug-in provides a set of functions to work with notifications.  
After registration with [ChatEngine](https://github.com/pubnub/chat-engine), new property appear 
for [Me](https://github.com/pubnub/chat-engine/blob/master/src/components/me.js) and called 
`notifications` - this is entry point for calling API and handling events.  

**NOTE:** [ChatEngine](https://github.com/pubnub/chat-engine) create 
[Me](https://github.com/pubnub/chat-engine/blob/master/src/components/me.js) instance only after 
connection and it became available for usage only when `$.ready` event emitted by 
[ChatEngine](https://github.com/pubnub/chat-engine).  
```js
// Create ChatEngine.
const ChatEngine = ChatEngineCore.create({
  publishKey: '<publish-key>',
  subscribeKey: '<subscribe-key>'
});

ChatEngine.on('$.ready', () => {
  ChatEngine.me.plugin(plugin({
      events: ['$.invite', 'message', 'like'],
      platforms: { ios: true, android: true }
    }));
});

ChatEngine.connect('user', { user: 'data' }, 'secret/password');
```
Make sure to replace `<publish-key>` and `<subscribe-key>` keys with actual values for your project 
from PubNub [Admin Console](https://admin.pubnub.com).


## Functions

<a id="applicationiconbadgenumber" />  

[`applicationIconBadgeNumber((number) => {})`](#applicationiconbadgenumber)  
This function allow to request this information from native application and get **asynchronous** 
response through passed _callback_ function.  

**Note:** for Android it will return immediately with **-1** as a result.  
 
### Parameters:

| Parameter  | Type           | Attributes | Description |
|:----------:|:--------------:|:----------:| ----------- |
| `callback` | (number) => {} | `Required` | Used for **asynchronous** response from native module with requested information. |  
 
### Returns:

Currently displayed on badge icon number.

### Example


```js
ChatEngine.me.notifications.applicationIconBadgeNumber(number => 
  console.log(`Application's icon badge number is: ${number}`));
```  


<br/><a id="setapplicationiconbadgenumber" />

[`setApplicationIconBadgeNumber(number)`](#setapplicationiconbadgenumber)    
This function allow to change currently displayed application's icon badge number to passed value. 
 
### Parameters:

| Parameter | Type   | Attributes | Description |
|:---------:|:------:|:----------:| ----------- |
| `number`  | Number | `Required` | Value which should be shown on the application's icon badge. |  

### Example

```js
ChatEngine.me.notifications.setApplicationIconBadgeNumber(3);
```

<br/><a id="requestpermissions" />

[`requestPermissions(permissions, categories)`](#requestpermissions)
This function allows requesting permissions from a native application to register a device to receive remote notifications.  
**iOS** environment additionally allows configuring which _permissions_ for notifications should be requested and allow to specify notification handling _category_.  
Function return _Promise_ which if required to update interface can be handled.    

**Note:** for Android it will return immediately with resolved _Promise_ because there is no need to
request permissions and registration process starts automatically by 
[FCM](https://firebase.google.com/docs/cloud-messaging/).
 
### Parameters:

| Parameter     | Type            | Attributes | Description |
|:-------------:|:---------------:|:----------:| ----------- |
| `permissions` | [Permissions](../data-objects#notification-permissions) | `Required`<br/>**iOS only** | Object represent notification features which application would like to use. |  
| `categories`  | [CENotificationCategory](../models/cenotificationcategory)[]   | `Required`<br/>**iOS only** | Array of `CENotificationCategory` instance to configure interactive notifications handling. |  

### Example

```js
ChatEngine.me.notifications.requestPermissions({alert: true, badge: false, sound: true})
  .then(permissions => console.log('Granted with permissions:', JSON.stringify(permissions)))
  .catch(error => console.log('Permissions request did fail:', error));
```    


<br/><a id="registernotificationchannel" />

[`registerNotificationChannels(channels)`](#registernotificationchannel)
Starting from Android Oreo (8.0) it is required to register notification channel which will be used to route notification. Channel contains basic information about how notifications will be presented when sent to it.  

**Note:** for iOS this function will return immediately.  

### Parameters:

| Parameter  | Type            | Attributes | Description |
|:----------:|:---------------:|:----------:| ----------- |
| `channels` | [NotificationChannel](../data-objects#notification-channel)[] | `Required`<br/>**Android only** | List of notification channels which contain notification representation configuration. |  

### Example

```js
ChatEngine.me.notifications.registerNotificationChannels([
  { id: 'cennotifications', name: 'CENNotifications Channel' }
]);
```  


<br/><a id="registernotificationactions" />

[`registerNotificationActions(actions)`](#registernotificationactions)
It is possible to register listeners for actions which user pick from the interactive notification. This function allows binding an action to open specified.  

**Note:** for iOS this function will return immediately.

### Parameters:

| Parameter  | Type   | Attributes | Description |
|:----------:|:------:|:----------:| ----------- |
| `actions`  | Object | `Required`<br/>**Android only** | Object contain notification action names as keys and target activity names as values.<br/>Activity names should be composed relatively to package name (`com.company.app`): `<path-to-class>.<activity-class-name>`<br/>Special names available: `default` (to use launcher activity) and `none` (simply forward user decision to JS side) |  

### Example

```js
ChatEngine.me.notifications.registerNotificationActions({ Accept: 'JoinScreen', Reject: 'none' }));
```    


<br/><a id="deliverinitialnotifications" />

[`deliverInitialNotification()`](#deliverinitialnotifications)
This function allows receiving a notification which has been used to open application.  
Notification will be sent along with `$notifications.received` event.

### Example

```js
ChatEngine.me.notifications.deliverInitialNotification();
```

<br/><a id="getdeliverednotifications" />

[`deliveredNotifications((notifications) => {})`](#getdeliverednotifications)  
This function allow **asynchronously** request native module to get list of all notifications which
has been sent by [ChatEngine](https://github.com/pubnub/chat-engine) and delivered to user's device 
and return them through passed _callback_ function.  

### Parameters:

| Parameter  | Type   | Attributes | Description |
|:----------:|:------:|:----------:| ----------- |
| `callback` | ([Notification](../data-objects#delivered-notification-payload)[]) => {} | `Required` | Used for **asynchronous** response from native module with requested information. |  

### Example

```js
ChatEngine.me.notifications.deliveredNotifications(notifications =>
  notifications.forEach(notification => { 
    // Handle notification 
  })
);
```

<br/><a id="enablepush" />

[`enable(chats, token, completion)`](#enablepush)  
Enable push notifications on specified list of 
[Chats](https://github.com/pubnub/chat-engine/blob/master/src/components/chat.js).  

### Parameters:

| Parameter    | Type          | Attributes | Description |
|:------------:|:-------------:|:----------:| ----------- |
| `chats`      | [Chat](https://github.com/pubnub/chat-engine/blob/master/src/components/chat.js)[] | `Required` | List of [Chats](https://github.com/pubnub/chat-engine/blob/master/src/components/chat.js) for which remote notification should be triggered. |  
| `token`      | String        | `Required` | Device token which has been provided by OS through ReactNative. |  
| `completion` | (error) => {} |            | Function which will be called at the end of registration process and pass error (if any). |  

### Example

```js
ChatEngine.me.notifications.enable(ChatEngine.global, this.devicePushToken, (errorStatuses) => {
  if (errorStatuses) {
    // Handle push notification state change error statues.
  } else {
    // Push notification for global has been enabled.
  }
});
```

<br/><a id="disablepush" />

[`disable(chats, token, completion)`](#disablepush)  
Disable push notifications on specified list of 
[Chats](https://github.com/pubnub/chat-engine/blob/master/src/components/chat.js).  

### Parameters:

| Parameter    | Type          | Attributes | Description |
|:------------:|:-------------:|:----------:| ----------- |
| `chats`      | [Chat](https://github.com/pubnub/chat-engine/blob/master/src/components/chat.js)[] | `Required` | List of [Chats](https://github.com/pubnub/chat-engine/blob/master/src/components/chat.js) for which remote notification should be removed. |  
| `token`      | String        | `Required` | Device token which has been provided by OS through ReactNative. |  
| `completion` | (error) => {} |            | Function which will be called at the end of unregister process and pass error (if any). |  

### Example

```js
ChatEngine.me.notifications.disable(ChatEngine.global, this.devicePushToken, (errorStatuses) => {
  if (errorStatuses) {
    // Handle push notification state change error statues.
  } else {
    // Push notification for global has been disabled.
  }
});
```

<br/><a id="disableallpush" />

[`disableAll(token, completion)`](#disableallpush)  
Disable all push notifications for device.

### Parameters:

| Parameter    | Type          | Attributes | Description |
|:------------:|:-------------:|:----------:| ----------- |  
| `token`      | String        | `Required` | Device token which has been provided by OS through ReactNative. |  
| `completion` | (error) => {} |            | Function which will be called at the end of unregister process and pass error (if any). |  

### Example

```js
ChatEngine.me.notifications.disableAll(this.devicePushToken, (errorStatuses) => {
  if (errorStatuses) {
    // Handle push notification unregister error statuses.
  } else {
    // Device has been unregistered from push notification.
  }
});
```

<br/><a id="marknotificatinoasseen" />

[`markNotificationAsSeen(notifications)`](#marknotificatinoasseen)  
This function allow to mark single notification (sent from 
[ChatEngine](https://github.com/pubnub/chat-engine)) as `seen` on all devices where it has been 
delivered.

### Parameters:

| Parameter  | Type   | Attributes | Description |
|:----------:|:------:|:----------:| ----------- |
| `callback` | [Notification](../data-objects#notification-payload) | `Required` | Notification which should be marked by native module as 'seen'. |
  
### Example

```js

ChatEngine.me.notifications.on('$notifications.received', (notification) => {
  console.log(`Received notification: ${JSON.stringify(notification.notification)}`);
  ChatEngine.me.notifications.markNotificationAsSeen(notification);
});
```

<br/><a id="markallasseen" />

[`markAllNotificationAsSeen()`](#markallasseen)  
This function allow to mark all notifications (sent from 
[ChatEngine](https://github.com/pubnub/chat-engine)) as `seen` on all devices where it has been 
delivered.
  
### Example

```js
ChatEngine.me.notifications.markAllNotificationAsSeen();
```