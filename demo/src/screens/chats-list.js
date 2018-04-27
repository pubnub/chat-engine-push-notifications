import React from 'react';
import { KeyboardAvoidingView, TouchableHighlight, DeviceEventEmitter, NativeModules, Dimensions, StyleSheet, FlatList, Platform, View, Text } from 'react-native';
import { CENInvitationNotificationCategory } from 'chat-engine-notifications';
import Swipeable from 'react-native-swipeable';
import CEPNCreateChatView from "./create-chat";

const { width, height } = Dimensions.get('window');


export default class CEPNChatsListView extends React.Component {
    static ChatEngine = null;

    /**
     * Store reference Chat Engine for future usage.
     * @param {ChatEngine} engine - Reference on initialized and ready to use {@link ChatEngine} instance.
     */
    static setChatEngine(engine) {
        CEPNChatsListView.ChatEngine = engine;
    }

    /**
     * User chats list screen constructor.
     *
     * @param {Object} properties - Reference on data which has been passed during screen
     *     instantiation.
     */
    constructor(properties) {
        super(properties);
        this._ignoredChats = ['#Main', '#Support', '#Docs', '#Foolery'];
        this._chatsList = [];
        this.state = {
            rightActionActivated: false,
            scrollEnabled: true,
            chatsList: [],
            username: false
        };

        this._delayedChatJoinTimeout = false;
        this._delayedChatSwitchTimeout = false;

        this._chatToSwitch = false;
        this._chatToJoin = false;
        this._selectedChat = false;
        this._updatedForUser = false;
        this._onChatEngineReady = this.onChatEngineReady.bind(this);
        this._onChatCreate = this.onChatCreate.bind(this);
        this._onChatDisconnect = this.onChatDisconnect.bind(this);
        this._onChatClose = this.onChatClose.bind(this);
        this._onBarButtonTap = this.onBarButtonTap.bind(this);
        this._onChatCreateByUser = (chat) => this.onChatCreate({}, chat, true);
        this._onNotification = this.onNotification.bind(this);
        CEPNChatsListView.ChatEngine.on('$.ready', this._onChatEngineReady);
        CEPNChatsListView.ChatEngine.on('$.created.chat', this._onChatCreate);
        CEPNChatsListView.ChatEngine.on('$.disconnected', this._onChatDisconnect);
        DeviceEventEmitter.addListener('$.chat-on-react.open.created', this._onChatCreateByUser);
        DeviceEventEmitter.addListener('$.chat-on-react.chat.close', this._onChatClose);
    }

    componentDidUpdate() {
        if (!this._updatedForUser && this.state.username) {
            this._updatedForUser = true;
            NativeModules.CEPNChatManager.setChatsListTitleVisible(true);
            if (Platform.OS === 'ios') {
                NativeModules.CEPNChatManager.addBarButtons([{ identifier: 'create.chat.button', type: 'system', title: 'add' }], 'right', true);
            } else {
                NativeModules.CEPNChatManager.addBarButtons([{ identifier: 'create.chat.button', title: '+' }], 'right', true);
            }
            DeviceEventEmitter.addListener('$.barButton.tap', this._onBarButtonTap);
        } else if (this._updatedForUser && !this.state.username) {
            this._updatedForUser = false;
            NativeModules.CEPNChatManager.setChatsListTitleVisible(false);
            NativeModules.CEPNChatManager.addBarButtons([], 'right', true);
            DeviceEventEmitter.removeListener('$.barButton.tap', this._onBarButtonTap);
            DeviceEventEmitter.removeListener('$.chat-on-react.open.created', this._onChatCreateByUser);
            DeviceEventEmitter.removeListener('$.chat-on-react.chat.close', this._onChatClose);
        }
    }

    /**
     * Handle screen rendering completion and displaying to the user.
     */
    componentDidMount() {
        console.disableYellowBox = true;
        if (CEPNChatsListView.ChatEngine.ready) {
            this._onChatEngineReady();
            if (!this.state.chatsList.length) {
                Object.keys(CEPNChatsListView.ChatEngine.chats).forEach(channelName =>
                    this.onChatCreate({}, CEPNChatsListView.ChatEngine.chats[channelName], false));
            }
        }
    }

    componentWillUnmount() {
        // Clean up after user logged out.
        this._updatedForUser = false;
        NativeModules.CEPNChatManager.setChatsListTitleVisible(false);
        NativeModules.CEPNChatManager.addBarButtons([], 'right', true);
        DeviceEventEmitter.removeListener('$.barButton.tap', this._onBarButtonTap);
        DeviceEventEmitter.removeListener('$.chat-on-react.open.created', this._onChatCreateByUser);
        DeviceEventEmitter.removeListener('$.chat-on-react.chat.close', this._onChatClose);
    }

