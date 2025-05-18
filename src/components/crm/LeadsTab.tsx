import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Search, Filter, Activity, Phone, Mail, Building, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { DragDropContext, Droppable, Draggable, DroppableProvided, DraggableProvided } from '@hello-pangea/dnd';
import { AppError } from '@/lib/errors';
import { CRMErrorBoundary } from './ErrorBoundary';
import { motion } from 'framer-motion';

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
  new: { title: 'New Leads', color: 'from-blue-500 to-cyan-500' },
  contacted: { title: 'Contacted', color: 'from-purple-500 to-indigo-500' },
  qualified: { title: 'Qualified', color: 'from-green-500 to-emerald-500' },
  proposal: { title: 'Proposal', color: 'from-yellow-500 to-amber-500' },
  negotiation: { title: 'Negotiation', color: 'from-orange-500 to-red-500' },
  closed: { title: 'Closed', color: 'from-gray-500 to-slate-500' }
};

function LeadsTabContent() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredLeads = leads.filter(lead =>
    lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (lead.company && lead.company.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="bg-white/50 dark:bg-[#1a2540]/50 backdrop-blur-sm border border-gray-200/20 dark:border-gray-800/20 shadow-lg">
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
        <p className="text-red-500 dark:text-red-400">Error loading leads: {error}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Leads</h2>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/50 dark:bg-[#1a2540]/50 backdrop-blur-sm border-gray-200/20 dark:border-gray-800/20"
            />
          </div>
          <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Object.entries(statusColumns).map(([status, { title, color }]) => (
            <div key={status} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{title}</h3>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {filteredLeads.filter(lead => lead.status === status).length}
                </span>
              </div>
              <Droppable droppableId={status}>
                {(provided: DroppableProvided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-4 min-h-[200px] p-2 rounded-lg bg-white/30 dark:bg-[#1a2540]/30 backdrop-blur-sm border border-gray-200/20 dark:border-gray-800/20"
                  >
                    {filteredLeads
                      .filter((lead) => lead.status === status)
                      .map((lead, index) => (
                        <Draggable key={lead.id} draggableId={lead.id} index={index}>
                          {(provided: DraggableProvided) => (
                            <motion.div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <Card className="bg-white/50 dark:bg-[#1a2540]/50 backdrop-blur-sm border border-gray-200/20 dark:border-gray-800/20 shadow-lg hover:shadow-xl transition-all duration-300">
                                <CardContent className="p-4">
                                  <div className="space-y-3">
                                    <div className="flex justify-between items-start">
                                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                        {lead.name}
                                      </h4>
                                      <div className={`h-2 w-2 rounded-full bg-gradient-to-r ${color}`} />
                                    </div>
                                    <div className="space-y-2">
                                      <div className="flex items-center text-gray-600 dark:text-gray-300">
                                        <Mail className="w-4 h-4 mr-2" />
                                        <p className="text-sm">{lead.email}</p>
                                      </div>
                                      {lead.phone && (
                                        <div className="flex items-center text-gray-600 dark:text-gray-300">
                                          <Phone className="w-4 h-4 mr-2" />
                                          <p className="text-sm">{lead.phone}</p>
                                        </div>
                                      )}
                                      {lead.company && (
                                        <div className="flex items-center text-gray-600 dark:text-gray-300">
                                          <Building className="w-4 h-4 mr-2" />
                                          <p className="text-sm">{lead.company}</p>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-gray-200/20 dark:border-gray-800/20">
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        Source: {lead.source || 'N/A'}
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                                      >
                                        <ArrowRight className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
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