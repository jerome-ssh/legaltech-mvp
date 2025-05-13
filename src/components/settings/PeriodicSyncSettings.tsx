import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const SYNC_TYPES = [
  { value: 'cases', label: 'Cases' },
  { value: 'documents', label: 'Documents' },
  { value: 'messages', label: 'Messages' }
];

const SYNC_INTERVALS = [
  { value: '15', label: '15 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '60', label: '1 hour' },
  { value: '120', label: '2 hours' },
  { value: '240', label: '4 hours' }
];

export default function PeriodicSyncSettings() {
  const { user } = useUser();
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  const [settings, setSettings] = useState<Record<string, { enabled: boolean; interval: string }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, [user?.id]);

  const loadSettings = async () => {
    if (!user?.id) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('clerk_id', user.id)
        .single();

      if (!profile) return;

      const { data: syncSettings } = await supabase
        .from('periodic_sync_settings')
        .select('*')
        .eq('profile_id', profile.id);

      const settingsMap = SYNC_TYPES.reduce((acc, type) => {
        const setting = syncSettings?.find(s => s.sync_type === type.value);
        acc[type.value] = {
          enabled: !!setting,
          interval: setting?.interval_minutes?.toString() || '60'
        };
        return acc;
      }, {} as Record<string, { enabled: boolean; interval: string }>);

      setSettings(settingsMap);
    } catch (error) {
      console.error('Error loading sync settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sync settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (syncType: string) => {
    if (!user?.id) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('clerk_id', user.id)
        .single();

      if (!profile) return;

      const newEnabled = !settings[syncType]?.enabled;

      if (newEnabled) {
        await supabase
          .from('periodic_sync_settings')
          .upsert({
            profile_id: profile.id,
            sync_type: syncType,
            interval_minutes: parseInt(settings[syncType]?.interval || '60')
          });
      } else {
        await supabase
          .from('periodic_sync_settings')
          .delete()
          .eq('profile_id', profile.id)
          .eq('sync_type', syncType);
      }

      setSettings(prev => ({
        ...prev,
        [syncType]: {
          ...prev[syncType],
          enabled: newEnabled
        }
      }));

      toast({
        title: 'Success',
        description: `Sync ${newEnabled ? 'enabled' : 'disabled'} for ${syncType}`
      });
    } catch (error) {
      console.error('Error updating sync settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update sync settings',
        variant: 'destructive'
      });
    }
  };

  const handleIntervalChange = async (syncType: string, interval: string) => {
    if (!user?.id || !settings[syncType]?.enabled) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('clerk_id', user.id)
        .single();

      if (!profile) return;

      await supabase
        .from('periodic_sync_settings')
        .update({ interval_minutes: parseInt(interval) })
        .eq('profile_id', profile.id)
        .eq('sync_type', syncType);

      setSettings(prev => ({
        ...prev,
        [syncType]: {
          ...prev[syncType],
          interval
        }
      }));

      toast({
        title: 'Success',
        description: `Sync interval updated for ${syncType}`
      });
    } catch (error) {
      console.error('Error updating sync interval:', error);
      toast({
        title: 'Error',
        description: 'Failed to update sync interval',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Periodic Sync Settings</CardTitle>
        <CardDescription>
          Configure how often the app syncs data in the background
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {SYNC_TYPES.map(type => (
          <div key={type.value} className="flex items-center justify-between space-x-4">
            <div className="space-y-1">
              <Label htmlFor={`sync-${type.value}`}>{type.label}</Label>
              <p className="text-sm text-muted-foreground">
                Automatically sync {type.label.toLowerCase()} in the background
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Select
                value={settings[type.value]?.interval || '60'}
                onValueChange={(value) => handleIntervalChange(type.value, value)}
                disabled={!settings[type.value]?.enabled}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Select interval" />
                </SelectTrigger>
                <SelectContent>
                  {SYNC_INTERVALS.map(interval => (
                    <SelectItem key={interval.value} value={interval.value}>
                      {interval.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Switch
                id={`sync-${type.value}`}
                checked={settings[type.value]?.enabled || false}
                onCheckedChange={() => handleToggle(type.value)}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
} 