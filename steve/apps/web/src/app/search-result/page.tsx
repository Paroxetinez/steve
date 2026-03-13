import { Suspense } from "react";
import SearchResultClient from "@/components/search/SearchResultClient";

export default function SearchResultPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <SearchResultClient />
    </Suspense>
  );
}
