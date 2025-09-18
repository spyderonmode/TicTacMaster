import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Mail } from "lucide-react";

export default function VerifyEmail() {
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter your verification code",
        variant: "destructive",
      });
      return;
    }

    if (verificationCode.length !== 6 || !/^\d+$/.test(verificationCode)) {
      toast({
        title: "Error",
        description: "Verification code must be 6 digits",
        variant: "destructive",
      });
      return;
    }

    setVerificationStatus('loading');
    
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verificationCode })
      });

      if (response.ok) {
        const data = await response.json();
        setVerificationStatus('success');
        setMessage(data.message || 'Email verified successfully!');
        
        toast({
          title: "Email Verified",
          description: "Your email has been verified successfully. You can now log in.",
        });
      } else {
        const errorData = await response.json();
        setVerificationStatus('error');
        setMessage(errorData.error || 'Failed to verify email');
      }
    } catch (error) {
      setVerificationStatus('error');
      setMessage('Failed to verify email. Please try again.');
    }
  };

  const handleLoginRedirect = () => {
    setLocation('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 rounded-full w-fit">
            {verificationStatus === 'idle' && (
              <div className="bg-blue-100 p-3 rounded-full">
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
            )}
            {verificationStatus === 'loading' && (
              <div className="bg-blue-100 p-3 rounded-full">
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
            )}
            {verificationStatus === 'success' && (
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            )}
            {verificationStatus === 'error' && (
              <div className="bg-red-100 p-3 rounded-full">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            )}
          </div>
          <CardTitle className="text-white text-xl">
            {(verificationStatus === 'idle' || verificationStatus === 'loading') && 'Verify Your Email'}
            {verificationStatus === 'success' && 'Email Verified!'}
            {verificationStatus === 'error' && 'Verification Failed'}
          </CardTitle>
          <CardDescription className="text-slate-300">
            {(verificationStatus === 'idle' || verificationStatus === 'loading') && 'Enter the 6-digit code we sent to your email'}
            {verificationStatus === 'success' && 'Your account has been successfully verified'}
            {verificationStatus === 'error' && 'There was an issue verifying your email'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(verificationStatus === 'idle' || verificationStatus === 'loading') && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verificationCode" className="text-slate-300">Verification Code</Label>
                <Input
                  id="verificationCode"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="bg-slate-700 border-slate-600 text-white text-center text-2xl font-mono letter-spacing-wide"
                  maxLength={6}
                  autoComplete="off"
                />
              </div>
              <Button
                onClick={handleVerifyCode}
                disabled={verificationStatus === 'loading'}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {verificationStatus === 'loading' ? 'Verifying...' : 'Verify Email'}
              </Button>
            </div>
          )}
          
          {(verificationStatus === 'success' || verificationStatus === 'error') && (
            <Alert className={`${
              verificationStatus === 'success' ? 'bg-green-900 border-green-700' : 
              'bg-red-900 border-red-700'
            }`}>
              <AlertDescription className={`${
                verificationStatus === 'success' ? 'text-green-300' : 'text-red-300'
              }`}>
                {message}
              </AlertDescription>
            </Alert>
          )}
          
          {verificationStatus !== 'loading' && (
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleLoginRedirect}
                variant="outline"
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                {verificationStatus === 'success' ? 'Continue to Login' : 'Back to Login'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}