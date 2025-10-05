import { GitFork, Star, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

interface RepoCardProps {
  repo: Repository;
  onDelete: (repo: Repository) => void;
}

export function RepoCard({ repo, onDelete }: RepoCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg flex items-center gap-2 group-hover:text-primary transition-colors">
              <a
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline flex items-center gap-1.5 truncate"
              >
                {repo.name}
                <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </a>
            </CardTitle>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge
                variant={repo.private ? "secondary" : "outline"}
                className={
                  repo.private
                    ? "text-xs"
                    : "text-xs border-primary/30 text-primary"
                }
              >
                {repo.private ? "Private" : "Public"}
              </Badge>
            </div>
            <CardDescription className="mt-1.5 line-clamp-2">
              {repo.description || "No description provided"}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onDelete(repo)}
            className="hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {repo.language && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-primary/60" />
              <span>{repo.language}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4" />
            <span>{repo.stargazers_count}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <GitFork className="w-4 h-4" />
            <span>{repo.forks_count}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
