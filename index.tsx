// src/routes/index.tsx
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CineBook — Online Movie Ticket Booking" },
      {
        name: "description",
        content:
          "Browse movies, pick a theatre and show time, choose your seats and get an instant digital ticket with CineBook.",
      },
      { property: "og:title", content: "CineBook — Online Movie Ticket Booking" },
      {
        property: "og:description",
        content:
          "Browse movies, pick a theatre and show time, choose your seats and get an instant digital ticket.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ href: "/cinebook/index.html" });
  },
  component: () => null,
});
