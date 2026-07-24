/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Check, 
  X, 
  Printer, 
  Lock, 
  FileText, 
  Download,
  ShieldCheck,
  Clock,
  Compass,
  Scale,
  Eye,
  Send,
  RefreshCw,
  Trash2,
  CheckCircle,
  FileCheck,
  Paperclip,
  Upload
} from 'lucide-react';
import { PR, User, UserRole, PRStatus, PO, Attachment } from '../types.js';
import { deletePrApi, updatePrStepSignatureApi } from '../lib/apiClient.js';
import SignaturePad from './SignaturePad.js';
import DocumentPreviewModal, { openFileInNewTab } from './DocumentPreviewModal.js';
import ProcessPackagePrint from './ProcessPackagePrint.js';

interface PRDetailsViewProps {
  pr: PR;
  currentUser: User;
  onApprove: (id: string, isReject: boolean, comment: string, signatureData: string, companyStampData?: string, geoCoordinates?: string) => void;
  onGeneratePO: (prId: string, signatureData?: string, companyStampData?: string) => void;
  onCancel: () => void;
  onNavigate?: (view: string, id?: string) => void;
  onStatusUpdate?: (id: string, status: PRStatus) => void;
}

export default function PRDetailsView({ pr, currentUser, onApprove, onGeneratePO, onCancel, onNavigate, onStatusUpdate }: PRDetailsViewProps) {
  const [showSigPad, setShowSigPad] = useState(false);
  const [activeStepSignatureTarget, setActiveStepSignatureTarget] = useState<{ stepName: string; action?: string; title: string } | null>(null);
  const [isRejectAction, setIsRejectAction] = useState(false);
  const [isGeneratingPO, setIsGeneratingPO] = useState(false);
  const [comment, setComment] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [previewFile, setPreviewFile] = useState<{ fileName: string, fileUrl: string } | null>(null);

  const handleStepSignatureSaved = async (signatureData: string, companyStampData?: string, geoCoordinates?: string) => {
    if (!activeStepSignatureTarget) return;
    try {
      const success = await updatePrStepSignatureApi(
        pr.id,
        currentUser.id,
        activeStepSignatureTarget.stepName,
        activeStepSignatureTarget.action || 'APPROVED',
        signatureData,
        companyStampData,
        geoCoordinates
      );
      if (success) {
        setActiveStepSignatureTarget(null);
        window.location.reload();
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to save signature');
    }
  };

  // Package printing states
  const [relatedPO, setRelatedPO] = useState<PO | null>(null);
  const [relatedCapex, setRelatedCapex] = useState<any | null>(null);
  const [isPrintPackageMode, setIsPrintPackageMode] = useState(false);

  useEffect(() => {
    const fetchRelatedDocs = async () => {
      try {
        // Fetch matching PO
        const poRes = await fetch('/api/po');
        if (poRes.ok) {
          const posList: PO[] = await poRes.json();
          const foundPO = posList.find(p => p.referPrId === pr.id);
          if (foundPO) setRelatedPO(foundPO);
        }

        // Fetch matching CAPEX
        const capexRes = await fetch('/api/capex');
        if (capexRes.ok) {
          const capexList: any[] = await capexRes.json();
          // Match by department or requestor
          const foundCapex = capexList.find(c => 
            c.departmentId === pr.departmentId || 
            c.requestorId === pr.requestorId
          );
          if (foundCapex) setRelatedCapex(foundCapex);
        }
      } catch (err) {
        console.error("Error fetching related docs in PR details:", err);
      }
    };
    fetchRelatedDocs();
  }, [pr.id, pr.departmentId, pr.requestorId]);

  const handlePrintPackage = () => {
    setIsPrintPackageMode(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        setIsPrintPackageMode(false);
      }, 500);
    }, 150);
  };

  // PR Edit & Attachment states
  const [isEditing, setIsEditing] = useState(false);
  const [editObjective, setEditObjective] = useState(pr.purchaseObjective);
  const [editItems, setEditItems] = useState(pr.items);
  const [editAttachments, setEditAttachments] = useState<Attachment[]>(pr.attachments || []);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEditObjective(pr.purchaseObjective);
    setEditItems(pr.items);
    setEditAttachments(pr.attachments || []);
  }, [pr]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files: File[] = Array.from(e.target.files);
    files.forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Url = reader.result as string;
        const newAttach: Attachment = {
          id: `ATT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type || 'application/octet-stream',
          uploadedAt: new Date().toISOString(),
          uploadedBy: currentUser?.name || 'Requestor',
          url: base64Url
        };
        setEditAttachments(prev => [...prev, newAttach]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveAttachment = (attId: string) => {
    setEditAttachments(prev => prev.filter(a => a.id !== attId));
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/pr/${pr.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchaseObjective: editObjective,
          items: editItems,
          attachments: editAttachments
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to save PR modifications');
      }
      setIsEditing(false);
      alert('แก้ไขใบขอซื้อและอัปเดตเอกสารสำเร็จเรียบร้อย!');
      if (onStatusUpdate) {
        onStatusUpdate(pr.id, pr.status);
      } else {
        window.location.reload();
      }
    } catch (e: any) {
      alert(e.message || 'Error occurred while saving modifications.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditItemChange = (idx: number, field: string, value: string) => {
    const updated = [...editItems];
    if (field === 'qty' || field === 'unitPrice') {
      const numVal = parseFloat(value) || 0;
      updated[idx] = { ...updated[idx], [field]: numVal };
      updated[idx].total = (updated[idx].qty || 0) * (updated[idx].unitPrice || 0);
    } else {
      updated[idx] = { ...updated[idx], [field]: value };
    }
    setEditItems(updated);
  };

  const handleAddEditItem = () => {
    setEditItems([...editItems, {
      id: `PRI-${Date.now()}-${editItems.length}`,
      itemNo: editItems.length + 1,
      partNo: '',
      description: '',
      specification: '',
      unit: 'SET',
      qty: 1,
      unitPrice: 0,
      total: 0
    }]);
  };

  const handleRemoveEditItem = (idx: number) => {
    if (editItems.length === 1) return;
    setEditItems(editItems.filter((_, i) => i !== idx));
  };

  const handlePrint = () => {
    window.print();
  };

  const openSignatureFlow = (isReject: boolean) => {
    setIsRejectAction(isReject);
    setIsGeneratingPO(false);
    setErrorMsg('');
    setShowSigPad(true);
  };

  const openPOGenerationFlow = () => {
    setIsGeneratingPO(true);
    setErrorMsg('');
    setShowSigPad(true);
  };

  const handleSignatureSaved = (signatureData: string, companyStampData?: string, geoCoordinates?: string) => {
    if (isGeneratingPO) {
      onGeneratePO(pr.id, signatureData, companyStampData);
    } else {
      onApprove(pr.id, isRejectAction, comment, signatureData, companyStampData, geoCoordinates);
    }
    setShowSigPad(false);
    setComment('');
    setIsGeneratingPO(false);
  };

  // Determine if active user is required to approve this PR
  const canApprove = () => {
    if (pr.status === PRStatus.PENDING_DEPT_MGR) {
      const isManager = currentUser.role === UserRole.DEPARTMENT_MANAGER || currentUser.role === UserRole.ASSISTANT_MANAGER || currentUser.role === UserRole.PURCHASING_MANAGER || currentUser.role === UserRole.ADMINISTRATOR || currentUser.role === UserRole.EXECUTIVE;
      const isHRGA = pr.departmentId === 'DEP004' || pr.departmentId === 'Administration' || pr.departmentName?.includes('HR');
      const isBenjawan = currentUser.employeeId === 'SAT0214' || currentUser.name.includes('Benjawan') || currentUser.thaiName?.includes('เบ็ญจวรรณ');
      
      return isManager || isBenjawan || (isHRGA && currentUser.role !== UserRole.EMPLOYEE); 
    }
    if (pr.status === PRStatus.PENDING_EXECUTIVE && (currentUser.role === UserRole.EXECUTIVE || currentUser.role === UserRole.ADMINISTRATOR)) {
      return true;
    }
    if (pr.status === PRStatus.PENDING_PURCHASING && (currentUser.role === UserRole.PURCHASING || currentUser.departmentId === 'DEP004' || currentUser.role === UserRole.ADMINISTRATOR)) {
      return true;
    }
    return currentUser.role === UserRole.ADMINISTRATOR;
  };

  // Anyone can generate PO once PR is fully approved
  const canCreatePO = () => {
    return pr.status === PRStatus.APPROVED;
  };

  return (
    <div className={`space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200 ${isPrintPackageMode ? 'print:hidden' : ''}`}>
      {/* Top action header (hidden on print) */}
      <div className="flex justify-between items-center no-print">
        <button 
          onClick={onCancel}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 border border-slate-200 px-3 py-1.5 bg-white rounded-lg transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to list
        </button>

        <div className="flex gap-2">
          <button
            onClick={handlePrintPackage}
            className="text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 flex items-center gap-1.5 border border-slate-700 px-3.5 py-1.5 rounded-lg transition-colors shadow-md"
            title="พิมพ์เอกสารขอซื้อ (PR) + ใบสั่งซื้อ (PO) + ใบเสนอราคา (Quotation) + CAPEX ทั้งหมดออกมาในไฟล์เดียว"
          >
            <Printer className="h-4 w-4" />
            พิมพ์ชุดเอกสารครบวงจร (PDF 100%)
          </button>

          <button
            onClick={handlePrint}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 border border-slate-200 px-3.5 py-1.5 bg-white rounded-lg transition-colors shadow-xs"
          >
            <Printer className="h-4 w-4" />
            Print PR (A4)
          </button>
        </div>
      </div>

      {/* PR Approved -> Ready for PO Banner */}
      {pr.status === PRStatus.APPROVED && (
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-sky-950 border-2 border-emerald-500/80 rounded-2xl p-5 text-white shadow-2xl no-print animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 text-left">
              <div className="p-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-xl shadow-inner shrink-0">
                <CheckCircle className="h-7 w-7 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-emerald-500 text-slate-950 font-black text-[10px] rounded-md uppercase tracking-wider">
                    PR APPROVED
                  </span>
                  <span className="text-xs font-bold text-emerald-300">ผ่านการอนุมัติครบถ้วนสมบูรณ์ 100%</span>
                </div>
                <h3 className="text-base font-extrabold text-white mt-1">
                  ใบขอซื้อ {pr.prNumber || pr.id} ย้ายเข้าสู่สถานะ "รอออกใบสั่งซื้อ (PO)" เรียบร้อยแล้ว
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  เอกสารนี้ถูกอนุมัติครบทุกขั้นตอน พร้อมสำหรับเจ้าหน้าที่จัดซื้อหรือผู้บริหารในการคลิกออกใบสั่งซื้อ (PO) ทันที
                </p>
              </div>
            </div>
            <button
              onClick={openPOGenerationFlow}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 hover:scale-103 active:scale-97 cursor-pointer shrink-0"
              id="btn-generate-po-banner"
            >
              <FileCheck className="h-4.5 w-4.5" />
              <span>ออก PO ทันที (Issue PO Now)</span>
            </button>
          </div>
        </div>
      )}

      {/* Status & Workflow Control Card (no-print) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white space-y-4 no-print shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 text-sky-400 rounded-lg">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Status & Workflow Matrix Control</h3>
              <p className="text-[10px] text-slate-400">
                สถานะปัจจุบัน: <span className="font-bold text-sky-400">{pr.status === PRStatus.PENDING_DEPT_MGR ? 'Send Assismanager approved' : pr.status.replace('_', ' ')}</span> • จัดการและเปลี่ยนสถานะเอกสารใบขอซื้อนี้
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Quick action for Draft -> Send Assismanager approved */}
            {pr.status === PRStatus.DRAFT && onStatusUpdate && (
              <button
                onClick={() => onStatusUpdate(pr.id, PRStatus.PENDING_DEPT_MGR)}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer hover:scale-102 active:scale-98"
              >
                <Send className="h-3.5 w-3.5" />
                ส่งอนุมัติผู้ช่วยผู้จัดการ (Send Assismanager approved)
              </button>
            )}

            {pr.status === PRStatus.PENDING_DEPT_MGR && (
              <button
                onClick={() => openSignatureFlow(false)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer hover:scale-102 active:scale-98"
              >
                <Send className="h-3.5 w-3.5" />
                ส่งอนุมัติและลงนามผู้จัดการฝ่าย (Department Manager E-Sign)
              </button>
            )}

            {pr.status === PRStatus.PENDING_EXECUTIVE && (
              <button
                onClick={() => openSignatureFlow(false)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer hover:scale-102 active:scale-98"
              >
                <Check className="h-3.5 w-3.5" />
                ผู้บริหารอนุมัติและประทับตรา (Mr. Liu Dong / Yoshiyuki Konishi E-Sign & Stamp)
              </button>
            )}

            {pr.status === PRStatus.PENDING_PURCHASING && (
              <button
                onClick={() => openSignatureFlow(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer hover:scale-102 active:scale-98"
              >
                <Check className="h-3.5 w-3.5" />
                จัดซื้อตรวจสอบผ่าน (Purchasing Check & Complete PR)
              </button>
            )}

            {/* Direct dropdown edit status */}
            {onStatusUpdate && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-medium">แก้ไขสถานะเป็น:</span>
                <select
                  value={pr.status}
                  onChange={(e) => onStatusUpdate(pr.id, e.target.value as PRStatus)}
                  className="bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs font-bold outline-none hover:bg-slate-750 focus:ring-1 focus:ring-sky-500 cursor-pointer"
                >
                  <option value={PRStatus.DRAFT}>Draft Created (แบบร่าง)</option>
                  <option value={PRStatus.PENDING_DEPT_MGR}>Send Assismanager approved (ส่งอนุมัติผู้ช่วยผู้จัดการ)</option>
                  <option value={PRStatus.PENDING_EXECUTIVE}>Pending Executive Approval (รอผู้บริหารอนุมัติ)</option>
                  <option value={PRStatus.PENDING_PURCHASING}>Pending Purchasing Action (รอจัดซื้อออก PO)</option>
                  <option value={PRStatus.APPROVED}>Approved (อนุมัติแล้ว)</option>
                  <option value={PRStatus.PO_CREATED}>PO Created (ออกใบสั่งซื้อแล้ว)</option>
                  <option value={PRStatus.REJECTED}>Rejected (ปฏิเสธ)</option>
                  <option value={PRStatus.CANCELLED}>Cancelled (ยกเลิก)</option>
                </select>
              </div>
            )}

            {/* Actions for PR Requestor / Admin / Managers */}
            {(() => {
              const isRequestor = currentUser && (
                currentUser.id === pr.requestorId ||
                currentUser.email === pr.requestorEmail ||
                currentUser.name === pr.requestorName ||
                currentUser.employeeId === pr.requestorId ||
                (currentUser.thaiName && pr.requestorName && currentUser.thaiName.includes(pr.requestorName))
              );

              const canEditPR = currentUser && (
                isRequestor ||
                currentUser.role === UserRole.ADMINISTRATOR ||
                currentUser.employeeId === '43210344' ||
                currentUser.role === UserRole.ASSISTANT_MANAGER ||
                currentUser.role === UserRole.DEPARTMENT_MANAGER
              );

              if (!canEditPR) return null;

              return (
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer hover:scale-102 active:scale-98"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    {isEditing ? 'ปิดการแก้ไข' : 'แก้ไขใบขอซื้อ / แนบเอกสาร (Edit Requisition)'}
                  </button>
                  {(currentUser.role === UserRole.ADMINISTRATOR || currentUser.employeeId === '43210344') && (
                    <button
                      onClick={async () => {
                        if (window.confirm('คุณต้องการลบใบขอซื้อ (PR) นี้อย่างถาวรใช่หรือไม่?')) {
                          try {
                            const res = await deletePrApi(pr.id);
                            alert('ลบเอกสารใบขอซื้อสำเร็จ');
                            onCancel();
                          } catch (err: any) {
                            alert(err.message || 'เกิดข้อผิดพลาดในการลบ');
                          }
                        }
                      }}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer hover:scale-102 active:scale-98"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      ลบใบขอซื้อ (Delete PR)
                    </button>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* PR Requestor & Admin Edit Panel */}
      {isEditing && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 text-left space-y-6 no-print shadow-xl animate-in fade-in zoom-in duration-200 max-w-4xl mx-auto">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wider">แก้ไขใบขอซื้อและแนบเอกสาร (Requisition Editor)</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">คุณสามารถแก้ไขรายการพัสดุ วัตถุประสงค์ และแนบไฟล์เอกสารใบเสนอราคาเพิ่มเติมสำหรับใบขอซื้อ {pr.prNumber || pr.id} ได้ที่นี่</p>
            </div>
            <button
              onClick={() => setIsEditing(false)}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">วัตถุประสงค์การจัดซื้อ (Purchase Objective)</label>
              <input
                type="text"
                value={editObjective}
                onChange={(e) => setEditObjective(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-sky-500 outline-none font-medium text-slate-800"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-bold text-slate-700 uppercase">ตารางรายการพัสดุ (Items List)</label>
                <button
                  type="button"
                  onClick={handleAddEditItem}
                  className="px-2.5 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-md text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                >
                  เพิ่มรายการ
                </button>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-[10px] text-slate-400 font-bold uppercase">
                    <tr>
                      <th className="p-2 border-r border-slate-200">Part No / Model</th>
                      <th className="p-2 border-r border-slate-200">Description</th>
                      <th className="p-2 border-r border-slate-200">Specification</th>
                      <th className="p-2 border-r border-slate-200">Unit</th>
                      <th className="p-2 border-r border-slate-200 w-16">Qty</th>
                      <th className="p-2 border-r border-slate-200 w-24">Unit Price</th>
                      <th className="p-2">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {editItems.map((item, idx) => (
                      <tr key={item.id || `edit-item-${idx}`} className="hover:bg-slate-50/40">
                        <td className="p-1 border-r border-slate-200">
                          <input
                            type="text"
                            value={item.partNo || ''}
                            onChange={(e) => handleEditItemChange(idx, 'partNo', e.target.value)}
                            className="w-full bg-transparent p-1 text-xs outline-none focus:bg-white"
                            placeholder="N/A"
                          />
                        </td>
                        <td className="p-1 border-r border-slate-200">
                          <input
                            type="text"
                            value={item.description || ''}
                            onChange={(e) => handleEditItemChange(idx, 'description', e.target.value)}
                            className="w-full bg-transparent p-1 text-xs outline-none focus:bg-white font-semibold text-slate-800"
                            placeholder="Description"
                          />
                        </td>
                        <td className="p-1 border-r border-slate-200">
                          <input
                            type="text"
                            value={item.specification || ''}
                            onChange={(e) => handleEditItemChange(idx, 'specification', e.target.value)}
                            className="w-full bg-transparent p-1 text-xs outline-none focus:bg-white"
                            placeholder="Spec"
                          />
                        </td>
                        <td className="p-1 border-r border-slate-200">
                          <input
                            type="text"
                            value={item.unit || ''}
                            onChange={(e) => handleEditItemChange(idx, 'unit', e.target.value)}
                            className="w-full bg-transparent p-1 text-xs outline-none focus:bg-white text-center"
                            placeholder="PCS"
                          />
                        </td>
                        <td className="p-1 border-r border-slate-200">
                          <input
                            type="number"
                            value={item.qty}
                            onChange={(e) => handleEditItemChange(idx, 'qty', e.target.value)}
                            className="w-full bg-transparent p-1 text-xs outline-none focus:bg-white font-mono text-center"
                          />
                        </td>
                        <td className="p-1 border-r border-slate-200">
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => handleEditItemChange(idx, 'unitPrice', e.target.value)}
                            className="w-full bg-transparent p-1 text-xs outline-none focus:bg-white font-mono text-right"
                          />
                        </td>
                        <td className="p-1 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveEditItem(idx)}
                            className="text-rose-500 hover:text-rose-700 p-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Document Attachments Manager */}
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-bold text-slate-700 uppercase flex items-center gap-1.5">
                  <Paperclip className="h-3.5 w-3.5 text-sky-600" />
                  <span>แนบเอกสารเพิ่มเติม / ใบเสนอราคา (Attachments)</span>
                </label>
                <label className="px-3 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs">
                  <Upload className="h-3.5 w-3.5" />
                  <span>+ เลือกไฟล์แนบเพิ่ม</span>
                  <input 
                    type="file" 
                    multiple 
                    onChange={handleFileUpload} 
                    className="hidden" 
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                  />
                </label>
              </div>

              {editAttachments.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {editAttachments.map((file, idx) => (
                    <div key={file.id || idx} className="flex justify-between items-center border border-slate-200 p-2.5 rounded-xl bg-slate-50 text-xs">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="h-4 w-4 text-slate-500 shrink-0" />
                        <div className="truncate">
                          <p className="font-semibold text-slate-800 truncate max-w-[180px]" title={file.fileName}>{file.fileName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{(file.fileSize / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(file.id)}
                        className="text-rose-500 hover:text-rose-700 p-1 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="ลบเอกสารแนบนี้"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200 text-center">
                  ยังไม่มีเอกสารแนบ คลิกปุ่ม "+ เลือกไฟล์แนบเพิ่ม" ด้านบนเพื่ออัปโหลดใบเสนอราคาหรือไฟล์ประกอบ
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2.5">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข (Save Changes)'}
            </button>
          </div>
        </div>
      )}

      {/* A4 Document Action Bar (no-print) */}
      <div className="flex justify-between items-center bg-slate-100 p-3 rounded-t-xl border-x border-t border-slate-300 no-print" style={{ width: '210mm', margin: '0 auto', boxSizing: 'border-box' }}>
        <div className="flex items-center gap-2">
          <Printer className="h-4 w-4 text-sky-600" />
          <span className="text-xs font-bold text-slate-800">A4 Purchase Requisition Form ({pr.prNumber})</span>
        </div>
        <button
          onClick={handlePrint}
          id="btn-print-pr-doc"
          className="text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-colors shadow-sm cursor-pointer"
          title="Print this A4 Purchase Requisition document"
        >
          <Printer className="h-4 w-4" />
          <span>Print PR Document</span>
        </button>
      </div>

      {/* Main PR Doc Page Layout - mimics exact SUMINO AAPICO printed copy */}
      <div className="bg-white border-2 border-black p-8 font-sans relative text-black text-xs shadow-lg overflow-hidden print:border-none print:shadow-none print:p-0 flex flex-col rounded-b-none" id="printable-pr-doc" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', boxSizing: 'border-box' }}>
        {/* Verification stamp if PO already generated */}
        {pr.status === PRStatus.PO_CREATED && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-12 border-4 border-emerald-600/30 text-emerald-600/30 font-bold px-8 py-3 rounded-xl text-3xl uppercase tracking-widest font-sans select-none pointer-events-none no-print">
            PO COMMITTED
          </div>
        )}

        {/* Corporate Header Section */}
        <div className="border-b-2 border-black pb-4 mb-2">
          <div className="text-center mb-2">
            <h1 className="text-base font-black tracking-wide uppercase text-black">SUMINO AAPICO (Thailand) Company Limited</h1>
          </div>
          
          <div className="flex justify-between items-end">
            <div className="text-left">
              <p className="text-[9px] text-black font-medium leading-tight">
                700/706 Moo 3, T. Bankao, A. Panthong, Chonburi 20160<br/>
                Tel: 66-38-447-628-31, Fax No. 66-38-447-632<br/>
                Tax No. 0-2055-56012-44-8
              </p>
            </div>
          </div>

          <div className="relative mt-4">
            <h2 className="text-sm font-black text-black tracking-widest uppercase text-center">PURCHASE REQUISITION</h2>
            
            <div className="absolute right-0 bottom-[-10px]">
              <table className="border-collapse border border-black text-[10px] font-mono min-w-[180px]">
                <thead>
                  <tr className="bg-white border-b border-black text-[9px] font-black uppercase">
                    <th className="border border-black px-1 py-0.5 text-center w-1/2">P/R No.</th>
                    <th className="border border-black px-1 py-0.5 text-center w-1/2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="font-bold text-center h-6">
                    <td className="border border-black px-1 py-1 text-black">{pr.prNumber || ' '}</td>
                    <td className="border border-black px-1 py-1 text-black">{pr.date}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Info Fields Area */}
        <div className="pt-2 pb-1 text-[10px] border-b border-black">
          <div className="flex gap-x-12 mb-2">
            <div className="flex items-center flex-1">
              <span className="font-bold text-black shrink-0">Requestor :</span>
              <span className="ml-2 border-b border-slate-300 flex-1 px-1 font-semibold">{pr.requestorName}</span>
            </div>
            <div className="flex items-center flex-1">
              <span className="font-bold text-black shrink-0">Department :</span>
              <span className="ml-2 border-b border-slate-300 flex-1 px-1 font-semibold">{pr.departmentName}</span>
            </div>
          </div>

          <div className="mt-4 space-y-1.5 max-w-2xl">
            <div className="flex items-center">
              <span className="w-28 font-bold text-black shrink-0">Suggested Vendor :</span>
              <span className="border-b border-slate-300 flex-1 px-1 font-bold">{pr.vendorName}</span>
            </div>
            <div className="flex items-center">
              <span className="w-28 font-bold text-black shrink-0">Address :</span>
              <span className="border-b border-slate-300 flex-1 px-1 truncate">{pr.vendorAddress}</span>
            </div>
            <div className="flex items-center">
              <span className="w-28 font-bold text-black shrink-0">Telephone :</span>
              <span className="border-b border-slate-300 flex-1 px-1 font-mono">{pr.vendorPhone}</span>
            </div>
            <div className="flex items-center">
              <span className="w-28 font-bold text-black shrink-0">Fax :</span>
              <span className="border-b border-slate-300 flex-1 px-1 font-mono">{pr.vendorFax || ' '}</span>
            </div>
            <p className="text-[8px] text-slate-600 italic font-semibold mt-1">
              Please give complete descriptions where applicable. Remit all Surplus Property Forms to Purchasing.
            </p>
          </div>
        </div>

        {/* Item List Table with Padded Rows */}
        <div className="p-0 border-b border-black my-2">
          <table className="w-full text-[10px] text-left border-collapse border border-black">
            <thead>
              <tr className="bg-slate-100 text-[9px] font-black text-black uppercase border-b border-black text-center">
                <th className="border border-black p-0.5 w-8">Item</th>
                <th className="border border-black p-0.5 w-20">Part no.</th>
                <th className="border border-black p-0.5">Description</th>
                <th className="border border-black p-0.5 w-10">Unit</th>
                <th className="border border-black p-0.5 w-10">Q'ty</th>
                <th className="border border-black p-0.5 w-16 text-right">Unit (Price)</th>
                <th className="border border-black p-0.5 w-20 text-right">Unit (Total)</th>
                <th className="border border-black p-0.5 w-28">Purchase Objective</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                // Ensure 22 rows total to match printed template and fill space
                const paddedItems = [...pr.items];
                while (paddedItems.length < 25) {
                  paddedItems.push({
                    id: `empty-${paddedItems.length}`,
                    itemNo: paddedItems.length + 1,
                    partNo: '',
                    description: '',
                    specification: '',
                    unit: '',
                    qty: 0,
                    unitPrice: 0,
                    total: 0
                  } as any);
                }

                return paddedItems.map((item, idx) => {
                  const isReal = idx < pr.items.length;
                  return (
                    <tr key={item.id || `pad-item-${idx}`} className="h-5 text-center text-[9.5px]">
                      <td className="border border-black p-0.5 font-mono text-slate-500">{isReal ? idx + 1 : ''}</td>
                      <td className="border border-black p-0.5 font-mono font-medium text-slate-800 text-left">
                        {isReal ? item.partNo : ''}
                      </td>
                      <td className="border border-black p-0.5 text-left font-medium text-black whitespace-pre-wrap break-words">
                        {isReal ? item.description : ''}
                        {isReal && item.specification && <span className="text-[8px] text-slate-500 block">Spec: {item.specification}</span>}
                      </td>
                      <td className="border border-black p-0.5 font-medium">{isReal ? item.unit : ''}</td>
                      <td className="border border-black p-0.5 font-mono font-bold text-black">
                        {isReal ? item.qty : ''}
                      </td>
                      <td className="border border-black p-0.5 text-right font-mono text-slate-800">
                        {isReal ? item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                      </td>
                      <td className="border border-black p-0.5 text-right font-mono font-bold text-black">
                        {isReal ? item.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                      </td>
                      <td className="border border-black p-0.5 text-left text-[8.5px] italic text-slate-700 font-medium whitespace-pre-wrap break-words">
                        {/* Only display objective in the first rows */}
                        {idx === 0 ? pr.purchaseObjective : ''}
                      </td>
                    </tr>
                  );
                });
              })()}
              {/* Grand Total row */}
              <tr className="h-6 bg-slate-50 font-black text-[10px]">
                <td colSpan={5} className="border border-black p-0.5 text-right uppercase pr-4">Grand Total</td>
                <td colSpan={2} className="border border-black p-0.5 text-right font-mono pr-2">
                  {pr.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="border border-black p-0.5 text-left font-sans pl-2">Bath.</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bottom Messages and Partitioned Signatures Section */}
        <div className="pt-2">
          <p className="text-[9.5px] text-slate-700 text-left italic font-semibold leading-relaxed mb-3">
            
          </p>

          {/* Official Partitioned Signature Boxes Grid */}
          <div className="grid grid-cols-2 border-2 border-black text-[9px]">
            {/* Box 1 (Left column): 1. Requested by & 2. Check By */}
            <div className="border-r border-black flex flex-col divide-y divide-black">
              {/* 1. Requested By */}
              <div className="p-1.5 text-left relative min-h-[65px] flex flex-col justify-end group">
                <button
                  onClick={() => setActiveStepSignatureTarget({ stepName: 'Pending Manager Approval', action: 'SUBMITTED', title: 'อัพโหลด / ลงนามลายเซนต์ (1. Requested by - พนักงานออกใบ PR)' })}
                  className="absolute top-1 right-1 no-print opacity-0 group-hover:opacity-100 transition-opacity px-2 py-0.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-[8px] font-bold flex items-center gap-1 shadow-xs cursor-pointer z-20"
                  title="อัพโหลดรูปหรือวาดลายเซนต์วางด้านบนชื่อ"
                >
                  ✍️ เซนต์/อัพโหลด
                </button>
                {(() => {
                  const submitLog = pr.workflowLogs.find(l => l.action === 'SUBMITTED');
                  const sig = submitLog?.signature;
                  if (!sig || !sig.signatureData) return null;
                  return (
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 z-10 pointer-events-none w-32 flex justify-center">
                      <div className="relative h-10 w-32 flex justify-center items-center">
                        {sig.companyStampData && (
                          <img 
                            src={sig.companyStampData} 
                            alt="Company Stamp" 
                            className="absolute h-10 object-contain opacity-60 mix-blend-multiply" 
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <img 
                          src={sig.signatureData} 
                          alt="Requester Signature" 
                          className="relative h-8 object-contain mix-blend-multiply" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>
                  );
                })()}
                <div className="flex items-end gap-2 mb-1">
                  <span className="font-bold shrink-0">1. Requested by :</span>
                  <span className="border-b border-black flex-1 text-center font-bold px-2 min-w-[100px]">{pr.requestorName}</span>
                  <span className="font-bold shrink-0 ml-1">Date :</span>
                  <span className="border-b border-black w-24 text-center font-bold">{pr.date}</span>
                </div>
              </div>

              {/* 2. Check By */}
              <div className="p-1.5 text-left relative min-h-[75px] flex flex-col justify-end group">
                <button
                  onClick={() => setActiveStepSignatureTarget({ stepName: 'Department Manager Approval', title: 'อัพโหลด / ลงนามลายเซนต์ (2. Check By - หัวหน้าแผนก)' })}
                  className="absolute top-1 right-1 no-print opacity-0 group-hover:opacity-100 transition-opacity px-2 py-0.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-[8px] font-bold flex items-center gap-1 shadow-xs cursor-pointer z-20"
                  title="อัพโหลดรูปหรือวาดลายเซนต์วางด้านบนชื่อ"
                >
                  ✍️ เซนต์/อัพโหลด
                </button>
                {(() => {
                  const checkLog = pr.workflowLogs.find(l => l.stepName === 'Department Manager Approval' && l.userRole !== UserRole.EXECUTIVE && l.performedBy !== 'SAT0608' && !l.userName?.includes('Liu Dong'));
                  const sig = checkLog?.signature;
                  if (!sig || !sig.signatureData) return null;
                  return (
                    <div className="absolute bottom-5 left-24 right-20 z-10 pointer-events-none flex justify-center items-center h-8">
                      <div className="relative h-8 w-32 flex justify-center items-center">
                        {sig.companyStampData && (
                          <img 
                            src={sig.companyStampData} 
                            alt="Company Stamp" 
                            className="absolute h-9 object-contain opacity-60 mix-blend-multiply" 
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <img 
                          src={sig.signatureData} 
                          alt="Dept Mgr Signature" 
                          className="relative h-8 object-contain mix-blend-multiply" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>
                  );
                })()}
                <div className="flex items-end gap-2 mb-1">
                  <span className="font-bold shrink-0">2. Check By :</span>
                  <span className="border-b border-black flex-1 text-center font-bold px-2 min-w-[100px]">
                    {(() => {
                      const log = pr.workflowLogs.find(l => l.stepName === 'Department Manager Approval' && l.userRole !== UserRole.EXECUTIVE && l.performedBy !== 'SAT0608' && !l.userName?.includes('Liu Dong'));
                      return log?.userName || ((pr.departmentId === 'DEP004' || pr.departmentId === 'Administration' || pr.departmentName?.includes('HR')) ? 'นางสาวเบ็ญจวรรณ ทิดชาติ' : ' ');
                    })()}
                  </span>
                  <span className="font-bold shrink-0 ml-1">Date :</span>
                  <span className="border-b border-black w-24 text-center font-bold">
                    {(() => {
                      const log = pr.workflowLogs.find(l => l.stepName === 'Department Manager Approval' && l.userRole !== UserRole.EXECUTIVE && l.performedBy !== 'SAT0608' && !l.userName?.includes('Liu Dong'));
                      const ts = log?.signature?.timestamp || log?.timestamp;
                      return ts ? ts.substring(0, 10) : ' ';
                    })()}
                  </span>
                </div>
              </div>
            </div>

        {/* Box 2 (Right column): 3. Approved boxes, Agent sign, Remark */}
            <div className="p-1.5 text-left flex flex-col justify-between relative min-h-[130px] group">
              <button
                onClick={() => setActiveStepSignatureTarget({ stepName: 'Executive Approval', title: 'อัพโหลด / ลงนามลายเซนต์ (3. Approved - Executive / MD)' })}
                className="absolute top-1 right-1 no-print opacity-0 group-hover:opacity-100 transition-opacity px-2 py-0.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-[8px] font-bold flex items-center gap-1 shadow-xs cursor-pointer z-20"
                title="อัพโหลดรูปหรือวาดลายเซนต์วางด้านบนชื่อ"
              >
                ✍️ เซนต์/อัพโหลด
              </button>
              <div>
                <span className="font-bold uppercase tracking-wider">3. Approved</span>
                <div className="flex gap-4 mt-1 font-bold text-[9px]">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" checked={pr.status === PRStatus.APPROVED || pr.status === PRStatus.PO_CREATED || pr.status === PRStatus.PENDING_PURCHASING} readOnly className="border-black rounded-none pointer-events-none h-2.5 w-2.5" />
                    <span>Approved</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" checked={pr.status === PRStatus.REJECTED} readOnly className="border-black rounded-none pointer-events-none h-2.5 w-2.5" />
                    <span>Disapproved</span>
                  </label>
                </div>
              </div>

              {/* Purchasing/Executive Signatures block inside approval section */}
              <div className="space-y-1 my-1 relative min-h-[50px] flex flex-col justify-end">
                {(() => {
                  const execLog = pr.workflowLogs.find(l => l.stepName === 'Executive Approval' || (l.stepName === 'Department Manager Approval' && (l.userRole === UserRole.EXECUTIVE || l.performedBy === 'SAT0608' || l.userName?.includes('Liu Dong'))));
                  const sig = execLog?.signature;
                  const signatureSrc = sig?.signatureData || ((pr.status === PRStatus.APPROVED || pr.status === PRStatus.PO_CREATED || execLog) ? 'https://lh3.googleusercontent.com/d/1Xmp1Qv2v5BZaL4csdRD_22CBTENKo_1I' : null);

                  if (signatureSrc) {
                    return (
                      <div className="absolute bottom-5 left-24 right-20 z-10 pointer-events-none flex justify-center items-center h-12">
                        {sig?.companyStampData && (
                          <img 
                            src={sig.companyStampData} 
                            alt="Company Stamp" 
                            className="absolute h-10 object-contain opacity-60 mix-blend-multiply" 
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <img 
                          src={signatureSrc} 
                          alt="Executive Signature" 
                          className="h-[2cm] w-[2cm] object-contain mix-blend-multiply relative" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    );
                  }
                  return null;
                })()}
                <div className="flex items-end gap-2 mb-1">
                  <span className="font-bold shrink-0">Executive / MD :</span>
                  <span className="border-b border-black flex-1 text-center font-bold px-2 min-w-[100px]">
                    {(() => {
                      const log = pr.workflowLogs.find(l => l.stepName === 'Executive Approval' || (l.stepName === 'Department Manager Approval' && (l.userRole === UserRole.EXECUTIVE || l.performedBy === 'SAT0608' || l.userName?.includes('Liu Dong'))));
                      return log?.userName || (pr.status === PRStatus.APPROVED ? 'Mr. Liu Dong' : ' ');
                    })()}
                  </span>
                  <span className="font-bold shrink-0 ml-1">Date :</span>
                  <span className="border-b border-black w-24 text-center font-bold">
                    {(() => {
                      const log = pr.workflowLogs.find(l => l.stepName === 'Executive Approval' || (l.stepName === 'Department Manager Approval' && (l.userRole === UserRole.EXECUTIVE || l.performedBy === 'SAT0608' || l.userName?.includes('Liu Dong'))));
                      const ts = log?.signature?.timestamp || log?.timestamp;
                      return ts ? ts.substring(0, 10) : (pr.status === PRStatus.APPROVED ? pr.date : ' ');
                    })()}
                  </span>
                </div>
              </div>

              <div className="border-t border-black pt-1 mt-1">
                <p className="text-[8px] font-black text-slate-800 leading-tight">
                  Remark : Approve by 1 or 2 Person of Organization each Department.
                </p>
              </div>
            </div>

            {/* Box 3 (Bottom row - full width): 4. For Purchasing Dept. */}
            <div className="col-span-2 border-t border-black p-1.5 text-left relative group">
              <button
                onClick={() => setActiveStepSignatureTarget({ stepName: 'Purchasing Check', title: 'อัพโหลด / ลงนามลายเซนต์ (4. For Purchasing Dept.)' })}
                className="absolute top-1 right-1 no-print opacity-0 group-hover:opacity-100 transition-opacity px-2 py-0.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-[8px] font-bold flex items-center gap-1 shadow-xs cursor-pointer z-20"
                title="อัพโหลดรูปหรือวาดลายเซนต์วางด้านบนชื่อ"
              >
                ✍️ เซนต์/อัพโหลด
              </button>
              <span className="font-bold uppercase tracking-wider block mb-0.5">4. For Purchasing Dept.</span>
              <div className="flex items-center gap-20 mt-1 text-[9px]">
                <span className="font-bold">Received Date : <span className="border-b border-black w-32 inline-block text-center">
                  {(() => {
                    const log = pr.workflowLogs.find(l => l.stepName === 'Purchasing Check');
                    const ts = log?.signature?.timestamp || log?.timestamp;
                    return ts ? ts.substring(0, 10) : ((pr.status === PRStatus.APPROVED || pr.status === PRStatus.PO_CREATED) ? pr.date : '...........................................');
                  })()}
                </span></span>
                
                <div className="flex items-center gap-2 relative">
                  <span className="font-bold">Check By :</span>
                  <div className="border-b border-black w-40 h-8 relative flex items-center justify-center">
                    {(() => {
                      const purLog = pr.workflowLogs.find(l => l.stepName === 'Purchasing Check');
                      const sig = purLog?.signature;
                      if (!sig || !sig.signatureData) return <span className="text-slate-300">...........................................</span>;
                      return (
                        <div className="absolute bottom-1 left-0 w-full flex justify-center items-center h-8 pointer-events-none">
                          {sig.companyStampData && (
                            <img src={sig.companyStampData} alt="Stamp" className="absolute h-9 object-contain opacity-60 mix-blend-multiply" referrerPolicy="no-referrer" />
                          )}
                          <img 
                            src={sig.signatureData} 
                            alt="Purchasing Signature" 
                            className="h-8 object-contain mix-blend-multiply relative" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Revision and Date stamp */}
        <div className="mt-auto flex justify-end items-end text-[8.5px] text-slate-800 font-bold pt-4">
          <div className="text-right">
            <p>F-GA-001 Rev:02</p>
            <p>Effective date:01 Jul'21</p>
          </div>
        </div>
      </div>

        {/* Attachments Section */}
        <div className="p-6 border-b border-slate-200 no-print bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Paperclip className="h-4 w-4 text-sky-600" />
              Linked Quotation Documents & Attachments (เอกสารแนบประกอบ)
            </h4>

            {(() => {
              const isRequestor = currentUser && (
                currentUser.id === pr.requestorId ||
                currentUser.email === pr.requestorEmail ||
                currentUser.name === pr.requestorName ||
                currentUser.employeeId === pr.requestorId ||
                (currentUser.thaiName && pr.requestorName && currentUser.thaiName.includes(pr.requestorName))
              );

              const canEditPR = currentUser && (
                isRequestor ||
                currentUser.role === UserRole.ADMINISTRATOR ||
                currentUser.employeeId === '43210344' ||
                currentUser.role === UserRole.ASSISTANT_MANAGER ||
                currentUser.role === UserRole.DEPARTMENT_MANAGER
              );

              if (!canEditPR) return null;

              return (
                <label className="text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs self-start sm:self-auto">
                  <Upload className="h-3.5 w-3.5" />
                  <span>+ แนบเอกสารเพิ่ม (Attach File)</span>
                  <input 
                    type="file" 
                    multiple 
                    onChange={async (e) => {
                      if (!e.target.files || e.target.files.length === 0) return;
                      const files: File[] = Array.from(e.target.files);
                      const newAttachments: Attachment[] = [];
                      for (const file of files) {
                        const base64Url = await new Promise<string>((resolve) => {
                          const reader = new FileReader();
                          reader.onload = () => resolve(reader.result as string);
                          reader.readAsDataURL(file);
                        });
                        newAttachments.push({
                          id: `ATT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                          fileName: file.name,
                          fileSize: file.size,
                          fileType: file.type || 'application/octet-stream',
                          uploadedAt: new Date().toISOString(),
                          uploadedBy: currentUser?.name || 'Requestor',
                          url: base64Url
                        });
                      }
                      const updated = [...(pr.attachments || []), ...newAttachments];
                      try {
                        const res = await fetch(`/api/pr/${pr.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ attachments: updated })
                        });
                        if (res.ok) {
                          alert('แนบเอกสารสำเร็จเรียบร้อย!');
                          if (onStatusUpdate) {
                            onStatusUpdate(pr.id, pr.status);
                          } else {
                            window.location.reload();
                          }
                        }
                      } catch (err) {
                        alert('เกิดข้อผิดพลาดในการแนบเอกสาร');
                      }
                    }} 
                    className="hidden" 
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                  />
                </label>
              );
            })()}
          </div>

          {pr.attachments && pr.attachments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {pr.attachments.map((file, idx) => (
                <div key={file.id || `att-${idx}`} className="flex justify-between items-center border border-slate-200 p-3 rounded-xl bg-slate-50 hover:bg-slate-100/60 transition-colors">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="p-2 bg-white text-slate-700 border border-slate-200 rounded-lg shadow-2xs">
                      <FileText className="h-4.5 w-4.5" />
                    </div>
                    <div className="text-left overflow-hidden">
                      <p className="text-xs font-semibold text-slate-800 truncate max-w-[200px]" title={file.fileName}>
                        {file.fileName}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {(file.fileSize / 1024).toFixed(1)} KB • {file.uploadedBy}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        openFileInNewTab(file.url, file.fileName);
                        setPreviewFile({ fileName: file.fileName, fileUrl: file.url });
                      }}
                      className="text-sky-600 hover:text-sky-800 p-1.5 bg-white border border-sky-100 hover:border-sky-300 hover:bg-sky-50 rounded-lg transition-colors shadow-2xs flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Preview
                    </button>
                    <a
                      href={file.url || '#'}
                      download={file.fileName}
                      className="text-slate-500 hover:text-sky-600 p-1.5 bg-white border border-slate-200 hover:border-sky-300 hover:bg-sky-50 rounded-lg transition-colors shadow-2xs flex items-center gap-1 text-[10px] font-bold"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Save
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-500 font-medium">ยังไม่มีเอกสารแนบสำหรับใบขอซื้อนี้</p>
              <p className="text-[11px] text-slate-400 mt-1">คนออก PR หรือผู้จัดการสามารถกด "+ แนบเอกสารเพิ่ม" เพื่ออัปโหลดใบเสนอราคาหรือไฟล์ประกอบได้</p>
            </div>
          )}
        </div>

        {/* Workflow Log History (Audit Trail) */}
        <div className="p-6 bg-white no-print">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <ShieldCheck className="h-4.5 w-4.5 text-sky-600" />
            Audit Log Workflow Activity Tracking
          </h4>
          <div className="relative border-l-2 border-slate-100 pl-4 space-y-6">
            {pr.workflowLogs.map((log, idx) => (
              <div key={log.id || log.stepName || `log-${idx}`} className="relative">
                {/* Visual Bullet */}
                <div className={`absolute -left-[25px] top-1 h-3 w-3 rounded-full border-2 ${
                  log.action === 'APPROVED' ? 'bg-emerald-500 border-emerald-200' :
                  log.action === 'REJECTED' ? 'bg-rose-500 border-rose-200' : 'bg-slate-500 border-slate-200'
                }`} />

                <div className="space-y-1 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-800">{log.stepName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{log.timestamp.replace('T', ' ').substring(0, 19)}</span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    <span className="font-semibold text-slate-800">{log.userName}</span> ({log.userRole}) : <span className="italic">"{log.comment || 'No feedback comment.'}"</span>
                  </div>

                  {log.signature && (
                    <div className="bg-slate-50 p-2.5 rounded border border-slate-100 font-mono text-[9px] text-slate-500 mt-2 space-y-0.5 max-w-xl">
                      <div className="flex justify-between">
                        <span>IP ROUTE: {log.signature.ipAddress}</span>
                        <span>DEVICE: {log.signature.device}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>GPS COORDINATES: {log.signature.geoCoordinates || 'N/A'}</span>
                        <span className="truncate max-w-[200px]" title={log.signature.digitalHash}>SHA-256 CHECK: {log.signature.digitalHash.substring(0, 16)}...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      {/* Interactive Reviewer Sign-Off Box (Only visible to Authorized Role) */}
      {canApprove() && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white space-y-4 no-print shadow-xl">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-sky-400" />
            <div>
              <h3 className="text-sm font-bold tracking-tight">Enterprise Electronic Review Attestation</h3>
              <p className="text-[10px] text-slate-400">You are logged in as {currentUser.name} ({currentUser.title}). Digitally attest to this requisition.</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Approval Comment / Auditor Note:</label>
            <input
              type="text"
              placeholder="e.g. Approved. Budget verified and items validated for modeling project..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              id="txt-comment-pr"
            />
          </div>

          <div className="flex gap-2.5 justify-end">
            <button
              onClick={() => openSignatureFlow(true)}
              className="px-4 py-2 text-xs font-semibold bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600 hover:text-white rounded-lg transition-all flex items-center gap-1"
              id="btn-reject-pr"
            >
              <X className="h-4 w-4" />
              Reject PR
            </button>
            <button
              onClick={() => openSignatureFlow(false)}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-1.5 shadow-md hover:scale-102 active:scale-98"
              id="btn-approve-pr"
            >
              <Check className="h-4 w-4" />
              {pr.status === PRStatus.PENDING_PURCHASING ? 'Sign & Validate (Purchasing Check)' : pr.status === PRStatus.PENDING_DEPT_MGR ? 'Sign & Route to Executive Management (Management E-Sign)' : pr.status === PRStatus.PENDING_EXECUTIVE ? 'Sign & Approve Executive (Mr. Liu Dong / Mr. Yoshiyuki)' : 'Sign & Approve Requisition'}
            </button>
          </div>
        </div>
      )}

      {/* Sandbox helper block shown when user is not authorized to sign this step */}
      {!canApprove() && [PRStatus.PENDING_DEPT_MGR, PRStatus.PENDING_EXECUTIVE, PRStatus.PENDING_PURCHASING].includes(pr.status) && (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-5 no-print shadow-xs text-left">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-slate-100 text-slate-600 rounded-lg mt-0.5">
              <Lock className="h-4.5 w-4.5" />
            </div>
            <div className="space-y-3 flex-1">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Workflow Gate: E-Sign & Stamp Attestation Required
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  {pr.status === PRStatus.PENDING_DEPT_MGR && (
                    <span>
                      This PR is currently waiting for <strong>Department Manager review & signature</strong>. 
                      Authorized managers: <strong>Miss Thitaporn Jareonwong (SAT0011)</strong>, <strong>Mr. Thanawuth (SAT0247)</strong>, or any Administrator.
                    </span>
                  )}
                  {pr.status === PRStatus.PENDING_EXECUTIVE && (
                    <span>
                      This PR has been routed and is currently waiting for <strong>Executive Management E-Sign & Stamp Attestation</strong>. 
                      Authorized executives: <strong>Mr. Liu Dong (SAT0608 / Managing Director)</strong> or <strong>Mr. Yoshiyuki Konishi (SAT0615 / Plant Manager)</strong>.
                    </span>
                  )}
                  {pr.status === PRStatus.PENDING_PURCHASING && (
                    <span>
                      This PR is currently waiting for <strong>Purchasing Check & Validation</strong>.
                      Authorized: <strong>Purchasing Officers</strong>, <strong>HR/GA Managers</strong>, or any Administrator.
                    </span>
                  )}
                </p>
              </div>

              {/* Quick-Switch Sandbox Options inside the block */}
              <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center gap-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block w-full mb-1">
                  💡 Sandbox simulation: Quick route / Sign as authorized user
                </span>
                
                {pr.status === PRStatus.PENDING_DEPT_MGR && (
                  <button
                    onClick={() => openSignatureFlow(false)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 hover:scale-101 active:scale-99 cursor-pointer shadow-xs"
                  >
                    <Send className="h-3 w-3 text-sky-400" />
                    Sign as Dept Manager & Route to Executive Management (Touchpad E-Sign)
                  </button>
                )}

                {pr.status === PRStatus.PENDING_EXECUTIVE && (
                  <button
                    onClick={() => openSignatureFlow(false)}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 hover:scale-101 active:scale-99 cursor-pointer shadow-xs"
                  >
                    <Check className="h-3 w-3" />
                    ผู้บริหารลงนาม / ประทับตรา (Executive Touchpad Sign & Stamp Upload)
                  </button>
                )}

                {pr.status === PRStatus.PENDING_PURCHASING && (
                  <button
                    onClick={() => openSignatureFlow(false)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 hover:scale-101 active:scale-99 cursor-pointer shadow-xs"
                  >
                    <Check className="h-3 w-3" />
                    Sign & Approve as Purchasing Check (Touchpad Sign)
                  </button>
                )}

                <span className="text-[9px] text-slate-400 italic">
                  (Or click the profile avatar dropdown in the upper header/sidebar to fully login and sign with a signature pad)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Purchasing Agent - Generate PO box */}
      {canCreatePO() && (
        <div className="bg-gradient-to-r from-sky-900 to-slate-950 border border-sky-950 text-white rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print shadow-xl">
          <div className="space-y-1 text-left">
            <h3 className="text-sm font-bold tracking-tight text-sky-300 flex items-center gap-1.5">
              <FileText className="h-5 w-5" />
              ดำเนินการจัดซื้อและการเสนอราคาเปรียบเทียบ (CS)
            </h3>
            <p className="text-[10px] text-slate-400 max-w-md">
              เอกสารขอซื้อได้รับการอนุมัติเรียบร้อยแล้ว ท่านสามารถเลือกออกใบสั่งซื้อ (PO) ทันที หรือวิเคราะห์ข้อเสนอเปรียบเทียบราคาผู้ขายเพื่อเลือกราคาดีที่สุดก่อนออกใบสั่งซื้ออัตโนมัติ
            </p>
          </div>
          <div className="flex gap-2">
            {onNavigate && (
              <button
                onClick={() => onNavigate('comparison')}
                className="px-4 py-2.5 bg-sky-700 hover:bg-sky-600 text-white border border-sky-600 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Scale className="h-4 w-4" />
                ทำใบเปรียบเทียบราคา (CS)
              </button>
            )}
            <button
              onClick={openPOGenerationFlow}
              className="px-5 py-2.5 bg-white text-slate-900 hover:bg-sky-50 rounded-lg font-bold text-xs transition-all tracking-wide shadow-md hover:scale-102 active:scale-98 shrink-0"
              id="btn-generate-po"
            >
              ออก PO ทันที
            </button>
          </div>
        </div>
      )}

      {/* Signature Pad Overlap Modal */}
      {showSigPad && (
        <SignaturePad
          onSave={handleSignatureSaved}
          onCancel={() => setShowSigPad(false)}
          title={
            isGeneratingPO
              ? 'Attest PO Issuance Signature (Issued By)'
              : isRejectAction
              ? 'Attest Rejection Signature'
              : pr.status === PRStatus.PENDING_EXECUTIVE
              ? 'ผู้บริหารลงนาม / ประทับตรา (Executive Touchpad Sign & Stamp Upload - Mr. Liu Dong / Yoshiyuki Konishi)'
              : pr.status === PRStatus.PENDING_DEPT_MGR
              ? 'Department Manager Touchpad Sign & Approval'
              : 'Purchasing Check Touchpad Sign & Complete Verification'
          }
          isExecutive={currentUser.role === UserRole.EXECUTIVE || pr.status === PRStatus.PENDING_EXECUTIVE}
        />
      )}

      {activeStepSignatureTarget && (
        <SignaturePad
          onSave={handleStepSignatureSaved}
          onCancel={() => setActiveStepSignatureTarget(null)}
          title={activeStepSignatureTarget.title}
          isExecutive={activeStepSignatureTarget.stepName === 'Executive Approval'}
        />
      )}

      {/* Document Preview Modal */}
      {previewFile && (
        <DocumentPreviewModal
          fileName={previewFile.fileName}
          fileUrl={previewFile.fileUrl}
          onClose={() => setPreviewFile(null)}
          vendorName={pr.vendorName}
          vendorAddress={pr.vendorAddress}
          vendorPhone={pr.vendorPhone}
          items={pr.items}
          subtotal={pr.subtotal}
          vat={pr.vat}
          grandTotal={pr.grandTotal}
          documentDate={pr.date}
          documentNumber={pr.prNumber}
          companyName={pr.companyName}
        />
      )}

      {/* Complete print package document */}
      <ProcessPackagePrint pr={pr} po={relatedPO} capex={relatedCapex} />
    </div>
  );
}
