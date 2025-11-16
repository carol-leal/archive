"use client";

import React from "react";
import { Card, Image, Chip, CardBody, CardFooter, Button } from "@heroui/react";
import {
  StarIcon,
  ClockIcon,
  PlayIcon,
  CheckIcon,
  TrashIcon,
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
import type { Movie } from "~/types/general";
import { MovieDetailsModal } from "./movieDetail";
import type { ListStatus } from "./movieDetail";

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

// Helper: Convert MovieWithExtras to Movie format for modal
function convertToMovie(movieWithExtras: MovieWithExtras): Movie {
  return {
    id: movieWithExtras.movie.tmdbId,
    title: movieWithExtras.movie.title,
    overview: movieWithExtras.movie.overview ?? "",
    release_date:
      movieWithExtras.movie.releaseDate?.toISOString().split("T")[0] ?? "",
    poster_path: movieWithExtras.movie.posterPath ?? null,
    vote_average: 0, // We don't have TMDB vote average stored
    genre_ids: [], // We'll need to map genre names back to IDs if needed
  };
}

type MovieStatus = "PENDING" | "WATCHING" | "WATCHED";

export default function MovieList({
  initialMoviesData,
  listId,
}: {
  initialMoviesData: MovieWithExtras[];
  listId: string;
}) {
  const [selectedTab, setSelectedTab] = React.useState<string>("all");
  const [selectedMovie, setSelectedMovie] =
    React.useState<MovieWithExtras | null>(null);
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [addedStatus, setAddedStatus] = React.useState<ListStatus | null>(null);

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
      setAddedStatus(null);
    },
  });

  const removeMovie = api.movies.removeFromList.useMutation({
    onSuccess: async () => {
      await utils.movies.getAll.invalidate({ listId });
    },
  });

  const addToList = api.movies.addToList.useMutation({
    onSuccess: async (_data, variables) => {
      setAddedStatus(variables.status as ListStatus);
      await utils.movies.getAll.invalidate({ listId });

      setTimeout(() => {
        setAddedStatus(null);
      }, 2000);
    },
    onError: () => {
      setAddedStatus(null);
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

  // Filter movies based on selected tab
  const filteredMovies = React.useMemo(() => {
    switch (selectedTab) {
      case "pending":
        return pendingMovies || [];
      case "watching":
        return watchingMovies || [];
      case "watched":
        return watchedMovies || [];
      default:
        return movies;
    }
  }, [selectedTab, movies, pendingMovies, watchingMovies, watchedMovies]);

  const handleStatusChange = (movieId: string, status: MovieStatus) => {
    updateStatus.mutate({ listId, movieId, status });
  };

  const handleDelete = (movieId: string) => {
    removeMovie.mutate({ listId, movieId });
  };

  const openMovieDetail = (movie: MovieWithExtras) => {
    setSelectedMovie(movie);
    setDetailsOpen(true);
    setAddedStatus(movie.status as ListStatus);
  };

  const handleChangeStatus = (status: ListStatus, movie: Movie) => {
    if (!selectedMovie) return;

    // Create a genre map from the stored genre names
    const genreMap: Record<number, string> = {};
    selectedMovie.movie.genres?.forEach((genreName, index) => {
      genreMap[index] = genreName;
    });

    addToList.mutate({
      listId,
      movieId: selectedMovie.movieId,
      title: movie.title,
      tmdbId: movie.id,
      genres: selectedMovie.movie.genres ?? [],
      posterPath: movie.poster_path ?? undefined,
      releaseDate: movie.release_date ?? undefined,
      overview: movie.overview ?? undefined,
      status,
    });
  };

  return (
    <>
      {movies.length > 0 ? (
        <div className="m-4 flex w-full flex-col items-center justify-center">
          <Tabs
            aria-label="Options"
            color="primary"
            variant="bordered"
            selectedKey={selectedTab}
            onSelectionChange={(key) => setSelectedTab(key as string)}
          >
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
      <div className="mt-4 grid w-full max-w-7xl grid-cols-2 gap-3 px-4 md:hidden">
        {filteredMovies?.map((movie) => {
          const statusColor = getStatusColor(movie.status);
          const statusLabel = getStatusLabel(movie.status);

          return (
            <Card
              key={movie.id}
              isPressable
              onPress={() => openMovieDetail(movie)}
              className="cursor-pointer overflow-hidden border border-neutral-800 bg-neutral-950"
              radius="lg"
              shadow="sm"
            >
              {/* Poster Section */}
              <div className="relative h-56 w-full">
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

                {/* Rating badge */}
                {movie.rating && (
                  <div className="absolute top-2 left-2 z-10">
                    <div className="flex items-center gap-1 rounded-full bg-black/80 px-2 py-1 shadow-lg backdrop-blur-sm">
                      <StarIcon
                        className="text-warning h-3 w-3"
                        weight="fill"
                      />
                      <span className="text-[10px] font-medium text-white">
                        {(movie.rating / 10).toFixed(1)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Status badge */}
                <div className="absolute top-2 right-2 z-10">
                  <Chip
                    size="sm"
                    color={statusColor}
                    className="text-[10px] font-medium shadow-lg"
                  >
                    {statusLabel}
                  </Chip>
                </div>
              </div>

              {/* Content Section */}
              <CardBody className="flex flex-col gap-2 p-3">
                {/* Title */}
                <h3 className="line-clamp-2 text-sm leading-tight font-semibold">
                  {movie.movie.title}
                </h3>

                {/* Genres */}
                {movie.movie.genres && movie.movie.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {movie.movie.genres.slice(0, 2).map((genre) => (
                      <Chip
                        key={genre}
                        size="sm"
                        variant="flat"
                        radius="full"
                        className="border border-neutral-700 bg-neutral-900 text-[9px] text-neutral-300"
                      >
                        {genre}
                      </Chip>
                    ))}
                  </div>
                )}

                {/* Added by info */}
                {movie.addedBy && (
                  <div className="flex items-center gap-1.5 rounded-md border border-neutral-800 bg-neutral-900/50 p-1.5">
                    {movie.addedBy.image && (
                      <Image
                        src={movie.addedBy.image}
                        alt={movie.addedBy.name ?? "User"}
                        className="h-4 w-4 rounded-full"
                        removeWrapper
                      />
                    )}
                    <div className="flex min-w-0 flex-col">
                      <span className="text-[9px] text-neutral-400">
                        Added by
                      </span>
                      <span className="truncate text-[10px] font-medium">
                        {movie.addedBy.name}
                      </span>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Desktop: Full Cards */}
      <div className="mt-4 hidden w-full max-w-7xl grid-cols-1 gap-4 px-4 md:grid lg:grid-cols-2 xl:grid-cols-3">
        {filteredMovies?.map((movie) => {
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

                {/* Status badge */}
                <div className="absolute top-2 right-2 z-10">
                  <Chip
                    size="sm"
                    color={statusColor}
                    className="font-medium shadow-lg"
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

      {/* Movie Details Modal */}
      {selectedMovie && (
        <MovieDetailsModal
          movie={convertToMovie(selectedMovie)}
          isOpen={detailsOpen}
          onClose={() => {
            setDetailsOpen(false);
            setSelectedMovie(null);
            setAddedStatus(null);
          }}
          genreMap={{}}
          isLoading={addToList.isPending || updateStatus.isPending}
          addedStatus={addedStatus}
          onChangeStatus={handleChangeStatus}
          addedBy={selectedMovie.addedBy}
        />
      )}
    </>
  );
}
