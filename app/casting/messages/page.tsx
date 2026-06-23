import { auth } from "@/auth";
import MessagesContent from "@/components/pages/messages-content";
import { redirect } from "next/navigation";

export default async function CastingMessagesPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  return <MessagesContent />;
}
