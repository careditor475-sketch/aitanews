import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getPostById = createServerFn({ method: "GET" })
  .inputValidator((input: { postId: string }) => input)
  .handler(async ({ data }) => {
    const { data: post, error } = await supabaseAdmin
      .from("posts")
      .select("*")
      .eq("id", data.postId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { post };
  });
export const incrementVisits = createServerFn({ method: "POST" })
  .handler(async () => {
    await supabaseAdmin.rpc("increment_visits");
  });

export const getVisits = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data } = await supabaseAdmin
      .from("visits")
      .select("count")
      .single();
    return { count: data?.count ?? 0 };
  });
