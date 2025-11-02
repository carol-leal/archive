import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const listRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const list = await ctx.db.list.create({
        data: {
          name: input.name,
          description: input.description,
          createdBy: { connect: { id: ctx.session.user.id } },
        },
      });

      await ctx.db.listUserPermission.create({
        data: {
          userId: ctx.session.user.id,
          listId: list.id,
          permission: "OWNER",
        },
      });

      return list;
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.list.findMany({
      where: {
        listUserPermissions: {
          some: {
            userId: ctx.session.user.id,
          },
        },
      },
      include: {
        createdBy: true,
        listUserPermissions: {
          where: { userId: ctx.session.user.id },
          select: { permission: true },
        },
      },
    });
  }),
});
