import { LocalNotifications } from '@capacitor/local-notifications';
import { useState, useEffect } from 'react';

export const useNativeNotifications = () => {
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const result = await LocalNotifications.checkPermissions();
      setPermissionGranted(result.display === 'granted');
    } catch (error) {
      console.error('Error checking notification permissions:', error);
    }
  };

  const requestPermissions = async () => {
    try {
      const result = await LocalNotifications.requestPermissions();
      setPermissionGranted(result.display === 'granted');
      return result.display === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  };

  const scheduleNotification = async (options: {
    title: string;
    body: string;
    id?: number;
    schedule?: { at: Date };
  }) => {
    if (!permissionGranted) {
      const granted = await requestPermissions();
      if (!granted) {
        throw new Error('Notification permissions not granted');
      }
    }

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: options.title,
            body: options.body,
            id: options.id || Date.now(),
            schedule: options.schedule,
            sound: 'default',
            attachments: undefined,
            actionTypeId: '',
            extra: undefined
          }
        ]
      });
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  };

  const sendImmediateNotification = async (title: string, body: string) => {
    await scheduleNotification({ title, body });
  };

  const scheduleStatusReminder = async (message: string, delayMinutes: number = 60) => {
    const scheduledTime = new Date();
    scheduledTime.setMinutes(scheduledTime.getMinutes() + delayMinutes);

    await scheduleNotification({
      title: 'Trakkit Reminder',
      body: message,
      schedule: { at: scheduledTime }
    });
  };

  return {
    permissionGranted,
    requestPermissions,
    scheduleNotification,
    sendImmediateNotification,
    scheduleStatusReminder
  };
};
