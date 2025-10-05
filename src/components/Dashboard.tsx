import { useState, useEffect } from "react";
import { Github, LogOut, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RepoCard } from "./RepoCard";
import { ThemeToggle } from "./ThemeToggle";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  private: boolean;
}

interface DashboardProps {
  username: string;
  token: string;
  onLogout: () => void;
}

interface UserProfile {
  name: string | null;
  avatar_url: string;
  login: string;
}

const REPOS_PER_PAGE = 9;

export function Dashboard({ username, token, onLogout }: DashboardProps) {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteRepo, setDeleteRepo] = useState<Repository | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUserProfile();
    fetchRepos();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`https://api.github.com/user`, {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user profile");
      }

      const data = await response.json();
      setUserProfile({
        name: data.name,
        avatar_url: data.avatar_url,
        login: data.login,
      });
    } catch (error) {
      toast({
        title: "Error fetching profile",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const fetchRepos = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://api.github.com/user/repos?per_page=100&sort=updated`, {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch repositories");
      }

      const data = await response.json();
      setRepos(data);
    } catch (error) {
      toast({
        title: "Error fetching repositories",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRepo = async () => {
    if (!deleteRepo) return;

    setDeleting(true);
    try {
      const response = await fetch(`https://api.github.com/repos/${deleteRepo.full_name}`, {
        method: "DELETE",
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete repository");
      }

      setRepos((prev) => prev.filter((r) => r.id !== deleteRepo.id));
      toast({
        title: "Repository deleted",
        description: `${deleteRepo.name} has been permanently deleted`,
      });
    } catch (error) {
      toast({
        title: "Error deleting repository",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteRepo(null);
    }
  };

  const totalPages = Math.ceil(repos.length / REPOS_PER_PAGE);
  const startIndex = (currentPage - 1) * REPOS_PER_PAGE;
  const paginatedRepos = repos.slice(startIndex, startIndex + REPOS_PER_PAGE);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-2xl blur-md opacity-50" />
                <div className="relative w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-3xl flex items-center justify-center shadow-glow ring-4 ring-accent/30 hover:scale-105 transition-transform duration-300">
                  <img
                  src="/src/assets/icon.png"
                  alt="App Icon"
                  className="w-12 h-12 rounded-2xl shadow-lg object-cover bg-gradient-to-br from-primary to-accent border-2 border-white/30"
                  />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
                  Repo Cleaner
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  {userProfile && (
                    <>
                      <Avatar className="w-5 h-5 border border-primary/20">
                        <AvatarImage src={userProfile.avatar_url} alt={userProfile.login} />
                        <AvatarFallback className="text-xs">{userProfile.login[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <p className="text-sm font-medium text-foreground">
                        {userProfile.name || userProfile.login}
                      </p>
                      <span className="text-xs text-muted-foreground">@{userProfile.login}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="outline" onClick={onLogout} className="gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-all">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : repos.length === 0 ? (
          <div className="text-center py-20">
            <Github className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No repositories found</h2>
            <p className="text-muted-foreground">You don't have any repositories yet</p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  Your Repositories
                </h2>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full border border-primary/20">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">{repos.length}</span>
                </div>
              </div>
              <p className="text-muted-foreground">Manage and organize your GitHub repositories</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {paginatedRepos.map((repo) => (
                <RepoCard key={repo.id} repo={repo} onDelete={setDeleteRepo} />
              ))}
            </div>

            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {[...Array(totalPages)].map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        onClick={() => setCurrentPage(i + 1)}
                        isActive={currentPage === i + 1}
                        className="cursor-pointer"
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </main>

      <AlertDialog open={!!deleteRepo} onOpenChange={() => !deleting && setDeleteRepo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Repository</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteRepo?.name}</strong>? This action cannot
              be undone and will permanently remove the repository and all its contents.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRepo}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
