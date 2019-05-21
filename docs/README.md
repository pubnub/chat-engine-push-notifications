The plugin makes it easier to enable and use notifications with ChatEngine.  
The plugin provides a bridge between ChatEngine and native application using [React Native](https://facebook.github.io/react-native/) library from Facebook.  
Plugin's [API](api) will allow you to:  
* request permissions for push notifications.
* add categories for interactive notifications and handle user callbacks.
* get and set application's icon badge number
* get a notification which has been used to launch the application.
* get a list of delivered notifications.
* mark particular or all delivered notifications as seen across all devices which use ChatEngine with this plugin (notification will go away from notification center).
* new notifications will be forwarded from a native application to JS and available through _events_.
* allow providing own payload for sent message/event (by default plugin is able to pre-format notifications for `$.invite` and `message`)
