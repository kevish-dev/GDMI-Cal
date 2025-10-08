import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/Layout/Layout";
import { Gem, Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(formData.username, formData.password);
      
      if (success) {
        toast({
          title: "Login successful!",
          description: "Welcome back, Admin!"
        });
        navigate("/admin");
      } else {
        toast({
          title: "Login failed",
          description: "Invalid credentials. Use admin/admin123",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Please check your credentials and try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 lg:py-12">
        <div className="max-w-md mx-auto">
          {/* Header - Mobile optimized */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="mx-auto mb-3 sm:mb-4 p-2 sm:p-3 gradient-gold rounded-xl shadow-card w-fit">
              <Gem className="h-6 w-6 sm:h-8 sm:w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Welcome Back</h1>
            <p className="text-muted-foreground text-sm sm:text-base px-2">
              Sign in to access your jewelry calculator
            </p>
          </div>

          {/* Login Form - Mobile optimized */}
          <Card className="shadow-elegant">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl sm:text-2xl text-center">Sign In</CardTitle>
              <CardDescription className="text-center text-sm">
                Enter your email and password to continue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                 <div className="space-y-2">
                   <Label htmlFor="username" className="text-sm font-medium">
                     Username
                   </Label>
                   <div className="relative">
                     <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                     <Input
                       id="username"
                       name="username"
                       type="text"
                       placeholder="Enter username"
                       value={formData.username}
                       onChange={handleChange}
                       required
                       className="pl-10 h-11 text-base transition-smooth focus:ring-2 focus:ring-primary/20"
                     />
                   </div>
                 </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="pl-10 pr-10 h-11 text-base transition-smooth focus:ring-2 focus:ring-primary/20"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* <div className="flex items-center justify-center text-sm">
                  <Link
                    to="/forgot-password"
                    className="text-primary hover:underline transition-smooth"
                  >
                    Forgot password?
                  </Link>
                </div> */}

                <Button
                  type="submit"
                  className="w-full gradient-gold hover-glow text-base h-12 sm:h-14 font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing In..." : "Sign In"}
                </Button>
              </form>

              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t text-center">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <Link
                    to="/register"
                    className="text-primary font-medium transition-smooth"
                  >
                    Create one here
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Demo Credentials - Mobile optimized */}
          <Card className="mt-4 sm:mt-6 border-muted/50">
            <CardContent className="pt-4 sm:pt-6">
              <div className="text-center text-sm text-muted-foreground">
                 <p className="font-medium mb-2">Admin Credentials:</p>
                 <div className="space-y-1 text-xs sm:text-sm">
                   <p><strong>Username:</strong> admin</p>
                   <p><strong>Password:</strong> admin123</p>
                 </div>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}