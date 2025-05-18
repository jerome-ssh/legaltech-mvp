import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface Lead {
  id: string;
  title: string;
  status: string;
  client_id: string;
  description?: string;
  created_at: string;
}

const leadColumns = ['Inquiry', 'Consultation', 'Proposal', 'Retained'];

const leadStatusMap: Record<string, string[]> = {
  'Inquiry': ['inquiry', 'new'],
  'Consultation': ['consultation', 'scheduled'],
  'Proposal': ['proposal', 'draft'],
  'Retained': ['retained', 'active']
};

const statusToColumn = (status: string): string => {
  for (const [column, statuses] of Object.entries(leadStatusMap)) {
    if (statuses.includes(status.toLowerCase())) {
      return column;
    }
  }
  return 'Inquiry';
};

const columnToStatus = (column: string): string => {
  return leadStatusMap[column][0];
};

function SortableLead({ lead }: { lead: Lead }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="bg-[#f0f6ff] dark:bg-[#1a2540] dark:text-white border-none shadow-none cursor-grab active:cursor-grabbing"
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-2">
          <button
            className="p-1 hover:bg-accent rounded-md"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
          <div className="flex-1">
            <div className="font-semibold text-foreground mb-1">
              {lead.title}
            </div>
            {lead.description && (
              <p className="text-sm text-muted-foreground mb-2">
                {lead.description}
              </p>
            )}
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">
                {new Date(lead.created_at).toLocaleDateString()}
              </span>
              <span className="text-cyan-400 font-medium">
                {lead.status}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function LeadsTab() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 300,
        tolerance: 8,
      },
    })
  );

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('cases')
          .select('id, title, status, client_id, description, created_at');

        if (error) throw error;
        setLeads(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load leads');
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeLead = leads.find((lead) => lead.id === active.id);
    if (!activeLead) return;

    const newStatus = columnToStatus(over.id as string);
    
    try {
      const { error } = await supabase
        .from('cases')
        .update({ status: newStatus })
        .eq('id', active.id);

      if (error) throw error;

      setLeads((leads) =>
        leads.map((lead) =>
          lead.id === active.id ? { ...lead, status: newStatus } : lead
        )
      );
    } catch (err) {
      console.error('Failed to update lead status:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex gap-6 min-w-[900px]">
        {leadColumns.map((col) => (
          <div key={col} className="flex-1 min-w-[220px]">
            <h3 className="text-lg font-semibold mb-4 text-cyan-400">{col}</h3>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="bg-[#f0f6ff] dark:bg-[#1a2540] dark:text-white border-none shadow-none">
                  <CardContent className="p-4">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
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
    <div className="w-full overflow-x-auto pb-4">
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 min-w-[900px]">
          {leadColumns.map((col) => (
            <div key={col} className="flex-1 min-w-[220px]">
              <h3 className="text-lg font-semibold mb-4 text-cyan-400">{col}</h3>
              <div className="space-y-4">
                <SortableContext
                  items={leads
                    .filter((lead) => leadStatusMap[col].includes(lead.status.toLowerCase()))
                    .map((lead) => lead.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {leads
                    .filter((lead) => leadStatusMap[col].includes(lead.status.toLowerCase()))
                    .map((lead) => (
                      <SortableLead key={lead.id} lead={lead} />
                    ))}
                </SortableContext>
              </div>
            </div>
          ))}
        </div>
        <DragOverlay>
          {activeId ? (
            <Card className="bg-[#f0f6ff] dark:bg-[#1a2540] dark:text-white border-none shadow-none w-[220px]">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="font-semibold text-foreground mb-1">
                      {leads.find((lead) => lead.id === activeId)?.title}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
} 