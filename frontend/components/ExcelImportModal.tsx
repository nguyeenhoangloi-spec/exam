'use client';

import React, { useState } from 'react';
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { Modal } from './Modal';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  templateFileName: string;
  onImportSuccess: (data: any[]) => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  title,
  templateFileName,
  onImportSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setErrorMsg('');

    // Mock parsing demo Excel file
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter((l) => l.trim() !== '');
      if (lines.length <= 1) {
        // Demo default dataset if plain text or empty
        setPreviewData([
          { code: 'SV2026010', name: 'Nguyễn Văn Minh', email: 'minhnv@student.edu.vn', class: 'CNTT-K65', status: 'Hợp lệ' },
          { code: 'SV2026011', name: 'Trần Thị Hà', email: 'hatt@student.edu.vn', class: 'CNTT-K66', status: 'Hợp lệ' },
          { code: 'SV2026012', name: 'Lê Hoàng Nam', email: 'namlh@student.edu.vn', class: 'AI-K66', status: 'Hợp lệ' },
        ]);
      } else {
        const headers = lines[0].split(',');
        const parsed = lines.slice(1, 6).map((line, idx) => {
          const parts = line.split(',');
          return {
            code: parts[0]?.trim() || `DATA00${idx + 1}`,
            name: parts[1]?.trim() || `Tên Mẫu ${idx + 1}`,
            email: parts[2]?.trim() || `demo${idx + 1}@school.edu.vn`,
            class: parts[3]?.trim() || 'CNTT-K65',
            status: 'Hợp lệ',
          };
        });
        setPreviewData(parsed);
      }
    };
    reader.readAsText(selectedFile);
  };

  const downloadTemplate = () => {
    const csvContent = 'data:text/csv;charset=utf-8,Ma,HoTen,Email,MaLop\nSV2026099,Nguyen Van Sample,sample@student.edu.vn,CNTT-K65';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', templateFileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmImport = () => {
    if (!file && previewData.length === 0) {
      setErrorMsg('Vui lòng chọn tệp Excel/CSV để nhập.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      onImportSuccess(previewData);
      setLoading(false);
      onClose();
    }, 600);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-5">
        {/* Step 1: Download Template */}
        <div className="flex items-center justify-between rounded-xl border border-sky-100 bg-sky-50/70 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-600 text-white shadow-xs">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Tải tệp mẫu Excel chuẩn</h4>
              <p className="text-xs text-slate-500">Sử dụng tệp mẫu để nhập đúng cấu trúc cột dữ liệu</p>
            </div>
          </div>
          <button
            type="button"
            onClick={downloadTemplate}
            className="flex items-center gap-1.5 rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-xs font-semibold text-sky-700 shadow-xs hover:bg-sky-100 transition"
          >
            <Download className="h-4 w-4" /> Tải mẫu (.csv)
          </button>
        </div>

        {/* Step 2: Upload Area */}
        <div className="relative border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-sky-500 transition-colors bg-slate-50/50">
          <input
            type="file"
            accept=".csv, .xlsx, .xls"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
          <div className="flex flex-col items-center justify-center gap-2">
            <Upload className="h-8 w-8 text-sky-600" />
            <p className="text-sm font-semibold text-slate-800">
              {file ? file.name : 'Kéo thả tệp Excel/CSV vào đây hoặc bấm để chọn tệp'}
            </p>
            <p className="text-xs text-slate-400">Hỗ trợ định dạng .xlsx, .xls, .csv (Tối đa 10MB)</p>
          </div>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* Step 3: Table Preview */}
        {previewData.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Xem trước dữ liệu ({previewData.length} dòng)
            </h4>
            <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0">
                  <tr>
                    <th className="p-2.5">STT</th>
                    <th className="p-2.5">Mã</th>
                    <th className="p-2.5">Họ tên</th>
                    <th className="p-2.5">Email / Đơn vị</th>
                    <th className="p-2.5">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {previewData.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-2.5">{i + 1}</td>
                      <td className="p-2.5 font-bold text-slate-800">{row.code}</td>
                      <td className="p-2.5">{row.name}</td>
                      <td className="p-2.5">{row.email || row.class}</td>
                      <td className="p-2.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" /> {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 transition"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 transition disabled:opacity-50"
          >
            {loading ? 'Đang xử lý...' : 'Xác nhận nhập danh sách'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
