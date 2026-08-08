'use client';

import React, { useState } from 'react';
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { Modal } from './Modal';
import { ConfirmModal } from './ConfirmModal';
import { downloadCsv } from '../lib/export-csv';
import api from '../lib/api';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  templateFileName: string;
  onImportSuccess: (data: any[]) => void | Promise<void>;
}

/** Generic CSV preview/import dialog. It never invents rows or reports success
 * before the parent has persisted the rows through the backend API. */
export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({ isOpen, onClose, title, templateFileName, onImportSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const parseCsv = (text: string) => {
    const lines = text.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 2) throw new Error('Tệp không có dòng dữ liệu hợp lệ.');
    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    return lines.slice(1).map((line) => {
      const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
      return headers.reduce<Record<string, string>>((row, header, index) => {
        row[header] = values[index] || '';
        return row;
      }, {});
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setErrorMsg('');
    if (selected.size > 5 * 1024 * 1024) {
      setPreviewData([]);
      setErrorMsg('Tệp vượt quá giới hạn 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try { setPreviewData(parseCsv(String(reader.result || ''))); }
      catch (error: any) { setPreviewData([]); setErrorMsg(error.message); }
    };
    reader.onerror = () => setErrorMsg('Không thể đọc tệp đã chọn.');
    reader.readAsText(selected, 'UTF-8');
  };

  const downloadTemplate = () => {
    const isTeacherImport = templateFileName.includes('giang_vien');
    const content = isTeacherImport
      ? 'teacherCode,fullName,email,departmentId,degree,phone\nGV2026001,Nguyen Van Mau,mau@example.edu.vn,1,ThS,0900000000'
      : 'studentCode,fullName,email,classId,gender,dateOfBirth,phone\nSV2026099,Nguyen Van Mau,mau@example.edu.vn,1,Nam,2004-01-01,0900000000';
    downloadCsv(templateFileName, content);
  };

  const handleConfirmImport = async () => {
    if (loading) return;
    if (!file || previewData.length === 0) { setErrorMsg('Vui lòng chọn tệp CSV có dữ liệu.'); return; }
    setLoading(true);
    setErrorMsg('');
    try {
      // The two legacy admin import dialogs are now backed by the same
      // create endpoints used by the normal forms. No local/demo rows are
      // accepted as a successful import.
      const isStudentImport = templateFileName.includes('sinh_vien');
      const isTeacherImport = templateFileName.includes('giang_vien');
      if (isStudentImport || isTeacherImport) {
        const failures: string[] = [];
        for (let index = 0; index < previewData.length; index += 1) {
          const row = previewData[index];
          try {
            if (isStudentImport) {
              await api.post('/students', { studentCode: row.studentCode || row.code, fullName: row.fullName || row.name, email: row.email, gender: row.gender || 'Nam', dateOfBirth: row.dateOfBirth || '2004-01-01', phone: row.phone || undefined, classId: Number(row.classId || row.class) });
            } else {
              await api.post('/teachers', { teacherCode: row.teacherCode || row.code, fullName: row.fullName || row.name, degree: row.degree || 'ThS', email: row.email, phone: row.phone || undefined, departmentId: Number(row.departmentId || row.department) });
            }
          } catch (error: any) {
            failures.push(`Dòng ${index + 2}: ${error?.response?.data?.message || error?.message || 'không hợp lệ'}`);
          }
        }
        if (failures.length) throw new Error(`Đã lưu ${previewData.length - failures.length}/${previewData.length} dòng. ${failures.join('; ')}`);
      }
      await onImportSuccess(previewData);
      onClose();
    }
    catch (error: any) { setErrorMsg(error?.response?.data?.message || error?.message || 'Không thể nhập dữ liệu.'); }
    finally { setLoading(false); }
  };

  return (
    <>
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-5">
        <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/70 p-4">
          <div className="flex items-center gap-3"><FileSpreadsheet className="h-5 w-5 text-blue-600" /><div><h4 className="text-sm font-bold text-slate-800">Tải tệp CSV mẫu</h4><p className="text-xs text-slate-500">Dùng đúng tên cột để hệ thống kiểm tra dữ liệu.</p></div></div>
          <button type="button" onClick={downloadTemplate} className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700"><Download className="h-4 w-4" /> Tải mẫu</button>
        </div>
        <div className="relative rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-6 text-center">
          <input type="file" accept=".csv,text/csv" onChange={handleFileChange} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
          <Upload className="mx-auto h-8 w-8 text-blue-600" />
          <p className="mt-2 text-sm font-semibold text-slate-800">{file ? file.name : 'Chọn tệp CSV để xem trước'}</p>
          <p className="text-xs text-slate-400">Tối đa 5 MB. Dữ liệu chỉ được lưu sau khi xác nhận.</p>
        </div>
        {previewData.length > 0 && <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Đã đọc {previewData.length} dòng từ tệp.</div>}
        {errorMsg && <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700"><AlertCircle className="h-4 w-4" /> {errorMsg}</div>}
        {previewData.length > 0 && <div className="max-h-48 overflow-auto rounded-xl border border-slate-200"><table className="w-full text-left text-xs"><thead className="sticky top-0 bg-slate-50"><tr>{Object.keys(previewData[0]).map((key) => <th key={key} className="px-3 py-2 font-semibold">{key}</th>)}</tr></thead><tbody>{previewData.slice(0, 20).map((row, index) => <tr key={index} className="border-t border-slate-100">{Object.keys(previewData[0]).map((key) => <td key={key} className="px-3 py-2">{row[key]}</td>)}</tr>)}</tbody></table></div>}
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4"><button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm text-slate-600">Hủy</button><button type="button" disabled={loading || previewData.length === 0} onClick={() => setShowConfirm(true)} className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{loading ? 'Đang lưu...' : 'Xác nhận nhập'}</button></div>
      </div>
    </Modal>
    <ConfirmModal
      isOpen={showConfirm}
      isLoading={loading}
      onClose={() => setShowConfirm(false)}
      onConfirm={() => {
        setShowConfirm(false);
        void handleConfirmImport();
      }}
      title="Xác nhận nhập dữ liệu"
      message={`Hệ thống sẽ tạo ${previewData.length} bản ghi từ tệp đã xem trước. Các dòng không hợp lệ sẽ được thông báo chi tiết.`}
      type="warning"
      confirmText="Nhập dữ liệu"
      cancelText="Quay lại kiểm tra"
    />
    </>
  );
};
