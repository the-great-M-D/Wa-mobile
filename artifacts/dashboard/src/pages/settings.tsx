import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useGetBotConfig,
  useUpdateBotConfig,
  getGetBotConfigQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Settings2, Save, Bot, MessageSquare, Eye, Keyboard } from "lucide-react";
import { toast } from "sonner";

const settingsSchema = z.object({
  botName: z.string().min(1, "Bot name required"),
  prefix: z.string().min(1, "Prefix required").max(5, "Prefix too long"),
  autoReplyEnabled: z.boolean(),
  readReceiptsEnabled: z.boolean(),
  typingIndicatorEnabled: z.boolean(),
  welcomeMessage: z.string().nullable().optional(),
});

export function Settings() {
  const queryClient = useQueryClient();
  const { data: config, isLoading } = useGetBotConfig();
  const updateMutation = useUpdateBotConfig();

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      botName: "MyBot",
      prefix: "!",
      autoReplyEnabled: true,
      readReceiptsEnabled: false,
      typingIndicatorEnabled: true,
      welcomeMessage: "",
    },
  });

  useEffect(() => {
    if (config) {
      form.reset({
        botName: config.botName,
        prefix: config.prefix,
        autoReplyEnabled: config.autoReplyEnabled,
        readReceiptsEnabled: config.readReceiptsEnabled,
        typingIndicatorEnabled: config.typingIndicatorEnabled,
        welcomeMessage: config.welcomeMessage ?? "",
      });
    }
  }, [config, form]);

  function onSave(values: z.infer<typeof settingsSchema>) {
    updateMutation.mutate(
      {
        data: {
          ...values,
          welcomeMessage: values.welcomeMessage || null,
        },
      },
      {
        onSuccess: () => {
          toast.success("Settings saved");
          queryClient.invalidateQueries({ queryKey: getGetBotConfigQueryKey() });
        },
        onError: () => toast.error("Failed to save settings"),
      }
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground font-mono text-sm">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-mono font-bold tracking-tight mb-2">Settings</h1>
        <p className="text-muted-foreground font-mono text-sm">Configure bot behavior and features.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSave)} className="space-y-6">
          {/* Identity */}
          <Card className="border-border bg-card">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="font-mono text-base flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary" />
                Bot Identity
              </CardTitle>
              <CardDescription className="font-mono text-xs">Basic identification settings.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <FormField
                control={form.control}
                name="botName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs uppercase text-muted-foreground">Bot Name</FormLabel>
                    <FormControl>
                      <Input className="font-mono bg-background border-border" {...field} />
                    </FormControl>
                    <FormDescription className="font-mono text-xs text-muted-foreground">
                      Display name for the bot in the dashboard.
                    </FormDescription>
                    <FormMessage className="font-mono text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="prefix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs uppercase text-muted-foreground">Command Prefix</FormLabel>
                    <FormControl>
                      <Input className="font-mono bg-background border-border w-24" placeholder="!" {...field} />
                    </FormControl>
                    <FormDescription className="font-mono text-xs text-muted-foreground">
                      Prefix for bot commands (e.g. "!" makes "!help").
                    </FormDescription>
                    <FormMessage className="font-mono text-xs" />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Behavior */}
          <Card className="border-border bg-card">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="font-mono text-base flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-primary" />
                Behavior
              </CardTitle>
              <CardDescription className="font-mono text-xs">Control how the bot responds and signals activity.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <FormField
                control={form.control}
                name="autoReplyEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel className="font-mono text-sm flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-emerald-400" />
                        Auto-Reply
                      </FormLabel>
                      <FormDescription className="font-mono text-xs text-muted-foreground">
                        Automatically respond to messages matching your rules.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Separator className="bg-border" />
              <FormField
                control={form.control}
                name="typingIndicatorEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel className="font-mono text-sm flex items-center gap-2">
                        <Keyboard className="w-4 h-4 text-blue-400" />
                        Typing Indicator
                      </FormLabel>
                      <FormDescription className="font-mono text-xs text-muted-foreground">
                        Show &quot;typing...&quot; before sending auto-replies for a natural feel.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Separator className="bg-border" />
              <FormField
                control={form.control}
                name="readReceiptsEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel className="font-mono text-sm flex items-center gap-2">
                        <Eye className="w-4 h-4 text-amber-400" />
                        Read Receipts
                      </FormLabel>
                      <FormDescription className="font-mono text-xs text-muted-foreground">
                        Send read receipts when messages are received.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Welcome message */}
          <Card className="border-border bg-card">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="font-mono text-base flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                Welcome Message
              </CardTitle>
              <CardDescription className="font-mono text-xs">
                Optional message sent to new contacts on first interaction.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <FormField
                control={form.control}
                name="welcomeMessage"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Welcome! Type !help to see available commands..."
                        className="font-mono bg-background border-border resize-none min-h-[100px]"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormDescription className="font-mono text-xs text-muted-foreground">
                      Leave empty to disable welcome messages.
                    </FormDescription>
                    <FormMessage className="font-mono text-xs" />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Button
            type="submit"
            className="w-full font-mono font-bold h-11"
            disabled={updateMutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            {updateMutation.isPending ? "SAVING..." : "SAVE SETTINGS"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
