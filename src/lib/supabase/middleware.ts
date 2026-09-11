import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, publishableKey } = getSupabaseConfig();
  const supabase = createServerClient(
    url,
    publishableKey,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const isAuthPage = path === "/login" || path === "/signup";
  const isProtected = path.startsWith("/onboarding");

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    const role = user.user_metadata.role === "creator" ? "creator" : "company";
    return NextResponse.redirect(new URL(`/onboarding/${role}`, request.url));
  }

  if (user && path.startsWith("/onboarding/")) {
    const requestedRole = path.split("/")[2];
    const actualRole = user.user_metadata.role === "creator" ? "creator" : "company";
    if (requestedRole !== actualRole) return NextResponse.redirect(new URL(`/onboarding/${actualRole}`, request.url));
  }

  return response;
}
