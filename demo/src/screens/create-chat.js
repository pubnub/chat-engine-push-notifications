import React from 'react';
import { KeyboardAvoidingView, TouchableHighlight, DeviceEventEmitter, NativeModules, Keyboard, TextInput, StyleSheet, Platform, View, Text } from 'react-native';


export default class CEPNCreateChatView extends React.Component {
    static ChatEngine = null;

    /**
     * Store reference Chat Engine for future usage.
     * @param {ChatEngine} engine - Reference on initialized and ready to use {@link ChatEngine} instance.
     */
    static setChatEngine(engine) {
        CEPNCreateChatView.ChatEngine = engine;
    }

    /**
     * Chat creation screen constructor.
     *
     * @param {Object} properties - Reference on data which has been passed during screen
     *     instantiation.
     */
    constructor(properties) {
        super(properties);

        this.state = { name: '', chatEditable: true, createDisabled: true };
    }

    /**
     * Handle screen rendering completion and displaying to the user.
     */
    componentDidMount() {
        console.disableYellowBox = true;
    }

    /**
     * Render chat creation screen using React JSX.
     *
     * @return {XML} Screen representation using React JSX syntax.
     */
    render() {
        return (
            <KeyboardAvoidingView style={ styles.container } behavior="padding">
                <View style={ styles.chatInfoContainer }>
                    <TextInput
                        style={ styles.input }
                        value={ this.state.name }
                        maxLength={ 80 }
                        editable={ this.state.chatEditable }
                        autoCapitalize={ 'none' }
                        autoCorrect={ false }
                        autoFocus={ true }
                        placeholder={ 'Enter Chat Name' }
                        returnKeyType={ 'done' }
                        onChangeText={(text) => {
                            this.setState({ name: text });
                            this.setState({ createDisabled: this.state.name.length < 3 });
                        }}
                        onSubmitEditing={ () => this.onTextInputSubmit() }/>

                    <TouchableHighlight
                        style={ this.state.createDisabled ? styles.buttonDisabled : styles.button }
                        underlayColor={ '#78141c' }
                        onPress={ this.onCreateTap.bind(this) }
                        disabled={ this.state.createDisabled }>
                        <Text style={ styles.label }>CREATE</Text>
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
        if (!this.state.createDisabled) {
            this.onCreateTap(false);
        }
    }

    /**
     * Handle user tap on create button.
     *
     * @param {Boolean} dismissKeyboard - Whether software keyboard should be explicitly closed or
     *     not.
     * @private
     */
    onCreateTap(dismissKeyboard = true) {
        if (dismissKeyboard) {
            Keyboard.dismiss();
        }
        this.setState({ chatEditable: false, createDisabled: true });

        let chat = new  CEPNCreateChatView.ChatEngine.Chat(this.state.name);
        const onChatConnect = () => {
            chat.off('$.connected', onChatConnect);
            NativeModules.CEPNChatManager.dismissViewController();
            DeviceEventEmitter.emit('$.chat-on-react.open.created', chat);
        };
        chat.on('$.connected', onChatConnect);
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
        marginTop: Platform.OS === 'ios' ? -64 : 0
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
