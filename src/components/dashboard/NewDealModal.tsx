import { useState, useCallback } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Select, SelectItem } from "@heroui/react";
import { Upload, FileText, FileSpreadsheet, File, X, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { addToast } from "@heroui/react";

interface NewDealModalProps {
  open: boolean;
  onClose: () => void;
}

const ASSET_CLASSES = [
  "Private Equity", "Venture Capital", "Real Estate", "Hedge Fund",
  "Credit", "Growth Equity", "Biotech", "Infrastructure", "Other"
];

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return <FileText className="h-4 w-4 text-danger" />;
  if (ext === 'xlsx' || ext === 'xls') return <FileSpreadsheet className="h-4 w-4 text-success" />;
  return <File className="h-4 w-4 text-warning" />;
}

export function NewDealModal({ open, onClose }: NewDealModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [fundName, setFundName] = useState("");
  const [assetClass, setAssetClass] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const newFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!fundName.trim() || files.length === 0) return;
    setLoading(true);

    try {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          fund_name: fundName.trim(),
          asset_class: assetClass || null,
          status: 'uploading',
        })
        .select()
        .single();

      if (projectError || !project) throw projectError;

      for (const file of files) {
        const filePath = `${project.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        const ext = file.name.split('.').pop()?.toLowerCase();
        let fileType = 'other';
        if (ext === 'pdf') fileType = 'cim';
        else if (ext === 'xlsx' || ext === 'xls') fileType = 'financial_model';

        await supabase.from('documents').insert({
          project_id: project.id,
          file_name: file.name,
          file_path: filePath,
          file_type: fileType,
          file_size: file.size,
        });
      }

      await supabase.from('task_queue').insert({
        project_id: project.id,
        task_type: 'l1_analysis',
        status: 'pending',
      });

      await supabase.from('projects').update({ status: 'processing' }).eq('id', project.id);

      onClose();
      navigate(`/project/${project.id}`);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} size="lg" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <span>New Deal Analysis</span>
          <span className="text-sm text-default-400 font-normal">Upload documents and configure deal parameters.</span>
        </ModalHeader>
        <ModalBody>
          {/* Step 1: Upload */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">1</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-default-500">Upload Documents</span>
            </div>
            <div
              className="rounded-xl border-2 border-dashed border-default-300 p-6 sm:p-8 text-center transition-colors hover:border-primary cursor-pointer"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <Upload className="mx-auto h-8 w-8 text-default-400" />
              <p className="mt-2 text-sm font-medium text-foreground">Click to upload or drag and drop</p>
              <p className="mt-1 text-xs text-default-400">LPA, CIM, or Financial Models (PDF, XLSX, DOCX)</p>
              <input
                id="file-input"
                type="file"
                multiple
                accept=".pdf,.xlsx,.xls,.docx,.doc"
                className="hidden"
                onChange={handleFileInput}
              />
            </div>
          </div>

          {/* Step 2: Settings */}
          {files.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">2</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-default-500">Analysis Settings</span>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {files.map((file, i) => (
                  <div key={i} className="inline-flex items-center gap-1.5 rounded-full bg-default-100 px-3 py-1 text-xs">
                    {getFileIcon(file.name)}
                    <span className="max-w-[120px] truncate">{file.name}</span>
                    <button onClick={() => removeFile(i)} className="ml-1 hover:text-danger">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Fund Name"
                  placeholder="e.g. Blackstone Capital VIII"
                  value={fundName}
                  onValueChange={setFundName}
                  size="sm"
                />
                <Select
                  label="Asset Class"
                  placeholder="Select..."
                  size="sm"
                  selectedKeys={assetClass ? [assetClass] : []}
                  onSelectionChange={(keys) => setAssetClass(Array.from(keys)[0] as string || "")}
                >
                  {ASSET_CLASSES.map(ac => (
                    <SelectItem key={ac}>{ac}</SelectItem>
                  ))}
                </Select>
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>Cancel</Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isDisabled={!fundName.trim() || files.length === 0}
            isLoading={loading}
            startContent={!loading && <Zap className="h-4 w-4" />}
          >
            Begin Analysis
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
