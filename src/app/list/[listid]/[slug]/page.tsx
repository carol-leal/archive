"use client";

import TabsComponent from "~/app/_components/tabs";
import MovieList from "../../../_components/movielist";
import SearchOverlay from "~/app/_components/searchOverlay";

export default function Page() {
  return (
    <>
      <SearchOverlay />
      <TabsComponent />
      <MovieList />
    </>
  );
}
