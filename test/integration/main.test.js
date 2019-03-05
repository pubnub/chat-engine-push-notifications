/* eslint-disable no-unused-expressions,no-new,no-new-wrappers,no-new-object,no-array-constructor,import/named */
/* global test, expect, jasmine */
import ChatEngineCore from 'chat-engine';
import { plugin } from '../../src/plugin';

// noinspection ES6ModulesDependencies,NodeModulesDependencies
jest.mock('NativeModules', () => ({
    CENNotifications: {
        receiveMissedEvents: jest.fn(),
        formatNotificationPayload: jest.fn((nativePayload, callback) => callback(nativePayload, false))
    }
}));

describe('integration::ChatEngineCore', () => {
    let chatEngine;

    beforeEach(() => {
        chatEngine = ChatEngineCore.create({ publishKey: process.env.PUBLISH_KEY, subscribeKey: process.env.SUBSCRIBE_KEY });
    });

    test('should provide interface for proto plugins', () => {
        expect(chatEngine.proto).toBeDefined();
    });

    test('should register proto plugin', () => {
        chatEngine.proto('Me', plugin({ events: ['$.invite', 'message'], platforms: { ios: true, android: true } }));
        expect(chatEngine.protoPlugins.Me.length).toBeGreaterThan(0);
    });
});

