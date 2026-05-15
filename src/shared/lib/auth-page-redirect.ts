import { redirect } from "next/navigation";

import { createClient } from "@/shared/lib/supabase/server";

export async function redirectAuthenticatedUserToApp() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (!error && user) {
    redirect("/app");
  }
}
