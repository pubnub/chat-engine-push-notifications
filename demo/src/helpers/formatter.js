import { NativeModules } from 'react-native';

const { CENNotifications } = NativeModules;

const getChatName = (chatChannel) => {
    const components = chatChannel.split('#');
    return components.length === 1 ? components[0] : components[components.length - 1];
};

export default function formatter(eventPayload) {
    const gatewayMap = { ios: 'apns', android: 'gcm' };
    let chatName = getChatName(eventPayload.chat.channel);
    const notificationsPayload = {};

    let notificationTitle = null;
    let notificationBody = null;
    let notificationTicker = null;
    let notificationCategory = null;
    if (eventPayload.event === 'message') {
        notificationTitle = `${eventPayload.sender} send message in ${chatName}`;
        notificationBody = eventPayload.data.text;
        notificationTicker = 'New chat message';
        notificationCategory = CENNotifications.CATEGORY_MESSAGE;
    } else if (eventPayload.event === '$.invite') {
        chatName = getChatName(eventPayload.data.channel);
        notificationTitle = `Invitation from ${eventPayload.sender}`;
        notificationBody = `${eventPayload.sender} invited you to join '${chatName}'`;
        notificationTicker = 'New invitation to chat';
        notificationCategory = CENNotifications.CATEGORY_SOCIAL;
    }

    ['ios', 'android'].forEach((platform) => {
        let notificationPayload = {};
        if (platform === 'ios') {
            notificationPayload.aps = { alert: { title: notificationTitle, body: notificationBody } };
        } else {
            notificationPayload.data = { contentTitle: notificationTitle, contentText: notificationBody, ticker: notificationTicker };
            if (notificationCategory !== null && notificationCategory !== undefined) {
                notificationPayload.data.category = notificationCategory;
            }
            if (eventPayload.event === '$.invite') {
                notificationPayload.data.actions = ['Accept', 'Ignore'];
            }
        }
        notificationsPayload[gatewayMap[platform]] = notificationPayload;
    });
    return notificationsPayload;
};