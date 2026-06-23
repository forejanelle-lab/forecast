import { searchActors } from "@/lib/data/actors";
import { CastingSearchActorsContent } from "@/components/casting/casting-search-actors-content";

export default async function CastingSearchPage() {
  const actors = await searchActors();

  return <CastingSearchActorsContent actors={actors} />;
}
