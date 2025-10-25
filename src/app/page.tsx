import { auth } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";
import { redirect } from "next/navigation";
import ListPage from "./list/page";

export default async function Home() {
  const session = await auth();
  if (!session) redirect("/login");
  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
        <ListPage />
        {session?.user.name}
      </main>
    </HydrateClient>
  );
}
