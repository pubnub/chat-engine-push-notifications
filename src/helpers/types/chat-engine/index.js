/**
 * @file File contain only @typedefs for ChatEngine module, so there is no need to import it.
 * @author Serhii Mamontov <sergey@pubnub.com>
 */

/**
 * Chat engine core module.
 *
 * @typedef {Object} ChatEngine
 * @property {Me} me - Reference on currently active user which use this {@link ChatEngine} instance.
 * @property {Object.<string, Chat>} chats - List of chats which is known for {@link ChatEngine}.
 * @property {PubNub} pubnub - Reference on initialized PubNub client instance which should be used to communicate with PubNub service.
 */

/**
 * Current chat engine user model.
 *
 * @typedef {Object} Me
 * @extends {User}
 * @property {Chat} direct - Reference on chat which can be used to send direct messages and events to current {@link ChatEngine} user.
 * @property {Object.<String, Chat>} chats - Map of chats in which user currently participate.
 */

/**
 * Chat engine remote user.
 *
 * @typedef {Object} User
 * @property {String} uuid - Reference on identifier which has been provided by remote user during authorization process.
 * @property {Object.<String, Chat>} chats - Map of chats in which user currently participate.
 * @property {function(plugin: Object)} plugin - Plugin registration function.
 */

/**
 * @typedef {Object} Chat
 * @property {String} channel - Reference on name of channel which is used for real-time communication using PubNub service.
 * @property {function(plugin: Object)} plugin - Plugin registration function.
 */

/**
 * Emitted {@link Event} payload.
 *
 * @typedef {Object} ChatEngineEventPayload
 * @property {Chat} chat - Reference on {@link Chat} instance for which event has been emitted.
 * @property {String} event - Name of emitted event.
 * @property {String} sender - Reference on {@link Event} sender identifier (user which asked to emit this {@link Event})
 * @property {Object} data - Reference on data which has been sent along with emitted {@link Event}.
 */
