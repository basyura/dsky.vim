import { Denops } from "./../deps.ts";
import { Post } from "./../types.ts";
import * as path from "./path.ts";

// モジュールレベル変数
let cachedHandles: Set<string> = new Set();
let initialized: boolean = false;

export function extractHandles(posts: Array<Post>): string[] {
  const handles = new Set<string>();
  for (const post of posts) {
    handles.add(post.handle);
  }
  return Array.from(handles);
}

async function initializeCache(ds: Denops): Promise<void> {
  if (initialized) {
    return;
  }

  try {
    const filePath = await path.getConfigFile(ds, "handles.txt");
    if (await path.isExists(filePath)) {
      const content = await Deno.readTextFile(filePath);
      const lines = content.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed !== "") {
          cachedHandles.add(trimmed);
        }
      }
    }
  } catch (e) {
    console.error("Failed to initialize handle cache:", e);
  }

  initialized = true;
}

export async function saveHandles(ds: Denops, newHandles: string[]): Promise<void> {
  await initializeCache(ds);

  try {
    const filePath = await path.getConfigFile(ds, "handles.txt");
    for (const handle of newHandles) {
      if (!cachedHandles.has(handle)) {
        cachedHandles.add(handle);
        await Deno.writeTextFile(filePath, handle + "\n", { append: true });
      }
    }
  } catch (e) {
    console.error("Failed to save handles:", e);
  }
}

export async function loadHandles(ds: Denops): Promise<string[]> {
  await initializeCache(ds);
  return Array.from(cachedHandles);
}
