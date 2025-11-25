import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Coins, Zap, Sparkles, Check, ArrowLeft, Flame, Stars, Hammer, Leaf, Heart, Gift, ShoppingCart, Flower2, Sprout, Cat, Users, Palette, Bird, Lightbulb, Moon } from "lucide-react";
import { AnimatedPiece } from "@/components/AnimatedPieces";
import { PurchaseSuccessModal } from "@/components/PurchaseSuccessModal";
import { AvatarWithFrame } from "@/components/AvatarWithFrame";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { formatNumber } from "@/lib/utils";
interface PieceStyle {
  styleName: string;
  id?: string;
  unlockedAt?: Date;
  isActive?: boolean;
}

interface UserData {
  coins: number;
  profileImageUrl?: string | null;
}

interface StickerItem {
  id: string;
  name: string;
  description: string;
  price: number;
  assetPath: string;
  animationType: string;
  isActive: boolean;
}

interface AvatarFrameItem {
  id: string;
  name: string;
  description: string;
  price: number;
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
    price: 200000000, // 200 million coins
    isDefault: false,
  },
  {
    id: "fire",
    name: "Inferno Blaze",
    description: "Blazing X and O with realistic fire effects",
    price: 150000000, // 150 million coins
    isDefault: false,
  },
  {
    id: "hammer",
    name: "Hammer Strike",
    description: "A hammer smashes down to reveal your piece",
    price: 200000000, // 50 million coins
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
    price: 300000000, // 150 million coins
    isDefault: false,
  },
  {
    id: "bestfriends",
    name: "Best Friends",
    description: "Beautiful 3D friendship hands with BFF hearts and smooth rotation",
    price: 350000000, // 350 million coins
    isDefault: false,
  },
  {
    id: "lotus",
    name: "Lotus Peace",
    description: "Serene 3D lotus flower design - the ultimate piece of peace and tranquility",
    price: 400000000, // 400 million coins
    isDefault: false,
  },
  {
    id: "holi",
    name: "Holi Festival",
    description: "Vibrant 3D multicolor Holi festival design with rich rainbow effects",
    price: 300000000, // 300 million coins
    isDefault: false,
  },
  {
    id: "tulip",
    name: "Tulip Garden",
    description: "Soft 3D tulip petals design with gentle floating animations - pure elegance",
    price: 200000000, // 200 million coins
    isDefault: false,
  },
  {
    id: "butterfly",
    name: "Butterfly Dreams",
    description: "Beautiful 3D butterfly with fluttering wings and magical sparkles - enchanting and graceful",
    price: 500000000, // 500 million coins
    isDefault: false,
  },
  {
    id: "peacock",
    name: "Royal Peacock",
    description: "Majestic 3D peacock feathers with iridescent eye patterns and stunning color gradients - absolutely regal!",
    price: 450000000, // 500 million coins
    isDefault: false,
  },
  {
    id: "bulb",
    name: "Light Bulb",
    description: "Brilliant 3D glowing light bulb design with pulsing brightness - illuminate your game!",
    price: 500000000, // 250 million coins
    isDefault: false,
  },
  {
    id: "moonstar",
    name: "Moon & Stars",
    description: "Magical 3D crescent moon with twinkling stars design - enchanting celestial beauty!",
    price: 500000000, // 500 million coins
    isDefault: false,
  },
];

