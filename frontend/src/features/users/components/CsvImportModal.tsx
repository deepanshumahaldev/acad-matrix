import { useState, type ChangeEvent } from 'react';
import { Alert, Button, Modal, Table } from '@/components/ui';
import type { CsvImportResult } from '../types';

interface CsvImportModalProps {
  open: boolean;
  title: string;
  sampleCsv: string;
  columnsDescription: string;
  onClose: () => void;
  onImport: (csvData: string) => Promise<CsvImportResult>;
  onSuccess?: () => void;
}

export function CsvImportModal({
  open,
  title,
  sampleCsv,
  columnsDescription,
  onClose,
  onImport,
  onSuccess,
}: CsvImportModalProps) {
  const [csvText, setCsvText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CsvImportResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvText((event.target?.result as string) || '');
    };
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    if (!csvText.trim()) {
      setErrorMsg('Please select a CSV file or paste CSV text');
      return;
    }
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await onImport(csvText);
      setResult(res);
      if (res.successCount > 0) onSuccess?.();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCsvText('');
    setResult(null);
    setErrorMsg(null);
  };

  const handleModalClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Modal open={open} title={title} onClose={handleModalClose}>
      <div className="space-y-4">
        {errorMsg && <Alert tone="error">{errorMsg}</Alert>}

        {!result ? (
          <>
            <div className="rounded-md bg-slate-50 p-3 text-xs text-slate-600">
              <p className="font-semibold text-slate-800">CSV Columns:</p>
              <p className="mt-1 font-mono text-[11px] text-slate-700">{columnsDescription}</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Upload CSV file</label>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="block w-full text-xs text-slate-500 file:mr-2 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-medium text-slate-700">Or paste CSV raw text</label>
                <button
                  type="button"
                  onClick={() => setCsvText(sampleCsv)}
                  className="text-xs text-brand hover:underline font-medium"
                >
                  Insert Sample CSV
                </button>
              </div>
              <textarea
                rows={6}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="Paste CSV rows here..."
                className="w-full rounded-md border border-line p-2 font-mono text-xs text-ink placeholder:text-muted/60"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={handleModalClose}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} loading={loading} disabled={!csvText.trim()}>
                Start Import
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md bg-slate-50 p-2">
                <span className="block text-xs text-slate-500">Total</span>
                <span className="text-base font-bold text-slate-800">{result.totalRows}</span>
              </div>
              <div className="rounded-md bg-emerald-50 p-2">
                <span className="block text-xs text-emerald-600">Imported</span>
                <span className="text-base font-bold text-emerald-700">{result.successCount}</span>
              </div>
              <div className="rounded-md bg-red-50 p-2">
                <span className="block text-xs text-red-600">Failed</span>
                <span className="text-base font-bold text-red-700">{result.failureCount}</span>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-700">Error Report:</p>
                <div className="max-h-48 overflow-y-auto">
                  <Table
                    columns={[
                      { key: 'row', header: 'Row', render: (r) => <span className="font-mono">{r.row}</span> },
                      { key: 'identifier', header: 'ID / Email', render: (r) => r.identifier || '—' },
                      { key: 'reason', header: 'Reason', render: (r) => <span className="text-red-600">{r.reason}</span> },
                    ]}
                    rows={result.errors}
                    rowKey={(r) => `${r.row}-${r.identifier}`}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={handleReset}>
                Import Another
              </Button>
              <Button onClick={handleModalClose}>Done</Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
