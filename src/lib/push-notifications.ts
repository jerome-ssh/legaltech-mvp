import { toast } from '@/components/ui/use-toast';

export async function registerPushNotifications() {
  try {
    const registration = await navigator.serviceWorker.register('/push-sw.js');
    
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      toast({
        title: 'Notification Permission Required',
        description: 'Please enable notifications to receive important updates.',
        variant: 'destructive',
      });
      return null;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    });

    // Send subscription to server
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });

    return subscription;
  } catch (error) {
    console.error('Failed to register push notifications:', error);
    toast({
      title: 'Notification Registration Failed',
      description: 'Unable to set up push notifications. Please try again later.',
      variant: 'destructive',
    });
    return null;
  }
}

export async function unregisterPushNotifications() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });
    }
  } catch (error) {
    console.error('Failed to unregister push notifications:', error);
    toast({
      title: 'Error',
      description: 'Failed to disable push notifications. Please try again.',
      variant: 'destructive',
    });
  }
}

export async function checkPushNotificationSupport() {
  if (!('serviceWorker' in navigator)) {
    toast({
      title: 'Not Supported',
      description: 'Push notifications are not supported in your browser.',
      variant: 'destructive',
    });
    return false;
  }

  if (!('PushManager' in window)) {
    toast({
      title: 'Not Supported',
      description: 'Push notifications are not supported in your browser.',
      variant: 'destructive',
    });
    return false;
  }

  return true;
}

export async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return false;
  }
} 