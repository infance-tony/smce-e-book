import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, loading } = useAuth();

  // Get redirect path from location state
  const from = location.state?.from?.pathname || "/departments";
  const authError = location.state?.error;

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      console.log('✅ Login: User already authenticated, redirecting to:', from);
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, from]);

  // Show auth error from redirect if present
  useEffect(() => {
    if (authError) {
      toast({
        title: "Authentication Error",
        description: authError,
        variant: "destructive",
      });
    }
  }, [authError, toast]);

  const validateEmail = (email: string) => {
    // Validate any email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const handleGoogleSignIn = async () => {
    if (isLoading) return;
    
    setIsGoogleLoading(true);
    console.log('🔐 Login: Starting Google sign-in...');
    
    try {
      // Use the actual current URL origin for redirect (works in Codespaces, localhost, and production)
      const redirectUrl = `${window.location.origin}${from}`;
      console.log('🔗 Login: Google OAuth redirect URL:', redirectUrl);
      console.log('🌐 Login: Current origin:', window.location.origin);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          scopes: 'email profile'
        }
      });

      if (error) {
        console.error('❌ Login: Google sign-in error:', error);
        toast({
          title: "Google Sign-in Error",
          description: "Failed to sign in with Google. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Login: Unexpected Google sign-in error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred during Google sign-in",
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || isGoogleLoading) return;
    
    setIsLoading(true);
    console.log('🔐 Login: Starting email/password login for:', email);

    try {
      // Email validation
      if (!validateEmail(email)) {
        toast({
          title: "Invalid Email",
          description: "Please enter a valid email address",
          variant: "destructive",
        });
        return;
      }

      // Password validation
      if (!validatePassword(password)) {
        toast({
          title: "Invalid Password",
          description: "Password must be at least 6 characters long",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        console.error('❌ Login: Sign-in error:', error);
        let errorMessage = "Login failed. Please check your credentials.";
        
        switch (error.message) {
          case 'Invalid login credentials':
            errorMessage = "Invalid email or password. Please check your credentials and try again.";
            break;
          case 'Email not confirmed':
            errorMessage = "Please check your email and click the confirmation link before signing in.";
            break;
          case 'Too many requests':
            errorMessage = "Too many login attempts. Please wait a few minutes and try again.";
            break;
        }
        
        toast({
          title: "Login Failed",
          description: errorMessage,
          variant: "destructive",
        });
      } else if (data.user) {
        console.log('✅ Login: Email/password login successful for:', data.user.email);
        toast({
          title: "Welcome!",
          description: "You have been signed in successfully.",
        });
      }
    } catch (error) {
      console.error('❌ Login: Unexpected login error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || isGoogleLoading) return;
    
    setIsLoading(true);
    console.log('🔐 Login: Starting email/password signup for:', email);

    try {
      // Email validation
      if (!validateEmail(email)) {
        toast({
          title: "Invalid Email",
          description: "Please enter a valid email address",
          variant: "destructive",
        });
        return;
      }

      // Password validation
      if (!validatePassword(password)) {
        toast({
          title: "Weak Password",
          description: "Password must be at least 6 characters long",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}${from}`,
          data: {
            full_name: email.split('@')[0].replace(/[._]/g, ' ').toLowerCase()
              .split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
          }
        }
      });

      if (error) {
        console.error('❌ Login: Sign-up error:', error);
        let errorMessage = "Sign up failed. Please try again.";
        
        if (error.message.toLowerCase().includes('already registered')) {
          errorMessage = "This email is already registered. Please try signing in instead.";
        } else if (error.message.toLowerCase().includes('password')) {
          errorMessage = "Password should be at least 6 characters long.";
        } else if (error.message.toLowerCase().includes('email')) {
          errorMessage = "Please enter a valid email address";
        } else {
          errorMessage = error.message;
        }
        
        toast({
          title: "Sign Up Failed",
          description: errorMessage,
          variant: "destructive",
        });
      } else if (data.user) {
        console.log('✅ Login: Sign-up successful for:', data.user.email);
        
        // Check if email confirmation is required
        const confirmationRequired = data.user.identities && data.user.identities.length === 0;
        
        if (confirmationRequired) {
          toast({
            title: "Almost There!",
            description: "Please check your email and click the confirmation link to complete your registration.",
          });
          
          // Clear form
          setEmail("");
          setPassword("");
        } else {
          // User is automatically signed in (confirmation not required)
          toast({
            title: "Welcome!",
            description: "Your account has been created successfully.",
          });
          
          // Don't clear form, let the auth state change redirect the user
          console.log('✅ Login: User automatically signed in, redirecting...');
        }
      }
    } catch (error) {
      console.error('❌ Login: Unexpected sign-up error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred during sign up",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading spinner during initialization
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-50">
        <div className="text-center">
          <img 
            src="/lovable-uploads/4654f30c-aa07-40bb-bc93-3018329fb8f8.png" 
            alt="SMCE" 
            className="h-16 w-16 mx-auto animate-pulse"
          />
          <p className="mt-4 text-muted-foreground">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 relative overflow-hidden">
      {/* Decorative Vector Elements */}
      <svg className="absolute top-0 left-0 w-32 sm:w-64 h-32 sm:h-64 opacity-10" viewBox="0 0 200 200">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor:"#10b981", stopOpacity:1}} />
            <stop offset="100%" style={{stopColor:"#059669", stopOpacity:1}} />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="40" fill="url(#grad1)"/>
        <circle cx="150" cy="80" r="30" fill="url(#grad1)"/>
        <circle cx="120" cy="150" r="25" fill="url(#grad1)"/>
      </svg>

      <svg className="absolute bottom-0 right-0 w-40 sm:w-80 h-40 sm:h-80 opacity-10" viewBox="0 0 300 300">
        <path d="M50 150 Q 150 50 250 150 Q 150 250 50 150" fill="#10b981"/>
        <circle cx="100" cy="100" r="15" fill="#059669"/>
        <circle cx="200" cy="200" r="20" fill="#059669"/>
      </svg>

      <div className="absolute top-20 right-20 w-8 h-8 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute bottom-40 left-20 sm:left-40 w-6 h-6 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-emerald-500 transform rotate-45 opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>

      <div className="relative z-10 container mx-auto px-4 py-4 sm:py-8 min-h-screen">
        {/* Show authentication error if present */}
        {authError && (
          <div className="mb-4 mx-auto max-w-md">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Authentication Error</h3>
                <p className="text-sm text-red-600 mt-1">{authError}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-4 sm:gap-8 items-center min-h-screen">
          
          {/* Left Pane - Branding */}
          <div className="hidden lg:flex flex-col justify-center space-y-6 sm:space-y-8 animate-fade-in">
            <div className="text-center space-y-4 sm:space-y-6">
              <div className="flex items-center justify-center space-x-4">
                <img 
                  src="/lovable-uploads/4654f30c-aa07-40bb-bc93-3018329fb8f8.png" 
                  alt="Stella Mary's College of Engineering" 
                  className="h-16 sm:h-20 w-auto"
                />
              </div>
              
              <div className="max-w-md mx-auto">
                <h2 className="text-xl sm:text-2xl font-semibold text-emerald-800 mb-4">
                  Access Your Digital Library
                </h2>
                <p className="text-base sm:text-lg text-emerald-600 leading-relaxed">
                  Your comprehensive digital platform for accessing engineering study materials, 
                  e-books, and academic resources organized by department and semester.
                </p>
              </div>

              <div className="max-w-xs sm:max-w-sm mx-auto">
                <svg viewBox="0 0 400 300" className="w-full h-auto">
                  <defs>
                    <linearGradient id="bookGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{stopColor:"#10b981", stopOpacity:0.8}} />
                      <stop offset="100%" style={{stopColor:"#059669", stopOpacity:0.9}} />
                    </linearGradient>
                  </defs>
                  
                  <rect x="50" y="180" width="80" height="100" rx="5" fill="url(#bookGrad)" opacity="0.9"/>
                  <rect x="60" y="170" width="80" height="100" rx="5" fill="#16a34a" opacity="0.8"/>
                  <rect x="70" y="160" width="80" height="100" rx="5" fill="#22c55e" opacity="0.7"/>
                  
                  <rect x="200" y="120" width="120" height="80" rx="8" fill="#f3f4f6" stroke="#10b981" strokeWidth="2"/>
                  <rect x="210" y="130" width="100" height="60" rx="4" fill="#10b981" opacity="0.1"/>
                  
                  <path d="M150 200 Q 175 180 200 160" stroke="#10b981" strokeWidth="2" fill="none" strokeDasharray="5,5" opacity="0.6"/>
                  
                  <circle cx="320" cy="80" r="8" fill="#22c55e" opacity="0.6"/>
                  <circle cx="340" cy="100" r="6" fill="#16a34a" opacity="0.6"/>
                  <circle cx="360" cy="60" r="4" fill="#10b981" opacity="0.6"/>
                </svg>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-xs sm:max-w-sm mx-auto">
                <div className="text-center p-3 sm:p-4 glass-effect rounded-lg">
                  <div className="text-xl sm:text-2xl font-bold text-primary">6</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Departments</div>
                </div>
                <div className="text-center p-3 sm:p-4 glass-effect rounded-lg">
                  <div className="text-xl sm:text-2xl font-bold text-primary">8</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Semesters</div>
                </div>
                <div className="text-center p-3 sm:p-4 glass-effect rounded-lg">
                  <div className="text-xl sm:text-2xl font-bold text-primary">1000+</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">E-Books</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Pane - Login Form */}
          <div className="flex justify-center lg:justify-end animate-scale-in">
            <div className="w-full">
              <div className="flex justify-center mb-6 lg:hidden">
                <img 
                  src="/lovable-uploads/4654f30c-aa07-40bb-bc93-3018329fb8f8.png" 
                  alt="SMCE" 
                  className="h-12 w-auto"
                />
              </div>
              
              <Card className="w-full max-w-md shadow-2xl border-0 glass-effect">
                <CardHeader className="text-center space-y-2">
                  <CardTitle className="text-xl sm:text-2xl font-bold text-emerald-900">
                    Welcome {from !== '/departments' ? 'Back' : ''}
                  </CardTitle>
                  <CardDescription className="text-emerald-600 text-sm sm:text-base">
                    Sign in to access your e-books and study materials
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <Tabs defaultValue="login" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6">
                      <TabsTrigger value="login">Login</TabsTrigger>
                      <TabsTrigger value="signup">Sign Up</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="login" className="space-y-4 sm:space-y-6">
                      <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-emerald-700 text-sm sm:text-base">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="email"
                              type="email"
                              placeholder="your.email@example.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="pl-10 border-emerald-200 focus:border-primary text-sm sm:text-base"
                              required
                              disabled={isLoading || isGoogleLoading}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="password" className="text-emerald-700 text-sm sm:text-base">Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="password"
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter your password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="pl-10 pr-10 border-emerald-200 focus:border-primary text-sm sm:text-base"
                              required
                              disabled={isLoading || isGoogleLoading}
                              minLength={6}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-1 top-1 h-8 w-8 p-0"
                              onClick={() => setShowPassword(!showPassword)}
                              disabled={isLoading || isGoogleLoading}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        
                        <Button 
                          type="submit" 
                          className="w-full bg-primary hover:bg-primary/90 text-white font-medium"
                          disabled={isLoading || isGoogleLoading}
                        >
                          {isLoading ? (
                            <div className="flex items-center space-x-2">
                              <img 
                                src="/lovable-uploads/4654f30c-aa07-40bb-bc93-3018329fb8f8.png" 
                                alt="Loading" 
                                className="w-4 h-4 animate-spin"
                              />
                              <span>Signing In...</span>
                            </div>
                          ) : (
                            "Sign In"
                          )}
                        </Button>
                      </form>
                      
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-emerald-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
                        </div>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        className="w-full border-emerald-200 hover:bg-emerald-50 text-emerald-700"
                        onClick={handleGoogleSignIn}
                        disabled={isGoogleLoading || isLoading}
                        type="button"
                      >
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        {isGoogleLoading ? (
                          <div className="flex items-center space-x-2">
                            <img 
                              src="/lovable-uploads/4654f30c-aa07-40bb-bc93-3018329fb8f8.png" 
                              alt="Loading" 
                              className="w-4 h-4 animate-spin"
                            />
                            <span>Connecting...</span>
                          </div>
                        ) : (
                          "Continue with Google"
                        )}
                      </Button>
                    </TabsContent>
                    
                    <TabsContent value="signup" className="space-y-4">
                      <form onSubmit={handleSignUp} className="space-y-3 sm:space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="signup-email" className="text-emerald-700 text-sm sm:text-base">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="signup-email"
                              type="email"
                              placeholder="your.email@example.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="pl-10 border-emerald-200 focus:border-primary text-sm sm:text-base"
                              required
                              disabled={isLoading || isGoogleLoading}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="signup-password" className="text-emerald-700 text-sm sm:text-base">Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="signup-password"
                              type={showPassword ? "text" : "password"}
                              placeholder="Create a password (min. 6 characters)"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="pl-10 pr-10 border-emerald-200 focus:border-primary text-sm sm:text-base"
                              required
                              disabled={isLoading || isGoogleLoading}
                              minLength={6}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-1 top-1 h-8 w-8 p-0"
                              onClick={() => setShowPassword(!showPassword)}
                              disabled={isLoading || isGoogleLoading}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        
                        <Button 
                          type="submit" 
                          className="w-full bg-primary hover:bg-primary/90 text-white font-medium"
                          disabled={isLoading || isGoogleLoading}
                        >
                          {isLoading ? (
                            <div className="flex items-center space-x-2">
                              <img 
                                src="/lovable-uploads/4654f30c-aa07-40bb-bc93-3018329fb8f8.png" 
                                alt="Loading" 
                                className="w-4 h-4 animate-spin"
                              />
                              <span>Creating Account...</span>
                            </div>
                          ) : (
                            "Create Account"
                          )}
                        </Button>
                      </form>
                      
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-emerald-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
                        </div>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        className="w-full border-emerald-200 hover:bg-emerald-50 text-emerald-700"
                        onClick={handleGoogleSignIn}
                        disabled={isGoogleLoading || isLoading}
                        type="button"
                      >
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        {isGoogleLoading ? (
                          <div className="flex items-center space-x-2">
                            <img 
                              src="/lovable-uploads/4654f30c-aa07-40bb-bc93-3018329fb8f8.png" 
                              alt="Loading" 
                              className="w-4 h-4 animate-spin"
                            />
                            <span>Connecting...</span>
                          </div>
                        ) : (
                          "Continue with Google"
                        )}
                      </Button>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Login;
