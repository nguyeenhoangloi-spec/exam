'use client';

import React, { useState } from 'react';
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Modal } from './Modal';
import { ConfirmModal } from './ConfirmModal';
import { Button } from './ui';
import { downloadCsv } from '../lib/export-csv';
import api from '../lib/api';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  templateFileName: string;
  onImportSuccess: (data: any[]) => void | Promise<void>;
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
      try {
        setPreviewData(parseCsv(String(reader.result || '')));
      } catch (error: any) {
        setPreviewData([]);
        setErrorMsg(error.message || 'Tệp không đúng định dạng dữ liệu. Vui lòng kiểm tra lại.');
      }
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
    if (!file || previewData.length === 0) {
      setErrorMsg('Vui lòng chọn tệp CSV/Excel có dữ liệu.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const isStudentImport = templateFileName.includes('sinh_vien');
      const isTeacherImport = templateFileName.includes('giang_vien');
      if (isStudentImport || isTeacherImport) {
        const failures: string[] = [];
        for (let index = 0; index < previewData.length; index += 1) {
          const row = previewData[index];
          try {
            if (isStudentImport) {
              await api.post('/students', {
                studentCode: row.studentCode || row.code,
                fullName: row.fullName || row.name,
                email: row.email,
                gender: row.gender || 'Nam',
                dateOfBirth: row.dateOfBirth || '2004-01-01',
                phone: row.phone || undefined,
                classId: Number(row.classId || row.class),
              });
            } else {
              await api.post('/teachers', {
                teacherCode: row.teacherCode || row.code,
                fullName: row.fullName || row.name,
                degree: row.degree || 'ThS',
                email: row.email,
                phone: row.phone || undefined,
                departmentId: Number(row.departmentId || row.department),
              });
            }
          } catch (error: any) {
            failures.push(`Dòng ${index + 2}: ${error?.response?.data?.message || error?.message || 'không hợp lệ'}`);
          }
        }
        if (failures.length) {
          throw new Error(`Đã lưu ${previewData.length - failures.length}/${previewData.length} dòng. ${failures.join('; ')}`);
        }
      }
      await onImportSuccess(previewData);
      onClose();
    } catch (error: any) {
      setErrorMsg(error?.response?.data?.message || error?.message || 'Không thể nhập dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
        <div className="space-y-4 py-1">
          {/* Frameless Template Download Line */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="h-5 w-5 text-blue-600 shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Tải tệp mẫu (.csv / .xlsx)</h4>
                <p className="text-xs font-semibold text-slate-500">Dùng đúng tên cột tiêu chuẩn để hệ thống tự động nhận diện.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={downloadTemplate}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Tải mẫu</span>
            </button>
          </div>

          {/* Upload Area */}
          <div className="relative rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-500 bg-slate-50/50 p-6 text-center transition">
            <input type="file" accept=".csv,text/csv" onChange={handleFileChange} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
            <Upload className="mx-auto h-8 w-8 text-blue-600" />
            <p className="mt-2 text-sm font-semibold text-slate-800">{file ? file.name : 'Kéo thả hoặc bấm để chọn tệp (.csv / .xlsx)'}</p>
            <p className="text-xs font-semibold text-slate-400 mt-1">Dung lượng tối đa 5 MB. Dữ liệu chỉ được lưu sau khi bấm Xác nhận nhập.</p>
          </div>

          {/* Frameless Alerts */}
          {previewData.length > 0 && (
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>Đã đọc thành công {previewData.length} dòng dữ liệu từ tệp.</span>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Preview Table */}
          {previewData.length > 0 && (
            <div className="ui-table-wrap max-h-52 overflow-auto rounded-xl border border-slate-200">
              <table className="ui-table w-full text-left text-sm text-slate-900">
                <thead className="sticky top-0 bg-slate-50 text-[14px] font-medium text-slate-500 border-b border-slate-200">
                  <tr>
                    {Object.keys(previewData[0]).map((key) => (
                      <th key={key} className="px-3 py-2 font-medium">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="font-normal text-[15px] divide-y divide-slate-100">
                  {previewData.slice(0, 20).map((row, index) => (
                    <tr key={index} className="hover:bg-slate-50/60">
                      {Object.keys(previewData[0]).map((key) => (
                        <td key={key} className="px-3 py-2">
                          {row[key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button variant="secondary" size="md" onClick={onClose}>
              Hủy bỏ
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={loading || previewData.length === 0}
              onClick={() => setShowConfirm(true)}
              isLoading={loading}
            >
              Xác nhận nhập
            </Button>
          </div>
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
        title="Nhập dữ liệu từ tệp Excel?"
        message={`Hệ thống sẽ tạo ${previewData.length} bản ghi từ tệp đã xem trước. Các dòng không hợp lệ sẽ được thông báo chi tiết.`}
        type="info"
        confirmText="Nhập dữ liệu"
        cancelText="Hủy bỏ"
      />
    </>
  );
};
