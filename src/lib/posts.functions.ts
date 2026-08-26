import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const getPostById = createServerFn({ method: "GET" })
  .inputValidator((input: { postId: string }) => input)
  .handler(async ({ data }) => {
    const url = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"]!;
    const key =
      process.env["SUPABASE_PUBLISHABLE_KEY"] ??
      process.env["SUPABASE_ANON_KEY"] ??
      process.env["VITE_SUPABASE_PUBLISHABLE_KEY"]!;

    const supabasePublic = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
            h.delete("Authorization");
          }
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });

    const { data: post, error } = await supabasePublic
      .from("posts")
      .select("id,title,body,image_url,video_url,thumbnail_url,created_at")
      .eq("id", data.postId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { post };
  });
