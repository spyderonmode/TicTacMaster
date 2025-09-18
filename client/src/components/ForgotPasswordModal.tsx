import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, CheckCircle, AlertTriangle, Mail } from "lucide-react";

interface ForgotPasswordModalProps {
  onClose: () => void;
}

export function ForgotPasswordModal({ onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        toast({
          title: "Reset Code Sent",
          description: data.message,
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to send reset email.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Failed to send reset email. Please check your internet connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 bg-slate-800 border-slate-700">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
            <KeyRound className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-white text-xl">
            {isSuccess ? "Reset Email Sent" : "Forgot Password"}
          </CardTitle>
          <CardDescription className="text-slate-300">
            {isSuccess 
              ? "Check your email for your password reset code"
              : "Enter your email address to receive a password reset code"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isSuccess ? (
            <>
              <Alert className="bg-green-900 border-green-700">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <AlertDescription className="text-green-300">
                  If an account with this email exists, a password reset code has been sent.
                </AlertDescription>
              </Alert>
              
              <div className="text-sm text-slate-400 text-center">
                Check your email inbox for your 6-digit reset code.
              </div>
              
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => {
                    onClose();
                    setLocation('/reset-password');
                  }}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  Enter Reset Code
                </Button>
                
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Back to Login
                </Button>
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-slate-300">Email Address</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  {isLoading ? 'Sending...' : 'Send Reset Code'}
                </Button>
                
                <Button
                  type="button"
                  onClick={onClose}
                  variant="secondary"
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white"
                >
                  Cancel
                </Button>
              </div>
              

            </form>
          )}
          
          <div className="text-xs text-slate-500 text-center">
            Remember your password? Return to login to sign in.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}