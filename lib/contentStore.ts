/**
 * Persistence for all editor-managed portal content (podcast, resources,
 * tools, AI coach). Defaults come from config/portal.ts; edits are saved to
 * data/content.json. Swap file I/O for KV/Postgres at deploy time.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  podcast as podcastDefaults,
  coach as coachDefaults,
  resources as resourceDefaults,
  tools as toolDefaults,
  type ResourceItem,
  type ToolItem,
} from "@/config/portal";

export interface Episode {
  id: string;
  title: string;
}
export interface PodcastContent {
  title: string;
  description: string;
  episodes: Episode[];
  channelUrl: string;
  live: {
    podcastUrl: string;
    zoomUrl: string;
    zoomLabel: string;
    mode?: "off" | "youtube" | "zoom";
    liveUrl?: string;
    scheduleLabel?: string;
  };
}
export interface CoachContent {
  title: string;
  description: string;
  embedUrl: string;
  passUserEmail: boolean;
}
export interface PortalContent {
  podcast: PodcastContent;
  coach: CoachContent;
  resources: ResourceItem[];
  tools: ToolItem[];
}

const FILE = path.join(process.cwd(), "data", "content.json");

const defaults: PortalContent = {
  podcast: podcastDefaults,
  coach: coachDefaults,
  resources: resourceDefaults,
  tools: toolDefaults,
};

export async function readContent(): Promise<PortalContent> {
  try {
    const parsed = JSON.parse(await fs.readFile(FILE, "utf8")) as Partial<PortalContent>;
    return {
      podcast: parsed.podcast ?? defaults.podcast,
      coach: parsed.coach ?? defaults.coach,
      resources: parsed.resources ?? defaults.resources,
      tools: parsed.tools ?? defaults.tools,
    };
  } catch {
    return defaults;
  }
}

export async function writeContent(content: PortalContent): Promise<void> {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(content, null, 2), "utf8");
}
