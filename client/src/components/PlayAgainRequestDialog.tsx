import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, X, Check, User } from "lucide-react";

interface PlayAgainRequest {
  id: string;
  requesterId: string;
  requestedId: string;
  gameId: string;
  status: string;
  requestedAt: string;
  requester: {
    id: string;
    displayName: string;
    firstName: string;
    lastName: string;
    username: string;
    profileImageUrl?: string;
  };
  game: {
    id: string;
    gameMode: string;
  };
}

interface PlayAgainRequestDialogProps {
  open: boolean;
  onClose: () => void;
  request: PlayAgainRequest | null;
}

export function PlayAgainRequestDialog({ open, onClose, request }: PlayAgainRequestDialogProps) {
  const [isResponding, setIsResponding] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const respondMutation = useMutation({
    mutationFn: async ({ requestId, response }: { requestId: string; response: 'accepted' | 'rejected' }) => {
      return apiRequest(`/api/play-again/respond`, {
        method: 'POST',
        body: { requestId, response },
      });
    },
    onSuccess: (_, { response }) => {
      toast({
        description: response === 'accepted' ? 
          "Play again request accepted! Starting new game..." : 
          "Play again request declined",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/play-again/requests'] });
      onClose();
    },
    onError: (error) => {
      console.error('Error responding to play again request:', error);
      toast({
        variant: "destructive",
        description: "Failed to respond to play again request",
      });
    },
    onSettled: () => {
      setIsResponding(false);
    },
  });

  const handleRespond = async (response: 'accepted' | 'rejected') => {
    if (!request || isResponding) return;
    
    setIsResponding(true);
    respondMutation.mutate({ requestId: request.id, response });
  };

  if (!open || !request) return null;

  const requesterName = request.requester.displayName || 
                       request.requester.firstName || 
                       request.requester.username || 
                       'Unknown Player';

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
          border: '1px solid #475569',
          color: 'white',
          textAlign: 'center'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ marginBottom: '24px' }}>
          <RefreshCw 
            style={{ 
              width: '48px', 
              height: '48px', 
              margin: '0 auto 16px', 
              color: '#3b82f6' 
            }} 
          />
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
            Play Again Request
          </h3>
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>
            You have a new play again request!
          </p>
        </div>

        {/* Requester Info */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '12px', 
          marginBottom: '24px',
          padding: '16px',
          backgroundColor: '#334155',
          borderRadius: '8px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#3b82f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}>
            {request.requester.profileImageUrl ? (
              <img 
                src={request.requester.profileImageUrl} 
                alt={requesterName}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <User style={{ width: '24px', height: '24px', color: 'white' }} />
            )}
          </div>
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontWeight: 'bold', fontSize: '16px', margin: 0 }}>
              {requesterName}
            </p>
            <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>
              wants to play again
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Button
            onClick={() => handleRespond('rejected')}
            disabled={isResponding}
            variant="outline"
            data-testid="button-reject-play-again"
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              color: '#ef4444',
              border: '1px solid #ef4444',
              borderRadius: '6px'
            }}
          >
            <X style={{ width: '16px', height: '16px', marginRight: '8px' }} />
            Decline
          </Button>
          
          <Button
            onClick={() => handleRespond('accepted')}
            disabled={isResponding}
            data-testid="button-accept-play-again"
            style={{
              padding: '8px 16px',
              backgroundColor: '#10b981',
              color: 'white',
              border: '1px solid #10b981',
              borderRadius: '6px'
            }}
          >
            <Check style={{ width: '16px', height: '16px', marginRight: '8px' }} />
            {isResponding ? 'Starting...' : 'Accept'}
          </Button>
        </div>
      </div>
    </div>
  );
}