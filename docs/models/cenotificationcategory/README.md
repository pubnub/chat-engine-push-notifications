Interactive notification category allows describing a set of actions which will be presented to the user when notification with corresponding _category_ identifier will be received.  
This object useful only with **iOS** environment and there will be no effect from it in **Android** 
environment because it will be ignored during the permissions request.  

```js
import { CENotificationCategory, CENotificationAction } from 'chat-engine-push-notifications';

const openAction = new CENotificationAction({
  identifier: 'open-action-identifier',
  title: 'Open',
  activationMode: 'foreground',
  options: { foreground: true }
});

const ignoreAction = new CENotificationAction({
  identifier: 'ignore-action-identifier',
  title: 'Ignore',
  options: { background: true, destructive: true }
});

const category = new CENotificationCategory({ 
  identifier: 'my-category-identifier', 
  actions: [openAction, ignoreAction] 
});
```


### Properties:

| Field             | Type   | Attributes | Default   | Description |
|:-----------------:|:------:|:----------:|:---------:|:----------- |
| `identifier`      | String | `Required` |           | Unique category identifier which will be passed along with [action](../data-objects.md#interactive-notification-action) object to help identify further actions for notification. |
| `bodyPlaceholder` | String |            |           | This is **iOS 10+ only** options which allow setting placeholder string which is shown in case if used disabled notifications preview. |
| `context`         | String |            | `minimal` | This option indicate the amount of space available for displaying actions in a notification.<br/>`minimal` - present notification as a banner. This representation applies limitation on the number of actions which may fit to be displayed. _Make sure to place most important actions at the beginning of `actions` list_.<br/>`default` - user-defined (with Settings.app) notification layout. It can be banner or can be as alert on the whole screen.   |
| `actions`         | [CENotificationAction](cenotificationaction.md)[] | `Required` |  | This option provides list of actions which should be suggested to the user when notification with specified category `identifier` will be delivered. |
  