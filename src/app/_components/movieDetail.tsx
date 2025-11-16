"use client";

import {
  Modal,
  ModalContent,
  Button,
  Image,
  Chip,
  ScrollShadow,
} from "@heroui/react";
import {
  XIcon,
  ClockIcon,
  PlayIcon,
  CheckIcon,
  StarIcon,
} from "@phosphor-icons/react";

import type { Movie } from "~/types/general";

export type ListStatus = "PENDING" | "WATCHING" | "WATCHED";
type GenreMap = Record<number, string>;

interface MovieDetailsModalProps {
  movie: Movie | null;
  isOpen: boolean;
  onClose: () => void;

  /** Map TMDB genre ids -> names, e.g. { 28: "Action" } */
  genreMap: GenreMap;

  /** For wiring your TRPC mutation state */
  isLoading?: boolean;
  addedStatus?: ListStatus | null;

  /** Single callback to handle list status changes */
  onChangeStatus?: (status: ListStatus, movie: Movie) => void;
}

// Helper: get year from TMDB release_date (YYYY-MM-DD or YYYY)
function getYear(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  if (dateStr.length >= 4) return dateStr.slice(0, 4);
  return null;
}

// Helper: pretty label combining year + full date when available
function formatReleaseDate(dateStr?: string | null): string | null {
  if (!dateStr) return null;

  const year = getYear(dateStr);

  // If we only have the year, just return that
  if (dateStr.length === 4 || !dateStr.includes("-")) {
    return year;
  }

  // TMDB format is usually YYYY-MM-DD
  const [y, m, d] = dateStr.split("-");
  if (!y || !m || !d) return year ?? dateStr;

  const date = new Date(Number(y), Number(m) - 1, Number(d));
  // Use a simple, locale-friendly format
  const formatted = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return year ? `${year} • ${formatted}` : formatted;
}

// Helper: handle both raw TMDB paths and already-prefixed URLs
function resolvePosterUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `https://image.tmdb.org/t/p/w500${path}`;
}

export function MovieDetailsModal({
  movie,
  isOpen,
  onClose,
  genreMap,
  isLoading = false,
  addedStatus = null,
  onChangeStatus,
}: MovieDetailsModalProps) {
  if (!movie) return null;

  const year = getYear(movie.release_date);
  const releaseDateLabel = formatReleaseDate(movie.release_date);
  const posterUrl = resolvePosterUrl(movie.poster_path);

  const voteAverage =
    typeof movie.vote_average === "number" ? movie.vote_average : null;

  const genres: string[] =
    movie.genre_ids?.map((id) => genreMap[id] ?? "Unknown") ?? [];

  const handleStatusClick = (status: ListStatus) => {
    console.log(
      "Button clicked:",
      status,
      "isLoading:",
      isLoading,
      "onChangeStatus:",
      !!onChangeStatus,
    );
    if (isLoading) {
      console.log("Skipping - already loading");
      return;
    }
    if (!onChangeStatus) {
      console.error("onChangeStatus callback is not defined!");
      return;
    }
    console.log("Calling onChangeStatus with:", status, movie.title);
    onChangeStatus(status, movie);
  };

  const statusLabel =
    addedStatus === "PENDING"
      ? "Added to Pending"
      : addedStatus === "WATCHING"
        ? "Added to Watching"
        : addedStatus === "WATCHED"
          ? "Added to Watched"
          : null;

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      placement="center"
      backdrop="blur"
      size="2xl"
      hideCloseButton
      classNames={{
        backdrop: "bg-black/70",
        base:
          "bg-neutral-950 text-white border border-neutral-800 " +
          "rounded-3xl shadow-2xl",
      }}
    >
      <ModalContent>
        <div className="flex flex-col gap-6 p-4 sm:p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl leading-tight font-semibold md:text-2xl">
                {movie.title}
              </h2>

              <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 md:text-sm">
                {year && <span>{year}</span>}

                {releaseDateLabel && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-neutral-500" />
                    <span>{releaseDateLabel}</span>
                  </>
                )}

                {voteAverage != null && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-neutral-500" />
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-flex items-center gap-1 rounded-full bg-neutral-900 px-2 py-1 text-xs font-medium">
                        <StarIcon
                          className="text-warning h-3 w-3"
                          weight="fill"
                        />
                        {voteAverage.toFixed(1)}
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        TMDB score
                      </span>
                    </span>
                  </>
                )}
              </div>
            </div>

            <Button
              isIconOnly
              variant="light"
              radius="full"
              onPress={onClose}
              className="text-neutral-400 hover:text-white"
            >
              <XIcon className="h-5 w-5" />
            </Button>
          </div>

          {/* Content: poster + details */}
          <div className="flex flex-col gap-5 md:flex-row">
            {/* Poster column */}
            <div className="relative w-full flex-shrink-0 md:w-[220px]">
              <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
                <Image
                  alt={movie.title}
                  src={
                    posterUrl ?? "https://placehold.co/500x750?text=No+Poster"
                  }
                  className="aspect-[2/3] w-full object-cover"
                  removeWrapper
                />
              </div>

              {/* Success overlay (like your old card) */}
              {statusLabel && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-black/70 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-2">
                    <span className="bg-success/20 text-success inline-flex h-10 w-10 items-center justify-center rounded-full">
                      <CheckIcon className="h-5 w-5" weight="bold" />
                    </span>
                    <p className="text-sm font-medium text-white">
                      {statusLabel}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Text column */}
            <div className="flex flex-1 flex-col gap-4">
              {/* Genres */}
              <div className="flex flex-wrap gap-2">
                {genres.length > 0 ? (
                  genres.slice(0, 6).map((g) => (
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

              {/* Overview (scroll if long) */}
              <ScrollShadow className="max-h-48 pr-2">
                <p className="text-sm leading-relaxed text-neutral-200">
                  {movie.overview?.trim() ||
                    "No description available for this movie."}
                </p>
              </ScrollShadow>
            </div>
          </div>

          {/* Footer – actions */}
          <div className="flex flex-col gap-3 border-t border-neutral-800 pt-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="flat"
                color="warning"
                isDisabled={isLoading}
                onPress={() => handleStatusClick("PENDING")}
                className="min-w-[120px]"
              >
                <ClockIcon className="h-4 w-4" />
                <span className="text-xs font-medium">Add to pending</span>
              </Button>

              <Button
                size="sm"
                variant="solid"
                color="primary"
                isDisabled={isLoading}
                onPress={() => handleStatusClick("WATCHING")}
                className="min-w-[120px]"
              >
                <PlayIcon className="h-4 w-4" />
                <span className="text-xs font-medium">Add to watching</span>
              </Button>

              <Button
                size="sm"
                variant="flat"
                color="success"
                isDisabled={isLoading}
                onPress={() => handleStatusClick("WATCHED")}
                className="min-w-[120px]"
              >
                <CheckIcon className="h-4 w-4" />
                <span className="text-xs font-medium">Add to watched</span>
              </Button>
            </div>

            <div className="flex items-center gap-3 text-xs text-neutral-400">
              {isLoading && <span>Updating list…</span>}
              {!isLoading && statusLabel && (
                <span className="text-success">{statusLabel}</span>
              )}
              <Button
                size="sm"
                variant="ghost"
                radius="full"
                onPress={onClose}
                className="text-neutral-300 hover:text-white"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
