import { useState } from "react";
import icon from "@/assets/icon.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const credentialsSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, { message: "Username cannot be empty" })
    .max(39, { message: "Username must be less than 39 characters" })
    .regex(/^[a-zA-Z0-9-]+$/, {
      message: "Username can only contain alphanumeric characters and hyphens",
    }),
  token: z
    .string()
    .trim()
    .min(1, { message: "Token cannot be empty" })
    .max(255, { message: "Token must be less than 255 characters" })
    .regex(/^(ghp_|github_pat_)[a-zA-Z0-9_]+$/, {
      message:
        "Invalid GitHub token format. Must start with 'ghp_' or 'github_pat_'",
    }),
});

interface SetupPageProps {
  onSetupComplete: (username: string, token: string) => void;
}

export function SetupPage({ onSetupComplete }: SetupPageProps) {
  const [username, setUsername] = useState("");
  const [token, setToken] = useState("");
  const [errors, setErrors] = useState<{ username?: string; token?: string }>(
    {},
  );
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate inputs
    const result = credentialsSchema.safeParse({
      username: username,
      token: token,
    });

    if (!result.success) {
      const fieldErrors: { username?: string; token?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === "username") {
          fieldErrors.username = err.message;
        } else if (err.path[0] === "token") {
          fieldErrors.token = err.message;
        }
      });
      setErrors(fieldErrors);

      toast({
        title: "Validation Error",
        description: "Please check your inputs and try again",
        variant: "destructive",
      });
      return;
    }

    // Use validated and trimmed values
    const validatedData = result.data;

    localStorage.setItem("github_username", validatedData.username);
    localStorage.setItem("github_token", validatedData.token);
    onSetupComplete(validatedData.username, validatedData.token);

    toast({
      title: "Credentials saved",
      description: "Your GitHub credentials have been stored securely",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/20 relative">
      <Card className="w-full max-w-md shadow-lg border-border/50 animate-fade-in">
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
                className={`h-11 transition-all ${errors.username ? "border-destructive" : ""}`}
                maxLength={39}
              />
              {errors.username && (
                <p className="text-xs text-destructive">{errors.username}</p>
              )}
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
                className={`h-11 transition-all ${errors.token ? "border-destructive" : ""}`}
                maxLength={255}
              />
              {errors.token && (
                <p className="text-xs text-destructive">{errors.token}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Need a token?{" "}
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo,delete_repo"
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