const AVATAR_FRAMES = [
  {
    id: "default",
    name: "Default Frame",
    description: "Standard avatar border",
    price: 0,
    isDefault: true,
  },
  {
    id: "thundering",
    name: "Thundering Strike",
    description: "Epic 3D electric blue frame with lightning effects and rotating gradients",
    price: 1000000000, // 1000 million coins
    isDefault: false,
  },
  {
    id: "firestorm",
    name: "Fire Storm",
    description: "Blazing 3D fire frame with intense flames erupting outside the border",
    price: 1000000000, // 1000 million coins
    isDefault: false,
  },
  {
    id: 'lovers_3d',
    name: 'Lovers Heart 3D',
    description: 'Romantic 3D hearts floating around your avatar - for lovers only!',
    price: 1000000000, // 1 billion coins
    isDefault: false,
  },
  {
    id: 'lovers_eternal',
    name: 'Lovers Eternal',
    description: 'Cupid\'s arrows and romantic hearts in purple-gold glory - eternal love personified!',
    price: 2000000000, // 1.2 billion coins
    isDefault: false,
  },
  {
    id: 'diamond_luxury',
    name: 'Diamond Luxury',
    description: 'Ultra-premium 3D floating diamond crystals with shimmer effects - the ultimate luxury!',
    price: 2000000000, // 2 billion coins
    isDefault: false,
  },
  {
    id: 'holographic_matrix',
    name: 'Holographic Matrix',
    description: 'Mind-blowing 3D holographic frame with liquid wave distortion on your avatar - truly mesmerizing!',
    price: 1500000000, // 2 billion coins
    isDefault: false,
  },
  {
    id: 'cosmic_vortex',
    name: 'Cosmic Vortex',
    description: 'Explosive neon energy plasma border with dual-rotating waves and pulsing brightness effect!',
    price: 1500000000, // 2 billion coins
    isDefault: false,
  },
  {
    id: 'royal_zigzag_crown',
    name: 'Royal Golden',
    description: 'Majestic 3D zigzag golden border with floating crown jewels - feel like royalty!',
    price: 3000000000, // 3 billion coins
    isDefault: false,
  },
  {
    id: 'celestial_nebula',
    name: 'Celestial Nebula',
    description: 'Stunning 3D cosmic nebula with swirling galaxies, floating stardust, and mesmerizing aurora effects - absolutely breathtaking!',
    price: 5000000000, // 5 billion coins
    isDefault: false,
  },
  {
    id: 'quantum_prism',
    name: 'Quantum Prism',
    description: 'Ultra-modern 3D hexagonal crystal frame with rotating geometric shapes, pulsing energy rings, and clean light beams - the future of style!',
    price: 6000000000, // 3.5 billion coins
    isDefault: false,
  },
  {
    id: 'phoenix_immortal',
    name: 'Phoenix Immortal',
    description: 'The ultimate legendary frame! Mythical phoenix with majestic flaming wings, eternal rebirth fire cycles, floating ember particles, and divine golden feathers - the rarest and most powerful frame ever created!',
    price: 10000000000, // 8 billion coins
    isDefault: false,
  },
];

interface ShopPageProps {
  onClose?: () => void;
}

