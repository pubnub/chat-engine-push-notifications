/**
 * Wrap up exception raise code for easier debug.
 * There is no troubles with throwing exceptions during tests, but when code is running within ReactNative container, thrown error real to unexpected
 * behaviour w/o telling what exactly happened (end up with showing unrelated exception).
 *
 * @param error Reference on error object which should be thrown in _test_ environment and printed to console when running within ReactNative
 * container.
 */
export function throwError(error) {
    if (process.env.NODE_ENV === 'test') {
        throw error;
    } else {
        console.error(error);
    }
}

export class TypeValidator {
    /**
     * Run sequence of checks for passed `value` using function names of this class.
     *
     * @param {*} value - Reference on object for which check should be done.
     * @param {Array<(String|Array)>} validations - Reference on set of validations which should be performed.
     * @return {Boolean} `true` in case if object pass all validations.
     *
     * @throws {TypeError} In case if passed `validations` is not type of _array_.
     * @throws {TypeError} In case if one of entries from passed `validations` is not type of _string_ or _array_.
     * @throws {TypeError} In case if array's entry from passed `validations` first element is not type of _string_ (it represent name of
     *     {@link TypeValidator} function to use.
     */
    static sequence(value, validations) {
        if (!TypeValidator.isDefined(value)) {
            return false;
        }

        if (!Array.isArray(validations)) {
            throwError(new TypeError('Unexpected validations type (array expected).'));
            return false;
        }

        let pass = true;
        validations.every((validation) => {
            if (typeof validation === 'string') {
                pass = pass && TypeValidator[validation](value);
            } else if (Array.isArray(validation)) {
                if (typeof validation[0] === 'string') {
                    pass = pass && TypeValidator[validation[0]](value, ...validation.slice(1));
                } else {
                    throwError(new TypeError('Unexpected validation function type (string expected).'));
                    pass = false;
                }
            } else {
                throwError(new TypeError('Unexpected validation operation type (should be string or array).'));
                pass = false;
            }
            return pass;
        });
        return pass;
    }

    /**
     * Run sequence of checks for passed `value` if it is **defined** using function names of this class.
     *
     * @param {*} value - Reference on object for which check should be done.
     * @param {Array<(String|Array)>} validations - Reference on set of validations which should be performed.
     * @return {Boolean} `true` in case if object pass all validations or object not defined.
     */
    static sequenceIfDefined(value, validations) {
        if (TypeValidator.isDefined(value)) {
            return TypeValidator.sequence(value, validations);
        }
        return true;
    }

    /**
     * Check whether passed `value` is not `null` nor `undefined`.
     *
     * @param {*} value - Reference on object for which check should be done.
     * @return {Boolean} `true` in case if passed `value` has _non-null_ and not `undefined` value.
     */
    static isDefined(value) {
        return value !== null && value !== undefined;
    }

    /**
     * Check whether passed `value` is empty or not.
     *
     * @param {*} value - Reference on object for which check should be done.
     * @return {Boolean} `true` in case if passed `value` is 0 length or doesn't have any key/values in it.
     */
    static isEmpty(value) {
        if (TypeValidator.isDefined(value)) {
            if (TypeValidator.isTypeOf(value, String) || Array.isArray(value)) {
                return value.length === 0;
            }

            if (TypeValidator.isTypeOf(value, Number)) {
                return value === 0;
            }

            if (typeof value === 'object') {
                return Object.keys(value).length === 0;
            }
        }
        return true;
    }

    /**
     * Check whether passed `value` represent not empty object or not.
     *
     * @param {*} value - Reference on object for which check should be done.
     * @return {Boolean} `true` in case if some data is stored in `value`.
     */
    static notEmpty(value) {
        return !TypeValidator.isEmpty(value);
    }

    /**
     * Check whether all members of _array_ is typeof/instanceof specified `type`.
     *
     * @param {Array} values - Reference on array for which every element type check should be done.
     * @param {(function|string)} type - Reference on value which should be used as type reference.
     * @param {function(value):Boolean} [valueCheckCallback] - Reference on function which additionally can be use used to verify value by calling
     *     code.
     * @return {Boolean} `true` in case if all members of _array_ is typeof/instanceof specified `type`.
     *
     * @throws {TypeError} In case if passed `values` is not type of _array_.
     */
    static isArrayOf(values, type, valueCheckCallback) {
        if (Array.isArray(values)) {
            valueCheckCallback = valueCheckCallback || (() => true);
            return values.every(value => TypeValidator.isTypeOf(value, type) && valueCheckCallback(value));
        }
        throwError(new TypeError('Unexpected values type (array expected).'));
    }

