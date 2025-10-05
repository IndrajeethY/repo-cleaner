import { useState, useEffect } from "react";
import { SetupPage } from "@/components/SetupPage";
import { Dashboard } from "@/components/Dashboard";
import { ThemeProvider } from "@/hooks/use-theme";

const Index = () => {
  const [credentials, setCredentials] = useState<{
    username: string;
    token: string;
  } | null>(null);

  useEffect(() => {
    const username = localStorage.getItem("github_username");
    const token = localStorage.getItem("github_token");
    
    if (username && token) {
      setCredentials({ username, token });
    }
  }, []);

  const handleSetupComplete = (username: string, token: string) => {
    setCredentials({ username, token });
  };

  const handleLogout = () => {
    localStorage.removeItem("github_username");
    localStorage.removeItem("github_token");
    setCredentials(null);
  };

  return (
    <ThemeProvider defaultTheme="dark">
      {credentials ? (
        <Dashboard
          username={credentials.username}
          token={credentials.token}
          onLogout={handleLogout}
        />
      ) : (
        <SetupPage onSetupComplete={handleSetupComplete} />
      )}
    </ThemeProvider>
  );
};

export default Index;
