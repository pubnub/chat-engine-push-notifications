import React from 'react';
import { KeyboardAvoidingView, TouchableHighlight, NativeModules, TextInput, StyleSheet, Platform, Keyboard, Text, View } from 'react-native';

export default class CEPNInviteUserView extends React.Component {
    static ChatEngine = null;

    static setChatEngine(engine) {
        CEPNInviteUserView.ChatEngine = engine;
    }

    /**
     * User invitation screen constructor.
     *
     * @param {Object} properties - Reference on data which has been passed during screen
     *     instantiation.
     */
    constructor(properties) {
        super(properties);

        let chat = CEPNInviteUserView.ChatEngine.chats[this.props.channel] || false;
        this.state = { chat, name: '', nameEditable: true, inviteDisabled: true };
    }

    /**
     * Render user invitation screen using React JSX.
     *
     * @return {XML} Screen representation using React JSX syntax.
     */
    render() {
        return (
            <KeyboardAvoidingView style={ styles.container } behavior={ 'padding' }>
                <View style={ styles.chatInfoContainer }>
                    <TextInput
                        style={ styles.input }
                        value={ this.state.name }
                        maxLength={ 80 }
                        editable={ this.state.nameEditable }
                        autoCapitalize={ 'none' }
                        autoCorrect={ false }
                        autoFocus={ true }
                        placeholder={ 'Enter User Name' }
                        returnKeyType={ 'done' }
                        onChangeText={(text) => {
                            this.setState({ name: text });
                            this.setState({ inviteDisabled: this.state.name.length < 3 });
                        }}
                        onSubmitEditing={ () => this.onTextInputSubmit() }/>

                    <TouchableHighlight
                        style={ this.state.inviteDisabled ? styles.buttonDisabled : styles.button }
                        underlayColor={ '#78141c' }
                        onPress={ this.onInviteTap.bind(this) }
                        disabled={ this.state.inviteDisabled }>
                        <Text style={ styles.label }>INVITE</Text>
                    </TouchableHighlight>
                </View>
            </KeyboardAvoidingView>
        )
    }

    /**
     * Handle user tap on software's keyboard 'Done' button.
     * @private
     */
    onTextInputSubmit() {
        if (!this.state.inviteDisabled) {
            this.onInviteTap(false);
        }
    }

    /**
     * Handle user tap on invitation button.
     *
     * @param {Boolean} dismissKeyboard - Whether software keyboard should be explicitly closed or
     *     not.
     * @private
     */
    onInviteTap(dismissKeyboard = true) {
        if (dismissKeyboard) {
            Keyboard.dismiss();
        }
        this.setState({ nameEditable: false, inviteDisabled: true });
        const user = CEPNInviteUserView.ChatEngine.users[this.state.name] || new CEPNInviteUserView.ChatEngine.User(this.state.name);
        this.state.chat.invite(user);
        NativeModules.CEPNChatManager.dismissViewController();
    }
}

/**
 * Screen layout CSS.
 */
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'stretch',
        backgroundColor: '#dbdbdb',
        marginTop: -64
    },
    chatInfoContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    input: {
        fontSize: 18,
        width: 250,
        color: '#666666',
        paddingHorizontal: 10,
        height: Platform.OS === 'ios' ? 30 : 40,
        borderColor: '#CE242F',
        borderWidth: 1,
        borderRadius: 4,
        marginTop: 10,
        alignSelf: 'center',
        backgroundColor: '#FFFFFF'
    },
    button: {
        width: 150,
        backgroundColor: '#CE242F',
        borderColor: '#78141c',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        paddingTop: Platform.OS === 'ios' ? 3 : 6,
        marginTop: 10,
        height: Platform.OS === 'ios' ? 30 : 40,
        justifyContent: 'center',
        alignItems: 'center'
    },
    buttonDisabled: {
        width: 150,
        backgroundColor: '#CE242F',
        borderColor: '#78141c',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        paddingTop: Platform.OS === 'ios' ? 3 : 6,
        marginTop: 10,
        height: Platform.OS === 'ios' ? 30 : 40,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0.3 },
    label: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        width: 120,
        color: '#ffffff',
        alignSelf: 'center',
        textAlign: 'center'
    }
});