describe('integration::ChatEngineNotifications', () => {
    let chatEngine;

    beforeEach(() => {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
        chatEngine = ChatEngineCore.create({ publishKey: process.env.PUBLISH_KEY, subscribeKey: process.env.SUBSCRIBE_KEY });
        chatEngine.on('$.error.*', (error) => {
            console.log('ERROR:', error);
        });
    });

    afterEach(() => {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 7000;
    });

    test('should add \'notifications\' property to Me', (done) => {
        chatEngine.proto('Me', plugin({ events: ['$.invite', 'message'], platforms: { ios: true, android: true } }));
        chatEngine.on('$.ready', () => {
            expect(chatEngine.me.notifications).toBeDefined();
            jest.clearAllTimers();
            done();
        });
        chatEngine.connect('pubnub', { works: true }, 'pubnub-secret');
    });

    test('should use user-provided formatter with no notification appending ({} returned from formatter)', (done) => {
        const deviceToken = '0000000000000000000000000000000000000000000000000000000000000000';
        const formatter = () => ({});
        let messageReceived = false;
        chatEngine.proto('Me', plugin({
            events: ['$.invite', 'message'],
            platforms: { ios: true, android: true },
            formatter
        }));
        chatEngine.on('$.ready', () => {
            const messageHandler = (message) => {
                messageReceived = true;
                chatEngine.me.direct.off('message', messageHandler);
                expect(message.pn_apns).not.toBeDefined();
                expect(message.pn_gcm).not.toBeDefined();
                jest.clearAllTimers();
                done();
            };

            const registrationCompletionHandler = (error) => {
                if (error) {
                    jest.clearAllTimers();
                    done();
                    return;
                }

                chatEngine.me.direct.on('message', messageHandler);
                chatEngine.me.direct.emit('message', { message: 'For chat' });
                let retryInterval = setInterval(() => {
                    if (!messageReceived) {
                        chatEngine.me.direct.emit('message', { message: 'For chat' });
                    } else {
                        clearInterval(retryInterval);
                    }
                }, 100);
            };

            const connectionHandler = () => {
                chatEngine.me.direct.off('$.connected', connectionHandler);
                chatEngine.me.notifications.enable([chatEngine.me.direct], deviceToken, registrationCompletionHandler);
            };

            if (!chatEngine.me.direct.connected) {
                chatEngine.me.direct.on('$.connected', connectionHandler);
            } else {
                connectionHandler();
            }
        });

        chatEngine.connect('pubnub', { works: true }, 'pubnub-secret');
    });

    test('should use user-provided formatter to append push notification to published message', (done) => {
        const formatter = () => ({ apns: { aps: { alert: 'Title from formatted function #1' } } });
        const deviceToken = '0000000000000000000000000000000000000000000000000000000000000000';
        let messageReceived = false;
        chatEngine.proto('Me', plugin({
            events: ['$.invite', 'message'],
            platforms: { ios: true, android: true },
            formatter
        }));
        chatEngine.on('$.ready', () => {
            const messageHandler = (message) => {
                messageReceived = true;
                chatEngine.me.direct.off('message', messageHandler);
                expect(message.pn_apns).toBeDefined();
                expect(message.pn_apns.aps.alert).toEqual(formatter().apns.aps.alert);
                expect(message.pn_apns.cepayload).toBeDefined();
                expect(message.pn_apns.cepayload.event).toBeDefined();
                expect(message.pn_apns.cepayload.category).toBeDefined();
                expect(message.pn_apns.cepayload.chat).toBeDefined();
                expect(message.pn_apns.cepayload.data).toBeDefined();
                expect(message.pn_apns.cepayload.sender).toBeDefined();
                jest.clearAllTimers();
                done();
            };

            const registrationCompletionHandler = (error) => {
                if (error) {
                    jest.clearAllTimers();
                    done();
                    return;
                }

                chatEngine.me.direct.on('message', messageHandler);
                chatEngine.me.direct.emit('message', { message: 'For chat' });
                let retryInterval = setInterval(() => {
                    if (!messageReceived) {
                        chatEngine.me.direct.emit('message', { message: 'For chat' });
                    } else {
                        clearInterval(retryInterval);
                    }
                }, 500);
            };

            const connectionHandler = () => {
                chatEngine.me.direct.off('$.connected', connectionHandler);
                chatEngine.me.notifications.enable([chatEngine.me.direct], deviceToken, registrationCompletionHandler);
            };
            if (!chatEngine.me.direct.connected) {
                chatEngine.me.direct.on('$.connected', connectionHandler);
            } else {
                connectionHandler();
            }
        });
        chatEngine.connect('pubnub', { works: true }, 'pubnub-secret');
    });

    test('should use default formatter for $.invite', (done) => {
        chatEngine.proto('Me', plugin({ events: ['$.invite', 'message'], platforms: { ios: true, android: true } }));
        const deviceToken = '0000000000000000000000000000000000000000000000000000000000000000';
        let inviteReceived = false;
        chatEngine.on('$.ready', () => {
            const chat = new chatEngine.Chat('secret-meeting');
            const invitationHandler = (message) => {
                inviteReceived = true;
                chatEngine.me.direct.off('$.invite', invitationHandler);
                expect(message.pn_apns).toBeDefined();
                expect(message.pn_apns.aps.category).toBeDefined();
                expect(message.pn_apns.cepayload).toBeDefined();
                expect(message.pn_gcm).toBeDefined();
                expect(message.pn_gcm.data.cepayload).toBeDefined();
                jest.clearAllTimers();
                done();
            };

            const registrationCompletionHandler = (error) => {
                if (error) {
                    jest.clearAllTimers();
                    done();
                    return;
                }

                chatEngine.me.direct.on('$.invite', invitationHandler);
                chat.invite(chatEngine.me);
                let retryInterval = setInterval(() => {
                    if (!inviteReceived) {
                        chat.invite(chatEngine.me);
                    } else {
                        clearInterval(retryInterval);
                    }
                }, 500);
            };

            const connectionHandler = () => {
                chat.off('$.connected', connectionHandler);
                chatEngine.me.notifications.enable([chatEngine.me.direct], deviceToken, registrationCompletionHandler);
            };
            chat.on('$.connected', connectionHandler);
        });
        chatEngine.connect('pubnub', { works: true }, 'pubnub-secret');
    });

    test('should send $notifications.seen event', (done) => {
        const notification = { notification: { aps: { alert: 'PubNub is awesome!' }, cepayload: { eid: 'unique' } }, foreground: true };
        const deviceToken = '0000000000000000000000000000000000000000000000000000000000000000';
        let messageReceived = false;
        chatEngine.proto('Me', plugin({ events: ['$.invite', 'message'], platforms: { ios: true, android: true } }));
        chatEngine.on('$.ready', () => {
            const messageHandler = (message) => {
                messageReceived = true;
                chatEngine.me.direct.off('$notifications.seen', messageHandler);
                expect(message.pn_apns).toBeDefined();
                expect(message.pn_apns.cepayload).toBeDefined();
                expect(message.pn_apns.cepayload.data.eid).toEqual(notification.notification.cepayload.eid);
                expect(message.pn_gcm).toBeDefined();
                expect(message.pn_gcm.data.cepayload).toBeDefined();
                expect(message.pn_gcm.data.cepayload.data.eid).toEqual(notification.notification.cepayload.eid);
                jest.clearAllTimers();
                done();
            };

            const registrationCompletionHandler = (error) => {
                if (error) {
                    jest.clearAllTimers();
                    done();
                    return;
                }

                chatEngine.me.direct.on('$notifications.seen', messageHandler);
                chatEngine.me.notifications.markNotificationAsSeen(notification);
                let retryInterval = setInterval(() => {
                    if (!messageReceived) {
                        chatEngine.me.notifications.markNotificationAsSeen(notification);
                    } else {
                        clearInterval(retryInterval);
                    }
                }, 500);
            };

            const connectionHandler = () => {
                chatEngine.me.direct.off('$.connected', connectionHandler);
                chatEngine.me.notifications.enable([chatEngine.me.direct], deviceToken, registrationCompletionHandler);
            };
            if (!chatEngine.me.direct.connected) {
                chatEngine.me.direct.on('$.connected', connectionHandler);
            } else {
                connectionHandler();
            }
        });
        chatEngine.connect('pubnub', { works: true }, 'pubnub-secret');
    });
});
