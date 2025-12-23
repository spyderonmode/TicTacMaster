import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorLogModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

export function ErrorLogModal({ open, onClose, title, message }: ErrorLogModalProps) {
  if (!open) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: '#1e293b',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '2px solid #ef4444'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
          <AlertCircle 
            style={{ 
              width: '24px', 
              height: '24px', 
              color: '#ef4444',
              marginRight: '12px',
              flexShrink: 0
            }} 
          />
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            color: '#ef4444',
            margin: 0
          }}>
            {title}
          </h3>
        </div>

        <p style={{ 
          color: '#e2e8f0', 
          fontSize: '14px',
          lineHeight: '1.5',
          margin: '0 0 20px 0'
        }}>
          {message}
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            data-testid="button-close-error-log"
          >
            <X style={{ width: '16px', height: '16px' }} />
            OK
          </Button>
        </div>
      </div>
    </div>
  );
}
