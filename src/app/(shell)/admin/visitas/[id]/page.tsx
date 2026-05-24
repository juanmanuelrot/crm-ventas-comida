import { redirect } from "next/navigation";
import VisitDetailPage from "@/app/(shell)/visits/[id]/page";

export default async function AdminVisitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  void redirect;
  return <VisitDetailPage params={params} />;
}
