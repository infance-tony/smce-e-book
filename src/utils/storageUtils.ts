
import { supabase } from "@/integrations/supabase/client";
import { checkStorageBucket } from "./databaseUtils";

export interface StorageAuditResult {
  databaseFiles: Array<{
    id: string;
    title: string;
    file_path: string;
    subject_id: string;
  }>;
  storageFiles: Array<{
    name: string;
    id: string;
    metadata: any;
  }>;
  mismatches: Array<{
    bookId: string;
    title: string;
    databasePath: string;
    suggestedPath?: string;
    exists: boolean;
  }>;
  summary: {
    totalBooks: number;
    accessibleFiles: number;
    missingFiles: number;
    pathMismatches: number;
  };
}

export const auditStorageAlignment = async (): Promise<StorageAuditResult> => {
  console.log('🔍 Starting storage audit...');
  
  try {
    // Get all ebooks from database
    const { data: dbBooks, error: dbError } = await supabase
      .from('ebooks')
      .select('id, title, file_path, subject_id')
      .eq('is_active', true);
    
    if (dbError) {
      throw new Error(`Database query failed: ${dbError.message}`);
    }
    
    // Get all files from storage
    const { files: storageFiles, error: storageError } = await checkStorageBucket();
    
    if (storageError) {
      throw new Error(`Storage check failed: ${storageError}`);
    }
    
    console.log(`📊 Found ${dbBooks?.length || 0} books in database`);
    console.log(`📊 Found ${storageFiles?.length || 0} files in storage`);
    
    const mismatches: StorageAuditResult['mismatches'] = [];
    let accessibleCount = 0;
    let missingCount = 0;
    let pathMismatchCount = 0;
    
    // Check each database book against storage
    for (const book of dbBooks || []) {
      const exactMatch = storageFiles?.find(file => file.name === book.file_path);
      
      if (exactMatch) {
        accessibleCount++;
        console.log(`✅ ${book.title}: Exact match found`);
        continue;
      }
      
      // Try alternative paths
      const alternatives = [
        book.file_path.startsWith('books/') ? book.file_path.substring(6) : `books/${book.file_path}`,
        book.file_path.replace(/^books\//, ''),
        `books/${book.file_path.replace(/^books\//, '')}`
      ];
      
      let foundAlternative = false;
      let suggestedPath: string | undefined;
      
      for (const altPath of alternatives) {
        const altMatch = storageFiles?.find(file => file.name === altPath);
        if (altMatch) {
          suggestedPath = altPath;
          foundAlternative = true;
          pathMismatchCount++;
          console.log(`⚠️ ${book.title}: Found at alternative path: ${altPath}`);
          break;
        }
      }
      
      if (!foundAlternative) {
        missingCount++;
        console.log(`❌ ${book.title}: File not found in storage`);
      }
      
      mismatches.push({
        bookId: book.id,
        title: book.title,
        databasePath: book.file_path,
        suggestedPath,
        exists: foundAlternative
      });
    }
    
    const result: StorageAuditResult = {
      databaseFiles: dbBooks || [],
      storageFiles: storageFiles || [],
      mismatches,
      summary: {
        totalBooks: dbBooks?.length || 0,
        accessibleFiles: accessibleCount,
        missingFiles: missingCount,
        pathMismatches: pathMismatchCount
      }
    };
    
    console.log('📊 Audit Summary:', result.summary);
    
    return result;
    
  } catch (error) {
    console.error('❌ Storage audit failed:', error);
    throw error;
  }
};

export const fixPathMismatches = async (mismatches: StorageAuditResult['mismatches']) => {
  console.log('🔧 Starting to fix path mismatches...');
  
  const results = {
    fixed: 0,
    failed: 0,
    errors: [] as string[]
  };
  
  for (const mismatch of mismatches) {
    if (!mismatch.exists || !mismatch.suggestedPath) {
      console.log(`⏭️ Skipping ${mismatch.title}: No suggested path`);
      continue;
    }
    
    try {
      console.log(`🔧 Fixing ${mismatch.title}: ${mismatch.databasePath} → ${mismatch.suggestedPath}`);
      
      const { error } = await supabase
        .from('ebooks')
        .update({ file_path: mismatch.suggestedPath })
        .eq('id', mismatch.bookId);
      
      if (error) {
        throw error;
      }
      
      results.fixed++;
      console.log(`✅ Fixed path for ${mismatch.title}`);
      
    } catch (error) {
      results.failed++;
      const errorMsg = `Failed to fix ${mismatch.title}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      results.errors.push(errorMsg);
      console.error(`❌ ${errorMsg}`);
    }
  }
  
  console.log('🔧 Path fixing completed:', results);
  return results;
};
