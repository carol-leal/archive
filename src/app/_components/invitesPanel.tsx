"use client";

import React from "react";
import { Card, CardHeader, CardBody, Button, Chip } from "@heroui/react";
import { api } from "~/trpc/react";
import { Check, XCircle } from "@phosphor-icons/react";

export default function InvitesPanel() {
  const utils = api.useUtils();

  const { data: invites, isLoading } = api.list.getMyInvitations.useQuery();

  const accept = api.list.acceptMyInvitation.useMutation({
    onSuccess: async () => {
      await utils.list.getMyInvitations.invalidate();
      await utils.list.getAll.invalidate(); // user might now see a new list
    },
  });

  const reject = api.list.rejectMyInvitation.useMutation({
    onSuccess: async () => {
      await utils.list.getMyInvitations.invalidate();
    },
  });

  if (isLoading) return null;
  if (!invites || invites.length === 0) return null;

  return (
    <Card className="mb-4 w-full max-w-7xl">
      <CardHeader className="flex items-center justify-between">
        <div className="text-base font-semibold">Your invitations</div>
        <Chip size="sm" variant="flat">
          {invites.length}
        </Chip>
      </CardHeader>
      <CardBody className="flex flex-col gap-3">
        {invites.map((inv) => (
          <div
            key={inv.id}
            className="rounded-medium border-default-100 flex items-center justify-between border px-3 py-2"
          >
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {inv.list.name} —{" "}
                <span className="opacity-70">{inv.permission}</span>
              </span>
              <span className="text-xs opacity-70">
                Invited by {inv.list.createdBy?.name ?? "someone"} •{" "}
                {new Date(inv.createdAt).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                startContent={<Check size={18} />}
                color="success"
                size="sm"
                onPress={() => accept.mutate({ invitationId: inv.id })}
                isLoading={accept.isPending}
              >
                Accept
              </Button>
              <Button
                startContent={<XCircle size={18} />}
                color="danger"
                variant="light"
                size="sm"
                onPress={() => reject.mutate({ invitationId: inv.id })}
                isLoading={reject.isPending}
              >
                Decline
              </Button>
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
