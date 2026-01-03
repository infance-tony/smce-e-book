
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle, RefreshCw, Wrench, Trash2, Shield } from "lucide-react";
import { auditStorageAlignment, fixPathMismatches, type StorageAuditResult } from "@/utils/storageUtils";
import { cleanupPlaceholderBooks, validateUploadedBooks } from "@/utils/storageCleanupUtils";

const StorageDiagnostic = () => {
  const { toast } = useToast();
  const [auditResult, setAuditResult] = useState<StorageAuditResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [validating, setValidating] = useState(false);

  const runAudit = async () => {
    setLoading(true);
    try {
      console.log('🔍 Running storage audit...');
      const result = await auditStorageAlignment();
      setAuditResult(result);
      
      toast({
        title: "Audit Complete",
        description: `Found ${result.summary.totalBooks} books, ${result.summary.accessibleFiles} accessible, ${result.summary.missingFiles} missing`,
      });
    } catch (error) {
      console.error('❌ Audit failed:', error);
      toast({
        title: "Audit Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fixMismatches = async () => {
    if (!auditResult) return;
    
    setFixing(true);
    try {
      console.log('🔧 Fixing path mismatches...');
      const fixableCount = auditResult.mismatches.filter(m => m.exists && m.suggestedPath).length;
      
      if (fixableCount === 0) {
        toast({
          title: "Nothing to Fix",
          description: "No fixable path mismatches found",
        });
        return;
      }
      
      const results = await fixPathMismatches(auditResult.mismatches);
      
      toast({
        title: "Fix Complete",
        description: `Fixed ${results.fixed} paths, ${results.failed} failed`,
        variant: results.failed > 0 ? "destructive" : "default",
      });
      
      // Re-run audit to show updated results
      await runAudit();
      
    } catch (error) {
      console.error('❌ Fix failed:', error);
      toast({
        title: "Fix Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setFixing(false);
    }
  };

  const cleanupPlaceholders = async () => {
    setCleaning(true);
    try {
      console.log('🧹 Cleaning up placeholder books...');
      const result = await cleanupPlaceholderBooks();
      
      toast({
        title: "Cleanup Complete",
        description: `Cleaned ${result.cleaned} placeholder books. ${result.errors.length} errors.`,
        variant: result.errors.length > 0 ? "destructive" : "default",
      });

      if (result.errors.length > 0) {
        console.error('Cleanup errors:', result.errors);
      }
      
      // Re-run audit to show updated results
      await runAudit();
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      toast({
        title: "Cleanup Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setCleaning(false);
    }
  };

  const validateBooks = async () => {
    setValidating(true);
    try {
      console.log('🔍 Validating books...');
      const result = await validateUploadedBooks();
      
      toast({
        title: "Validation Complete",
        description: `${result.valid} valid books, ${result.invalid} with issues`,
        variant: result.invalid > 0 ? "destructive" : "default",
      });

      if (result.issues.length > 0) {
        console.error('Validation issues:', result.issues);
      }
      
    } catch (error) {
      console.error('❌ Validation failed:', error);
      toast({
        title: "Validation Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-navy-900">Storage Diagnostic & Cleanup</h2>
        <div className="space-x-2">
          <Button 
            onClick={runAudit}
            disabled={loading}
            className="bg-primary hover:bg-primary/90"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Scanning...' : 'Run Audit'}
          </Button>
          <Button
            onClick={cleanupPlaceholders}
            disabled={cleaning}
            variant="outline"
          >
            <Trash2 className={`h-4 w-4 mr-2 ${cleaning ? 'animate-spin' : ''}`} />
            {cleaning ? 'Cleaning...' : 'Cleanup Placeholders'}
          </Button>
          <Button
            onClick={validateBooks}
            disabled={validating}
            variant="outline"
          >
            <Shield className={`h-4 w-4 mr-2 ${validating ? 'animate-spin' : ''}`} />
            {validating ? 'Validating...' : 'Validate Books'}
          </Button>
          {auditResult && auditResult.mismatches.some(m => m.exists && m.suggestedPath) && (
            <Button
              onClick={fixMismatches}
              disabled={fixing}
              variant="outline"
            >
              <Wrench className={`h-4 w-4 mr-2 ${fixing ? 'animate-spin' : ''}`} />
              {fixing ? 'Fixing...' : 'Fix Mismatches'}
            </Button>
          )}
        </div>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Storage Management Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">🔍 Run Audit</h4>
              <p className="text-gray-600">Scans all books and checks if their files exist in storage. Identifies missing files and path mismatches.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🧹 Cleanup Placeholders</h4>
              <p className="text-gray-600">Removes books with placeholder files and any temporary files from storage. Safe to run anytime.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🔧 Fix Mismatches</h4>
              <p className="text-gray-600">Automatically fixes database paths to match actual files in storage. Only appears when fixable issues are found.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🛡️ Validate Books</h4>
              <p className="text-gray-600">Validates all active books against storage files. Provides a health check of your book collection.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {auditResult && (
        <>
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Audit Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{auditResult.summary.totalBooks}</div>
                  <div className="text-sm text-gray-600">Total Books</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{auditResult.summary.accessibleFiles}</div>
                  <div className="text-sm text-gray-600">Accessible</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{auditResult.summary.pathMismatches}</div>
                  <div className="text-sm text-gray-600">Path Mismatches</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{auditResult.summary.missingFiles}</div>
                  <div className="text-sm text-gray-600">Missing Files</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Issues */}
          {auditResult.mismatches.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>File Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {auditResult.mismatches.map((mismatch, index) => (
                    <div key={index} className="flex items-start justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {mismatch.exists ? (
                            <CheckCircle className="h-4 w-4 text-orange-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                          <h4 className="font-semibold">{mismatch.title}</h4>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>
                            <span className="font-medium">Database Path:</span>
                            <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-xs">
                              {mismatch.databasePath}
                            </code>
                          </div>
                          {mismatch.suggestedPath && (
                            <div>
                              <span className="font-medium">Found At:</span>
                              <code className="ml-2 px-2 py-1 bg-green-100 rounded text-xs">
                                {mismatch.suggestedPath}
                              </code>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        {mismatch.exists ? (
                          <Badge variant="secondary">Path Mismatch</Badge>
                        ) : (
                          <Badge variant="destructive">Missing</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Storage Files */}
          <Card>
            <CardHeader>
              <CardTitle>Storage Files ({auditResult.storageFiles.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {auditResult.storageFiles.map((file, index) => (
                  <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                    <code className="text-xs">{file.name}</code>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!auditResult && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Run an audit to check storage alignment and book health</p>
            <p className="text-sm text-gray-400">This will help identify any issues with your book uploads and storage</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StorageDiagnostic;
