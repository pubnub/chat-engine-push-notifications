/* eslint-disable no-unused-expressions,no-new,no-new-wrappers,no-new-object,no-array-constructor */
/* global test, expect */
import { Platform } from 'react-native';
import CENotificationFormatter from '../../../src/helpers/formatter';
import { TypeValidator } from '../../../src/helpers/utils';

jest.mock('NativeModules', () => ({
    CENNotifications: {
        CATEGORY_MESSAGE: 'messageCategory',
        CATEGORY_SOCIAL: 'socialCategory'
    }
}));

/** @test {CENotificationFormatter} */
describe('unittest::CENotificationFormatter', () => {
    const inviteEventPayload = {
        chat: { channel: 'direct' },
        sender: 'PubNub',
        event: '$.invite',
        data: { channel: 'Secret-Chat' }
    };
    const messageEventPayload = {
        chat: { channel: 'Secret-Chat' },
        sender: 'PubNub',
        event: 'message',
        data: { message: 'Hello real-time-world' }
    };
    const leaveEventPayload = {
        chat: { channel: 'direct' },
        sender: 'PubNub',
        event: '$.leave',
        data: { channel: 'Secret-Chat' }
    };
    const seenEventPayload = {
        chat: { channel: 'direct' },
        sender: 'PubNub',
        event: '$notifications.seen',
        data: { eid: 'unique-id' }
    };

    describe('#category', () => {
        test('should be function', () => {
            expect(typeof CENotificationFormatter.category === 'function').toBeTruthy();
        });

        test('should return category for \'$.leave\' event', () => {
            expect(CENotificationFormatter.category('$.leave')).toEqual('com.pubnub.chat-engine.leave');
        });

        test('should return category for \'$notifications.received\' event', () => {
            expect(CENotificationFormatter.category('$notifications.received')).toEqual('com.pubnub.chat-engine.notifications.received');
        });

        test('should return category for \'message\' event', () => {
            expect(CENotificationFormatter.category('message')).toEqual('com.pubnub.chat-engine.message');
        });

        test('should not throw TypeError in non-test environment', () => {
            const originalNodeEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            expect(() => CENotificationFormatter.category(2010)).not.toThrowError();
            expect(CENotificationFormatter.category(2010)).toBeNull();

            process.env.NODE_ENV = originalNodeEnv;
        });

        test('should throw TypeError when \'event\' is not type of String', () => {
            expect(() => CENotificationFormatter.category(2010))
                .toThrowError(/Unexpected event: empty or has unexpected data type \(string expected\)/);
        });

        test('should throw TypeError when \'event\' is empty String', () => {
            expect(() => CENotificationFormatter.category(''))
                .toThrowError(/Unexpected event: empty or has unexpected data type \(string expected\)/);
        });
    });

    describe('#chatName', () => {
        test('should be function', () => {
            expect(typeof CENotificationFormatter.chatName === 'function').toBeTruthy();
        });

        test('should return name of chat from \'chat-engine#chat#private.#Test-Channel\' chat channel', () => {
            expect(CENotificationFormatter.chatName('chat-engine#chat#private.#Test-Channel')).toEqual('Test-Channel');
        });

        test('should return name of chat from \'Test-Channel\' chat channel', () => {
            expect(CENotificationFormatter.chatName('Test-Channel')).toEqual('Test-Channel');
        });

        test('should not throw TypeError in non-test environment', () => {
            const originalNodeEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            expect(() => CENotificationFormatter.chatName(2010)).not.toThrowError();
            expect(CENotificationFormatter.chatName(2010)).toBeNull();

            process.env.NODE_ENV = originalNodeEnv;
        });

        test('should throw TypeError when \'chatChannel\' is not type of String', () => {
            expect(() => CENotificationFormatter.chatName(2010))
                .toThrowError(/Unexpected chat channel name: empty or has unexpected data type \(string expected\)/);
        });

        test('should throw TypeError when \'chatChannel\' is empty String', () => {
            expect(() => CENotificationFormatter.chatName(''))
                .toThrowError(/Unexpected chat channel name: empty or has unexpected data type \(string expected\)/);
        });
    });

    describe('#notifications', () => {
        test('should be function', () => {
            expect(typeof CENotificationFormatter.notifications === 'function').toBeTruthy();
        });

        // At this moment default formatting provided only for: $.invite and message events.
        test('should not create notification if event is \'$.leave\'', () => {
            const notification = CENotificationFormatter.notifications(leaveEventPayload, { ios: true, android: true });
            expect(TypeValidator.isEmpty(notification)).toBeTruthy();
        });

        test('should create invite notification for iOS', () => {
            const notification = CENotificationFormatter.notifications(inviteEventPayload, { ios: true, android: false });
            expect(notification.apns.aps).toBeDefined();
            expect(notification.apns.aps.alert.title).toBeDefined();
            expect(notification.apns.aps.alert.body).toBeDefined();
        });

        test('should create invite notification for Android', () => {
            const expectedActions = ['Accept', 'Ignore'];
            const notification = CENotificationFormatter.notifications(inviteEventPayload, { ios: false, android: true });
            expect(notification.gcm.data).toBeDefined();
            expect(notification.gcm.data.contentTitle).toBeDefined();
            expect(notification.gcm.data.contentText).toBeDefined();
            expect(notification.gcm.data.actions).toEqual(expectedActions);
        });

        test('should create message received notification for iOS', () => {
            const notification = CENotificationFormatter.notifications(messageEventPayload, { ios: true, android: false });
            expect(notification.apns.aps).toBeDefined();
            expect(notification.apns.aps.alert.title).toBeDefined();
            expect(notification.apns.aps.alert.body).toBeDefined();
        });

        test('should create message received notification for Android', () => {
            const notification = CENotificationFormatter.notifications(messageEventPayload, { ios: false, android: true });
            expect(notification.gcm.data).toBeDefined();
            expect(notification.gcm.data.contentTitle).toBeDefined();
            expect(notification.gcm.data.contentText).toBeDefined();
            expect(notification.gcm.data.actions).not.toBeDefined();
        });

        test('should not throw if malformed payload provided in non-test environment', () => {
            const originalNodeEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            expect(() => CENotificationFormatter.notifications({})).not.toThrowError();
            expect(CENotificationFormatter.notifications({})).toEqual({});

            process.env.NODE_ENV = originalNodeEnv;
        });

        test('should throw TypeError when \'payload\' is \'undefined\'', () => {
            expect(() => CENotificationFormatter.notifications(undefined))
                .toThrowError(/Unexpected payload: not defined or has unexpected type \(Object expected\)/);
        });

        test('should not throw if malformed chat object has been provided in non-test environment', () => {
            const payload = Object.assign({}, messageEventPayload, { chat: 2010 });
            const originalNodeEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            expect(() => CENotificationFormatter.notifications(payload)).not.toThrowError();
            expect(CENotificationFormatter.notifications(payload)).toEqual({});

            process.env.NODE_ENV = originalNodeEnv;
        });

        test('should throw TypeError when \'payload.chat\' is not type of Chat', () => {
            const payload = Object.assign({}, messageEventPayload, { chat: 2010 });
            expect(() => CENotificationFormatter.notifications(payload))
                .toThrowError(/Unexpected chat channel name: empty or has unexpected data type \(string expected\)/);
        });

        test('should not throw if malformed invitation chat name has been provided in non-test environment', () => {
            const payload = Object.assign({}, inviteEventPayload, { data: { channel: 2010 } });
            const originalNodeEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            expect(() => CENotificationFormatter.notifications(payload)).not.toThrowError();
            expect(CENotificationFormatter.notifications(payload)).toEqual({});

            process.env.NODE_ENV = originalNodeEnv;
        });

        test('should throw TypeError when \'payload.data.channel\' is not type of String', () => {
            const payload = Object.assign({}, inviteEventPayload, { data: { channel: 2010 } });
            expect(() => CENotificationFormatter.notifications(payload))
                .toThrowError(/Unexpected chat channel name: empty or has unexpected data type \(string expected\)/);
        });
    });

    describe('#seenNotification', () => {
        test('should be function', () => {
            expect(typeof CENotificationFormatter.seenNotification === 'function').toBeTruthy();
        });

        test('should create notification for \'seen\' event on iOS platform', () => {
            const notificationPayload = CENotificationFormatter.seenNotification(seenEventPayload, { ios: true, android: false });
            expect(TypeValidator.notEmpty(notificationPayload)).toBeTruthy();
            expect(notificationPayload.apns.aps['content-available']).toBeDefined();
            expect(notificationPayload.apns.cepayload).toBeDefined();
            expect(notificationPayload.apns.cepayload.data).toBeDefined();
            expect(notificationPayload.apns.cepayload.data.eid).toBeDefined();
            expect(notificationPayload.gcm).not.toBeDefined();
        });

        test('should create notification for \'seen\' event on Android platform', () => {
            const notificationPayload = CENotificationFormatter.seenNotification(seenEventPayload, { ios: false, android: true });
            expect(TypeValidator.notEmpty(notificationPayload)).toBeTruthy();
            expect(notificationPayload.gcm.data.cepayload).toBeDefined();
            expect(notificationPayload.gcm.data.cepayload.data).toBeDefined();
            expect(notificationPayload.gcm.data.cepayload.data.eid).toBeDefined();
            expect(notificationPayload.apns).not.toBeDefined();
        });

        test('should not throw if malformed payload provided in non-test environment', () => {
            const originalNodeEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            expect(() => CENotificationFormatter.seenNotification({})).not.toThrowError();
            expect(CENotificationFormatter.seenNotification({})).toEqual({});

            process.env.NODE_ENV = originalNodeEnv;
        });

        test('should throw TypeError when \'payload\' is \'undefined\'', () => {
            expect(() => CENotificationFormatter.seenNotification(undefined))
                .toThrowError(/Unexpected payload: not defined or has unexpected type \(Object expected\)/);
        });

        test('should not throw if EID is \'undefined\' in non-test environment', () => {
            const payload = Object.assign({}, seenEventPayload, { data: { } });
            const originalNodeEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            expect(() => CENotificationFormatter.seenNotification(payload)).not.toThrowError();
            expect(CENotificationFormatter.seenNotification(payload)).toEqual({});

            process.env.NODE_ENV = originalNodeEnv;
        });

        test('should throw TypeError when \'payload.data.eid\' is \'undefined\'', () => {
            const payload = Object.assign({}, seenEventPayload, { data: { } });
            expect(() => CENotificationFormatter.seenNotification(payload))
                .toThrowError(/Unexpected EID: empty or has unexpected type \(string expected\)/);
        });

        test('should throw TypeError when \'payload.data.eid\' is not type of String', () => {
            const payload = Object.assign({}, seenEventPayload, { data: { eid: 2010 } });
            expect(() => CENotificationFormatter.seenNotification(payload))
                .toThrowError(/Unexpected EID: empty or has unexpected type \(string expected\)/);
        });

        test('should throw TypeError when \'payload.data.eid\' is empty String', () => {
            const payload = Object.assign({}, seenEventPayload, { data: { eid: '' } });
            expect(() => CENotificationFormatter.seenNotification(payload))
                .toThrowError(/Unexpected EID: empty or has unexpected type \(string expected\)/);
        });
    });

    describe('#normalized', () => {
        test('should be function', () => {
            expect(typeof CENotificationFormatter.normalized === 'function').toBeTruthy();
        });

        test('should not change notification payload with unknown keys', () => {
            const notification = { key: { notification: 'test' } };
            const expected = Object.assign({}, leaveEventPayload, notification);
            expect(CENotificationFormatter.normalized(leaveEventPayload, notification)).toEqual(expected);
        });

        test('should not change passed \'cepayload\' content for iOS', () => {
            const originalPlatform = Platform.OS;
            Platform.OS = 'ios';
            const notification = { apns: { aps: { }, cepayload: { some: 'fun', data: { eid: 'cool' } } } };
            const expected = { apns: { aps: { }, cepayload: { some: 'fun', data: { eid: 'cool' } } } };
            CENotificationFormatter.normalized(leaveEventPayload, notification);

            expect(notification.apns.cepayload).toBeDefined();
            expect(notification.apns.cepayload).toEqual(expected.apns.cepayload);

            Platform.OS = originalPlatform;
        });

        test('should use category from \'aps.category\' and not built from event for iOS', () => {
            const originalPlatform = Platform.OS;
            Platform.OS = 'ios';
            const notification = { apns: { aps: { category: 'fun.category' }, cepayload: { some: 'fun', data: { eid: 'cool' } } } };
            const normalizedNotification = CENotificationFormatter.normalized(leaveEventPayload, notification);

            expect(normalizedNotification.pn_apns.aps.category).toEqual(notification.apns.aps.category);
            expect(normalizedNotification.pn_apns.cepayload.category).toEqual(notification.apns.aps.category);

            Platform.OS = originalPlatform;
        });

        test('should use category from \'cepayload.category\' and not built from event for iOS', () => {
            const originalPlatform = Platform.OS;
            Platform.OS = 'ios';
            const notification = { apns: { aps: { }, cepayload: { category: 'fun.category', some: 'fun', data: { eid: 'cool' } } } };
            const normalizedNotification = CENotificationFormatter.normalized(leaveEventPayload, notification);

            expect(normalizedNotification.pn_apns.aps.category).toEqual(notification.apns.cepayload.category);
            expect(normalizedNotification.pn_apns.cepayload.category).toEqual(notification.apns.cepayload.category);

            Platform.OS = originalPlatform;
        });

        test('should not change passed \'cepayload\' content for Android', () => {
            const originalPlatform = Platform.OS;
            Platform.OS = 'android';
            const notification = { gcm: { data: { cepayload: { some: 'fun' } } } };
            const expected = { gcm: { data: { cepayload: { some: 'fun' } } } };
            CENotificationFormatter.normalized(leaveEventPayload, notification);

            expect(notification.gcm.data).toBeDefined();
            expect(notification.gcm.data).toEqual(expected.gcm.data);

            Platform.OS = originalPlatform;
        });

        test('should use category from \'data.category\' and not built from event for Android', () => {
            const originalPlatform = Platform.OS;
            Platform.OS = 'android';
            const notification = { gcm: { data: { category: 'fun.category', cepayload: { some: 'fun', data: { eid: 'cool' } } } } };
            const normalizedNotification = CENotificationFormatter.normalized(leaveEventPayload, notification);

            expect(normalizedNotification.pn_gcm.data.category).toEqual(notification.gcm.data.category);
            expect(normalizedNotification.pn_gcm.data.cepayload.category).toEqual(notification.gcm.data.category);

            Platform.OS = originalPlatform;
        });

        test('should not add category from \'cepayload.category\' to \'data\' objet root for Android', () => {
            const originalPlatform = Platform.OS;
            Platform.OS = 'android';
            const notification = { gcm: { data: { cepayload: { category: 'fun.category', some: 'fun', data: { eid: 'cool' } } } } };
            const normalizedNotification = CENotificationFormatter.normalized(leaveEventPayload, notification);

            expect(normalizedNotification.pn_gcm.data.category).not.toBeDefined();
            expect(normalizedNotification.pn_gcm.data.cepayload.category).toEqual(notification.gcm.data.cepayload.category);

            Platform.OS = originalPlatform;
        });

        test('should move \'apns\' content under \'pn_apns\' key', () => {
            const notification = { apns: { aps: { alert: 'Notification' } } };
            const normalized = CENotificationFormatter.normalized(leaveEventPayload, Object.assign({}, notification));
            expect(normalized.apns).not.toBeDefined();
            expect(normalized.pn_apns).toBeDefined();
        });

        test('should move \'gcm\' content under \'pn_gcm\' key', () => {
            const notification = { gcm: { notification: { title: 'Notification' }, data: {} } };
            const normalized = CENotificationFormatter.normalized(leaveEventPayload, Object.assign({}, notification));
            expect(normalized.gcm).not.toBeDefined();
            expect(normalized.pn_gcm).toBeDefined();
        });

        test('should add notification category for \'apns\'', () => {
            const notification = { apns: { aps: { alert: 'Notification' } } };
            const expected = CENotificationFormatter.category(leaveEventPayload.event);
            const normalized = CENotificationFormatter.normalized(leaveEventPayload, Object.assign({}, notification));
            expect(normalized.pn_apns.aps.category).toBeDefined();
            expect(normalized.pn_apns.aps.category).toEqual(expected);
        });

        test('should add notification String identifier for \'apns\'', () => {
            const notification = { apns: { aps: { alert: 'Notification' } } };
            const normalized = CENotificationFormatter.normalized(leaveEventPayload, Object.assign({}, notification));
            expect(TypeValidator.isTypeOf(normalized.pn_apns.cepayload, Object)).toBeTruthy();
            expect(TypeValidator.isTypeOf(normalized.pn_apns.cepayload.eid, String)).toBeTruthy();
            expect(TypeValidator.notEmpty(normalized.pn_apns.cepayload.eid)).toBeTruthy();
        });

        test('should add notification String identifier for \'gcm\'', () => {
            const notification = { gcm: { notification: { title: 'Notification' } } };
            const normalized = CENotificationFormatter.normalized(leaveEventPayload, Object.assign({}, notification));
            expect(TypeValidator.isTypeOf(normalized.pn_gcm.data.cepayload, Object)).toBeTruthy();
            expect(TypeValidator.isTypeOf(normalized.pn_gcm.data.cepayload.eid, String)).toBeTruthy();
            expect(TypeValidator.notEmpty(normalized.pn_gcm.data.cepayload.eid)).toBeTruthy();
        });

        test('should not throw if malformed payload provided in non-test environment', () => {
            const notification = { apns: { aps: { alert: 'Notification' } } };
            const eventPayload = { PubNub: 'awesome!' };
            const originalNodeEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            expect(() => CENotificationFormatter.normalized(eventPayload, Object.assign({}, notification))).not.toThrowError();
            expect(CENotificationFormatter.normalized(eventPayload, Object.assign({}, notification))).toEqual(eventPayload);

            process.env.NODE_ENV = originalNodeEnv;
        });

        test('should throw TypeError when \'eventPayload\' is \'undefined\'', () => {
            const notification = { apns: { aps: { alert: 'Notification' } } };

            expect(() => CENotificationFormatter.normalized(undefined, Object.assign({}, notification)))
                .toThrowError(/Unexpected payload: not defined or has unexpected type \(Object expected\)/);
        });
    });

    describe('#verifyChatEnginePayload', () => {
        let eventPayload;
        beforeEach(() => {
            eventPayload = Object.assign({}, leaveEventPayload);
        });

        test('should be function', () => {
            expect(typeof CENotificationFormatter.verifyChatEnginePayload === 'function').toBeTruthy();
        });

        test('should return \'true\' for valid ChatEngine event payload', () => {
            expect(CENotificationFormatter.verifyChatEnginePayload(eventPayload)).toBeTruthy();
        });

        test('should not throw \'payload\' is \'undefined\' in non-test environment', () => {
            const originalNodeEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            expect(() => CENotificationFormatter.verifyChatEnginePayload(undefined)).not.toThrowError();
            expect(CENotificationFormatter.verifyChatEnginePayload(undefined)).toBeFalsy();

            process.env.NODE_ENV = originalNodeEnv;
        });

        test('should throw TypeError when \'payload\' is \'undefined\'', () => {
            expect(() => CENotificationFormatter.verifyChatEnginePayload(undefined))
                .toThrowError(/Unexpected payload: not defined or has unexpected type \(Object expected\)/);
        });

        test('should not throw when \'payload\' doesn\'t have \'chat\' in it in non-test environment', () => {
            const originalNodeEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';
            delete eventPayload.chat;

            expect(() => CENotificationFormatter.verifyChatEnginePayload(eventPayload)).not.toThrowError();
            expect(CENotificationFormatter.verifyChatEnginePayload(eventPayload)).toBeFalsy();

            process.env.NODE_ENV = originalNodeEnv;
        });

        test('should throw TypeError when \'payload\' doesn\'t have \'chat\' in it', () => {
            delete eventPayload.chat;
            expect(() => CENotificationFormatter.verifyChatEnginePayload(eventPayload))
                .toThrowError(/Unexpected chat: not defined or has unexpected type \(Chat instance expected\)/);
        });

        test('should not throw TypeError when \'payload.chat\' is type of String in non-test environment', () => {
            const originalNodeEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';
            eventPayload.chat = 'Private-Chat';

            expect(() => CENotificationFormatter.verifyChatEnginePayload(eventPayload)).not.toThrowError();
            expect(CENotificationFormatter.verifyChatEnginePayload(eventPayload)).toBeFalsy();

            process.env.NODE_ENV = originalNodeEnv;
        });

        test('should throw TypeError when \'payload.chat\' is type of String', () => {
            eventPayload.chat = 'Private-Chat';
            expect(() => CENotificationFormatter.verifyChatEnginePayload(eventPayload))
                .toThrowError(/Unexpected chat: not defined or has unexpected type \(Chat instance expected\)/);
        });

        test('should not throw when \'payload\' doesn\'t have \'event\' in it in non-test environment', () => {
            const originalNodeEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';
            delete eventPayload.event;

            expect(() => CENotificationFormatter.verifyChatEnginePayload(eventPayload)).not.toThrowError();
            expect(CENotificationFormatter.verifyChatEnginePayload(eventPayload)).toBeFalsy();

            process.env.NODE_ENV = originalNodeEnv;
        });

        test('should throw TypeError when \'payload\' doesn\'t have \'event\' in it', () => {
            delete eventPayload.event;
            expect(() => CENotificationFormatter.verifyChatEnginePayload(eventPayload))
                .toThrowError(/Unexpected event: empty or has unexpected type \(string expected\)/);
        });

        test('should not throw when \'payload.event\' is empty String', () => {
            const originalNodeEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';
            eventPayload.event = '';

            expect(() => CENotificationFormatter.verifyChatEnginePayload(eventPayload)).not.toThrowError();
            expect(CENotificationFormatter.verifyChatEnginePayload(eventPayload)).toBeFalsy();

            process.env.NODE_ENV = originalNodeEnv;
        });

        test('should throw TypeError when \'payload.event\' is empty String', () => {
            eventPayload.event = '';
            expect(() => CENotificationFormatter.verifyChatEnginePayload(eventPayload))
                .toThrowError(/Unexpected event: empty or has unexpected type \(string expected\)/);
        });

        test('should throw TypeError when \'payload.event\' is type of Number', () => {
            eventPayload.event = 2010;
            expect(() => CENotificationFormatter.verifyChatEnginePayload(eventPayload))
                .toThrowError(/Unexpected event: empty or has unexpected type \(string expected\)/);
        });

        test('should not throw when \'payload\' doesn\'t have \'sender\' in it in non-test environment', () => {
            const originalNodeEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';
            delete eventPayload.sender;

            expect(() => CENotificationFormatter.verifyChatEnginePayload(eventPayload)).not.toThrowError();
            expect(CENotificationFormatter.verifyChatEnginePayload(eventPayload)).toBeFalsy();

            process.env.NODE_ENV = originalNodeEnv;
        });

        test('should throw TypeError when \'payload\' doesn\'t have \'sender\' in it', () => {
            delete eventPayload.sender;
            expect(() => CENotificationFormatter.verifyChatEnginePayload(eventPayload))
                .toThrowError(/Unexpected sender: empty or has unexpected type \(string expected\)/);
        });

        test('should throw TypeError when \'payload.sender\' is empty String', () => {
            eventPayload.sender = '';
            expect(() => CENotificationFormatter.verifyChatEnginePayload(eventPayload))
                .toThrowError(/Unexpected sender: empty or has unexpected type \(string expected\)/);
        });

        test('should throw TypeError when \'payload.sender\' is type of Number', () => {
            eventPayload.sender = 2010;
            expect(() => CENotificationFormatter.verifyChatEnginePayload(eventPayload))
                .toThrowError(/Unexpected sender: empty or has unexpected type \(string expected\)/);
        });

        test('should not throw when \'payload\' doesn\'t have \'data\' in it in non-test environment', () => {
            const originalNodeEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';
            delete eventPayload.data;

            expect(() => CENotificationFormatter.verifyChatEnginePayload(eventPayload)).not.toThrowError();
            expect(CENotificationFormatter.verifyChatEnginePayload(eventPayload)).toBeFalsy();

            process.env.NODE_ENV = originalNodeEnv;
        });

        test('should throw TypeError when \'payload\' doesn\'t have \'data\' in it', () => {
            delete eventPayload.data;
            expect(() => CENotificationFormatter.verifyChatEnginePayload(eventPayload))
                .toThrowError(/Unexpected data: empty or has unexpected type \(object expected\)/);
        });

        test('should throw TypeError when \'payload.data\' is type of String', () => {
            eventPayload.data = 2010;
            expect(() => CENotificationFormatter.verifyChatEnginePayload(eventPayload))
                .toThrowError(/Unexpected data: empty or has unexpected type \(object expected\)/);
        });
    });
});
