If custom formatter provided, it is possible to customize how notification will be presented to the 
user on iOS and/or Android device.  
Payload which returned from formatter should contain keys (for required platforms): `apns` and / or `gcm`.  
Each platform has own requirements for notification payload content.  

**NOTE:** Notification payload will contain additional object for each platform from 
[ChatEngine](https://github.com/pubnub/chat-engine) under `cepayload` which will be stored in `apns`
root and `gcm.data` objects.  

#### `apns` payload keys

* `alert`
  * type: `String` or `Object`
  * required: **true**  

  When specified as string, it should be UTF-8 string and it will be presented in notification body.  
  Configuration as object allow to specify and localize notification layout using next keys:  
    * `title`
      * type: `String`
      * required: **true**  

      It should be quick explanation of reason why this notification has been sent. Shown in bold 
      above notification `body` message.  
    * `body`
      * type: `String`
      * required: **true**  
      
      Notification message content.
    * `title-loc-key`
      * type: `String`
      * required: **false**  
      
      Notification title localization key. This key allow to use `Localizable.strings` file to 
      localize notification title to one of supported languages.  
    * `title-loc-args`  
      * type: `String[]`  
      * required: **false**  
      
      This list of strings used in case if value in `Localizable.strings` which correspond to 
      `title-loc-key` is format string and `title-loc-args` is used to substitute placeholders in 
      localized format string.  
    * `action-loc-key`
      * type: `String`  
      * required: **false**  
      
      Notification view action localization key. This key allow to use `Localizable.strings` file to 
      localize notification _View_ button with one of supported languages.  
    * `loc-key`  
      * type: `String`  
      * required: **false**  
      
      Notification message localization key. This key allow to use `Localizable.strings` file to 
      localize notification message to one of supported languages.  
    * `loc-args`  
      * type: `String[]`  
      * required: **false**  
      
      This list of strings used in case if value in `Localizable.strings` which correspond to 
      `loc-key` is format string and `loc-args` is used to substitute placeholders in localized 
      format string.  
    * `launch-image`
      * type: `String`  
      * required: **false**  
      
      Name of image file which should be shown during application launch after user tap on 
      notification.  
* `badge`  
  * type: `Number`
  * required: **false**
  
  Value which should be shown on application's icon badge when notification will be received by 
  user's device.  
* `sound`
  * type: `String`  
  * required: **false**  
  
  Name of audio file which should be played when notification will be received.  
* `category`  
  * type: `String`  
  * required: **false**  
  
  Unique name for notification handling category which can be used by system to provide actions for 
  user. Categories registered along with requested permissions with 
  [this](../api#request-permissions-to-use-push-notifications) API.  
  
For more information about notification payload for Apple's push notification service please read 
[this](https://developer.apple.com/library/content/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/CreatingtheNotificationPayload.html) documentation.  

#### `gcm` payload keys
It is better to use `data` notifications, because this is the only way properly configure 
notification which should be shown to the user.  
Next is the list of keys which can be stored in `gcm.data` object:  

* `contentTitle`
  * type: `String`
  * required: **true**  

  It should be quick explanation of reason why this notification has been sent. Shown in bold above 
  notification `contentText ` message.  
* `contentText`
  * type: `String`
  * required: **true**  

  Notification message content.  
* `badge`  
  * type: `Number`
  * required: **false**
  
  Value which should be shown on application's icon badge when notification will be received by 
  user's device.  
* `autoCancel`  
  * type: `Boolean`
  * required: **false**  
  * default: `true`
  
  Whether notification should automatically disappear from notification center or not.
* `click_action`  
  * type: `String`
  * required: **false**
  * default: `launcher activity class name`  
  
  Name of activity, which should be presented after user tap on notification. Name should be 
  composed relatively to package name (`com.company.app`): `<path-to-class>.<activity-class-name>`.  
  If default or custom activities is used for navigation from notification, next code should be 
  added to them to forward user action back to this plugin:  
  ```java
  @Override
  public void onNewIntent(Intent intent) {
      CENNotifications.onNotification(this, intent, null);
  }
  ```
* `actions`  
  * type: `String[]`  
  * required: **false**  
  
  Reference on list of actions which should be suggested to user when notification body will be 
  expanded. Passed actions should be registered before can be used with interactive notifications 
  using [this](../api#register-notification-actions) API.  
* `defaults`  
  * type: `Number[]`  
  * required: **false**
  * default: `[CENNotifications.DEFAULT_LIGHTS]`  
  
  List of notification presentation options. Available options (using `NativeModules.CENNotifications`):  
  * `CENNotifications.DEFAULT_ALL` - all options listed below.
  * `CENNotifications.DEFAULT_SOUND` - if specified, default or specified sound will be played upon 
  notification receive.
  * `CENNotifications.DEFAULT_VIBRATE` - if specified, device will vibrate upon notification receive.
  * `CENNotifications.DEFAULT_LIGHTS` - if specified, lights will be used for devices which support 
  it upon notification receive.  
* `largeIcon`  
  * type: `String`
  * required: **false**  
  * default: `ic_launcher`  
  
  Name of icon which should be used to show in notification's content view.  
* `lights`  
  * type: `Number[]`  
  * required: **false**  
  
  Three component array of numbers which respecting order specify: argb (light color in ARGB 
  format), on (for how long it should light up), off (for how long light should be turned off). 
  Delays specified in milliseconds. Flashing will repeat.  
* `number`  
  * type: `Number`  
  * required: **false**  
  
  How many events represented by this notification. This value will be shown in notification center 
  and added to application's icon badge.  
* `ongoing`  
  * type: `Boolean`  
  * required: **false**  
  * default: `false`  
  
  Whether notification should be presented as [_ongoing_](https://unitid.nl/androidpatterns/uap_pattern/status-bar-ongoing-notifications) event or not.
* `onlyAlertOnce`  
  * type: `Boolean`
  * required: **false**
  * default: `true`  
  
  Whether sound, vibrate and ticker to be played if the notification is not already showing.  
* `priority`  
  * type: `Number`  
  * required: **false** 
  * default: `CENNotifications.PRIORITY_HIGH`  
  
  Notification layout priority.  Available options (using `NativeModules.CENNotifications`): 
  * `CENNotifications.PRIORITY_MIN`
  * `CENNotifications.PRIORITY_LOW`
  * `CENNotifications.PRIORITY_HIGH`
  * `CENNotifications.PRIORITY_MAX`
  * `CENNotifications.PRIORITY_DEFAULT`

* `progress`  
  * type: `Number[]`  
  * required: **false**  
  
  Three component array of numbers which respecting order specify: max (maximum progress scale 
  value), progress (current progress value), indeterminate (**1** if progress should be shown as 
  _indeterminate_).
* `showWhen`  
  * type: `Boolean`
  * required: **false**  

  Sets whether `setWhen` timestamp is shown on notification or not.  
* `smallIcon`  
  * type: `String`  
  * required: **false**  
  * default: `ic_notification` or `ic_launcher`  
  
  Name of icon which should be shown on the top left corner of notification and in status bar.  
* `sound`  
  * type: `String`
  * required: **false**  
  
  Name of audio file which should be played when notification received.  
* `subText`  
  * type: `String`
  * required: **false**  

  Text which is shown in notification header and may contain information like: name of chat from 
  which notification has been received or name of user which sent message.  
* `ticker`
  * type: `String`  
  * required: **false**  
  
  Message which is shown right in status bar upon notification receive.  
* `usesChronometer`  
  * type: `Boolean`  
  * required: **false**  
  * default: `false`
  
  Whether value from `when` field should be shown as _chronometer_ or not.
* `vibrate` 
  * type: `Number[]`  
  * required: **false**  
  * default: `[1000]`

  Sequence of timings for vibration and silence periods. This option can be used if `defaults` 
  contain _defaultVibrate_ option in it.  
* `when`  
  * type: `Number`
  * required: **false**  
  
  Time when scheduled event is expected to happen.  
* `sortKey`  
  * type: `String`  
  * required: **false**  
  
  Notification sorting key.  
* `group`  
  * type: `String`  
  * required: **false**  
 
  Key which allow to group similar notification (with same _group_) into clusters and present them 
  in groups in notification center.  
* `groupSummary`  
  * type: `Boolean`  
  * required: **false**  

  Whether this notification should be shown as _group_ summary version.  
* `person`  
  * type: `String`  
  * required: **false**  

  Person identifier to which this notification related and depending from specified `category` 
  system may preprocess it and handle user tap according to `category`.  
* `color`  
  * type: `Number` 
  * required: **false** 

  ARGB color int representation which is used for notification message color.  
* `category`  
  * type: `String`  
  * required: **false**  

  Notification handling category (different on how iOS use it). Available options (using `NativeModules.CENNotifications`):  
  * `CENNotifications.CATEGORY_ALARM` - notification for alarm or timer.
  * `CENNotifications.CATEGORY_CALL` - notification for incoming call.
  * `CENNotifications.CATEGORY_EMAIL` - notification for asynchronous bulk message.
  * `CENNotifications.CATEGORY_ERROR` - notification for  error in background operation or 
  authentication status.
  * `CENNotifications.CATEGORY_EVENT` - notification for calendar event.
  * `CENNotifications.CATEGORY_MESSAGE` - notification for incoming direct message.
  * `CENNotifications.CATEGORY_PROGRESS` - notification for progress of a long-running background 
  operation.
  * `CENNotifications.CATEGORY_PROMO` - notification for promotion or advertisement.
  * `CENNotifications.CATEGORY_RECOMMENDATION` - notification for a specific, timely recommendation 
  for a single thing.
  * `CENNotifications.CATEGORY_REMINDER` - notification for user-scheduled reminder.
  * `CENNotifications.CATEGORY_SERVICE` - notification for indication of running background service.
  * `CENNotifications.CATEGORY_SOCIAL` - notification for social network or sharing update.
  * `CENNotifications.CATEGORY_STATUS` - notification for ongoing information about device or 
  contextual status.
  * `CENNotifications.CATEGORY_TRANSPORT` - notification for media transport control for playback.
* `visibility`  
  * type: `Number`
  * required: **false**  
  
  Notification privacy and visibility on different device's screens. Available options (using 
  `NativeModules.CENNotifications`):  
  * `CENNotifications.VISIBILITY_PRIVATE` - show this notification on all lockscreens, but conceal 
  sensitive or private information on secure lockscreens.
  * `CENNotifications.VISIBILITY_PUBLIC` - show this notification in its entirety on all lockscreens.
  * `CENNotifications.VISIBILITY_SECRET` - do not reveal any part of this notification on a secure 
  lockscreen.
* `badgeIconType`
  * type: `Number`
  * required: **false**  
  
  Sets which icon to display as a badge for this notification. Available options (using 
  `NativeModules.CENNotifications`):  
  * `CENNotifications.BADGE_ICON_NONE` - if notification is being shown as a badge, always show as a 
  number.
  * `CENNotifications.BADGE_ICON_SMALL` - if notification is being shown as a badge, use the 
  `smallIcon` to represent this notification.
  * `CENNotifications.BADGE_ICON_LARGE` - if this notification is being shown as a badge, use the 
  `largeIcon` to represent this notification.
* `channelId`
  * type: `String`
  * required: **false**  
  
  Unique identifier of notification channel which should be used to present notification to user.  
* `colorized`
  * type: `Boolean`
  * required: **false**  
  
  Set whether this notification should be colorized.
* `groupAlertBehavior`
  * type: `Number`
  * required: **false**  
  
  Sets which icon to display as a badge for this notification. Available options (using 
  `NativeModules.CENNotifications`):  
  * `CENNotifications.GROUP_ALERT_ALL` - all notifications in a group with sound or vibration ought 
  to make sound or vibrate.
  * `CENNotifications.GROUP_ALERT_CHILDREN` - summary notification in a group should be silenced.
  * `CENNotifications.GROUP_ALERT_SUMMARY` - all children notification in a group should be silenced.
* `settingsText`
  * type: `String`
  * required: **false**
  
  Text that will appear as a link to your application's settings.  

Please refer to [this](https://developer.android.com/reference/android/app/Notification.Builder.html) 
documentation to get more information about notification payload configuration (most fields 
supported).