    /**
     * Handle {@link ChatEngine} initialization completion for user.
     */
    onChatEngineReady() {
        this.setState({ username: CEPNChatsListView.ChatEngine.me.uuid });
        CEPNChatsListView.ChatEngine.me.notifications.on('$.notifications.received', this._onNotification);
        CEPNChatsListView.ChatEngine.me.notifications.registerNotificationActions({ Accept: 'default', Reject: 'none' });
        CEPNChatsListView.ChatEngine.me.notifications.registerNotificationChannels([
            { id: 'cennotifications', name: 'CENNotifications Channel' }
        ]);
        CEPNChatsListView.ChatEngine.me.notifications.requestPermissions({alert: true, badge: false, sound: true},
            [new CENInvitationNotificationCategory()])
            .then(permissions => console.log('Granted with permissions:', JSON.stringify(permissions)))
            .catch(error => console.log('Permissions request did fail:', error));
    }

    onChatCreate(data, chat, byUser) {
        if (!this.isIgnoredChat(chat)) {
            const name = chat.channel.split('#').splice(-1)[0];
            const storedChatData = this.state.chatsList.filter(chatData => chatData.name === name);
            if (!storedChatData.length) {
                this._chatsList.push({ chat, name, selected: false });
                this.setState({ chatsList: this._chatsList }, () => {
                    if (byUser) {
                        this.onChatOpen(chat);
                    }
                });
            } else if (byUser) {
                this.onChatOpen(storedChatData[0]);
            }
            this.delayedChatJoin();
            this.delayedChatSwitch();
        }
    }

    onChatDisconnect(data, chat) {
        if (chat.name === 'Chat' && !this.isIgnoredChat(chat)) {
            const chatsList = [].concat(this.state.chatsList).filter(chatData => chatData.chat.channel !== chat.channel);
            if (this._selectedChat && this._selectedChat.chat.channel === chat.channel) {
                this._selectedChat = false;
                NativeModules.CEPNChatManager.showChat({});
            } else if (!chatsList.length) {
                NativeModules.CEPNChatManager.showChat({});
            }
            this.setState({ chatsList });
        }
    }

    /**
     * Handle user leave chat screen in native application
     * @param {{ name: String, channel: String}} data - Reference on object which contain minimal information required to find chat.
     */
    onChatClose({ data }) {
        const chatsList = this.state.chatsList.filter(chatData => chatData.chat.channel === data.channel);
        if (chatsList.length) {
            if (this._selectedChat && this._selectedChat.name === chatsList[0].name) {
                this._selectedChat.selected = false;
                this._selectedChat = false;
            }
            chatsList[0].selected = false;
            this.setState({ chatsList: this._chatsList });
        }
    }

    onChatOpen(chatData) {
        if (this._selectedChat) {
            this._selectedChat.selected = false;
        }
        if (!this._selectedChat || this._selectedChat.name !== chatData.name) {
            this._selectedChat = chatData;
            this._selectedChat.selected = true;
            this.setState({ chatsList: this._chatsList });
            NativeModules.CEPNChatManager.showChat({ channel: chatData.chat.channel, name: chatData.name });
        }
    }

    /**
     * Handle user leave action.
     * @param {{chat: Chat, name: String}} chatData - Reference on object which describe chat entry for which action should be performed.
     */
    onChatLeave(chatData) {
        chatData.chat.leave();
    }

    /**
     *  Handle user tap on one of added bar buttons.
     * @param {String} identifier - Unique button identifier which allow to identify user action.
     */
    onBarButtonTap({ identifier }) {
        if (identifier === 'create.chat.button') {
            NativeModules.CEPNChatManager.showChatCreationView();
        }
    }

    onNotification(notification) {
        if (notification.userInteraction) {
            const category = notification.notification.cepayload.category;
            let action = notification.action !== null && notification.action !== undefined ? notification.action.identifier : false;
            if (category === 'com.pubnub.chat-engine.invite' && ((action && action.toLowerCase() === 'accept') || !action)) {
                if (this._chatToJoin) {
                    this.joinToChat();
                }
                this._chatToJoin = notification.notification.cepayload.data.channel;
                this.delayedChatJoin();
            } else if (category === 'com.pubnub.chat-engine.message') {
                this._chatToSwitch = notification.notification.cepayload.chat;
                this.delayedChatSwitch();
            }

        }
    }

    /**
     * Render chats list screen using React JSX.
     *
     * @return {XML} Screen representation using React JSX syntax.
     */
    render() {
        if (!this.state.username) {
            return (<View style={ styles.container }/>);
        }

        if (!this.state.chatsList.length) {
            return (
                <KeyboardAvoidingView style={ styles.container } behavior={ 'padding' }>
                    <View style={ styles.loaderHolder }><Text>No active chats</Text></View>
                </KeyboardAvoidingView>
            )
        }

        return (
            <KeyboardAvoidingView style={ styles.container } behavior={ 'padding' }>
                <FlatList
                    data={ this.state.chatsList }
                    extraData={ this.state }
                    keyExtractor={ item => item.name }
                    renderItem={({ item }) => this.renderRow(item) }
                    scrollEnabled={ this.state.scrollEnabled }
                />
            </KeyboardAvoidingView>
        )
    }

