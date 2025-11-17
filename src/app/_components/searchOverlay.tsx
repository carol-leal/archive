"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Input,
  Button,
  Spinner,
  Card,
  CardBody,
  Image,
  Kbd,
} from "@heroui/react";
import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";

import { api } from "~/trpc/react";
import type { Movie } from "~/types/general";
import { MovieDetailsModal } from "./movieDetail";
import type { ListStatus } from "./movieDetail";

type SearchOverlayProps = {
  listId: string;
};

function getYear(dateStr?: string | null): string {
  if (!dateStr) return "";
  return dateStr.slice(0, 4);
}

export default function SearchOverlay({ listId }: SearchOverlayProps) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Movie[]>([]);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [addedStatus, setAddedStatus] = useState<ListStatus | null>(null);

  // debounce
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const utils = api.useUtils();

  const { data, isFetching, refetch, isLoading } =
    api.tmdb.searchMovies.useQuery(
      { q: q.trim(), page },
      {
        enabled: q.trim().length > 0,
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
    );

  const genreMap = data?.genreMap ?? {};

  // accumulate pages
  useEffect(() => {
    if (!data) return;
    setTotalPages(data.totalPages);
    setItems((prev) => (page === 1 ? data.items : [...prev, ...data.items]));
  }, [data, page]);

  // open on "/" and close on "Escape"
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !open) {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // focus input when opening; reset state when closing
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQ("");
      setPage(1);
      setItems([]);
      setTotalPages(1);
      setSelectedMovie(null);
      setDetailsOpen(false);
      setAddedStatus(null);
    }
  }, [open]);

  const onChange = (val: string) => {
    setQ(val);
    setPage(1);

    // Clear items immediately when search is cleared
    if (val.trim().length === 0) {
      setItems([]);
      setTotalPages(1);
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (val.trim().length > 0) void refetch();
    }, 250);
  };

  const loadMore = () => {
    if (page < totalPages && !isFetching) setPage((p) => p + 1);
  };

  const openDetails = (movie: Movie) => {
    console.log("Opening details for movie:", movie.title);
    setSelectedMovie(movie);
    setDetailsOpen(true);
    setAddedStatus(null);
  };

  // ---- addToList mutation ----
  const addToList = api.movies.addToList.useMutation({
    onSuccess: async (_data, variables) => {
      console.log("Successfully added movie with status:", variables.status);
      setAddedStatus(variables.status as ListStatus);
      // invalidate list so it reflects new movie
      await utils.movies.getAll.invalidate({ listId: variables.listId });

      setTimeout(() => {
        setAddedStatus(null);
      }, 2000);
    },
    onError: (error) => {
      console.error("Error adding movie:", error);
      setAddedStatus(null);
    },
  });

  const handleChangeStatus = (status: ListStatus, movie: Movie) => {
    console.log("handleChangeStatus called:", {
      status,
      movieTitle: movie.title,
      listId,
    });

    if (!listId) {
      console.error("No listId provided!");
      return;
    }

    const genres =
      movie.genre_ids?.map((id) => genreMap[id] ?? "Unknown") ?? [];

    const mutationInput = {
      listId,
      movieId: movie.id.toString(),
      title: movie.title,
      tmdbId: movie.id,
      genres,
      posterPath: movie.poster_path ?? undefined,
      releaseDate: movie.release_date ?? undefined,
      overview: movie.overview ?? undefined,
      status,
      rating: movie.vote_average,
    };

    addToList.mutate(mutationInput);
  };

  return (
    <>
      <Button
        aria-label="Open search"
        className="fixed right-5 bottom-5 z-40 rounded-full shadow-xl"
        onPress={() => setOpen(true)}
        isIconOnly
        variant="solid"
        color="primary"
      >
        <MagnifyingGlassIcon className="h-5 w-5" />
      </Button>

      <Modal
        isOpen={open}
        onOpenChange={setOpen}
        backdrop="blur"
        size="full"
        classNames={{
          backdrop: "bg-black/70",
          base: "bg-gradient-to-b from-black to-neutral-900 text-white",
        }}
        placement="center"
        hideCloseButton
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="sticky top-0 z-10 flex w-full flex-col gap-3 bg-black/60 px-6 pt-6 pb-4 backdrop-blur">
            <div className="flex w-full items-center gap-3">
              <Input
                ref={inputRef}
                value={q}
                onValueChange={onChange}
                placeholder="Search for movies"
                startContent={
                  <MagnifyingGlassIcon className="h-5 w-5 opacity-70" />
                }
                radius="full"
                size="lg"
                classNames={{
                  input:
                    "text-base md:text-lg placeholder:text-neutral-400 text-white",
                  inputWrapper:
                    "bg-neutral-800 data-[hover=true]:bg-neutral-700 group-data-[focus=true]:bg-neutral-700 border border-neutral-700",
                }}
              />
              <Button
                onPress={() => setOpen(false)}
                variant="light"
                className="text-neutral-300"
                startContent={<XIcon className="h-5 w-5" />}
              >
                Close
              </Button>
            </div>

            <div className="flex items-center gap-3 text-sm text-neutral-400">
              <span>
                Tip: Press <Kbd>/</Kbd> to open, <Kbd>Esc</Kbd> to close
              </span>
              {isLoading || isFetching ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner size="sm" /> Searching…
                </span>
              ) : q.trim() ? (
                <span>
                  Page {data?.page ?? 1} / {totalPages}
                </span>
              ) : (
                <span>Start typing to search TMDB</span>
              )}
            </div>
          </ModalHeader>

          <ModalBody className="px-6 pb-8">
            {/* Empty state */}
            {q.trim().length === 0 && (
              <div className="grid min-h-[50vh] place-items-center text-neutral-400">
                Try &quot;Dune&quot;, &quot;Inception&quot;, &quot;The Lord of
                the Rings&quot;…
              </div>
            )}

            {/* Results grid */}
            {items.length > 0 && (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {items.map((m) => (
                    <Card
                      key={m.id}
                      isPressable
                      onPress={() => openDetails(m)}
                      className="group relative cursor-pointer overflow-hidden border-0 bg-neutral-900"
                      radius="md"
                      shadow="sm"
                    >
                      <div className="relative">
                        <Image
                          alt={m.title}
                          src={
                            m.poster_path ??
                            "https://placehold.co/500x750?text=No+Poster"
                          }
                          className="aspect-[2/3] w-full object-cover transition-transform group-hover:scale-[1.03]"
                          removeWrapper
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                      <CardBody className="absolute inset-x-0 bottom-0 hidden gap-1 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 group-hover:flex">
                        <div className="line-clamp-2 text-sm font-medium">
                          {m.title}
                        </div>
                        <div className="text-xs text-neutral-400">
                          {getYear(m.release_date)}
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>

                {/* Load more */}
                {page < totalPages && (
                  <div className="mt-6 grid place-items-center">
                    <Button
                      onPress={loadMore}
                      isLoading={isFetching}
                      variant="flat"
                      className="min-w-40 bg-neutral-800 text-neutral-100"
                    >
                      Load more
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* No results */}
            {q.trim().length > 0 && !isFetching && items.length === 0 && (
              <div className="grid min-h-[40vh] place-items-center text-neutral-400">
                No results for &quot;{q}&quot;.
              </div>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Movie details modal */}
      <MovieDetailsModal
        movie={selectedMovie}
        isOpen={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        genreMap={genreMap}
        isLoading={addToList.isPending}
        addedStatus={addedStatus}
        onChangeStatus={handleChangeStatus}
      />
    </>
  );
}
