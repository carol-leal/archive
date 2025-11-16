// server/routers/tmdb.ts
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import type { SearchMovieResponse } from "~/types/general";

const TMDB_BASE = "https://api.themoviedb.org/3";

async function fetchGenres(): Promise<Record<number, string>> {
  const res = await fetch(`${TMDB_BASE}/genre/movie/list?language=en-US`, {
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${process.env.TMDB_BEARER!}`,
    },
    next: { revalidate: 3600 }, // cache 1 hour
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`TMDB genre error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as {
    genres: { id: number; name: string }[];
  };

  const map: Record<number, string> = {};
  for (const g of data.genres) map[g.id] = g.name;

  return map;
}

export const tmdbRouter = createTRPCRouter({
  searchMovies: publicProcedure
    .input(
      z.object({
        q: z.string().trim().min(1),
        page: z.number().int().min(1).max(100).optional(),
      }),
    )
    .query(async ({ input }) => {
      // 1. Fetch TMDB movies
      const res = await fetch(
        `${TMDB_BASE}/search/movie?query=${encodeURIComponent(input.q)}&language=en-US&page=${input.page ?? 1}`,
        {
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${process.env.TMDB_BEARER!}`,
          },
          next: { revalidate: 30 },
        },
      );

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`TMDB error ${res.status}: ${text}`);
      }

      const json = (await res.json()) as SearchMovieResponse;

      // 2. Fetch genres also (cached)
      const genreMap = await fetchGenres();

      // 3. Return everything together
      return {
        page: json.page,
        totalPages: json.total_pages,
        totalResults: json.total_results,
        genreMap, // <-- important
        items: json.results.map((r) => ({
          id: r.id,
          title: r.title,
          overview: r.overview,
          release_date: r.release_date ?? "",
          vote_average: r.vote_average ?? 0,
          poster_path: r.poster_path
            ? `https://image.tmdb.org/t/p/w500${r.poster_path}`
            : null,
          genre_ids: r.genre_ids ?? [],
        })),
      };
    }),
});
