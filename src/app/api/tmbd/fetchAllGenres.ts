import type { SearchGenreResponse } from "~/types/general";

export const fetchAllGenres = async (): Promise<SearchGenreResponse | null> => {
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: "Bearer " + process.env.NEXT_PUBLIC_BEARER_HEADER,
    },
  };

  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/genre/movie/list`,
      options,
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return (await response.json()) as SearchGenreResponse;
  } catch (error) {
    console.error("Failed to fetch genres:", error);
    return null;
  }
};
