import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { EmailVerificationModal } from "@/components/EmailVerificationModal";
import { ForgotPasswordModal } from "@/components/ForgotPasswordModal";
import { GamepadIcon, Mail } from "lucide-react";
import { useTranslation } from "@/contexts/LanguageContext";
import { queryClient } from "@/lib/queryClient";


export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [registrationEmail, setRegistrationEmail] = useState("");
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        if (response.ok) {
          // Invalidate auth query to refresh user state immediately
          await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
          
          toast({
            title: t('loginSuccessful'),
            description: t('welcomeBack'),
          });
          
          // Redirect immediately after invalidating query
          setLocation('/');
        } else {
          const errorData = await response.json();
          
          if (errorData.needsVerification) {
            // User needs email verification
            setRegistrationEmail(email || username); // Use email if available, otherwise username
            setShowEmailVerification(true);
            toast({
              title: t('emailVerificationRequired'),
              description: errorData.message || t('pleaseVerifyEmailBeforeLogin'),
              variant: "destructive",
            });
          } else {
            toast({
              title: t('loginFailed'),
              description: errorData.error || t('pleaseCheckCredentials'),
              variant: "destructive",
            });
          }
        }
      } else {
        if (!email) {
          toast({
            title: t('emailRequired'),
            description: t('pleaseProvideEmailToRegister'),
            variant: "destructive",
          });
          return;
        }
        
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password, email })
        });

        if (response.ok) {
          const data = await response.json();
          setRegistrationEmail(email);
          toast({
            title: t('registrationSuccessful'),
            description: data.message || t('pleaseVerifyEmailToContinue'),
          });
          
          // Show email verification modal
          setShowEmailVerification(true);
        } else {
          const errorData = await response.json();
          toast({
            title: t('registrationFailed'),
            description: errorData.error || t('pleaseCheckInformationAndTryAgain'),
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: isLogin ? t('loginFailed') : t('registrationFailed'),
        description: error instanceof Error ? error.message : t('pleaseCheckCredentials'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    // Prevent multiple guest creations
    if (isGuestLoading) return;
    
    setIsGuestLoading(true);

    try {
      const response = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        
        toast({
          title: t('loginSuccessful'),
          description: 'Welcome! You\'re playing as a guest.',
        });
        
        setLocation('/');
      } else {
        const errorData = await response.json();
        toast({
          title: 'Guest Login Failed',
          description: errorData.error || 'Failed to create guest session',
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: 'Guest Login Failed',
        description: 'Network error. Please try again.',
        variant: "destructive",
      });
    } finally {
      setIsGuestLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
              <GamepadIcon className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{t('appName')}</h1>
          <p className="text-slate-400">{t('strategicTicTacToe')}</p>
        </div>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-white">
              {isLogin ? t('login') : t('register')}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {isLogin 
                ? t('enterCredentialsToAccess')
                : t('enterDetailsToCreate')
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-300">
                  {isLogin ? t('usernameOrEmail') : t('username')}
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder={isLogin ? t('enterUsernameOrEmail') : t('enterUsername')}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">{t('email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('enterEmail')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <p className="text-xs text-slate-400">
                    {t('emailRequiredForVerification')}
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">{t('password')}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('enterPassword')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? t('loading') : (isLogin ? t('login') : t('register'))}
              </Button>
            </form>
            
            {/* Guest Login Option */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-600" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-800 px-2 text-slate-400">Or</span>
              </div>
            </div>
            
            <Button 
              onClick={handleGuestLogin}
              className="w-full bg-slate-600 hover:bg-slate-500 text-white"
              disabled={isGuestLoading}
              variant="outline"
            >
              {isGuestLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Creating Guest Session...
                </>
              ) : (
                <>
                  <GamepadIcon className="mr-2 h-4 w-4" />
                  Play as Guest
                </>
              )}
            </Button>
            
            <p className="text-xs text-slate-400 text-center mt-2">
              Start playing instantly without registration. Progress saved until logout.
            </p>
            
            <div className="text-center space-y-2">
              {isLogin && (
                <Button
                  type="button"
                  variant="link"
                  className="text-slate-400 hover:text-white text-sm"
                  onClick={() => setShowForgotPassword(true)}
                >
                  {t('forgotPassword')}
                </Button>
              )}
              
              <Button
                type="button"
                variant="link"
                className="text-slate-400 hover:text-white"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin 
                  ? t('dontHaveAccountSignUp')
                  : t('alreadyHaveAccountSignIn')
                }
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Email Verification Modal */}
        {showEmailVerification && (
          <EmailVerificationModal 
            email={registrationEmail}
            onClose={() => setShowEmailVerification(false)}
          />
        )}
        
        {/* Forgot Password Modal */}
        {showForgotPassword && (
          <ForgotPasswordModal 
            onClose={() => setShowForgotPassword(false)}
          />
        )}
      </div>
    </div>
  );
}