import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import {
  registerPushNotifications,
  unregisterPushNotifications,
  checkPushNotificationSupport,
  requestNotificationPermission,
} from '@/lib/push-notifications';
import { useUser } from '@clerk/nextjs';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface NotificationPreference {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

const DEFAULT_PREFERENCES = {
  case_updates: true,
  client_messages: true,
  document_updates: true,
  calendar_events: true,
};

export function NotificationPreferences() {
  const { user } = useUser();
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([
    {
      id: 'case_updates',
      title: 'Case Updates',
      description: 'Get notified about case status changes and deadlines',
      enabled: false,
    },
    {
      id: 'client_messages',
      title: 'Client Messages',
      description: 'Receive notifications for new client messages',
      enabled: false,
    },
    {
      id: 'document_updates',
      title: 'Document Updates',
      description: 'Get notified when documents are shared or updated',
      enabled: false,
    },
    {
      id: 'calendar_events',
      title: 'Calendar Events',
      description: 'Receive reminders for upcoming events and deadlines',
      enabled: false,
    },
  ]);

  const supabase = createClientComponentClient();

  useEffect(() => {
    checkSupport();
    loadPreferences();
  }, [user]);

  const checkSupport = async () => {
    const supported = await checkPushNotificationSupport();
    setIsSupported(supported);
  };

  const loadPreferences = async () => {
    if (!user) return;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('clerk_id', user.id)
        .single();

      if (error) throw error;

      if (profile?.notification_preferences) {
        setPreferences(prev => prev.map(pref => ({
          ...pref,
          enabled: profile.notification_preferences[pref.id] ?? DEFAULT_PREFERENCES[pref.id as keyof typeof DEFAULT_PREFERENCES],
        })));
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notification preferences.',
        variant: 'destructive',
      });
    }
  };

  const handleToggle = async (id: string) => {
    if (!user) return;

    const newPreferences = preferences.map(pref =>
      pref.id === id ? { ...pref, enabled: !pref.enabled } : pref
    );
    setPreferences(newPreferences);

    // Convert preferences array to object format
    const preferencesObject = newPreferences.reduce((acc, pref) => ({
      ...acc,
      [pref.id]: pref.enabled,
    }), {});

    if (!isRegistered && newPreferences.find(p => p.id === id)?.enabled) {
      const permission = await requestNotificationPermission();
      if (permission) {
        const subscription = await registerPushNotifications();
        if (subscription) {
          setIsRegistered(true);
          toast({
            title: 'Notifications Enabled',
            description: 'You will now receive notifications for selected updates.',
          });
        }
      }
    } else if (isRegistered && !newPreferences.some(p => p.enabled)) {
      await unregisterPushNotifications();
      setIsRegistered(false);
      toast({
        title: 'Notifications Disabled',
        description: 'You will no longer receive notifications.',
      });
    }

    // Save preferences to profile
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ notification_preferences: preferencesObject })
        .eq('clerk_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to save notification preferences.',
        variant: 'destructive',
      });
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Push notifications are not supported in your browser.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Choose which notifications you want to receive
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {preferences.map((preference) => (
          <div key={preference.id} className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor={preference.id}>{preference.title}</Label>
              <p className="text-sm text-muted-foreground">
                {preference.description}
              </p>
            </div>
            <Switch
              id={preference.id}
              checked={preference.enabled}
              onCheckedChange={() => handleToggle(preference.id)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
} 