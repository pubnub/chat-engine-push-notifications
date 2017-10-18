/* eslint-disable no-unused-expressions,no-new,no-new-wrappers,no-new-object,no-array-constructor */
/* global test, expect */
import { DeviceEventEmitter, NativeModules, Platform } from 'react-native';
import { EventEmitter2 } from 'eventemitter2';
import CENInvitationNotificationCategory from '../../../src/models/invitation-notification-category';
import CENotifications from '../../../src/components/notifications';
import TypeValidator from '../../../src/helpers/utils';


jest.mock('NativeModules', () => ({
    CENNotifications: {}
}));

/** @test {CENotifications} */
describe('unittest::CENotifications', () => {
    describe('USER_INPUT', () => {
        test('should be getter', () => {
            expect(CENotifications.USER_INPUT).toBeDefined();
        });

        test('should be string', () => {
            expect(TypeValidator.isTypeOf(CENotifications.USER_INPUT, String)).toBeTruthy();
        });

        test('should be not empty string', () => {
            expect(CENotifications.USER_INPUT.length).toBeGreaterThan(0);
        });
    });

    describe('#constructor', () => {
        NativeModules.CENNotifications.receiveMissedEvents = jest.fn();

        afterEach(() => NativeModules.CENNotifications.receiveMissedEvents.mockReset());

        test('should be instance of EventEmitter2', () => {
            expect(TypeValidator.isTypeOf(new CENotifications(), EventEmitter2)).toBeTruthy();
        });

        test('should initialize with default values', () => {
            const notifications = new CENotifications();
            expect(notifications.destructing).toBeFalsy();
            expect(notifications.senderID).toBeNull();
        });

        test('should request missed events', () => {
            new CENotifications();
            expect(NativeModules.CENNotifications.receiveMissedEvents).toHaveBeenCalled();
        });

        test('should subscribe on native module notifications', () => {
            const addListenerSpy = jest.spyOn(DeviceEventEmitter, 'addListener');
            new CENotifications();
            expect(addListenerSpy).toHaveBeenCalled();
            addListenerSpy.mockRestore();
        });

        test('should throw TypeError when \'senderID\' is not type of String in Android environment', () => {
            const originalPlatform = Platform.OS;
            Platform.OS = 'android';
            expect(() => new CENotifications(2010)).toThrowError(/Unexpected sender ID: empty or has unexpected data type \(string expected\)/);
            Platform.OS = originalPlatform;
        });

        test('should throw TypeError when \'senderID\' is empty String in Android environment', () => {
            const originalPlatform = Platform.OS;
            Platform.OS = 'android';
            expect(() => new CENotifications('')).toThrowError(/Unexpected sender ID: empty or has unexpected data type \(string expected\)/);
            Platform.OS = originalPlatform;
        });

        test('should throw TypeError when \'senderID\' is undefined in Android environment', () => {
            const originalPlatform = Platform.OS;
            Platform.OS = 'android';
            expect(() => new CENotifications(undefined)).toThrowError(/Unexpected sender ID: empty or has unexpected data type \(string expected\)/);
            Platform.OS = originalPlatform;
        });

        test('should throw TypeError when \'senderID\' is undefined in Android environment', () => {
            const originalPlatform = Platform.OS;
            Platform.OS = 'android';
            expect(() => new CENotifications(null)).toThrowError(/Unexpected sender ID: empty or has unexpected data type \(string expected\)/);
            Platform.OS = originalPlatform;
        });
    });

    describe('#destruct', () => {
        let notifications = null;
        beforeEach(() => {
            notifications = new CENotifications();
        });

        test('should be function', () => {
            expect(typeof notifications.destruct === 'function').toBeTruthy();
        });

        test('should set destruct property to \'true\'', () => {
            notifications.destruct();
            expect(notifications.destructing).toBeTruthy();
        });

        test('should ignore events from native module', () => {
            notifications.destruct();
            const onRegisterSpy = jest.spyOn(notifications, 'onRegister');
            DeviceEventEmitter.emit('CENRegistered', { deviceToken: '00000000000000000000000000000000' });
            expect(onRegisterSpy).not.toHaveBeenCalled();
            onRegisterSpy.mockRestore();
        });
    });

    describe('#applicationIconBadgeNumber', () => {
        NativeModules.CENNotifications.applicationIconBadgeNumber = jest.fn(callback => callback(2010));
        let notifications = null;
        beforeEach(() => {
            NativeModules.CENNotifications.applicationIconBadgeNumber.mockReset();
            notifications = new CENotifications();
        });

        test('should be function', () => {
            expect(typeof notifications.applicationIconBadgeNumber === 'function').toBeTruthy();
        });

        test('should call method on native module side', () => {
            const callback = number => expect(number).toBe(2010);
            notifications.applicationIconBadgeNumber(callback);
            expect(NativeModules.CENNotifications.applicationIconBadgeNumber).toHaveBeenCalledWith(callback);
        });

        test('should throw TypeError when \'callback\' is not type of function', () => {
            expect(() => notifications.applicationIconBadgeNumber(2010))
                .toThrowError(/Unexpected callback: undefined or has unexpected data type \(function expected\)/);
        });

        test('should throw TypeError when \'callback\' is undefined', () => {
            expect(() => notifications.applicationIconBadgeNumber(undefined))
                .toThrowError(/Unexpected callback: undefined or has unexpected data type \(function expected\)/);
        });

        test('should throw TypeError when \'callback\' is null', () => {
            expect(() => notifications.applicationIconBadgeNumber(null))
                .toThrowError(/Unexpected callback: undefined or has unexpected data type \(function expected\)/);
        });
    });

    describe('#setApplicationIconBadgeNumber', () => {
        NativeModules.CENNotifications.setApplicationIconBadgeNumber = jest.fn();
        let notifications = null;
        beforeEach(() => {
            NativeModules.CENNotifications.setApplicationIconBadgeNumber.mockReset();
            notifications = new CENotifications();
        });

        test('should be function', () => {
            expect(typeof notifications.setApplicationIconBadgeNumber === 'function').toBeTruthy();
        });

        test('should call method on native module side', () => {
            notifications.setApplicationIconBadgeNumber(2010);
            expect(NativeModules.CENNotifications.setApplicationIconBadgeNumber).toHaveBeenCalledWith(2010);
        });

        test('should throw TypeError when \'number\' is not type of Number', () => {
            expect(() => notifications.setApplicationIconBadgeNumber(''))
                .toThrowError(/Unexpected icon badge number: undefined or has unexpected data type \(number expected\)/);
        });

        test('should throw TypeError when \'number\' is undefined', () => {
            expect(() => notifications.setApplicationIconBadgeNumber(undefined))
                .toThrowError(/Unexpected icon badge number: undefined or has unexpected data type \(number expected\)/);
        });

        test('should throw TypeError when \'number\' is null', () => {
            expect(() => notifications.setApplicationIconBadgeNumber(null))
                .toThrowError(/Unexpected icon badge number: undefined or has unexpected data type \(number expected\)/);
        });
    });

    describe('#requestPermissions', () => {
        let notifications = null;
        beforeEach(() => {
            NativeModules.CENNotifications.requestPermissions = jest.fn();
            notifications = new CENotifications('senderID');
        });

        test('should be function', () => {
            expect(typeof notifications.requestPermissions === 'function').toBeTruthy();
        });

        test('should request permissions in iOS environment', () => {
            const permissions = { alert: true, sound: false, badge: true };
            const categories = [new CENInvitationNotificationCategory()];
            notifications.requestPermissions(permissions, categories);
            expect(NativeModules.CENNotifications.requestPermissions).toHaveBeenCalledWith(permissions, [categories[0].payload()]);
        });

        test('should request permissions in Android environment', () => {
            const permissions = { alert: true, sound: false, badge: true };
            const originalPlatform = Platform.OS;
            Platform.OS = 'android';
            notifications.requestPermissions(permissions);
            expect(NativeModules.CENNotifications.requestPermissions).toHaveBeenCalledWith(notifications.senderID);
            Platform.OS = originalPlatform;
        });

        test('should throw TypeError when \'permissions\' is not type of Object', () => notifications.requestPermissions('')
            .then(() => expect(false).toBeTruthy())
            .catch(exception => expect(exception.message).toMatch(/Unexpected permissions: empty or has unexpected data type \(object expected\)/)));

        test('should throw TypeError when \'permissions\' is Object with unknown keys', () => notifications.requestPermissions({ PubNub: 'is cool!' })
            .then(() => expect(false).toBeTruthy())
            .catch(exception => expect(exception.message).toMatch(/Unexpected permissions: empty or has unexpected data type \(object expected\)/)));

        test('should throw TypeError when \'permissions\' is Object with non Boolean value', () =>
            notifications.requestPermissions({ alert: 'PubNub' })
                .then(() => expect(false).toBeTruthy())
                .catch(exception =>
                    expect(exception.message).toMatch(/Unexpected permissions: empty or has unexpected data type \(object expected\)/)));

        test('should throw TypeError when \'categories\' is not type of Array', () =>
            notifications.requestPermissions({ alert: true }, 'PubNub')
                .then(() => expect(false).toBeTruthy())
                .catch(exception =>
                    expect(exception.message).toMatch(/Unexpected values type \(array expected\)/)));

        test('should throw TypeError when any entry of \'categories\' has unexpected data type', () =>
            notifications.requestPermissions({ alert: true }, ['PubNub'])
                .then(() => expect(false).toBeTruthy())
                .catch(exception =>
                    expect(exception.message).toMatch(/Unexpected categories: unexpected categories entry data type/)));

        test('should throw forward thrown Error', () => {
            NativeModules.CENNotifications.requestPermissions = jest.fn(() => { throw new Error('Test Error'); });
            return notifications.requestPermissions({ alert: true })
                .then(() => expect(false).toBeTruthy())
                .catch(exception => expect(exception.message).toMatch(/Test Error/));
        });
    });

    describe('#deliverInitialNotification', () => {
        NativeModules.CENNotifications.deliverInitialNotification = jest.fn();
        let notifications = null;
        beforeEach(() => {
            notifications = new CENotifications('senderID');
        });

        test('should be function', () => {
            expect(typeof notifications.deliverInitialNotification === 'function').toBeTruthy();
        });

        test('should call method on native module side', () => {
            notifications.deliverInitialNotification();
            expect(NativeModules.CENNotifications.deliverInitialNotification).toHaveBeenCalled();
        });
    });

    describe('deliveredNotifications', () => {
        NativeModules.CENNotifications.deliveredNotifications = jest.fn(callback => callback({ Pubnub: 'is awesome!' }));
        let notifications = null;
        beforeEach(() => {
            notifications = new CENotifications('senderID');
        });

        test('should be function', () => {
            expect(typeof notifications.deliveredNotifications === 'function').toBeTruthy();
        });

        test('should call method on native module side', () => {
            const callback = deliveredNotifications => expect(deliveredNotifications).toEqual({ Pubnub: 'is awesome!' });
            notifications.deliveredNotifications(callback);
            expect(NativeModules.CENNotifications.deliveredNotifications).toHaveBeenCalledWith(callback);
        });

        test('should throw TypeError when \'callback\' is not type of function', () => {
            expect(() => notifications.deliveredNotifications(2010))
                .toThrowError(/Unexpected callback: undefined or has unexpected data type \(function expected\)/);
        });

        test('should throw TypeError when \'callback\' is undefined', () => {
            expect(() => notifications.deliveredNotifications(undefined))
                .toThrowError(/Unexpected callback: undefined or has unexpected data type \(function expected\)/);
        });

        test('should throw TypeError when \'callback\' is null', () => {
            expect(() => notifications.deliveredNotifications(null))
                .toThrowError(/Unexpected callback: undefined or has unexpected data type \(function expected\)/);
        });
    });

    describe('markNotificationAsSeen', () => {
        NativeModules.CENNotifications.markNotificationAsSeen = jest.fn();
        let notifications = null;
        beforeEach(() => {
            notifications = new CENotifications();
        });

        test('should be function', () => {
            expect(typeof notifications.markNotificationAsSeen === 'function').toBeTruthy();
        });

        test('should call method on native module side', () => {
            const notification = { PubNub: ['is', 'awesome!'] };
            notifications.markNotificationAsSeen(notification);
            expect(NativeModules.CENNotifications.markNotificationAsSeen).toHaveBeenCalledWith(notification);
        });

        test('should emit \'$.notifications.seen\' event', () => {
            const emitSpy = jest.spyOn(notifications, 'emit');
            const notification = { PubNub: ['is', 'awesome!'] };
            notifications.markNotificationAsSeen(notification);
            expect(emitSpy).toHaveBeenCalledWith('$.notifications.seen');
        });

        test('should throw TypeError when \'notification\' is not type of Object', () => {
            expect(() => notifications.markNotificationAsSeen(2010))
                .toThrowError(/Unexpected notification: empty or has unexpected data type \(object expected\)/);
        });

        test('should throw TypeError when \'notification\' is empty Object', () => {
            expect(() => notifications.markNotificationAsSeen({}))
                .toThrowError(/Unexpected notification: empty or has unexpected data type \(object expected\)/);
        });

        test('should throw TypeError when \'notification\' is undefined', () => {
            expect(() => notifications.markNotificationAsSeen(undefined))
                .toThrowError(/Unexpected notification: empty or has unexpected data type \(object expected\)/);
        });
    });

    describe('markAllNotificationAsSeen', () => {
        NativeModules.CENNotifications.markAllNotificationAsSeen = jest.fn();
        let notifications = null;
        beforeEach(() => {
            notifications = new CENotifications();
        });

        test('should be function', () => {
            expect(typeof notifications.markAllNotificationAsSeen === 'function').toBeTruthy();
        });

        test('should call method on native module side', () => {
            notifications.markAllNotificationAsSeen();
            expect(NativeModules.CENNotifications.markAllNotificationAsSeen).toHaveBeenCalled();
        });

        test('should emit \'$.notifications.seen\' event', () => {
            const emitSpy = jest.spyOn(notifications, 'emit');
            notifications.markAllNotificationAsSeen();
            expect(emitSpy).toHaveBeenCalledWith('$.notifications.seen');
        });
    });

    describe('formatNotificationPayload', () => {
        NativeModules.CENNotifications.formatNotificationPayload = jest.fn();
        let notifications = null;
        beforeEach(() => {
            notifications = new CENotifications();
        });

        test('should be function', () => {
            expect(typeof notifications.formatNotificationPayload === 'function').toBeTruthy();
        });

        test('should call method on native module side', () => {
            const chanEnginePayload = { PubNub: ['is', 'awesome!'] };
            const callback = payload => payload;
            notifications.formatNotificationPayload(chanEnginePayload, callback);
            expect(NativeModules.CENNotifications.formatNotificationPayload).toHaveBeenCalledWith(chanEnginePayload, callback);
        });

        test('should throw TypeError when \'payload\' is not type of Object', () => {
            expect(() => notifications.formatNotificationPayload(2010, () => {}))
                .toThrowError(/Unexpected payload: empty or has unexpected data type \(object expected\)/);
        });

        test('should throw TypeError when \'payload\' is empty Object', () => {
            expect(() => notifications.formatNotificationPayload({}, () => {}))
                .toThrowError(/Unexpected payload: empty or has unexpected data type \(object expected\)/);
        });

        test('should throw TypeError when \'payload\' is undefined', () => {
            expect(() => notifications.formatNotificationPayload(undefined, () => {}))
                .toThrowError(/Unexpected payload: empty or has unexpected data type \(object expected\)/);
        });

        test('should throw TypeError when \'callback\' is not type of function', () => {
            const chanEnginePayload = { PubNub: ['is', 'awesome!'] };
            expect(() => notifications.formatNotificationPayload(chanEnginePayload, 2010))
                .toThrowError(/Unexpected callback: undefined or has unexpected data type \(function expected\)/);
        });

        test('should throw TypeError when \'callback\' is undefined', () => {
            const chanEnginePayload = { PubNub: ['is', 'awesome!'] };
            expect(() => notifications.formatNotificationPayload(chanEnginePayload, undefined))
                .toThrowError(/Unexpected callback: undefined or has unexpected data type \(function expected\)/);
        });

        test('should throw TypeError when \'callback\' is null', () => {
            const chanEnginePayload = { PubNub: ['is', 'awesome!'] };
            expect(() => notifications.formatNotificationPayload(chanEnginePayload, null))
                .toThrowError(/Unexpected callback: undefined or has unexpected data type \(function expected\)/);
        });
    });

    describe('subscribeOnNativeModuleEvents', () => {
        let notifications = null;
        beforeEach(() => {
            notifications = new CENotifications();
        });

        test('should be function', () => {
            expect(typeof notifications.subscribeOnNativeModuleEvents === 'function').toBeTruthy();
        });

        test('should subscribe on set of events', () => {
            const addListenerSpy = jest.spyOn(DeviceEventEmitter, 'addListener');
            new CENotifications();
            const registeredEvents = addListenerSpy.mock.calls.map(event => event[0]);
            expect(addListenerSpy.mock.calls).toHaveLength(3);
            expect(registeredEvents.includes('CENRegistered')).toBeTruthy();
            expect(registeredEvents.includes('CENFailedToRegister')).toBeTruthy();
            expect(registeredEvents.includes('CENReceivedRemoteNotification')).toBeTruthy();
            addListenerSpy.mockRestore();
        });
    });

    describe('onRegister', () => {
        let notifications = null;
        beforeEach(() => {
            notifications = new CENotifications();
        });

        test('should be function', () => {
            expect(typeof notifications.onRegister === 'function').toBeTruthy();
        });

        test('should be called in response on \'CENRegistered\' event', () => {
            const token = { deviceToken: '00000000000000000000000000000000' };
            const onRegisterSpy = jest.spyOn(notifications, 'onRegister');
            DeviceEventEmitter.emit('CENRegistered', token);
            expect(onRegisterSpy).toHaveBeenCalledWith(token);
            onRegisterSpy.mockRestore();
        });

        test('should emit \'$.notifications.registered\' event in response on \'CENRegistered\' event', () => {
            const token = { deviceToken: '00000000000000000000000000000000' };
            const emitSpy = jest.spyOn(notifications, 'emit');
            DeviceEventEmitter.emit('CENRegistered', token);
            expect(emitSpy).toHaveBeenCalledWith('$.notifications.registered', token.deviceToken);
            emitSpy.mockRestore();
        });
    });

    describe('onRegistrationFail', () => {
        let notifications = null;
        beforeEach(() => {
            notifications = new CENotifications();
        });

        test('should be function', () => {
            expect(typeof notifications.onRegistrationFail === 'function').toBeTruthy();
        });

        test('should be called in response on \'CENFailedToRegister\' event', () => {
            const error = { message: 'User didn\'t granted notifications usage.' };
            const onRegistrationFailSpy = jest.spyOn(notifications, 'onRegistrationFail');
            DeviceEventEmitter.emit('CENFailedToRegister', error);
            expect(onRegistrationFailSpy).toHaveBeenCalledWith(error);
            onRegistrationFailSpy.mockRestore();
        });

        test('should emit \'$.notifications.registration.fail\' event in response on \'CENRegistered\' event', () => {
            const error = { message: 'User didn\'t granted notifications usage.' };
            const emitSpy = jest.spyOn(notifications, 'emit');
            DeviceEventEmitter.emit('CENFailedToRegister', error);
            expect(emitSpy).toHaveBeenCalledWith('$.notifications.registration.fail', error);
            emitSpy.mockRestore();
        });
    });

    describe('onNotification', () => {
        let notifications = null;
        beforeEach(() => {
            notifications = new CENotifications();
        });

        test('should be function', () => {
            expect(typeof notifications.onNotification === 'function').toBeTruthy();
        });

        test('should call remote fetch completion callback', () => {
            const completion = jest.fn();
            const notification = { PubNub: ['is', 'awesome!'], completion };
            notifications.onNotification(notification);
            expect(completion).toHaveBeenCalledWith('noData');
        });

        test('should call notification action handling completion callback', () => {
            const completion = jest.fn();
            const notification = { PubNub: ['is', 'awesome!'], action: { completion } };
            notifications.onNotification(notification);
            expect(completion).toHaveBeenCalled();
        });

        test('should be called in response on \'CENFailedToRegister\' event', () => {
            const notification = { PubNub: ['is', 'awesome!'] };
            const onNotificationSpy = jest.spyOn(notifications, 'onNotification');
            DeviceEventEmitter.emit('CENReceivedRemoteNotification', notification);
            expect(onNotificationSpy).toHaveBeenCalledWith(notification);
            onNotificationSpy.mockRestore();
        });

        test('should emit \'$.notifications.registration.fail\' event in response on \'CENRegistered\' event', () => {
            const notification = { PubNub: ['is', 'awesome!'] };
            const emitSpy = jest.spyOn(notifications, 'emit');
            DeviceEventEmitter.emit('CENReceivedRemoteNotification', notification);
            expect(emitSpy).toHaveBeenCalledWith('$.notifications.received', notification);
            emitSpy.mockRestore();
        });

        test('should throw TypeError when \'payload\' is not type of Object', () => {
            expect(() => notifications.onNotification(2010))
                .toThrowError(/Unexpected payload: empty or has unexpected data type \(object expected\)/);
        });

        test('should throw TypeError when \'payload\' is empty Object', () => {
            expect(() => notifications.onNotification({}))
                .toThrowError(/Unexpected payload: empty or has unexpected data type \(object expected\)/);
        });

        test('should throw TypeError when \'payload\' is undefined', () => {
            expect(() => notifications.onNotification(undefined))
                .toThrowError(/Unexpected payload: empty or has unexpected data type \(object expected\)/);
        });
    });

    afterAll(() => {
        jest.unmock('NativeModules');
    });
});