export default function ShopPage({ onClose }: ShopPageProps = {}) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("pieces");
  const [previewModal, setPreviewModal] = useState<{
    type: "piece" | "frame";
    item: any;
  } | null>(null);
  const { user } = useAuth();
  
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseDetails, setPurchaseDetails] = useState<{
    type: "piece" | "sticker" | "frame";
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

  // Fetch all available stickers
  const { data: stickers = [] } = useQuery<StickerItem[]>({
    queryKey: ['/api/stickers'],
  });

  // Fetch user's owned stickers
  const { data: ownedStickersData = [] } = useQuery<Array<{ stickerId: string; sticker: StickerItem }>>({
    queryKey: ['/api/stickers/owned'],
  });

  // Purchase sticker mutation
  const purchaseStickerMutation = useMutation({
    mutationFn: async (stickerId: string) => {
      return await apiRequest('/api/stickers/purchase', {
        method: 'POST',
        body: { stickerId },
      });
    },
    onSuccess: (_data: any, stickerId: string) => {
      queryClient.invalidateQueries({ queryKey: ['/api/stickers/owned'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.userId] });
      setSelectedSticker(null);
      
      const sticker = stickers.find(s => s.id === stickerId);
      if (sticker) {
        setPurchaseDetails({
          type: "sticker",
          name: sticker.name,
          description: sticker.description,
          animation: sticker.animationType,
        });
        setShowPurchaseModal(true);
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Purchase Failed',
        description: error.message || 'Failed to purchase sticker',
        variant: 'destructive',
      });
    },
  });

  // Fetch all available avatar frames
  const { data: avatarFrames = [] } = useQuery<AvatarFrameItem[]>({
    queryKey: ['/api/avatar-frames'],
  });

  // Fetch user's owned avatar frames
  const { data: ownedFramesData = [] } = useQuery<Array<{ frameId: string; frame: AvatarFrameItem; isActive: boolean }>>({
    queryKey: ['/api/avatar-frames/owned'],
  });

  // Purchase avatar frame mutation
  const purchaseFrameMutation = useMutation({
    mutationFn: async (frameId: string) => {
      return await apiRequest('/api/avatar-frames/purchase', {
        method: 'POST',
        body: { frameId },
      });
    },
    onSuccess: (_data: any, frameId: string) => {
      queryClient.invalidateQueries({ queryKey: ['/api/avatar-frames/owned'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.userId] });
      setSelectedFrame(null);
      
      const frame = avatarFrames.find(f => f.id === frameId);
      if (frame) {
        setPurchaseDetails({
          type: "frame",
          name: frame.name,
          description: frame.description,
          id: frame.id,
        });
        setShowPurchaseModal(true);
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Purchase Failed',
        description: error.message || 'Failed to purchase avatar frame',
        variant: 'destructive',
      });
    },
  });

  // Set active avatar frame mutation
  const setActiveFrameMutation = useMutation({
    mutationFn: async (frameId: string | null) => {
      return await apiRequest('/api/avatar-frames/set-active', {
        method: 'POST',
        body: { frameId },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/avatar-frames/owned'] });
      toast({
        title: 'Frame Activated!',
        description: 'Your avatar frame has been changed.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to Change Frame',
        description: error.message || 'Could not change avatar frame',
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

  const isStickerOwned = (stickerId: string) => {
    return ownedStickersData.some(owned => owned.stickerId === stickerId);
  };

  const isFrameOwned = (frameId: string) => {
    return ownedFramesData.some(owned => owned.frameId === frameId);
  };

  const getActiveFrame = () => {
    const active = ownedFramesData.find(owned => owned.isActive);
    return active?.frameId || null;
  };

  const handlePurchase = (styleId: string, price: number) => {
    if (userCoins < price) {
      toast({
        title: "Insufficient Coins",
        description: `You need ${formatNumber(price)} coins to purchase this style.`,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-3 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-4">
          <Button
            variant="outline"
            onClick={() => onClose ? onClose() : setLocation('/')}
            className="bg-purple-900/80 border-2 border-purple-400/60 text-white hover:bg-purple-800/90 hover:border-purple-400 backdrop-blur-sm"
            data-testid="button-back-home"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
        
        {/* Modern Header Section */}
        <div className="text-center mb-4 relative">
          {/* Animated background glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-yellow-500/10 to-purple-500/10 blur-3xl -z-10 animate-pulse"></div>
          
          <div className="relative">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-purple-400 to-yellow-400 mb-2 flex items-center justify-center gap-2" data-testid="text-shop-title">
              <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
              Game Shop
              <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
            </h1>
            <p className="text-slate-300 text-sm mb-3" data-testid="text-shop-subtitle">
              Customize your game with amazing styles, stickers & frames! ✨
            </p>
            
            {/* Modern Coin Display */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 px-4 py-2 rounded-xl border border-yellow-500/40 backdrop-blur-sm shadow-lg shadow-yellow-500/20">
              <div className="bg-yellow-500/20 p-1.5 rounded-full">
                <Coins className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="text-left">
                <p className="text-xs text-yellow-200/70 font-medium">Your Balance</p>
                <span className="text-xl font-bold text-yellow-400" data-testid="text-user-coins">{formatNumber(userCoins)}</span>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="pieces" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 mb-4 h-auto bg-gradient-to-r from-purple-900/90 to-black/90 backdrop-blur-md p-1 gap-1.5 rounded-xl border-2 border-purple-400/60 shadow-xl">
            <TabsTrigger 
              value="pieces" 
              className="flex flex-col items-center gap-1 py-2 px-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/50 rounded-lg transition-all hover:bg-purple-900/50" 
              data-testid="tab-pieces"
            >
              <Zap className="w-4 h-4" />
              <span className="text-xs font-semibold">Piece Styles</span>
            </TabsTrigger>
            <TabsTrigger 
              value="stickers" 
              className="flex flex-col items-center gap-1 py-2 px-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/50 rounded-lg transition-all hover:bg-purple-900/50" 
              data-testid="tab-stickers"
            >
              <Gift className="w-4 h-4" />
              <span className="text-xs font-semibold">Stickers</span>
            </TabsTrigger>
            <TabsTrigger 
              value="frames" 
              className="flex flex-col items-center gap-1 py-2 px-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/50 rounded-lg transition-all hover:bg-purple-900/50" 
              data-testid="tab-frames"
            >
              <Stars className="w-4 h-4" />
              <span className="text-xs font-semibold">Avatar Frames</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pieces">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {PIECE_STYLES.map((style) => {
            const owned = isStyleOwned(style.id);
            const isActive = activeStyle === style.id;

            return (
              <Card 
                key={style.id} 
                className={`bg-gradient-to-br from-purple-900/90 to-black/95 border-2 transition-all duration-300 cursor-pointer hover:scale-[1.05] hover:shadow-2xl backdrop-blur-sm ${
                  isActive 
                    ? "border-cyan-400 shadow-lg shadow-cyan-500/50" 
                    : "border-purple-400/60 hover:border-purple-400"
                }`}
                onClick={() => setPreviewModal({ type: "piece", item: style })}
                data-testid={`card-style-${style.id}`}
              >
                <CardHeader className="p-2 pb-1">
                  <CardTitle className="text-white text-xs flex flex-col gap-0.5">
                    <span className="flex items-center gap-1 font-semibold">
                      {style.id === "thunder" && <Zap className="w-2.5 h-2.5 text-yellow-400" />}
                      {style.id === "fire" && <Flame className="w-2.5 h-2.5 text-orange-400" />}
                      {style.id === "hammer" && <Hammer className="w-2.5 h-2.5 text-gray-400" />}
                      {style.id === "autumn" && <Leaf className="w-2.5 h-2.5 text-orange-600" />}
                      {style.id === "lovers" && <Heart className="w-2.5 h-2.5 text-pink-400" />}
                      {style.id === "flower" && <Flower2 className="w-2.5 h-2.5 text-pink-500" />}
                      {style.id === "greenleaf" && <Sprout className="w-2.5 h-2.5 text-green-500" />}
                      {style.id === "cat" && <Cat className="w-2.5 h-2.5 text-blue-400" />}
                      {style.id === "bestfriends" && <Users className="w-2.5 h-2.5 text-purple-400" />}
                      {style.id === "holi" && <Palette className="w-2.5 h-2.5 text-pink-500" />}
                      {style.id === "peacock" && <Bird className="w-2.5 h-2.5 text-emerald-400" />}
                      {style.id === "bulb" && <Lightbulb className="w-2.5 h-2.5 text-yellow-300" />}
                      {style.id === "moonstar" && <Moon className="w-2.5 h-2.5 text-purple-300" />}
                      <span className="truncate">{style.name}</span>
                    </span>
                    {isActive && (
                      <span className="flex items-center gap-0.5 text-xs text-green-400 bg-green-500/20 px-1.5 py-0.5 rounded-full w-fit">
                        <Check className="w-2.5 h-2.5" />
                        Active
                      </span>
                    )}
                    {owned && !isActive && (
                      <span className="text-xs text-blue-400 bg-blue-500/20 px-1.5 py-0.5 rounded-full w-fit">
                        Owned
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription className="text-slate-400 text-xs line-clamp-1">
                    {style.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="p-2 pt-0">
                  <div className="bg-purple-800/70 rounded-lg p-2 mb-1.5 flex items-center justify-center gap-3 relative min-h-[3rem]">
                    <div className="text-sm text-gray-400 font-medium">
                      Click to preview
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    {style.isDefault || owned ? (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetActive(style.id);
                        }}
                        disabled={isActive || setActiveMutation.isPending}
                        size="sm"
                        className={`text-xs py-1 h-auto ${isActive 
                          ? "bg-green-600 hover:bg-green-700" 
                          : "bg-purple-600 hover:bg-purple-700"
                        }`}
                        data-testid={`button-activate-${style.id}`}
                      >
                        {isActive ? "Active" : "Activate"}
                      </Button>
                    ) : (
                      <>
                        <div className="flex items-center justify-center gap-0.5 text-yellow-400 text-xs font-bold">
                          <Coins className="w-3 h-3" />
                          <span data-testid={`text-price-${style.id}`}>{formatNumber(style.price)}</span>
                        </div>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePurchase(style.id, style.price);
                          }}
                          disabled={userCoins < style.price || purchaseMutation.isPending}
                          size="sm"
                          className="bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-xs py-1 h-auto"
                          data-testid={`button-purchase-${style.id}`}
                        >
                          {purchaseMutation.isPending ? "Buying..." : "Purchase"}
                        </Button>
                        {userCoins < style.price && (
                          <p className="text-red-400 text-xs text-center">
                            Need {formatNumber(style.price - userCoins)} more
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

          <TabsContent value="stickers">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {stickers.map((sticker) => {
                const owned = isStickerOwned(sticker.id);
                const affordable = userCoins >= sticker.price;
                const isPurchasing = purchaseStickerMutation.isPending && selectedSticker === sticker.id;

                return (
                  <Card 
                    key={sticker.id}
                    className={`relative overflow-hidden transition-all duration-300 backdrop-blur-sm border-2 ${
                      owned 
                        ? 'bg-gradient-to-br from-purple-900/90 to-black/95 border-green-400 shadow-lg shadow-green-500/30' 
                        : affordable
                        ? 'bg-gradient-to-br from-purple-900/90 to-black/95 border-purple-400/60 hover:border-purple-400 hover:shadow-xl hover:shadow-purple-500/30 hover:scale-[1.03]'
                        : 'bg-gradient-to-br from-purple-900/60 to-black/80 border-purple-700/40 opacity-60'
                    }`}
                    data-testid={`card-sticker-${sticker.id}`}
                  >
                    <CardHeader className="p-3 pb-2">
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                          <div className="w-14 h-14">
                            <img src={`/gif/${sticker.assetPath}`} alt={sticker.name} className="w-full h-full object-contain" />
                          </div>
                          {owned && (
                            <Badge className="bg-green-600 text-white text-xs px-1.5 py-0" data-testid={`badge-owned-${sticker.id}`}>
                              <Check className="w-2.5 h-2.5 mr-0.5" />
                              Owned
                            </Badge>
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-white text-sm truncate">{sticker.name}</CardTitle>
                          <CardDescription className="text-gray-400 text-xs line-clamp-2 mt-0.5">
                            {sticker.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-3 pt-0">
                      <div className="flex items-center gap-1 mb-1.5">
                        <Coins className="w-3.5 h-3.5 text-yellow-400" />
                        <span className={`font-bold text-xs ${affordable ? 'text-yellow-400' : 'text-gray-500'}`}>
                          {formatNumber(sticker.price)}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs text-purple-300 border-purple-400/50 px-1.5 py-0">
                        GIF
                      </Badge>
                    </CardContent>

                    <CardFooter className="p-3 pt-0">
                      {owned ? (
                        <Button 
                          disabled 
                          size="sm"
                          className="w-full bg-green-700 hover:bg-green-700 cursor-not-allowed text-xs"
                          data-testid={`button-owned-${sticker.id}`}
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Owned
                        </Button>
                      ) : (
                        <Button
                          onClick={() => {
                            setSelectedSticker(sticker.id);
                            purchaseStickerMutation.mutate(sticker.id);
                          }}
                          disabled={!affordable || isPurchasing}
                          size="sm"
                          className={`w-full text-xs ${
                            affordable 
                              ? 'bg-purple-600 hover:bg-purple-700' 
                              : 'bg-gray-700 cursor-not-allowed'
                          }`}
                          data-testid={`button-purchase-${sticker.id}`}
                        >
                          {isPurchasing ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                              Buying...
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-3 h-3 mr-1" />
                              {affordable ? 'Buy' : 'No Coins'}
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

          <TabsContent value="frames">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {AVATAR_FRAMES.map((frame) => {
                const owned = isFrameOwned(frame.id);
                const isActive = getActiveFrame() === frame.id;
                const affordable = userCoins >= frame.price;
                const isPurchasing = purchaseFrameMutation.isPending && selectedFrame === frame.id;

                return (
                  <Card 
                    key={frame.id}
                    onClick={() => setPreviewModal({ type: "frame", item: frame })}
                    className={`relative overflow-hidden transition-all duration-300 backdrop-blur-sm border-2 cursor-pointer ${
                      isActive 
                        ? 'bg-gradient-to-br from-purple-900/90 to-black/95 border-cyan-400 shadow-lg shadow-cyan-500/30' 
                        : owned
                        ? 'bg-gradient-to-br from-purple-900/90 to-black/95 border-blue-400/60 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/20 hover:scale-[1.03]' 
                        : affordable
                        ? 'bg-gradient-to-br from-purple-900/90 to-black/95 border-purple-400/60 hover:border-purple-400 hover:shadow-xl hover:shadow-purple-500/30 hover:scale-[1.03]'
                        : 'bg-gradient-to-br from-purple-900/60 to-black/80 border-purple-700/40 opacity-60'
                    }`}
                    data-testid={`card-frame-${frame.id}`}
                  >
                    <CardHeader className="p-2 pb-1">
                      <div className="flex flex-col gap-0.5">
                        <CardTitle className="text-white text-xs flex items-center gap-1">
                          <Stars className="w-2.5 h-2.5 text-yellow-400" />
                          <span className="truncate">{frame.name}</span>
                        </CardTitle>
                        {isActive && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/50 text-xs px-1.5 py-0 w-fit">
                            <Check className="w-2.5 h-2.5 mr-0.5" />
                            Active
                          </Badge>
                        )}
                        {owned && !isActive && (
                          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50 text-xs px-1.5 py-0 w-fit">
                            Owned
                          </Badge>
                        )}
                        <CardDescription className="text-slate-400 text-xs line-clamp-1">
                          {frame.description}
                        </CardDescription>
                      </div>
                    </CardHeader>

                    <CardContent className="p-2 pt-0 space-y-1.5">
                      <div className="flex justify-center py-1 min-h-[4rem] items-center">
                        <div className="text-sm text-gray-400 font-medium">
                          Click to preview
                        </div>
                      </div>

                      {!frame.isDefault && (
                        <div className="flex items-center justify-center gap-0.5 text-yellow-400 text-xs font-bold">
                          <Coins className="w-3 h-3" />
                          <span data-testid={`text-price-${frame.id}`}>
                            {formatNumber(frame.price)}
                          </span>
                        </div>
                      )}
                    </CardContent>

                    <CardFooter className="p-2 pt-0">
                      {frame.isDefault ? (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="w-full border-gray-600 text-xs"
                          disabled
                          data-testid={`button-default-${frame.id}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          Default
                        </Button>
                      ) : owned ? (
                        isActive ? (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveFrameMutation.mutate(null);
                            }}
                            variant="outline"
                            size="sm"
                            className="w-full border-red-500 text-red-400 hover:bg-red-500/10 text-xs py-1 h-auto"
                            data-testid={`button-deactivate-${frame.id}`}
                          >
                            Remove
                          </Button>
                        ) : (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveFrameMutation.mutate(frame.id);
                            }}
                            size="sm"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-xs py-1 h-auto"
                            data-testid={`button-activate-${frame.id}`}
                          >
                            <Check className="w-2.5 h-2.5 mr-1" />
                            Activate
                          </Button>
                        )
                      ) : (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFrame(frame.id);
                            purchaseFrameMutation.mutate(frame.id);
                          }}
                          disabled={!affordable || isPurchasing}
                          size="sm"
                          className={`w-full text-xs py-1 h-auto ${
                            affordable 
                              ? 'bg-purple-600 hover:bg-purple-700' 
                              : 'bg-gray-700 cursor-not-allowed'
                          }`}
                          data-testid={`button-purchase-${frame.id}`}
                        >
                          {isPurchasing ? (
                            <>
                              <div className="animate-spin rounded-full h-2.5 w-2.5 border-b-2 border-white mr-1"></div>
                              Buying...
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-2.5 h-2.5 mr-1" />
                              {affordable ? 'Buy' : 'No Coins'}
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

        {/* Modern Earn Coins Section */}
        <div className="mt-4">
          <Card className="bg-gradient-to-br from-purple-900/90 to-black/95 border-2 border-purple-400/60 backdrop-blur-md shadow-2xl max-w-5xl mx-auto">
            <CardHeader className="text-center pb-2 pt-3">
              <CardTitle className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500 flex items-center justify-center gap-1.5">
                <Coins className="w-4 h-4 text-yellow-400" />
                How to Earn Coins
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 pt-0 pb-3 px-3">
              {/* Earn Methods Grid - Horizontal */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-gradient-to-br from-purple-800/80 to-black/90 border border-purple-400/60 rounded-lg p-2 text-center hover:border-purple-400 transition-all">
                  <Coins className="w-4 h-4 text-purple-300 mx-auto mb-1" />
                  <p className="font-semibold text-white text-xs">Win Games</p>
                </div>
                <div className="bg-gradient-to-br from-purple-800/80 to-black/90 border border-purple-400/60 rounded-lg p-2 text-center hover:border-purple-400 transition-all">
                  <Coins className="w-4 h-4 text-purple-300 mx-auto mb-1" />
                  <p className="font-semibold text-white text-xs">Top Leaderboard</p>
                </div>
                <div className="bg-gradient-to-br from-purple-800/80 to-black/90 border border-purple-400/60 rounded-lg p-2 text-center hover:border-purple-400 transition-all">
                  <Coins className="w-4 h-4 text-purple-300 mx-auto mb-1" />
                  <p className="font-semibold text-white text-xs">Daily Rewards</p>
                </div>
              </div>

              {/* Coin Packages */}
              <div className="border-t border-purple-700/40 pt-2">
                <h3 className="text-center text-sm font-bold text-white mb-2">💰 Purchase Coins</h3>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div className="bg-gradient-to-r from-yellow-500/15 to-orange-500/15 border border-yellow-500/40 rounded-lg p-2 hover:border-yellow-500/60 transition-all">
                    <div className="flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-yellow-400" />
                      <div className="flex-1">
                        <p className="text-yellow-400 font-bold text-xs">10M</p>
                        <p className="text-green-400 font-bold text-sm">₹100</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-green-500/15 to-emerald-500/15 border border-green-500/40 rounded-lg p-2 hover:border-green-500/60 transition-all relative">
                    <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">30% OFF</div>
                    <div className="flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-yellow-400" />
                      <div className="flex-1">
                        <p className="text-yellow-400 font-bold text-xs">100M</p>
                        <p className="text-green-400 font-bold text-sm">₹700</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Contact Section */}
                <div className="text-center bg-purple-800/70 rounded-lg p-2 border border-purple-400/60">
                  <p className="text-slate-400 text-xs">
                    Contact: <a 
                      href="mailto:support@darklayerstudios.com" 
                      className="text-yellow-400 hover:text-yellow-300 font-semibold underline"
                      data-testid="link-support-email"
                    >support@darklayerstudios.com</a>
                  </p>
                </div>
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
          stickerAnimation={purchaseDetails.animation}
        />
      )}

      {/* Preview Modal */}
      {previewModal && (
        <Dialog open={!!previewModal} onOpenChange={() => setPreviewModal(null)}>
          <DialogContent className="sm:max-w-lg bg-gradient-to-br from-purple-950/98 via-black/95 to-purple-950/98 border-4 border-purple-400/60 shadow-2xl shadow-purple-500/50 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-purple-400 to-yellow-400 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
                {previewModal.item.name}
              </DialogTitle>
            </DialogHeader>
            
            <div className="py-6">
              {previewModal.type === "piece" ? (
                <div className="space-y-4">
                  <p className="text-blue-600 text-center text-sm mb-6">
                    {previewModal.item.description}
                  </p>
                  
                  {/* Large Preview Animation */}
                  <div className="bg-black rounded-2xl p-8 border-2 border-purple-400/40 shadow-inner">
                    <div className="flex items-center justify-center gap-8">
                      <div className="w-20 h-20 flex items-center justify-center transform hover:scale-110 transition-transform">
                        <AnimatedPiece 
                          symbol="X" 
                          style={previewModal.item.id as "default" | "thunder" | "fire" | "hammer" | "autumn" | "lovers" | "flower" | "greenleaf" | "cat" | "bestfriends" | "lotus" | "holi" | "tulip" | "butterfly" | "peacock" | "bulb" | "moonstar"} 
                          className={previewModal.item.id === "default" ? "text-5xl text-blue-400 font-bold" : "text-blue-400 text-5xl"}
                        />
                      </div>
                      <div className="text-3xl text-purple-400 font-bold">VS</div>
                      <div className="w-20 h-20 flex items-center justify-center transform hover:scale-110 transition-transform">
                        <AnimatedPiece 
                          symbol="O" 
                          style={previewModal.item.id as "default" | "thunder" | "fire" | "hammer" | "autumn" | "lovers" | "flower" | "greenleaf" | "cat" | "bestfriends" | "lotus" | "holi" | "tulip" | "butterfly" | "peacock" | "bulb" | "moonstar"} 
                          className={previewModal.item.id === "default" ? "text-5xl text-red-400 font-bold" : "text-red-400 text-5xl"}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Price and Actions */}
                  <div className="flex flex-col gap-3 pt-4">
                    {!previewModal.item.isDefault && !isStyleOwned(previewModal.item.id) && (
                      <div className="flex items-center justify-center gap-2 text-yellow-400 text-lg font-bold">
                        <Coins className="w-5 h-5" />
                        <span>{formatNumber(previewModal.item.price)}</span>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      {previewModal.item.isDefault || isStyleOwned(previewModal.item.id) ? (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetActive(previewModal.item.id);
                            setPreviewModal(null);
                          }}
                          disabled={activeStyle === previewModal.item.id || setActiveMutation.isPending}
                          className={`flex-1 ${activeStyle === previewModal.item.id 
                            ? "bg-green-600 hover:bg-green-700" 
                            : "bg-purple-600 hover:bg-purple-700"
                          }`}
                        >
                          {activeStyle === previewModal.item.id ? (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Active
                            </>
                          ) : (
                            "Activate"
                          )}
                        </Button>
                      ) : (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePurchase(previewModal.item.id, previewModal.item.price);
                            setPreviewModal(null);
                          }}
                          disabled={userCoins < previewModal.item.price || purchaseMutation.isPending}
                          className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50"
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          {purchaseMutation.isPending ? "Buying..." : "Purchase"}
                        </Button>
                      )}
                      <Button
                        onClick={() => setPreviewModal(null)}
                        variant="outline"
                        className="flex-1 border-gray-600 hover:bg-gray-800"
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-blue-600 text-center text-sm mb-6">
                    {previewModal.item.description}
                  </p>
                  
                  {/* Large Avatar Preview */}
                  <div className="bg-black rounded-2xl p-8 border-2 border-purple-400/40 shadow-inner">
                    <div className="flex justify-center">
                      {user && (
                        <div className="transform hover:scale-110 transition-transform">
                          <AvatarWithFrame
                            src={userData?.profileImageUrl || user.profileImageUrl || undefined}
                            alt="Preview"
                            size="lg"
                            borderType={previewModal.item.id}
                            fallbackText={user.username?.[0]?.toUpperCase() || user.displayName?.[0]?.toUpperCase() || '?'}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Price and Actions */}
                  <div className="flex flex-col gap-3 pt-4">
                    {!previewModal.item.isDefault && !isFrameOwned(previewModal.item.id) && (
                      <div className="flex items-center justify-center gap-2 text-yellow-400 text-lg font-bold">
                        <Coins className="w-5 h-5" />
                        <span>{formatNumber(previewModal.item.price)}</span>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      {previewModal.item.isDefault ? (
                        <Button
                          variant="outline"
                          className="flex-1 border-gray-600"
                          disabled
                        >
                          Default Frame
                        </Button>
                      ) : isFrameOwned(previewModal.item.id) ? (
                        getActiveFrame() === previewModal.item.id ? (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveFrameMutation.mutate(null);
                              setPreviewModal(null);
                            }}
                            variant="outline"
                            className="flex-1 border-red-500 text-red-400 hover:bg-red-500/10"
                          >
                            Remove Frame
                          </Button>
                        ) : (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveFrameMutation.mutate(previewModal.item.id);
                              setPreviewModal(null);
                            }}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Activate
                          </Button>
                        )
                      ) : (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFrame(previewModal.item.id);
                            purchaseFrameMutation.mutate(previewModal.item.id);
                            setPreviewModal(null);
                          }}
                          disabled={userCoins < previewModal.item.price || purchaseFrameMutation.isPending}
                          className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          {purchaseFrameMutation.isPending ? "Buying..." : "Purchase"}
                        </Button>
                      )}
                      <Button
                        onClick={() => setPreviewModal(null)}
                        variant="outline"
                        className="flex-1 border-gray-600 hover:bg-gray-800"
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
