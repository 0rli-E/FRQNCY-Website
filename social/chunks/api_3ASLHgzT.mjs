import { s as supabase } from './SocialLayout_BQoA4DU3.mjs';

let projectCache = null;
async function fetchAllProjects() {
  if (projectCache) return projectCache;
  try {
    const res = await fetch("/api/crypto/projects");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    projectCache = data.projects ?? [];
    return projectCache;
  } catch (err) {
    console.error("Failed to fetch crypto projects:", err);
    return [];
  }
}
async function searchAll(query) {
  const q = query.trim();
  if (!q) return {
    posts: [],
    profiles: [],
    projects: []
  };
  const likeQ = `%${q}%`;
  const [postsRes, profilesRes, projectsRes] = await Promise.all([supabase.from("posts").select("*, author:profiles!posts_author_id_fkey(*)").or(`content.ilike.${likeQ},project_tag.ilike.${likeQ}`).order("created_at", {
    ascending: false
  }).limit(30), supabase.from("profiles").select("*").or(`username.ilike.${likeQ},display_name.ilike.${likeQ}`).limit(20), searchProjects(q)]);
  return {
    posts: postsRes.data ?? [],
    profiles: profilesRes.data ?? [],
    projects: projectsRes
  };
}
async function getUserBookmarks(userId, limit = 20, offset = 0) {
  const {
    data,
    error
  } = await supabase.from("bookmarks").select("post_id, created_at, post:posts!bookmarks_post_id_fkey(*, author:profiles!posts_author_id_fkey(*))").eq("user_id", userId).order("created_at", {
    ascending: false
  }).range(offset, offset + limit - 1);
  if (error) {
    console.error("getUserBookmarks error:", error.message);
    return [];
  }
  return (data ?? []).map((r) => r.post).filter(Boolean);
}
async function searchProjects(query) {
  const projects = await fetchAllProjects();
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return projects.filter((p) => p.name.toLowerCase().includes(q) || p.symbol.toLowerCase().includes(q)).slice(0, 20);
}

export { getUserBookmarks as g, searchAll as s };
