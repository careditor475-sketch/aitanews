import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { ArrowLeft, LogOut, Upload, Copy, Check, ExternalLink, Eye, CalendarDays } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — News Feed" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminPage,
});

type AdminState = "loading" | "anonymous" | "not_admin" | "admin";

function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [state, setState] = useState<AdminState>("loading");
  const lastCheckedUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    async function check(s: Session | null) {
      const userId = s?.user.id ?? null;
      // Skip if we already evaluated this exact user (prevents re-render loops
      // when supabase emits TOKEN_REFRESHED / INITIAL_SESSION back to back).
      if (lastCheckedUserId.current === userId) return;
      lastCheckedUserId.current = userId;

      if (!s) {
        if (!cancelled) {
          setSession(null);
          setState("anonymous");
        }
        return;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", s.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (cancelled) return;
      setSession(s);
      if (error) {
        // Treat fetch errors as not-admin instead of spinning forever.
        setState("not_admin");
        return;
      }
      setState(data ? "admin" : "not_admin");
    }

    // Single source of truth: subscribe first, then prime with current session.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      void check(s);
    });
    void supabase.auth.getSession().then(({ data }) => check(data.session));

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (state === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">جارٍ التحميل…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors />
      {state === "anonymous" && <LoginForm />}
      {state === "not_admin" && <NotAdmin />}
      {state === "admin" && session && <PostComposer />}
    </div>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/admin" },
        });
        if (error) throw error;
        toast.success("Account created — you can now sign in.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <Link
        to="/"
        className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to feed
      </Link>
      <Card className="p-8">
        <h1 className="text-2xl font-bold text-foreground">Admin access</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "signin"
            ? "Sign in to post updates."
            : "Create the admin account. The first account becomes the admin."}
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
            />
          </div>
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 w-full text-sm text-muted-foreground hover:text-foreground"
        >
          {mode === "signin" ? "Need to create the admin account?" : "Already have an account? Sign in"}
        </button>
      </Card>
    </div>
  );
}

function NotAdmin() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 text-center">
      <h1 className="text-2xl font-bold text-foreground">Not authorized</h1>
      <p className="mt-2 text-muted-foreground">This account does not have admin access.</p>
      <div className="mt-6 flex justify-center gap-2">
        <Button asChild variant="outline">
          <Link to="/">Back to feed</Link>
        </Button>
        <Button
          variant="ghost"
          onClick={async () => {
            await supabase.auth.signOut();
          }}
        >
          Sign out
        </Button>
      </div>
    </div>
  );
}

function VisitorStats() {
  const [totalViews, setTotalViews] = useState<number | null>(null);
  const [todayViews, setTodayViews] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const now = new Date();
      const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
        0,
      );

      const [{ count: total }, { count: today }] = await Promise.all([
        supabase.from("page_views").select("*", { count: "exact", head: true }),
        supabase
          .from("page_views")
          .select("*", { count: "exact", head: true })
          .gte("created_at", startOfToday.toISOString()),
      ]);

      if (cancelled) return;
      setTotalViews(total ?? 0);
      setTodayViews(today ?? 0);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2">
      <StatCard
        label="إجمالي المشاهدات"
        value={totalViews}
        icon={<Eye className="h-5 w-5" />}
        accent="text-primary"
      />
      <StatCard
        label="مشاهدات اليوم"
        value={todayViews}
        icon={<CalendarDays className="h-5 w-5" />}
        accent="text-chart-2"
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number | null;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted ${accent}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-3xl font-bold tracking-tight text-foreground">
          {value === null ? "—" : value.toLocaleString("ar-EG")}
        </p>
      </div>
    </Card>
  );
}

