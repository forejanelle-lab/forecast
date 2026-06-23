import { NotFoundContent } from "@/components/errors/not-found-content";

export default function ProjectNotFound() {
  return (
    <NotFoundContent
      title="Project not found"
      description="This project may have been deleted or the link is outdated. Open your projects list or create a new one."
      primaryHref="/projects"
      primaryLabel="All projects"
      secondaryHref="/projects/new"
      secondaryLabel="New project"
    />
  );
}
