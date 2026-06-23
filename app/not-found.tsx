import { NotFoundContent } from "@/components/errors/not-found-content";

export default function NotFound() {
  return (
    <NotFoundContent
      description="This page doesn't exist. Check the URL or return to the home page."
      primaryHref="/"
      primaryLabel="Home"
    />
  );
}
