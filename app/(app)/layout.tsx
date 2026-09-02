import { redirect } from "next/navigation";
import { getAppUser } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";

/**
 * Shared layout for all authenticated routes.
 * Handles auth, upserts the Prisma user on first visit, and renders the
 * persistent sidebar. Individual pages receive only the inner content slot.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAppUser();
  if (!user) redirect("/signin");

  return (
    <div className="flex md:h-screen overflow-x-hidden bg-bg">
      <Sidebar user={{ name: user.name, avatarUrl: user.avatarUrl }} />

      {/*
       * Right column: receives page content (header + main).
       * md+    → fills remaining width; each page's <main> handles overflow-y-auto
       * mobile → pt-12 clears the fixed top bar; no bottom nav padding needed
       */}
      <div className="flex flex-col flex-1 min-w-0 md:overflow-hidden overflow-x-hidden pt-12 md:pt-0">
        {children}
      </div>
    </div>
  );
}
