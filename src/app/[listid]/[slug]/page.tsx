import TabsComponent from "~/app/_components/tabs";
import MovieList from "../../_components/movielist";
export default async function Page() {
  return (
    <>
      <TabsComponent />
      <MovieList />
    </>
  );
}
