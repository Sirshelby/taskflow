import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Task } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";
import {
  CheckSquare,
  Plus,
  Sun,
  Moon,
  LogOut,
  Trash2,
  Clock,
  ArrowUpCircle,
  Circle,
  CheckCircle2,
  ListTodo,
  Loader2,
  AlertCircle,
} from "lucide-react";

const STATUS_CONFIG = {
  todo: { label: "To Do", icon: Circle, color: "text-muted-foreground" },
  in_progress: { label: "In Progress", icon: Clock, color: "text-chart-1" },
  done: { label: "Done", icon: CheckCircle2, color: "text-green-500 dark:text-green-400" },
} as const;

const PRIORITY_CONFIG = {
  low: { label: "Low", color: "bg-muted text-muted-foreground" },
  medium: { label: "Medium", color: "bg-chart-1/10 text-chart-1" },
  high: { label: "High", color: "bg-destructive/10 text-destructive" },
} as const;

type FilterStatus = "all" | "todo" | "in_progress" | "done";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"todo" | "in_progress" | "done">("todo");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = useState("");

  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/tasks", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      resetForm();
      setShowCreateDialog(false);
      toast({ title: "Task created" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await apiRequest("PATCH", `/api/tasks/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setEditingTask(null);
      resetForm();
      toast({ title: "Task updated" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task deleted" });
    },
  });

  function resetForm() {
    setTitle("");
    setDescription("");
    setStatus("todo");
    setPriority("medium");
    setDueDate("");
  }

  function openEdit(task: Task) {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || "");
    setStatus(task.status as any);
    setPriority(task.priority as any);
    setDueDate(task.dueDate || "");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = {
      title,
      description: description || undefined,
      status,
      priority,
      dueDate: dueDate || undefined,
    };
    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  }

  function quickStatusChange(task: Task) {
    const nextStatus = task.status === "todo" ? "in_progress" : task.status === "in_progress" ? "done" : "todo";
    updateMutation.mutate({ id: task.id, status: nextStatus });
  }

  const filteredTasks = tasks?.filter(
    (t) => filterStatus === "all" || t.status === filterStatus
  );

  const counts = {
    all: tasks?.length || 0,
    todo: tasks?.filter((t) => t.status === "todo").length || 0,
    in_progress: tasks?.filter((t) => t.status === "in_progress").length || 0,
    done: tasks?.filter((t) => t.status === "done").length || 0,
  };

  const isFormPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="min-h-screen flex flex-col" data-testid="dashboard-page">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <CheckSquare className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-semibold tracking-tight">TaskFlow</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground mr-2 hidden sm:inline" data-testid="text-user-name">
              {user?.name}
            </span>
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleTheme}
              data-testid="button-toggle-theme"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => logout.mutate()}
              data-testid="button-logout"
              aria-label="Log out"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold" data-testid="text-page-title">My Tasks</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {counts.all} total, {counts.done} completed
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setEditingTask(null);
              setShowCreateDialog(true);
            }}
            data-testid="button-create-task"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New Task
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
          {(["all", "todo", "in_progress", "done"] as const).map((f) => (
            <Button
              key={f}
              variant={filterStatus === f ? "default" : "secondary"}
              size="sm"
              onClick={() => setFilterStatus(f)}
              data-testid={`button-filter-${f}`}
            >
              {f === "all" ? "All" : STATUS_CONFIG[f].label}
              <span className="ml-1.5 tabular-nums">{counts[f]}</span>
            </Button>
          ))}
        </div>

        {/* Task list */}
        {isLoading ? (
          <div className="space-y-3" data-testid="skeleton-tasks">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-5 h-5 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-2/5" />
                      <Skeleton className="h-3 w-3/5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredTasks && filteredTasks.length > 0 ? (
          <div className="space-y-2" data-testid="task-list">
            {filteredTasks.map((task) => {
              const statusCfg = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG];
              const priorityCfg = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG];
              const StatusIcon = statusCfg.icon;

              return (
                <Card
                  key={task.id}
                  className="group cursor-pointer hover-elevate transition-all"
                  data-testid={`card-task-${task.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          quickStatusChange(task);
                        }}
                        className={`mt-0.5 flex-shrink-0 ${statusCfg.color} transition-colors`}
                        data-testid={`button-status-${task.id}`}
                        aria-label={`Mark as ${task.status === "todo" ? "in progress" : task.status === "in_progress" ? "done" : "to do"}`}
                      >
                        <StatusIcon className="w-5 h-5" />
                      </button>
                      <div
                        className="flex-1 min-w-0"
                        onClick={() => openEdit(task)}
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`font-medium text-sm ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}
                            data-testid={`text-task-title-${task.id}`}
                          >
                            {task.title}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-xs px-1.5 py-0 ${priorityCfg.color} border-transparent`}
                            data-testid={`badge-priority-${task.id}`}
                          >
                            {priorityCfg.label}
                          </Badge>
                        </div>
                        {task.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {task.description}
                          </p>
                        )}
                        {task.dueDate && (
                          <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {new Date(task.dueDate).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                            })}
                          </div>
                        )}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMutation.mutate(task.id);
                        }}
                        data-testid={`button-delete-${task.id}`}
                        aria-label="Delete task"
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center" data-testid="empty-state">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
              <ListTodo className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-1">
              {filterStatus === "all" ? "No tasks yet" : `No ${STATUS_CONFIG[filterStatus as keyof typeof STATUS_CONFIG]?.label.toLowerCase()} tasks`}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {filterStatus === "all"
                ? "Create your first task to get started."
                : "Tasks with this status will appear here."}
            </p>
            {filterStatus === "all" && (
              <Button
                onClick={() => {
                  resetForm();
                  setEditingTask(null);
                  setShowCreateDialog(true);
                }}
                data-testid="button-create-first-task"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                New Task
              </Button>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex justify-center">
          <PerplexityAttribution />
        </div>
      </footer>

      {/* Create/Edit Dialog */}
      <Dialog
        open={showCreateDialog || !!editingTask}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false);
            setEditingTask(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTask ? "Edit Task" : "New Task"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="task-title">Title</Label>
              <Input
                id="task-title"
                data-testid="input-task-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-desc">Description</Label>
              <Textarea
                id="task-desc"
                data-testid="input-task-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional details..."
                className="resize-none"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                  <SelectTrigger data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                  <SelectTrigger data-testid="select-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-due">Due Date</Label>
              <Input
                id="task-due"
                type="date"
                data-testid="input-task-due-date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowCreateDialog(false);
                  setEditingTask(null);
                  resetForm();
                }}
                data-testid="button-cancel-task"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isFormPending} data-testid="button-save-task">
                {isFormPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingTask ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
