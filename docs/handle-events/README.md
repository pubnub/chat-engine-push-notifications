Plug-in emit four events: `$notifications.registered`, `$notifications.registration.fail`, 
`$notifications.received` and `$notifications.seen`. Most useful here can be last two, which inform 
about new notification and when notification has been marked as `seen`.

### Handling new notifications
New remote notifications can be received from native application in few cases: the application was in foreground or application has been launched because of user interaction with the notification 
(interactive notification).  
To handle these events, event subscriber can be added to `notifications` property of 
[Me](https://github.com/pubnub/chat-engine/blob/master/src/components/me.js) to listen for 
`$notifications.received` event.  
Event handler will receive only one object - [Notification](../data-objects#notification-payload) 
payload which can be processed by handler:  

```js
ChatEngine.me.notifications.on('$notifications.received', notification => 
  console.log(`Received notification: ${JSON.stringify(notification.notification)}`));
```

### Handling notification 'seen'
When local user mark notification as `seen` - this event sent across all devices which he used to work in chat and notification will disappear from notification centers on those devices. This event can be useful to update the list of unchecked notifications in application.  
To handle these events, event subscriber can be added to `notifications` property of 
[Me](https://github.com/pubnub/chat-engine/blob/master/src/components/me.js) to listen for 
`$notifications.seen` event.  
In response on this event, it may be useful to request list of previously delivered notifications 
which is pending for user to view or dismiss them:  

```js
ChatEngine.me.notifications.on('$notifications.seen', () => {
  ChatEngine.me.notifications.deliveredNotifications(notifications => {
    notifications.forEach(notification =>
      console.log(`Notification received at ${notification.date}: ${JSON.stringify(notification.notification)}`));
  });
});
```

### Handle device registration for remote notifications
Result of registration process can be handled in place of 
[requestPermissions](../api#request-permissions-to-use-push-notifications) function call. If it 
required to handle it from different location, it is possible by adding event subscriber to 
`notifications` property of [Me](https://github.com/pubnub/chat-engine/blob/master/src/components/me.js) 
to listen for `$notifications.registered` and `$.notifications.registration.fail` events:  

```js
ChatEngine.me.notifications.on('$notifications.registered', token => 
  console.log('Device notification token:', token));
ChatEngine.me.notifications.on('$notifications.registration.fail', error => 
  console.log('Device registration did fail:', error));
```