import { useState } from 'react';
import { Share2, Facebook, Twitter, MessageCircle, Copy, Check, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { getShareUrl, getShareText, shareConfig } from '@/lib/shareConfig';

interface ShareButtonProps {
  title?: string;
  text?: string;
  url?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  preferPlayStore?: boolean; // Whether to prefer Play Store link when available
}

export function ShareButton({ 
  title,
  text,
  url,
  variant = "outline",
  size = "default",
  className = "",
  preferPlayStore = true
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  // Get dynamic URL and text based on environment
  const dynamicUrl = url || getShareUrl(preferPlayStore);
  const dynamicText = text || getShareText(dynamicUrl);
  const dynamicTitle = title || shareConfig.appName;
  
  const encodedUrl = encodeURIComponent(dynamicUrl);
  const encodedTitle = encodeURIComponent(dynamicTitle);
  const encodedText = encodeURIComponent(dynamicText);

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
  };

  const handleCopyLink = async (urlToCopy: string = dynamicUrl) => {
    try {
      await navigator.clipboard.writeText(urlToCopy);
      setCopied(true);
      const isPlayStore = urlToCopy === shareConfig.playStoreUrl;
      toast({
        title: "Link copied!",
        description: isPlayStore 
          ? "Play Store link copied to clipboard" 
          : "Share link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleShare = (platform: string) => {
    window.open(shareLinks[platform as keyof typeof shareLinks], '_blank', 'width=600,height=400');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: dynamicTitle,
          text: dynamicText,
          url: dynamicUrl,
        });
      } catch (err) {
        // User cancelled or share failed, fallback to dropdown
        console.log('Native share cancelled or failed');
      }
    }
  };

  // Check if native sharing is available
  const hasNativeShare = navigator.share && navigator.canShare && navigator.canShare({ 
    title: dynamicTitle, 
    text: dynamicText, 
    url: dynamicUrl 
  });

  if (hasNativeShare) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={handleNativeShare}
        className={className}
      >
        <Share2 className="h-4 w-4 mr-2" />
        Share
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={() => handleShare('facebook')}>
          <Facebook className="h-4 w-4 mr-2 text-blue-600" />
          Share on Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('twitter')}>
          <Twitter className="h-4 w-4 mr-2 text-blue-400" />
          Share on Twitter
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('whatsapp')}>
          <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
          Share on WhatsApp
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Current app link (Replit or production web) */}
        <DropdownMenuItem onClick={() => handleCopyLink(getShareUrl(false))}>
          {copied ? (
            <Check className="h-4 w-4 mr-2 text-green-600" />
          ) : (
            <Copy className="h-4 w-4 mr-2" />
          )}
          Copy Web App Link
        </DropdownMenuItem>
        
        {/* Play Store link (only show if configured) */}
        {shareConfig.playStoreUrl && (
          <DropdownMenuItem onClick={() => handleCopyLink(shareConfig.playStoreUrl!)}>
            <Smartphone className="h-4 w-4 mr-2 text-green-700" />
            Copy Play Store Link
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}