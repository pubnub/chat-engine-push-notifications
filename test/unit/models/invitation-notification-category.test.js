/* eslint-disable no-unused-expressions,no-new,no-new-wrappers,no-new-object,no-array-constructor */
/* global test, expect */
import CENInvitationNotificationCategory from '../../../src/models/invitation-notification-category';
import CENotificationAction from '../../../src/models/notification-action';


/** @test {CENInvitationNotificationCategory} */
describe('unittest::CENInvitationNotificationCategory', () => {
    describe('#constructor', () => {
        test('should initialize with default category', () => {
            const category = new CENInvitationNotificationCategory();
            expect(category.identifier).toEqual('com.pubnub.chat-engine.invite');
        });

        test('should initialize with default actions', () => {
            const category = new CENInvitationNotificationCategory();
            const acceptAction = new CENotificationAction({
                title: 'Accept',
                identifier: 'accept',
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
            expect(category.actions).toEqual([acceptAction, ignoreAction]);
        });
    });
});
