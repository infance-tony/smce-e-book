
-- Standardize file paths in the ebooks table by removing the 'books/' prefix
-- This ensures all paths are consistent with the current storage structure
UPDATE ebooks 
SET file_path = REPLACE(file_path, 'books/', '') 
WHERE file_path LIKE 'books/%';

-- Add some helpful logging to see what was updated
-- (This is just a comment for reference - the actual logging will be in the application)
