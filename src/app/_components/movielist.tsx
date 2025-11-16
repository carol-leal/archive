"use client";

import React, { useState } from "react";
import {
  Card,
  Image,
  Chip,
  CardBody,
  CardFooter,
  Modal,
  ModalContent,
  Button,
  ScrollShadow,
} from "@heroui/react";
import {
  StarIcon,
  ClockIcon,
  PlayIcon,
  CheckIcon,
  TrashIcon,
  XIcon,
} from "@phosphor-icons/react";
import Logo from "./logo";
import { api } from "~/trpc/react";
import { Tabs, Tab } from "@heroui/react";
import {
  PopcornIcon,
  TicketIcon,
  FilmStripIcon,
  FilmReelIcon,
} from "@phosphor-icons/react";
import type { MovieWithExtras } from "~/types/general";

// Helper: get year from date
function getYear(date?: Date | null): string | null {
  if (!date) return null;
  return new Date(date).getFullYear().toString();
}

// Helper: format full date nicely
function formatDate(date?: Date | null): string | null {
  if (!date) return null;
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Helper: get status color
function getStatusColor(status: string): "warning" | "primary" | "success" {
  switch (status) {
    case "PENDING":
      return "warning";
    case "WATCHING":
      return "primary";
    case "WATCHED":
      return "success";
    default:
      return "primary";
  }
}

// Helper: get status label
function getStatusLabel(status: string): string {
  switch (status) {
    case "PENDING":
      return "Pending";
    case "WATCHING":
      return "Watching";
    case "WATCHED":
      return "Watched";
    default:
      return status;
  }
}

type MovieStatus = "PENDING" | "WATCHING" | "WATCHED";

export default function MovieList({
  initialMoviesData,
  listId,
}: {
  initialMoviesData: MovieWithExtras[];
  listId: string;
}) {
  const [selectedMovie, setSelectedMovie] = useState<MovieWithExtras | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const utils = api.useUtils();

  const { data: movieData } = api.movies.getAll.useQuery(
    { listId },
    {
      initialData: initialMoviesData,
      refetchOnMount: false,
      refetchOnWindowFocus: true,
    },
  );

  const updateStatus = api.movies.updateStatus.useMutation({
    onSuccess: async () => {
      await utils.movies.getAll.invalidate({ listId });
    },
  });

  const removeMovie = api.movies.removeFromList.useMutation({
    onSuccess: async () => {
      await utils.movies.getAll.invalidate({ listId });
      setIsModalOpen(false);
      setSelectedMovie(null);
    },
  });

  const pendingMovies = movieData?.filter(
    (movie) => movie.status === "PENDING",
  );
  const watchingMovies = movieData?.filter(
    (movie) => movie.status === "WATCHING",
  );
  const watchedMovies = movieData?.filter(
    (movie) => movie.status === "WATCHED",
  );
  const movies = movieData || initialMoviesData;

  const handleStatusChange = (movieId: string, status: MovieStatus) => {
    updateStatus.mutate({ listId, movieId, status });
  };

  const handleDelete = (movieId: string) => {
    removeMovie.mutate({ listId, movieId });
  };

  const openMovieDetail = (movie: MovieWithExtras) => {
    setSelectedMovie(movie);
    setIsModalOpen(true);
  };

  return (
    <>
      {movies.length > 0 ? (
        <div className="m-4 flex w-full flex-col items-center justify-center">
          <Tabs aria-label="Options" color="primary" variant="bordered">
            <Tab
              key="all"
              title={
                <div className="flex items-center space-x-2">
                  <PopcornIcon />
                  <span>All ({movies?.length})</span>
                </div>
              }
            />
            <Tab
              key="pending"
              title={
                <div className="flex items-center space-x-2">
                  <FilmReelIcon />
                  <span>Pending ({pendingMovies?.length})</span>
                </div>
              }
            />
            <Tab
              key="watching"
              title={
                <div className="flex items-center space-x-2">
                  <TicketIcon />
                  <span>Watching ({watchingMovies?.length})</span>
                </div>
              }
            />
            <Tab
              key="watched"
              title={
                <div className="flex items-center space-x-2">
                  <FilmStripIcon />
                  <span>Watched ({watchedMovies?.length})</span>
                </div>
              }
            />
          </Tabs>
        </div>
      ) : (
        <div className="m-4 text-center text-lg font-medium text-gray-500">
          No movies in this list yet.
        </div>
      )}

      {/* Mobile: Compact Grid */}
      <div className="mt-4 grid w-full max-w-7xl grid-cols-3 gap-3 px-4 md:hidden">
        {movies?.map((movie) => {
          const year = getYear(movie.movie.releaseDate);
          const statusColor = getStatusColor(movie.status);
          const statusLabel = getStatusLabel(movie.status);

          return (
            <Card
              key={movie.id}
              isPressable
              onPress={() => openMovieDetail(movie)}
              className="group relative cursor-pointer overflow-hidden border-0 bg-neutral-900"
              radius="md"
              shadow="sm"
            >
              <div className="relative">
                {movie.movie.posterPath ? (
                  <Image
                    removeWrapper
                    alt={movie.movie.title}
                    src={movie.movie.posterPath}
                    className="aspect-[2/3] w-full object-cover transition-transform group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex aspect-[2/3] w-full items-center justify-center bg-neutral-800">
                    <Logo size="small" />
                  </div>
                )}

                {/* Status badge */}
                <div className="absolute top-1 right-1">
                  <Chip
                    size="sm"
                    variant="flat"
                    color={statusColor}
                    className="text-[10px] font-medium"
                  >
                    {statusLabel}
                  </Chip>
                </div>

                {/* Hover overlay */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              </div>

              {/* Title on hover */}
              <CardBody className="absolute inset-x-0 bottom-0 hidden gap-1 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 group-hover:flex">
                <div className="line-clamp-2 text-xs font-medium">
                  {movie.movie.title}
                </div>
                {year && (
                  <div className="text-[10px] text-neutral-400">{year}</div>
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Desktop: Full Cards */}
      <div className="mt-4 hidden w-full max-w-7xl grid-cols-1 gap-4 px-4 md:grid lg:grid-cols-2 xl:grid-cols-3">
        {movies?.map((movie) => {
          const year = getYear(movie.movie.releaseDate);
          const releaseDate = formatDate(movie.movie.releaseDate);
          const statusColor = getStatusColor(movie.status);
          const statusLabel = getStatusLabel(movie.status);

          return (
            <Card
              key={movie.id}
              isPressable
              onPress={() => openMovieDetail(movie)}
              className="cursor-pointer overflow-hidden border border-neutral-800 bg-neutral-950 transition-all hover:border-neutral-700"
              radius="lg"
              shadow="sm"
            >
              {/* Poster Section */}
              <div className="relative h-80 w-full flex-shrink-0">
                {movie.movie.posterPath ? (
                  <Image
                    removeWrapper
                    alt={movie.movie.title}
                    src={movie.movie.posterPath}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-neutral-900">
                    <Logo size="small" />
                  </div>
                )}

                {/* TMDB Rating overlay */}
                <div className="absolute top-2 left-2">
                  <div className="flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 backdrop-blur-sm">
                    <StarIcon className="text-warning h-3 w-3" weight="fill" />
                    <span className="text-xs font-medium text-white">
                      {movie.movie.rating ?? "N/A"}
                    </span>
                  </div>
                </div>

                {/* Status badge */}
                <div className="absolute top-2 right-2">
                  <Chip
                    size="sm"
                    variant="flat"
                    color={statusColor}
                    className="font-medium"
                  >
                    {statusLabel}
                  </Chip>
                </div>
              </div>

              {/* Content Section */}
              <CardBody className="flex flex-col gap-3 p-4">
                {/* Title and Date */}
                <div className="flex flex-col gap-1">
                  <h3 className="line-clamp-2 text-lg leading-tight font-semibold">
                    {movie.movie.title}
                  </h3>
                  {releaseDate && (
                    <p className="text-xs text-neutral-400">{releaseDate}</p>
                  )}
                </div>

                {/* Genres */}
                {movie.movie.genres && movie.movie.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {movie.movie.genres.slice(0, 3).map((genre) => (
                      <Chip
                        key={genre}
                        size="sm"
                        variant="flat"
                        radius="full"
                        className="border border-neutral-700 bg-neutral-900 text-[10px] text-neutral-300"
                      >
                        {genre}
                      </Chip>
                    ))}
                  </div>
                )}

                {/* Overview */}
                {movie.movie.overview && (
                  <p className="line-clamp-3 text-xs leading-relaxed text-neutral-300">
                    {movie.movie.overview}
                  </p>
                )}

                {/* Added by info */}
                {movie.addedBy && (
                  <div className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/50 p-2">
                    {movie.addedBy.image && (
                      <Image
                        src={movie.addedBy.image}
                        alt={movie.addedBy.name ?? "User"}
                        className="h-6 w-6 rounded-full"
                        removeWrapper
                      />
                    )}
                    <div className="flex flex-col">
                      <span className="text-[10px] text-neutral-400">
                        Added by
                      </span>
                      <span className="text-xs font-medium">
                        {movie.addedBy.name}
                      </span>
                    </div>
                  </div>
                )}
              </CardBody>

              {/* Action Buttons */}
              <CardFooter
                className="flex flex-col gap-2 border-t border-neutral-800 p-4"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Status Buttons Row */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="flat"
                    color="warning"
                    isDisabled={
                      updateStatus.isPending || movie.status === "PENDING"
                    }
                    onPress={(e) => {
                      e.stopPropagation();
                      handleStatusChange(movie.movieId, "PENDING");
                    }}
                    className="flex-1"
                  >
                    <ClockIcon className="h-4 w-4" />
                    <span className="text-xs">Pending</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="solid"
                    color="primary"
                    isDisabled={
                      updateStatus.isPending || movie.status === "WATCHING"
                    }
                    onPress={(e) => {
                      e.stopPropagation();
                      handleStatusChange(movie.movieId, "WATCHING");
                    }}
                    className="flex-1"
                  >
                    <PlayIcon className="h-4 w-4" />
                    <span className="text-xs">Watching</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="flat"
                    color="success"
                    isDisabled={
                      updateStatus.isPending || movie.status === "WATCHED"
                    }
                    onPress={(e) => {
                      e.stopPropagation();
                      handleStatusChange(movie.movieId, "WATCHED");
                    }}
                    className="flex-1"
                  >
                    <CheckIcon className="h-4 w-4" />
                    <span className="text-xs">Watched</span>
                  </Button>
                </div>

                {/* Delete Button Row */}
                <Button
                  size="sm"
                  variant="flat"
                  color="danger"
                  isLoading={removeMovie.isPending}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDelete(movie.movieId);
                  }}
                  className="w-full"
                >
                  <TrashIcon className="h-4 w-4" />
                  <span className="text-xs">Delete Movie</span>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Detail Modal (Mobile and Desktop) */}
      {selectedMovie && (
        <Modal
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          placement="center"
          backdrop="blur"
          size="xl"
          hideCloseButton
          scrollBehavior="inside"
          classNames={{
            backdrop: "bg-black/70",
            base: "bg-neutral-950 text-white border border-neutral-800 rounded-3xl shadow-2xl max-h-[85vh]",
          }}
        >
          <ModalContent>
            <div className="flex flex-col gap-4 p-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <h2 className="text-lg leading-tight font-semibold">
                    {selectedMovie.movie.title}
                  </h2>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400">
                    {getYear(selectedMovie.movie.releaseDate) && (
                      <span>{getYear(selectedMovie.movie.releaseDate)}</span>
                    )}

                    {formatDate(selectedMovie.movie.releaseDate) && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-neutral-500" />
                        <span>
                          {formatDate(selectedMovie.movie.releaseDate)}
                        </span>
                      </>
                    )}

                    {/* TMDB Rating */}
                    <span className="h-1 w-1 rounded-full bg-neutral-500" />
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-flex items-center gap-1 rounded-full bg-neutral-900 px-2 py-1 text-xs font-medium">
                        <StarIcon
                          className="text-warning h-3 w-3"
                          weight="fill"
                        />
                        <span>{selectedMovie.movie.rating ?? "N/A"}</span>
                      </span>
                      <span className="text-[10px] text-neutral-400">TMDB</span>
                    </span>
                  </div>
                </div>

                <Button
                  isIconOnly
                  variant="light"
                  radius="full"
                  size="sm"
                  onPress={() => setIsModalOpen(false)}
                  className="text-neutral-400 hover:text-white"
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>

              {/* Content: poster + details */}
              <div className="flex flex-col gap-4">
                {/* Poster column */}
                <div className="relative w-full flex-shrink-0">
                  <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
                    {selectedMovie.movie.posterPath ? (
                      <Image
                        alt={selectedMovie.movie.title}
                        src={selectedMovie.movie.posterPath}
                        className="aspect-[2/3] w-full object-cover"
                        removeWrapper
                      />
                    ) : (
                      <div className="flex aspect-[2/3] w-full items-center justify-center">
                        <Logo size="small" />
                      </div>
                    )}
                  </div>

                  {/* Current status */}
                  <div className="mt-2 flex items-center justify-center">
                    <Chip
                      size="sm"
                      variant="flat"
                      color={getStatusColor(selectedMovie.status)}
                      className="font-medium"
                    >
                      {getStatusLabel(selectedMovie.status)}
                    </Chip>
                  </div>
                </div>

                {/* Text column */}
                <div className="flex flex-1 flex-col gap-3">
                  {/* Genres */}
                  <div className="flex flex-wrap gap-1.5">
                    {selectedMovie.movie.genres &&
                    selectedMovie.movie.genres.length > 0 ? (
                      selectedMovie.movie.genres.slice(0, 6).map((g) => (
                        <Chip
                          key={g}
                          size="sm"
                          variant="flat"
                          radius="full"
                          className="border border-neutral-700 bg-neutral-900 text-xs text-neutral-100"
                        >
                          {g}
                        </Chip>
                      ))
                    ) : (
                      <span className="text-xs text-neutral-500">
                        No genres available
                      </span>
                    )}
                  </div>

                  {/* Overview */}
                  <ScrollShadow className="max-h-32 pr-2">
                    <p className="text-sm leading-relaxed text-neutral-200">
                      {selectedMovie.movie.overview?.trim() ??
                        "No description available for this movie."}
                    </p>
                  </ScrollShadow>

                  {/* Added by info */}
                  {selectedMovie.addedBy && (
                    <div className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/50 p-2.5">
                      {selectedMovie.addedBy.image && (
                        <Image
                          src={selectedMovie.addedBy.image}
                          alt={selectedMovie.addedBy.name ?? "User"}
                          className="h-7 w-7 rounded-full"
                          removeWrapper
                        />
                      )}
                      <div className="flex flex-col">
                        <span className="text-[10px] text-neutral-400">
                          Added by
                        </span>
                        <span className="text-xs font-medium">
                          {selectedMovie.addedBy.name}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer – actions */}
              <div className="flex flex-col gap-2 border-t border-neutral-800 pt-3">
                {/* Status Buttons Row */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="flat"
                    color="warning"
                    isDisabled={
                      updateStatus.isPending ||
                      selectedMovie.status === "PENDING"
                    }
                    onPress={() =>
                      handleStatusChange(selectedMovie.movieId, "PENDING")
                    }
                    className="flex-1"
                  >
                    <ClockIcon className="h-4 w-4" />
                    <span className="text-xs font-medium">Pending</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="solid"
                    color="primary"
                    isDisabled={
                      updateStatus.isPending ||
                      selectedMovie.status === "WATCHING"
                    }
                    onPress={() =>
                      handleStatusChange(selectedMovie.movieId, "WATCHING")
                    }
                    className="flex-1"
                  >
                    <PlayIcon className="h-4 w-4" />
                    <span className="text-xs font-medium">Watching</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="flat"
                    color="success"
                    isDisabled={
                      updateStatus.isPending ||
                      selectedMovie.status === "WATCHED"
                    }
                    onPress={() =>
                      handleStatusChange(selectedMovie.movieId, "WATCHED")
                    }
                    className="flex-1"
                  >
                    <CheckIcon className="h-4 w-4" />
                    <span className="text-xs font-medium">Watched</span>
                  </Button>
                </div>

                {/* Delete and Close Row */}
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="flat"
                    color="danger"
                    isLoading={removeMovie.isPending}
                    onPress={() => handleDelete(selectedMovie.movieId)}
                    className="flex-1"
                  >
                    <TrashIcon className="h-4 w-4" />
                    <span className="text-xs font-medium">Delete Movie</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    radius="full"
                    onPress={() => setIsModalOpen(false)}
                    className="text-neutral-300 hover:text-white"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </ModalContent>
        </Modal>
      )}
    </>
  );
}
