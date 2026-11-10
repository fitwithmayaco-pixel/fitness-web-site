import { createClient } from "@supabase/supabase-js";

// Read Supabase config from Vite environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = () => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    supabaseUrl !== "your_supabase_project_url" &&
    supabaseAnonKey !== "your_supabase_anon_key" &&
    !supabaseUrl.includes("placeholder")
  );
};

// Create the Supabase client if configured, otherwise null
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/**
 * Upload a File, Blob, or ArrayBuffer to a Supabase Storage bucket
 */
export async function uploadToStorage(bucket, path, fileOrBlob, contentType = "application/octet-stream") {
  if (!supabase) throw new Error("Supabase is not configured");

  const { error } = await supabase.storage.from(bucket).upload(path, fileOrBlob, {
    cacheControl: "3600",
    upsert: true,
    contentType,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Remove a file from Supabase Storage
 */
export async function deleteFromStorage(bucket, paths) {
  if (!supabase) return;
  const pathList = Array.isArray(paths) ? paths : [paths];
  await supabase.storage.from(bucket).remove(pathList);
}
