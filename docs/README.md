Plugin make it easier to enable and use notifications with ChatEngine.  
Plugin provide bridge between ChatEngine and native application using [React Native](https://facebook.github.io/react-native/) library from Facebook.  
Plugin's [API](api) will allow you to:  
* request permissions for push notifications.
* add categories for interactive notifications and handle user callbacks.
* get and set application's icon badge number
* get notification which has been used to launch application.
* get list of delivered notifications.
* mark particular or all delivered notifications as seen across all devices which use ChatEngine with this plugin (notification will go away from notification center).
* new notifications will be forwarded from native application to JS and available through _events_.
* allow to provide own payload for sent message / event (by default plugin is able to pre-format notifications for `$.invite` and `message`)