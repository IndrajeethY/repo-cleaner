import { useState } from "react";
import icon from "@/assets/icon.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface SetupPageProps {
  onSetupComplete: (username: string, token: string) => void;
}

export function SetupPage({ onSetupComplete }: SetupPageProps) {
  const [username, setUsername] = useState("");
  const [token, setToken] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !token.trim()) {
      toast({
        title: "Missing credentials",
        description: "Please enter both username and token",
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem("github_username", username);
    localStorage.setItem("github_token", token);
    onSetupComplete(username, token);
    
    toast({
      title: "Credentials saved",
      description: "Your GitHub credentials have been stored securely",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/20">
      <Card className="w-full max-w-md shadow-lg border-border/50">
        <CardHeader className="space-y-3 text-center">
            <img
              src={icon}
              alt="App Icon"
              className="mx-auto w-16 h-16 rounded-2xl shadow-glow object-cover bg-gradient-to-br from-primary to-accent"
            />
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Repo Cleaner
          </CardTitle>
          <CardDescription className="text-base">
            Enter your GitHub credentials to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">
                GitHub Username
              </Label>
              <Input
                id="username"
                placeholder="octocat"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-11 transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="token" className="text-sm font-medium">
                Personal Access Token
              </Label>
              <Input
                id="token"
                type="password"
                placeholder="ghp_xxxxxxxxxxxx"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="h-11 transition-all"
              />
              <p className="text-xs text-muted-foreground">
                Need a token?{" "}
                <a
                  href="https://github.com/settings/tokens/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-accent transition-colors underline"
                >
                  Create one here
                </a>
              </p>
            </div>
            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all shadow-md"
            >
              Continue
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}