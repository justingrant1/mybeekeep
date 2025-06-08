import { supabase } from './supabase';
import { generateId } from './idGenerator';

const STORAGE_BUCKET = 'inspection-photos';

// Initialize the storage bucket if it doesn't exist
export const initializeStorage = async () => {
  try {
    // Check if the bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === STORAGE_BUCKET);
    
    if (!bucketExists) {
      // Create the bucket with public access
      const { error } = await supabase.storage.createBucket(STORAGE_BUCKET, {
        public: true, // Allow public access to the files
      });
      
      if (error) {
        throw error;
      }
      
      console.log(`Storage bucket '${STORAGE_BUCKET}' created successfully`);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error initializing storage:', error);
    return { success: false, error };
  }
};

// Upload a photo to the storage bucket
export const uploadInspectionPhoto = async (file: File, inspectionId: string): Promise<{ url: string | null; error: Error | null }> => {
  try {
    // Generate a unique filename with original extension
    const fileExt = file.name.split('.').pop();
    const fileName = `${generateId()}.${fileExt}`;
    const filePath = `${inspectionId}/${fileName}`;
    
    // Upload the file
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file);
    
    if (uploadError) {
      throw uploadError;
    }
    
    // Get the public URL
    const { data } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);
    
    return { url: data.publicUrl, error: null };
  } catch (error) {
    console.error('Error uploading photo:', error);
    return { url: null, error: error as Error };
  }
};

// Delete a photo from the storage bucket
export const deleteInspectionPhoto = async (photoUrl: string): Promise<{ success: boolean; error: Error | null }> => {
  try {
    // Extract the file path from the URL
    const storageUrl = supabase.storage.from(STORAGE_BUCKET).getPublicUrl('').data.publicUrl;
    const filePath = photoUrl.replace(storageUrl, '');
    
    // Delete the file
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);
    
    if (error) {
      throw error;
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting photo:', error);
    return { success: false, error: error as Error };
  }
};

// List all photos for an inspection
export const listInspectionPhotos = async (inspectionId: string): Promise<{ urls: string[]; error: Error | null }> => {
  try {
    // List all files in the inspection folder
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(inspectionId);
    
    if (error) {
      throw error;
    }
    
    // Get public URLs for all files
    const urls = data.map(file => {
      const filePath = `${inspectionId}/${file.name}`;
      return supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath).data.publicUrl;
    });
    
    return { urls, error: null };
  } catch (error) {
    console.error('Error listing photos:', error);
    return { urls: [], error: error as Error };
  }
};
