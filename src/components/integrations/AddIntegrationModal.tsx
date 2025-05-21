'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';

interface AddIntegrationModalProps {
  type: 'calendar' | 'email' | 'payment';
  onAdd: (data: {
    provider: string;
    credentials: Record<string, string>;
  }) => void;
}

const providers = {
  calendar: ['Google Calendar', 'Microsoft Outlook', 'Apple Calendar'],
  email: ['Gmail', 'Microsoft Outlook', 'Yahoo Mail'],
  payment: ['Stripe', 'PayPal', 'Square'],
};

export function AddIntegrationModal({ type, onAdd }: AddIntegrationModalProps) {
  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState('');
  const [credentials, setCredentials] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ provider, credentials });
    setOpen(false);
    setProvider('');
    setCredentials({});
  };

  const getCredentialFields = () => {
    switch (type) {
      case 'calendar':
        return ['API Key', 'Client ID', 'Client Secret'];
      case 'email':
        return ['Email', 'Password', 'IMAP Server'];
      case 'payment':
        return ['API Key', 'Secret Key', 'Webhook Secret'];
      default:
        return [];
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Integration
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add {type.charAt(0).toUpperCase() + type.slice(1)} Integration</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger>
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
                {providers[type].map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {getCredentialFields().map((field) => (
            <div key={field} className="space-y-2">
              <Label htmlFor={field}>{field}</Label>
              <Input
                id={field}
                type="password"
                value={credentials[field] || ''}
                onChange={(e) =>
                  setCredentials((prev) => ({
                    ...prev,
                    [field]: e.target.value,
                  }))
                }
              />
            </div>
          ))}

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Add Integration</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 