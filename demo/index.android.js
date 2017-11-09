import React from 'react';
import ChatEngineCore from 'chat-engine';
import { AsyncStorage, NativeModules, AppRegistry } from 'react-native';
import CEPNInviteUserView from './src/screens/invite-user';
import CEPNCreateChatView from './src/screens/create-chat';
import CEPNAuthorizeUserView from './src/screens/user-auth';
import CEPNChatsListView from './src/screens/chats-list';
import { plugin } from 'chat-engine-notifications';
import formatter from './src/helpers/formatter';
import CEPNChatView from './src/screens/chat';

const TypingIndicator = require('chat-engine-typing-indicator');

console.disableYellowBox = true;
const ChatEngine = ChatEngineCore.create({
    publishKey: '<publish-key>',
    subscribeKey: '<subscribe-key>'
});

// Adding important proto plugins.
ChatEngine.proto('Me', plugin({
    events: ['$.invite', 'message'],
    platforms: { ios: true, android: true },
    ignoredChats: ['chat-engine', '#read.#feed', '#Main', '#Support', '#Docs', '#Foolery'],
    markAsSeen: true,
    formatter
}));
ChatEngine.proto('Chat', TypingIndicator({ timeout: 3000 }));

CEPNAuthorizeUserView.setChatEngine(ChatEngine);
CEPNInviteUserView.setChatEngine(ChatEngine);
CEPNCreateChatView.setChatEngine(ChatEngine);
CEPNChatsListView.setChatEngine(ChatEngine);
CEPNChatView.setChatEngine(ChatEngine);

AsyncStorage.multiGet(['@ChatOnReact:user']).then((userData) => {
    const userName = userData[0][1];
    if (userName === null || userName === undefined) {
        NativeModules.CEPNChatManager.showAuthorizationView();
    } else {
        ChatEngine.connect(userName, {}, `${userName}-secret`);
    }
});

AppRegistry.registerComponent('CEPNAuthorizeUserView', () => CEPNAuthorizeUserView, null);
AppRegistry.registerComponent('CEPNInviteUserView', () => CEPNInviteUserView, null);
AppRegistry.registerComponent('CEPNCreateChatView', () => CEPNCreateChatView, null);
AppRegistry.registerComponent('CEPNChatsListView', () => CEPNChatsListView, null);
AppRegistry.registerComponent('CEPNChatView', () => CEPNChatView, null);
