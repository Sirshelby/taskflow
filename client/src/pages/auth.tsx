import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckSquare } from "lucide-react";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const { login, register } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === "login") {
        await login.mutateAsync({ email, password });
      } else {
        await register.mutateAsync({ email, password, name });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message?.includes(":") ? err.message.split(": ").slice(1).join(": ") : err.message,
        variant: "destructive",
      });
    }
  };

  const isPending = login.isPending || register.isPending;

  return (
    <div className="min-h-screen flex" data-testid="auth-page">
      {/* Left panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <CheckSquare className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight">TaskFlow</span>
          </div>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">
                {mode === "login" ? "Welcome back" : "Create account"}
              </CardTitle>
              <CardDescription>
                {mode === "login"
                  ? "Sign in to manage your tasks"
                  : "Get started with TaskFlow"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "register" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      data-testid="input-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      required
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    data-testid="input-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    data-testid="input-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "register" ? "Min 6 characters" : "Enter password"}
                    required
                    minLength={mode === "register" ? 6 : undefined}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isPending}
                  data-testid="button-submit-auth"
                >
                  {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {mode === "login" ? "Sign in" : "Create account"}
                </Button>
              </form>
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setMode(mode === "login" ? "register" : "login")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="button-toggle-auth-mode"
                >
                  {mode === "login"
                    ? "Don't have an account? Sign up"
                    : "Already have an account? Sign in"}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right panel — branding */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-primary/5 border-l border-border">
        <div className="max-w-md text-center px-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <CheckSquare className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-3 text-foreground">
            Stay organized, stay focused
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            TaskFlow helps you manage tasks with priorities, status tracking, and due dates — all in a clean, minimal interface.
          </p>
        </div>
      </div>
    </div>
  );
}
