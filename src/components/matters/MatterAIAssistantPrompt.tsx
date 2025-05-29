import { useEffect, useState } from 'react';
import { Sparkles, ClipboardList, PlusCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MatterAIAssistantPromptProps {
  matterId: string;
  appliedTemplateId?: number | null;
  userFirstName?: string;
  onTemplateApplied?: () => void;
}

export function MatterAIAssistantPrompt({ matterId, appliedTemplateId, userFirstName, onTemplateApplied }: MatterAIAssistantPromptProps) {
  const [show, setShow] = useState(true);
  const [loading, setLoading] = useState(false);
  const [template, setTemplate] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!matterId || appliedTemplateId) return;
    setLoading(true);
    fetch(`/api/matter-templates/by-matter/${matterId}`)
      .then(res => res.json())
      .then(data => {
        if (data.template) setTemplate(data.template);
        else setError(data.error || 'No template found.');
      })
      .catch(() => setError('Failed to fetch template.'))
      .finally(() => setLoading(false));
  }, [matterId, appliedTemplateId]);

  if (!show || appliedTemplateId) return null;

  let friendlyError = error;
  if (error && (error.toLowerCase().includes('no template') || error.toLowerCase().includes('not found'))) {
    friendlyError = 'No suggested task list template is available for this matter type yet. You can create your own custom task list.';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 relative animate-fade-in">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          onClick={() => setShow(false)}
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-6 h-6 text-blue-400 animate-bounce" />
          <h2 className="text-lg font-bold text-gray-800">Welcome{userFirstName ? `, ${userFirstName}` : ', Attorney'}!</h2>
        </div>
        <p className="text-gray-600 mb-4">
          I'm your AI assistant, ready to help you get started on this matter. Would you like to use the suggested task list template, or create your own custom task list?
        </p>
        {loading ? (
          <div className="text-sm text-gray-400">Loading template...</div>
        ) : friendlyError ? (
          <div className="text-sm text-red-500 mb-2">{friendlyError}</div>
        ) : template ? (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <ClipboardList className="w-4 h-4 text-green-500" />
              <span className="font-medium text-gray-700">Suggested Task List Template:</span>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded p-2 max-h-32 overflow-y-auto text-xs">
              <ul className="list-disc pl-5">
                {template.tasks && template.tasks.length > 0 ? (
                  template.tasks.map((task: any, idx: number) => (
                    <li key={idx} className="mb-1">
                      <span className="font-semibold">{task.label}</span> <span className="text-gray-400">({task.stage})</span>
                    </li>
                  ))
                ) : (
                  <li>No tasks in this template.</li>
                )}
              </ul>
            </div>
          </div>
        ) : null}
        <div className="flex gap-3 mt-4">
          <Button
            disabled={actionLoading || !template}
            onClick={async () => {
              if (!template) return;
              setActionLoading(true);
              const res = await fetch(`/api/matter-templates/apply/${matterId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ templateId: template.id })
              });
              setActionLoading(false);
              if (res.ok) {
                setShow(false);
                onTemplateApplied?.();
              } else {
                const data = await res.json();
                setError(data.error || 'Failed to apply template.');
              }
            }}
            className="flex items-center gap-2"
          >
            <ClipboardList className="w-4 h-4" /> Use Template
          </Button>
          <Button
            variant="outline"
            disabled={actionLoading}
            onClick={() => {
              setShow(false);
              // Optionally, trigger a callback for custom task creation
            }}
            className="flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" /> Create My Own
          </Button>
        </div>
      </div>
    </div>
  );
} 