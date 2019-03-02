/* eslint-disable no-unused-expressions,no-new,no-new-wrappers,no-new-object,no-array-constructor */
/* global test, expect */
import { NativeModules, Platform } from 'react-native';
import { EventEmitter2 } from 'eventemitter2';
import { CENotificationsExtension } from '../../../src/components/extension';
import CENotifications from '../../../src/components/notifications';
import CENotificationFormatter from '../../../src/helpers/formatter';
import { TypeValidator } from '../../../src/helpers/utils';

const uuid = require('uuid/v4');

jest.mock('NativeModules', () => ({
    CENNotifications: {
        receiveMissedEvents: jest.fn(),
        markNotificationAsSeen: jest.fn()
    }
}));

const listWithChats = (count, chatEngine) => {
    let chats = [];

    for (let chatN = 0; chatN < count; chatN += 1) {
        const chat = { channel: `chat-engine#chat#public.#${uuid()}`, plugins: [], plugin: jest.fn() };
        chatEngine.chats[chat.channel] = chat;
        chats.push(chat);
    }

    return chats;
};


/** @test {CENotificationsExtension} */
describe('unittest::CENotificationsExtension', () => {
    const minimumConfiguration = {
        events: ['$.invite', 'message'],
        platforms: { ios: true, android: true },
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
            pubnub: { push: { addChannels: jest.fn(), removeChannels: jest.fn(), deleteDevice: jest.fn() } },
            chats: {},
            me: {
                uuid: 'PubnubTest',
                direct: new EventEmitter2({ newListener: false, maxListeners: 50, verboseMemoryLeak: true })
            }
        });

        Object.assign(pluginExtension.ChatEngine.me, { chatEngine: pluginExtension.ChatEngine });

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
            expect(extension.configuration.events.includes('$notifications.seen')).toBeTruthy();
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
            extension.notifications.destruct();
            expect(extension.destructing).toBeTruthy();
            expect(extension.notifications.destructing).toBeTruthy();
        });

        test('should call extension\'s \'destruct\' method', () => {
            const onDeviceRegisterSpy = jest.spyOn(extension, 'destruct');
            extension.notifications.destruct();
            expect(onDeviceRegisterSpy).toHaveBeenCalled();
            onDeviceRegisterSpy.mockRestore();
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

    describe('#enable', () => {
        afterEach(() => extension.notifications.destruct());

        test('should be function', () => {
            expect(typeof extension.enable === 'function').toBeTruthy();
        });

        test('should forward call to general function', () => {
            /** @type {Array<Chat>} */
            const chats = [{ channel: 'Chat1', plugins: [], plugin: () => {} },
                { channel: 'Chat2', plugins: [], plugin: () => {} }];
            const deviceToken = '0000000000000000000000000000000000000000000000000000000000000000';
            const onSpy = jest.spyOn(extension, 'addChannels');
            const handler = () => {};

            extension.enable(chats, deviceToken, handler);
            expect(onSpy).toHaveBeenCalledWith(true, chats, deviceToken, handler);
        });

        test('should not forward call to general function when device token not specified', () => {
            /** @type {Array<Chat>} */
            const chats = [{ channel: 'Chat1', plugins: [], plugin: () => {} },
                { channel: 'Chat2', plugins: [], plugin: () => {} }];
            const onSpy = jest.spyOn(extension, 'addChannels');
            const deviceToken = null;
            const handler = () => {};

            extension.enable(chats, deviceToken, handler);
            expect(onSpy).not.toHaveBeenCalled();
        });

        test('should not forward call to general function when device token is empty', () => {
            /** @type {Array<Chat>} */
            const chats = [{ channel: 'Chat1', plugins: [], plugin: () => {} },
                { channel: 'Chat2', plugins: [], plugin: () => {} }];
            const onSpy = jest.spyOn(extension, 'addChannels');
            const handler = () => {};
            const deviceToken = '';

            extension.enable(chats, deviceToken, handler);
            expect(onSpy).not.toHaveBeenCalled();
        });

        test('should not forward call to general function when empty chats list passed', () => {
            /** @type {Array<Chat>} */
            const chats = [];
            const deviceToken = '0000000000000000000000000000000000000000000000000000000000000000';
            const onSpy = jest.spyOn(extension, 'addChannels');
            const handler = () => {};

            extension.enable(chats, deviceToken, handler);
            expect(onSpy).not.toHaveBeenCalled();
        });
    });

    describe('#disable', () => {
        afterEach(() => extension.notifications.destruct());

        test('should be function', () => {
            expect(typeof extension.disable === 'function').toBeTruthy();
        });

        test('should forward call to general function', () => {
            /** @type {Array<Chat>} */
            const chats = [{ channel: 'Chat1', plugins: [], plugin: () => {} },
                { channel: 'Chat2', plugins: [], plugin: () => {} }];
            const deviceToken = '0000000000000000000000000000000000000000000000000000000000000000';
            const onSpy = jest.spyOn(extension, 'addChannels');
            const handler = () => {};

            extension.disable(chats, deviceToken, handler);
            expect(onSpy).toHaveBeenCalledWith(false, chats, deviceToken, handler);
        });

        test('should not forward call to general function when device token not specified', () => {
            /** @type {Array<Chat>} */
            const chats = [{ channel: 'Chat1', plugins: [], plugin: () => {} },
                { channel: 'Chat2', plugins: [], plugin: () => {} }];
            const onSpy = jest.spyOn(extension, 'addChannels');
            const deviceToken = null;
            const handler = () => {};

            extension.disable(chats, deviceToken, handler);
            expect(onSpy).not.toHaveBeenCalled();
        });

        test('should not forward call to general function when device token is empty', () => {
            /** @type {Array<Chat>} */
            const chats = [{ channel: 'Chat1', plugins: [], plugin: () => {} },
                { channel: 'Chat2', plugins: [], plugin: () => {} }];
            const onSpy = jest.spyOn(extension, 'addChannels');
            const handler = () => {};
            const deviceToken = '';

            extension.disable(chats, deviceToken, handler);
            expect(onSpy).not.toHaveBeenCalled();
        });

        test('should not forward call to general function when empty chats list passed', () => {
            /** @type {Array<Chat>} */
            const chats = [];
            const deviceToken = '0000000000000000000000000000000000000000000000000000000000000000';
            const onSpy = jest.spyOn(extension, 'addChannels');
            const handler = () => {};

            extension.disable(chats, deviceToken, handler);
            expect(onSpy).not.toHaveBeenCalled();
        });
    });

    describe('#disableAll', () => {
        afterEach(() => extension.notifications.destruct());

        test('should be function', () => {
            expect(typeof extension.disableAll === 'function').toBeTruthy();
        });

        test('should forward call to general function', () => {
            const deviceToken = '0000000000000000000000000000000000000000000000000000000000000000';
            const onSpy = jest.spyOn(extension, 'addChannels');
            const handler = () => {};

            extension.disableAll(deviceToken, handler);
            expect(onSpy).toHaveBeenCalledWith(false, null, deviceToken, handler);
        });

        test('should not forward call to general function when device token not specified', () => {
            const onSpy = jest.spyOn(extension, 'addChannels');
            const deviceToken = null;
            const handler = () => {};

            extension.disableAll(deviceToken, handler);
            expect(onSpy).not.toHaveBeenCalled();
        });

        test('should not forward call to general function when device token is empty', () => {
            const onSpy = jest.spyOn(extension, 'addChannels');
            const handler = () => {};
            const deviceToken = '';

            extension.disableAll(deviceToken, handler);
            expect(onSpy).not.toHaveBeenCalled();
        });
    });

    describe('#addChannels', () => {
        afterEach(() => extension.notifications.destruct());

        test('should be function', () => {
            expect(typeof extension.addChannels === 'function').toBeTruthy();
        });

        test('should enable notifications for chats for iOS', () => {
            const chats = listWithChats(20, extension.ChatEngine);
            const channels = chats.map(chat => chat.channel);
            const device = '0000000000000000000000000000000000000000000000000000000000000000';
            Platform.OS = 'ios';

            const expected = { channels, device, pushGateway: 'apns' };

            extension.addChannels(true, chats, device);

            expect(extension.ChatEngine.pubnub.push.addChannels).toHaveBeenCalledTimes(1);
            expect(extension.ChatEngine.pubnub.push.addChannels).toHaveBeenCalledWith(expected, expect.any(Function));
        });

        test('should enable notifications for chats for Android', () => {
            const chats = listWithChats(20, extension.ChatEngine);
            const channels = chats.map(chat => chat.channel);
            const device = '0000000000000000000000000000000000000000000000000000000000000000';
            Platform.OS = 'android';

            const expected = { channels, device, pushGateway: 'gcm' };

            extension.addChannels(true, chats, device);

            expect(extension.ChatEngine.pubnub.push.addChannels).toHaveBeenCalledTimes(1);
            expect(extension.ChatEngine.pubnub.push.addChannels).toHaveBeenCalledWith(expected, expect.any(Function));
        });

        test('should enable notifications for chat series when huge list passed', () => {
            const chats = listWithChats(400, extension.ChatEngine);
            const device = '0000000000000000000000000000000000000000000000000000000000000000';

            extension.addChannels(true, chats, device);

            expect(extension.ChatEngine.pubnub.push.addChannels).toHaveBeenCalledTimes(2);
        });

        test('should not enable notifications when empty chats list passed', () => {
            const device = '0000000000000000000000000000000000000000000000000000000000000000';

            extension.addChannels(true, [], device);

            expect(extension.ChatEngine.pubnub.push.addChannels).not.toHaveBeenCalled();
        });

        test('should register plugin when push notifications enabled was successful', () => {
            const chats = listWithChats(20, extension.ChatEngine);
            const device = '0000000000000000000000000000000000000000000000000000000000000000';

            extension.ChatEngine.pubnub.push.addChannels = jest.fn().mockImplementation((params, handler) => {
                handler({ error: false });
            });

            extension.addChannels(true, chats, device);

            chats.forEach(chat => expect(chat.plugin).toHaveBeenCalled());
        });

        test('should not register plugin when push notifications enabled was successful and plugin already registered', () => {
            const chats = listWithChats(20, extension.ChatEngine);
            chats.forEach(chat => chat.plugins.push({ namespace: 'chatEngineNotifications.chat' }));
            const device = '0000000000000000000000000000000000000000000000000000000000000000';

            extension.ChatEngine.pubnub.push.addChannels = jest.fn().mockImplementation((params, handler) => {
                handler({ error: false });
            });

            extension.addChannels(true, chats, device);

            chats.forEach(chat => expect(chat.plugin).not.toHaveBeenCalled());
        });

        test('should call completion w/o error when push notifications enabled was successful', () => {
            const chats = listWithChats(20, extension.ChatEngine);
            const device = '0000000000000000000000000000000000000000000000000000000000000000';
            const completion = jest.fn();

            extension.ChatEngine.pubnub.push.addChannels = jest.fn().mockImplementation((params, handler) => {
                handler({ error: false });
            });

            extension.addChannels(true, chats, device, completion);

            expect(completion).toHaveBeenCalledWith(null);
        });

        test('should call completion w/ error when push notifications enable did fail', () => {
            const chats = listWithChats(20, extension.ChatEngine);
            const device = '0000000000000000000000000000000000000000000000000000000000000000';
            let errorData = { response: { text: `{"payload":{"channels": ["${chats[0].channel}"]}}` } };
            let expected = Object.assign({}, errorData, { chats: [chats[0]] });
            const completion = jest.fn();

            extension.ChatEngine.pubnub.push.addChannels = jest.fn().mockImplementation((params, handler) => {
                handler({ error: true, errorData });
            });

            extension.addChannels(true, chats, device, completion);

            expect(completion).toHaveBeenCalledWith(expected);
        });

        test('should call completion w/ error when push notifications enable did fail for huge list', () => {
            const chats = listWithChats(400, extension.ChatEngine);
            const device = '0000000000000000000000000000000000000000000000000000000000000000';
            let errorData1 = { response: { text: `{"payload":{"channels": ["${chats[0].channel}"]}}` } };
            let errorData2 = { response: { text: `{"payload":{"channels": ["${chats[chats.length - 1].channel}"]}}` } };
            let errorData = [errorData1, errorData2];
            let expected = Object.assign({}, errorData1, { chats: [chats[0], chats[chats.length - 1]] });
            const completion = jest.fn();
            let errorRequestCount = 0;

            extension.ChatEngine.pubnub.push.addChannels = jest.fn().mockImplementation((params, handler) => {
                handler({ error: true, errorData: errorData[errorRequestCount] });
                errorRequestCount += 1;
            });

            extension.addChannels(true, chats, device, completion);

            expect(completion).toHaveBeenCalledWith(expected);
        });

        test('should call completion w/ error when push notifications enable did fail for unknown chats', () => {
            const chats = listWithChats(20, extension.ChatEngine);
            const device = '0000000000000000000000000000000000000000000000000000000000000000';
            let errorData = { response: { text: '{"payload":{"channels": ["test-chat"]}}' } };
            let expected = Object.assign({}, errorData, { chats: [] });
            const completion = jest.fn();

            extension.ChatEngine.pubnub.push.addChannels = jest.fn().mockImplementation((params, handler) => {
                handler({ error: true, errorData });
            });

            extension.addChannels(true, chats, device, completion);

            expect(completion).toHaveBeenCalledWith(expected);
        });

        test('should disable notifications for chats for iOS', () => {
            const chats = listWithChats(20, extension.ChatEngine);
            const channels = chats.map(chat => chat.channel);
            const device = '0000000000000000000000000000000000000000000000000000000000000000';
            Platform.OS = 'ios';

            const expected = { channels, device, pushGateway: 'apns' };

            extension.addChannels(false, chats, device);

            expect(extension.ChatEngine.pubnub.push.removeChannels).toHaveBeenCalledTimes(1);
            expect(extension.ChatEngine.pubnub.push.removeChannels).toHaveBeenCalledWith(expected, expect.any(Function));
        });

        test('should disable notifications for chats for Android', () => {
            const chats = listWithChats(20, extension.ChatEngine);
            const channels = chats.map(chat => chat.channel);
            const device = '0000000000000000000000000000000000000000000000000000000000000000';
            Platform.OS = 'android';

            const expected = { channels, device, pushGateway: 'gcm' };

            extension.addChannels(false, chats, device);

            expect(extension.ChatEngine.pubnub.push.removeChannels).toHaveBeenCalledTimes(1);
            expect(extension.ChatEngine.pubnub.push.removeChannels).toHaveBeenCalledWith(expected, expect.any(Function));
        });

        test('should disable notifications for chat series when huge list passed', () => {
            const chats = listWithChats(400, extension.ChatEngine);
            const device = '0000000000000000000000000000000000000000000000000000000000000000';

            extension.addChannels(false, chats, device);

            expect(extension.ChatEngine.pubnub.push.removeChannels).toHaveBeenCalledTimes(2);
        });

        test('should not disable notifications when empty chats list passed', () => {
            const device = '0000000000000000000000000000000000000000000000000000000000000000';

            extension.addChannels(false, [], device);

            expect(extension.ChatEngine.pubnub.push.removeChannels).not.toHaveBeenCalled();
        });

        test('should unregister plugin when push notifications disable was successful', () => {
            const chats = listWithChats(20, extension.ChatEngine);
            chats.forEach(chat => chat.plugins.push({ namespace: 'chatEngineNotifications.chat' }));
            const device = '0000000000000000000000000000000000000000000000000000000000000000';

            extension.ChatEngine.pubnub.push.removeChannels = jest.fn().mockImplementation((params, handler) => {
                handler({ error: false });
            });

            extension.addChannels(false, chats, device);

            chats.forEach((chat) => {
                const registeredPlugin = chat.plugins.filter(plugin => plugin.namespace === 'chatEngineNotifications.chat');
                expect(registeredPlugin.length).toEqual(0);
            });
        });

        test('should call completion w/o error when push notifications disable was successful', () => {
            const chats = listWithChats(20, extension.ChatEngine);
            const device = '0000000000000000000000000000000000000000000000000000000000000000';
            const completion = jest.fn();

            extension.ChatEngine.pubnub.push.removeChannels = jest.fn().mockImplementation((params, handler) => {
                handler({ error: false });
            });

            extension.addChannels(false, chats, device, completion);

            expect(completion).toHaveBeenCalledWith(null);
        });

        test('should call completion w/ error when push notifications disable did fail', () => {
            const chats = listWithChats(20, extension.ChatEngine);
            const device = '0000000000000000000000000000000000000000000000000000000000000000';
            let errorData = { response: { text: `{"payload":{"channels": ["${chats[0].channel}"]}}` } };
            let expected = Object.assign({}, errorData, { chats: [chats[0]] });
            const completion = jest.fn();

            extension.ChatEngine.pubnub.push.removeChannels = jest.fn().mockImplementation((params, handler) => {
                handler({ error: true, errorData });
            });

            extension.addChannels(false, chats, device, completion);

            expect(completion).toHaveBeenCalledWith(expected);
        });

        test('should call completion w/ error when push notifications disable did fail for huge list', () => {
            const chats = listWithChats(400, extension.ChatEngine);
            const device = '0000000000000000000000000000000000000000000000000000000000000000';
            let errorData1 = { response: { text: `{"payload":{"channels": ["${chats[0].channel}"]}}` } };
            let errorData2 = { response: { text: `{"payload":{"channels": ["${chats[chats.length - 1].channel}"]}}` } };
            let errorData = [errorData1, errorData2];
            let expected = Object.assign({}, errorData1, { chats: [chats[0], chats[chats.length - 1]] });
            const completion = jest.fn();
            let errorRequestCount = 0;

            extension.ChatEngine.pubnub.push.removeChannels = jest.fn().mockImplementation((params, handler) => {
                handler({ error: true, errorData: errorData[errorRequestCount] });
                errorRequestCount += 1;
            });

            extension.addChannels(false, chats, device, completion);

            expect(completion).toHaveBeenCalledWith(expected);
        });

        test('should call completion w/ error when push notifications disable did fail for unknown chats', () => {
            const chats = listWithChats(20, extension.ChatEngine);
            const device = '0000000000000000000000000000000000000000000000000000000000000000';
            let errorData = { response: { text: '{"payload":{"channels": ["test-chat"]}}' } };
            let expected = Object.assign({}, errorData, { chats: [] });
            const completion = jest.fn();

            extension.ChatEngine.pubnub.push.removeChannels = jest.fn().mockImplementation((params, handler) => {
                handler({ error: true, errorData });
            });

            extension.addChannels(false, chats, device, completion);

            expect(completion).toHaveBeenCalledWith(expected);
        });

        test('should disable notifications for device on iOS', () => {
            const device = '0000000000000000000000000000000000000000000000000000000000000000';
            Platform.OS = 'ios';

            const expected = { device, pushGateway: 'apns' };

            extension.addChannels(false, null, device);

            expect(extension.ChatEngine.pubnub.push.deleteDevice).toHaveBeenCalledTimes(1);
            expect(extension.ChatEngine.pubnub.push.deleteDevice).toHaveBeenCalledWith(expected, expect.any(Function));
        });

        test('should disable notifications for device on Android', () => {
            const device = '0000000000000000000000000000000000000000000000000000000000000000';
            Platform.OS = 'android';

            const expected = { device, pushGateway: 'gcm' };

            extension.addChannels(false, null, device);

            expect(extension.ChatEngine.pubnub.push.deleteDevice).toHaveBeenCalledTimes(1);
            expect(extension.ChatEngine.pubnub.push.deleteDevice).toHaveBeenCalledWith(expected, expect.any(Function));
        });

        test('should unregister plugin when push notifications disable for device was successful', () => {
            const chats = listWithChats(20, extension.ChatEngine);
            chats.forEach(chat => chat.plugins.push({ namespace: 'chatEngineNotifications.chat' }));
            const device = '0000000000000000000000000000000000000000000000000000000000000000';

            extension.ChatEngine.pubnub.push.deleteDevice = jest.fn().mockImplementation((params, handler) => {
                handler({ error: false });
            });

            extension.addChannels(false, null, device);

            chats.forEach((chat) => {
                const registeredPlugin = chat.plugins.filter(plugin => plugin.namespace === 'chatEngineNotifications.chat');
                expect(registeredPlugin.length).toEqual(0);
            });
        });

        test('should call completion w/o error when push notifications disable for device was successful', () => {
            const device = '0000000000000000000000000000000000000000000000000000000000000000';
            const completion = jest.fn();

            extension.ChatEngine.pubnub.push.deleteDevice = jest.fn().mockImplementation((params, handler) => {
                handler({ error: false });
            });

            extension.addChannels(false, null, device, completion);

            expect(completion).toHaveBeenCalledWith(null);
        });

        test('should not call completion when extension is in the middle of destruction process', () => {
            const chats = listWithChats(20, extension.ChatEngine);
            const device = '0000000000000000000000000000000000000000000000000000000000000000';
            const completion = jest.fn();

            extension.ChatEngine.pubnub.push.addChannels = jest.fn().mockImplementation((params, handler) => {
                handler({ error: false });
            });

            extension.destruct();

            extension.addChannels(true, chats, device, completion);

            expect(completion).not.toHaveBeenCalled();
        });

        test('should call completion w/ error when push notifications enable did fail but channels not reported', () => {
            const chats = listWithChats(20, extension.ChatEngine);
            const device = '0000000000000000000000000000000000000000000000000000000000000000';
            let errorData = { response: { text: '{"payload":{}}' } };
            let expected = Object.assign({}, errorData, { chats: [] });
            const completion = jest.fn();

            extension.ChatEngine.pubnub.push.addChannels = jest.fn().mockImplementation((params, handler) => {
                handler({ error: true, errorData });
            });

            extension.addChannels(true, chats, device, completion);

            expect(completion).toHaveBeenCalledWith(expected);
        });

        test('should call completion w/ error when push notifications disable did fail for huge list but channels not reported', () => {
            const chats = listWithChats(400, extension.ChatEngine);
            const device = '0000000000000000000000000000000000000000000000000000000000000000';
            let errorData1 = { response: { text: '{"payload":{}}' } };
            let errorData2 = { response: { text: '{"payload":{}}' } };
            let errorData = [errorData1, errorData2];
            let expected = Object.assign({}, errorData1, { chats: [] });
            const completion = jest.fn();
            let errorRequestCount = 0;

            extension.ChatEngine.pubnub.push.removeChannels = jest.fn().mockImplementation((params, handler) => {
                handler({ error: true, errorData: errorData[errorRequestCount] });
                errorRequestCount += 1;
            });

            extension.addChannels(false, chats, device, completion);

            expect(completion).toHaveBeenCalledWith(expected);
        });


        test('should call completion w/o error when push notifications enable did fail unexpected', () => {
            const chats = listWithChats(20, extension.ChatEngine);
            const device = '0000000000000000000000000000000000000000000000000000000000000000';
            const completion = jest.fn();

            extension.ChatEngine.pubnub.push.addChannels = jest.fn().mockImplementation((params, handler) => {
                handler({ error: true });
            });

            extension.addChannels(true, chats, device, completion);

            expect(completion).toHaveBeenCalledWith(null);
        });
    });

    describe('#markNotificationAsSeen', () => {
        afterEach(() => extension.notifications.destruct());

        test('should be function', () => {
            expect(typeof extension.markNotificationAsSeen === 'function').toBeTruthy();
        });

        test('should be called when \'notifications.markNotificationAsSeen\' is used', () => {
            const notification = { notification: { aps: { alert: 'PubNub is awesome!' }, cepayload: { eid: 'unique' } }, foreground: true };
            const onSpy = jest.spyOn(extension.ChatEngine.me.direct, 'emit');
            extension.notifications.markNotificationAsSeen(notification);
            expect(onSpy).toHaveBeenCalled();
            onSpy.mockRestore();
        });

        test('should emit \'$notifications.seen\' event to user\'s direct chat', () => {
            const notification = { notification: { aps: { alert: 'PubNub is awesome!' }, cepayload: { eid: 'unique' } }, foreground: true };
            const onSpy = jest.spyOn(extension.ChatEngine.me.direct, 'emit');
            extension.markNotificationAsSeen(notification);
            expect(onSpy).toHaveBeenCalledWith('$notifications.seen', { eid: notification.notification.cepayload.eid });
            onSpy.mockRestore();
        });

        test('should emit \'$notifications.seen\' event on behalf of \'notifications\' instance', () => {
            const notification = { notification: { aps: { alert: 'PubNub is awesome!' }, cepayload: { eid: 'unique' } }, foreground: true };
            const onSpy = jest.spyOn(extension.parent.notifications, 'emit');
            extension.markNotificationAsSeen(notification);
            expect(onSpy).toHaveBeenCalledWith('$notifications.seen');
            onSpy.mockRestore();
        });

        test('should not emit \'$notifications.seen\' event if \'cepayload\' is missing', () => {
            const notification = { notification: { aps: { alert: 'PubNub is awesome!' } }, foreground: true };
            const onSpy = jest.spyOn(extension.ChatEngine.me.direct, 'emit');
            extension.markNotificationAsSeen(notification);
            expect(onSpy).not.toHaveBeenCalled();
            onSpy.mockRestore();
        });

        test('should not emit \'$notifications.seen\' event if notification not from user interaction or not in foreground', () => {
            const notification = {
                notification: {
                    aps: { alert: 'PubNub is awesome!' },
                    cepayload: { eid: 'unique' }
                },
                foreground: false,
                userInteraction: false
            };
            const onSpy = jest.spyOn(extension.ChatEngine.me.direct, 'emit');
            extension.markNotificationAsSeen(notification);
            expect(onSpy).not.toHaveBeenCalled();
            onSpy.mockRestore();
        });

        test('should not emit \'$notifications.seen\' event when \'eid\' is missing', () => {
            const notification = { notification: { aps: { alert: 'PubNub is awesome!' }, cepayload: { } }, foreground: true };
            const onSpy = jest.spyOn(extension.ChatEngine.me.direct, 'emit');
            extension.markNotificationAsSeen(notification);
            expect(onSpy).not.toHaveBeenCalled();
            onSpy.mockRestore();
        });

        test('should not emit \'$notifications.seen\' event when notification\'s \'event\' is set to \'$notifications.seen\'', () => {
            const notification = {
                notification: { aps: { alert: 'PubNub is awesome!' }, cepayload: { event: '$notifications.seen' } },
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

        test('should emit \'$notifications.seen\' event to user\'s direct chat', () => {
            const onSpy = jest.spyOn(extension.ChatEngine.me.direct, 'emit');
            extension.markAllNotificationAsSeen();
            expect(onSpy).toHaveBeenCalledWith('$notifications.seen', { eid: 'all' });
            onSpy.mockRestore();
        });

        test('should emit \'$notifications.seen\' event on behalf of \'notifications\' instance', () => {
            const onSpy = jest.spyOn(extension.parent.notifications, 'emit');
            extension.markAllNotificationAsSeen();
            expect(onSpy).toHaveBeenCalledWith('$notifications.seen');
            onSpy.mockRestore();
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
            middleware.middleware.emit['$notifications.seen']();
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

        test('should build notification for \'$notifications.seen\'', () => {
            const notification = Object.assign({}, inviteEvent);
            delete notification.data;
            const seenNotificationSpy = jest.spyOn(CENotificationFormatter, 'seenNotification').mockImplementation(() => ({}));
            const normalizedSpy = jest.spyOn(CENotificationFormatter, 'normalized').mockImplementation(() => ({}));
            const next = jest.fn();
            extension.notificationFormatter('$notifications.seen', notification, next);
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
            expected.pn_apns.cepayload.eid = next.mock.calls[0][1].pn_apns.cepayload.eid;

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
                expected.pn_apns.cepayload.eid = next.mock.calls[0][1].pn_apns.cepayload.eid;

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
                expected.pn_apns.cepayload.eid = next.mock.calls[0][1].pn_apns.cepayload.eid;

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
                expect(notificationsSpy).toHaveBeenCalledWith(
                    inviteEvent,
                    extension.configuration.platforms,
                    extension.configuration.messageKey
                );
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
                expect(notificationsSpy).toHaveBeenCalledWith(
                    inviteEvent,
                    extension.configuration.platforms,
                    extension.configuration.messageKey
                );
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

    describe('#applyDefaultConfigurationValues', () => {
        afterEach(() => extension.notifications.destruct());

        test('should be function', () => {
            expect(typeof CENotificationsExtension.applyDefaultConfigurationValues === 'function').toBeTruthy();
        });

        test('should add \'$notifications.seen\' into in \'configuration.events\' if missing', () => {
            const testedConfiguration = { events: [] };
            CENotificationsExtension.applyDefaultConfigurationValues(testedConfiguration);
            expect(testedConfiguration.events).toContain('$notifications.seen');
        });

        test('should not add \'$notifications.seen\' duplicates into in \'configuration.events\'', () => {
            const testedConfiguration = { events: ['$notifications.seen'] };
            CENotificationsExtension.applyDefaultConfigurationValues(testedConfiguration);
            CENotificationsExtension.applyDefaultConfigurationValues(testedConfiguration);
            testedConfiguration.events.pop();
            expect(testedConfiguration.events).toHaveLength(0);
        });
    });
});
