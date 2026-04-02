import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useListAutoReplies,
  useCreateAutoReply,
  useUpdateAutoReply,
  useDeleteAutoReply,
  getListAutoRepliesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Zap, Plus, Pencil, Trash2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ruleSchema = z.object({
  trigger: z.string().min(1, "Trigger required"),
  response: z.string().min(1, "Response required"),
  matchType: z.enum(["exact", "contains", "startsWith", "regex"]),
  caseSensitive: z.boolean(),
  enabled: z.boolean(),
});

const matchTypeColors: Record<string, string> = {
  exact: "border-blue-500/40 text-blue-400",
  contains: "border-emerald-500/40 text-emerald-400",
  startsWith: "border-amber-500/40 text-amber-400",
  regex: "border-purple-500/40 text-purple-400",
};

type AutoReplyItem = {
  id: string;
  trigger: string;
  response: string;
  matchType: "exact" | "contains" | "startsWith" | "regex";
  caseSensitive: boolean;
  enabled: boolean;
  hitCount: number;
  createdAt: string;
};

export function AutoReplies() {
  const queryClient = useQueryClient();
  const { data: rules = [], isLoading } = useListAutoReplies();
  const createMutation = useCreateAutoReply();
  const updateMutation = useUpdateAutoReply();
  const deleteMutation = useDeleteAutoReply();

  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<AutoReplyItem | null>(null);

  const form = useForm<z.infer<typeof ruleSchema>>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      trigger: "",
      response: "",
      matchType: "contains",
      caseSensitive: false,
      enabled: true,
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset({ trigger: "", response: "", matchType: "contains", caseSensitive: false, enabled: true });
    setShowDialog(true);
  }

  function openEdit(rule: AutoReplyItem) {
    setEditing(rule);
    form.reset({
      trigger: rule.trigger,
      response: rule.response,
      matchType: rule.matchType,
      caseSensitive: rule.caseSensitive,
      enabled: rule.enabled,
    });
    setShowDialog(true);
  }

  function onSubmit(values: z.infer<typeof ruleSchema>) {
    if (editing) {
      updateMutation.mutate(
        { id: editing.id, data: values },
        {
          onSuccess: () => {
            toast.success("Rule updated");
            queryClient.invalidateQueries({ queryKey: getListAutoRepliesQueryKey() });
            setShowDialog(false);
          },
          onError: () => toast.error("Failed to update rule"),
        }
      );
    } else {
      createMutation.mutate(
        { data: values },
        {
          onSuccess: () => {
            toast.success("Rule created");
            queryClient.invalidateQueries({ queryKey: getListAutoRepliesQueryKey() });
            setShowDialog(false);
          },
          onError: () => toast.error("Failed to create rule"),
        }
      );
    }
  }

  function toggleEnabled(rule: AutoReplyItem) {
    updateMutation.mutate(
      { id: rule.id, data: { enabled: !rule.enabled } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAutoRepliesQueryKey() });
        },
        onError: () => toast.error("Failed to toggle rule"),
      }
    );
  }

  function deleteRule(id: string) {
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          toast.success("Rule deleted");
          queryClient.invalidateQueries({ queryKey: getListAutoRepliesQueryKey() });
        },
        onError: () => toast.error("Failed to delete rule"),
      }
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-mono font-bold tracking-tight mb-1">Auto-Replies</h1>
          <p className="text-muted-foreground font-mono text-sm">Automatic response rules for incoming messages.</p>
        </div>
        <Button onClick={openCreate} className="font-mono font-bold shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          NEW RULE
        </Button>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="font-mono text-base flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Rules ({rules.length})
          </CardTitle>
        </CardHeader>
        <ScrollArea className="h-[520px]">
          <div className="p-4 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground font-mono text-sm">
                Loading rules...
              </div>
            ) : rules.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center space-y-3">
                <Zap className="w-12 h-12 text-muted-foreground/20" />
                <p className="font-mono text-sm text-muted-foreground">No auto-reply rules yet.</p>
                <p className="font-mono text-xs text-muted-foreground/60">Create a rule to automatically respond to matching messages.</p>
              </div>
            ) : (
              rules.map((rule) => (
                <div
                  key={rule.id}
                  className={cn(
                    "border rounded-lg p-4 transition-all",
                    rule.enabled ? "border-border bg-card" : "border-border/50 bg-muted/20 opacity-60"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={cn("font-mono text-[10px] h-5", matchTypeColors[rule.matchType] || "border-border")}
                        >
                          {rule.matchType}
                        </Badge>
                        {rule.caseSensitive && (
                          <Badge variant="outline" className="font-mono text-[10px] h-5 border-border text-muted-foreground">
                            case-sensitive
                          </Badge>
                        )}
                        {rule.hitCount > 0 && (
                          <div className="flex items-center gap-1 text-muted-foreground ml-auto">
                            <TrendingUp className="w-3 h-3" />
                            <span className="font-mono text-xs">{rule.hitCount} hits</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="font-mono text-sm">
                          <span className="text-muted-foreground">trigger: </span>
                          <span className="text-primary">&quot;{rule.trigger}&quot;</span>
                        </p>
                        <p className="font-mono text-sm break-words">
                          <span className="text-muted-foreground">reply: </span>
                          <span className="text-foreground/80">{rule.response}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={() => toggleEnabled(rule as AutoReplyItem)}
                        className="scale-75"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => openEdit(rule as AutoReplyItem)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteRule(rule.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-card border-border font-mono max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-mono">{editing ? "Edit Rule" : "New Auto-Reply Rule"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="trigger"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase text-muted-foreground">Trigger</FormLabel>
                    <FormControl>
                      <Input placeholder='e.g. "hello" or "!help"' className="bg-background border-border" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="response"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase text-muted-foreground">Response</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="The message to reply with..."
                        className="bg-background border-border resize-none min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="matchType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase text-muted-foreground">Match Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background border-border">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="contains">Contains</SelectItem>
                          <SelectItem value="exact">Exact</SelectItem>
                          <SelectItem value="startsWith">Starts With</SelectItem>
                          <SelectItem value="regex">Regex</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="caseSensitive"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-3 space-y-0 pt-6">
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="text-xs text-muted-foreground cursor-pointer">Case sensitive</FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="enabled"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-3 space-y-0">
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="text-xs text-muted-foreground cursor-pointer">Enabled</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setShowDialog(false)}>Cancel</Button>
                <Button type="submit" className="font-bold" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editing ? "SAVE CHANGES" : "CREATE RULE"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
