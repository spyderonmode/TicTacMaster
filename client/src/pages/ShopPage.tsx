import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Coins, Zap, Sparkles, Check, ArrowLeft, Flame, Stars, Hammer, Leaf, Heart, Gift, ShoppingCart, Flower2, Sprout, Cat, Users } from "lucide-react";
import { AnimatedPiece } from "@/components/AnimatedPieces";
import { PurchaseSuccessModal } from "@/components/PurchaseSuccessModal";
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

interface EmojiItem {
  id: string;
  name: string;
  description: string;
  price: number;
  animationType: string;
  isActive: boolean;
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
  {
    id: "autumn",
    name: "Autumn Leaves",
    description: "Beautiful 3D fall colors with falling leaves",
    price: 10000000, // 100 coins
    isDefault: false,
  },
  {
    id: "lovers",
    name: "Lovers Heart",
    description: "Romantic 3D hearts with heavy rotation - for lovers only!",
    price: 100000000, // 100 million coins
    isDefault: false,
  },
  {
    id: "flower",
    name: "Blooming Flower",
    description: "Beautiful 3D flowers with smooth petals rotation",
    price: 200000000, // 200 million coins
    isDefault: false,
  },
  {
    id: "greenleaf",
    name: "Green Leaf",
    description: "Stunning 3D green leaves with mesmerizing rotation",
    price: 200000000, // 200 million coins
    isDefault: false,
  },
  {
    id: "cat",
    name: "Cat",
    description: "Adorable cat scratches and curled up kitty with 3D spin effects",
    price: 150000000, // 150 million coins
    isDefault: false,
  },
  {
    id: "bestfriends",
    name: "Best Friends",
    description: "Beautiful 3D friendship hands with BFF hearts and smooth rotation",
    price: 350000000, // 350 million coins
    isDefault: false,
  },
];

