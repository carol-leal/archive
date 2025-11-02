// server/routers/tmdb.ts
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

const TMDB_BASE = "https://api.themoviedb.org/3";

export const tmdbRouter = createTRPCRouter({
  searchMovies: publicProcedure
    .input(
      z.object({
        q: z.string().trim().min(1),
        page: z.number().int().min(1).max(100).optional(),
      }),
    )
    .query(async ({ input }) => {
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

      const json = (await res.json()) as {
        results: Array<{
          id: number;
          title: string;
          release_date?: string;
          poster_path?: string;
          description?: string;
        }>;
        total_results: number;
        total_pages: number;
        page: number;
      };

      return {
        page: json.page,
        totalPages: json.total_pages,
        totalResults: json.total_results,
        items: json.results.map((r) => ({
          id: r.id,
          title: r.title,
          year: r.release_date?.slice(0, 4) ?? "",
          posterUrl: r.poster_path
            ? `https://image.tmdb.org/t/p/w500${r.poster_path}`
            : null,
          description: r.description,
        })),
      };
    }),
});
