import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/contexts/LanguageContext";
import { useWebSocket } from "@/hooks/useWebSocket";
import { User, Eye, Users, Crown } from "lucide-react";

interface PlayerListProps {
  roomId: string;
}

export function PlayerList({ roomId }: PlayerListProps) {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const { lastMessage } = useWebSocket();
  const [participants, setParticipants] = useState<any[]>([]);
  
  // Initial fetch of participants via API
  const { data: initialParticipants = [], isLoading } = useQuery({
    queryKey: ["/api/rooms", roomId, "participants"],
    enabled: !!roomId && isAuthenticated,
    staleTime: 60000, // Consider data fresh for 1 minute since we use WebSocket for updates
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Get initial data on mount
    refetchInterval: false, // No polling - use WebSocket for updates
  });

  // Update participants from initial API fetch
  useEffect(() => {
    if (Array.isArray(initialParticipants) && initialParticipants.length >= 0) {
      setParticipants(initialParticipants as any[]);
    }
  }, [initialParticipants]);

  // Listen for WebSocket participant updates
  useEffect(() => {
    if (!lastMessage) return;

    const message = lastMessage;
    
    // Handle join_room_success events (for the user who just joined)
    if (message.type === 'join_room_success' && message.room?.id === roomId) {
      // Update participants with the fresh data from server
      if (message.room.participants) {
        setParticipants(message.room.participants);
      }
    }
    
    // Handle room_participant_joined events (for other users in the room)
    if (message.type === 'room_participant_joined' && message.roomId === roomId) {
      if (message.participants) {
        setParticipants(message.participants);
      }
    }
    
    // Handle room_participants_updated events (if server sends these)
    if (message.type === 'room_participants_updated' && message.roomId === roomId) {
      setParticipants(message.participants);
    }
    
    // Handle user_left_room events
    if (message.type === 'user_left_room' && message.roomId === roomId) {
      setParticipants(prev => prev.filter(p => p.userId !== message.userId));
    }
    
  }, [lastMessage, roomId]);

  if (isLoading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg">{t('playersAndSpectators')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-slate-700 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-slate-700 rounded mb-2"></div>
            <div className="h-8 bg-slate-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const players = participants.filter(p => p.role === 'player');
  const spectators = participants.filter(p => p.role === 'spectator');

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <Users className="w-5 h-5 text-green-400" />
          {t('playersAndSpectators')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {/* Players Section with Graphics */}
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 p-3">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '16px 16px'
            }}></div>
          </div>
          
          <div className="relative z-10">
            <h4 className="text-sm font-semibold text-blue-300 mb-3 flex items-center gap-2">
              <Crown className="w-4 h-4 text-yellow-400" />
              {t('players')} ({players.length}/2)
            </h4>
            <div className="space-y-2">
              {players.length === 0 ? (
                <div className="text-sm text-gray-400 text-center py-6 bg-slate-800/30 rounded-lg border border-slate-700/50">
                  {t('noPlayersInRoom')}
                </div>
              ) : (
                players.map((participant, index) => (
                  <div key={participant.id} className="relative overflow-hidden flex items-center justify-between p-3 bg-slate-700/50 backdrop-blur-sm rounded-lg border border-slate-600/50 hover:bg-slate-700/70 transition-all duration-300">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        {participant.user.profileImageUrl ? (
                          <img 
                            src={participant.user.profileImageUrl} 
                            alt={t('playerAvatar')} 
                            className="w-10 h-10 rounded-full object-cover border-2 border-blue-400/50"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center border-2 border-blue-400/50">
                            <User className="w-5 h-5 text-white" />
                          </div>
                        )}
                        {/* Player number badge */}
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-xs font-bold text-black border border-yellow-300">
                          {index + 1}
                        </div>
                      </div>
                      <span className="text-sm font-medium text-white">
                        {participant.user.firstName || participant.user.username || t('anonymous')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`px-3 py-1.5 rounded-lg ${
                        index === 0 
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-600' 
                          : 'bg-gradient-to-r from-red-600 to-pink-600'
                      } shadow-lg`}>
                        <span className="text-sm font-bold text-white">
                          {index === 0 ? 'X' : 'O'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Spectators Section with Graphics */}
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-slate-700/30 to-slate-800/30 border border-slate-600 p-3">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '16px 16px'
            }}></div>
          </div>
          
          <div className="relative z-10">
            <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              {t('spectators')} ({spectators.length})
            </h4>
            <div className="space-y-2">
              {spectators.length === 0 ? (
                <div className="text-sm text-gray-400 text-center py-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                  {t('noSpectators')}
                </div>
              ) : (
                spectators.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between p-3 bg-slate-700/50 backdrop-blur-sm rounded-lg border border-slate-600/50 hover:bg-slate-700/70 transition-all duration-300">
                    <div className="flex items-center space-x-3">
                      {participant.user.profileImageUrl ? (
                        <img 
                          src={participant.user.profileImageUrl} 
                          alt={t('spectatorAvatar')} 
                          className="w-9 h-9 rounded-full object-cover border-2 border-cyan-400/30"
                        />
                      ) : (
                        <div className="w-9 h-9 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center border-2 border-cyan-400/30">
                          <User className="w-4 h-4 text-gray-300" />
                        </div>
                      )}
                      <span className="text-sm text-gray-200">
                        {participant.user.firstName || participant.user.username || t('anonymous')}
                      </span>
                    </div>
                    <Badge variant="secondary" className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs border-0">
                      <Eye className="w-3 h-3 mr-1" />
                      {t('watching')}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
