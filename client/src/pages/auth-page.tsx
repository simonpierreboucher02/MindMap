import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lightbulb, Lock, AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, InsertUser } from "@shared/schema";
import { z } from "zod";
import { RecoveryKeyModal } from "@/components/recovery-key-modal";
import { queryClient } from "@/lib/queryClient";

const loginSchema = insertUserSchema;
const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [recoveryKey, setRecoveryKey] = useState<string | null>(null);
  const [pendingUser, setPendingUser] = useState<any>(null);
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Redirect if already logged in (but not if recovery key needs to be shown)
  useEffect(() => {
    if (user && !recoveryKey) {
      setLocation("/");
    }
  }, [user, recoveryKey, setLocation]);

  const handleLogin = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const handleRegister = (data: RegisterFormData) => {
    const { confirmPassword, ...userData } = data;
    registerMutation.mutate(userData, {
      onSuccess: ({ user, recoveryKey }) => {
        setPendingUser(user);
        setRecoveryKey(recoveryKey);
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4">
            <Lightbulb className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">MindMap</h1>
          <p className="text-muted-foreground mt-1">by MinimalAuth</p>
        </div>

        {/* Auth Tabs */}
        <Card className="mb-4">
          <CardContent className="p-6">
            <div className="flex space-x-1 bg-muted rounded-lg p-1 mb-6">
              <Button
                variant={isLogin ? "default" : "ghost"}
                className="flex-1"
                onClick={() => setIsLogin(true)}
                data-testid="tab-signin"
              >
                Sign In
              </Button>
              <Button
                variant={!isLogin ? "default" : "ghost"}
                className="flex-1"
                onClick={() => setIsLogin(false)}
                data-testid="tab-signup"
              >
                Sign Up
              </Button>
            </div>

            {isLogin ? (
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <div>
                  <Label htmlFor="login-username">Username</Label>
                  <Input
                    id="login-username"
                    placeholder="Enter your username"
                    {...loginForm.register("username")}
                    data-testid="input-login-username"
                  />
                  {loginForm.formState.errors.username && (
                    <p className="text-sm text-destructive mt-1">
                      {loginForm.formState.errors.username.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    {...loginForm.register("password")}
                    data-testid="input-login-password"
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-destructive mt-1">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending}
                  data-testid="button-signin"
                >
                  {loginMutation.isPending ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            ) : (
              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                <div>
                  <Label htmlFor="register-username">Username</Label>
                  <Input
                    id="register-username"
                    placeholder="Choose a username"
                    {...registerForm.register("username")}
                    data-testid="input-register-username"
                  />
                  {registerForm.formState.errors.username && (
                    <p className="text-sm text-destructive mt-1">
                      {registerForm.formState.errors.username.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="Create a password"
                    {...registerForm.register("password")}
                    data-testid="input-register-password"
                  />
                  {registerForm.formState.errors.password && (
                    <p className="text-sm text-destructive mt-1">
                      {registerForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm your password"
                    {...registerForm.register("confirmPassword")}
                    data-testid="input-confirm-password"
                  />
                  {registerForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive mt-1">
                      {registerForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={registerMutation.isPending}
                  data-testid="button-signup"
                >
                  {registerMutation.isPending ? "Creating Account..." : "Sign Up"}
                </Button>
              </form>
            )}

            {isLogin && (
              <div className="mt-4 pt-4 border-t border-border">
                <Button variant="ghost" className="text-sm w-full" data-testid="button-recovery">
                  Forgot password? Use Recovery Key
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Info */}
        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Lock className="w-5 h-5 text-muted-foreground mr-2" />
            <span className="text-sm font-medium text-muted-foreground">Secure & Private</span>
          </div>
          <p className="text-xs text-muted-foreground">No email required. Your privacy is protected.</p>
        </div>
      </div>

      {recoveryKey && (
        <RecoveryKeyModal
          recoveryKey={recoveryKey}
          onClose={() => {
            // Set the user in the cache and redirect
            if (pendingUser) {
              queryClient.setQueryData(["/api/user"], pendingUser);
            }
            setRecoveryKey(null);
            setPendingUser(null);
            setLocation("/"); // Redirect after closing modal
          }}
        />
      )}
    </div>
  );
}
