import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Upload,
  FileSpreadsheet,
  Database,
  Download,
  Settings,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calculator,
  Edit,
  Save,
  Eye
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ImportedData {
  id: string;
  filename: string;
  type: 'csv' | 'xlsx' | 'sql';
  uploadDate: string;
  recordCount: number;
  columns: string[];
  mappedFields: Record<string, string>;
  status: 'processing' | 'mapped' | 'imported' | 'error';
}

interface CalculationFormula {
  framework: string;
  type: string;
  formula: string;
  variables: Record<string, number>;
  description: string;
}

const DataImportManager = () => {
  const [activeTab, setActiveTab] = useState("import");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editingFormula, setEditingFormula] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch imported data files
  const { data: importedFiles = [], isLoading: isLoadingFiles } = useQuery<ImportedData[]>({
    queryKey: ['/api/data-imports'],
  });

  // Fetch calculation formulas
  const { data: formulas = [], isLoading: isLoadingFormulas } = useQuery<CalculationFormula[]>({
    queryKey: ['/api/calculation-formulas'],
  });

  // File upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/data-imports/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/data-imports'] });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast({ title: "File uploaded successfully", description: "Processing maritime data..." });
    },
    onError: (error: Error) => {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    },
  });

  // Formula update mutation
  const updateFormulaMutation = useMutation({
    mutationFn: async ({ id, formula }: { id: string; formula: CalculationFormula }) => {
      const response = await fetch(`/api/calculation-formulas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formula),
      });
      if (!response.ok) throw new Error('Failed to update formula');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calculation-formulas'] });
      setEditingFormula(null);
      toast({ title: "Formula updated", description: "Calculation formula saved successfully" });
    },
  });

  // Data export mutation
  const exportMutation = useMutation({
    mutationFn: async ({ format, dataType }: { format: 'csv' | 'xlsx' | 'sql'; dataType: string }) => {
      const response = await fetch(`/api/data-exports/${format}?type=${dataType}`, {
        method: 'GET',
      });
      if (!response.ok) throw new Error('Export failed');
      return response.blob();
    },
    onSuccess: (blob, { format, dataType }) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `maritime-${dataType}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: "Export completed", description: `Data exported as ${format.toUpperCase()}` });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      if (validTypes.includes(file.type) || file.name.endsWith('.sql')) {
        setSelectedFile(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select a CSV, XLSX, or SQL file",
          variant: "destructive"
        });
      }
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    uploadMutation.mutate(formData);
  };

  const handleExport = (format: 'csv' | 'xlsx' | 'sql', dataType: string) => {
    exportMutation.mutate({ format, dataType });
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'csv': return <FileText className="h-4 w-4" />;
      case 'xlsx': return <FileSpreadsheet className="h-4 w-4" />;
      case 'sql': return <Database className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'imported': return 'bg-green-100 text-green-800';
      case 'mapped': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Data Integration & Calculations</h2>
          <p className="text-muted-foreground">
            Import maritime data and customize calculation formulas for compliance frameworks
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="import" data-testid="tab-import">
            <Upload className="h-4 w-4 mr-2" />
            Import Data
          </TabsTrigger>
          <TabsTrigger value="files" data-testid="tab-files">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Imported Files
          </TabsTrigger>
          <TabsTrigger value="formulas" data-testid="tab-formulas">
            <Calculator className="h-4 w-4 mr-2" />
            Edit Formulas
          </TabsTrigger>
          <TabsTrigger value="export" data-testid="tab-export">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Maritime Data Files</CardTitle>
              <p className="text-sm text-muted-foreground">
                Import vessel data, fuel consumption records, voyage information, and compliance data
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="hover-elevate">
                  <CardContent className="pt-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <FileText className="h-5 w-5 text-green-600" />
                      <span className="font-medium">CSV Files</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Standard comma-separated values format for vessel data, fuel logs, voyage records
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover-elevate">
                  <CardContent className="pt-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">Excel Files</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      XLSX format for structured maritime data with multiple sheets and formulas
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover-elevate">
                  <CardContent className="pt-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Database className="h-5 w-5 text-purple-600" />
                      <span className="font-medium">SQL Files</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Database dump files with vessel registry, compliance records, and operational data
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="border-2 border-dashed border-border rounded-lg p-6">
                <div className="text-center space-y-4">
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xlsx,.xls,.sql"
                      onChange={handleFileSelect}
                      className="hidden"
                      data-testid="file-input"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      data-testid="select-file-button"
                    >
                      Select File
                    </Button>
                  </div>
                  
                  {selectedFile && (
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getFileIcon(selectedFile.name.split('.').pop() || '')}
                          <span className="text-sm font-medium">{selectedFile.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(selectedFile.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={handleUpload}
                          disabled={uploadMutation.isPending}
                          data-testid="upload-button"
                        >
                          {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files" className="space-y-4">
          <div className="grid gap-4">
            {isLoadingFiles ? (
              <div className="text-center py-8">Loading imported files...</div>
            ) : (importedFiles as ImportedData[]).length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="mx-auto w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4">
                    <FileSpreadsheet className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">No files imported yet</p>
                </CardContent>
              </Card>
            ) : (
              (importedFiles as ImportedData[]).map((file: ImportedData) => (
                <Card key={file.id} className="hover-elevate">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getFileIcon(file.type)}
                        <div>
                          <h3 className="font-medium">{file.filename}</h3>
                          <p className="text-sm text-muted-foreground">
                            {file.recordCount.toLocaleString()} records • {file.uploadDate}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(file.status)}>
                          {file.status}
                        </Badge>
                        <Button variant="outline" size="sm" data-testid={`view-file-${file.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                    {file.columns.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-2">Detected columns:</p>
                        <div className="flex flex-wrap gap-1">
                          {file.columns.slice(0, 6).map((col, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {col}
                            </Badge>
                          ))}
                          {file.columns.length > 6 && (
                            <Badge variant="secondary" className="text-xs">
                              +{file.columns.length - 6} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="formulas" className="space-y-4">
          <div className="grid gap-4">
            {isLoadingFormulas ? (
              <div className="text-center py-8">Loading calculation formulas...</div>
            ) : (
              (formulas as CalculationFormula[]).map((formula: CalculationFormula, index: number) => (
                <Card key={index} className="hover-elevate">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">
                          {formula.framework} - {formula.type}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {formula.description}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingFormula(editingFormula === `${index}` ? null : `${index}`)}
                        data-testid={`edit-formula-${index}`}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {editingFormula === `${index}` ? (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor={`formula-${index}`}>Formula</Label>
                          <Textarea
                            id={`formula-${index}`}
                            value={formula.formula}
                            onChange={(e) => {
                              const updatedFormulas = [...formulas];
                              updatedFormulas[index] = { ...formula, formula: e.target.value };
                              // This would need proper state management
                            }}
                            className="font-mono text-sm"
                            rows={3}
                            data-testid={`formula-input-${index}`}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(formula.variables).map(([key, value]) => (
                            <div key={key}>
                              <Label htmlFor={`var-${key}-${index}`}>{key}</Label>
                              <Input
                                id={`var-${key}-${index}`}
                                type="number"
                                value={value}
                                onChange={(e) => {
                                  const updatedFormulas = [...formulas];
                                  updatedFormulas[index] = {
                                    ...formula,
                                    variables: { ...formula.variables, [key]: parseFloat(e.target.value) }
                                  };
                                  // This would need proper state management
                                }}
                                step="0.01"
                                data-testid={`variable-${key}-${index}`}
                              />
                            </div>
                          ))}
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => updateFormulaMutation.mutate({ id: `${index}`, formula })}
                            disabled={updateFormulaMutation.isPending}
                            data-testid={`save-formula-${index}`}
                          >
                            <Save className="h-4 w-4 mr-1" />
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingFormula(null)}
                            data-testid={`cancel-edit-${index}`}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="bg-muted p-3 rounded-lg">
                          <code className="text-sm">{formula.formula}</code>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          {Object.entries(formula.variables).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-muted-foreground">{key}:</span>
                              <span className="font-medium">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Export Compliance Data</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Download processed compliance data in various formats
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {['vessel-data', 'compliance-reports', 'credit-transactions', 'fuel-consumption'].map((dataType) => (
                  <div key={dataType} className="space-y-2">
                    <h4 className="font-medium capitalize">{dataType.replace('-', ' ')}</h4>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExport('csv', dataType)}
                        disabled={exportMutation.isPending}
                        data-testid={`export-csv-${dataType}`}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        CSV
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExport('xlsx', dataType)}
                        disabled={exportMutation.isPending}
                        data-testid={`export-xlsx-${dataType}`}
                      >
                        <FileSpreadsheet className="h-4 w-4 mr-1" />
                        Excel
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExport('sql', dataType)}
                        disabled={exportMutation.isPending}
                        data-testid={`export-sql-${dataType}`}
                      >
                        <Database className="h-4 w-4 mr-1" />
                        SQL
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Export Templates</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Download standardized templates for data import
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: 'Vessel Registry Template', type: 'vessel-template' },
                  { name: 'Fuel Consumption Template', type: 'fuel-template' },
                  { name: 'Voyage Data Template', type: 'voyage-template' },
                  { name: 'Compliance Records Template', type: 'compliance-template' }
                ].map((template) => (
                  <div key={template.type} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{template.name}</span>
                    <div className="flex space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExport('csv', template.type)}
                        data-testid={`download-template-csv-${template.type}`}
                      >
                        CSV
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExport('xlsx', template.type)}
                        data-testid={`download-template-xlsx-${template.type}`}
                      >
                        Excel
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataImportManager;