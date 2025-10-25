// ModalComponent.tsx
"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Input,
  ModalFooter,
  Button,
} from "@heroui/react";
import React from "react";
import type { ListCreateInput } from "~/types/general";

interface ModalComponentProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: ListCreateInput) => Promise<void>;
  isCreating?: boolean;
}

export default function ModalComponent({
  isOpen,
  onOpenChange,
  onCreate,
  isCreating,
}: ModalComponentProps) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");

  const canSubmit = name.trim().length > 0 && !isCreating;

  return (
    <Modal isOpen={isOpen} placement="top-center" onOpenChange={onOpenChange}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">New List</ModalHeader>
            <ModalBody>
              <Input
                label="Name"
                placeholder="Enter list name"
                variant="bordered"
                value={name}
                onValueChange={setName}
                isDisabled={isCreating}
              />
              <Input
                label="Description"
                placeholder="Enter list description"
                variant="bordered"
                value={description}
                onValueChange={setDescription}
                isDisabled={isCreating}
              />
            </ModalBody>
            <ModalFooter>
              <Button
                variant="flat"
                onPress={() => onOpenChange(false)}
                isDisabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                color="primary"
                isLoading={isCreating}
                isDisabled={!canSubmit}
                onPress={async () => {
                  await onCreate({
                    name: name.trim(),
                    description: description.trim() || undefined,
                  });
                  setName("");
                  setDescription("");
                  onOpenChange(false);
                }}
              >
                Create List
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
