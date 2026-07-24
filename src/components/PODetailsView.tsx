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
  ShieldCheck, 
  UploadCloud, 
  FileText, 
  Download,
  Mail,
  CheckCircle,
  Clock,
  Briefcase,
  Eye,
  Trash2
} from 'lucide-react';
import { PO, User, UserRole, POStatus, PR } from '../types.js';
import { deletePoApi, updatePoStepSignatureApi } from '../lib/apiClient.js';
import SignaturePad from './SignaturePad.js';
import DocumentPreviewModal, { openFileInNewTab } from './DocumentPreviewModal.js';
import ProcessPackagePrint from './ProcessPackagePrint.js';

interface PODetailsViewProps {
  po: PO;
  currentUser: User;
  onApprove: (id: string, isReject: boolean, comment: string, signatureData: string, companyStampData?: string, geoCoordinates?: string) => void;
  onSendVendor: (id: string) => void;
  onUploadDocs: (id: string, invoiceUrl?: string, deliveryUrl?: string) => void;
  onCloseJob: (id: string) => void;
  onIssue?: (id: string, signatureData: string, companyStampData?: string, geoCoordinates?: string) => void;
  onCancel: () => void;
}

export default function PODetailsView({ 
  po, 
  currentUser, 
  onApprove, 
  onSendVendor, 
  onUploadDocs, 
  onCloseJob, 
  onIssue,
  onCancel 
}: PODetailsViewProps) {
  const [showSigPad, setShowSigPad] = useState(false);
  const [activeStepSignatureTarget, setActiveStepSignatureTarget] = useState<{ stepName: string; action?: string; title: string } | null>(null);
  const [isRejectAction, setIsRejectAction] = useState(false);
  const [isIssueAction, setIsIssueAction] = useState(false);
  const [comment, setComment] = useState('');
  const [invoiceBase64, setInvoiceBase64] = useState(po.invoiceUrl || '');
  const [deliveryBase64, setDeliveryBase64] = useState(po.deliveryUrl || '');

  const handleStepSignatureSaved = async (signatureData: string, companyStampData?: string, geoCoordinates?: string) => {
    if (!activeStepSignatureTarget) return;
    try {
      const success = await updatePoStepSignatureApi(
        po.id,
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
      console.error(e);
    }
  };
  const [previewFile, setPreviewFile] = useState<{ fileName: string, fileUrl: string } | null>(null);

  // Package printing states
  const [relatedPR, setRelatedPR] = useState<PR | null>(null);
  const [relatedCapex, setRelatedCapex] = useState<any | null>(null);
  const [isPrintPackageMode, setIsPrintPackageMode] = useState(false);

  useEffect(() => {
    const fetchRelatedDocs = async () => {
      try {
        // Fetch matching PR
        if (po.referPrId) {
          const prRes = await fetch(`/api/pr/${po.referPrId}`);
          if (prRes.ok) {
            const foundPR = await prRes.json();
            setRelatedPR(foundPR);
            
            // Fetch matching CAPEX using PR info
            const capexRes = await fetch('/api/capex');
            if (capexRes.ok) {
              const capexList: any[] = await capexRes.json();
              const foundCapex = capexList.find(c => 
                c.departmentId === foundPR.departmentId || 
                c.projectName === foundPR.projectName ||
                c.requestorId === foundPR.requestorId
              );
              if (foundCapex) setRelatedCapex(foundCapex);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching related docs in PO details:", err);
      }
    };
    fetchRelatedDocs();
  }, [po.referPrId]);

  const handlePrintPackage = () => {
    setIsPrintPackageMode(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        setIsPrintPackageMode(false);
      }, 500);
    }, 150);
  };

  // Master Admin edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editCreditTerm, setEditCreditTerm] = useState(po.creditTerm || '30 Days');
  const [editShippingAddress, setEditShippingAddress] = useState(po.shippingAddress || '');
  const [editNotes, setEditNotes] = useState(po.notes || '');
  const [editItems, setEditItems] = useState(po.items);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/po/${po.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creditTerm: editCreditTerm,
          shippingAddress: editShippingAddress,
          notes: editNotes,
          items: editItems
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to save PO modifications');
      }
      setIsEditing(false);
      alert('แก้ไขใบสั่งซื้อสำเร็จเรียบร้อย!');
      window.location.reload();
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

  const openSignatureFlow = (isReject: boolean, isIssue: boolean = false) => {
    setIsRejectAction(isReject);
    setIsIssueAction(isIssue);
    setShowSigPad(true);
  };

  const handleSignatureSaved = (signatureData: string, companyStampData?: string, geoCoordinates?: string) => {
    if (isIssueAction && onIssue) {
      onIssue(po.id, signatureData, companyStampData, geoCoordinates);
    } else {
      onApprove(po.id, isRejectAction, comment, signatureData, companyStampData, geoCoordinates);
    }
    setShowSigPad(false);
    setComment('');
    setIsIssueAction(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'invoice' | 'delivery') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64Url = reader.result as string;
      if (type === 'invoice') {
        setInvoiceBase64(base64Url);
        onUploadDocs(po.id, base64Url, undefined);
      } else {
        setDeliveryBase64(base64Url);
        onUploadDocs(po.id, undefined, base64Url);
      }
    };
    reader.readAsDataURL(file);
  };

  const canApprove = () => {
    if (po.status === POStatus.PENDING_PURCHASING_MGR && (currentUser.role === UserRole.PURCHASING_MANAGER || currentUser.role === UserRole.ASSISTANT_MANAGER)) {
      return true;
    }
    if (po.status === POStatus.PENDING_EXECUTIVE && currentUser.role === UserRole.EXECUTIVE) {
      return true;
    }
    return false;
  };

  const canIssue = () => {
    // Only Purchasing or Asst Manager can issue the PO
    if (!isPurchasingAgent() && currentUser.role !== UserRole.ASSISTANT_MANAGER) return false;
    
    // Can only issue if it's in DRAFT status or unsigned in PENDING_PURCHASING_MGR
    if (po.status !== POStatus.DRAFT && po.status !== POStatus.PENDING_PURCHASING_MGR) return false;
    
    // Check if it already has an "Issued" signature in logs
    const hasIssuedSig = po.workflowLogs.some(l => l.action === 'CREATED' && l.signature?.signatureData);
    return !hasIssuedSig;
  };

  const isPurchasingAgent = () => {
    return currentUser.role === UserRole.PURCHASING || currentUser.departmentId === 'DEP004';
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
          {currentUser && (currentUser.employeeId === '43210344' || currentUser.role === UserRole.ADMINISTRATOR) && (
            <>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs font-semibold text-white flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 px-3.5 py-1.5 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <FileText className="h-4 w-4" />
                {isEditing ? 'ปิดการแก้ไข' : 'แก้ไขใบสั่งซื้อ (Edit PO)'}
              </button>
              <button
                onClick={async () => {
                  if (window.confirm('คุณต้องการลบใบสั่งซื้อ (PO) นี้อย่างถาวรใช่หรือไม่?')) {
                    try {
                      await deletePoApi(po.id);
                      alert('ลบเอกสารใบสั่งซื้อสำเร็จ');
                      onCancel();
                    } catch (err: any) {
                      alert(err.message || 'เกิดข้อผิดพลาดในการลบ');
                    }
                  }
                }}
                className="text-xs font-semibold text-white flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 px-3.5 py-1.5 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                ลบใบสั่งซื้อ (Delete PO)
              </button>
            </>
          )}

          {relatedPR && (
            <button
              onClick={handlePrintPackage}
              className="text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 flex items-center gap-1.5 border border-slate-700 px-3.5 py-1.5 rounded-lg transition-colors shadow-md"
              title="พิมพ์เอกสารขอซื้อ (PR) + ใบสั่งซื้อ (PO) + ใบเสนอราคา (Quotation) + CAPEX ทั้งหมดออกมาในไฟล์เดียว"
            >
              <Printer className="h-4 w-4" />
              พิมพ์ชุดเอกสารครบวงจร (PDF 100%)
            </button>
          )}

          <button
            onClick={handlePrint}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 border border-slate-200 px-3.5 py-1.5 bg-white rounded-lg transition-colors shadow-xs"
          >
            <Printer className="h-4 w-4" />
            Print PO (A4)
          </button>
        </div>
      </div>

      {/* Master Admin Edit Panel */}
      {isEditing && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 text-left space-y-6 no-print shadow-xl animate-in fade-in zoom-in duration-200 max-w-4xl mx-auto">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wider">Master Admin Document Editor</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">คุณสามารถแก้ไขเครดิตเทอม ข้อตกลง ที่อยู่จัดส่ง และตารางพัสดุสำหรับใบสั่งซื้อ {po.poNumber} ได้โดยตรง</p>
            </div>
            <button
              onClick={() => setIsEditing(false)}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">เครดิตการค้า (Credit Term)</label>
                <input
                  type="text"
                  value={editCreditTerm}
                  onChange={(e) => setEditCreditTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-sky-500 outline-none font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">สถานที่ส่งมอบสิ่งของ (Shipping Address)</label>
                <input
                  type="text"
                  value={editShippingAddress}
                  onChange={(e) => setEditShippingAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-sky-500 outline-none font-medium text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">เงื่อนไขการส่งสินค้าและการชำระเงิน (Notes / Terms)</label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={3}
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
                            className="text-rose-500 hover:text-rose-700 p-1 rounded-md hover:bg-rose-50 transition-colors"
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
          <span className="text-xs font-bold text-slate-800">A4 Purchase Order Form ({po.poNumber})</span>
        </div>
        <button
          onClick={handlePrint}
          id="btn-print-po-doc"
          className="text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-colors shadow-sm cursor-pointer"
          title="Print this A4 Purchase Order document"
        >
          <Printer className="h-4 w-4" />
          <span>Print PO Document</span>
        </button>
      </div>

      {/* Corporate A4 PO Document Frame */}
      <div className="bg-white border border-black p-6 font-sans relative text-black text-xs shadow-lg overflow-hidden print:border-none print:shadow-none print:p-0 rounded-b-none" id="printable-po-doc" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', boxSizing: 'border-box' }}>
        
        {/* Verification stamp based on status */}
        {po.status === POStatus.CLOSED && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-12 border-4 border-emerald-600/30 text-emerald-600/30 font-bold px-8 py-3 rounded-xl text-3xl uppercase tracking-widest font-sans select-none pointer-events-none no-print">
            JOB CLOSED
          </div>
        )}
        {po.status === POStatus.SENT_TO_VENDOR && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-12 border-4 border-blue-600/30 text-blue-600/30 font-bold px-8 py-3 rounded-xl text-3xl uppercase tracking-widest font-sans select-none pointer-events-none no-print">
            DISPATCHED TO VENDOR
          </div>
        )}

        {/* Corporate Header */}
        <div className="mb-2">
          <div className="flex justify-between items-start">
            <div className="space-y-0.5 text-left text-[10px]">
              <h1 className="text-[11px] font-bold text-black">SUMINO AAPICO (Thailand) Company Limited (Head Office)</h1>
              <p>700/706 Moo 3, T. Bankao, A. Panthong, Chonburi 20160</p>
              <p>Tel: 66-38-447-628-31, Fax No. 66-38-447-632</p>
              <p className="font-bold">Tax No. 0-2055-56012-44-8</p>
            </div>
            <div className="text-right text-[10px] space-y-4 pt-1">
              <p className="flex justify-end items-center">
                <span className="font-medium">Page :</span>
                <span className="w-16 inline-block text-center ml-1">1 / 1</span>
              </p>
              <p className="flex justify-end items-center">
                <span className="font-medium">CAPRE NO :</span>
                <span className="w-24 inline-block ml-1"></span>
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mb-4">
          <h2 className="text-base font-bold text-black tracking-widest">PURCHASE ORDER</h2>
        </div>

        {/* PO Info Section */}
        <div className="flex justify-between items-start mb-2 px-2">
          <div className="text-left text-[10px] space-y-2 w-3/5">
            <div className="flex gap-1">
              <span className="font-bold whitespace-nowrap">Shipping Address:</span>
              <span className="font-bold">SUMINO AAPICO (Thailand) Co.,Ltd.</span>
            </div>
            {/* Added Vendor Info as it is standard, but keeping it minimal to match the clean look */}
            <div className="pt-2 space-y-1">
              <div className="flex gap-1">
                <span className="font-bold w-16 uppercase">Vender Name :</span>
                <span className=" flex-1 font-bold">{po.vendorName}</span>
              </div>
              <div className="flex gap-1">
                <span className="font-bold w-16 uppercase"> </span>
                <span className=" flex-1">{po.vendorAddress}</span>
              </div>
            </div>
          </div>
          <div className="w-1/3">
            <table className="w-full border-collapse border border-black text-[10px]">
              <thead>
                <tr className="text-center font-bold">
                  <th className="border border-black px-2 py-1 bg-white">P/O No.</th>
                  <th className="border border-black px-2 py-1 bg-white">Date</th>
                </tr>
              </thead>
              <tbody>
                <tr className="text-center h-8 font-bold">
                  <td className="border border-black px-2 py-1">{po.poNumber}</td>
                  <td className="border border-black px-2 py-1">{po.date}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end mb-2 pr-2">
          <div className="text-[10px] space-y-1 text-right w-full max-w-[220px]">
            <div className="flex justify-between items-center gap-2">
              <span className="font-bold">Credit Term:</span>
              <span className=" flex-1 text-center font-bold">{po.creditTerm}</span>
            </div>
            <div className="flex justify-between items-center gap-2 mt-4">
              <span className="font-bold">Refer P/R No :</span>
              <span className=" flex-1 text-center font-bold">{po.referPrNumber}</span>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="font-bold">Dept.Order :</span>
              <span className=" flex-1 text-center font-bold">{po.departmentName}</span>
            </div>
          </div>
        </div>

        {/* Item List Table */}
        <div className="mb-4">
          <table className="w-full text-[10px] text-left border-collapse border border-black">
            <thead>
              <tr className="text-[9px] font-bold text-black uppercase text-center h-10">
                <th className="border border-black p-1 w-10">Item</th>
                <th className="border border-black p-1">Description</th>
                <th className="border border-black p-1 w-16">Request <br/> Date</th>
                <th className="border border-black p-1 w-12">Unit</th>
                <th className="border border-black p-1 w-12">Qty</th>
                <th className="border border-black p-1 w-24">Unit Price(Baht)</th>
                <th className="border border-black p-1 w-28">Amount(Baht)</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const paddedItems = [...po.items];
                const rowsCount = 25; // Increase to match the large empty area in the screenshot
                while (paddedItems.length < rowsCount) {
                  paddedItems.push({
                    id: `empty-${paddedItems.length}`,
                    itemNo: paddedItems.length + 1,
                    description: '',
                    unit: '',
                    qty: 0,
                    unitPrice: 0,
                    total: 0
                  } as any);
                }

                return paddedItems.map((item, idx) => {
                  const isReal = idx < po.items.length;
                  return (
                    <tr key={item.id || `pad-item-${idx}`} className="h-6 text-center">
                      <td className="border-x border-black p-1">{isReal ? idx + 1 : ''}</td>
                      <td className="border-x border-black p-1 text-left px-2">{isReal ? item.description : ''}</td>
                      <td className="border-x border-black p-1"></td>
                      <td className="border-x border-black p-1">{isReal ? item.unit : ''}</td>
                      <td className="border-x border-black p-1">{isReal ? item.qty : ''}</td>
                      <td className="border-x border-black p-1 text-right pr-2">
                        {isReal ? item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                      </td>
                      <td className="border-x border-black p-1 text-right pr-2">
                        {isReal ? item.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (idx === 0 ? '-' : '')}
                      </td>
                    </tr>
                  );
                });
              })()}
              
              {/* Calculations rows */}
              <tr>
                <td colSpan={5} rowSpan={3} className="border border-black p-2 text-left align-top text-[10px]">
                  <div className="font-bold">Notes:</div>
                  <div className="space-y-0.5 mt-1">
                    <p>1. Delivery: After receive of PO</p>
                    <p>2.Payment term: 30 Days after receiving billing note</p>
                    <p>3.Place of shipment: At Sumino aapico (Thailand) factory</p>
                  </div>
                </td>
                <td className="border border-black p-1 font-bold text-left px-2">Total</td>
                <td className="border border-black p-1 text-right font-bold pr-2 bg-white">
                  {po.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
              <tr>
                <td className="border border-black p-1 font-bold text-left px-2">VAT 7%</td>
                <td className="border border-black p-1 text-right font-bold pr-2 bg-white">
                  {po.vat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
              <tr>
                <td className="border border-black p-1 font-bold text-left px-2">Grand Total</td>
                <td className="border border-black p-1 text-right font-bold pr-2 bg-white">
                  {po.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Signature Box Grid */}
        <div className="mt-8">
          <div className="grid grid-cols-4 text-left text-[10px]">
            {/* Box 1: Issued By */}
            <div className="p-1.5 flex flex-col min-h-[80px] relative group">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold underline">Issued By :</span>
                <button
                  onClick={() => setActiveStepSignatureTarget({ stepName: 'Issued', action: 'CREATED', title: 'อัพโหลด / ลงนามลายเซนต์ Issued By' })}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-[8px] bg-sky-600 hover:bg-sky-500 text-white px-1.5 py-0.5 rounded shadow flex items-center gap-1 font-sans"
                >
                  <span>✍️ เซนต์/อัพโหลด</span>
                </button>
              </div>
              <div className="mt-auto relative">
                {(() => {
                  const createdLog = po.workflowLogs.find(l => l.action === 'CREATED');
                  const sig = createdLog?.signature;
                  if (sig && sig.signatureData) {
                    return (
                      <div className="absolute bottom-6 left-0 w-full flex justify-center items-center h-8">
                        {sig.companyStampData && (
                          <img src={sig.companyStampData} alt="Company Stamp" className="absolute h-10 object-contain opacity-60 mix-blend-multiply" referrerPolicy="no-referrer" />
                        )}
                        <img src={sig.signatureData} alt="Issued Signature" className="relative h-8 object-contain mix-blend-multiply" referrerPolicy="no-referrer" />
                      </div>
                    );
                  }
                  // If no signature, show placeholder if current user can sign
                  if (po.status === 'DRAFT' && (currentUser.role === 'PURCHASING' || currentUser.role === 'ASSISTANT_MANAGER')) {
                    return (
                      <div className="absolute bottom-6 left-0 w-full flex flex-col justify-center items-center h-8 border border-dashed border-sky-300 bg-sky-50/30 rounded text-[6px] text-sky-500 uppercase font-bold animate-pulse">
                        <div className="mb-0.5">Click "Issue" to Sign</div>
                      </div>
                    );
                  }
                  return null;
                })()}
                <div className="border-b border-black w-full mb-1"></div>
                <div>Date : {(() => {
                  const createdLog = po.workflowLogs.find(l => l.action === 'CREATED');
                  const timestamp = createdLog?.signature?.timestamp || createdLog?.timestamp;
                  if (timestamp) return timestamp.substring(0, 10).split('-').join(' / ');
                  return '.... / .... / ....';
                })()}</div>
              </div>
            </div>

            {/* Box 2: Check By */}
            <div className="p-1.5 flex flex-col min-h-[80px] relative group">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold underline">Check By : Assistant Manager</span>
                <button
                  onClick={() => setActiveStepSignatureTarget({ stepName: 'Purchasing Manager PO Approval', action: 'APPROVED', title: 'อัพโหลด / ลงนามลายเซนต์ Check By : Assistant Manager (นางสาวเบ็ญจวรรณ ทิดชาติ)' })}
                  className="text-[8px] bg-sky-600 hover:bg-sky-500 text-white px-1.5 py-0.5 rounded shadow flex items-center gap-1 font-sans"
                >
                  <span>✍️ เซนต์/อัพโหลด</span>
                </button>
              </div>
              <div className="mt-auto relative">
                {(() => {
                  const checkLog = po.workflowLogs.find(l => l.stepName === 'Purchasing Manager PO Approval' && l.userRole !== UserRole.EXECUTIVE && l.userRole !== UserRole.ADMINISTRATOR);
                  const sig = checkLog?.signature;
                  if (sig && sig.signatureData) {
                    return (
                      <div className="absolute bottom-6 left-0 w-full flex justify-center items-center h-8">
                        {sig.companyStampData && (
                          <img src={sig.companyStampData} alt="Company Stamp" className="absolute h-10 object-contain opacity-60 mix-blend-multiply" referrerPolicy="no-referrer" />
                        )}
                        <img src={sig.signatureData} alt="Check Signature" className="relative h-8 object-contain mix-blend-multiply" referrerPolicy="no-referrer" />
                      </div>
                    );
                  }
                  // If no signature, show placeholder if current user can sign
                  if (po.status === 'PENDING_PURCHASING_MGR' && (currentUser.role === 'ASSISTANT_MANAGER' || currentUser.role === 'PURCHASING_MANAGER') && currentUser.departmentId !== 'DEP006') {
                    return (
                      <div className="absolute bottom-6 left-0 w-full flex flex-col justify-center items-center h-8 border border-dashed border-sky-300 bg-sky-50/30 rounded text-[6px] text-sky-500 uppercase font-bold animate-pulse">
                        <div className="mb-0.5">Click "Check" to Sign</div>
                      </div>
                    );
                  }
                  return null;
                })()}
                <div className="border-b border-black w-full mb-1"></div>
                <div>Date : {(() => {
                  const log = po.workflowLogs.find(l => l.stepName === 'Purchasing Manager PO Approval' && l.userRole !== UserRole.EXECUTIVE);
                  const timestamp = log?.signature?.timestamp || log?.timestamp;
                  if (timestamp) return timestamp.substring(0, 10).split('-').join(' / ');
                  return '.... / .... / ....';
                })()}</div>
              </div>
            </div>

            {/* Box 3: Approved By */}
            <div className="p-1.5 flex flex-col min-h-[80px] relative group">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold underline">Approved By :</span>
                <button
                  onClick={() => setActiveStepSignatureTarget({ stepName: 'Executive Director PO Approval', action: 'APPROVED', title: 'อัพโหลด / ลงนามลายเซนต์ Approved By : Executive' })}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-[8px] bg-sky-600 hover:bg-sky-500 text-white px-1.5 py-0.5 rounded shadow flex items-center gap-1 font-sans"
                >
                  <span>✍️ เซนต์/อัพโหลด</span>
                </button>
              </div>
              <div className="mt-auto relative">
                {(() => {
                  const appLog = po.workflowLogs.find(l => l.stepName === 'Executive Director PO Approval' || l.stepName === 'Purchasing Manager PO Approval' && l.userRole === UserRole.EXECUTIVE);
                  const sig = appLog?.signature;
                  const signatureSrc = sig?.signatureData || ((po.status === 'APPROVED' || appLog) ? 'https://lh3.googleusercontent.com/d/1Xmp1Qv2v5BZaL4csdRD_22CBTENKo_1I' : null);

                  if (signatureSrc) {
                    return (
                      <div className="absolute bottom-6 left-0 w-full flex justify-center items-center h-12 pointer-events-none">
                        {sig?.companyStampData && (
                          <img src={sig.companyStampData} alt="Company Stamp" className="absolute h-10 object-contain opacity-60 mix-blend-multiply" referrerPolicy="no-referrer" />
                        )}
                        <img src={signatureSrc} alt="Approved Signature" className="h-[2cm] w-[2cm] object-contain mix-blend-multiply relative" referrerPolicy="no-referrer" />
                      </div>
                    );
                  }
                  // If no signature, show placeholder if current user can sign
                  if (po.status === 'PENDING_EXECUTIVE' && currentUser.role === 'EXECUTIVE') {
                    return (
                      <div className="absolute bottom-6 left-0 w-full flex flex-col justify-center items-center h-8 border border-dashed border-sky-300 bg-sky-50/30 rounded text-[6px] text-sky-500 uppercase font-bold animate-pulse">
                        <div className="mb-0.5">Click "Approve" to Sign</div>
                      </div>
                    );
                  }
                  return null;
                })()}
                <div className="border-b border-black w-full mb-1"></div>
                <div>Date : {(() => {
                  const log = po.workflowLogs.find(l => l.stepName === 'Executive Director PO Approval' || l.stepName === 'Purchasing Manager PO Approval' && l.userRole === UserRole.EXECUTIVE);
                  const timestamp = log?.signature?.timestamp || log?.timestamp;
                  if (timestamp) return timestamp.substring(0, 10).split('-').join(' / ');
                  return (po.status === 'APPROVED') ? po.date : '.... / .... / ....';
                })()}</div>
              </div>
            </div>

            {/* Box 4: Seller Acknowledgement */}
            <div className="p-1.5 flex flex-col min-h-[80px]">
              <span className="font-bold block mb-4 uppercase">SELLER'S ACKNOWLEDGEMENT</span>
              <div className="mt-auto">
                <div className="border-b border-black w-full mb-1"></div>
                <div>Date : .... / .... / ....</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="absolute bottom-4 right-6 text-[8px] text-right font-sans">
          <p>F-GA-002 Rev :01</p>
          <p>Effective date : 4 Jul'19</p>
        </div>
      </div>

        {/* Dynamic Digital Document Vault (Invoice & Delivery Receipt Upload) */}
        <div className="p-6 bg-white border-b border-slate-200 no-print">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">Post-Procurement Invoice & Delivery Slips</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Invoice slot */}
            <div className="border border-slate-200 p-4 rounded-xl space-y-3 bg-slate-50/50">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Invoice Voucher (.pdf, .png)</span>
              
              {invoiceBase64 ? (
                <div className="bg-white p-3 border border-slate-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="h-5 w-5 text-emerald-600 shrink-0" />
                    <span className="text-xs font-medium text-slate-700 truncate max-w-[180px]">Invoice-Recieved.png</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        openFileInNewTab(invoiceBase64, `Invoice-${po.poNumber}.png`);
                        setPreviewFile({ fileName: `Invoice-${po.poNumber}.png`, fileUrl: invoiceBase64 });
                      }}
                      className="p-1 text-sky-600 hover:text-sky-800 hover:bg-slate-50 rounded cursor-pointer"
                      title="Preview Invoice"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <a 
                      href={invoiceBase64} 
                      download={`Invoice-${po.poNumber}.png`} 
                      className="p-1 text-slate-500 hover:text-sky-600 hover:bg-slate-50 rounded"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center p-3">
                  <span className="text-xs text-slate-400 italic block mb-3">No invoice uploaded yet</span>
                  {isPurchasingAgent() && (
                    <label className="cursor-pointer px-4 py-1.5 text-xs font-semibold text-sky-600 bg-white border border-sky-200 rounded-lg hover:bg-sky-50 inline-block transition-colors shadow-2xs">
                      Upload Invoice
                      <input 
                        type="file" 
                        onChange={(e) => handleFileUpload(e, 'invoice')} 
                        className="hidden" 
                      />
                    </label>
                  )}
                </div>
              )}
            </div>

            {/* Delivery receipt slot */}
            <div className="border border-slate-200 p-4 rounded-xl space-y-3 bg-slate-50/50">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Delivery Confirmation Note</span>
              
              {deliveryBase64 ? (
                <div className="bg-white p-3 border border-slate-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="h-5 w-5 text-indigo-600 shrink-0" />
                    <span className="text-xs font-medium text-slate-700 truncate max-w-[180px]">Delivery-Receipt.png</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        openFileInNewTab(deliveryBase64, `DeliveryNote-${po.poNumber}.png`);
                        setPreviewFile({ fileName: `DeliveryNote-${po.poNumber}.png`, fileUrl: deliveryBase64 });
                      }}
                      className="p-1 text-sky-600 hover:text-sky-800 hover:bg-slate-50 rounded cursor-pointer"
                      title="Preview Delivery Note"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <a 
                      href={deliveryBase64} 
                      download={`DeliveryNote-${po.poNumber}.png`} 
                      className="p-1 text-slate-500 hover:text-sky-600 hover:bg-slate-50 rounded"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center p-3">
                  <span className="text-xs text-slate-400 italic block mb-3">No delivery note uploaded yet</span>
                  {isPurchasingAgent() && (
                    <label className="cursor-pointer px-4 py-1.5 text-xs font-semibold text-sky-600 bg-white border border-sky-200 rounded-lg hover:bg-sky-50 inline-block transition-colors shadow-2xs">
                      Upload Delivery Note
                      <input 
                        type="file" 
                        onChange={(e) => handleFileUpload(e, 'delivery')} 
                        className="hidden" 
                      />
                    </label>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PO Workflow Log history */}
        <div className="p-6 bg-white no-print">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">PO Workflow Logs & Auditing History</h4>
          <div className="relative border-l-2 border-slate-100 pl-4 space-y-5">
            {po.workflowLogs.map((log, idx) => (
              <div key={log.id || log.stepName || `po-log-${idx}`} className="relative">
                <div className={`absolute -left-[25px] top-1 h-3 w-3 rounded-full border-2 ${
                  log.action === 'APPROVED' ? 'bg-emerald-500 border-emerald-200' :
                  log.action === 'REJECTED' ? 'bg-rose-500 border-rose-200' : 'bg-slate-500 border-slate-200'
                }`} />

                <div className="space-y-1 text-left text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800">{log.stepName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{log.timestamp.replace('T', ' ').substring(0, 19)}</span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    <span className="font-semibold text-slate-800">{log.userName}</span> ({log.userRole}) : <span className="italic">"{log.comment || 'No comment feedback.'}"</span>
                  </div>

                  {log.signature && (
                    <div className="bg-slate-50 p-2.5 rounded border border-slate-100 font-mono text-[9px] text-slate-400 mt-1.5 space-y-0.5">
                      <div className="flex justify-between">
                        <span>IP ADDRESS: {log.signature.ipAddress}</span>
                        <span>DEVICE: {log.signature.device}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>COORDINATES: {log.signature.geoCoordinates || 'N/A'}</span>
                        <span>CHECK: {log.signature.digitalHash.substring(0, 16)}...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      {/* Reviewer Action Area */}
      {(canIssue() || canApprove()) && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white space-y-4 no-print shadow-xl">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-sky-400" />
            <div>
              <h3 className="text-sm font-bold tracking-tight">Enterprise Purchase Order Review Attestation</h3>
              <p className="text-[10px] text-slate-400">You are logged in as {currentUser.name} ({currentUser.title}). Digitally sign to commit this PO.</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Auditor Notes / Comments:</label>
            <input
              type="text"
              placeholder="e.g. Approved. Purchase matches verified pricing from supplier..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              id="txt-comment-po"
            />
          </div>

          <div className="flex gap-2.5 justify-end">
            {canIssue() && (
              <button
                onClick={() => openSignatureFlow(false, true)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs transition-all flex items-center gap-2 shadow-lg hover:scale-102 active:scale-98"
                id="btn-issue-po"
              >
                <FileText className="h-4 w-4" />
                Issued By : (Digital Sign)
              </button>
            )}
            {canApprove() && (
              <>
                <button
                  onClick={() => openSignatureFlow(true)}
                  className="px-4 py-2 text-xs font-semibold bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600 hover:text-white rounded-lg transition-all flex items-center gap-1"
                  id="btn-reject-po"
                >
                  <X className="h-4 w-4" />
                  Reject PO
                </button>
                <button
                  onClick={() => openSignatureFlow(false)}
                  className="px-5 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-1"
                  id="btn-approve-po"
                >
                  <Check className="h-4 w-4" />
                  {(currentUser.role === UserRole.PURCHASING_MANAGER || currentUser.role === UserRole.ASSISTANT_MANAGER) ? 'Check By : (Digital Sign)' : 'Approved By : (Digital Sign)'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Purchasing Agent Post-Approval actions (Send to Vendor, Close Job) */}
      {isPurchasingAgent() && po.status === POStatus.APPROVED && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print shadow-xl">
          <div className="space-y-1">
            <h3 className="text-sm font-bold tracking-tight text-sky-400">PO Dispatched Release</h3>
            <p className="text-[10px] text-slate-400">This Purchase Order is fully approved. Notify the supplier to initiate manufacturing and delivery schedule.</p>
          </div>
          <button
            onClick={() => onSendVendor(po.id)}
            className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold text-xs transition-colors shadow-md"
            id="btn-send-vendor"
          >
            Email Dispatch to Vendor
          </button>
        </div>
      )}

      {isPurchasingAgent() && po.status === POStatus.SENT_TO_VENDOR && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print shadow-xl">
          <div className="space-y-1">
            <h3 className="text-sm font-bold tracking-tight text-emerald-400">Complete & Close Procurement Job</h3>
            <p className="text-[10px] text-slate-400">If items have been successfully delivered and invoice verified in the documents vault, complete this procurement pipeline.</p>
          </div>
          <button
            onClick={() => onCloseJob(po.id)}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs transition-colors shadow-md"
            id="btn-close-job"
          >
            Close Procurement Job
          </button>
        </div>
      )}

      {/* Signature Pad Overlap Modal */}
      {showSigPad && (
        <SignaturePad
          onSave={handleSignatureSaved}
          onCancel={() => setShowSigPad(false)}
          title={isIssueAction ? 'Attest PO Issuance (Issued By)' : (isRejectAction ? 'Attest Rejection Signature' : ((currentUser.role === UserRole.PURCHASING_MANAGER || currentUser.role === UserRole.ASSISTANT_MANAGER) ? 'Attest PO Checking (Check By)' : 'Attest PO Approval (Approved By)'))}
          isExecutive={currentUser.role === UserRole.EXECUTIVE || po.status === POStatus.PENDING_EXECUTIVE}
        />
      )}

      {/* Step Specific Signature Pad Modal */}
      {activeStepSignatureTarget && (
        <SignaturePad
          onSave={handleStepSignatureSaved}
          onCancel={() => setActiveStepSignatureTarget(null)}
          title={activeStepSignatureTarget.title}
          isExecutive={activeStepSignatureTarget.stepName.includes('Executive') || currentUser.role === UserRole.EXECUTIVE}
        />
      )}

      {/* Document Preview Modal */}
      {previewFile && (
        <DocumentPreviewModal
          fileName={previewFile.fileName}
          fileUrl={previewFile.fileUrl}
          onClose={() => setPreviewFile(null)}
          vendorName={po.vendorName}
          vendorAddress={po.vendorAddress}
          vendorPhone={po.vendorPhone}
          items={po.items}
          subtotal={po.subtotal}
          vat={po.vat}
          grandTotal={po.grandTotal}
          documentDate={po.date}
          documentNumber={po.poNumber}
          companyName={po.companyName}
        />
      )}

      {/* Complete print package document */}
      {relatedPR && (
        <ProcessPackagePrint pr={relatedPR} po={po} capex={relatedCapex} />
      )}
    </div>
  );
}
