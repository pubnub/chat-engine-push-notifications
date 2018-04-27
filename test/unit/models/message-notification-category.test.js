/* eslint-disable no-unused-expressions,no-new,no-new-wrappers,no-new-object,no-array-constructor */
/* global test, expect */
import CENMessageNotificationCategory from '../../../src/models/message-notification-category';
import CENotificationAction from '../../../src/models/notification-action';


/** @test {CENMessageNotificationCategory} */
describe('unittest::CENMessageNotificationCategory', () => {
    describe('#constructor', () => {
        test('should initialize with default category', () => {
            const category = new CENMessageNotificationCategory();
            expect(category.identifier).toEqual('com.pubnub.chat-engine.message');
        });

        test('should initialize with default actions', () => {
            const category = new CENMessageNotificationCategory();
            const respondAction = new CENotificationAction({
                title: 'Respond',
                identifier: 'respond',
                activationMode: 'foreground',
                options: { foreground: true }
            });
            const ignoreAction = new CENotificationAction({
                title: 'Ignore',
                identifier: 'ignore',
                activationMode: 'background',
                destructive: true,
                options: { foreground: false, destructive: true }
            });
            expect(category.actions).toEqual([respondAction, ignoreAction]);
        });
    });
});
