import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface ShareButtonProps {
  title: string;
  text: string;
  url: string;
  files?: File[];
}

export function ShareButton({ title, text, url, files }: ShareButtonProps) {
  const handleShare = async () => {
    try {
      if (!navigator.share) {
        toast({
          title: 'Not Supported',
          description: 'Sharing is not supported in your browser.',
          variant: 'destructive',
        });
        return;
      }

      const shareData: ShareData = {
        title,
        text,
        url,
      };

      if (files && files.length > 0) {
        shareData.files = files;
      }

      await navigator.share(shareData);
      
      toast({
        title: 'Shared Successfully',
        description: 'Content has been shared successfully.',
      });
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Failed to share:', error);
        toast({
          title: 'Error',
          description: 'Failed to share content. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <Button
      onClick={handleShare}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      <Share2 className="h-4 w-4" />
      Share
    </Button>
  );
} 