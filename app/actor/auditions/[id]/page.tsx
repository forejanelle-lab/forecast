import { getAuditionById } from "@/lib/data/projects";
import { AuditionRequestPageContent } from "./audition-request-content";
import { notFound } from "next/navigation";

export default async function AuditionRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const audition = await getAuditionById(id);

  if (!audition) notFound();

  return <AuditionRequestPageContent audition={audition} />;
}
