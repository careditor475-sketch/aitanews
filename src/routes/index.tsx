import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Lock, Trash2, Globe } from "lucide-react";
import brandLogo from "@/assets/ayta-news-brand.jpg";

type Post = {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  video_url: string | null;
  created_at: string;
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AYTA NEWS — عيتا نيوز | الموقع الإخباري" },
      { name: "description", content: "عيتا نيوز — آخر الأخبار والتطورات المحلية والعالمية على مدار الساعة." },
    ],
  }),
  component: Home,
});

function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  async function loadPosts() {
    const { data } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });
    setPosts(data ?? []);
    setLoading(false);
  }

  async function checkAdmin(s: Session | null) {
    if (!s) return setIsAdmin(false);
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", s.user.id)
      .eq("role", "admin")
      .maybeSingle();
    setIsAdmin(!!data);
  }

  useEffect(() => {
    loadPosts();
    supabase.auth.getSession().then(({ data }) => checkAdmin(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => checkAdmin(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleDelete(post: Post) {
    // Delete media from storage if it lives in our bucket
    const paths: string[] = [];
    for (const url of [post.image_url, post.video_url]) {
      if (!url) continue;
      const marker = "/storage/v1/object/public/media/";
      const i = url.indexOf(marker);
      if (i !== -1) paths.push(url.slice(i + marker.length));
    }
    if (paths.length) await supabase.storage.from("media").remove(paths);
    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    if (error) return toast.error(error.message);
    toast.success("تم حذف الخبر");
    setPosts((p) => p.filter((x) => x.id !== post.id));
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <Toaster richColors />

      {/* Breaking-news strip */}
      <div className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-1.5 text-xs font-semibold tracking-wide">
          <span className="rounded-sm bg-background/15 px-2 py-0.5 uppercase">عاجل</span>
          <span className="opacity-90">تطورات محلية وعالمية على مدار الساعة</span>
        </div>
      </div>

      {/* Masthead */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-3">
            <img
              src={brandLogo}
              alt="AYTA NEWS عيتا نيوز"
              className="h-12 w-12 rounded-md object-cover ring-1 ring-border"
            />
            <div className="leading-tight">
              <h1 className="text-2xl font-black tracking-tight text-foreground">
                عيتا نيوز
              </h1>
              <p className="text-[11px] uppercase tracking-[0.25em] text-primary">
                AYTA NEWS
              </p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="border-primary/40 text-foreground hover:bg-primary hover:text-primary-foreground">
            <Link to="/admin">
              <Lock className="ml-2 h-4 w-4" />
              لوحة التحكم
            </Link>
          </Button>
        </div>
        <nav className="border-t border-border">
          <div className="mx-auto flex max-w-5xl items-center gap-6 overflow-x-auto px-6 py-2 text-sm font-medium text-muted-foreground">
            <span className="text-foreground">الرئيسية</span>
            <span>محليات</span>
            <span>اقتصاد</span>
            <span>منوعات</span>
            <span>رياضة</span>
            <span>مقالات</span>
            <span className="mr-auto flex items-center gap-1 text-xs">
              <Globe className="h-3.5 w-3.5" /> الموقع الإخباري
            </span>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        {loading ? (
          <p className="text-center text-muted-foreground">جارٍ التحميل…</p>
        ) : posts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-20 text-center">
            <p className="text-muted-foreground">لا توجد أخبار بعد. تحقق لاحقاً.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {posts.map((p) => (
              <Card key={p.id} className="overflow-hidden p-0 border-border">
                {p.image_url && (
                  <img src={p.image_url} alt={p.title} className="aspect-video w-full object-cover" />
                )}
                {p.video_url && (
                  <video src={p.video_url} controls className="aspect-video w-full bg-black" />
                )}
                <div className="p-6">
                  <div className="flex items-center justify-between gap-3">
                    <time className="text-xs uppercase tracking-wider text-primary">
                      {new Date(p.created_at).toLocaleDateString("ar", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </time>
                    {isAdmin && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                            <Trash2 className="ml-1 h-4 w-4" />
                            حذف
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent dir="rtl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>حذف هذا الخبر؟</AlertDialogTitle>
                            <AlertDialogDescription>
                              لا يمكن التراجع عن هذا الإجراء. سيُحذف الخبر وأي وسائط مرفقة به نهائياً.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(p)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              حذف
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                  <h2 className="mt-2 text-2xl font-bold text-foreground leading-snug">{p.title}</h2>
                  <p className="mt-3 whitespace-pre-wrap leading-relaxed text-foreground/80">{p.body}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-border bg-card mt-10">
        <div className="mx-auto max-w-5xl px-6 py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} عيتا نيوز — AYTA NEWS. جميع الحقوق محفوظة.
        </div>
      </footer>
    </div>
  );
}
