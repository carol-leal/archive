import { TRPCError } from "@trpc/server";
import { randomBytes } from "crypto";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
const ShareInput = z.object({
  listId: z.string().min(1),
  invitedUserTag: z.string().min(2),
  permission: z.enum(["VIEW", "EDIT", "OWNER"]).default("VIEW"),
});
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

  getMembers: protectedProcedure
    .input(z.object({ listId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      // real members
      const members = await ctx.db.listUserPermission.findMany({
        where: { listId: input.listId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              discordUsername: true,
              email: true,
            },
          },
        },
        orderBy: { permission: "desc" }, // OWNER first
      });

      // pending invites
      const pending = await ctx.db.listInvitation.findMany({
        where: {
          listId: input.listId,
          acceptedAt: null,
          expiresAt: { gt: new Date() },
        },
        select: {
          id: true,
          invitedUserTag: true,
          permission: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });

      // current user's permission to gate actions
      const me = await ctx.db.listUserPermission.findFirst({
        where: { listId: input.listId, userId: ctx.session.user.id },
        select: { permission: true },
      });

      return { members, pending, myPermission: me?.permission ?? "VIEW" };
    }),

  shareByDiscordTag: protectedProcedure
    .input(ShareInput)
    .mutation(async ({ ctx, input }) => {
      // must be OWNER to share (adjust if EDIT can share)
      const canShare = await ctx.db.listUserPermission.findFirst({
        where: {
          listId: input.listId,
          userId: ctx.session.user.id,
          permission: "OWNER",
        },
      });
      if (!canShare) throw new TRPCError({ code: "FORBIDDEN" });

      const token = randomBytes(24).toString("hex");
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days

      const invitation = await ctx.db.listInvitation.upsert({
        where: {
          listId_invitedUserTag: {
            listId: input.listId,
            invitedUserTag: input.invitedUserTag,
          },
        },
        update: {
          permission: input.permission,
          token,
          expiresAt,
          acceptedAt: null,
        },
        create: {
          listId: input.listId,
          invitedUserTag: input.invitedUserTag,
          invitedBy: ctx.session.user.id,
          permission: input.permission,
          token,
          expiresAt,
        },
      });

      return { token: invitation.token };
    }),

  removeMember: protectedProcedure
    .input(z.object({ listId: z.string(), userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // only OWNER can remove others
      const me = await ctx.db.listUserPermission.findFirst({
        where: { listId: input.listId, userId: ctx.session.user.id },
        select: { permission: true },
      });
      if (me?.permission !== "OWNER")
        throw new TRPCError({ code: "FORBIDDEN" });

      // prevent removing the last OWNER (optional safeguard)
      const owners = await ctx.db.listUserPermission.count({
        where: { listId: input.listId, permission: "OWNER" },
      });
      const target = await ctx.db.listUserPermission.findUnique({
        where: {
          userId_listId: { userId: input.userId, listId: input.listId },
        },
      });
      if (owners <= 1 && target?.permission === "OWNER") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot remove the last OWNER.",
        });
      }

      await ctx.db.listUserPermission.delete({
        where: {
          userId_listId: { userId: input.userId, listId: input.listId },
        },
      });

      return { ok: true };
    }),

  revokeInvite: protectedProcedure
    .input(z.object({ invitationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // only OWNER can revoke
      const invite = await ctx.db.listInvitation.findUnique({
        where: { id: input.invitationId },
        select: { listId: true, acceptedAt: true },
      });
      if (!invite) throw new TRPCError({ code: "NOT_FOUND" });

      const me = await ctx.db.listUserPermission.findFirst({
        where: { listId: invite.listId, userId: ctx.session.user.id },
        select: { permission: true },
      });
      if (me?.permission !== "OWNER")
        throw new TRPCError({ code: "FORBIDDEN" });

      if (invite.acceptedAt)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invite already accepted.",
        });

      await ctx.db.listInvitation.delete({ where: { id: input.invitationId } });
      return { ok: true };
    }),
  getMyInvitations: protectedProcedure.query(async ({ ctx }) => {
    const me = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { discordUsername: true },
    });

    if (!me?.discordUsername) {
      // If you haven't stored it yet, surface nothing (UI will show empty state)
      return [];
    }

    const now = new Date();
    return ctx.db.listInvitation.findMany({
      where: {
        invitedUserTag: me.discordUsername as string, // exact match
        acceptedAt: null,
        expiresAt: { gt: now },
      },
      select: {
        id: true,
        listId: true,
        invitedUserTag: true,
        permission: true,
        createdAt: true,
        list: { select: { name: true, createdBy: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  /** Accept an invite addressed to my discord username */
  acceptMyInvitation: protectedProcedure
    .input(z.object({ invitationId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const invite = await ctx.db.listInvitation.findUnique({
        where: { id: input.invitationId },
        select: {
          id: true,
          listId: true,
          invitedUserTag: true,
          permission: true,
          acceptedAt: true,
          expiresAt: true,
        },
      });
      if (!invite) throw new TRPCError({ code: "NOT_FOUND" });
      if (invite.acceptedAt) return { ok: true };
      if (invite.expiresAt < new Date())
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invite expired" });

      const me = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { id: true, discordUsername: true },
      });
      if (
        !me?.discordUsername ||
        me.discordUsername !== invite.invitedUserTag
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ctx.db.$transaction([
        ctx.db.listUserPermission.upsert({
          where: { userId_listId: { userId: me.id, listId: invite.listId } },
          update: { permission: invite.permission },
          create: {
            userId: me.id,
            listId: invite.listId,
            permission: invite.permission,
          },
        }),
        ctx.db.listInvitation.update({
          where: { id: invite.id },
          data: { acceptedAt: new Date() },
        }),
      ]);

      return { ok: true };
    }),

  /** Reject = simply delete the pending invite (you can add a declinedAt if you prefer) */
  rejectMyInvitation: protectedProcedure
    .input(z.object({ invitationId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const invite = await ctx.db.listInvitation.findUnique({
        where: { id: input.invitationId },
        select: {
          id: true,
          invitedUserTag: true,
          acceptedAt: true,
          expiresAt: true,
        },
      });
      if (!invite) throw new TRPCError({ code: "NOT_FOUND" });
      if (invite.acceptedAt)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Already accepted",
        });
      if (invite.expiresAt < new Date())
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invite expired" });

      const me = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { discordUsername: true },
      });
      if (
        !me?.discordUsername ||
        me.discordUsername !== invite.invitedUserTag
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ctx.db.listInvitation.delete({ where: { id: invite.id } });
      return { ok: true };
    }),
});