    /**
     * Render chat entry layout for list view.
     *
     * @param {Object} rowData - Reference on object which contain information about chat.
     * @return {XML} Rendered chat entry.
     * @private
     */
    renderRow(rowData) {
        const { rightActionActivated } = this.state;
        const selected = rowData.selected;
        return (
            <Swipeable style={ styles.swipe }
                       rightActionActivationDistance={ 140 }
                       rightContent={(
                           <View style={ styles.rightSwipe }>
                               <Text style={ styles.rightSwipeLabel }>{ rightActionActivated ? 'Release to leave' : 'Leave' }</Text>
                           </View>)}
                       onSwipeStart={ () => this.setState({ scrollEnabled: false }) }
                       onSwipeRelease={ () => this.setState({ scrollEnabled: true }) }
                       onRightActionActivate={ () => this.setState({ rightActionActivated: true })}
                       onRightActionDeactivate={ () => this.setState({ rightActionActivated: false })}
                       onRightActionComplete={ () => this.onChatLeave(rowData) }>
                <TouchableHighlight
                    style={ selected ? styles.selectedListItemHolder : styles.listItemHolder }
                    onPress={ () => this.onChatOpen(rowData) }
                    underlayColor={ '#a5a5a5' }>
                    <View style={ styles.listItemInfoHolder }>
                        <Text style={ selected ? styles.selectedChatNameLabel : styles.chatNameLabel }>{ rowData.name }</Text>
                    </View>
                </TouchableHighlight>
            </Swipeable>
        )
    }

    /**
     * Join local user to new chat channel.
     */
    joinToChat() {
        if (!Object.keys(CEPNChatsListView.ChatEngine.chats).includes(this._chatToJoin)) {
            const chat = new CEPNChatsListView.ChatEngine.Chat(this._chatToJoin);
            this._chatToJoin = false;
            const onChatConnect = () => {
                chat.off('$.connected', onChatConnect);
                this.onChatCreate({}, chat, true);
            };
            chat.on('$.connected', onChatConnect);
        }
    }

    /**
     * Function will be called each time when new chat is created and after some delay, if there will be need, new chat will be created and joined.
     */
    delayedChatJoin() {
        if (this._delayedChatJoinTimeout) {
            clearTimeout(this._delayedChatJoinTimeout);
            this._delayedChatJoinTimeout = false;
        }
        if (this._chatToJoin) {
            this._delayedChatJoinTimeout = setTimeout(this.joinToChat.bind(this), 1000);
        }
    }

    switchChat() {
        if (this._chatToSwitch) {
            const chatsList = this.state.chatsList.filter(chatData => chatData.chat.channel === this._chatToSwitch);
            if (chatsList.length) {
                this.onChatOpen(chatsList[0]);
            }
        }
    }

    /**
     * Function will be called with each chat creation to catch moment when target channel will bre created.
     */
    delayedChatSwitch() {
        if (this._delayedChatSwitchTimeout) {
            clearInterval(this._delayedChatSwitchTimeout);
            this._delayedChatSwitchTimeout = false;
        }
        if (this._chatToSwitch) {
            this._delayedChatSwitchTimeout = setTimeout(this.switchChat.bind(this), 1000);
        }
    }

    /**
     * Check whether passed {@link Chat} instance is marked as ignored or not.
     * @param {Chat} chat - Reference on {@link Chat} instance which should be checked.
     * @return {Boolean} `true` in case if chat has been found in list of ignored chats.
     */
    isIgnoredChat(chat) {
        if (chat.group === 'system') {
            return true;
        }
        return !this._ignoredChats.every(chatChannelName => !chat.channel.endsWith(chatChannelName));
    }
}

/**
 * Screen layout CSS.
 */
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#dbdbdb',
        justifyContent: 'center',
        alignItems: 'stretch'
    },
    loaderHolder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    listItemHolder: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#e5e5e5',
        borderBottomWidth: 0.5,
        borderColor: '#D0DBE4',
        padding: 5,
        paddingHorizontal: 10,
        height: 46
    },
    selectedListItemHolder: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#a5a5a5',
        borderBottomWidth: 0.5,
        borderColor: '#D0DBE4',
        padding: 5,
        paddingHorizontal: 10,
        height: 46
    },
    listItemInfoHolder: {
        flex: 1,
        justifyContent: 'flex-start'
    },
    chatNameLabel: {
        fontSize: 15,
        fontWeight: '400',
        color: '#000',
        backgroundColor: 'transparent'
    },
    selectedChatNameLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFF'
    },
    swipe: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#dbdbdb',
        justifyContent: 'center',
        alignItems: 'stretch',
        borderColor: '#cbcbcb',
        borderBottomWidth: 1
    },
    rightSwipe: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'red',
        paddingLeft: 20
    },
    rightSwipeLabel: {
        fontSize: 15,
        color: '#fff',
        fontWeight: '600'
    }
});