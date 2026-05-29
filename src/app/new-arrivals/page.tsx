"use client";

import CollectionPage from "../collections/[id]/page";

export default function NewArrivalsPage() {
  const params = Promise.resolve({ id: "new-arrivals" });
  return <CollectionPage params={params} />;
}