export default function ShopPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("pieces");
  const { user } = useAuth();
  
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseDetails, setPurchaseDetails] = useState<{
    type: "piece" | "emoji";
    name: string;
    description: string;
    id?: string;
    animation?: string;
  } | null>(null);

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
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/piece-styles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.userId] });
      
      const style = PIECE_STYLES.find(s => s.id === variables.styleName);
      if (style) {
        setPurchaseDetails({
          type: "piece",
          name: style.name,
          description: style.description,
          id: style.id,
        });
        setShowPurchaseModal(true);
      }
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

  // Fetch all available emojis
  const { data: emojis = [] } = useQuery<EmojiItem[]>({
    queryKey: ['/api/emojis'],
  });

  // Fetch user's owned emojis
  const { data: ownedEmojisData = [] } = useQuery<Array<{ emojiId: string; emoji: EmojiItem }>>({
    queryKey: ['/api/emojis/owned'],
  });

  // Purchase emoji mutation
  const purchaseEmojiMutation = useMutation({
    mutationFn: async (emojiId: string) => {
      return await apiRequest('/api/emojis/purchase', {
        method: 'POST',
        body: { emojiId },
      });
    },
    onSuccess: (_data: any, emojiId: string) => {
      queryClient.invalidateQueries({ queryKey: ['/api/emojis/owned'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.userId] });
      setSelectedEmoji(null);
      
      const emoji = emojis.find(e => e.id === emojiId);
      if (emoji) {
        setPurchaseDetails({
          type: "emoji",
          name: emoji.name,
          description: emoji.description,
          animation: emoji.animationType,
        });
        setShowPurchaseModal(true);
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Purchase Failed',
        description: error.message || 'Failed to purchase emoji',
        variant: 'destructive',
      });
    },
  });

  const userCoins = userData?.coins || 0;
  const ownedStyles = pieceStylesData?.pieceStyles?.map((s) => s.styleName) || [];
  const activeStyle = pieceStylesData?.activeStyle || "default";

  const isStyleOwned = (styleId: string) => {
    return styleId === "default" || ownedStyles.includes(styleId);
  };

  const isEmojiOwned = (emojiId: string) => {
    return ownedEmojisData.some(owned => owned.emojiId === emojiId);
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
            Game Shop
            <Sparkles className="w-8 h-8 text-yellow-400" />
          </h1>
          <p className="text-slate-300 text-lg" data-testid="text-shop-subtitle">Customize your game with piece styles and emojis!</p>
          
          <div className="mt-4 inline-flex items-center gap-2 bg-slate-800/50 px-6 py-3 rounded-lg border border-yellow-500/30">
            <Coins className="w-6 h-6 text-yellow-400" />
            <span className="text-2xl font-bold text-yellow-400" data-testid="text-user-coins">{userCoins.toLocaleString()}</span>
            <span className="text-slate-300">Coins</span>
          </div>
        </div>

        <Tabs defaultValue="pieces" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="pieces" className="text-lg" data-testid="tab-pieces">
              <Zap className="w-4 h-4 mr-2" />
              Piece Styles
            </TabsTrigger>
            <TabsTrigger value="emojis" className="text-lg" data-testid="tab-emojis">
              <Gift className="w-4 h-4 mr-2" />
              Emojis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pieces">
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
                      {style.id === "autumn" && <Leaf className="w-5 h-5 text-orange-600" />}
                      {style.id === "lovers" && <Heart className="w-5 h-5 text-pink-400" />}
                      {style.id === "flower" && <Flower2 className="w-5 h-5 text-pink-500" />}
                      {style.id === "greenleaf" && <Sprout className="w-5 h-5 text-green-500" />}
                      {style.id === "cat" && <Cat className="w-5 h-5 text-blue-400" />}
                      {style.id === "bestfriends" && <Users className="w-5 h-5 text-purple-400" />}
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
                        style={style.id as "default" | "thunder" | "fire" | "hammer" | "autumn" | "lovers" | "flower" | "greenleaf" | "cat" | "bestfriends"} 
                        className={style.id === "default" ? "text-5xl text-blue-400 font-bold" : "text-blue-400"}
                      />
                    </div>
                    <div className="w-20 h-20 flex items-center justify-center">
                      <AnimatedPiece 
                        symbol="O" 
                        style={style.id as "default" | "thunder" | "fire" | "hammer" | "autumn" | "lovers" | "flower" | "greenleaf" | "cat" | "bestfriends"} 
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
          </TabsContent>

          <TabsContent value="emojis">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {emojis.map((emoji) => {
                const owned = isEmojiOwned(emoji.id);
                const affordable = userCoins >= emoji.price;
                const isPurchasing = purchaseEmojiMutation.isPending && selectedEmoji === emoji.id;

                return (
                  <Card 
                    key={emoji.id}
                    className={`relative overflow-hidden transition-all duration-300 ${
                      owned 
                        ? 'bg-green-900/30 border-green-500/50' 
                        : affordable
                        ? 'bg-slate-800/50 border-purple-500/30 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/20'
                        : 'bg-slate-800/30 border-slate-700/30 opacity-60'
                    }`}
                    data-testid={`card-emoji-${emoji.id}`}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="text-5xl mb-2">{emoji.name.split(' ')[0]}</div>
                        {owned && (
                          <Badge className="bg-green-600 text-white" data-testid={`badge-owned-${emoji.id}`}>
                            <Check className="w-3 h-3 mr-1" />
                            Owned
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-white">{emoji.name}</CardTitle>
                      <CardDescription className="text-gray-400">
                        {emoji.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent>
                      <div className="flex items-center gap-2">
                        <Coins className="w-4 h-4 text-yellow-400" />
                        <span className={`font-bold ${affordable ? 'text-yellow-400' : 'text-gray-500'}`}>
                          {emoji.price.toLocaleString()} coins
                        </span>
                      </div>
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs text-purple-300 border-purple-400/50">
                          {emoji.animationType} animation
                        </Badge>
                      </div>
                    </CardContent>

                    <CardFooter>
                      {owned ? (
                        <Button 
                          disabled 
                          className="w-full bg-green-700 hover:bg-green-700 cursor-not-allowed"
                          data-testid={`button-owned-${emoji.id}`}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          In Your Collection
                        </Button>
                      ) : (
                        <Button
                          onClick={() => {
                            setSelectedEmoji(emoji.id);
                            purchaseEmojiMutation.mutate(emoji.id);
                          }}
                          disabled={!affordable || isPurchasing}
                          className={`w-full ${
                            affordable 
                              ? 'bg-purple-600 hover:bg-purple-700' 
                              : 'bg-gray-700 cursor-not-allowed'
                          }`}
                          data-testid={`button-purchase-${emoji.id}`}
                        >
                          {isPurchasing ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Purchasing...
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              {affordable ? 'Purchase' : 'Insufficient Coins'}
                            </>
                          )}
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

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
              <div className="mt-6 pt-4 border-t border-slate-600">
                <div className="space-y-3 mb-4">
                  <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <div className="flex items-center justify-center gap-3 text-lg font-bold">
                      <Coins className="w-6 h-6 text-yellow-400" />
                      <span className="text-yellow-400">10,000,000 Coins</span>
                      <span className="text-slate-300">=</span>
                      <span className="text-green-400">₹100</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg p-4 relative">
                    <div className="absolute -top-2 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      30% OFF
                    </div>
                    <div className="flex items-center justify-center gap-3 text-lg font-bold">
                      <Coins className="w-6 h-6 text-yellow-400" />
                      <span className="text-yellow-400">100,000,000 Coins</span>
                      <span className="text-slate-300">=</span>
                      <span className="text-green-400">₹700</span>
                    </div>
                  </div>
                  <p className="text-center text-slate-400 text-xs">Purchase coins at affordable rates!</p>
                </div>
                <p className="text-center text-slate-400 text-sm">
                  For purchase coin contact{" "}
                  <a 
                    href="mailto:support@darklayerstudios.com" 
                    className="text-yellow-400 hover:text-yellow-300 underline"
                    data-testid="link-support-email"
                  >
                    support@darklayerstudios.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Purchase Success Modal */}
      {purchaseDetails && (
        <PurchaseSuccessModal
          open={showPurchaseModal}
          onClose={() => {
            setShowPurchaseModal(false);
            setPurchaseDetails(null);
          }}
          purchaseType={purchaseDetails.type}
          itemName={purchaseDetails.name}
          itemDescription={purchaseDetails.description}
          itemId={purchaseDetails.id}
          emojiAnimation={purchaseDetails.animation}
        />
      )}
    </div>
  );
}
