import React from 'react';
import { KeyboardAvoidingView, TouchableOpacity, DeviceEventEmitter, NativeModules, Dimensions, StyleSheet, TextInput, Keyboard, Platform, Text, View } from 'react-native';
import { Icon } from 'react-native-elements';
import { MessageList } from 'chat-engine-react-native';
const TypingIndicator = require('chat-engine-typing-indicator');
const { width } = Dimensions.get('window');
const MAXIMUM_NAMES_IN_TYPING_INDICATOR = 2;

export default class CEPNChatView extends React.Component {
    static ChatEngine = null;

    /**
     * Store reference Chat Engine for future usage.
     * @param {ChatEngine} engine - Reference on initialized and ready to use {@link ChatEngine} instance.
     */
    static setChatEngine(engine) {
        CEPNChatView.ChatEngine = engine;
    }

    /**
     * Chat screen constructor.
     *
     * @param {Object} properties - Reference on data which has been passed during screen
     *     instantiation.
     */
    constructor(properties) {
        super(properties);
        console.disableYellowBox = true;
        let chat = CEPNChatView.ChatEngine.chats[this.props.channel] || false;
        this.state = { chat, whoIsTyping: [], chatInput: '', sendEnabled: false, keyboardHeight: 0 };
        if (chat) {
            this.state.name = chat.channel.split('#').slice(-1)[0];
        }

        this._keyboardDidShowListener = false;
        this._onChatClose = this.onChatClose.bind(this);
        this._onChatConnect = this.onChatConnect.bind(this);
        this._handleUserStartTyping = this.handleUserStartTyping.bind(this);
        this._handleUserStopTyping = this.handleUserStopTyping.bind(this);
        this._onBarButtonTap = this.onBarButtonTap
            .bind(this);

        if (this.state.chat) {
            DeviceEventEmitter.addListener('$.chat-on-react.chat.close', this._onChatClose);
            DeviceEventEmitter.addListener('$.barButton.tap', this._onBarButtonTap);
            CEPNChatView.ChatEngine.on('$typingIndicator.startTyping', this._handleUserStartTyping);
            CEPNChatView.ChatEngine.on('$typingIndicator.stopTyping', this._handleUserStopTyping);
            if (!this.state.chat.connected) {
                CEPNChatView.ChatEngine.on('$.connected', this._onChatConnect);
                this.state.chat.connect();
            }
        }
    }

