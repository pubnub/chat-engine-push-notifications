/* eslint-disable no-unused-expressions,no-new,no-new-wrappers,no-new-object,no-array-constructor */
/* global test, expect */
import { DeviceEventEmitter, NativeModules, Platform } from 'react-native';
import { EventEmitter2 } from 'eventemitter2';
import { CENotificationsExtension } from '../../../src/components/extension';
import CENotifications from '../../../src/components/notifications';
import CENotificationFormatter from '../../../src/helpers/formatter';
import { TypeValidator } from '../../../src/helpers/utils';


jest.mock('NativeModules', () => ({
    CENNotifications: {
        receiveMissedEvents: jest.fn(),
        markNotificationAsSeen: jest.fn()
    }
}));

/** @test {CENotificationsExtension} */
describe('unittest::CENotificationsExtension', () => {
    const minimumConfiguration = {
        events: ['$.invite', 'message'],
        platforms: { ios: true, android: true },
        ignoredChats: ['IgnoredChat1', 'IgnoredChat2']
    };
    const originalPlatform = Platform.OS;
    let extension;
    let configuration;

    const createExtensionWithConfiguration = (extensionConfiguration, shouldCallPluginConstruct) => {
        if (!TypeValidator.isDefined(shouldCallPluginConstruct)) {
            shouldCallPluginConstruct = true;
        }

        let pluginExtension = new CENotificationsExtension(extensionConfiguration);
        pluginExtension.parent = {};
        pluginExtension.ChatEngine = new EventEmitter2({ newListener: false, maxListeners: 50, verboseMemoryLeak: true });
        Object.assign(pluginExtension.ChatEngine, {
            pubnub: { push: { addChannels: jest.fn(), removeChannels: jest.fn() } },
            chats: {},
            me: {
                uuid: 'PubnubTest',
                direct: new EventEmitter2({ newListener: false, maxListeners: 50, verboseMemoryLeak: true })
            }
        });
        if (shouldCallPluginConstruct) {
            pluginExtension.construct();
        }
        return pluginExtension;
    };

    beforeEach(() => {
        configuration = Object.assign({}, minimumConfiguration);
        extension = createExtensionWithConfiguration(configuration);
    });

    afterEach(() => { Platform.OS = originalPlatform; });

    describe('#constructor', () => {
        afterEach(() => extension.notifications.destruct());

        test('should initialize with default values', () => {
            expect(extension.notificationToken).toBeNull();
            expect(extension.chatsState).toEqual({});
            expect(extension.configuration.ignoredChats.includes('#read.#feed')).toBeTruthy();
            expect(extension.configuration.events.includes('$.notifications.seen')).toBeTruthy();
            expect(extension.destructing).toBeFalsy();
        });

        test('should initialize notifications bridge to native module', () => {
            expect(extension.notifications).toBeDefined();
            expect(TypeValidator.isTypeOf(extension.notifications, CENotifications)).toBeTruthy();
        });

        test('should not throw when \'configuration\' is not type of Object in non-test environment', () => {
            const originalNodeEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            expect(() => createExtensionWithConfiguration('PubNub', false)).not.toThrowError();
            let testExtension = createExtensionWithConfiguration('PubNub', false);
            expect(testExtension.configuration).not.toBeDefined();

            process.env.NODE_ENV = originalNodeEnv;
        });

        test('should throw TypeError when \'configuration\' is not type of Object', () => {
            expect(() => new CENotificationsExtension('PubNub'))
                .toThrowError(/Unexpected configuration: empty or has unexpected data type \(object expected\)/);
        });

        test('should throw TypeError when \'configuration\' doesn\'t have \'events\' in it', () => {
            delete configuration.events;
            expect(() => new CENotificationsExtension(configuration))
                .toThrowError(/Unexpected events: empty or has unexpected data type \(array expected\) with unexpected data/);
        });

        test('should not throw when \'configuration.events\' is not type of Array in non-test environment', () => {
            const originalNodeEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';
            configuration.events = 2010;

            expect(() => createExtensionWithConfiguration(configuration, false)).not.toThrowError();
            let testExtension = createExtensionWithConfiguration(configuration, false);
            expect(testExtension.configuration).not.toBeDefined();

            process.env.NODE_ENV = originalNodeEnv;
        });

        test('should throw TypeError when \'configuration.events\' is not type of Array', () => {
            configuration.events = 2010;
            expect(() => new CENotificationsExtension(configuration))
                .toThrowError(/Unexpected values type \(array expected\)/);
        });

        test('should throw TypeError when \'configuration.events\' is empty Array', () => {
            configuration.events = [];
            expect(() => new CENotificationsExtension(configuration))
                .toThrowError(/Unexpected events: empty or has unexpected data type \(array expected\) with unexpected data/);
        });

        test('should throw TypeError when \'configuration.events\' is Array with Number', () => {
            configuration.events = [2, 0, 1, 0];
            expect(() => new CENotificationsExtension(configuration))
                .toThrowError(/Unexpected events: empty or has unexpected data type \(array expected\) with unexpected data/);
        });

        test('should not throw when \'configuration.ignoredChats\' is not type of Array in non-test environment', () => {
            const originalNodeEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';
            configuration.ignoredChats = 2010;

            expect(() => createExtensionWithConfiguration(configuration, false)).not.toThrowError();
            let testExtension = createExtensionWithConfiguration(configuration, false);
            expect(testExtension.configuration).not.toBeDefined();

            process.env.NODE_ENV = originalNodeEnv;
        });

        test('should throw TypeError when \'configuration.ignoredChats\' is not type of Array', () => {
            configuration.ignoredChats = 2010;
            expect(() => new CENotificationsExtension(configuration))
                .toThrowError(/Unexpected values type \(array expected\)/);
        });

        test('should throw TypeError when \'configuration.ignoredChats\' is Array with Number', () => {
            configuration.ignoredChats = [2, 0, 1, 0];
            expect(() => new CENotificationsExtension(configuration))
                .toThrowError(/Unexpected ignored chats: unexpected entries data type \(string expected\)/);
        });

        test('should not throw when \'configuration.platforms\' is not type of Object in non-test environment', () => {
            const originalNodeEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';
            configuration.platforms = [2, 0, 1, 0];

            expect(() => createExtensionWithConfiguration(configuration, false)).not.toThrowError();
            let testExtension = createExtensionWithConfiguration(configuration, false);
            expect(testExtension.configuration).not.toBeDefined();

            process.env.NODE_ENV = originalNodeEnv;
        });

        test('should throw TypeError when \'configuration.platforms\' is not type of Object', () => {
            configuration.platforms = [2, 0, 1, 0];
            expect(() => new CENotificationsExtension(configuration))
                .toThrowError(/Unexpected platforms: empty or has unexpected type \(string expected\) with unknown keys/);
        });

        test('should throw TypeError when \'configuration.platforms\' is empty Object', () => {
            configuration.platforms = {};
            expect(() => new CENotificationsExtension(configuration))
                .toThrowError(/Unexpected platforms: empty or has unexpected type \(string expected\) with unknown keys/);
        });

        test('should throw TypeError when \'configuration.platforms\' is Object with unknown keys', () => {
            configuration.platforms = { ios: true, PubNub: true };
            expect(() => new CENotificationsExtension(configuration))
                .toThrowError(/Unexpected platforms: empty or has unexpected type \(string expected\) with unknown keys/);
        });

        test('should throw TypeError when \'configuration.platforms\' is Object with String values', () => {
            configuration.platforms = { ios: true, PubNub: 'is awesome!' };
            expect(() => new CENotificationsExtension(configuration))
                .toThrowError(/Unexpected platforms: empty or has unexpected type \(string expected\) with unknown keys/);
        });

        test('should not throw when \'configuration.markAsSeen\' is not type of Boolean in non-test environment', () => {
            const originalNodeEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';
            configuration.markAsSeen = {};

            expect(() => createExtensionWithConfiguration(configuration, false)).not.toThrowError();
            let testExtension = createExtensionWithConfiguration(configuration, false);
            expect(testExtension.configuration).not.toBeDefined();

            process.env.NODE_ENV = originalNodeEnv;
        });

        test('should throw TypeError when \'configuration.markAsSeen\' is not type of Boolean', () => {
            configuration.markAsSeen = {};
            expect(() => new CENotificationsExtension(configuration))
                .toThrowError(/Unexpected mark as seen: has unexpected data type \(boolean expected\)/);
        });

        test('should not throw when \'configuration.formatter\' is not type of function in non-test environment', () => {
            const originalNodeEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';
            configuration.formatter = {};

            expect(() => createExtensionWithConfiguration(configuration, false)).not.toThrowError();
            let testExtension = createExtensionWithConfiguration(configuration, false);
            expect(testExtension.configuration).not.toBeDefined();

            process.env.NODE_ENV = originalNodeEnv;
        });

        test('should throw TypeError when \'configuration.formatter\' is not type of function', () => {
            configuration.formatter = {};
            expect(() => new CENotificationsExtension(configuration))
                .toThrowError(/Unexpected formatter: has unexpected data type \(function expected\)/);
        });
    });

    describe('#construct', () => {
        afterEach(() => extension.notifications.destruct());

        test('should be function', () => {
            expect(typeof extension.construct === 'function').toBeTruthy();
        });

        test('should add \'notifications\' field to \'parent\'', () => {
            extension.construct();
            expect(extension.parent.notifications).toBeDefined();
            expect(extension.parent.notifications).toEqual(extension.notifications);
        });

        test('should subscribe on ChatEngine events', () => {
            const onSpy = jest.spyOn(extension.ChatEngine, 'on');
            extension.construct();
            const registeredEvents = onSpy.mock.calls.map(event => event[0]);
            expect(onSpy.mock.calls).toHaveLength(3);
            expect(registeredEvents.includes('$.created.chat')).toBeTruthy();
            expect(registeredEvents.includes('$.connected')).toBeTruthy();
            expect(registeredEvents.includes('$.disconnected')).toBeTruthy();
            onSpy.mockRestore();
        });

        test('should subscribe on notifications bridge events', () => {
            const onSpy = jest.spyOn(extension.notifications, 'on');
            extension.construct();
            const registeredEvents = onSpy.mock.calls.map(event => event[0]);
            expect(onSpy.mock.calls).toHaveLength(1);
            expect(registeredEvents.includes('$.notifications.registered')).toBeTruthy();
            expect(registeredEvents.includes('$.notifications.received')).toBeFalsy();
            onSpy.mockRestore();
        });

        test('should subscribe on \'$.notifications.received\' if markAsSeen is set to true', () => {
            extension.configuration.markAsSeen = true;
            const onSpy = jest.spyOn(extension.notifications, 'on');
            extension.construct();
            const registeredEvents = onSpy.mock.calls.map(event => event[0]);
            expect(onSpy.mock.calls).toHaveLength(2);
            expect(registeredEvents.includes('$.notifications.received')).toBeTruthy();
            onSpy.mockRestore();
        });

        test('should handle chats which has been created before instance construction', () => {
            const onChatCreateSpy = jest.spyOn(extension, 'onChatCreate');
            extension.ChatEngine.chats.chat1 = { channel: 'chat1', plugin: jest.fn(), plugins: [] };
            extension.construct();
            expect(onChatCreateSpy).toHaveBeenCalled();
            onChatCreateSpy.mockRestore();
        });

        test('should not replace already registered extension with \'chatEngineNotifications.chat\' namespace', () => {
            const plugin = { namespace: 'chatEngineNotifications.chat', check: 'data' };
            const chat1 = { channel: 'chat1', plugins: [plugin] };
            chat1.plugin = chatPlugin => chat1.plugins.push(chatPlugin);
            const onChatCreateSpy = jest.spyOn(extension, 'onChatCreate');
            extension.ChatEngine.chats.chat1 = chat1;

            extension.construct();
            expect(chat1.plugins).toHaveLength(1);
            expect(onChatCreateSpy).toHaveBeenCalled();
            onChatCreateSpy.mockRestore();
        });

        test('should add plugin for \'chatEngineNotifications.chat\' namespace if there is different plugins registered', () => {
            const plugin = { namespace: 'typingIndicator', check: 'data' };
            const chat1 = { channel: 'chat1', plugins: [plugin] };
            chat1.plugin = chatPlugin => chat1.plugins.push(chatPlugin);
            const onChatCreateSpy = jest.spyOn(extension, 'onChatCreate');
            extension.ChatEngine.chats.chat1 = chat1;

            extension.construct();
            expect(chat1.plugins).toHaveLength(2);
            expect(onChatCreateSpy).toHaveBeenCalled();
            onChatCreateSpy.mockRestore();
        });
    });

    describe('#destruct', () => {
        beforeEach(() => {
            extension = new CENotificationsExtension(Object.assign({}, minimumConfiguration));
            extension.parent = {};
            extension.ChatEngine = new EventEmitter2({ newListener: false, maxListeners: 50, verboseMemoryLeak: true });
            extension.ChatEngine.chats = {};
            extension.construct();
        });

        test('should be function', () => {
            expect(typeof extension.destruct === 'function').toBeTruthy();
            extension.notifications.destruct();
        });

        test('should set destruct property to \'true\' for plugin and bridge', () => {
            extension.configuration.markAsSeen = true;
            extension.notifications.destruct();
            expect(extension.destructing).toBeTruthy();
            expect(extension.notifications.destructing).toBeTruthy();
        });

        test('should call extension\'s \'destruct\' method', () => {
            const onDeviceRegisterSpy = jest.spyOn(extension, 'destruct');
            extension.configuration.markAsSeen = true;
            extension.notifications.destruct();
            expect(onDeviceRegisterSpy).toHaveBeenCalled();
            onDeviceRegisterSpy.mockRestore();
        });

        test('should ignore events from native module', () => {
            extension.destruct();
            const onDeviceRegisterSpy = jest.spyOn(extension, 'onDeviceRegister');
            DeviceEventEmitter.emit('CENRegistered', { deviceToken: '00000000000000000000000000000000' });
            expect(onDeviceRegisterSpy).not.toHaveBeenCalled();
            onDeviceRegisterSpy.mockRestore();
        });

        test('should ignore events from ChatEngine', () => {
            extension.destruct();
            const onChatCreateSpy = jest.spyOn(extension, 'onChatCreate').mockImplementation(() => {});
            extension.ChatEngine.emit('$.created.chat', { channel: 'PubNub' }, {});
            expect(onChatCreateSpy).not.toHaveBeenCalled();
            onChatCreateSpy.mockRestore();
        });

        test('should remove observation from ignored chats on destruction', () => {
            extension.ChatEngine.chats = { chat1: { channel: 'PubNub' }, chat2: { channel: 'awesome!' } };
            extension.setPushNotificationState = () => {};
            extension.chatsState = { chat1: { states: ['enabled'], errorCount: 0 }, chat2: { states: ['ignored'], errorCount: 6 } };

            extension.destruct();
            expect(extension.chatsState.chat1).toBeDefined();
            expect(extension.chatsState.chat2).not.toBeDefined();
        });

        test('should disable notifications from observed chat which is registered with ChatEngine', () => {
            const chat1 = { channel: 'PubNub' };
            extension.ChatEngine.chats = { chat1 };
            const setPushNotificationStateSpy = jest.spyOn(extension, 'setPushNotificationState').mockImplementation(() => {});
            extension.chatsState = { chat1: { states: ['enabled'], errorCount: 0 } };

            extension.destruct();
            expect(setPushNotificationStateSpy).toHaveBeenCalledWith(chat1, 'disable');
            setPushNotificationStateSpy.mockRestore();
        });

        test('should remove observation from chat which is not registered with ChatEngine', () => {
            const setPushNotificationStateSpy = jest.spyOn(extension, 'setPushNotificationState').mockImplementation(() => {});
            extension.chatsState = { chat1: { states: ['enabled'], errorCount: 0 } };

            extension.destruct();
            expect(setPushNotificationStateSpy).not.toHaveBeenCalled();
            expect(extension.chatsState.chat1).not.toBeDefined();
        });
    });

    describe('#cleanUp', () => {

        test('should be function', () => {
            expect(typeof extension.cleanUp === 'function').toBeTruthy();
            extension.notifications.destruct();
        });

        test('should nullify \'notifications\' property for \'parent\'', () => {
            extension.cleanUp();
            expect(TypeValidator.isDefined(extension.parent.notifications)).toBeFalsy();
        });
    });

    describe('#markNotificationAsSeen', () => {
        afterEach(() => extension.notifications.destruct());

        test('should be function', () => {
            expect(typeof extension.markNotificationAsSeen === 'function').toBeTruthy();
        });

        test('should be called when \'notifications.markNotificationAsSeen\' is used', () => {
            const notification = { notification: { aps: { alert: 'PubNub is awesome!' }, cepayload: { ceid: 'unique' } }, foreground: true };
            const onSpy = jest.spyOn(extension.ChatEngine.me.direct, 'emit');
            extension.notifications.markNotificationAsSeen(notification);
            expect(onSpy).toHaveBeenCalled();
            onSpy.mockRestore();
        });

        test('should emit \'$.notifications.seen\' event to user\'s direct chat', () => {
            const notification = { notification: { aps: { alert: 'PubNub is awesome!' }, cepayload: { ceid: 'unique' } }, foreground: true };
            const onSpy = jest.spyOn(extension.ChatEngine.me.direct, 'emit');
            extension.markNotificationAsSeen(notification);
            expect(onSpy).toHaveBeenCalledWith('$.notifications.seen', { ceid: notification.notification.cepayload.ceid });
            onSpy.mockRestore();
        });

        test('should emit \'$.notifications.seen\' event on behalf of \'notifications\' instance', () => {
            const notification = { notification: { aps: { alert: 'PubNub is awesome!' }, cepayload: { ceid: 'unique' } }, foreground: true };
            const onSpy = jest.spyOn(extension.parent.notifications, 'emit');
            extension.markNotificationAsSeen(notification);
            expect(onSpy).toHaveBeenCalledWith('$.notifications.seen');
            onSpy.mockRestore();
        });

        test('should not emit \'$.notifications.seen\' event if \'cepayload\' is missing', () => {
            const notification = { notification: { aps: { alert: 'PubNub is awesome!' } }, foreground: true };
            const onSpy = jest.spyOn(extension.ChatEngine.me.direct, 'emit');
            extension.markNotificationAsSeen(notification);
            expect(onSpy).not.toHaveBeenCalled();
            onSpy.mockRestore();
        });

        test('should not emit \'$.notifications.seen\' event if notification not from user interaction or not in foreground', () => {
            const notification = {
                notification: {
                    aps: { alert: 'PubNub is awesome!' },
                    cepayload: { ceid: 'unique' }
                },
                foreground: false,
                userInteraction: false
            };
            const onSpy = jest.spyOn(extension.ChatEngine.me.direct, 'emit');
            extension.markNotificationAsSeen(notification);
            expect(onSpy).not.toHaveBeenCalled();
            onSpy.mockRestore();
        });

        test('should not emit \'$.notifications.seen\' event when \'ceid\' is missing', () => {
            const notification = { notification: { aps: { alert: 'PubNub is awesome!' }, cepayload: { } }, foreground: true };
            const onSpy = jest.spyOn(extension.ChatEngine.me.direct, 'emit');
            extension.markNotificationAsSeen(notification);
            expect(onSpy).not.toHaveBeenCalled();
            onSpy.mockRestore();
        });

        test('should not emit \'$.notifications.seen\' event when notification\'s \'event\' is set to \'$.notifications.seen\'', () => {
            const notification = {
                notification: { aps: { alert: 'PubNub is awesome!' }, cepayload: { event: '$.notifications.seen' } },
                foreground: true
            };
            const onSpy = jest.spyOn(extension.ChatEngine.me.direct, 'emit');
            extension.markNotificationAsSeen(notification);
            expect(onSpy).not.toHaveBeenCalled();
            onSpy.mockRestore();
        });

        test('should throw TypeError when \'notification\' is not type of Object', () => {
            expect(() => extension.markNotificationAsSeen('PubNub'))
                .toThrowError(/Unexpected notification: empty or has unexpected data type \(object expected\) with unknown keys/);
        });

        test('should throw TypeError when \'notification\' is empty Object', () => {
            expect(() => extension.markNotificationAsSeen({}))
                .toThrowError(/Unexpected notification: empty or has unexpected data type \(object expected\) with unknown keys/);
        });

        test('should throw TypeError when \'notification\' is Object with unknown keys', () => {
            expect(() => extension.markNotificationAsSeen({ notification: {}, PubNub: ['is', 'awesome!'] }))
                .toThrowError(/Unexpected notification: empty or has unexpected data type \(object expected\) with unknown keys/);
        });

        test('should throw TypeError when \'notification.notification\' is not type of Object', () => {
            expect(() => extension.markNotificationAsSeen({ notification: 'PubNub' }))
                .toThrowError(/Unexpected notification payload: empty or has unexpected data type \(object expected\)/);
        });

        test('should throw TypeError when \'notification.notification\' is empty Object', () => {
            expect(() => extension.markNotificationAsSeen({ notification: {} }))
                .toThrowError(/Unexpected notification payload: empty or has unexpected data type \(object expected\)/);
        });
    });

    describe('#markAllNotificationAsSeen', () => {
        afterEach(() => extension.notifications.destruct());

        test('should be function', () => {
            expect(typeof extension.markAllNotificationAsSeen === 'function').toBeTruthy();
        });

        test('should be called when \'notifications.markAllNotificationAsSeen\' is used', () => {
            const onSpy = jest.spyOn(extension.ChatEngine.me.direct, 'emit');
            extension.notifications.markAllNotificationAsSeen();
            expect(onSpy).toHaveBeenCalled();
            onSpy.mockRestore();
        });

        test('should emit \'$.notifications.seen\' event to user\'s direct chat', () => {
            const onSpy = jest.spyOn(extension.ChatEngine.me.direct, 'emit');
            extension.markAllNotificationAsSeen();
            expect(onSpy).toHaveBeenCalledWith('$.notifications.seen', { ceid: 'all' });
            onSpy.mockRestore();
        });

        test('should emit \'$.notifications.seen\' event on behalf of \'notifications\' instance', () => {
            const onSpy = jest.spyOn(extension.parent.notifications, 'emit');
            extension.markAllNotificationAsSeen();
            expect(onSpy).toHaveBeenCalledWith('$.notifications.seen');
            onSpy.mockRestore();
        });
    });

    describe('#setPushNotificationState', () => {
        const chat = { channel: 'chat1' };
        beforeEach(() => {
            extension.notificationToken = '00000000000000000000000000000000';
            extension.chatsState = { chat1: { states: ['created'], errorCount: 0 } };
            extension.ChatEngine.chats = { chat1: chat };
        });
        afterEach(() => extension.notifications.destruct());

        test('should be function', () => {
            expect(typeof extension.setPushNotificationState === 'function').toBeTruthy();
        });

        test('should not change push notifications state if device notification token not available', () => {
            delete extension.notificationToken;
            extension.setPushNotificationState(chat, 'enable');
            expect(extension.ChatEngine.pubnub.push.addChannels).not.toHaveBeenCalled();
        });

        test('should not change push notifications state to intermediate state (not to enable or disable)', () => {
            extension.setPushNotificationState(chat, 'enabling');
            expect(extension.ChatEngine.pubnub.push.addChannels).not.toHaveBeenCalled();
        });

        test('should store \'disable\' state change request while \'enabling\'', () => {
            extension.chatsState.chat1.states = ['enabling'];
            extension.setPushNotificationState(chat, 'disable');
            expect(extension.chatsState.chat1.states).toHaveLength(2);
            expect(extension.chatsState.chat1.states.includes('disable')).toBeTruthy();
            expect(extension.ChatEngine.pubnub.push.addChannels).not.toHaveBeenCalled();
        });

        test('should store \'enable\' state change request while \'disabling\'', () => {
            extension.chatsState.chat1.states = ['disabling'];
            extension.setPushNotificationState(chat, 'enable');
            expect(extension.chatsState.chat1.states).toHaveLength(2);
            expect(extension.chatsState.chat1.states.includes('enable')).toBeTruthy();
            expect(extension.ChatEngine.pubnub.push.addChannels).not.toHaveBeenCalled();
        });

        test('should change \'erredEnable\' to \'enable\'', () => {
            extension.setPushNotificationState(chat, 'erredEnable');
            expect(extension.ChatEngine.pubnub.push.addChannels).toHaveBeenCalled();
        });

        test('should change \'erredDisable\' to \'disable\'', () => {
            extension.chatsState.chat1.states = ['enabled'];
            extension.setPushNotificationState(chat, 'erredDisable');
            expect(extension.ChatEngine.pubnub.push.removeChannels).toHaveBeenCalled();
        });

        test('should change \'enable\' to \'disable\' if request not sent yet', () => {
            extension.chatsState.chat1.states = ['enable'];
            extension.setPushNotificationState(chat, 'disable');
            expect(extension.chatsState.chat1.states).toHaveLength(1);
            expect(extension.chatsState.chat1.states[0]).toEqual('disabling');
            expect(extension.ChatEngine.pubnub.push.removeChannels).toHaveBeenCalled();
        });

        test('should change \'disable\' to \'enable\' if request not sent yet', () => {
            extension.chatsState.chat1.states = ['disable'];
            extension.setPushNotificationState(chat, 'enable');
            expect(extension.chatsState.chat1.states).toHaveLength(1);
            expect(extension.chatsState.chat1.states[0]).toEqual('enabling');
            expect(extension.ChatEngine.pubnub.push.addChannels).toHaveBeenCalled();
        });

        test('should change \'created\' to \'erredDisable\' in attempt to enable if notification token is not set', () => {
            extension.notificationToken = undefined;
            const onPushNotificationStateChangeCompletionSpy = jest.spyOn(extension, 'onPushNotificationStateChangeCompletion');
            extension.setPushNotificationState(chat, 'enable');
            expect(extension.chatsState.chat1.states).toHaveLength(1);
            expect(extension.chatsState.chat1.states[0]).toEqual('erredEnable');
            expect(onPushNotificationStateChangeCompletionSpy).toHaveBeenCalledWith(chat, true, { error: {} });
        });

        test('should change \'created\' to \'erredDisable\' in attempt to disable if notification token is not set', () => {
            extension.notificationToken = undefined;
            const onPushNotificationStateChangeCompletionSpy = jest.spyOn(extension, 'onPushNotificationStateChangeCompletion');
            extension.setPushNotificationState(chat, 'disable');
            expect(extension.chatsState.chat1.states).toHaveLength(1);
            expect(extension.chatsState.chat1.states[0]).toEqual('erredDisable');
            expect(onPushNotificationStateChangeCompletionSpy).toHaveBeenCalledWith(chat, false, { error: {} });
        });

        test('should start delayed notification state change if notification token is not set', () => {
            extension.notificationToken = undefined;
            const startDelayedNotificationStateChangeSpy = jest.spyOn(extension, 'startDelayedNotificationStateChange');
            extension.setPushNotificationState(chat, 'disable');
            expect(startDelayedNotificationStateChangeSpy).toHaveBeenCalled();
        });

        test('should change push notifications state for created chat in iOS environment', () => {
            extension.setPushNotificationState(chat, 'enable');
            expect(extension.ChatEngine.pubnub.push.addChannels).toHaveBeenCalledWith({
                channels: [chat.channel],
                device: extension.notificationToken,
                pushGateway: 'apns'
            }, expect.any(Function));
        });

        test('should change push notifications state for created chat in Android environment', () => {
            Platform.OS = 'android';
            extension.setPushNotificationState(chat, 'enable');
            expect(extension.ChatEngine.pubnub.push.addChannels).toHaveBeenCalledWith({
                channels: [chat.channel],
                device: extension.notificationToken,
                pushGateway: 'gcm'
            }, expect.any(Function));
        });

        test('should call notification state change handler', () => {
            const completionSpy = jest.spyOn(extension, 'onPushNotificationStateChangeCompletion').mockImplementation(() => {});
            const statusObject = {};
            extension.ChatEngine.pubnub.push.addChannels = jest.fn((options, callback) => callback(statusObject));
            extension.setPushNotificationState(chat, 'enable');
            expect(completionSpy).toHaveBeenCalledWith(chat, true, statusObject);
            completionSpy.mockRestore();
        });
    });

    describe('#startDelayedNotificationStateChange', () => {
        const chat = { channel: 'chat1' };

        beforeEach(() => {
            jest.useFakeTimers();
            extension.chatsState = { chat1: { states: ['created'], errorCount: 0 } };
            extension.ChatEngine.chats = { chat1: chat };
        });

        afterEach(() => {
            jest.clearAllTimers();
            jest.useRealTimers();
        });

        test('should be function', () => {
            expect(typeof extension.startDelayedNotificationStateChange === 'function').toBeTruthy();
        });

        test('should cancel previous interval', () => {
            extension.retryInterval = setInterval(() => {}, 5000);
            extension.startDelayedNotificationStateChange();
            expect(clearInterval.mock.calls.length).toBe(1);
        });

        test('should perform delayed chats notification state modification', (done) => {
            const setPushNotificationStateSpy = jest.spyOn(extension, 'setPushNotificationState').mockImplementation(() => { done(); });

            extension.startDelayedNotificationStateChange();
            jest.runAllTimers();

            expect(setPushNotificationStateSpy).toHaveBeenCalled();
            setPushNotificationStateSpy.mockRestore();
        });

        test('should not perform delayed notification state modification for chats unknown to ChatEngine', () => {
            delete extension.ChatEngine.chats.chat1;
            const setPushNotificationStateSpy = jest.spyOn(extension, 'setPushNotificationState').mockImplementation(() => {});

            extension.startDelayedNotificationStateChange();
            jest.runAllTimers();

            expect(setPushNotificationStateSpy).not.toHaveBeenCalled();
            setPushNotificationStateSpy.mockRestore();
        });

        test('should not perform delayed chats notification state modification for chats w/o states', () => {
            delete extension.chatsState.chat1.states;
            const setPushNotificationStateSpy = jest.spyOn(extension, 'setPushNotificationState').mockImplementation(() => {});

            extension.startDelayedNotificationStateChange();
            jest.runAllTimers();

            expect(setPushNotificationStateSpy).not.toHaveBeenCalled();
            setPushNotificationStateSpy.mockRestore();
        });
    });

    describe('#chatMiddlewareExtension', () => {
        afterEach(() => extension.notifications.destruct());

        test('should be function', () => {
            expect(typeof extension.chatMiddlewareExtension === 'function').toBeTruthy();
        });

        test('should return middleware configuration', () => {
            const middleware = extension.chatMiddlewareExtension();
            expect(TypeValidator.isTypeOf(middleware, Object)).toBeTruthy();
            expect(middleware.namespace).toBeDefined();
            expect(middleware.middleware).toBeDefined();
            expect(middleware.middleware.emit).toBeDefined();
        });

        test('should create \'emit\' middleware for all requested events', () => {
            const middleware = extension.chatMiddlewareExtension();
            expect(Object.keys(middleware.middleware.emit)).toEqual(extension.configuration.events);
        });

        test('should call formatter on event\'s middleware execution', () => {
            const notificationFormatterSpy = jest.spyOn(extension, 'notificationFormatter').mockImplementation(() => {});
            const middleware = extension.chatMiddlewareExtension();
            middleware.middleware.emit['$.notifications.seen']();
            expect(notificationFormatterSpy).toHaveBeenCalled();
            notificationFormatterSpy.mockRestore();
        });
    });

    describe('#notificationFormatter', () => {
        const inviteEvent = {
            chat: { channel: 'chat-engine#user#pubnub#write.#direct' },
            event: '$.invite',
            sender: 'Bob',
            data: { channel: 'secret-meeting' }
        };
        const nativeInvitePayload = {
            chat: inviteEvent.chat.channel,
            event: inviteEvent.event,
            sender: inviteEvent.sender,
            data: inviteEvent.data
        };

        afterEach(() => extension.notifications.destruct());

        test('should be function', () => {
            expect(typeof extension.notificationFormatter === 'function').toBeTruthy();
        });

        test('should build notification for \'$.notifications.seen\'', () => {
            const notification = Object.assign({}, inviteEvent);
            delete notification.data;
            const seenNotificationSpy = jest.spyOn(CENotificationFormatter, 'seenNotification').mockImplementation(() => ({}));
            const normalizedSpy = jest.spyOn(CENotificationFormatter, 'normalized').mockImplementation(() => ({}));
            const next = jest.fn();
            extension.notificationFormatter('$.notifications.seen', notification, next);
            expect(seenNotificationSpy).toHaveBeenCalled();
            expect(next).toHaveBeenCalled();
            normalizedSpy.mockRestore();
            seenNotificationSpy.mockRestore();
        });

        test('should call user-provided formatter', () => {
            const formattedPayload = { apns: { aps: { alert: 'Test alert' } } };
            const next = jest.fn();
            extension.configuration.formatter = jest.fn(() => formattedPayload);

            extension.notificationFormatter(inviteEvent.event, inviteEvent, next);
            const expected = CENotificationFormatter.normalized(inviteEvent, formattedPayload);
            expected.pn_apns.cepayload.ceid = next.mock.calls[0][1].pn_apns.cepayload.ceid;

            expect(extension.configuration.formatter).toHaveBeenCalledWith(inviteEvent);
            expect(next).toHaveBeenCalledWith(null, expected);
        });

        test('should not append push notification payload because user-provided formatter returned {}', () => {
            const next = jest.fn();
            extension.configuration.formatter = jest.fn(() => ({}));
            extension.notificationFormatter(inviteEvent.event, inviteEvent, next);
            expect(extension.configuration.formatter).toHaveBeenCalledWith(inviteEvent);
            expect(next).toHaveBeenCalledWith(null, inviteEvent);
        });

        test('should try native module because user-provided function return null', (done) => {
            const formatNotificationPayloadSpy = jest.spyOn(extension.notifications, 'formatNotificationPayload');
            const formattedPayload = { apns: { aps: { alert: 'Test alert' } } };
            const next = jest.fn();
            extension.configuration.formatter = jest.fn(() => null);
            NativeModules.CENNotifications.formatNotificationPayload = jest.fn((nativePayload, callback) => {
                callback(formattedPayload, true);

                const expected = CENotificationFormatter.normalized(inviteEvent, formattedPayload);
                expected.pn_apns.cepayload.ceid = next.mock.calls[0][1].pn_apns.cepayload.ceid;

                expect(formatNotificationPayloadSpy).toHaveBeenCalledWith(nativeInvitePayload, expect.any(Function));
                expect(next).toHaveBeenCalledWith(null, expected);
                done();
            });
            extension.notificationFormatter(inviteEvent.event, inviteEvent, next);
        });

        test('should try native module because user-provided function not defined', (done) => {
            const formatNotificationPayloadSpy = jest.spyOn(extension.notifications, 'formatNotificationPayload');
            const formattedPayload = { apns: { aps: { alert: 'Test alert' } } };
            const next = jest.fn();
            NativeModules.CENNotifications.formatNotificationPayload = jest.fn((nativePayload, callback) => {
                callback(formattedPayload, true);

                const expected = CENotificationFormatter.normalized(inviteEvent, formattedPayload);
                expected.pn_apns.cepayload.ceid = next.mock.calls[0][1].pn_apns.cepayload.ceid;

                expect(formatNotificationPayloadSpy).toHaveBeenCalledWith(nativeInvitePayload, expect.any(Function));
                expect(next).toHaveBeenCalledWith(null, expected);
                done();
            });
            extension.notificationFormatter(inviteEvent.event, inviteEvent, next);
        });

        test('should try default formatter because native module unable to format payload', (done) => {
            const notificationsSpy = jest.spyOn(CENotificationFormatter, 'notifications');
            const next = jest.fn();
            NativeModules.CENNotifications.formatNotificationPayload = jest.fn((nativePayload, callback) => {
                callback(null, false);
                expect(notificationsSpy).toHaveBeenCalledWith(inviteEvent, extension.configuration.platforms);
                expect(next).toHaveBeenCalled();
                done();
            });
            extension.notificationFormatter(inviteEvent.event, inviteEvent, next);
        });

        test('should try default formatter because native module formatter returned null', (done) => {
            const notificationsSpy = jest.spyOn(CENotificationFormatter, 'notifications');
            const next = jest.fn();
            NativeModules.CENNotifications.formatNotificationPayload = jest.fn((nativePayload, callback) => {
                callback(null, true);
                expect(notificationsSpy).toHaveBeenCalledWith(inviteEvent, extension.configuration.platforms);
                expect(next).toHaveBeenCalled();
                done();
            });
            extension.notificationFormatter(inviteEvent.event, inviteEvent, next);
        });

        test('should not append push notification payload because native module formatter returned {}', (done) => {
            const next = jest.fn();
            NativeModules.CENNotifications.formatNotificationPayload = jest.fn((nativePayload, callback) => {
                callback({}, true);
                expect(next).toHaveBeenCalledWith(null, inviteEvent);
                done();
            });
            extension.notificationFormatter(inviteEvent.event, inviteEvent, next);
        });
    });

    describe('#onDeviceRegister', () => {
        afterEach(() => extension.notifications.destruct());

        test('should be function', () => {
            expect(typeof extension.onDeviceRegister === 'function').toBeTruthy();
        });

        test('should be called in response on \'$.notifications.registered\' event', (done) => {
            const tokenData = { deviceToken: '00000000000000000000000000000000' };
            const onDeviceRegisterSpy = jest.spyOn(extension, 'onDeviceRegister').mockImplementation(() => {
                expect(onDeviceRegisterSpy).toHaveBeenCalledWith(tokenData.deviceToken);
                onDeviceRegisterSpy.mockRestore();
                done();
            });
            DeviceEventEmitter.emit('CENRegistered', tokenData);
        });

        test('should store device token', (done) => {
            const tokenData = { deviceToken: '00000000000000000000000000000000' };
            const onDeviceRegisterSpy = jest.spyOn(extension, 'onDeviceRegister').mockImplementation(() => {
                expect(onDeviceRegisterSpy).toHaveBeenCalledWith(tokenData.deviceToken);
                onDeviceRegisterSpy.mockRestore();
                done();
            });
            DeviceEventEmitter.emit('CENRegistered', tokenData);
        });

        test('should start delayed chats notification state change', () => {
            const tokenData = { deviceToken: '00000000000000000000000000000000' };
            const startDelayedNotificationStateChangeSpy = jest.spyOn(extension, 'startDelayedNotificationStateChange');
            DeviceEventEmitter.emit('CENRegistered', tokenData);
            expect(startDelayedNotificationStateChangeSpy).toHaveBeenCalled();
            startDelayedNotificationStateChangeSpy.mockRestore();
        });

        test('should not re-enable push notification for existing chats if stored and new tokens are the same', (done) => {
            extension.chatsState = { chat1: { states: ['enabled'] }, chat2: { states: ['enabling'] } };
            extension.notificationToken = '00000000000000000000000000000000';
            const tokenData = { deviceToken: '00000000000000000000000000000000' };
            const startDelayedNotificationStateChangeSpy = jest.spyOn(extension, 'startDelayedNotificationStateChange').mockImplementation(() => {
                expect(extension.chatsState.chat1.states).toEqual(extension.chatsState.chat1.states);
                expect(extension.chatsState.chat2.states).toEqual(extension.chatsState.chat2.states);
                startDelayedNotificationStateChangeSpy.mockRestore();
                done();
            });
            DeviceEventEmitter.emit('CENRegistered', tokenData);
        });

        test('should not re-enable push notification for existing chats if their state is not \'enabled\' or \'enabling\'', (done) => {
            extension.chatsState = { chat1: { states: ['disable'] }, chat2: { states: ['disabled'] } };
            extension.notificationToken = '00000000000000000000000000000000';
            const tokenData = { deviceToken: '00000000000000000000000000000001' };
            const startDelayedNotificationStateChangeSpy = jest.spyOn(extension, 'startDelayedNotificationStateChange').mockImplementation(() => {
                expect(extension.chatsState.chat1.states).toEqual(extension.chatsState.chat1.states);
                expect(extension.chatsState.chat2.states).toEqual(extension.chatsState.chat2.states);
                startDelayedNotificationStateChangeSpy.mockRestore();
                done();
            });
            DeviceEventEmitter.emit('CENRegistered', tokenData);
        });

        test('should re-enable push notification for existing chats if previous token available', (done) => {
            extension.chatsState = { chat1: { states: ['enabled'] }, chat2: { states: ['enabling'] } };
            extension.notificationToken = '00000000000000000000000000000000';
            const tokenData = { deviceToken: '00000000000000000000000000000001' };
            const startDelayedNotificationStateChangeSpy = jest.spyOn(extension, 'startDelayedNotificationStateChange').mockImplementation(() => {
                expect(extension.chatsState.chat1.states).toEqual(['enable']);
                expect(extension.chatsState.chat2.states).toEqual(['enable']);
                startDelayedNotificationStateChangeSpy.mockRestore();
                done();
            });
            DeviceEventEmitter.emit('CENRegistered', tokenData);
        });
    });

    describe('#onPushNotificationStateChangeCompletion', () => {
        const chat = { channel: 'chat1' };
        beforeEach(() => {
            extension.chatsState = { chat1: { states: ['created'], errorCount: 0 } };
            extension.ChatEngine.chats = { chat1: chat };
        });

        test('should be function', () => {
            expect(typeof extension.onPushNotificationStateChangeCompletion === 'function').toBeTruthy();
            extension.notifications.destruct();
        });

        test('should set \'enabled\' on successful processing', () => {
            extension.onPushNotificationStateChangeCompletion(chat, true, {});
            expect(extension.chatsState.chat1.states[0]).toBe('enabled');
            extension.notifications.destruct();
        });

        test('should set \'disabled\' on successful processing', () => {
            extension.onPushNotificationStateChangeCompletion(chat, false, {});
            expect(extension.chatsState.chat1.states[0]).toBe('disabled');
            extension.notifications.destruct();
        });

        test('should set \'erredEnable\' on request error', () => {
            extension.onPushNotificationStateChangeCompletion(chat, true, { error: { category: 'NotPNAccessDeniedCategory' } });
            expect(extension.chatsState.chat1.states[0]).toBe('erredEnable');
            extension.notifications.destruct();
        });

        test('should increase error count on PNAccessDeniedCategory error', () => {
            extension.onPushNotificationStateChangeCompletion(chat, true, { error: { category: 'PNAccessDeniedCategory' } });
            expect(extension.chatsState.chat1.errorCount).toBe(1);
            extension.notifications.destruct();
        });

        test('should set \'ignored\' after maximum PNAccessDeniedCategory error count reached', () => {
            extension.chatsState.chat1.errorCount = 200;
            extension.onPushNotificationStateChangeCompletion(chat, true, { error: { category: 'PNAccessDeniedCategory' } });
            expect(extension.chatsState.chat1.states[0]).toBe('ignored');
            extension.notifications.destruct();
        });

        test('should reset error count on non-PNAccessDeniedCategory error', () => {
            extension.chatsState.chat1.errorCount = 3;
            extension.onPushNotificationStateChangeCompletion(chat, true, { error: { category: 'NotPNAccessDeniedCategory' } });
            expect(extension.chatsState.chat1.errorCount).toBe(0);
            extension.notifications.destruct();
        });

        test('should set \'erredDisable\' on request error', () => {
            extension.onPushNotificationStateChangeCompletion(chat, false, { error: { category: 'NotPNAccessDeniedCategory' } });
            expect(extension.chatsState.chat1.states[0]).toBe('erredDisable');
            extension.notifications.destruct();
        });

        test('should call next state change', () => {
            const setPushNotificationStateSpy = jest.spyOn(extension, 'setPushNotificationState');
            extension.chatsState.chat1.states = ['enabling', 'disable'];
            extension.onPushNotificationStateChangeCompletion(chat, true, {});
            expect(setPushNotificationStateSpy).toHaveBeenCalledWith(chat, 'disable', true);
            setPushNotificationStateSpy.mockRestore();
            extension.notifications.destruct();
        });

        test('should remove chat on destructing plugin', () => {
            extension.notifications.destruct();
            extension.onPushNotificationStateChangeCompletion(chat, true, {});
            expect(extension.chatsState).toEqual({});
        });
    });

    describe('#onNotification', () => {
        afterEach(() => extension.notifications.destruct());

        test('should be function', () => {
            expect(typeof extension.onNotification === 'function').toBeTruthy();
        });

        test('should be called in response on \'$.notifications.received\' event if markAsSeen set to true', () => {
            configuration = Object.assign({ markAsSeen: true }, minimumConfiguration);
            extension = createExtensionWithConfiguration(configuration);
            const notification = { PubNub: 'is awesome!' };
            const onNotificationSpy = jest.spyOn(extension, 'onNotification');
            const markNotificationAsSeenSpy = jest.spyOn(extension.notifications, 'markNotificationAsSeen').mockImplementation(() => ({}));

            extension.notifications.emit('$.notifications.received', notification);

            expect(onNotificationSpy).toHaveBeenCalledWith(notification);
            expect(markNotificationAsSeenSpy).toHaveBeenCalledWith(notification);
            onNotificationSpy.mockRestore();
            markNotificationAsSeenSpy.mockRestore();
        });

        test('should not call in response on \'$.notifications.received\' event if markAsSeen set to false', () => {
            const notification = { PubNub: 'is awesome!' };
            const onNotificationSpy = jest.spyOn(extension, 'onNotification');
            extension.notifications.emit('$.notifications.received', notification);
            expect(onNotificationSpy).not.toHaveBeenCalled();
            onNotificationSpy.mockRestore();
        });
    });

    describe('#onChatCreate', () => {
        const chat = { channel: 'chat1', plugin: jest.fn(), plugins: [] };
        beforeEach(() => {
            extension.chatsState = { chat1: { states: ['created'], errorCount: 0 } };
            extension.ChatEngine.chats = { chat1: chat };
        });
        afterEach(() => extension.notifications.destruct());

        test('should be function', () => {
            expect(typeof extension.onChatCreate === 'function').toBeTruthy();
        });

        test('should be called in response on \'$.created.chat\' event', () => {
            const onChatCreateSpy = jest.spyOn(extension, 'onChatCreate');

            extension.ChatEngine.emit('$.created.chat', {}, chat);

            expect(onChatCreateSpy).toHaveBeenCalledWith({}, chat);
            onChatCreateSpy.mockRestore();
        });

        test('should not proceed for ignored chats', () => {
            const canManagePushNotificationsSpy = jest.spyOn(extension, 'canManagePushNotifications');

            extension.ChatEngine.emit('$.created.chat', {}, { channel: '#read.#feed' });

            expect(canManagePushNotificationsSpy).not.toHaveBeenCalled();
            canManagePushNotificationsSpy.mockRestore();
        });

        test('should add middleware to created chat', () => {
            delete extension.chatsState.chat1;
            extension.ChatEngine.emit('$.created.chat', {}, chat);

            expect(chat.plugin).toHaveBeenCalled();
        });

        test('should not request notifications state change for restricted chats (direct for non-local user)', () => {
            const remoteDirect = Object.assign({}, chat, { channel: 'chat-engine#user#pubnub#write.#direct' });
            extension.ChatEngine.emit('$.created.chat', {}, remoteDirect);

            expect(extension.chatsState[remoteDirect.channel].states[0]).not.toBe('enable');
        });
    });

    describe('#onChatConnect', () => {
        const chat = {
            channel: 'chat1',
            plugin: jest.fn(),
            name: 'Chat',
            plugins: []
        };

        beforeEach(() => {
            extension.chatsState = { chat1: { states: ['created'], errorCount: 0 } };
            extension.ChatEngine.chats = { chat1: chat };
        });
        afterEach(() => extension.notifications.destruct());

        test('should be function', () => {
            expect(typeof extension.onChatConnect === 'function').toBeTruthy();
        });

        test('should be called in response on \'$.connected\' event', () => {
            const onChatConnectSpy = jest.spyOn(extension, 'onChatConnect');

            extension.ChatEngine.emit('$.connected', {}, chat);

            expect(onChatConnectSpy).toHaveBeenCalledWith({}, chat);
            onChatConnectSpy.mockRestore();
        });

        test('should not proceed for non Chat object', () => {
            const shouldIgnoreChatSpy = jest.spyOn(extension, 'shouldIgnoreChat');

            extension.ChatEngine.emit('$.connected', {}, new Error('Test error'));

            expect(shouldIgnoreChatSpy).not.toHaveBeenCalled();
            shouldIgnoreChatSpy.mockRestore();
        });

        test('should not proceed for ignored chats', () => {
            const ignoredChat = Object.assign({}, chat, { channel: '#read.#feed' });
            const canManagePushNotificationsSpy = jest.spyOn(extension, 'canManagePushNotifications');

            extension.ChatEngine.emit('$.connected', {}, ignoredChat);

            expect(canManagePushNotificationsSpy).not.toHaveBeenCalled();
            canManagePushNotificationsSpy.mockRestore();
        });

        test('should not request notifications state change for restricted chats (direct for non-local user)', () => {
            const remoteState = extension.chatsState[chat.channel];
            const remoteDirect = Object.assign({}, chat, { channel: 'chat-engine#user#pubnub#write.#direct' });
            extension.chatsState[remoteDirect.channel] = remoteState;

            extension.ChatEngine.emit('$.connected', {}, remoteDirect);

            expect(extension.chatsState[remoteDirect.channel].states[0]).not.toBe('enable');
        });
    });

    describe('#onChatDisconnect', () => {
        const chat = {
            channel: 'chat1',
            plugin: jest.fn(),
            name: 'Chat',
            plugins: []
        };

        beforeEach(() => {
            extension.chatsState = { chat1: { states: ['created'], errorCount: 0 } };
            extension.ChatEngine.chats = { chat1: chat };
        });

        afterEach(() => extension.notifications.destruct());

        test('should be function', () => {
            expect(typeof extension.onChatDisconnect === 'function').toBeTruthy();
        });

        test('should be called in response on \'$.disconnected\' event', () => {
            const onChatDisconnectSpy = jest.spyOn(extension, 'onChatDisconnect');

            extension.ChatEngine.emit('$.disconnected', {}, chat);

            expect(onChatDisconnectSpy).toHaveBeenCalledWith({}, chat);
            onChatDisconnectSpy.mockRestore();
        });

        test('should not proceed for non Chat object', () => {
            const shouldIgnoreChatSpy = jest.spyOn(extension, 'shouldIgnoreChat');

            extension.ChatEngine.emit('$.disconnected', {}, new Error('Test error'));

            expect(shouldIgnoreChatSpy).not.toHaveBeenCalled();
            shouldIgnoreChatSpy.mockRestore();
        });

        test('should not proceed for ignored chats', () => {
            const ignoredChat = Object.assign({}, chat, { channel: '#read.#feed' });
            const canManagePushNotificationsSpy = jest.spyOn(extension, 'canManagePushNotifications');

            extension.ChatEngine.emit('$.disconnected', {}, ignoredChat);

            expect(canManagePushNotificationsSpy).not.toHaveBeenCalled();
            canManagePushNotificationsSpy.mockRestore();
        });

        test('should not request notifications state change for restricted chats (direct for non-local user)', () => {
            const remoteState = extension.chatsState[chat.channel];
            const remoteDirect = Object.assign({}, chat, { channel: 'chat-engine#user#pubnub#write.#direct' });
            extension.chatsState[remoteDirect.channel] = remoteState;

            extension.ChatEngine.emit('$.disconnected', {}, remoteDirect);

            expect(extension.chatsState[remoteDirect.channel].states[0]).not.toBe('disable');
        });
    });

    describe('#applyDefaultConfigurationValues', () => {
        afterEach(() => extension.notifications.destruct());

        test('should be function', () => {
            expect(typeof CENotificationsExtension.applyDefaultConfigurationValues === 'function').toBeTruthy();
        });

        test('should set \'markAsSeen\' to false if it is missing in \'configuration\'', () => {
            const testedConfiguration = { events: [] };
            CENotificationsExtension.applyDefaultConfigurationValues(testedConfiguration);
            expect(testedConfiguration.markAsSeen).toBeDefined();
            expect(testedConfiguration.markAsSeen).toBe(false);
        });

        test('should not add \'#read.#feed\' duplicates into in \'configuration.ignoredChats\'', () => {
            const testedConfiguration = { events: [], ignoredChats: ['#read.#feed'] };
            CENotificationsExtension.applyDefaultConfigurationValues(testedConfiguration);
            CENotificationsExtension.applyDefaultConfigurationValues(testedConfiguration);
            testedConfiguration.ignoredChats.pop();
            expect(testedConfiguration.ignoredChats).toHaveLength(0);
        });

        test('should not add \'$.notifications.seen\' duplicates into in \'configuration.events\'', () => {
            const testedConfiguration = { events: ['$.notifications.seen'] };
            CENotificationsExtension.applyDefaultConfigurationValues(testedConfiguration);
            CENotificationsExtension.applyDefaultConfigurationValues(testedConfiguration);
            testedConfiguration.events.pop();
            expect(testedConfiguration.events).toHaveLength(0);
        });
    });

    describe('#shouldIgnoreChat', () => {
        afterEach(() => extension.notifications.destruct());

        test('should be function', () => {
            expect(typeof extension.shouldIgnoreChat === 'function').toBeTruthy();
        });

        test('should process \'#write.#direct\' chat from \'system\' group', () => {
            const chat = { channel: `chat-engine#user#${extension.ChatEngine.me.uuid}#write.#direct`, group: 'system' };

            expect(extension.shouldIgnoreChat(chat)).toBeFalsy();
        });

        test('should ignore other chats from \'system\' group', () => {
            const chat = { channel: `chat-engine#user#${extension.ChatEngine.me.uuid}#me.#sync`, group: 'system' };

            expect(extension.shouldIgnoreChat(chat)).toBeTruthy();
        });

        test('should process chats not from \'ignoredChats\' list', () => {
            const chat = { channel: 'chat-engine#chat#public.#test1', group: 'custom' };

            expect(extension.shouldIgnoreChat(chat)).toBeFalsy();
        });

        test('should ignore chats from \'ignoredChats\' list', () => {
            const chat = { channel: 'chat-engine#chat#public.#IgnoredChat1', group: 'custom' };

            expect(extension.shouldIgnoreChat(chat)).toBeTruthy();
        });
    });
});
