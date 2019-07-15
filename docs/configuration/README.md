To be able to use this plug-in, it should be configured and registered with
[ChatEngine](https://github.com/pubnub/chat-engine).
  
### Register with Chat Engine
Plug-in is extension of [ChatEngine's](https://github.com/pubnub/chat-engine)
[Me](https://github.com/pubnub/chat-engine/blob/master/src/components/me.js) object and it should 
be registered for it. In [ChatEngine](https://github.com/pubnub/chat-engine) initialization code add
next code:
  
```js
ChatEngine.me.plugin(plugin({
   events: ['$.invite', 'message'],
   platforms: { ios: true, android: true }
}));

```
This is all that required to perform minimal configuration.


### Properties:

| Field        | Type     | Attributes | Default   | Description |
|:------------:|:--------:|:----------:|:---------:|:----------- |
| `events`     | String[] | `Required` |           | List of events for which push notification payload should be added.<br/>`Events` - is objects which actually sent through **PubNub** real-time network to all remote subscribers. It can be _message_ or [ChatEngine's](https://github.com/pubnub/chat-engine) _$.invite_ request to join to chat.<br/><br/>**Example:**<br/>`{ events: ['$.invite', 'message'] }` |
| `platforms`  | Object   | `Required` |           | Object should contain two keys: `apns` and `gcm`. _Boolean_ values for keys tell for which platforms push notification payload is expected. If no `formatter` function provided during configuration (or return `null`), this option will be used by **default** formatter (it can format payload for `$.invite` and `message` events).<br/><br/>**Example:**<br/>`{ platforms: { ios: true, android: false } }` |
| `messageKey` | String   |            | `message` | Name of key under which stored published message, which should be handled by default formatter.<br/><br/>**Example:**<br/>`{ messageKey: 'text' }` |
| `formatter`  | (payload: [ChatEnginePayload](../data-objects#chatengine-event-payload)) => {}  |  |  | This function used by plug-in when it is required to format notification payload which should be added to published _event_.<br/>If function not specified, plug-in will try to use formatter function provided to native module (can be set inside of native application).<br/>If no formatter provided by user from React Native and native application, plug-in will use default formatter for know events: `$.invite` and `message`.<br/><br/>Formatter function should return object with `apns` and/or `gcm` keys and appropriate payload for corresponding notification provider.<br/>If formatter function return `null` - it mean what native application or default formatter should be used to create notification payload.<br/>If formatted function return `{}` - no notification payload will be added to published _event_. |

### Formatter examples:

```js
// Example of notification formatter for both platforms.
{ formatter: (payload) => {
   const title = `Received '${payload.event}' from '${payload.sender}'`;
   const targetChat = payload.chat.channel;
   const payloadData = payload.data;
  
   return { 
     apns: { aps: { alert: { title } }, payload: payloadData },
     gcm: { data: { contentTitle: title, payload: payloadData } } 
  }
}}

// Example of notification formatter only for 'message' events and default handling of '$.invite'.
{ formatter: (payload) => {
   let notificationPayload = null;
   
   if (payload.event === 'message') {
     const title = `Received '${payload.event}' from '${payload.sender}'`;
     const targetChat = payload.chat.channel;
     const payloadData = payload.data;
     
     notificationPayload = { 
       apns: { aps: { alert: { title } }, payload: payloadData },
       gcm: { data: { contentTitle: title, payload: payloadData } } 
     };
   }
   
   return notificationPayload;
}}
  ```  
Check more documentation about notification payload [here](../notification-formatting).