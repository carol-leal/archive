import { auth } from "~/server/auth";
import { signOut } from "next-auth/react";
import { HydrateClient } from "~/trpc/server";
import { redirect } from "next/navigation";
import Lists from "./_components/lists";
import NavbarComponent from "./_components/navbar";

export default async function Home() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
        <NavbarComponent avatar={session.user.image ?? ""} signOut={signOut} />
        <Lists />
      </main>
    </HydrateClient>
  );
}
