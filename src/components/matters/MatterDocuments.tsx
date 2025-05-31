import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  FileText, 
  Upload, 
  Search, 
  FolderOpen, 
  FileUp, 
  FileDown, 
  Trash2, 
  Share2, 
  Lock,
  Sparkles,
  FileCheck,
  FileClock,
  FileWarning,
  FileX
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { saveAs } from 'file-saver';

interface MatterDocumentsProps {
  matterId: string;
}

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  uploaded_at: string;
  status: 'active' | 'archived' | 'pending_review';
  category: string;
  version: number;
  metadata: {
    author?: string;
    last_modified?: string;
    ai_analysis?: {
      summary?: string;
      key_points?: string[];
      risk_level?: 'low' | 'medium' | 'high';
      suggested_actions?: string[];
    };
  };
}

// Helper to get profile_id from Clerk user ID
async function getProfileId(clerkId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('clerk_id', clerkId)
    .single();
  if (error || !data) throw new Error('Profile not found for user');
  return data.id;
}

// Helper to format AI analysis as text
function formatAIAnalysis(analysis: any) {
  if (!analysis) return '';
  let text = '';
  if (analysis.summary) text += `Summary:\n${analysis.summary}\n\n`;
  if (analysis.key_points && analysis.key_points.length) {
    text += 'Key Points:\n';
    analysis.key_points.forEach((pt: string) => { text += `- ${pt}\n`; });
    text += '\n';
  }
  if (analysis.risk_level) text += `Risk Level: ${analysis.risk_level}\n\n`;
  if (analysis.suggested_actions && analysis.suggested_actions.length) {
    text += 'Suggested Actions:\n';
    analysis.suggested_actions.forEach((act: string) => { text += `- ${act}\n`; });
  }
  return text;
}

export default function MatterDocuments({ matterId }: MatterDocumentsProps) {
  const { user } = useUser();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showDeletePrompt, setShowDeletePrompt] = useState(false);

  const categories = [
    { id: 'all', label: 'All Documents' },
    { id: 'pleadings', label: 'Pleadings' },
    { id: 'correspondence', label: 'Correspondence' },
    { id: 'evidence', label: 'Evidence' },
    { id: 'contracts', label: 'Contracts' },
    { id: 'reports', label: 'Reports' }
  ];

  useEffect(() => {
    fetchDocuments();
  }, [matterId]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/matters/${matterId}/documents`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch documents');
      }
      const { documents } = await response.json();
      setDocuments(documents || []);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: err.message || "Failed to fetch documents",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', file.name);

        const response = await fetch(`/api/matters/${matterId}/upload-document`, {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to upload document');
      }

      toast({
        title: "Success",
        description: "Documents uploaded successfully"
      });
      fetchDocuments();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to upload documents",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleAiAnalysis = async (document: Document) => {
    setAiAnalyzing(true);
    try {
      const response = await fetch(`/api/matters/${matterId}/documents/${document.id}/analyze`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('AI analysis failed');

      const analysis = await response.json();
      
      // Update document with AI analysis
      const { error } = await supabase
        .from('matter_documents')
        .update({
          metadata: {
            ...document.metadata,
            ai_analysis: analysis
          }
        })
        .eq('id', document.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "AI analysis completed"
      });
      fetchDocuments();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "AI analysis failed",
        variant: "destructive"
      });
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleDeleteDocument = async (document: Document) => {
    setSelectedDocument(document);
    setShowDeletePrompt(true);
  };

  const confirmDelete = async () => {
    if (!selectedDocument) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('matter-documents')
        .remove([`${matterId}/${selectedDocument.id}`]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('matter_documents')
        .delete()
        .eq('id', selectedDocument.id);

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Document deleted successfully"
      });
      fetchDocuments();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete document",
        variant: "destructive"
      });
    } finally {
      setShowDeletePrompt(false);
      setSelectedDocument(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <FileCheck className="w-4 h-4 text-green-500" />;
      case 'archived':
        return <FileClock className="w-4 h-4 text-gray-500" />;
      case 'pending_review':
        return <FileWarning className="w-4 h-4 text-yellow-500" />;
      default:
        return <FileX className="w-4 h-4 text-red-500" />;
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold">Matter Documents</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => document.getElementById('file-upload')?.click()}
            disabled={uploading}
          >
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
          <input
            id="file-upload"
            type="file"
            multiple
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search documents..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="text-center py-8">Loading documents...</div>
      ) : error ? (
        <div className="text-red-500 text-center py-8">{error}</div>
      ) : filteredDocuments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No documents found. Upload your first document to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => (
            <Card key={doc.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-blue-500" />
                    <div>
                      <h4 className="font-medium truncate max-w-[200px]">{doc.name}</h4>
                      <p className="text-sm text-gray-500">
                        {new Date(doc.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(doc.status)}
                  </div>
                </div>

                {doc.metadata.ai_analysis && (
                  <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Sparkles className="w-4 h-4 text-blue-500" />
                      <span>AI Analysis Available</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="ml-2"
                        onClick={() => {
                          const text = formatAIAnalysis(doc.metadata.ai_analysis);
                          const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
                          saveAs(blob, `${doc.name.replace(/\.[^/.]+$/, '')}-ai-analysis.txt`);
                        }}
                      >
                        Download Analysis
                      </Button>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-700"
                    onClick={() => handleAiAnalysis(doc)}
                    disabled={aiAnalyzing}
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    Analyze
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDeleteDocument(doc)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeletePrompt && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Delete Document</h3>
            <p className="mb-4">
              Are you sure you want to delete "{selectedDocument.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeletePrompt(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 