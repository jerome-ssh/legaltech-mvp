import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { DragDropContext, Droppable, Draggable, DroppableProvided, DraggableProvided } from '@hello-pangea/dnd';
import { AppError } from '@/lib/errors';
import { CRMErrorBoundary } from './ErrorBoundary';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed';
  source: string;
  created_at: string;
}

const statusColumns = {
  new: 'New Leads',
  contacted: 'Contacted',
  qualified: 'Qualified',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  closed: 'Closed'
};

function LeadsTabContent() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/leads');
        if (!response.ok) {
          throw new Error('Failed to fetch leads');
        }

        const data = await response.json();
        
        if (mounted) {
          setLeads(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (mounted) {
          if (err instanceof AppError) {
            setError(err.message);
          } else {
            setError('An unexpected error occurred while loading leads');
            console.error('Error loading leads:', err);
          }
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, []);

  const onDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const newStatus = destination.droppableId as Lead['status'];

    // Update local state immediately for better UX
    const updatedLeads = Array.from(leads);
    const [movedLead] = updatedLeads.splice(source.index, 1);
    movedLead.status = newStatus;
    updatedLeads.splice(destination.index, 0, movedLead);
    setLeads(updatedLeads);

    try {
      const response = await fetch(`/api/leads/${movedLead.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update lead status');
      }
    } catch (err) {
      // Revert the local state if the update fails
      setLeads(leads);
      if (err instanceof AppError) {
        setError(err.message);
      } else {
        setError('Failed to update lead status');
        console.error('Error updating lead:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="bg-[#f0f6ff] dark:bg-[#1a2540] dark:text-white border-none shadow-none">
            <CardContent className="p-6">
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-4">
        <p className="text-destructive">Error loading leads: {error}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Leads</h2>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Lead
        </Button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Object.entries(statusColumns).map(([status, title]) => (
            <div key={status} className="space-y-4">
              <h3 className="text-lg font-medium">{title}</h3>
              <Droppable droppableId={status}>
                {(provided: DroppableProvided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-4 min-h-[200px]"
                  >
                    {leads && leads
                      .filter((lead) => lead.status === status)
                      .map((lead, index) => (
                        <Draggable key={lead.id} draggableId={lead.id} index={index}>
                          {(provided: DraggableProvided) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="bg-[#f0f6ff] dark:bg-[#1a2540] dark:text-white border-none shadow-none"
                            >
                              <CardContent className="p-4">
                                <h4 className="font-medium">
                                  {lead.name}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {lead.email}
                                </p>
                                {lead.phone && (
                                  <p className="text-sm text-muted-foreground">
                                    {lead.phone}
                                  </p>
                                )}
                                {lead.company && (
                                  <p className="text-sm text-muted-foreground">
                                    {lead.company}
                                  </p>
                                )}
                                <div className="mt-2 text-xs text-muted-foreground">
                                  Source: {lead.source || 'N/A'}
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}

export function LeadsTab() {
  return (
    <CRMErrorBoundary>
      <LeadsTabContent />
    </CRMErrorBoundary>
  );
} 