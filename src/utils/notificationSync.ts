export const NOTIFICATION_SETTINGS_EVENT = 'notification-settings-updated';

export interface NotificationSettingsData {
  email_notifications_enabled: boolean;
  notification_days: number[];
  notification_time: string;
  timezone: string;
}

export const broadcastSettingsUpdate = (settings: NotificationSettingsData) => {
  const event = new CustomEvent(NOTIFICATION_SETTINGS_EVENT, {
    detail: settings
  });
  window.dispatchEvent(event);
};

export const subscribeToSettingsUpdates = (
  callback: (settings: NotificationSettingsData) => void
) => {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<NotificationSettingsData>;
    callback(customEvent.detail);
  };
  
  window.addEventListener(NOTIFICATION_SETTINGS_EVENT, handler);
  
  return () => {
    window.removeEventListener(NOTIFICATION_SETTINGS_EVENT, handler);
  };
};