    /**
     * Handle screen rendering completion and displaying to the user.
     */
    componentDidMount() {
        if (this.state.chat.connected) {
            this.onChatConnect({}, this.state.chat)
        }
        if (Platform.OS === 'android') {
            this._keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this.keyboardDidShow.bind(this));
        }
    }

    /**
     * Handle screen rendering stop and view unload.
     */
    componentWillUnmount() {
        DeviceEventEmitter.removeListener('$.chat-on-react.chat.close', this._onChatClose);
        DeviceEventEmitter.removeListener('$.barButton.tap', this._onBarButtonTap);
        CEPNChatView.ChatEngine.off('$.connected', this._onChatConnect);
        CEPNChatView.ChatEngine.off('$typingIndicator.startTyping', this._handleUserStartTyping);
        CEPNChatView.ChatEngine.off('$typingIndicator.stopTyping', this._handleUserStopTyping);

        if (Platform.OS === 'android' && this._keyboardDidShowListener)
            this._keyboardDidShowListener.remove();
    }

    keyboardDidShow(event){
        this.setState({ keyboardHeight: event.endCoordinates.height });
    }

    /**
     *  Handle user tap on one of added bar buttons.
     * @param {String} identifier - Unique button identifier which allow to identify user action.
     */
    onBarButtonTap({ identifier, data }) {
        if (identifier === 'invite.user.button') {
            NativeModules.CEPNChatManager.showInviteToChat(data);
        }
    }

    onChatConnect(data, chat) {
        if (chat.name === 'Chat' && this.state.chat && chat.channel === this.state.chat.channel) {
            this.setState({ sendEnabled: true });
        }
    }

    /**
     * Handle user leave chat screen in native application
     * @param {{ name: String, channel: String}} data - Reference on object which contain minimal information required to find chat.
     */
    onChatClose({ data }) {
        if (this.state.chat && data.channel === this.state.chat.channel) {
            this.componentWillUnmount();
        }
    }

    /**
     * Render chat screen using React JSX.
     *
     * @return {XML} Screen representation using React JSX syntax.
     */
    render() {
        if (!this.state.chat) {
            return (<View style={ styles().container } />);
        }

        return (
            <View style={ styles().container }>
                <View style={ styles().chatContainer }>
                    <MessageList chat={ this.state.chat } me={ CEPNChatView.ChatEngine.me } />
                </View>
                <KeyboardAvoidingView behavior={ 'position' } keyboardVerticalOffset={ -this.state.keyboardHeight }>
                    <View style={ styles(this.state.whoIsTyping.length > 0).typingIndicator }>
                        <Text style={ styles().typingIndicatorLabel }>{ this.typingIndicatorText() }</Text>
                    </View>
                    <View style={ styles().chatFooter }>
                        <TextInput
                            value={ this.state.chatInput }
                            style={ styles().chatInput }
                            underlineColorAndroid={ 'transparent' }
                            placeholder={ 'Send Message' }
                            returnKeyType={ 'send' }
                            onChangeText={ text => {
                                this.setState({ chatInput: text });
                                this.state.chat.typingIndicator.startTyping();
                            }  }
                            onSubmitEditing={ () => this.onTextInputSubmit() } />
                        <TouchableOpacity style={{backgroundColor:'#D02129'}}>
                            <Icon
                                reverse
                                name={ 'send' }
                                size={ 26 }
                                color={ '#D02129' }
                                style={ styles().chatSend }
                                onPress={ () => this.onSendTap() } />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>
        )
    }

    /**
     * Handle user tap on software's keyboard 'Send' button.
     * @private
     */
    onTextInputSubmit() {
        if (this.state.sendEnabled) {
            this.onSendTap(false);
        } else if (this.state.chat && this.state.chat.typingIndicator.isTyping) {
            this.state.chat.typingIndicator.stopTyping();
        }
    }

    /**
     * Handle user tap on send button.
     *
     * @param {Boolean} dismissKeyboard - Whether software keyboard should be explicitly closed or
     *     not.
     * @private
     */
    onSendTap(dismissKeyboard = true) {
        if (dismissKeyboard) {
            Keyboard.dismiss();
        }
        if (this.state.chatInput && this.state.chat) {
            this.state.chat.emit('message', {
                text: this.state.chatInput
            });
            this.setState({ chatInput: '' });
        }
        if (this.state.chat && this.state.chat.typingIndicator.isTyping) {
            this.state.chat.typingIndicator.stopTyping();
        }
    }

    /**
     * Handle remote user start typing event.
     * @param {Object} payload - Reference on object which contain event information.
     * @param {Object} payload.sender - Reference on remote user information object.
     * @param {String} payload.sender.uuid - Reference on unique remote user identifier.
     * @param {Chat} chat - Reference on {@link ChatEngine} {@link Chat} instance for which event has been triggered.
     * @private
     */
    handleUserStartTyping(payload, chat) {
        if (chat.channel === this.state.chat.channel && !this.state.whoIsTyping.includes(payload.sender.uuid) &&
            payload.sender.uuid !== CEPNChatView.ChatEngine.me.uuid) {
            this.setState({ whoIsTyping: [...this.state.whoIsTyping, payload.sender.uuid] });
        }
    }

    /**
     * Handle remote user stop typing event.
     * @param {Object} payload - Reference on object which contain event information.
     * @param {Object} payload.sender - Reference on remote user information object.
     * @param {String} payload.sender.uuid - Reference on unique remote user identifier.
     * @param {Chat} chat - Reference on {@link ChatEngine} {@link Chat} instance for which event has been triggered.
     * @private
     */
    handleUserStopTyping(payload, chat) {
        if (chat.channel === this.state.chat.channel && this.state.whoIsTyping.includes(payload.sender.uuid) &&
            payload.sender.uuid !== CEPNChatView.ChatEngine.me.uuid) {
            this.setState({ whoIsTyping: this.state.whoIsTyping.filter(uuid =>
                uuid !== payload.sender.uuid) });
        }
    }

    /**
     * Compose text for remote user typing indication.
     * @return {string} Pre-formatted string for indicator.
     * @private
     */
    typingIndicatorText() {
        let namesToShow = [];
        this.state.whoIsTyping.forEach((name) => {
            if (namesToShow.length < MAXIMUM_NAMES_IN_TYPING_INDICATOR) {
                namesToShow.push(name);
            }
        });
        const count = this.state.whoIsTyping.length - namesToShow.length;

        return `${namesToShow.join(', ')}${count > 0 ? ' and ' + count + ' more ' : ''} is typing...`
    }
}


/**
 * Screen layout CSS.
 */
const styles = (typingIndicatorVisible = false) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#dbdbdb',
        justifyContent: 'center',
        alignItems: 'stretch',
        marginTop: -64
    },
    chatContainer: {
        flex: 1,
        marginTop: 64
    },
    chatFooter: {
        flexDirection: 'row',
        backgroundColor: '#eee',
    },
    chatInput: {
        paddingHorizontal: 20,
        fontSize: 18,
        flex: 1,
    },
    chatSend: {
        alignSelf: 'center',
        padding: 10,
    },
    typingIndicator: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        opacity: 0.7,
        justifyContent: 'center',
        alignItems: 'stretch',
        left: 0,
        width: width,
        height: typingIndicatorVisible ? 18 : 0
    },
    typingIndicatorLabel: {
        flex: 1,
        fontSize: 16,
        color: '#666666'
    }
});