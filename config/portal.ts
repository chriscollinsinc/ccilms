/**
 * PORTAL CONTENT CONFIG — edit this file to update pages without touching code.
 * (Later this becomes editable from an admin console.)
 */

export interface FeaturedCourse {
  courseId: string; // TalentLMS course id
  tagline?: string; // short hook shown in the hero / expanded card
  previewVideo?: string; // direct MP4/WebM URL or YouTube link — plays muted
  previewDuration?: number; // seconds the hero plays before advancing (blank = to the end, max 120s)
  image?: string; // optional override; defaults to the TalentLMS course thumbnail
}

export const home = {
  // Courses to spotlight, in order. First one is the big hero.
  // If empty, the page features the first courses from your catalog.
  featured: [
    {
      courseId: "126",
      tagline: "EDIT ME — one-line hook for this course",
      previewVideo: "", // EDIT ME — e.g. "https://yourcdn.com/previews/course-126.mp4"
    },
  ] as FeaturedCourse[],
};

export const podcast = {
  title: "Service Drive Revolution",
  description: "The #1 automotive service podcast. Catch up on past episodes or join us live.",
  // YouTube video IDs of past episodes (the part after v= in the URL). EDIT ME.
  episodes: [
    { id: "dQw4w9WgXcQ", title: "EDIT ME — Episode title 1" },
    { id: "dQw4w9WgXcQ", title: "EDIT ME — Episode title 2" },
    { id: "dQw4w9WgXcQ", title: "EDIT ME — Episode title 3" },
  ],
  // Full channel / playlist link
  channelUrl: "https://www.youtube.com/@ChrisCollinsInc", // EDIT ME
  live: {
    // Public live podcast stream
    podcastUrl: "https://www.youtube.com/@ChrisCollinsInc/live", // EDIT ME
    // Premium: private lesson with the CEO over Zoom
    zoomUrl: "https://zoom.us/j/XXXXXXXXX", // EDIT ME
    zoomLabel: "Private Lesson with Chris — Live on Zoom",
    // "We're live" switch (managed in the Admin Console)
    mode: "off" as "off" | "youtube" | "zoom",
    liveUrl: "", // YouTube watch URL of the live stream, or Zoom join link
    scheduleLabel: "Every Wednesday · 10:00 AM PST",
  },
};

export const coach = {
  title: "Ask Chris (AI)",
  description: "Chat with the AI trained on Chris's books and podcasts.",
  // Delphi "Digital Chris" iframe embed (from Delphi studio -> Integrations -> Website).
  // ?theme=dark matches the portal's black theme (verified working param).
  embedUrl: "https://www.delphi.ai/embed/41147235-e1c6-4f41-ba16-9da46a76ba3e?theme=dark",
  // History: Delphi's "Require User Email" toggle (ON in your embed settings)
  // handles identity — members sign in with email inside the chat once, and
  // their conversation history sticks to that email.
  passUserEmail: false,
};

export interface ResourceItem {
  title: string;
  description: string;
  href: string; // link to a PDF in /public/resources/, Google Drive, etc.
}

export const resources: ResourceItem[] = [
  {
    title: "EDIT ME — Service Advisor Scripts",
    description: "Word-for-word scripts for the service lane.",
    href: "#",
  },
  {
    title: "EDIT ME — Manager's Daily Checklist",
    description: "The daily operating rhythm for service managers.",
    href: "#",
  },
];

export interface ToolItem {
  title: string;
  description: string;
  href: string; // route of a custom app, e.g. "/tools/labor-rate-calculator"
  ready: boolean;
}

export const tools: ToolItem[] = [
  {
    title: "Labor Rate Calculator",
    description: "Find your effective labor rate and where you're leaving money.",
    href: "/tools/labor-rate-calculator",
    ready: false,
  },
  {
    title: "Tech Efficiency Tracker",
    description: "Spot your shop's real capacity at a glance.",
    href: "/tools/tech-efficiency",
    ready: false,
  },
];