function PostComposer() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [publishedPostId, setPublishedPostId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://aitanews.lovable.app";
  const shareUrl = publishedPostId ? `${origin}/news/${publishedPostId}` : "";

  async function uploadBlob(blob: Blob, path: string): Promise<string> {
    const { error } = await supabase.storage.from("media").upload(path, blob, {
      cacheControl: "3600",
      upsert: false,
      contentType: blob.type || undefined,
    });
    if (error) throw error;
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    return data.publicUrl;
  }

  async function uploadFile(file: File, kind: "image" | "video"): Promise<string> {
    const ext = file.name.split(".").pop();
    const path = `${kind}s/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    return uploadBlob(file, path);
  }

  /** Extracts a clean still frame from a video file (no overlay), 1200x630 cover-cropped. */
  async function extractVideoThumbnail(file: File): Promise<Blob | null> {
    if (typeof document === "undefined") return null;
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";
    video.src = url;

    try {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("timeout")), 15000);
        const done = () => {
          clearTimeout(timeout);
          resolve();
        };
        video.onloadeddata = () => {
          // Seek slightly in to avoid an all-black first frame.
          const target = Number.isFinite(video.duration) && video.duration > 1 ? Math.min(1, video.duration / 2) : 0;
          if (video.currentTime === target) return done();
          video.onseeked = done;
          video.currentTime = target;
        };
        video.onerror = () => {
          clearTimeout(timeout);
          reject(new Error("video decode failed"));
        };
      });

      const W = 1200;
      const H = 630;
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      const vw = video.videoWidth || W;
      const vh = video.videoHeight || H;
      const scale = Math.max(W / vw, H / vh);
      const dw = vw * scale;
      const dh = vh * scale;
      ctx.drawImage(video, (W - dw) / 2, (H - dh) / 2, dw, dh);

      return await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/jpeg", 0.85),
      );
    } catch {
      return null;
    } finally {
      URL.revokeObjectURL(url);
      video.removeAttribute("src");
      video.load();
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error("Title and text are required.");
      return;
    }
    setBusy(true);
    try {
      const image_url = image ? await uploadFile(image, "image") : null;
      const video_url = video ? await uploadFile(video, "video") : null;

      let thumbnail_url: string | null = null;
      if (video) {
        const frame = await extractVideoThumbnail(video);
        if (frame) {
          const path = `thumbnails/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
          try {
            thumbnail_url = await uploadBlob(frame, path);
          } catch {
            thumbnail_url = null;
          }
        }
      }

      const { data: u } = await supabase.auth.getUser();
      const { data: inserted, error } = await supabase
        .from("posts")
        .insert({
          title: title.trim(),
          body: body.trim(),
          image_url,
          video_url,
          thumbnail_url,
          author_id: u.user?.id ?? null,
        })
        .select("id")
        .single();
      if (error) throw error;
      toast.success("Posted to the feed.");
      setPublishedPostId(inserted.id);
      setTitle("");
      setBody("");
      setImage(null);
      setVideo(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to post");
    } finally {
      setBusy(false);
    }
  }

  async function handleCopy() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link.");
    }
  }

  if (publishedPostId) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <Link
              to="/"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-1 h-4 w-4" /> View feed
            </Link>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Published!</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await supabase.auth.signOut();
            }}
          >
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </header>

        <Card className="p-8">
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Check className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Your news item is live</h2>
            <p className="text-sm text-muted-foreground">Share this link with anyone:</p>

            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2">
              <span className="flex-1 truncate text-sm text-foreground">{shareUrl}</span>
              <Button size="sm" variant="secondary" onClick={handleCopy} className="shrink-0 gap-1">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy Link"}
              </Button>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <Button asChild variant="outline" size="sm">
                <Link to="/">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View on homepage
                </Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setPublishedPostId(null)}>
                Write another
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <Link
            to="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> View feed
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">New post</h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => {
            await supabase.auth.signOut();
          }}
        >
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      </header>

      <VisitorStats />

      <Card className="p-8">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
              placeholder="A short, clear headline"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">News text</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={5000}
              required
              rows={8}
              placeholder="Write the story…"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="image">
                <Upload className="mr-1 inline h-4 w-4" /> Photo (optional)
              </Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files?.[0] ?? null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="video">
                <Upload className="mr-1 inline h-4 w-4" /> Video (optional)
              </Label>
              <Input
                id="video"
                type="file"
                accept="video/*"
                onChange={(e) => setVideo(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>

          <Button type="submit" disabled={busy} className="w-full" size="lg">
            {busy ? "Publishing…" : "Publish to feed"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
