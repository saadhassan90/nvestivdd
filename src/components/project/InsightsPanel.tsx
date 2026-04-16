import { useState } from "react";
import { Sparkles, Plus, X, Send } from "lucide-react";
import { BlurFade } from "@/components/magicui/BlurFade";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface Comment {
  id: string;
  text: string;
  author: string;
  timestamp: Date;
  type: "team" | "ai";
}

interface InsightsPanelProps {
  projectName?: string;
  isProcessing?: boolean;
}

const FILTER_TABS = ["All", "Team", "AI"] as const;

export function InsightsPanel({ projectName, isProcessing }: InsightsPanelProps) {
  const [activeFilter, setActiveFilter] = useState<typeof FILTER_TABS[number]>("All");
  const [comments, setComments] = useState<Comment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newComment, setNewComment] = useState("");

  const handlePostComment = () => {
    if (!newComment.trim()) return;
    const comment: Comment = {
      id: crypto.randomUUID(),
      text: newComment.trim(),
      author: "You",
      timestamp: new Date(),
      type: "team",
    };
    setComments((prev) => [comment, ...prev]);
    setNewComment("");
    setIsModalOpen(false);
  };

  const filteredComments = comments.filter((c) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Team") return c.type === "team";
    return c.type === "ai";
  });

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      <aside className="hidden xl:flex flex-col w-[260px] shrink-0 bg-background h-full overflow-y-auto">
        <div className="p-4 space-y-5">
          {/* Header */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">Comments & Notes</h3>
            <div className="flex items-center gap-0.5 mt-3 rounded-lg bg-muted p-0.5">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  className={`flex-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                    activeFilter === tab
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {isProcessing ? (
            <BlurFade>
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Nvestiv AI</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">Now</span>
                </div>
                <p className="text-xs text-foreground leading-relaxed">
                  Analysis is currently in progress. Insights and comments will populate as research phases complete.
                </p>
              </div>
            </BlurFade>
          ) : (
            <div className="space-y-3">
              {/* User comments */}
              {filteredComments.map((comment) => (
                <div key={comment.id} className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-foreground">
                      {comment.author.charAt(0)}
                    </div>
                    <span className="text-xs font-semibold text-foreground">{comment.author}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground">{formatTime(comment.timestamp)}</span>
                  </div>
                  <p className="text-xs text-foreground leading-relaxed">{comment.text}</p>
                </div>
              ))}

              {/* Default AI card when no comments */}
              {filteredComments.length === 0 && activeFilter !== "Team" && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                      <Sparkles className="h-3 w-3 text-primary-foreground" />
                    </div>
                    <span className="text-xs font-semibold text-foreground">Nvestiv AI</span>
                    <span className="ml-auto text-[10px] text-muted-foreground">Now</span>
                  </div>
                  <p className="text-xs text-foreground leading-relaxed">
                    No AI observations generated yet. Comments will appear here as team members and the AI engine annotate the report.
                  </p>
                </div>
              )}

              {filteredComments.length === 0 && activeFilter === "Team" && (
                <p className="text-xs text-muted-foreground text-center py-4">No team comments yet.</p>
              )}
            </div>
          )}

          {/* Add note button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add note
          </button>
        </div>
      </aside>

      {/* Add Comment Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Add Comment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Textarea
              placeholder="Write your comment or note..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[120px] text-sm resize-none"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handlePostComment();
                }
              }}
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">⌘ + Enter to post</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handlePostComment} disabled={!newComment.trim()}>
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  Post
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
