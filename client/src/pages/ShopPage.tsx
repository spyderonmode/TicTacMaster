import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, Zap, Sparkles, Check, ArrowLeft, Flame, Stars, Hammer } from "lucide-react";
import { AnimatedPiece } from "@/components/AnimatedPieces";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

interface PieceStyle {
  styleName: string;
  id?: string;
  unlockedAt?: Date;
  isActive?: boolean;
}

interface UserData {
  coins: number;
}

const PIECE_STYLES = [
  {
    id: "default",
    name: "Classic",
    description: "The classic X and O pieces",
    price: 0,
    isDefault: true,
  },
  {
    id: "thunder",
    name: "Thunder Strike",
    description: "Electrifying X and O with lightning effects",
    price: 20000000, // 20 million coins
    isDefault: false,
  },
  {
    id: "fire",
    name: "Inferno Blaze",
    description: "Blazing X and O with realistic fire effects",
    price: 35000000, // 35 million coins
    isDefault: false,
  },
  {
    id: "hammer",
    name: "Hammer Strike",
    description: "A hammer smashes down to reveal your piece",
    price: 50000000, // 50 million coins
    isDefault: false,
  },
];

export default function ShopPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const { user } = useAuth();

  const { data: userData } = useQuery<UserData>({
    queryKey: ["/api/users", user?.userId],
    enabled: !!user?.userId,
  });

  const { data: pieceStylesData } = useQuery<{ pieceStyles: PieceStyle[]; activeStyle: string }>({
    queryKey: ["/api/piece-styles"],
  });

  const purchaseMutation = useMutation({
    mutationFn: async ({ styleName, price }: { styleName: string; price: number }) => {
      return await apiRequest("/api/piece-styles/purchase", {
        method: "POST",
        body: { styleName, price },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/piece-styles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.userId] });
      toast({
        title: "Purchase Successful!",
        description: "Your new piece style has been unlocked!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Purchase Failed",
        description: error.message || "Could not purchase piece style",
        variant: "destructive",
      });
    },
  });

  const setActiveMutation = useMutation({
    mutationFn: async (styleName: string) => {
      return await apiRequest("/api/piece-styles/set-active", {
        method: "POST",
        body: { styleName },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/piece-styles"] });
      toast({
        title: "Style Activated!",
        description: "Your piece style has been changed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Change Style",
        description: error.message || "Could not change piece style",
        variant: "destructive",
      });
    },
  });

  const userCoins = userData?.coins || 0;
  const ownedStyles = pieceStylesData?.pieceStyles?.map((s) => s.styleName) || [];
  const activeStyle = pieceStylesData?.activeStyle || "default";

  const isStyleOwned = (styleId: string) => {
    return styleId === "default" || ownedStyles.includes(styleId);
  };

  const handlePurchase = (styleId: string, price: number) => {
    if (userCoins < price) {
      toast({
        title: "Insufficient Coins",
        description: `You need ${price.toLocaleString()} coins to purchase this style.`,
        variant: "destructive",
      });
      return;
    }
    purchaseMutation.mutate({ styleName: styleId, price });
  };

  const handleSetActive = (styleId: string) => {
    if (styleId === "default") {
      // For default, we don't need to call the backend, just deactivate all
      setActiveMutation.mutate("default");
    } else {
      setActiveMutation.mutate(styleId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 dark:bg-gradient-to-br dark:from-black dark:via-purple-950 dark:to-black">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4">
          <Button
            variant="outline"
            onClick={() => setLocation('/')}
            className="bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700"
            data-testid="button-back-home"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-2" data-testid="text-shop-title">
            <Sparkles className="w-8 h-8 text-yellow-400" />
            Piece Style Shop
            <Sparkles className="w-8 h-8 text-yellow-400" />
          </h1>
          <p className="text-slate-300 text-lg" data-testid="text-shop-subtitle">Customize your X and O pieces with special effects!</p>
          
          <div className="mt-4 inline-flex items-center gap-2 bg-slate-800/50 px-6 py-3 rounded-lg border border-yellow-500/30">
            <Coins className="w-6 h-6 text-yellow-400" />
            <span className="text-2xl font-bold text-yellow-400" data-testid="text-user-coins">{userCoins.toLocaleString()}</span>
            <span className="text-slate-300">Coins</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PIECE_STYLES.map((style) => {
            const owned = isStyleOwned(style.id);
            const isActive = activeStyle === style.id;

            return (
              <Card 
                key={style.id} 
                className={`bg-slate-800/50 border-2 transition-all cursor-pointer hover:scale-105 ${
                  isActive 
                    ? "border-green-500 shadow-lg shadow-green-500/50" 
                    : selectedStyle === style.id 
                    ? "border-purple-500 shadow-lg shadow-purple-500/50" 
                    : "border-slate-700"
                }`}
                onClick={() => setSelectedStyle(style.id)}
                data-testid={`card-style-${style.id}`}
              >
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {style.id === "thunder" && <Zap className="w-5 h-5 text-yellow-400" />}
                      {style.id === "fire" && <Flame className="w-5 h-5 text-orange-400" />}
                      {style.id === "hammer" && <Hammer className="w-5 h-5 text-gray-400" />}
                      {style.name}
                    </span>
                    {isActive && (
                      <span className="flex items-center gap-1 text-sm text-green-400 bg-green-500/20 px-3 py-1 rounded-full">
                        <Check className="w-4 h-4" />
                        Active
                      </span>
                    )}
                    {owned && !isActive && (
                      <span className="text-sm text-blue-400 bg-blue-500/20 px-3 py-1 rounded-full">
                        Owned
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    {style.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="bg-slate-900/50 rounded-lg p-8 mb-4 flex items-center justify-center gap-8">
                    <div className="w-20 h-20 flex items-center justify-center">
                      <AnimatedPiece 
                        symbol="X" 
                        style={style.id as "default" | "thunder" | "fire" | "hammer"} 
                        className={style.id === "default" ? "text-5xl text-blue-400 font-bold" : "text-blue-400"}
                      />
                    </div>
                    <div className="w-20 h-20 flex items-center justify-center">
                      <AnimatedPiece 
                        symbol="O" 
                        style={style.id as "default" | "thunder" | "fire" | "hammer"} 
                        className={style.id === "default" ? "text-5xl text-red-400 font-bold" : "text-red-400"}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {style.isDefault || owned ? (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetActive(style.id);
                        }}
                        disabled={isActive || setActiveMutation.isPending}
                        className={isActive 
                          ? "bg-green-600 hover:bg-green-700" 
                          : "bg-purple-600 hover:bg-purple-700"
                        }
                        data-testid={`button-activate-${style.id}`}
                      >
                        {isActive ? "Currently Active" : "Activate This Style"}
                      </Button>
                    ) : (
                      <>
                        <div className="flex items-center justify-center gap-2 text-yellow-400 text-xl font-bold mb-2">
                          <Coins className="w-6 h-6" />
                          <span data-testid={`text-price-${style.id}`}>{style.price.toLocaleString()}</span>
                        </div>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePurchase(style.id, style.price);
                          }}
                          disabled={userCoins < style.price || purchaseMutation.isPending}
                          className="bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50"
                          data-testid={`button-purchase-${style.id}`}
                        >
                          {purchaseMutation.isPending ? "Purchasing..." : "Purchase Now"}
                        </Button>
                        {userCoins < style.price && (
                          <p className="text-red-400 text-sm text-center">
                            Need {(style.price - userCoins).toLocaleString()} more coins
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Card className="bg-slate-800/30 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">How to Earn Coins</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300">
              <ul className="space-y-2 text-left max-w-2xl mx-auto">
                <li className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-yellow-400" />
                  Win games to earn coins
                </li>
                <li className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-yellow-400" />
                  Top The LeaderBoard
                </li>
                <li className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-yellow-400" />
                  Win betting rooms for big rewards
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
