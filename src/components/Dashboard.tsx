import { useEffect, useState, useMemo } from "react";
import icon from "@/assets/icon.png";
import { Github, LogOut, Loader2, Sparkles, Search, X, Filter, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface RepoOwner {
  login: string;
  avatar_url?: string;
  html_url?: string;
}

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
  owner: RepoOwner;
  fork: boolean;
  updated_at: string;
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

const REPOS_PER_PAGE = 12;

export function Dashboard({ username, token, onLogout }: DashboardProps) {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteRepo, setDeleteRepo] = useState<Repository | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | "public" | "private">("all");
  const [forkFilter, setForkFilter] = useState<"all" | "source" | "forks">("all");
  const [languageFilter, setLanguageFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "updated" | "stars" | "forks">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const { toast } = useToast();

  const uniqueLanguages = useMemo(() => {
    const langs = new Set<string>();
    repos.forEach((repo) => {
      if (repo.language) langs.add(repo.language);
    });
    return Array.from(langs).sort();
  }, [repos]);

  const getNextUrlFromLink = (linkHeader: string | null): string | null => {
    if (!linkHeader) return null;
    const parts = linkHeader.split(",");
    for (const part of parts) {
      const match = part.match(/<([^>]+)>;\s*rel="([^"]+)"/);
      if (match) {
        const url = match[1];
        const rel = match[2];
        if (rel === "next") return url;
      }
    }
    return null;
  };

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    const fetchAllSequential = async () => {
      setLoading(true);
      try {
        await fetchUserProfile(controller.signal);
        await fetchRepos(controller.signal);
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          toast({
            title: "Unexpected error",
            description: err instanceof Error ? err.message : "Unknown error",
            variant: "destructive",
          });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAllSequential();
    return () => {
      controller.abort();
    };
  }, [token]);

  const filteredRepos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let items = repos;

    // Apply search filter
    if (q) {
      items = items.filter(
        (repo) =>
          repo.name.toLowerCase().includes(q) ||
          repo.description?.toLowerCase().includes(q) ||
          repo.language?.toLowerCase().includes(q),
      );
    }

    // Apply visibility filter
    if (visibilityFilter === "public") {
      items = items.filter((repo) => !repo.private);
    } else if (visibilityFilter === "private") {
      items = items.filter((repo) => repo.private);
    }

    // Apply fork filter
    if (forkFilter === "source") {
      items = items.filter((repo) => !repo.fork);
    } else if (forkFilter === "forks") {
      items = items.filter((repo) => repo.fork);
    }

    // Apply language filter
    if (languageFilter !== "all") {
      items = items.filter((repo) => repo.language === languageFilter);
    }

    // Apply sorting
    items.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "updated":
          comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          break;
        case "stars":
          comparison = a.stargazers_count - b.stargazers_count;
          break;
        case "forks":
          comparison = a.forks_count - b.forks_count;
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return items;
  }, [searchQuery, repos, visibilityFilter, forkFilter, languageFilter, sortBy, sortOrder]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, visibilityFilter, forkFilter, languageFilter, sortBy, sortOrder]);

  useEffect(() => {
    const total = Math.ceil(filteredRepos.length / REPOS_PER_PAGE);
    if (currentPage > total && total > 0) {
      setCurrentPage(total);
    } else if (total === 0 && currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [filteredRepos, currentPage]);

  const fetchUserProfile = async (signal?: AbortSignal) => {
    try {
      const response = await fetch(`https://api.github.com/user`, {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
        signal,
      });
      if (!response.ok) {
        throw new Error(
          `Failed to fetch user profile: ${response.status} ${response.statusText}`,
        );
      }
      const data = await response.json();
      setUserProfile({
        name: data.name,
        avatar_url: data.avatar_url,
        login: data.login,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast({
        title: "Error fetching profile",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const fetchRepos = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const perPage = 100;
      let url = `https://api.github.com/user/repos?per_page=${perPage}&sort=updated&type=owner`;
      const allRepos: Repository[] = [];
      while (url) {
        const response = await fetch(url, {
          headers: {
            Authorization: `token ${token}`,
            Accept: "application/vnd.github.v3+json",
          },
          signal,
        });
        if (!response.ok) {
          throw new Error(
            `Failed to fetch repositories: ${response.status} ${response.statusText}`,
          );
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error("Unexpected response shape from GitHub API");
        }
        allRepos.push(...data);
        const linkHeader = response.headers.get("link");
        const next = getNextUrlFromLink(linkHeader);
        url = next;
      }
      setRepos(allRepos);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
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
      const response = await fetch(
        `https://api.github.com/repos/${deleteRepo.full_name}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `token ${token}`,
            Accept: "application/vnd.github.v3+json",
          },
        },
      );
      if (!response.ok) {
        let errMsg = `Failed to delete repository: ${response.status} ${response.statusText}`;
        try {
          const body = await response.json();
          if (body && body.message) errMsg += ` — ${body.message}`;
        } catch {}
        throw new Error(errMsg);
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

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRepos.length / REPOS_PER_PAGE),
  );
  const startIndex = (currentPage - 1) * REPOS_PER_PAGE;
  const paginatedRepos = filteredRepos.slice(
    startIndex,
    startIndex + REPOS_PER_PAGE,
  );

  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    const showPages = 5;
    if (totalPages <= showPages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 3) {
      for (let i = 1; i <= 4; i++) pages.push(i);
      pages.push("ellipsis");
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1);
      pages.push("ellipsis");
      for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push("ellipsis");
      for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
      pages.push("ellipsis");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 relative">
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-xl sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="relative shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-2xl blur-md opacity-50" />
                <div className="relative w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg overflow-hidden">
                  <img
                    src={icon}
                    alt="Repo Cleaner"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
                  Repo Cleaner
                </h1>
                {userProfile && (
                  <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
                    <Avatar className="w-4 h-4 sm:w-5 sm:h-5 border border-primary/20">
                      <AvatarImage
                        src={userProfile.avatar_url}
                        alt={userProfile.login}
                      />
                      <AvatarFallback className="text-xs">
                        {userProfile.login
                          ? userProfile.login[0].toUpperCase()
                          : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                      {userProfile.name || userProfile.login}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <ThemeToggle />
              <Button
                variant="outline"
                onClick={onLogout}
                size="sm"
                className="gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : repos.length === 0 ? (
          <div className="text-center py-20">
            <Github className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">
              No repositories found
            </h2>
            <p className="text-muted-foreground">
              You don't have any repositories yet
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 sm:mb-8 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                    Your Repositories
                  </h2>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full border border-primary/20">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-primary">
                      {filteredRepos.length}
                      {searchQuery && ` of ${repos.length}`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search repositories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10 h-11"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Filters:</span>
                </div>

                <Select value={visibilityFilter} onValueChange={(value: any) => setVisibilityFilter(value)}>
                  <SelectTrigger className="w-[130px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Repos</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={forkFilter} onValueChange={(value: any) => setForkFilter(value)}>
                  <SelectTrigger className="w-[130px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="source">Source</SelectItem>
                    <SelectItem value="forks">Forks</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={languageFilter} onValueChange={setLanguageFilter}>
                  <SelectTrigger className="w-[150px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Languages</SelectItem>
                    {uniqueLanguages.map((lang) => (
                      <SelectItem key={lang} value={lang}>
                        {lang}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="h-6 w-px bg-border" />

                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Sort:</span>
                </div>

                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Alphabetical</SelectItem>
                    <SelectItem value="updated">Last Updated</SelectItem>
                    <SelectItem value="stars">Most Stars</SelectItem>
                    <SelectItem value="forks">Most Forks</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
                  <SelectTrigger className="w-[120px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascending</SelectItem>
                    <SelectItem value="desc">Descending</SelectItem>
                  </SelectContent>
                </Select>

                {(visibilityFilter !== "all" || forkFilter !== "all" || languageFilter !== "all" || sortBy !== "name" || sortOrder !== "asc") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setVisibilityFilter("all");
                      setForkFilter("all");
                      setLanguageFilter("all");
                      setSortBy("name");
                      setSortOrder("asc");
                    }}
                    className="h-9 text-xs"
                  >
                    Reset
                  </Button>
                )}
              </div>
            </div>

            {filteredRepos.length === 0 ? (
              <div className="text-center py-20">
                <Search className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <h2 className="text-2xl font-semibold mb-2">
                  No results found
                </h2>
                <p className="text-muted-foreground">
                  Try adjusting your search or filters
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setVisibilityFilter("all");
                    setForkFilter("all");
                    setLanguageFilter("all");
                  }}
                  className="mt-4"
                >
                  Clear all filters
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8 auto-rows-fr">
                  {paginatedRepos.map((repo) => (
                    <RepoCard
                      key={repo.id}
                      repo={repo}
                      onDelete={() => setDeleteRepo(repo)}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <Pagination>
                    <PaginationContent className="flex-wrap">
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() =>
                            setCurrentPage((p) => Math.max(1, p - 1))
                          }
                          className={
                            currentPage === 1
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                      {getPageNumbers().map((page, i) =>
                        page === "ellipsis" ? (
                          <PaginationItem key={`ellipsis-${i}`}>
                            <span className="px-4 py-2">...</span>
                          </PaginationItem>
                        ) : (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page as number)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ),
                      )}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            setCurrentPage((p) => Math.min(totalPages, p + 1))
                          }
                          className={
                            currentPage === totalPages
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            )}
          </>
        )}
      </main>

      <AlertDialog
        open={!!deleteRepo}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteRepo(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Repository</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deleteRepo?.name}</strong>? This action cannot be undone.
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