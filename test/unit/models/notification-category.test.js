/* eslint-disable no-unused-expressions,no-new,no-new-wrappers,no-new-object,no-array-constructor */
/* global test, expect */
import CENotificationCategory from '../../../src/models/notification-category';
import CENotificationAction from '../../../src/models/notification-action';


/** @test {CENotificationCategory} */
describe('unittest::CENotificationCategory', () => {
    const openAction = new CENotificationAction({
        identifier: 'open',
        title: 'Open',
        activationMode: 'foreground',
        options: { foreground: true }
    });
    const ignoreAction = new CENotificationAction({
        identifier: 'ignore',
        title: 'Ignore',
        options: { foreground: false, destructive: true }
    });
    const minimumConfiguration = { identifier: 'my-category-identifier', actions: [openAction, ignoreAction] };

    describe('#constructor', () => {
        let configuration;
        beforeEach(() => {
            configuration = Object.assign({}, minimumConfiguration);
        });

        test('should create instance', () => {
            expect(new CENotificationCategory(minimumConfiguration)).toBeDefined();
        });

        test('should throw TypeError when \'options\' doesn\'t have \'identifier\' in it', () => {
            delete configuration.identifier;
            expect(() => new CENotificationCategory(configuration))
                .toThrowError(/Unexpected identifier: empty or has unexpected data type \(string expected\)/);
        });

        test('should throw TypeError when at least one of \'options.bodyPlaceholder\' entries is not type of String', () => {
            configuration.bodyPlaceholder = ['siri', 2010];
            expect(() => new CENotificationCategory(configuration))
                .toThrowError(/Unexpected placeholder: empty or has unexpected data type \(string expected\)/);
        });

        test('should throw TypeError when at least one of \'options.bodyPlaceholder\' entries is empty String', () => {
            configuration.bodyPlaceholder = '';
            expect(() => new CENotificationCategory(configuration))
                .toThrowError(/Unexpected placeholder: empty or has unexpected data type \(string expected\)/);
        });

        test('should throw TypeError when \'options.context\' is not type of String', () => {
            configuration.context = ['siri', 2010];
            expect(() => new CENotificationCategory(configuration))
                .toThrowError(/Unexpected context: empty or has unknown value \(known: default and minimal\)/);
        });

        test('should throw TypeError when \'options.context\' is set to unknown value specified (\'PubNub\')', () => {
            configuration.context = 'PubNub';
            expect(() => new CENotificationCategory(configuration))
                .toThrowError(/Unexpected context: empty or has unknown value \(known: default and minimal\)/);
        });

        test('should throw TypeError when \'options\' doesn\'t have \'actions\' in it', () => {
            delete configuration.actions;
            expect(() => new CENotificationCategory(configuration))
                .toThrowError(/Unexpected actions: empty or has unexpected data type \(CENotificationAction expected\)/);
        });

        test('should throw TypeError when \'options.actions\' is not type of Array', () => {
            configuration.actions = 'PubNub';
            expect(() => new CENotificationCategory(configuration))
                .toThrowError(/Unexpected values type \(array expected\)/);
        });
        test('should throw TypeError when \'options.actions\' is empty Array', () => {
            configuration.actions = [];
            expect(() => new CENotificationCategory(configuration))
                .toThrowError(/Unexpected actions: empty or has unexpected data type \(CENotificationAction expected\)/);
        });

        test('should throw TypeError when \'options.actions\' is Array with unexpected data types', () => {
            configuration.actions = ['PubNub', 'real-time', 'service'];
            expect(() => new CENotificationCategory(configuration))
                .toThrowError(/Unexpected actions: empty or has unexpected data type \(CENotificationAction expected\)/);
        });
    });

    describe('identifier', () => {
        test('should be function', () => {
            let category = new CENotificationCategory(minimumConfiguration);
            expect(category.identifier).toBeDefined();
        });

        test('should return category\'s identifier passed during configuration', () => {
            let category = new CENotificationCategory(minimumConfiguration);
            expect(category.identifier.length).toBeGreaterThan(0);
            expect(category.identifier).toEqual(minimumConfiguration.identifier);
        });
    });

    describe('actions', () => {
        test('should be function', () => {
            let category = new CENotificationCategory(minimumConfiguration);
            expect(category.actions).toBeDefined();
        });

        test('should return category\'s actions passed during configuration', () => {
            let category = new CENotificationCategory(minimumConfiguration);
            expect(category.actions).toHaveLength(minimumConfiguration.actions.length);
            expect(category.actions).toEqual(minimumConfiguration.actions);
        });
    });

    describe('#payload', () => {
        test('should be function', () => {
            let category = new CENotificationCategory(minimumConfiguration);
            expect(typeof category.payload === 'function').toBeTruthy();
        });
        test('should serialize category', () => {
            let category = new CENotificationCategory(minimumConfiguration);
            const serializedCategory = Object.assign({ context: 'minimal' }, minimumConfiguration, {
                actions: minimumConfiguration.actions.map(action => action.payload())
            });
            expect(category.payload()).toEqual(serializedCategory);
        });
    });
});
