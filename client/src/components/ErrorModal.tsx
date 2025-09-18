import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Coins, X } from "lucide-react";

interface ErrorModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'error' | 'coins' | 'warning';
}

export function ErrorModal({ open, onClose, title, message, type = 'error' }: ErrorModalProps) {
  const getIcon = () => {
    switch (type) {
      case 'coins':
        return <Coins className="w-8 h-8 text-yellow-500" />;
      case 'warning':
        return <AlertTriangle className="w-8 h-8 text-orange-500" />;
      default:
        return <AlertTriangle className="w-8 h-8 text-red-500" />;
    }
  };

  const getHeaderColor = () => {
    switch (type) {
      case 'coins':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'warning':
        return 'text-orange-600 dark:text-orange-400';
      default:
        return 'text-red-600 dark:text-red-400';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <DialogHeader className="text-center space-y-4">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
          
          <div className="flex justify-center">
            {getIcon()}
          </div>
          
          <DialogTitle className={`text-xl font-semibold ${getHeaderColor()}`}>
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-center text-gray-600 dark:text-gray-300 leading-relaxed">
            {message}
          </p>
          
          <div className="flex justify-center pt-2">
            <Button 
              onClick={onClose}
              className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Got it
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}