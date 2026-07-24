/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  UploadCloud, 
  ArrowLeft, 
  FileCheck,
  Building,
  AlertCircle,
  FileText,
  Search,
  Eye
} from 'lucide-react';
import { Vendor, User, Department, PRItem, Attachment } from '../types.js';
import SignaturePad from './SignaturePad.js';
import DocumentPreviewModal, { openFileInNewTab } from './DocumentPreviewModal.js';
import { getAccessToken } from '../lib/googleDrive.js';
import { saveVendorApi } from '../lib/apiClient.js';
import { HardDrive } from 'lucide-react';

interface PRFormViewProps {
  currentUser: User;
  vendors: Vendor[];
  departments: Department[];
  onSave: (prData: any) => void;
  onCancel: () => void;
  onRefreshVendors?: () => void;
}

export default function PRFormView({ currentUser, vendors, departments, onSave, onCancel, onRefreshVendors }: PRFormViewProps) {
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [localVendors, setLocalVendors] = useState<Vendor[]>(vendors || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false);

  // Vendor Registration Modal State
  const [isAddingVendor, setIsAddingVendor] = useState(false);
  const [newVendor, setNewVendor] = useState({
    name: '',
    address: '',
    phone: '',
    fax: '',
    taxId: '',
    contactPerson: '',
    creditTerm: '30 Days'
  });
  const [vendorError, setVendorError] = useState('');

  const [purchaseObjective, setPurchaseObjective] = useState('');
  const [companyName, setCompanyName] = useState('SUMINO AAPICO (Thailand) Co., LTD.');
  const [branchName, setBranchName] = useState('700/706 Moo 3, Tambon Bankao, Amphur Panthong, Chonburi 20160 Tel: 66-38-447-628-31 • Fax: 66-38-447-632 • Tax ID: 0-2055-56012-44-8');
  const [items, setItems] = useState<Partial<PRItem>[]>([
    { partNo: '', description: '', specification: '', unit: 'PCS', qty: 1, unitPrice: 0, total: 0 }
  ]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [previewFile, setPreviewFile] = useState<{ fileName: string; fileUrl: string } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showSignaturePad, setShowSignaturePad] = useState(false);

  // Synchronize local copy of vendors
  useEffect(() => {
    setLocalVendors(vendors || []);
  }, [vendors]);

  const handleRegisterVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setVendorError('');

    if (!newVendor.name || !newVendor.name.trim()) {
      setVendorError('กรุณาระบุชื่อผู้ขาย (Vendor Name)');
      return;
    }

    try {
      const vendorDataToSend = {
        name: newVendor.name.trim(),
        address: newVendor.address ? newVendor.address.trim() : '-',
        phone: newVendor.phone ? newVendor.phone.trim() : '-',
        fax: newVendor.fax ? newVendor.fax.trim() : '',
        taxId: newVendor.taxId ? newVendor.taxId.trim() : '-',
        contactPerson: newVendor.contactPerson ? newVendor.contactPerson.trim() : '',
        creditTerm: newVendor.creditTerm || '30 Days'
      };

      const createdVendor = await saveVendorApi(vendorDataToSend);
      
      setLocalVendors(prev => [...prev, createdVendor]);
      setSelectedVendorId(createdVendor.id);
      setSearchTerm('');
      setIsVendorDropdownOpen(false);
      setIsAddingVendor(false);
      
      setNewVendor({
        name: '',
        address: '',
        phone: '',
        fax: '',
        taxId: '',
        contactPerson: '',
        creditTerm: '30 Days'
      });

      if (onRefreshVendors) {
        onRefreshVendors();
      }
    } catch (err: any) {
      setVendorError(err.message || 'Error occurred while saving vendor');
    }
  };

  // Auto-calculated fields
  const [subtotal, setSubtotal] = useState(0);
  const [vat, setVat] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);

  const currentDept = (departments || []).find(d => d && (d.id === currentUser?.departmentId || d.code === currentUser?.departmentId)) || {
    name: currentUser?.departmentName && currentUser?.departmentName !== 'Unknown Department'
      ? currentUser.departmentName
      : (currentUser?.departmentId === 'DEP001' ? 'Management' : currentUser?.departmentId === 'DEP002' ? 'PC&L (Production Control & Logistics)' : currentUser?.departmentId === 'DEP003' ? 'Sales / Purchasing / PE' : currentUser?.departmentId === 'DEP005' ? 'Production' : currentUser?.departmentId === 'DEP006' ? 'QA / QC' : currentUser?.departmentId === 'DEP007' ? 'Accounting' : 'HR / General Affairs')
  };

  const selectedVendor = (localVendors || []).find(v => v && v.id === selectedVendorId);
  const filteredVendors = (localVendors || []).filter(v => {
    if (!v) return false;
    const q = (searchTerm || '').toLowerCase();
    const vName = v.name || '';
    const vCode = v.code || '';
    const vContact = v.contactPerson || '';
    const vAddress = v.address || '';
    return (
      vName.toLowerCase().includes(q) ||
      vCode.toLowerCase().includes(q) ||
      vContact.toLowerCase().includes(q) ||
      vAddress.toLowerCase().includes(q)
    );
  });

  // Recalculate Totals
  useEffect(() => {
    let sub = 0;
    const updatedItems = items.map(item => {
      const q = parseFloat(item.qty as any) || 0;
      const p = parseFloat(item.unitPrice as any) || 0;
      const t = q * p;
      sub += t;
      return { ...item, total: t };
    });

    setSubtotal(sub);
    setVat(sub * 0.07);
    setGrandTotal(sub * 1.07);
  }, [items]);

  const handleAddItem = () => {
    setItems([
      ...items,
      { partNo: '', description: '', specification: '', unit: 'PCS', qty: 1, unitPrice: 0, total: 0 }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleItemChange = (index: number, field: keyof PRItem, value: any) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: value
    };
    setItems(newItems);
  };

  // Drag and Drop files
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64Url = reader.result as string;
      const newAttach: Attachment = {
        id: `ATT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || 'application/octet-stream',
        uploadedAt: new Date().toISOString(),
        uploadedBy: currentUser.name,
        url: base64Url
      };
      setAttachments(prev => [...prev, newAttach]);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      Array.from(e.dataTransfer.files).forEach(file => {
        processFile(file as File);
      });
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      Array.from(e.target.files).forEach(file => {
        processFile(file as File);
      });
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const handleSubmit = (status: 'DRAFT' | 'PENDING_DEPT_MGR') => {
    setErrorMsg('');

    // Validations
    if (!selectedVendorId) {
      setErrorMsg('Please select a suggested vendor');
      return;
    }

    if (!purchaseObjective.trim()) {
      setErrorMsg('Please input a valid Purchase Objective');
      return;
    }

    const invalidItem = items.some(item => !item.description?.trim() || (item.qty || 0) <= 0 || (item.unitPrice || 0) < 0);
    if (invalidItem) {
      setErrorMsg('Please complete all item lines. Quantities must be greater than 0');
      return;
    }

    if (status === 'PENDING_DEPT_MGR') {
      setShowSignaturePad(true);
    } else {
      onSave({
        requestorId: currentUser.id,
        suggestedVendorId: selectedVendorId,
        items,
        purchaseObjective,
        status,
        attachments,
        companyName,
        branchName
      });
    }
  };

  const handleSaveSignature = (signatureDataUrl: string, companyStampDataUrl?: string, geoCoordinates?: string) => {
    setShowSignaturePad(false);
    onSave({
      requestorId: currentUser.id,
      suggestedVendorId: selectedVendorId,
      items,
      purchaseObjective,
      status: 'PENDING_DEPT_MGR',
      attachments,
      companyName,
      branchName,
      signatureData: signatureDataUrl,
      companyStampData: companyStampDataUrl,
      geoCoordinates
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Title block */}
      <div className="flex justify-between items-center no-print">
        <button 
          onClick={onCancel}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 border border-slate-200 px-3 py-1.5 bg-white rounded-lg transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to list
        </button>
        <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-semibold font-mono">
          FORM-ID: F-GA-001 Rev.02
        </span>
      </div>

      {/* Main Layout Card (mimics real Sumino-Aapico Corporate PR Form) */}
      <div className="bg-white border border-slate-300 rounded-xl shadow-md overflow-hidden">
        {/* Sumino Aapico corporate header block */}
        <div className="bg-white p-6 border-b-2 border-black text-black">
          <div className="text-center mb-4">
            <h1 className="text-base font-black tracking-wide uppercase">SUMINO AAPICO (Thailand) Company Limited</h1>
          </div>
          
          <div className="flex justify-between items-end">
            <div className="text-left">
              <p className="text-[9px] font-medium leading-tight text-slate-800">
                700/706 Moo 3, T. Bankao, A. Panthong, Chonburi 20160<br/>
                Tel: 66-38-447-628-31, Fax No. 66-38-447-632<br/>
                Tax No. 0-2055-56012-44-8
              </p>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-sm font-black tracking-widest uppercase text-center">PURCHASE REQUISITION</h2>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="h-4.5 w-4.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Org & Meta Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200/60 text-xs">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500">Company Entity:</span>
                <select 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="bg-white border border-slate-200 rounded px-2 py-1 text-[10px] font-semibold text-slate-800 w-2/3"
                >
                  <option value="SUMINO AAPICO (Thailand) Co., LTD.">SUMINO AAPICO (Thailand) Co., LTD.</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500">Branch Location:</span>
                <select 
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  className="bg-white border border-slate-200 rounded px-2 py-1 text-[10px] font-semibold text-slate-800 w-2/3"
                >
                  <option value="700/706 Moo 3, Tambon Bankao, Amphur Panthong, Chonburi 20160 Tel: 66-38-447-628-31 • Fax: 66-38-447-632 • Tax ID: 0-2055-56012-44-8">Chonburi (Head Office)</option>
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between relative">
                  <span className="font-semibold text-slate-500 shrink-0">Suggested Vendor:</span>
                  <div className="w-2/3 relative" id="searchable-vendor-container">
                    <div className="flex gap-1.5">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="🔍 Type to search vendor (name, address, contact)..."
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setIsVendorDropdownOpen(true);
                          }}
                          onFocus={() => setIsVendorDropdownOpen(true)}
                          className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-[11px] text-slate-800 font-medium w-full focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none pr-8"
                        />
                        {searchTerm && (
                          <button
                            type="button"
                            onClick={() => setSearchTerm('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                          >
                            ×
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAddingVendor(true)}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-2.5 py-1.5 rounded-lg text-[10px] transition-colors flex items-center gap-1 shrink-0 shadow-sm"
                        title="Register New Vendor"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add New</span>
                      </button>
                    </div>

                    {/* Filtered Dropdown List */}
                    {isVendorDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setIsVendorDropdownOpen(false)} 
                        />
                        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-64 overflow-y-auto divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-100">
                          {filteredVendors.length > 0 ? (
                            filteredVendors.map((v, idx) => (
                              <button
                                key={v.id || v.code || `vendor-${idx}`}
                                type="button"
                                onClick={() => {
                                  setSelectedVendorId(v.id);
                                  setSearchTerm('');
                                  setIsVendorDropdownOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-[11px] transition-colors flex flex-col gap-0.5 hover:bg-sky-50/50 ${
                                  selectedVendorId === v.id ? 'bg-sky-50 font-semibold' : ''
                                }`}
                              >
                                <div className="flex justify-between items-center w-full">
                                  <span className="text-slate-900 font-semibold">{v.name}</span>
                                  <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-medium shrink-0">
                                    {v.code}
                                  </span>
                                </div>
                                {v.address && (
                                  <span className="text-slate-500 line-clamp-1 text-[10px]">{v.address}</span>
                                )}
                                <div className="flex gap-4 text-[9px] text-slate-400">
                                  {v.contactPerson && <span>Contact: {v.contactPerson}</span>}
                                  {v.creditTerm && <span className="font-medium text-amber-600">Terms: {v.creditTerm}</span>}
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="p-4 text-center space-y-2">
                              <p className="text-slate-400 text-xs">No vendors found matching "{searchTerm}"</p>
                              <button
                                type="button"
                                onClick={() => {
                                  setNewVendor(prev => ({ ...prev, name: searchTerm }));
                                  setIsAddingVendor(true);
                                  setIsVendorDropdownOpen(false);
                                }}
                                className="inline-flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-semibold"
                              >
                                <Plus className="h-3 w-3" />
                                Register "{searchTerm}" as Vendor
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Selected Vendor Detail Preview Card */}
                {selectedVendor ? (
                  <div className="mt-2 bg-slate-50 border border-slate-200/80 rounded-lg p-3 text-[11px] text-slate-700 space-y-1.5 shadow-inner">
                    <div className="flex justify-between items-start">
                      <div className="max-w-[75%]">
                        <span className="font-bold text-slate-800">Selected Vendor:</span>
                        <h4 className="text-[11px] font-extrabold text-slate-900 mt-0.5 leading-tight">{selectedVendor.name}</h4>
                      </div>
                      <span className="bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                        {selectedVendor.code}
                      </span>
                    </div>
                    {selectedVendor.address && (
                      <p className="text-slate-500 leading-normal border-t border-slate-200/50 pt-1.5">
                        <span className="font-semibold text-slate-600">Address:</span> {selectedVendor.address}
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-slate-600 pt-1 border-t border-slate-200/30">
                      <div>
                        <span className="font-semibold text-slate-500">Tel:</span> {selectedVendor.phone}
                      </div>
                      {selectedVendor.fax && (
                        <div>
                          <span className="font-semibold text-slate-500">Fax:</span> {selectedVendor.fax}
                        </div>
                      )}
                      <div>
                        <span className="font-semibold text-slate-500">Contact:</span> {selectedVendor.contactPerson || 'N/A'}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-500">Terms:</span> <span className="font-bold text-amber-600">{selectedVendor.creditTerm}</span>
                      </div>
                      {selectedVendor.taxId && (
                        <div className="col-span-2 mt-0.5 pt-0.5 border-t border-slate-100">
                          <span className="font-semibold text-slate-500">Tax ID:</span> <span className="font-mono">{selectedVendor.taxId}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50/50 border border-dashed border-amber-200 rounded-lg p-2.5 text-center text-[10px] text-amber-700">
                    ⚠️ No suggested vendor selected. Please search and select from the list.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2 border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 md:pl-4">
              <div className="flex justify-between gap-4">
                <div className="flex flex-1 justify-between">
                  <span className="font-semibold text-slate-500">Requestor:</span>
                  <span className="font-medium text-slate-800">{currentUser.name}</span>
                </div>
                <div className="flex flex-1 justify-between">
                  <span className="font-semibold text-slate-500">Department:</span>
                  <span className="font-mono text-slate-800 font-semibold">{currentDept ? currentDept.name : 'N/A'}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">PR Number:</span>
                <span className="text-slate-400 italic">...</span>
              </div>
              <p className="text-[9px] font-bold mt-2 text-slate-800 border-t border-slate-100 pt-1">
                Please give complete descriptions where applicable. Remit all Surplus Property Forms to Purchasing.
              </p>
            </div>
          </div>

          {/* Dynamic Item Grid Section */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-slate-400" />
                Line Items Request
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-[11px] font-semibold text-sky-600 hover:text-sky-800 border border-sky-100 hover:border-sky-300 px-2 py-1 bg-sky-50/50 rounded-lg transition-colors"
                id="btn-add-item"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Row
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-mono text-[10px] border-b border-slate-800 uppercase">
                    <th className="p-2.5 text-center w-12">#</th>
                    <th className="p-2.5">Part No</th>
                    <th className="p-2.5 w-1/3">Description</th>
                    <th className="p-2.5">Specs / Model</th>
                    <th className="p-2.5 w-20">Unit</th>
                    <th className="p-2.5 w-20 text-center">Qty</th>
                    <th className="p-2.5 w-28 text-right">Unit Price</th>
                    <th className="p-2.5 w-28 text-right">Total</th>
                    <th className="p-2.5 text-center w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <tr key={item.id || `pr-item-${idx}`} className="hover:bg-slate-50/60">
                      <td className="p-2 text-center text-slate-400 font-mono font-medium">{idx + 1}</td>
                      <td className="p-2">
                        <input
                          type="text"
                          placeholder="e.g. AP-902"
                          value={item.partNo || ''}
                          onChange={(e) => handleItemChange(idx, 'partNo', e.target.value)}
                          className="w-full bg-transparent border-b border-slate-200 focus:border-slate-400 focus:outline-none p-1 font-mono text-xs font-medium"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          required
                          placeholder="Short description..."
                          value={item.description || ''}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          className="w-full bg-transparent border-b border-slate-200 focus:border-slate-400 focus:outline-none p-1"
                          id={`item-desc-${idx}`}
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          placeholder="Specifications/Size/Color..."
                          value={item.specification || ''}
                          onChange={(e) => handleItemChange(idx, 'specification', e.target.value)}
                          className="w-full bg-transparent border-b border-slate-200 focus:border-slate-400 focus:outline-none p-1 text-[11px]"
                        />
                      </td>
                      <td className="p-2">
                        <select
                          value={item.unit || 'PCS'}
                          onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                          className="w-full bg-transparent border-b border-slate-200 focus:border-slate-400 focus:outline-none p-1 font-mono text-[11px]"
                        >
                          <option value="PCS">PCS</option>
                          <option value="SETS">SETS</option>
                          <option value="KG">KG</option>
                          <option value="LOT">LOT</option>
                          <option value="ROLLS">ROLLS</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.qty || ''}
                          onChange={(e) => handleItemChange(idx, 'qty', parseInt(e.target.value) || 0)}
                          className="w-full bg-transparent border-b border-slate-200 focus:border-slate-400 focus:outline-none p-1 text-center font-mono"
                          id={`item-qty-${idx}`}
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          value={item.unitPrice || ''}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full bg-transparent border-b border-slate-200 focus:border-slate-400 focus:outline-none p-1 text-right font-mono"
                          id={`item-price-${idx}`}
                        />
                      </td>
                      <td className="p-2 text-right font-mono font-medium text-slate-800">
                        {((item.qty || 0) * (item.unitPrice || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={items.length === 1}
                          className="text-slate-300 hover:text-rose-600 disabled:opacity-30 disabled:pointer-events-none p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations and Summary */}
            <div className="flex justify-end pt-2">
              <div className="w-80 bg-slate-50 p-4 border border-slate-200 rounded-lg space-y-1.5 text-xs font-mono text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="text-slate-900 font-semibold">{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} THB</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT (7%):</span>
                  <span className="text-slate-900 font-semibold">{vat.toLocaleString(undefined, { minimumFractionDigits: 2 })} THB</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1.5 text-sm">
                  <span className="font-bold text-slate-800 font-sans">Grand Total:</span>
                  <span className="font-extrabold text-slate-950 font-mono text-right">{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} THB</span>
                </div>
              </div>
            </div>
          </div>

          {/* Objective Box */}
          <div className="space-y-1.5 text-xs">
            <label className="font-bold text-slate-700 uppercase tracking-wider">Purchase Objective & Justification:</label>
            <textarea
              required
              rows={3}
              placeholder="Provide clean and detailed justification of this purchase requisition (e.g. For maintenance, new product development, project code...)"
              value={purchaseObjective}
              onChange={(e) => setPurchaseObjective(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-3 text-xs text-slate-800 focus:ring-1 focus:ring-sky-500"
              id="txt-objective"
            />
          </div>

          {/* Drag & Drop File Upload Panel */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-xs">Quotations & Specification Attachments:</span>
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${
                getAccessToken() 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                  : 'bg-amber-50 border-amber-200 text-amber-700'
              }`}>
                <HardDrive className="h-3 w-3" />
                <span>{getAccessToken() ? 'Google Drive Active' : 'Drive Inactive (Connect on Submit)'}</span>
              </div>
            </div>
            
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                dragActive ? 'border-sky-500 bg-sky-50/50' : 'border-slate-200 bg-slate-50/20 hover:bg-slate-50/60'
              }`}
            >
              <UploadCloud className="h-10 w-10 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-600">
                Drag and drop your quotation, specification sheet, excel, or pdf files here
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                Supports: PDF, XLSX, DOCX, ZIP, IMAGES up to 10MB
              </p>
              <label className="mt-3 inline-block cursor-pointer px-4 py-1.5 text-xs font-semibold text-sky-600 bg-sky-50 border border-sky-200 hover:bg-sky-100 rounded-lg transition-colors">
                Select Files Manually
                <input 
                  type="file" 
                  multiple 
                  onChange={handleFileInput} 
                  className="hidden" 
                />
              </label>
            </div>

            {/* Attachments list */}
            {attachments.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {attachments.map((file, idx) => (
                  <div key={file.id || `att-${idx}`} className="flex justify-between items-center border border-slate-200 p-2.5 rounded-lg bg-white shadow-xs">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="p-1.5 bg-slate-100 text-slate-600 rounded">
                        <FileCheck className="h-4 w-4" />
                      </div>
                      <div className="text-left overflow-hidden">
                        <p className="text-xs font-medium text-slate-800 truncate max-w-[180px]" title={file.fileName}>
                          {file.fileName}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {(file.fileSize / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          openFileInNewTab(file.url, file.fileName);
                          setPreviewFile({ fileName: file.fileName, fileUrl: file.url });
                        }}
                        className="text-sky-600 hover:text-sky-800 p-1 bg-sky-50 hover:bg-sky-100 rounded text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="ดูตัวอย่างไฟล์แนบจริง"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Preview</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(file.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-slate-50 cursor-pointer"
                        title="ลบไฟล์แนบ"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 rounded-lg transition-all"
          >
            Discard
          </button>
          
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => handleSubmit('DRAFT')}
              className="px-4 py-2 text-xs font-semibold bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all"
              id="btn-save-draft"
            >
              Save as Draft
            </button>
            <button
              type="button"
              onClick={() => handleSubmit('PENDING_DEPT_MGR')}
              className="px-5 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg hover:shadow-md active:bg-slate-950 transition-all"
              id="btn-submit-pr"
            >
              Submit PR & Sign
            </button>
          </div>
        </div>
      </div>

      {/* Register New Vendor Dialog Modal */}
      {isAddingVendor && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsAddingVendor(false)} />
          
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden z-50 animate-in zoom-in-95 duration-150 relative">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-sky-400" />
                <h3 className="text-sm font-bold tracking-tight">Register New Master Vendor</h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsAddingVendor(false)}
                className="text-slate-400 hover:text-white font-bold text-lg"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleRegisterVendor} className="p-5 space-y-4 text-xs">
              {vendorError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded text-[11px] flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{vendorError}</span>
                </div>
              )}

              <div className="space-y-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vendor Name <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KEYENCE (THAILAND) CO., LTD."
                    value={newVendor.name}
                    onChange={(e) => setNewVendor(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Company Address</label>
                  <textarea
                    rows={2}
                    placeholder="Full registered address (Moo, Tambon, Amphur, Province, Zip)..."
                    value={newVendor.address}
                    onChange={(e) => setNewVendor(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-sky-500 outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tel Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 038-123456"
                      value={newVendor.phone}
                      onChange={(e) => setNewVendor(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-sky-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Fax Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 038-123457"
                      value={newVendor.fax}
                      onChange={(e) => setNewVendor(prev => ({ ...prev, fax: e.target.value }))}
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-sky-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tax ID</label>
                    <input
                      type="text"
                      placeholder="13-digit corporate Tax ID"
                      value={newVendor.taxId}
                      onChange={(e) => setNewVendor(prev => ({ ...prev, taxId: e.target.value }))}
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-sky-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Contact Person</label>
                    <input
                      type="text"
                      placeholder="e.g. K. Somchai"
                      value={newVendor.contactPerson}
                      onChange={(e) => setNewVendor(prev => ({ ...prev, contactPerson: e.target.value }))}
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-sky-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Credit Term</label>
                  <select
                    value={newVendor.creditTerm}
                    onChange={(e) => setNewVendor(prev => ({ ...prev, creditTerm: e.target.value }))}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-sky-500 outline-none"
                  >
                    <option value="30 Days">30 Days</option>
                    <option value="45 Days">45 Days</option>
                    <option value="60 Days">60 Days</option>
                    <option value="90 Days">90 Days</option>
                    <option value="Cash on Delivery">Cash on Delivery</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddingVendor(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold transition-colors flex items-center gap-1.5 shadow-md"
                >
                  <FileCheck className="h-4 w-4" />
                  <span>Register Vendor</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSignaturePad && (
        <SignaturePad
          title="Requester Electronic Sign-Off"
          isExecutive={currentUser.role === 'EXECUTIVE'}
          onSave={handleSaveSignature}
          onCancel={() => setShowSignaturePad(false)}
        />
      )}

      {previewFile && (
        <DocumentPreviewModal
          fileName={previewFile.fileName}
          fileUrl={previewFile.fileUrl}
          onClose={() => setPreviewFile(null)}
          vendorName={localVendors.find(v => v.id === selectedVendorId)?.name || 'Selected Vendor'}
          items={items.map(it => ({
            partNo: it.partNo || '',
            description: it.description || '',
            specification: it.specification || '',
            unit: it.unit || 'PCS',
            qty: it.qty || 0,
            unitPrice: it.unitPrice || 0,
            total: (it.qty || 0) * (it.unitPrice || 0)
          }))}
          subtotal={items.reduce((sum, item) => sum + ((item.qty || 0) * (item.unitPrice || 0)), 0)}
          vat={items.reduce((sum, item) => sum + ((item.qty || 0) * (item.unitPrice || 0)), 0) * 0.07}
          grandTotal={items.reduce((sum, item) => sum + ((item.qty || 0) * (item.unitPrice || 0)), 0) * 1.07}
          documentDate={new Date().toISOString().split('T')[0]}
          documentNumber="PR-NEW"
          companyName={companyName}
        />
      )}
    </div>
  );
}
