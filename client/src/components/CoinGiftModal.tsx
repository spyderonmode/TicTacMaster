import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Gift, Coins } from "lucide-react";
import { BasicFriendInfo } from "@shared/schema";

interface CoinGiftModalProps {
  open: boolean;
  onClose: () => void;
  friend: BasicFriendInfo | null;
  currentUserCoins: number;
}

export function CoinGiftModal({ open, onClose, friend, currentUserCoins }: CoinGiftModalProps) {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sendGiftMutation = useMutation({
    mutationFn: async (data: { recipientId: string; amount: number; message?: string }) => {
      const response = await apiRequest('/api/coins/gift', {
        method: 'POST',
        body: data
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "🎁 Gift Sent!",
        description: data.message,
      });
      // Invalidate relevant queries to refresh coin balances
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/coins'] });
      resetForm();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Gift",
        description: error.message || "Unable to send coin gift. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setAmount("");
    setMessage("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!friend) return;

    // Validate amount
    const giftAmount = parseInt(amount);
    if (!amount.trim() || isNaN(giftAmount) || giftAmount < 1) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid gift amount (minimum 1 coin).",
        variant: "destructive",
      });
      return;
    }

    if (giftAmount > currentUserCoins) {
      toast({
        title: "Insufficient Coins",
        description: `You only have ${currentUserCoins.toLocaleString()} coins available.`,
        variant: "destructive",
      });
      return;
    }

    sendGiftMutation.mutate({
      recipientId: friend.id,
      amount: giftAmount,
      message: message.trim() || undefined
    });
  };

  const handleClose = () => {
    if (!sendGiftMutation.isPending) {
      resetForm();
      onClose();
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers
    if (value === '' || /^\d+$/.test(value)) {
      setAmount(value);
    }
  };

  const quickAmountButtons = [100, 500, 1000, 5000];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white" data-testid="modal-coin-gift">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Gift className="w-5 h-5 text-yellow-400" />
            Send Coins to {friend?.displayName || friend?.username}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-slate-700 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Coins className="w-4 h-4 text-yellow-400" />
              Your current balance: <span className="text-yellow-400 font-semibold">{currentUserCoins.toLocaleString()}</span> coins
            </div>
          </div>

          <div>
            <Label htmlFor="amount" className="text-sm font-medium text-gray-300">
              Gift Amount
            </Label>
            <Input
              id="amount"
              placeholder="Enter amount of coins"
              value={amount}
              onChange={handleAmountChange}
              className="bg-slate-700 border-slate-600 text-white mt-1"
              disabled={sendGiftMutation.isPending}
              data-testid="input-gift-amount"
            />
            
            {/* Quick amount buttons */}
            <div className="flex gap-2 mt-2">
              {quickAmountButtons.map((quickAmount) => (
                <Button
                  key={quickAmount}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(quickAmount.toString())}
                  disabled={sendGiftMutation.isPending || quickAmount > currentUserCoins}
                  className="border-slate-600 text-gray-300 hover:bg-slate-700"
                  data-testid={`button-quick-amount-${quickAmount}`}
                >
                  {quickAmount.toLocaleString()}
                </Button>
              ))}
            </div>
          </div>
          
          <div>
            <Label htmlFor="message" className="text-sm font-medium text-gray-300">
              Message (Optional)
            </Label>
            <Textarea
              id="message"
              placeholder="Add a message with your gift..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white mt-1 min-h-[80px]"
              disabled={sendGiftMutation.isPending}
              maxLength={200}
              data-testid="textarea-gift-message"
            />
            <div className="text-xs text-gray-400 mt-1">
              {message.length}/200 characters
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={sendGiftMutation.isPending}
              className="border-slate-600 text-gray-300 hover:bg-slate-700"
              data-testid="button-cancel-gift"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={sendGiftMutation.isPending || !amount.trim()}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
              data-testid="button-send-gift"
            >
              {sendGiftMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending Gift...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4" />
                  Send Gift
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}