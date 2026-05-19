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
