import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chris Collins Inc — Training Academy",
  description:
    "The training platform for service departments that want to dominate. Courses, coaching, and tools from Chris Collins Inc.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
