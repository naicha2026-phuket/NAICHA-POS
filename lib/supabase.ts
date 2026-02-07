import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * IMPORTANT: Supabase Storage Setup Required
 * 
 * To fix "row-level security policy" error:
 * 
 * 1. Go to Supabase Dashboard > Storage > Policies
 * 2. Select the "menu-images" bucket
 * 3. Click "New Policy" or disable RLS:
 * 
 * Option A - Allow All Access (Simple, for development):
 * - Click "New Policy" 
 * - Select "Allow all operations" template
 * - This creates policies for INSERT, SELECT, UPDATE, DELETE
 * 
 * Option B - Custom Policy (Recommended for production):
 * - Policy Name: "Allow public uploads"
 * - Policy Definition: 
 *   INSERT: true
 *   SELECT: true
 * - Click "Review" then "Save policy"
 * 
 * Or simply disable RLS on the bucket:
 * - Go to Configuration tab
 * - Toggle "Enable RLS" to OFF
 */

// Upload image to Supabase storage
export const uploadImage = async (
  file: File,
  bucket: string = "menu-images",
): Promise<string | null> => {
  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Error uploading image:", error);
      return null;
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error("Error in uploadImage:", error);
    return null;
  }
};

// Delete image from Supabase storage
export const deleteImage = async (
  imageUrl: string,
  bucket: string = "menu-images",
): Promise<boolean> => {
  try {
    // Extract file path from URL
    const urlParts = imageUrl.split(`/${bucket}/`);
    if (urlParts.length < 2) return false;

    const filePath = urlParts[1];

    const { error } = await supabase.storage.from(bucket).remove([filePath]);

    if (error) {
      console.error("Error deleting image:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in deleteImage:", error);
    return false;
  }
};
