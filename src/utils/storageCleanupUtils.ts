
import { supabase } from "@/integrations/supabase/client";
import { checkStorageBucket } from "./databaseUtils";

export const cleanupPlaceholderBooks = async (): Promise<{ cleaned: number; errors: string[] }> => {
  const errors: string[] = [];
  let cleaned = 0;

  try {
    console.log('🧹 Starting cleanup of placeholder books...');

    // Step 1: Find books with placeholder file paths
    const { data: placeholderBooks, error: fetchError } = await supabase
      .from('ebooks')
      .select('*')
      .or('file_path.like.*placeholder*,file_path.like.*temp*,file_size.eq.0');

    if (fetchError) {
      console.error('❌ Error fetching placeholder books:', fetchError);
      errors.push(`Failed to fetch placeholder books: ${fetchError.message}`);
      return { cleaned, errors };
    }

    if (!placeholderBooks || placeholderBooks.length === 0) {
      console.log('✅ No placeholder books found to clean up');
      return { cleaned, errors };
    }

    console.log(`🎯 Found ${placeholderBooks.length} placeholder books to clean up`);

    // Step 2: Delete placeholder books from database
    for (const book of placeholderBooks) {
      try {
        console.log(`🗑️ Removing placeholder book: ${book.title}`);
        
        const { error: deleteError } = await supabase
          .from('ebooks')
          .delete()
          .eq('id', book.id);

        if (deleteError) {
          console.error(`❌ Failed to delete book ${book.title}:`, deleteError);
          errors.push(`Failed to delete ${book.title}: ${deleteError.message}`);
        } else {
          cleaned++;
          console.log(`✅ Deleted placeholder book: ${book.title}`);
        }
      } catch (error) {
        console.error(`❌ Error deleting book ${book.title}:`, error);
        errors.push(`Error deleting ${book.title}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Step 3: Clean up any orphaned placeholder files in storage
    try {
      const { files } = await checkStorageBucket();
      if (files) {
        const placeholderFiles = files.filter(file => 
          file.name.toLowerCase().includes('placeholder') ||
          file.name.toLowerCase().includes('temp') ||
          file.name.toLowerCase().includes('.tmp')
        );

        for (const file of placeholderFiles) {
          try {
            console.log(`🗑️ Removing placeholder file: ${file.name}`);
            const { error: removeError } = await supabase.storage
              .from('ebooks')
              .remove([file.name]);

            if (removeError) {
              console.error(`❌ Failed to remove file ${file.name}:`, removeError);
              errors.push(`Failed to remove file ${file.name}: ${removeError.message}`);
            } else {
              console.log(`✅ Removed placeholder file: ${file.name}`);
            }
          } catch (error) {
            console.error(`❌ Error removing file ${file.name}:`, error);
            errors.push(`Error removing file ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error cleaning up storage files:', error);
      errors.push(`Storage cleanup error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    console.log(`🧹 Cleanup completed. Cleaned: ${cleaned}, Errors: ${errors.length}`);
    return { cleaned, errors };

  } catch (error) {
    console.error('❌ Error in cleanup process:', error);
    errors.push(`Cleanup process error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { cleaned, errors };
  }
};

export const validateUploadedBooks = async (): Promise<{ valid: number; invalid: number; issues: string[] }> => {
  const issues: string[] = [];
  let valid = 0;
  let invalid = 0;

  try {
    console.log('🔍 Validating uploaded books...');

    // Get all active books
    const { data: books, error: fetchError } = await supabase
      .from('ebooks')
      .select('*')
      .eq('is_active', true);

    if (fetchError) {
      console.error('❌ Error fetching books:', fetchError);
      issues.push(`Failed to fetch books: ${fetchError.message}`);
      return { valid, invalid, issues };
    }

    if (!books || books.length === 0) {
      console.log('ℹ️ No books found to validate');
      return { valid, invalid, issues };
    }

    // Get storage files for validation
    const { files, error: storageError } = await checkStorageBucket();
    if (storageError || !files) {
      console.error('❌ Error accessing storage:', storageError);
      issues.push(`Failed to access storage: ${storageError}`);
      return { valid, invalid, issues };
    }

    // Validate each book
    for (const book of books) {
      try {
        console.log(`🔍 Validating book: ${book.title}`);
        
        // Check if file exists in storage
        const fileExists = files.some(file => file.name === book.file_path);
        
        if (!fileExists) {
          invalid++;
          issues.push(`Book "${book.title}" has missing file: ${book.file_path}`);
          console.log(`❌ Missing file for book: ${book.title}`);
        } else {
          valid++;
          console.log(`✅ Valid book: ${book.title}`);
        }
      } catch (error) {
        invalid++;
        const errorMsg = `Error validating book "${book.title}": ${error instanceof Error ? error.message : 'Unknown error'}`;
        issues.push(errorMsg);
        console.error('❌', errorMsg);
      }
    }

    console.log(`🔍 Validation completed. Valid: ${valid}, Invalid: ${invalid}`);
    return { valid, invalid, issues };

  } catch (error) {
    console.error('❌ Error in validation process:', error);
    issues.push(`Validation process error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { valid, invalid, issues };
  }
};
