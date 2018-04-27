/* eslint-disable no-unused-expressions,no-new,no-new-wrappers,no-new-object,no-array-constructor */
/* global test, expect */
import { TypeValidator, throwError } from '../../../src/helpers/utils';

/** @test {TypeValidator} */
describe('unittest::throwError', () => {

    test('should be function', () => {
        expect(typeof throwError === 'function').toBeTruthy();
    });

    test('should throw error in test environment', () => {
        const originalNodeEnv = process.env.NODE_ENV;
        const error = TypeError('Test error for test environment');
        process.env.NODE_ENV = 'test';

        expect(() => throwError(error)).toThrowError(/Test error for test environment/);

        process.env.NODE_ENV = originalNodeEnv;
    });

    test('should not throw error in non-test environment', () => {
        const originalNodeEnv = process.env.NODE_ENV;
        const error = TypeError('Test error for test environment');
        process.env.NODE_ENV = 'production';

        expect(() => throwError(error)).not.toThrowError(/Test error for test environment/);

        process.env.NODE_ENV = originalNodeEnv;
    });
});

/** @test {TypeValidator} */
describe('unittest::TypeValidator', () => {
    describe('#sequence', () => {
        test('should be function', () => {
            expect(typeof TypeValidator.sequence === 'function').toBeTruthy();
        });

        test('should be \'false\' for undefined with check against non empty String', () => {
            expect(TypeValidator.sequence(undefined, [['isTypeOf', String], 'notEmpty'])).toBeFalsy();
        });

        test('should be \'false\' for null with check against non empty String', () => {
            expect(TypeValidator.sequence(null, [['isTypeOf', String], 'notEmpty'])).toBeFalsy();
        });

        test('should throw TypeError when at least one of \'validations\' is not String or Array', () => {
            expect(() => TypeValidator.sequence('PubNub', [{ PubNub: ['real-time', 'service'] }]))
                .toThrowError(/Unexpected validation operation type \(should be string or array\)/);
        });

        test('should throw TypeError when \'validations\' is not type of Array', () => {
            expect(() => TypeValidator.sequence('PubNub', { PubNub: ['real-time', 'service'] }))
                .toThrowError(/Unexpected validations type \(array expected\)/);
        });

        test('should not throw TypeError when \'validations\' is not type of Array in non-test environment', () => {
            const originalNodeEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            expect(() => TypeValidator.sequence('PubNub', { PubNub: ['real-time', 'service'] }))
                .not.toThrowError(/Unexpected validations type \(array expected\)/);
            expect(TypeValidator.sequence('PubNub', { PubNub: ['real-time', 'service'] })).toBeFalsy();

            process.env.NODE_ENV = originalNodeEnv;
        });

        test('should throw TypeError when \'validations\' is not type of Array', () => {
            expect(() => TypeValidator.sequence('PubNub', { PubNub: ['real-time', 'service'] }))
                .toThrowError(/Unexpected validations type \(array expected\)/);
        });

        test('should throw TypeError when entry from \'validations\' represented by Array with non-String first element', () => {
            expect(() => TypeValidator.sequence('PubNub', [[2010, 'notEmpty']]))
                .toThrowError(/Unexpected validation function type \(string expected\)/);
        });
    });

    describe('#sequenceIfDefined', () => {
        test('should be function', () => {
            expect(typeof TypeValidator.sequenceIfDefined === 'function').toBeTruthy();
        });

        test('should be \'true\' for undefined with check against non empty String', () => {
            expect(TypeValidator.sequenceIfDefined(undefined, [['isTypeOf', String], 'notEmpty'])).toBeTruthy();
        });

        test('should be \'true\' for null with check against non empty String', () => {
            expect(TypeValidator.sequenceIfDefined(null, [['isTypeOf', String], 'notEmpty'])).toBeTruthy();
        });

        test('should be \'true\' for \'PubNub\' with check against non empty String', () => {
            expect(TypeValidator.sequenceIfDefined('PubNub', [['isTypeOf', String], 'notEmpty'])).toBeTruthy();
        });

        test('should be \'true\' for { PubNub: [\'real-time\', \'service\'] } with check against Object with known keys', () => {
            expect(TypeValidator.sequenceIfDefined({ PubNub: ['real-time', 'service'] }, [['isTypeOf', Object], 'notEmpty',
                ['hasKnownKeys', ['PubNub']]])).toBeTruthy();
        });

        test('should be \'true\' for { background: true, destructive: true } with check against Object with known keys and Boolean values', () => {
            expect(TypeValidator.sequenceIfDefined({ foreground: false, destructive: true }, [['isTypeOf', Object],
                ['hasKnownKeys', ['authenticationRequired', 'destructive', 'foreground']], ['hasValuesOf', Boolean]])).toBeTruthy();
        });

        test('should be \'false\' for \'\' with check against not empty String', () => {
            expect(TypeValidator.sequenceIfDefined('', [['isTypeOf', String], 'notEmpty'])).toBeFalsy();
        });

        test('should be \'false\' for [\'PubNub\', \'real-time\', 10] with check against Array of String', () => {
            expect(TypeValidator.sequenceIfDefined(['PubNub', 'real-time', 10], [['isArrayOf', String]])).toBeFalsy();
        });
    });

    describe('#isDefined', () => {
        test('should be function', () => {
            expect(typeof TypeValidator.isDefined === 'function').toBeTruthy();
        });

        test('should be \'true\' for \'PubNub\'', () => {
            expect(TypeValidator.isDefined('PubNub')).toBeTruthy();
        });

        test('should be \'true\' for 2010', () => {
            expect(TypeValidator.isDefined(2010)).toBeTruthy();
        });

        test('should be \'false\' for \'null\'', () => {
            expect(TypeValidator.isDefined(null)).toBeFalsy();
        });

        test('should be \'false\' for \'undefined\'', () => {
            expect(TypeValidator.isDefined(undefined)).toBeFalsy();
        });
    });

    describe('#isEmpty', () => {
        test('should be function', () => {
            expect(typeof TypeValidator.isEmpty === 'function').toBeTruthy();
        });

        test('should be \'true\' for []', () => {
            expect(TypeValidator.isEmpty([])).toBeTruthy();
        });

        test('should be \'true\' for \'\'', () => {
            expect(TypeValidator.isEmpty('')).toBeTruthy();
        });

        test('should be \'true\' for {}', () => {
            expect(TypeValidator.isEmpty({})).toBeTruthy();
        });

        test('should be \'true\' for undefined', () => {
            expect(TypeValidator.isEmpty(undefined)).toBeTruthy();
        });

        test('should be \'true\' for null', () => {
            expect(TypeValidator.isEmpty(null)).toBeTruthy();
        });

        test('should be \'false\' for new Date()', () => {
            expect(TypeValidator.isEmpty(new Date())).toBeTruthy();
        });

        test('should be \'false\' for [2, 0, 1, 0]', () => {
            expect(TypeValidator.isEmpty([2, 0, 1, 0])).toBeFalsy();
        });

        test('should be \'false\' for \'PubNub real-time service\'', () => {
            expect(TypeValidator.isEmpty('PubNub real-time service')).toBeFalsy();
        });

        test('should be \'false\' for { PubNub: [\'real-time\', \'service\'] }', () => {
            expect(TypeValidator.isEmpty({ PubNub: ['real-time', 'service'] })).toBeFalsy();
        });
    });

    describe('#notEmpty', () => {
        test('should be function', () => {
            expect(typeof TypeValidator.notEmpty === 'function').toBeTruthy();
        });

        test('should be \'true\' for [2, 0, 1, 0]', () => {
            expect(TypeValidator.notEmpty([2, 0, 1, 0])).toBeTruthy();
        });

        test('should be \'true\' for \'PubNub real-time service\'', () => {
            expect(TypeValidator.notEmpty('PubNub real-time service')).toBeTruthy();
        });

        test('should be \'true\' for { PubNub: [\'real-time\', \'service\'] }', () => {
            expect(TypeValidator.notEmpty({ PubNub: ['real-time', 'service'] })).toBeTruthy();
        });

        test('should be \'true\' for 2010', () => {
            expect(TypeValidator.notEmpty(2010)).toBeTruthy();
        });

        test('should be \'false\' for new Date()', () => {
            expect(TypeValidator.notEmpty(new Date())).toBeFalsy();
        });

        test('should be \'false\' for []', () => {
            expect(TypeValidator.notEmpty([])).toBeFalsy();
        });

        test('should be \'false\' for \'\'', () => {
            expect(TypeValidator.notEmpty('')).toBeFalsy();
        });

        test('should be \'false\' for {}', () => {
            expect(TypeValidator.notEmpty({})).toBeFalsy();
        });

        test('should be \'false\' for undefined', () => {
            expect(TypeValidator.notEmpty(undefined)).toBeFalsy();
        });

        test('should be \'false\' for null', () => {
            expect(TypeValidator.notEmpty(null)).toBeFalsy();
        });

        test('should be \'false\' for 2010', () => {
            expect(TypeValidator.notEmpty(0)).toBeFalsy();
        });

        test('should be \'false\' for false', () => {
            expect(TypeValidator.notEmpty(false)).toBeFalsy();
        });
    });

    describe('#isArrayOf', () => {
        test('should be function', () => {
            expect(typeof TypeValidator.isArrayOf === 'function').toBeTruthy();
        });

        test('should be \'true\' for [2, 0, 1, 0] check against Number', () => {
            expect(TypeValidator.isArrayOf([2, 0, 1, 0], Number)).toBeTruthy();
        });

        test('should be \'true\' for [{ a: 1 }, { b: 2 }, { c: 3 }, { d: 4 }] check against Object', () => {
            expect(TypeValidator.isArrayOf([{ a: 1 }, { b: 2 }, { c: 3 }, { d: 4 }], Object)).toBeTruthy();
        });

        test('should be \'true\' for [\'PubNub\', \'real-time\', \'service\'] check against String', () => {
            expect(TypeValidator.isArrayOf(['PubNub', 'real-time', 'service'], String)).toBeTruthy();
        });

        test('should be \'false\' for [\'PubNub\', \'real-time\', \'service\'] check against Number', () => {
            expect(TypeValidator.isArrayOf(['PubNub', 'real-time', 'service'], Number)).toBeFalsy();
        });

        test('should be \'true\' for [\'PubNub\', \'real-time\', \'service\'] check against String with non-empty values check', () => {
            expect(TypeValidator.isArrayOf(['PubNub', 'real-time', 'service'], Number, TypeValidator.notEmpty)).toBeFalsy();
        });

        test('should be \'false\' for [\'PubNub\', \'real-time\', \'\'] check against String with non-empty values check', () => {
            expect(TypeValidator.isArrayOf(['PubNub', 'real-time', ''], Number, TypeValidator.notEmpty)).toBeFalsy();
        });

        test('should throw TypeError when \'values\' is not type of Array', () => {
            expect(() => TypeValidator.isArrayOf({ a: 1 }, Number)).toThrowError(/Unexpected values type \(array expected\)/);
        });
    });

    describe('#isTypeOf', () => {
        test('should be function', () => {
            expect(typeof TypeValidator.isTypeOf === 'function').toBeTruthy();
        });

        test('should be \'true\' for \'PubNub\' check against String', () => {
            expect(TypeValidator.isTypeOf('PubNub', String)).toBeTruthy();
        });

        test('should be \'true\' for new String(\'PubNub\') check against String', () => {
            expect(TypeValidator.isTypeOf(new String('PubNub'), String)).toBeTruthy();
        });

        test('should be \'true\' for \'PubNub\' check against \'string\'', () => {
            expect(TypeValidator.isTypeOf('PubNub', 'string')).toBeTruthy();
        });

        test('should be \'true\' for new String(\'PubNub\') check against \'string\'', () => {
            expect(TypeValidator.isTypeOf(new String('PubNub'), 'string')).toBeTruthy();
        });

        test('should be \'true\' for 2010 check against Number', () => {
            expect(TypeValidator.isTypeOf(2010, Number)).toBeTruthy();
        });

        test('should be \'true\' for new Number(2010) check against Number', () => {
            expect(TypeValidator.isTypeOf(new Number(2010), Number)).toBeTruthy();
        });

        test('should be \'true\' for \'PubNub\' check against \'number\'', () => {
            expect(TypeValidator.isTypeOf(2010, 'number')).toBeTruthy();
        });

        test('should be \'true\' for new Number(2010) check against \'number\'', () => {
            expect(TypeValidator.isTypeOf(new Number(2010), 'number')).toBeTruthy();
        });

        test('should be \'true\' for { PubNub: [\'real-time\', \'service\'] } check against Object', () => {
            expect(TypeValidator.isTypeOf({ PubNub: ['real-time', 'service'] }, Object)).toBeTruthy();
        });

        test('should be \'true\' for new Object({ PubNub: [\'real-time\', \'service\'] }) check against Number', () => {
            expect(TypeValidator.isTypeOf(new Object({ PubNub: ['real-time', 'service'] }), Object)).toBeTruthy();
        });

        test('should be \'true\' for { PubNub: [\'real-time\', \'service\'] } check against \'object\'', () => {
            expect(TypeValidator.isTypeOf(2010, 'number')).toBeTruthy();
        });

        test('should be \'true\' for new Object({ PubNub: [\'real-time\', \'service\'] }) check against \'object\'', () => {
            expect(TypeValidator.isTypeOf(new Object({ PubNub: ['real-time', 'service'] }), 'object')).toBeTruthy();
        });

        test('should be \'true\' for [2, 0, 1, 0] check against Array', () => {
            expect(TypeValidator.isTypeOf([2, 0, 1, 0], Array)).toBeTruthy();
        });

        test('should be \'true\' for new Array(2, 0, 1, 0) check against Array', () => {
            expect(TypeValidator.isTypeOf(new Array(2, 0, 1, 0), Array)).toBeTruthy();
        });

        test('should be \'true\' for [2, 0, 1, 0] check against \'array\'', () => {
            expect(TypeValidator.isTypeOf([2, 0, 1, 0], 'array')).toBeTruthy();
        });

        test('should be \'true\' for new Array(2, 0, 1, 0) check against \'array\'', () => {
            expect(TypeValidator.isTypeOf(new Array(2, 0, 1, 0), 'array')).toBeTruthy();
        });

        test('should be \'true\' for new Date() check against Date', () => {
            expect(TypeValidator.isTypeOf(new Date(), Date)).toBeTruthy();
        });

        test('should be \'true\' for new Date() check against \'date\'', () => {
            expect(TypeValidator.isTypeOf(new Date(), 'date')).toBeTruthy();
        });

        test('should be \'false\' for [2, 0, 1, 0] check against Object', () => {
            expect(TypeValidator.isTypeOf([2, 0, 1, 0], Object)).toBeFalsy();
        });

        test('should be \'false\' for new Object({ PubNub: [\'real-time\', \'service\'] }) check against Number', () => {
            expect(TypeValidator.isTypeOf(new Object({ PubNub: ['real-time', 'service'] }), Number)).toBeFalsy();
        });

        test('should throw TypeError when \'type\' is not string or class', () => {
            expect(() => TypeValidator.isTypeOf([2, 0, 1, 0], 2010)).toThrowError(/Unexpected type data type \(string or Class expected\)/);
        });
    });

    describe('#notTypeOf', () => {
        test('should be function', () => {
            expect(typeof TypeValidator.notTypeOf === 'function').toBeTruthy();
        });

        test('should be \'true\' for \'PubNub\' check against Number', () => {
            expect(TypeValidator.notTypeOf('PubNub', Number)).toBeTruthy();
        });

        test('should be \'true\' for \'PubNub\' check against \'function\'', () => {
            expect(TypeValidator.notTypeOf('PubNub', 'function')).toBeTruthy();
        });

        test('should be \'false\' for undefined check against String', () => {
            expect(TypeValidator.notTypeOf(undefined, String)).toBeTruthy();
        });

        test('should be \'false\' for null check against String', () => {
            expect(TypeValidator.notTypeOf(null, String)).toBeTruthy();
        });

        test('should be \'false\' for \'PubNub\' check against String', () => {
            expect(TypeValidator.notTypeOf('PubNub', String)).toBeFalsy();
        });
    });

    describe('#isOneOf', () => {
        test('should be function', () => {
            expect(typeof TypeValidator.isOneOf === 'function').toBeTruthy();
        });

        test('should be \'true\' for \'PubNub\' in [\'PubNub\', \'is\', \'real-time\']', () => {
            expect(TypeValidator.isOneOf('PubNub', ['PubNub', 'is', 'real-time'])).toBeTruthy();
        });

        test('should be \'true\' for \'PubNub\' in [\'PubNub\', \'is\', \'real-time\']', () => {
            expect(TypeValidator.isOneOf('Test', ['PubNub', 'is', 'real-time'])).toBeFalsy();
        });

        test('should throw TypeError when \'value\' is not type of String', () => {
            expect(() => TypeValidator.isOneOf(['PubNub'], ['PubNub', 'is', 'real-time'])).toThrowError(/Unexpected value type \(string expected\)/);
        });

        test('should throw TypeError when \'value\' is undefined', () => {
            expect(() => TypeValidator.isOneOf(undefined, ['PubNub', 'is', 'real-time'])).toThrowError(/Unexpected value type \(string expected\)/);
        });

        test('should throw TypeError when \'value\' is null', () => {
            expect(() => TypeValidator.isOneOf(null, ['PubNub', 'is', 'real-time'])).toThrowError(/Unexpected value type \(string expected\)/);
        });

        test('should throw TypeError when \'variants\' is not type of Array', () => {
            expect(() => TypeValidator.isOneOf('PubNub', { test: 'value' }))
                .toThrowError(/Unexpected values type \(array expected\)/);
        });

        test('should throw TypeError when \'variants\' is undefined', () => {
            expect(() => TypeValidator.isOneOf('PubNub', undefined))
                .toThrowError(/Unexpected values type \(array expected\)/);
        });

        test('should throw TypeError when \'variants\' is null', () => {
            expect(() => TypeValidator.isOneOf('PubNub', null))
                .toThrowError(/Unexpected values type \(array expected\)/);
        });

        test('should throw TypeError when at least one of \'variants\' entries is not type of String', () => {
            expect(() => TypeValidator.isOneOf('PubNub', ['PubNub', 'is', 'real-time', 10]))
                .toThrowError(/Unexpected variants type \(array expected\) or keys entries has unexpected values/);
        });
    });

    describe('#hasKnownKeys', () => {
        test('should be function', () => {
            expect(typeof TypeValidator.hasKnownKeys === 'function').toBeTruthy();
        });

        test('should be \'true\' for { a: 1, b: 2, c: 4 } with known keys: [\'a\', \'b\', \'c\']', () => {
            expect(TypeValidator.hasKnownKeys({ a: 1, b: 2, c: 4 }, ['a', 'b', 'c'])).toBeTruthy();
        });

        test('should be \'false\' for { a: 1, b: 2, k: 4 } with known keys: [\'a\', \'b\', \'c\']', () => {
            expect(TypeValidator.hasKnownKeys({ a: 1, b: 2, k: 4 }, ['a', 'b', 'c'])).toBeFalsy();
        });

        test('should throw TypeError when \'value\' is not type of Object', () => {
            expect(() => TypeValidator.hasKnownKeys([1, 2, 4], ['a', 'b', 'c'])).toThrowError(/Unexpected value type \(object expected\)/);
        });

        test('should throw TypeError when \'value\' is undefined', () => {
            expect(() => TypeValidator.hasKnownKeys(undefined, ['a', 'b', 'c'])).toThrowError(/Unexpected value type \(object expected\)/);
        });

        test('should throw TypeError when \'value\' is null', () => {
            expect(() => TypeValidator.hasKnownKeys(null, ['a', 'b', 'c'])).toThrowError(/Unexpected value type \(object expected\)/);
        });

        test('should throw TypeError when \'keys\' is not type of Array', () => {
            expect(() => TypeValidator.hasKnownKeys({ a: 1, b: 2, k: 4 }, { a: 1, b: 2, k: 4 }))
                .toThrowError(/Unexpected values type \(array expected\)/);
        });

        test('should throw TypeError when \'keys\' is undefined', () => {
            expect(() => TypeValidator.hasKnownKeys({ a: 1, b: 2, k: 4 }, undefined))
                .toThrowError(/Unexpected values type \(array expected\)/);
        });

        test('should throw TypeError when \'keys\' is null', () => {
            expect(() => TypeValidator.hasKnownKeys({ a: 1, b: 2, k: 4 }, null))
                .toThrowError(/Unexpected values type \(array expected\)/);
        });

        test('should throw TypeError when at least one of \'keys\' entries is not type of String', () => {
            expect(() => TypeValidator.hasKnownKeys({ a: 1, b: 2, k: 4 }, ['a', 'b', 'c', 10]))
                .toThrowError(/Unexpected keys type \(array expected\) or keys entries has unexpected values/);
        });
    });

    describe('#hasValuesOf', () => {
        test('should be function', () => {
            expect(typeof TypeValidator.hasValuesOf === 'function').toBeTruthy();
        });

        test('should be \'true\' for { a: 1, b: 2, c: 4 } check against Number', () => {
            expect(TypeValidator.hasValuesOf({ a: 1, b: 2, c: 4 }, Number)).toBeTruthy();
        });

        test('should be \'true\' for { background: true, destructive: true } check against Boolean', () => {
            expect(TypeValidator.hasValuesOf({ background: true, destructive: true }, Boolean)).toBeTruthy();
        });

        test('should be \'true\' for { a: false, b: true, c: false } check against Boolean', () => {
            expect(TypeValidator.hasValuesOf({ a: false, b: true, c: false }, Boolean)).toBeTruthy();
        });

        test('should be \'false\' for { a: false, b: 2, c: false } check against Boolean', () => {
            expect(TypeValidator.hasValuesOf({ a: false, b: 2, c: false }, Boolean)).toBeFalsy();
        });

        test('should be \'false\' for { a: \'false\', b: 2, c: \'false\' } check against String', () => {
            expect(TypeValidator.hasValuesOf({ a: 'false', b: 2, c: 'false' }, String)).toBeFalsy();
        });

        test('should throw TypeError when \'value\' is not type of Object', () => {
            expect(() => TypeValidator.hasValuesOf(['a', 'b', 'c'], String)).toThrowError(/Unexpected value type \(object expected\)/);
        });

        test('should throw TypeError when \'value\' is undefined', () => {
            expect(() => TypeValidator.hasValuesOf(undefined, String)).toThrowError(/Unexpected value type \(object expected\)/);
        });

        test('should throw TypeError when \'value\' is null', () => {
            expect(() => TypeValidator.hasValuesOf(null, String)).toThrowError(/Unexpected value type \(object expected\)/);
        });
    });

    describe('#isObject', () => {
        test('should be function', () => {
            expect(typeof TypeValidator.isObject === 'function').toBeTruthy();
        });

        test('should be \'true\' for { PubNub: [\'real-time\', \'service\'] }', () => {
            expect(TypeValidator.isObject({ PubNub: ['real-time', 'service'] })).toBeTruthy();
        });

        test('should be \'false\' for [\'PubNub\', \'real-time\', \'service\']', () => {
            expect(TypeValidator.isObject(['PubNub', 'real-time', 'service'])).toBeFalsy();
        });

        test('should be \'false\' for new Date()', () => {
            expect(TypeValidator.isObject(new Date())).toBeFalsy();
        });

        test('should be \'false\' for 2010', () => {
            expect(TypeValidator.isObject(2010)).toBeFalsy();
        });

        test('should be \'false\' for []', () => {
            expect(TypeValidator.isObject([])).toBeFalsy();
        });

        test('should be \'false\' for () => {}', () => {
            expect(TypeValidator.isObject(() => {})).toBeFalsy();
        });

        test('should be \'false\' for undefined', () => {
            expect(TypeValidator.isObject(undefined)).toBeFalsy();
        });

        test('should be \'false\' for null', () => {
            expect(TypeValidator.isObject(null)).toBeFalsy();
        });
    });

    describe('#isPrimitive', () => {
        test('should be function', () => {
            expect(typeof TypeValidator.isPrimitive === 'function').toBeTruthy();
        });

        test('should be \'true\' for 2010', () => {
            expect(TypeValidator.isPrimitive(2010)).toBeTruthy();
        });

        test('should be \'true\' for \'PubNub\'', () => {
            expect(TypeValidator.isPrimitive('PubNub')).toBeTruthy();
        });

        test('should be \'true\' for null', () => {
            expect(TypeValidator.isPrimitive(null)).toBeTruthy();
        });

        test('should be \'true\' for undefined', () => {
            expect(TypeValidator.isPrimitive(undefined)).toBeTruthy();
        });

        test('should be \'true\' for true', () => {
            expect(TypeValidator.isPrimitive(true)).toBeTruthy();
        });

        test('should be \'false\' for {}', () => {
            expect(TypeValidator.isPrimitive({})).toBeFalsy();
        });

        test('should be \'false\' for [2, 0, 1, 0]', () => {
            expect(TypeValidator.isPrimitive([2, 0, 1, 0])).toBeFalsy();
        });

        test('should be \'false\' for () => {}', () => {
            expect(TypeValidator.isPrimitive(() => {})).toBeFalsy();
        });
    });
});
