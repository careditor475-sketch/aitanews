import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

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
      { title: "News Feed" },
      { name: "description", content: "Latest news and updates." },
    ],
  }),
  component: Home,
});

function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setPosts(data ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">The Feed</h1>
            <p className="text-sm text-muted-foreground">Latest news and updates</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/admin">
              <Lock className="mr-2 h-4 w-4" />
              Admin
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        {loading ? (
          <p className="text-center text-muted-foreground">Loading…</p>
        ) : posts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-20 text-center">
            <p className="text-muted-foreground">No posts yet. Check back soon.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {posts.map((p) => (
              <Card key={p.id} className="overflow-hidden p-0">
                {p.image_url && (
                  <img
                    src={p.image_url}
                    alt={p.title}
                    className="aspect-video w-full object-cover"
                  />
                )}
                {p.video_url && (
                  <video
                    src={p.video_url}
                    controls
                    className="aspect-video w-full bg-black"
                  />
                )}
                <div className="p-6">
                  <time className="text-xs uppercase tracking-wider text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                  <h2 className="mt-2 text-2xl font-semibold text-foreground">{p.title}</h2>
                  <p className="mt-3 whitespace-pre-wrap text-foreground/80 leading-relaxed">
                    {p.body}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
