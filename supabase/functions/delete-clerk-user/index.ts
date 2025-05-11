import { serve } from "std/server";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const { user_id } = await req.json();
  if (!user_id) {
    return new Response("Missing user_id", { status: 400 });
  }

  // Clerk API endpoint and secret
  const clerkSecret = Deno.env.get("CLERK_SECRET_KEY");
  const clerkApiUrl = `https://api.clerk.dev/v1/users/${user_id}`;

  const res = await fetch(clerkApiUrl, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${clerkSecret}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const error = await res.text();
    return new Response(`Failed to delete Clerk user: ${error}`, { status: 500 });
  }

  return new Response("Clerk user deleted", { status: 200 });
}); 