"use client";

import { api } from "~/trpc/react";
import React from "react";
import { Button, Card, CardBody, CardFooter, CardHeader } from "@heroui/react";
import { PopcornIcon } from "@phosphor-icons/react";
import Link from "next/link";

export default function Lists() {
  const lists = api.list.getAll.useQuery();
  return (
    <main className="flex min-h-screen flex-col items-center text-white">
      <div className="grid w-full max-w-7xl grid-cols-1 gap-6 p-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {lists.data?.map((list) => (
          <Card key={list.id} className="w-full max-w-[340px]">
            <Link
              href={`list/${list.id}/${list.name}`}
              className="absolute inset-0 z-10"
            />
            <CardHeader className="justify-between">
              <div className="flex gap-5">
                <PopcornIcon size={32} />
                <div className="flex flex-col items-start justify-center gap-1">
                  <h4 className="text-small text-default-600 leading-none font-semibold">
                    {list.name}
                  </h4>
                </div>
              </div>
              <Button
                className={"text-foreground border-default-200 bg-transparent"}
                color="primary"
                radius="full"
                size="sm"
                variant={"bordered"}
              >
                Share
              </Button>
            </CardHeader>
            <CardBody className="text-small text-default-400 px-3 py-0">
              <p>{list.description}</p>
              <span className="pt-2">Created by {list.createdBy.name}</span>
            </CardBody>
            <CardFooter className="gap-3">
              <div className="flex gap-1">
                <p className="text-default-400 text-small font-semibold">4</p>
                <p className="text-default-400 text-small">Total Movies</p>
              </div>
              <div className="flex gap-1">
                <p className="text-default-400 text-small font-semibold">40</p>
                <p className="text-default-400 text-small">Watched</p>
              </div>
              <div className="flex gap-1">
                <p className="text-default-400 text-small font-semibold">
                  97.1K
                </p>
                <p className="text-default-400 text-small">Pending</p>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </main>
  );
}
