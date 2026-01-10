import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/contexts/LanguageContext";
import { useWebSocket } from "@/hooks/useWebSocket";
import { User, Eye, Users, Crown } from "lucide-react";
import { CachedProfileImage } from "@/components/CachedProfileImage";

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
    staleTime: 300000, // Keep data fresh for 5 minutes since we use WebSockets for updates
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
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

    // Handle user_joined events
    if (message.type === 'user_joined' && message.roomId === roomId) {
      // We'll wait for the room_participant_joined message for the full list,
      // but we could also manually add the user if needed.
    }

    // Handle room_participant_joined events (for other users in the room)
    if ((message.type === 'room_participant_joined' || message.type === 'game_started') && message.roomId === roomId) {
      if (message.participants) {
        setParticipants(message.participants);
      } else if (message.game && message.type === 'game_started') {
        // If it's a game_started message without a full participants list, 
        // we can still infer the players to show them immediately
        // but usually our server sends participants in game_started for online matches
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
      <CardHeader className="pb-2 pt-3 px-3">
        <CardTitle className="text-sm sm:text-base flex items-center gap-1.5">
          <Users className="w-4 h-4 text-green-400" />
          {t('playersAndSpectators')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0 px-3 pb-3">
        {/* Players Section with Graphics */}
        <div className="relative overflow-hidden rounded-md bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 p-2">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '14px 14px'
            }}></div>
          </div>

          <div className="relative z-10">
            <h4 className="text-xs font-semibold text-blue-300 mb-2 flex items-center gap-1.5">
              <Crown className="w-3 h-3 text-yellow-400" />
              {t('players')} ({players.length}/2)
            </h4>
            <div className="space-y-1.5">
              {players.length === 0 ? (
                <div className="text-xs text-gray-400 text-center py-4 bg-slate-800/30 rounded-md border border-slate-700/50">
                  {t('noPlayersInRoom')}
                </div>
              ) : (
                players.map((participant, index) => (
                  <div key={participant.id} className="relative overflow-hidden flex items-center justify-between p-2 bg-slate-700/50 backdrop-blur-sm rounded-md border border-slate-600/50 hover:bg-slate-700/70 transition-all duration-300">
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <CachedProfileImage
                          src={participant.user.profileImageUrl}
                          alt={t('playerAvatar')}
                          className="w-8 h-8 rounded-full object-cover border-2 border-blue-400/50"
                          fallbackClassName="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center border-2 border-blue-400/50"
                          fallbackIconClassName="w-4 h-4 text-white"
                        />
                        {/* Player number badge */}
                        <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-[10px] font-bold text-black border border-yellow-300">
                          {index + 1}
                        </div>
                      </div>
                      <span className="text-xs font-medium text-white">
                        {participant.user.firstName || participant.user.username || t('anonymous')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={`px-2 py-1 rounded-md ${
                        index === 0 
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-600' 
                          : 'bg-gradient-to-r from-red-600 to-pink-600'
                      } shadow-lg`}>
                        <span className="text-xs font-bold text-white">
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
        <div className="relative overflow-hidden rounded-md bg-gradient-to-br from-slate-700/30 to-slate-800/30 border border-slate-600 p-2">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '14px 14px'
            }}></div>
          </div>

          <div className="relative z-10">
            <h4 className="text-xs font-semibold text-gray-300 mb-2 flex items-center gap-1.5">
              <Eye className="w-3 h-3 text-cyan-400" />
              {t('spectators')} ({spectators.length})
            </h4>
            <div className="space-y-1.5">
              {spectators.length === 0 ? (
                <div className="text-xs text-gray-400 text-center py-3 bg-slate-800/30 rounded-md border border-slate-700/50">
                  {t('noSpectators')}
                </div>
              ) : (
                spectators.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between p-2 bg-slate-700/50 backdrop-blur-sm rounded-md border border-slate-600/50 hover:bg-slate-700/70 transition-all duration-300">
                    <div className="flex items-center space-x-2">
                      <CachedProfileImage
                        src={participant.user.profileImageUrl}
                        alt={t('spectatorAvatar')}
                        className="w-7 h-7 rounded-full object-cover border-2 border-cyan-400/30"
                        fallbackClassName="w-7 h-7 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center border-2 border-cyan-400/30"
                        fallbackIconClassName="w-3 h-3 text-gray-300"
                      />
                      <span className="text-xs text-gray-200">
                        {participant.user.firstName || participant.user.username || t('anonymous')}
                      </span>
                    </div>
                    <Badge variant="secondary" className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-[10px] border-0 px-1.5 py-0.5">
                      <Eye className="w-2.5 h-2.5 mr-0.5" />
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