    /**
     * Check whether passed `value` is typeof/instanceof specified `type`.
     *
     * @param {*} value - Reference on object for which type check should be done.
     * @param {(function|string)} type - Reference on value which should be used as type reference.
     * @return {Boolean} `true` in case if value is typeof/instanceof specified `type`.
     *
     * @throws {TypeError} In case if passed `type` is not type of _string_ or _class_.
     */
    static isTypeOf(value, type) {
        let validType = typeof type === 'function' || typeof type === 'string';
        if (validType) {
            let typeName = ((typeof type === 'string') ? type : type.name).toLowerCase();
            if (typeName === 'object') {
                return TypeValidator.isObject(value);
            }
            if (TypeValidator.isPrimitive(value)) {
                // eslint-disable-next-line valid-typeof
                return typeof value === typeName;
            }
            if (typeof type === 'string') {
                return value.constructor.name.toLowerCase() === type.toLowerCase();
            }
            return value instanceof type;
        }
        throwError(new TypeError('Unexpected type data type (string or Class expected).'));
    }

    /**
     * Check whether passed `value` has different data type then `type`.
     *
     * @param {*} value - Reference on object for which type check should be done.
     * @param {(function|string)} type - Reference on value which should be used as type reference.
     * @return {Boolean} `true` in case if value fails typeof/instanceof check against `type`.
     */
    static notTypeOf(value, type) {
        return !TypeValidator.isTypeOf(value, type);
    }

    /**
     * Check whether passed `value` is equal to one of passed `variants`.
     *
     * @param {String} value - Reference on object for which check should be done.
     * @param {String[]} variants - Reference on array of objects inside of which `values` should be checked.
     * @return {Boolean} `true` in case if passed `value` has been found inside of `variants`.
     *
     * @throws {TypeError} In case if passed `value` is not type of _string_.
     * @throws {TypeError} In case if passed `variants` is not type of _array_ or it's entries not type of _string_.
     */
    static isOneOf(value, variants) {
        if (TypeValidator.isArrayOf(variants, String) && TypeValidator.isTypeOf(value, String)) {
            return TypeValidator.isDefined(value) && variants.includes(value);
        }
        if (!TypeValidator.isTypeOf(value, String)) {
            throwError(new TypeError('Unexpected value type (string expected).'));
        } else {
            throwError(new TypeError('Unexpected variants type (array expected) or keys entries has unexpected values.'));
        }
    }

    /**
     * Check whether passed `value` represent object and it's keys are listed in `keys`.
     *
     * @param {*} value - Reference on object for which check should be done.
     * @param {String[]} keys - List of keys which is allowed to be in passed `value`.
     * @return {Boolean} `true` in case if all object's keys are listed in passed `keys` list.
     *
     * @throws {TypeError} In case if passed `value` is not type of _object_.
     * @throws {TypeError} In case if passed `keys` is not type of _array_ or it's entries not type of _string_.
     */
    static hasKnownKeys(value, keys) {
        if (TypeValidator.isObject(value) && TypeValidator.isArrayOf(keys, String)) {
            return Object.keys(value).every(key => TypeValidator.isOneOf(key, keys));
        }
        if (!TypeValidator.isArrayOf(keys, String)) {
            throwError(new TypeError('Unexpected keys type (array expected) or keys entries has unexpected values.'));
        } else {
            throwError(new TypeError('Unexpected value type (object expected).'));
        }
    }

    /**
     * Check whether values type stored in `value` object match specified `type`.
     *
     * @param {*} value - Reference on object for which check should be done.
     * @param {(function|string)} type - Reference on value which should be used as type reference.
     * @return {Boolean} `true` in case if all values in object match specified data `type`.
     *
     * @throws {TypeError} In case if passed `value` is not type of _object_.
     */
    static hasValuesOf(value, type) {
        if (TypeValidator.isObject(value)) {
            return TypeValidator.isArrayOf(Object.values(value), type);
        }
        throwError(new TypeError('Unexpected value type (object expected).'));
    }

    /**
     * Check whether passed `value` is plain Object or not.
     *
     * @param {*} value - Reference on object for which check should be done.
     * @return {Boolean} `true` in case if object represent simple Object instance.
     */
    static isObject(value) {
        if (!TypeValidator.isPrimitive(value) && !Array.isArray(value)) {
            let ObjProto = Object.prototype;
            if (ObjProto.toString.call(value) === '[object Object]' && TypeValidator.isTypeOf(value.constructor, 'function')) {
                let proto = value.constructor.prototype;
                return !TypeValidator.isPrimitive(proto) && !Array.isArray(proto) && ObjProto.toString.call(proto) === '[object Object]'
                  && ObjProto.hasOwnProperty.call(proto, 'isPrototypeOf');
            }
        }
        return false;
    }

    /**
     * Check whether passed value has primitive data type or not.
     *
     * @param {*} value - Reference on object for which type check should be done.
     * @return {Boolean} `true` in case if `value` is _null_ or not `object` nor `function`.
     */
    static isPrimitive(value) {
        if (value === null) {
            return true;
        }
        return typeof value !== 'object' && typeof value !== 'function';
    }
}
