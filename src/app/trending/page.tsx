"use client";

import CollectionPage from "../collections/[id]/page";

export default function TrendingPage() {
  // Use a fake params promise for the CollectionPage component
  const params = Promise.resolve({ id: "trending" });
  return <CollectionPage params={params} />;
}
