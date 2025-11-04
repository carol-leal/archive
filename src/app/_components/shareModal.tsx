"use client";

import React from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalFooter,
  Input,
  Select,
  SelectItem,
  Chip,
  Avatar,
  Spacer,
  Divider,
} from "@heroui/react";
import { Trash, UserPlus } from "@phosphor-icons/react";
import { api } from "~/trpc/react";

type Props = {
  listId: string;
  listName: string;
  isOwner: boolean; // pass from getAll -> listUserPermissions[0].permission === 'OWNER'
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

const PERMISSIONS = ["VIEW", "EDIT", "OWNER"] as const;

type User = {
  user: {
    name: string | null;
    id: string;
    image: string | null;
    discordUsername: string | null;
    email: string | null;
  };
  permission: string;
};

export default function ShareModal({
  listId,
  listName,
  isOwner,
  open,
  onOpenChange,
}: Props) {
  const utils = api.useUtils();

  const { data, isFetching } = api.list.getMembers.useQuery(
    { listId },
    { enabled: open },
  );

  const [invitedUserTag, setInvitedUserTag] = React.useState("");
  const [permission, setPermission] = React.useState<"VIEW" | "EDIT" | "OWNER">(
    "VIEW",
  );

  const share = api.list.shareByDiscordTag.useMutation({
    onSuccess: async () => {
      setInvitedUserTag("");
      await utils.list.getMembers.invalidate({ listId });
    },
  });

  const removeMember = api.list.removeMember.useMutation({
    onSuccess: async () => {
      await utils.list.getMembers.invalidate({ listId });
    },
  });

  const revokeInvite = api.list.revokeInvite.useMutation({
    onSuccess: async () => {
      await utils.list.getMembers.invalidate({ listId });
    },
  });

  const onInvite = () => {
    if (!invitedUserTag.trim()) return;
    share.mutate({ listId, invitedUserTag: invitedUserTag.trim(), permission });
  };

  return (
    <Modal isOpen={open} onOpenChange={onOpenChange} size="xl" backdrop="blur">
      <ModalContent>
        {(close) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Share “{listName}”
            </ModalHeader>
            <ModalBody>
              {/* Add user */}
              <div className="flex flex-col gap-3">
                <div className="flex items-end gap-3">
                  <Input
                    label="Discord username or tag"
                    placeholder="e.g. rafael or rafael#1234"
                    value={invitedUserTag}
                    onChange={(e) => setInvitedUserTag(e.target.value)}
                    isDisabled={!isOwner}
                  />
                  <Select
                    label="Permission"
                    selectedKeys={[permission]}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as string;
                      if (
                        selected === "VIEW" ||
                        selected === "EDIT" ||
                        selected === "OWNER"
                      ) {
                        setPermission(selected);
                      }
                    }}
                    isDisabled={!isOwner}
                    className="min-w-[160px]"
                  >
                    {PERMISSIONS.map((p) => (
                      <SelectItem key={p}>{p}</SelectItem>
                    ))}
                  </Select>
                  <Button
                    startContent={<UserPlus size={18} />}
                    color="primary"
                    onPress={onInvite}
                    isLoading={share.isPending}
                    isDisabled={!isOwner}
                  >
                    Invite
                  </Button>
                </div>
              </div>

              <Spacer y={2} />
              <Divider />
              <Spacer y={2} />

              {/* Members */}
              <div className="flex flex-col gap-3">
                <h4 className="text-sm font-semibold">Members</h4>
                <div className="flex flex-col gap-2">
                  {data?.members?.length ? (
                    data.members.map((m: User) => (
                      <div
                        key={m.user.id}
                        className="rounded-medium border-default-100 flex items-center justify-between border px-3 py-2"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar
                            size="sm"
                            radius="sm"
                            src={m.user.image ?? undefined}
                            name={m.user.name ?? "User"}
                          />
                          <div className="flex flex-col leading-tight">
                            <span className="text-sm font-medium">
                              {m.user.name ?? "Unnamed"}
                            </span>
                            <span className="text-default-500 text-xs">
                              {m.user.discordUsername
                                ? `@${m.user.discordUsername}`
                                : (m.user.email ?? "—")}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Chip size="sm" variant="flat">
                            {m.permission}
                          </Chip>
                          {isOwner && (
                            <Button
                              isIconOnly
                              variant="light"
                              color="danger"
                              onPress={() =>
                                removeMember.mutate({
                                  listId,
                                  userId: m.user.id,
                                })
                              }
                              isLoading={removeMember.isPending}
                            >
                              <Trash size={18} />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-default-500 text-sm">
                      No members yet (besides you).
                    </p>
                  )}
                </div>
              </div>

              <Spacer y={2} />
              <Divider />
              <Spacer y={2} />

              {/* Pending invites */}
              <div className="flex flex-col gap-3">
                <h4 className="text-sm font-semibold">Pending invitations</h4>
                <div className="flex flex-col gap-2">
                  {data?.pending?.length ? (
                    data.pending.map((p) => (
                      <div
                        key={p.id}
                        className="rounded-medium border-default-100 flex items-center justify-between border px-3 py-2"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar size="sm" radius="sm" />
                          <div className="flex flex-col leading-tight">
                            <span className="text-sm font-medium">
                              @{p.invitedUserTag}
                            </span>
                            <span className="text-default-500 text-xs">
                              Invited • {new Date(p.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Chip size="sm" variant="flat">
                            {p.permission}
                          </Chip>
                          {isOwner && (
                            <Button
                              isIconOnly
                              variant="light"
                              color="danger"
                              onPress={() =>
                                revokeInvite.mutate({ invitationId: p.id })
                              }
                              isLoading={revokeInvite.isPending}
                            >
                              <Trash size={18} />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-default-500 text-sm">None.</p>
                  )}
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={close}>
                Close
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
