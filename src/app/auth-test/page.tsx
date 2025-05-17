"use client";

import { useUser, SignInButton, SignOutButton } from "@clerk/nextjs";
import { useProfile } from "@/components/LayoutWithSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LayoutWithSidebar from "@/components/LayoutWithSidebar";

export default function AuthTestPage() {
  const { user, isLoaded: isClerkLoaded } = useUser();
  const { avatarUrl, clerkImageUrl, isLoading } = useProfile();

  return (
    <LayoutWithSidebar>
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Test Page</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Clerk Auth State:</h3>
                <pre className="text-sm">
                  {JSON.stringify({
                    isLoaded: isClerkLoaded,
                    isSignedIn: !!user,
                    userId: user?.id,
                    email: user?.emailAddresses[0]?.emailAddress,
                    name: user?.fullName,
                    clerkImageUrl: user?.imageUrl,
                  }, null, 2)}
                </pre>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Profile Context State:</h3>
                <pre className="text-sm">
                  {JSON.stringify({
                    isLoading,
                    avatarUrl,
                    clerkImageUrl,
                  }, null, 2)}
                </pre>
              </div>

              <div className="flex gap-4">
                {!user ? (
                  <SignInButton mode="modal">
                    <Button>Sign In</Button>
                  </SignInButton>
                ) : (
                  <SignOutButton>
                    <Button variant="destructive">Sign Out</Button>
                  </SignOutButton>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </LayoutWithSidebar>
  );
} 