Interactive notification actions allow describing how the notification should be treated after user interaction and whether the application should be shown.  
This object useful only with the iOS environment and there will be no effect from it in an Android 
environment because it will be ignored during permissions request.  

```js
import { CENotificationAction } from 'chat-engine-notifications';

const action = new CENotificationAction({
    identifier: 'my-action-identifier',
    title: 'My action title',
    activationMode: 'foreground',
    options: { foreground: true }
});
```


### Properties:

| Field                    | Type    | Attributes | Default      | Description |
|:------------------------:|:-------:|:----------:|:------------:|:----------- |
| `identifier`             | String  | `Required` |              | Unique action identifier which will be passed along with [action](../data-objects.md#interactive-notification-action) object to help identify further actions for notification.<br/><br/>**Example:**<br/>`{ identifier: 'my-action-identifier' }` |
| `title`                  | String  | `Required` |              | This option allow to set name of action which will be shown to the user along with notification body.<br/><br/>**Example:**<br/>`{ title: 'My action title' }` |
| `activationMode`         | String  |            | `background` | This is **iOS <10 only** option specify what should happen with application after user tap on this action.<br/>`foreground` - application should be brought to foreground.<br/>`background` - application should keep running in background execution context.<br/><br/>**Example:**<br/>`{ activationMode: 'background' }` |
| `authenticationRequired` | Boolean |            |              | This is **iOS <10 only** option indicate whether user user should be requested to unlock his device to complete this action.<br/><br/>**Example:**<br/>`{ authenticationRequired: false }` |
| `destructive`            | Boolean |            |              | This is **iOS <10 only** option indicate whether action usage should lead to delivered notification dispose.<br/><br/>**Example:**<br/>`{ destructive: true }` |
| `behavior`               | String  |            | `default`    | This option indicate how user's action should be handled.<br/>`default` - action passed to native application delegate without any additional interaction with user.<br/>`textInput` - user will be presented with text input field and submission button. When user will tap on submission button, action will be passed to native application delegate along with inputed data.<br/><br/>**Example:**<br/>`{ behavior: 'textInput' }` |
| `textInput`              | Object  |            |              | This option should be used with `textInput` behavior and describe placeholder and submit button of presented text input interface.<br/><br/>**Example:**<br/>`{ behavior: 'textInput', textInput: { title: 'Send', placeholder: 'Input message here...' } }` |
| `options`                | Object  |            |              | This is **iOS 10+ only** option which unify few options for iOS < 10. Depending from required configuration, object may contain boolean values for next keys: `authenticationRequired`, `destructive` and `foreground`. If value is set to `true`, it will be applied.<br/><br/>**Example:**<br/>`{ options: { authenticationRequired: true, foreground: false } }`<br/><br/>If it is required for actions to properly work for iOS <10 and iOS 10+ - configuration should include corresponding keys (`options` basically duplicate `authenticationRequired`, `destructive` and `activationMode`). Native module, depending from iOS version will create corresponding action instances. |
