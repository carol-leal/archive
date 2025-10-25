"use client";

import type { NavbarProps } from "@heroui/react";
import React from "react";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
  Button,
  Avatar,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  useDisclosure,
} from "@heroui/react";
import { cn } from "@heroui/react";
import Logo from "./logo";
import { SignOutIcon } from "@phosphor-icons/react";
import { api } from "~/trpc/react";
import ModalComponent from "./modal";
import type { ListCreateInput } from "~/types/general";
interface NavbarComponentProps extends NavbarProps {
  avatar: string;
  signOut: () => void;
}

export default function NavbarComponent({
  avatar,
  signOut,
  ...props
}: NavbarComponentProps) {
  const utils = api.useUtils();

  const createList = api.list.create.useMutation({
    onSuccess: async () => {
      await utils.list.getAll.invalidate();
    },
  });

  const handleCreate = async (data: ListCreateInput) => {
    await createList.mutateAsync(data);
  };

  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  return (
    <Navbar
      {...props}
      classNames={{
        base: cn("border-default-100", {
          "bg-default-200/50 dark:bg-default-100/50": isMenuOpen,
        }),
        wrapper: "w-full justify-center",
        item: "hidden md:flex",
      }}
      height="60px"
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
    >
      {/* Left Content */}
      <NavbarBrand>
        <div className="rounded-full text-white">
          <Logo size="medium" />
        </div>
      </NavbarBrand>

      {/* Right Content */}
      <NavbarContent className="hidden md:flex" justify="end">
        <NavbarItem className="ml-2 flex! gap-2">
          <Button
            className="text-default-500"
            radius="full"
            variant="light"
            onClick={onOpen}
          >
            New List
          </Button>
          <Dropdown>
            <DropdownTrigger>
              <Avatar
                isBordered
                as="button"
                className="transition-transform"
                src={avatar}
              />
            </DropdownTrigger>
            <DropdownMenu aria-label="Static Actions">
              <DropdownItem
                key="delete"
                className="text-danger"
                color="danger"
                startContent={<SignOutIcon />}
                onClick={signOut}
              >
                Sign Out
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </NavbarItem>
      </NavbarContent>

      <NavbarMenuToggle className="text-default-400 md:hidden" />

      <NavbarMenu className="bg-default-200/50 shadow-medium dark:bg-default-100/50 top-[calc(var(--navbar-height)-1px)] max-h-fit pt-6 pb-6 backdrop-blur-md backdrop-saturate-150">
        <NavbarMenuItem>
          <Button fullWidth onClick={onOpen} variant="faded">
            New List
          </Button>
        </NavbarMenuItem>
        <NavbarMenuItem>
          <Button
            fullWidth
            onClick={signOut}
            variant="bordered"
            startContent={<SignOutIcon />}
            color="danger"
            className="text-danger"
          >
            Sign Out
          </Button>
        </NavbarMenuItem>
      </NavbarMenu>
      <ModalComponent
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        onCreate={handleCreate}
        isCreating={createList.isPending}
      />
    </Navbar>
  );
}
