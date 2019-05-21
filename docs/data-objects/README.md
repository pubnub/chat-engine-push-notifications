Few object types are used within the plugin and their structure will be explained here.

### Notification permissions
An object represents a list of notification features which application would like to use.  

| Field   | Type    | Attributes | Description |
|:-------:|:-------:|:----------:|:----------- |
| `alert` | Boolean | `Required` | Whether it should be allowed to present notifications on the device (as a bar or alert view). |  
| `badge` | Boolean | `Required` | Whether it should be allowed to change application badge number with push notification payload or not. |  
| `sound` | Boolean | `Required` | Whether it should be allowed to play sound on notification receive or not. |  


### ChatEngine event payload
Object represent any _event_ which is sent or received in 
[Chat](https://github.com/pubnub/chat-engine/blob/master/src/components/chat.js). Object contain 
next fields:  

| Field    | Type   | Attributes | Description |
|:--------:|:------:|:----------:|:----------- |
| `chat`   | [Chat](https://github.com/pubnub/chat-engine/blob/master/src/components/chat.js) | `NO` | Object contain all information about _event_ source. |  
| `event`  | String | `Required` | Name of event which has been sent or received. |  
| `sender` | String | `Required` | Unique name of [User](https://github.com/pubnub/chat-engine/blob/master/src/components/user.js) which sent this event. |  
| `data`   | Object | `Required` | Object which contain data sent along with _event_. |  


### Notification payload
Object represent received notification (which has been received by device).  

| Field             | Type    | Attributes | Description |
|:-----------------:|:-------:|:----------:|:----------- |
| `notification`    | Object  | `Required` | Object contain original notification payload (which has been appended when _event_ has been published). |  
| `foreground`      | Boolean | `Required` | Whether notification has been received while the application was in the foreground or not. |
| `userInteraction` | Boolean | `Required` | Whether notification has been delivered in response on user action with interactive notification or used it to launch the application. |
| `action`          | [Action](#interactive-notification-action) | `YES` | In case if user picked action from interactive notification, it's information will be available in this property. |


### Delivered notification payload
An object represents notification which has been delivered and not disposed of notification center.  

| Field  | Type | Attributes | Description |
|:------:|:----:|:----------:|:----------- |
| `date` | Date | `Required` | Date when notification has been delivered. |  
| `data` |[Notification](#notification-payload) | NO | Notification payload object. |  


### Interactive notification action
Object represent user picked an action and may contain additional data (from input or provided during category registration).  

| Field        | Type   | Attributes | Description |
|:------------:|:------:|:----------:|:----------- |
| `category`   | String | `Required` | Unique identifier of interactive notification handling category. |  
| `identifier` | String | `Required` | Unique action identifier. |
| `response`   | Object |            | Represent user input information or data which has been passed during category registration. |


### Notification channel
Object represent Android Notification Channel instance.  

| Field              | Type     | Attributes | Default                            | Description |
|:------------------:|:--------:|:----------:|:----------------------------------:|:----------- |
| `id`               | String   | `Required` |                                    | Unique identifier of notification channel. |  
| `name`             | String   | `Required` |                                    | Displayable notification channel name. |
| `importance`       | String   |            | `CENNotifications.IMPORTANCE_HIGH` | Notification layout importance.<br/><br/>**Options (using `NativeModules.CENNotifications`):** `CENNotifications.IMPORTANCE_NONE`, `CENNotifications.IMPORTANCE_MIN`, `CENNotifications.IMPORTANCE_LOW`, `CENNotifications.IMPORTANCE_HIGH` and `CENNotifications.IMPORTANCE_DEFAULT`. |
| `vibration`        | Boolean  |            | `true`                             | Whether device should vibrate upon notification receive.  |
| `vibrationPattern` | Number[] |            |  `[1000]`                          | Sequence of timings for vibration and silence periods. |
| `lights`           | Boolean  |            | `true`                             | Whether lights should be used on devices which support this feature.  |
| `lightColor`       | String   |            | `#00FF00`                          | Specify color which should be used in HEX format. |
| `sound`            | String   |            | `system  `                         | Name of sound file from assets which should be played upon notification receive. |  

Please refer to [this](https://developer.android.com/reference/android/app/NotificationChannel.html) 
documentation to get more information about notification channels.