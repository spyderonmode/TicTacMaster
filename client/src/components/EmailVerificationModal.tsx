import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Mail, CheckCircle } from "lucide-react";

interface EmailVerificationModalProps {
  email: string;
  onClose: () => void;
}

export function EmailVerificationModal({ email, onClose }: EmailVerificationModalProps) {
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const { toast } = useToast();

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (response.ok) {
        setResendSuccess(true);
        toast({
          title: "Email Sent",
          description: "Verification email has been resent successfully.",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to resend verification email.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend verification email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 bg-slate-800 border-slate-700">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-white text-xl">Email Verification Required</CardTitle>
          <CardDescription className="text-slate-300">
            Please verify your email address to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-slate-700 border-slate-600">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-slate-300">
              A 6-digit verification code has been sent to <strong className="text-white">{email}</strong>
            </AlertDescription>
          </Alert>
          
          <div className="text-sm text-slate-400 text-center">
            Check your email inbox for the verification code and enter it on the verification page.
          </div>
          
          {resendSuccess && (
            <Alert className="bg-green-900 border-green-700">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-300">
                Verification email has been resent successfully!
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { path: '/verify-email' } }))}
              className="w-full bg-primary hover:bg-primary/90"
            >
              Enter Verification Code
            </Button>
            
            <Button
              onClick={handleResendVerification}
              disabled={isResending}
              variant="outline"
              className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              {isResending ? 'Resending...' : 'Resend Verification Code'}
            </Button>
            
            <Button
              onClick={onClose}
              variant="secondary"
              className="w-full bg-slate-700 hover:bg-slate-600 text-white"
            >
              Back to Login
            </Button>
          </div>
          
          <div className="text-xs text-slate-500 text-center">
            Didn't receive the code? Check your spam folder or try resending.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}