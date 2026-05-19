import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { ArrowRight, Globe } from "lucide-react";
import brandLogo from "@/assets/ayta-news-logo.png";

type Post = {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  video_url: string | null;
  created_at: string;
};

export const Route = createFileRoute("/news/$postId")({
  head: ({ params }) => ({
    meta: [
      { title: `AYTA NEWS — عيتا نيوز | خبر` },
      { name: "description", content: "عيتا نيوز — تفاصيل الخبر" },
    ],
  }),
  component: NewsDetail,
});

function NewsDetail() {
  const { postId } = Route.useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPost() {
      const { data } = await supabase
        .from("posts")
        .select("*")
        .eq("id", postId)
        .maybeSingle();
      setPost(data ?? null);
      setLoading(false);
    }
    loadPost();
  }, [postId]);

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen bg-background">
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-muted-foreground">جارٍ التحميل…</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div dir="rtl" className="min-h-screen bg-background">
        <Toaster richColors />
        <div className="bg-primary text-primary-foreground">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-1.5 text-xs font-semibold tracking-wide">
            <span className="rounded-sm bg-background/15 px-2 py-0.5 uppercase">عاجل</span>
            <span className="opacity-90">تطورات محلية وعالمية على مدار الساعة</span>
          </div>
        </div>
        <header className="border-b border-border bg-card">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-5">
            <div className="flex items-center gap-3">
              <img
                src={brandLogo}
                alt="موقع عيتا نيوز الإعلامي"
                className="h-14 w-14 rounded-md object-contain"
              />
              <div className="leading-tight">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">موقع عيتا نيوز الإعلامي</h1>
                <p className="text-[11px] uppercase tracking-[0.25em] text-primary">AYTA NEWS</p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="border-primary/40 text-foreground hover:bg-primary hover:text-primary-foreground">
              <Link to="/">العودة للرئيسية</Link>
            </Button>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-6 py-20 text-center">
          <p className="text-muted-foreground">لم يُعثر على هذا الخبر.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/">العودة للرئيسية</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <Toaster richColors />

      <div className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-1.5 text-xs font-semibold tracking-wide">
          <span className="rounded-sm bg-background/15 px-2 py-0.5 uppercase">عاجل</span>
          <span className="opacity-90">تطورات محلية وعالمية على مدار الساعة</span>
        </div>
      </div>

      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-3">
            <img
              src={brandLogo}
              alt="موقع عيتا نيوز الإعلامي"
              className="h-14 w-14 rounded-md object-contain"
            />
            <div className="leading-tight">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">موقع عيتا نيوز الإعلامي</h1>
              <p className="text-[11px] uppercase tracking-[0.25em] text-primary">AYTA NEWS</p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="border-primary/40 text-foreground hover:bg-primary hover:text-primary-foreground">
            <Link to="/">
              <ArrowRight className="ml-2 h-4 w-4" />
              الرئيسية
            </Link>
          </Button>
        </div>
        <nav className="border-t border-border">
          <div className="mx-auto flex max-w-5xl items-center gap-6 overflow-x-auto px-6 py-2 text-sm font-medium text-muted-foreground">
            <Link to="/" className="text-foreground hover:text-primary">الرئيسية</Link>
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
        <Card className="overflow-hidden border-border">
          {post.image_url && (
            <img src={post.image_url} alt={post.title} className="aspect-video w-full object-cover" />
          )}
          {post.video_url && (
            <video src={post.video_url} controls className="aspect-video w-full bg-black" />
          )}
          <div className="p-6">
            <time className="text-xs uppercase tracking-wider text-primary">
              {new Date(post.created_at).toLocaleDateString("ar", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            <h1 className="mt-3 text-3xl font-bold text-foreground leading-snug">{post.title}</h1>
            <p className="mt-5 whitespace-pre-wrap leading-relaxed text-foreground/80 text-lg">{post.body}</p>
          </div>
        </Card>
      </main>

      <footer className="border-t border-border bg-card mt-10">
        <div className="mx-auto max-w-5xl px-6 py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} موقع عيتا نيوز الإعلامي — AYTA NEWS. جميع الحقوق محفوظة.
        </div>
      </footer>
    </div>
  );
}
