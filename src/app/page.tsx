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
      <Lists />
    </HydrateClient>
  );
}
