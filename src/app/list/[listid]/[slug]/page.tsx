import { api } from "~/trpc/server";
import MovieList from "../../../_components/movielist";
import SearchOverlay from "~/app/_components/searchOverlay";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; listid: string }>;
}) {
  const { listid } = await params;
  const initialMoviesData = await api.movies.getAll({ listId: listid });
  return (
    <>
      <SearchOverlay listId={listid} />
      <MovieList initialMoviesData={initialMoviesData} listId={listid} />
    </>
  );
}
