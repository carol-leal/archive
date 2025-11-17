import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const moviesRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(z.object({ listId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.listMovie.findMany({
        where: { listId: input.listId },
        include: {
          movie: true,
          addedBy: true,
        },
      });
    }),

  addToList: protectedProcedure
    .input(
      z.object({
        listId: z.string(),
        movieId: z.string(),
        title: z.string(),
        tmdbId: z.number(),
        genres: z.array(z.string()),
        posterPath: z.string().optional(),
        releaseDate: z.string().optional(),
        overview: z.string().optional(),
        rating: z.number().min(1).max(100),
        status: z.enum(["PENDING", "WATCHED", "WATCHING"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.listMovie.upsert({
        where: {
          listId_movieId: {
            listId: input.listId,
            movieId: input.movieId,
          },
        },
        update: {
          status: input.status,
        },
        create: {
          list: { connect: { id: input.listId } },
          movie: {
            connectOrCreate: {
              where: { id: input.movieId },
              create: {
                id: input.movieId,
                title: input.title,
                overview: input.overview,
                releaseDate: input.releaseDate
                  ? new Date(input.releaseDate)
                  : undefined,
                posterPath: input.posterPath,
                genres: input.genres,
                tmdbId: input.tmdbId,
                rating: input.rating,
              },
            },
          },
          addedBy: { connect: { id: ctx.session.user.id } },
          status: input.status,
        },
      });
    }),

  removeFromList: protectedProcedure
    .input(
      z.object({
        listId: z.string(),
        movieId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.listMovie.deleteMany({
        where: {
          listId: input.listId,
          movieId: input.movieId,
        },
      });
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        listId: z.string(),
        movieId: z.string(),
        status: z.enum(["PENDING", "WATCHED", "WATCHING"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.listMovie.updateMany({
        where: {
          listId: input.listId,
          movieId: input.movieId,
        },
        data: {
          status: input.status,
        },
      });
    }),
});
