import LoginComponent from "../_components/login";
import { Suspense } from "react";
import { auth } from "~/server/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/");
  return (
    <main className="flex items-center justify-center md:h-screen">
      <Suspense>
        <LoginComponent />
      </Suspense>
    </main>
  );
}
