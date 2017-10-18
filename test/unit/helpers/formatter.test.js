/* eslint-disable no-unused-expressions,no-new,no-new-wrappers,no-new-object,no-array-constructor */
/* global test, expect */
import { Platform } from 'react-native';
import CENotificationFormatter from '../../../src/helpers/formatter';
import TypeValidator from '../../../src/helpers/utils';


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
        data: { channel: 'Hello real-time-world' }
    };
    const leaveEventPayload = {
        chat: { channel: 'direct' },
        sender: 'PubNub',
        event: '$.leave',
        data: {}
    };
    const seenEventPayload = {
        chat: { channel: 'direct' },
        sender: 'PubNub',
        event: '$.notifications.seen',
        data: { ceid: 'unique-id' }
    };

    describe('#category', () => {
        test('should be function', () => {
            expect(typeof CENotificationFormatter.category === 'function').toBeTruthy();
        });

        test('should return category for \'$.leave\' event', () => {
            expect(CENotificationFormatter.category('$.leave')).toEqual('com.pubnub.chat-engine.leave');
        });

        test('should return category for \'message\' event', () => {
            expect(CENotificationFormatter.category('message')).toEqual('com.pubnub.chat-engine.message');
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
            expect(TypeValidator.isEmpty(notification.apns.cepayload)).toBeDefined();
            expect(TypeValidator.isEmpty(notification.apns.cepayload.channel)).toBeDefined();
        });

        test('should create invite notification for Android', () => {
            const notification = CENotificationFormatter.notifications(inviteEventPayload, { ios: false, android: true });
            expect(TypeValidator.isEmpty(notification.gcm.data)).toBeDefined();
            expect(TypeValidator.isEmpty(notification.gcm.data.channel)).toBeDefined();
        });

        test('should create invite notification for both iOS and Android', () => {
            const notification = CENotificationFormatter.notifications(inviteEventPayload, { ios: true, android: true });
            expect(TypeValidator.isEmpty(notification.apns)).toBeDefined();
            expect(TypeValidator.isEmpty(notification.gcm)).toBeDefined();
            expect(TypeValidator.isEmpty(notification.gcm.data.cepayload)).toBeDefined();
        });

        test('should create message received notification for iOS', () => {
            const notification = CENotificationFormatter.notifications(messageEventPayload, { ios: true, android: false });
            expect(TypeValidator.isEmpty(notification.apns.cepayload)).toBeDefined();
            expect(TypeValidator.isEmpty(notification.apns.cepayload.message)).toBeDefined();
        });

        test('should create message received notification for Android', () => {
            const notification = CENotificationFormatter.notifications(messageEventPayload, { ios: false, android: true });
            expect(TypeValidator.isEmpty(notification.gcm.data)).toBeDefined();
            expect(TypeValidator.isEmpty(notification.gcm.data.message)).toBeDefined();
        });

        test('should create message received notification for both iOS and Android', () => {
            const notification = CENotificationFormatter.notifications(messageEventPayload, { ios: true, android: true });
            expect(TypeValidator.isEmpty(notification.apns)).toBeDefined();
            expect(TypeValidator.isEmpty(notification.gcm)).toBeDefined();
            expect(TypeValidator.isEmpty(notification.gcm.data.cepayload)).toBeDefined();
        });
    });

    describe('#seenNotification', () => {
        test('should be function', () => {
            expect(typeof CENotificationFormatter.seenNotification === 'function').toBeTruthy();
        });

        test('should create notification for \'seen\' event on iOS platform', () => {
            const originalPlatform = Platform.OS;
            Platform.OS = 'ios';
            const notificationPayload = CENotificationFormatter.seenNotification(messageEventPayload);
            Platform.OS = originalPlatform;
            expect(TypeValidator.notEmpty(notificationPayload)).toBeTruthy();
            expect(notificationPayload.apns.aps['content-available']).toBeDefined();
        });

        test('should not create notification for \'seen\' event on Android platform', () => {
            const originalPlatform = Platform.OS;
            Platform.OS = 'android';
            const notificationPayload = CENotificationFormatter.seenNotification(messageEventPayload);
            Platform.OS = originalPlatform;
            expect(TypeValidator.isEmpty(notificationPayload)).toBeTruthy();
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

        test('should move \'apns\' content under \'pn_apns\' key', () => {
            const notification = { apns: { aps: { alert: 'Notification' } } };
            const normalized = CENotificationFormatter.normalized(leaveEventPayload, Object.assign({}, notification));
            expect(normalized.apns).not.toBeDefined();
            expect(normalized.pn_apns).toBeDefined();
            expect(normalized.pn_apns).toEqual(notification.apns);
        });

        test('should move \'gcm\' content under \'pn_gcm\' key', () => {
            const notification = { gcm: { notification: { title: 'Notification' }, data: {} } };
            const normalized = CENotificationFormatter.normalized(leaveEventPayload, Object.assign({}, notification));
            expect(normalized.gcm).not.toBeDefined();
            expect(normalized.pn_gcm).toBeDefined();
            expect(normalized.pn_gcm).toEqual(notification.gcm);
        });

        test('should add notification category for \'apns\'', () => {
            const notification = { apns: { aps: { alert: 'Notification' } } };
            const expected = CENotificationFormatter.category(leaveEventPayload.event);
            const normalized = CENotificationFormatter.normalized(leaveEventPayload, Object.assign({}, notification));
            expect(normalized.pn_apns.aps.category).toBeDefined();
            expect(normalized.pn_apns.aps.category).toEqual(expected);
        });

        test('should not add notification category into \'apns\' for \'$.notifications.seen\' event', () => {
            const notification = { apns: { aps: { alert: 'Notification' } } };
            const normalized = CENotificationFormatter.normalized(seenEventPayload, Object.assign({}, notification));
            expect(normalized.pn_apns.aps.category).not.toBeDefined();
        });

        test('should add notification String identifier for \'apns\'', () => {
            const notification = { apns: { aps: { alert: 'Notification' } } };
            const normalized = CENotificationFormatter.normalized(leaveEventPayload, Object.assign({}, notification));
            expect(TypeValidator.isTypeOf(normalized.pn_apns.ceid, String) && TypeValidator.notEmpty(normalized.pn_apns.ceid)).toBeTruthy();
        });

        test('should add notification String identifier for \'gcm\'', () => {
            const notification = { gcm: { notification: { title: 'Notification' } } };
            const normalized = CENotificationFormatter.normalized(leaveEventPayload, Object.assign({}, notification));
            expect(TypeValidator.isTypeOf(normalized.pn_gcm.data.ceid, String) && TypeValidator.notEmpty(normalized.pn_gcm.data.ceid)).toBeTruthy();
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

        test('should throw TypeError when \'payload\' doesn\'t have \'chat\' in it', () => {
            delete eventPayload.chat;
            expect(() => CENotificationFormatter.verifyChatEnginePayload(eventPayload))
                .toThrowError(/Unexpected chat: not defined or has unexpected type \(Chat instance expected\)/);
        });

        test('should throw TypeError when \'payload.chat\' is type of String', () => {
            eventPayload.chat = 'Private-Chat';
            expect(() => CENotificationFormatter.verifyChatEnginePayload(eventPayload))
                .toThrowError(/Unexpected chat: not defined or has unexpected type \(Chat instance expected\)/);
        });

        test('should throw TypeError when \'payload\' doesn\'t have \'event\' in it', () => {
            delete eventPayload.event;
            expect(() => CENotificationFormatter.verifyChatEnginePayload(eventPayload))
                .toThrowError(/Unexpected event: empty or has unexpected type \(string expected\)/);
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
