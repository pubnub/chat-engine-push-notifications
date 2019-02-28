/* eslint-disable no-unused-expressions,no-new,no-new-wrappers,no-new-object,no-array-constructor,import/named */
/* global test, expect */
import { TypeValidator } from '../../src/helpers/utils';
import { plugin } from '../../src/plugin';


jest.mock('NativeModules', () => ({
    CENNotifications: {
        receiveMissedEvents: jest.fn()
    }
}));

describe('unittest::plugin', () => {
    describe('module.exports', () => {
        test('should export CENInvitationNotificationCategory', () => {
            expect(require('../../src/plugin').CENInvitationNotificationCategory).toBeDefined();
        });

        test('should export CENMessageNotificationCategory', () => {
            expect(require('../../src/plugin').CENMessageNotificationCategory).toBeDefined();
        });

        test('should export CENotificationCategory', () => {
            expect(require('../../src/plugin').CENotificationCategory).toBeDefined();
        });

        test('should export CENotificationAction', () => {
            expect(require('../../src/plugin').CENotificationAction).toBeDefined();
        });

        test('should export plugin', () => {
            expect(require('../../src/plugin').plugin).toBeDefined();
        });

        test('should return proper plugin object', () => {
            const pluginObject = plugin({ events: ['$.invite', 'message'], platforms: { ios: true, android: true } });
            expect(TypeValidator.isTypeOf(pluginObject, Object)).toBeTruthy();
            expect(TypeValidator.sequence(pluginObject.namespace, [['isTypeOf', String], 'notEmpty'])).toBeTruthy();
            expect(pluginObject.namespace).toBe('chatEngineNotifications.me');
            expect(pluginObject.extends.Me).toBeDefined();
        });

        test('should create plugin instance to extend Me', () => {
            const pluginObject = plugin({ events: ['$.invite', 'message'], platforms: { ios: true, android: true } });
            const MeExtension = pluginObject.extends.Me;
            expect(new MeExtension()).toBeDefined();
        });
    });
});
