// types/general.ts
import type { inferRouterInputs } from "@trpc/server";
import type { AppRouter } from "~/server/api/root";

type RouterInputs = inferRouterInputs<AppRouter>;
export type ListCreateInput = RouterInputs["list"]["create"];
