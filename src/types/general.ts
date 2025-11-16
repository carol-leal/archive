import type { inferRouterInputs } from "@trpc/server";
import type { AppRouter } from "~/server/api/root";
import type { inferRouterOutputs } from "@trpc/server";

type RouterInputs = inferRouterInputs<AppRouter>;
export type ListCreateInput = RouterInputs["list"]["create"];

export type Movie = {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  vote_average: number;
  genre_ids?: number[];
};

export type SearchMovieResponse = {
  page: number;
  results: Movie[];
  total_results: number;
  total_pages: number;
};

export type SearchGenreResponse = {
  genres: {
    id: number;
    name: string;
  }[];
};
type RouterOutput = inferRouterOutputs<AppRouter>;
export type MovieWithExtras = RouterOutput["movies"]["getAll"][number];
