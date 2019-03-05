/**
 * @file File contain only @typedefs for PubNub module, so there is no need to import it.
 *
 * @author Serhii Mamontov <sergey@pubnub.com>
 */

/**
 * PubNub client interface.
 *
 * @typedef {Object} PubNub
 * @property {Object} push - Reference on set of Push Notification management API.
 * @property {function(parameters: {channels: String[], device: String, pushGateway: String}, callback: PubNubStatusCallback)} push.addChannels - enable push
 *     notifications for specified `channels` list.
 * @property {function(parameters: {channels: String[], device: String, pushGateway: String}, callback: PubNubStatusCallback)} push.removeChannels - disable
 *     push notifications from specified `channels` list.
 * @property {function(parameters: {device: String, pushGateway: String}, callback: PubNubStatusCallback)} push.deleteDevice - remove all push notifications
 *     for device.
 */

/**
 * PubNub API call status callback.
 *
 * @typedef {function} PubNubStatusCallback
 * @param {Object} status - Reference on object which represent API call results.
 * @param {Object} [status.error] - Reference on API call error (if something wen wrong).
 */
