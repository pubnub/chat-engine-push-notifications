/* eslint-disable no-unused-expressions,no-new,no-new-wrappers,no-new-object,no-array-constructor */
/* global test, expect */
import CENotificationAction from '../../../src/models/notification-action';


/** @test {CENotificationAction} */
describe('unittest::CENotificationAction', () => {
    const minimumConfiguration = {
        identifier: 'my-action-identifier',
        title: 'My action title',
        activationMode: 'foreground',
        options: { foreground: true }
    };

    describe('#constructor', () => {
        let configuration;
        beforeEach(() => {
            configuration = Object.assign({}, minimumConfiguration);
        });
        test('should create instance', () => {
            delete configuration.activationMode;
            expect(new CENotificationAction(configuration)).toBeDefined();
        });

        test('should throw TypeError when \'options\' doesn\'t have \'identifier\' in it', () => {
            delete configuration.identifier;
            expect(() => new CENotificationAction(configuration))
                .toThrowError(/Unexpected identifier: empty or has unexpected data type \(string expected\)/);
        });

        test('should throw TypeError when \'options\' doesn\'t have \'title\' in it', () => {
            delete configuration.title;
            expect(() => new CENotificationAction(configuration))
                .toThrowError(/Unexpected title: empty or has unexpected data type \(string expected\)/);
        });

        test('should throw TypeError when \'options.activationMode\' is not type of String', () => {
            configuration.activationMode = 2010;
            expect(() => new CENotificationAction(configuration))
                .toThrowError(/Unexpected value type \(string expected\)/);
        });

        test('should throw TypeError when \'options.activationMode\' is set to unknown value specified (\'PubNub\')', () => {
            configuration.activationMode = 'PubNub';
            expect(() => new CENotificationAction(configuration))
                .toThrowError(/Unexpected activation mode: empty or has unknown value \(known: foreground and background\)/);
        });

        test('should throw TypeError when \'options.authenticationRequired\' is not type of Boolean', () => {
            configuration.authenticationRequired = 2010;
            expect(() => new CENotificationAction(configuration))
                .toThrowError(/Unexpected authentication: unexpected data type \(boolean expected\)/);
        });

        test('should throw TypeError when \'options.destructive\' is not type of Boolean', () => {
            configuration.destructive = 2010;
            expect(() => new CENotificationAction(configuration))
                .toThrowError(/Unexpected destructive: unexpected data type \(boolean expected\)/);
        });

        test('should throw TypeError when \'options.behavior\' is not type of String', () => {
            configuration.behavior = 2010;
            expect(() => new CENotificationAction(configuration))
                .toThrowError(/Unexpected value type \(string expected\)/);
        });

        test('should throw TypeError when \'options.behavior\' is set to unknown value specified (\'PubNub\')', () => {
            configuration.behavior = 'PubNub';
            expect(() => new CENotificationAction(configuration))
                .toThrowError(/Unexpected behavior: empty or has unknown value \(known: default and textInput\)/);
        });

        test('should throw TypeError when \'options.textInput\' is not type of Object', () => {
            configuration.textInput = [2010];
            expect(() => new CENotificationAction(configuration))
                .toThrowError(/Unexpected text input: empty or has unknown parameters \(known: title and placeholder\) of unknown data type/);
        });

        test('should throw TypeError when \'options.textInput\' is Object and has unknown keys', () => {
            configuration.textInput = { PubNub: 'is awesome!' };
            expect(() => new CENotificationAction(configuration))
                .toThrowError(/Unexpected text input: empty or has unknown parameters \(known: title and placeholder\) of unknown data type/);
        });

        test('should throw TypeError when any value in \'options.textInput\' Object is not type of String', () => {
            configuration.textInput = { title: 'PubNub', placeholder: 16 };
            expect(() => new CENotificationAction(configuration))
                .toThrowError(/Unexpected text input: empty or has unknown parameters \(known: title and placeholder\) of unknown data type/);
        });

        test('should throw TypeError when \'options.options\' is not type of Object', () => {
            configuration.options = [2010];
            expect(() => new CENotificationAction(configuration))
                .toThrowError(/Unexpected options: empty or has unknown parameters \(known: authenticationRequired, destructive and foreground\)/);
        });

        test('should throw TypeError when \'options.options\' is Object and has unknown keys', () => {
            configuration.options = { PubNub: 'is awesome!' };
            expect(() => new CENotificationAction(configuration))
                .toThrowError(/Unexpected options: empty or has unknown parameters \(known: authenticationRequired, destructive and foreground\)/);
        });

        test('should throw TypeError when any value in \'options.options\' Object is not type of Boolean', () => {
            configuration.options = { authenticationRequired: true, foreground: 'PubNub' };
            expect(() => new CENotificationAction(configuration))
                .toThrowError(/Unexpected options: empty or has unknown parameters \(known: authenticationRequired, destructive and foreground\)/);
        });
    });

    describe('identifier', () => {
        test('should be function', () => {
            let action = new CENotificationAction(minimumConfiguration);
            expect(action.identifier).toBeDefined();
        });

        test('should return action\'s identifier passed during configuration', () => {
            let action = new CENotificationAction(minimumConfiguration);
            expect(action.identifier.length).toBeGreaterThan(0);
            expect(action.identifier).toEqual(minimumConfiguration.identifier);
        });
    });

    describe('title', () => {
        test('should be function', () => {
            let action = new CENotificationAction(minimumConfiguration);
            expect(action.title).toBeDefined();
        });

        test('should return action\'s title passed during configuration', () => {
            let action = new CENotificationAction(minimumConfiguration);
            expect(action.title.length).toBeGreaterThan(0);
            expect(action.title).toEqual(minimumConfiguration.title);
        });
    });

    describe('#payload', () => {
        test('should be function', () => {
            let action = new CENotificationAction(minimumConfiguration);
            expect(typeof action.payload === 'function').toBeTruthy();
        });
        test('should serialize category', () => {
            let action = new CENotificationAction(minimumConfiguration);
            const serializedAction = Object.assign({ activationMode: 'background', behavior: 'default' }, minimumConfiguration);
            expect(action.payload()).toEqual(serializedAction);
        });
    });
});
