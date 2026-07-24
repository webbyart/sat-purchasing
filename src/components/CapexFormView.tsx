/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Printer, 
  ArrowLeft, 
  Trash2, 
  Check, 
  Eye, 
  Sparkles, 
  Building2, 
  AlertCircle,
  TrendingUp,
  Coins,
  ShieldCheck,
  Clock,
  X,
  FileText
} from 'lucide-react';
import { motion } from 'motion/react';
import { User, UserRole, CapexStatus, CapexRequisition } from '../types.js';
import SignaturePad from './SignaturePad.js';

interface CapexFormViewProps {
  currentUser: User;
  allUsers: User[];
  onNavigate: (view: string, id?: string) => void;
  triggerAlert: (type: 'success' | 'error', text: string) => void;
}

export default function CapexFormView({ currentUser, allUsers, onNavigate, triggerAlert }: CapexFormViewProps) {
  const [capexList, setCapexList] = useState<CapexRequisition[]>([]);
  const [viewMode, setViewMode] = useState<'LIST' | 'CREATE' | 'DETAIL'>('LIST');
  const [selectedCapex, setSelectedCapex] = useState<CapexRequisition | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Form Creation States
  const [projectName, setProjectName] = useState('');
  const [assetGroup, setAssetGroup] = useState('Machinery & Equipment');
  const [budgetStatus, setBudgetStatus] = useState<'WITHIN_BUDGET' | 'SPECIAL_REQUEST'>('WITHIN_BUDGET');
  const [paybackPeriod, setPaybackPeriod] = useState<string>('0');
  const [costSavingsPerYear, setCostSavingsPerYear] = useState<string>('0');
  const [npvIrr, setNpvIrr] = useState('');
  const [purchaseObjective, setPurchaseObjective] = useState('');
  const [items, setItems] = useState<any[]>([
    { partNo: '', description: '', specification: '', unit: 'SET', qty: '1', unitPrice: '0' }
  ]);

  // Approval States
  const [showSigPad, setShowSigPad] = useState(false);
  const [isRejectAction, setIsRejectAction] = useState(false);
  const [comment, setComment] = useState('');

  // Fetch capex list
  const fetchCapex = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/capex');
      if (res.ok) {
        const data = await res.json();
        setCapexList(data);
      }
    } catch (e) {
      console.error('Failed fetching CAPEX list', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCapex();
  }, [viewMode]);

  const handleAddItem = () => {
    setItems([...items, { partNo: '', description: '', specification: '', unit: 'SET', qty: '1', unitPrice: '0' }]);
  };

  const handleRemoveItem = (idx: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, field: string, value: string) => {
    const updated = [...items];
    updated[idx][field] = value;
    setItems(updated);
  };

  const handleFormSubmit = async (e: React.FormEvent, isDraft = true) => {
    e.preventDefault();
    if (!projectName.trim()) {
      triggerAlert('error', 'Please enter Project Name');
      return;
    }
    if (items.some(it => !it.description.trim())) {
      triggerAlert('error', 'All items must have a description');
      return;
    }

    try {
      setIsLoading(true);
      const payload = {
        userId: currentUser.id,
        projectName,
        assetGroup,
        budgetStatus,
        totalInvestment: items.reduce((sum, it) => sum + (parseFloat(it.qty || '0') * parseFloat(it.unitPrice || '0')), 0),
        paybackPeriod: parseFloat(paybackPeriod) || 0,
        costSavingsPerYear: parseFloat(costSavingsPerYear) || 0,
        npvIrr,
        purchaseObjective,
        items
      };

      const res = await fetch('/api/capex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const created = await res.json();
        if (!isDraft) {
          // Submit immediately to dept manager
          await fetch(`/api/capex/${created.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: CapexStatus.PENDING_DEPT_MGR })
          });
          triggerAlert('success', 'CAPEX Requisition submitted successfully!');
        } else {
          triggerAlert('success', 'CAPEX Requisition draft saved successfully!');
        }
        // Reset Form
        setProjectName('');
        setAssetGroup('Machinery & Equipment');
        setBudgetStatus('WITHIN_BUDGET');
        setPaybackPeriod('0');
        setCostSavingsPerYear('0');
        setNpvIrr('');
        setPurchaseObjective('');
        setItems([{ partNo: '', description: '', specification: '', unit: 'SET', qty: '1', unitPrice: '0' }]);
        setViewMode('LIST');
      } else {
        triggerAlert('error', 'Failed saving CAPEX requisition');
      }
    } catch (err) {
      console.error(err);
      triggerAlert('error', 'Error occurred creating CAPEX');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveAction = async (signatureData: string, companyStampData?: string, geoCoordinates?: string) => {
    if (!selectedCapex) return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/capex/${selectedCapex.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          comment,
          signatureData,
          companyStampData,
          geoCoordinates,
          isReject: isRejectAction
        })
      });

      if (res.ok) {
        triggerAlert('success', isRejectAction ? 'CAPEX requisition rejected' : 'CAPEX requisition signed and approved');
        setShowSigPad(false);
        setComment('');
        setViewMode('LIST');
      } else {
        triggerAlert('error', 'Action failed');
      }
    } catch (err) {
      console.error(err);
      triggerAlert('error', 'Error approving/rejecting CAPEX');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCapex = capexList.filter(c => {
    const q = searchQuery.toLowerCase();
    return (
      c.capexNumber.toLowerCase().includes(q) ||
      c.projectName.toLowerCase().includes(q) ||
      c.departmentName.toLowerCase().includes(q) ||
      c.requestorName.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status: CapexStatus) => {
    switch (status) {
      case CapexStatus.DRAFT:
        return <span className="bg-slate-100 text-slate-700 text-[10px] px-2.5 py-1 rounded-full font-bold border border-slate-300">DRAFT</span>;
      case CapexStatus.PENDING_DEPT_MGR:
        return <span className="bg-amber-50 text-amber-700 text-[10px] px-2.5 py-1 rounded-full font-bold border border-amber-200">PENDING MANAGER</span>;
      case CapexStatus.PENDING_EXECUTIVE:
        return <span className="bg-indigo-50 text-indigo-700 text-[10px] px-2.5 py-1 rounded-full font-bold border border-indigo-200">PENDING MD</span>;
      case CapexStatus.APPROVED:
        return <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2.5 py-1 rounded-full font-bold border border-emerald-200">FULLY APPROVED</span>;
      case CapexStatus.REJECTED:
        return <span className="bg-rose-50 text-rose-700 text-[10px] px-2.5 py-1 rounded-full font-bold border border-rose-200">REJECTED</span>;
    }
  };

  const canApprove = (cx: CapexRequisition) => {
    if (cx.status === CapexStatus.PENDING_DEPT_MGR && currentUser.role === UserRole.DEPARTMENT_MANAGER && currentUser.departmentId === cx.departmentId) {
      return true;
    }
    if (cx.status === CapexStatus.PENDING_EXECUTIVE && currentUser.role === UserRole.EXECUTIVE) {
      return true;
    }
    return false;
  };

  return (
    <div className="space-y-6 text-slate-900">
      {/* HEADER CONTROLS (Hidden in print) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5 no-print">
        <div className="text-left">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-sky-600" />
            Capital Expenditure Requisition (CAPEX)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            สร้าง ติดตาม และอนุมัติใบขอซื้อเครื่องจักร ยานพาหนะ หรือสินทรัพย์โครงการใหญ่ที่มีระยะเวลาคืนทุน
          </p>
        </div>
        <div className="flex items-center gap-2">
          {viewMode !== 'LIST' ? (
            <button
              onClick={() => setViewMode('LIST')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 transition-all cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              กลับไปหน้าแรก
            </button>
          ) : (
            <button
              onClick={() => setViewMode('CREATE')}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              เขียนใบขอซื้อ CAPEX
            </button>
          )}
        </div>
      </div>

      {/* VIEW MODES */}
      {viewMode === 'LIST' && (
        <div className="space-y-6 no-print">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex items-center gap-4 text-left">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">CAPEX ทั้งหมด</p>
                <p className="text-lg font-black text-slate-800">{capexList.length} ฉบับ</p>
              </div>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex items-center gap-4 text-left">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-lg shrink-0">
                <Clock className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">รออนุมัติ</p>
                <p className="text-lg font-black text-slate-800">
                  {capexList.filter(c => c.status === CapexStatus.PENDING_DEPT_MGR || c.status === CapexStatus.PENDING_EXECUTIVE).length} รายการ
                </p>
              </div>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex items-center gap-4 text-left">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">อนุมัติเสร็จสิ้น</p>
                <p className="text-lg font-black text-slate-800">
                  {capexList.filter(c => c.status === CapexStatus.APPROVED).length} รายการ
                </p>
              </div>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex items-center gap-4 text-left">
              <div className="p-3 bg-violet-50 text-violet-600 rounded-lg shrink-0">
                <Coins className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">มูลค่าการลงทุนรวม</p>
                <p className="text-lg font-black text-slate-800">
                  {capexList.reduce((sum, c) => sum + c.grandTotal, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} THB
                </p>
              </div>
            </div>
          </div>

          {/* Search Controls */}
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex gap-3">
            <div className="relative flex-1 text-left">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาตามเลขที่ CAPEX, ชื่อโครงการ, แผนก หรือผู้ขอซื้อ..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 bg-slate-50/50"
              />
            </div>
          </div>

          {/* CAPEX TABLE */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto text-left">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                    <th className="px-6 py-4">เลขที่เอกสาร</th>
                    <th className="px-6 py-4">โครงการ / สินทรัพย์</th>
                    <th className="px-6 py-4">ผู้ขอซื้อ</th>
                    <th className="px-6 py-4">กลุ่มสินทรัพย์</th>
                    <th className="px-6 py-4 text-right">จำนวนเงินลงทุน</th>
                    <th className="px-6 py-4">สถานะ</th>
                    <th className="px-6 py-4 text-center">ดูข้อมูล / เซ็นเอกสาร</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredCapex.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400 italic">
                        ไม่พบรายการใบขอซื้อเครื่องจักร CAPEX ในระบบขณะนี้
                      </td>
                    </tr>
                  ) : (
                    filteredCapex.map(cx => (
                      <tr key={cx.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold font-mono text-slate-900">{cx.capexNumber}</td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-800 line-clamp-1">{cx.projectName}</p>
                          <p className="text-[10px] text-slate-400">{cx.departmentName}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-800">{cx.requestorName}</p>
                          <p className="text-[9px] text-slate-400 font-mono">วันที่ {cx.date}</p>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-500">{cx.assetGroup}</td>
                        <td className="px-6 py-4 text-right font-bold font-mono text-slate-800">
                          {cx.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(cx.status)}</td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => {
                              setSelectedCapex(cx);
                              setViewMode('DETAIL');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold rounded-lg border border-sky-100 transition-all cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            {canApprove(cx) ? 'เซ็นอนุมัติ' : 'ดูเอกสาร'}
                          </button>
                          {(currentUser.employeeId === '43210344' || currentUser.role === UserRole.ADMINISTRATOR) && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (window.confirm('คุณต้องการลบใบขอซื้อเครื่องจักร CAPEX นี้ใช่หรือไม่?')) {
                                  try {
                                    const res = await fetch(`/api/capex/${cx.id}`, { method: 'DELETE' });
                                    if (res.ok) {
                                      triggerAlert('success', 'ลบใบขอซื้อเครื่องจักร CAPEX สำเร็จ');
                                      fetchCapex();
                                    } else {
                                      const err = await res.json();
                                      triggerAlert('error', err.message || 'เกิดข้อผิดพลาดในการลบ');
                                    }
                                  } catch (err: any) {
                                    triggerAlert('error', err.message || 'เกิดข้อผิดพลาด');
                                  }
                                }
                              }}
                              className="ml-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg border border-rose-100 transition-all cursor-pointer shadow-2xs"
                              title="ลบเอกสาร (Master Admin)"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              ลบ
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CREATION MODE */}
      {viewMode === 'CREATE' && (
        <form onSubmit={e => handleFormSubmit(e, true)} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm max-w-4xl mx-auto space-y-6 text-left no-print">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-sky-600" />
              ฟอร์มขอซื้อเครื่องจักร / ลงทุนสินทรัพย์ (CAPEX Requisition)
            </h3>
            <p className="text-xs text-slate-500 mt-1">กรอกข้อมูลแผนการลงทุนและรายการอุปกรณ์เพื่อขอความเห็นชอบและเซ็นอนุมัติดิจิทัล</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">ชื่อโครงการ / โครงสร้างสินทรัพย์ (Project / Asset Name) *</label>
              <input
                type="text"
                required
                placeholder="เช่น เครื่องพ่นสีแบบแรงดันสูงสำหรับโมเดลพาร์ทใหม่"
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 bg-slate-50/30"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">กลุ่มสินทรัพย์ของงบประมาณ (Asset Group / Class)</label>
              <select
                value={assetGroup}
                onChange={e => setAssetGroup(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 bg-white"
              >
                <option value="Machinery & Equipment">เครื่องจักรและเครื่องมืออุตสาหกรรม (Machinery & Equipment)</option>
                <option value="Tools & Dies">แม่พิมพ์และเครื่องมือตัดแต่ง (Tools & Dies)</option>
                <option value="Office Equipment & Furniture">ครุภัณฑ์สำนักงานและตกแต่ง (Office Equipment)</option>
                <option value="Vehicles">ยานพาหนะบริษัท (Vehicles)</option>
                <option value="Buildings & Renovation">สิ่งปลูกสร้างและการปรับปรุงโรงงาน (Buildings & Renovation)</option>
                <option value="IT Hardware & Software">คอมพิวเตอร์และซอฟต์แวร์ระบบ (IT Hardware & Software)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">สถานะงบประมาณโครงการ (Budget Status)</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                  <input
                    type="radio"
                    name="budgetStatus"
                    checked={budgetStatus === 'WITHIN_BUDGET'}
                    onChange={() => setBudgetStatus('WITHIN_BUDGET')}
                    className="accent-sky-600"
                  />
                  อยู่ในงบประมาณประจำปี (Within Budget)
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                  <input
                    type="radio"
                    name="budgetStatus"
                    checked={budgetStatus === 'SPECIAL_REQUEST'}
                    onChange={() => setBudgetStatus('SPECIAL_REQUEST')}
                    className="accent-sky-600"
                  />
                  ขออนุมัติเป็นกรณีพิเศษ (Special Request)
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">ระยะเวลาคืนทุน (Payback Years)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={paybackPeriod}
                  onChange={e => setPaybackPeriod(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 bg-slate-50/30 font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">ประหยัดต่อปี (Cost Savings/Year)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="บาท (Baht)"
                  value={costSavingsPerYear}
                  onChange={e => setCostSavingsPerYear(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 bg-slate-50/30 font-mono"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">มูลค่าทางการเงินเชิงลึก (เช่น NPV / IRR %)</label>
              <input
                type="text"
                placeholder="เช่น NPV: 1,500,000 THB, IRR: 18.4% (ถ้ามี)"
                value={npvIrr}
                onChange={e => setNpvIrr(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 bg-slate-50/30"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">วัตถุประสงค์และเหตุผลความจำเป็นในการลงทุน (Objective & Justification) *</label>
              <textarea
                required
                rows={3}
                placeholder="อธิบายรายละเอียดความจำเป็นในการลงทุนซื้อสินทรัพย์นี้ ตลอดจนเป้าหมายการประหยัดต้นทุนและความจำเป็นของไลน์ผลิต..."
                value={purchaseObjective}
                onChange={e => setPurchaseObjective(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 bg-slate-50/30"
              />
            </div>
          </div>

          {/* ITEMS BREAKDOWN TABLE */}
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">รายการอุปกรณ์ / รายละเอียดค่าใช้จ่ายลงทุน</h4>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-[10px] font-bold px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                เพิ่มรายการสินค้า
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[9px] uppercase tracking-wider">
                    <th className="px-3 py-2 text-left w-12">ลำดับ</th>
                    <th className="px-3 py-2 text-left w-40">หมายเลขพาร์ท (Part No.)</th>
                    <th className="px-3 py-2 text-left">รายละเอียดอุปกรณ์ (Description) *</th>
                    <th className="px-3 py-2 text-left">สเปคโดยย่อ (Specification)</th>
                    <th className="px-3 py-2 text-center w-16">หน่วย</th>
                    <th className="px-3 py-2 text-right w-20">จำนวน</th>
                    <th className="px-3 py-2 text-right w-28">ราคาต่อหน่วย</th>
                    <th className="px-3 py-2 text-right w-28">ราคารวม</th>
                    <th className="px-3 py-2 text-center w-12">ลบ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/40">
                      <td className="px-3 py-2 font-bold font-mono text-center">{idx + 1}</td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          placeholder="Part No."
                          value={item.partNo}
                          onChange={e => handleItemChange(idx, 'partNo', e.target.value)}
                          className="w-full text-xs p-1.5 border border-slate-200 rounded focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          required
                          placeholder="เช่น ชุดสว่านโรตารี่อุตสาหกรรม..."
                          value={item.description}
                          onChange={e => handleItemChange(idx, 'description', e.target.value)}
                          className="w-full text-xs p-1.5 border border-slate-200 rounded focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          placeholder="Spec หรือรุ่นสินค้า..."
                          value={item.specification}
                          onChange={e => handleItemChange(idx, 'specification', e.target.value)}
                          className="w-full text-xs p-1.5 border border-slate-200 rounded focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={item.unit}
                          onChange={e => handleItemChange(idx, 'unit', e.target.value)}
                          className="w-full text-xs p-1.5 border border-slate-200 rounded focus:outline-none text-center"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={e => handleItemChange(idx, 'qty', e.target.value)}
                          className="w-full text-xs p-1.5 border border-slate-200 rounded focus:outline-none text-right font-mono"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          value={item.unitPrice}
                          onChange={e => handleItemChange(idx, 'unitPrice', e.target.value)}
                          className="w-full text-xs p-1.5 border border-slate-200 rounded focus:outline-none text-right font-mono"
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-bold font-mono text-slate-800">
                        {((parseFloat(item.qty) || 0) * (parseFloat(item.unitPrice) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1 rounded-md hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations summaries */}
            <div className="flex justify-end pt-4">
              <div className="w-80 space-y-2 text-xs border border-slate-200 p-4 rounded-xl bg-slate-50/50">
                <div className="flex justify-between font-medium text-slate-600">
                  <span>ยอดเงินลงทุนสุทธิ (Subtotal):</span>
                  <span className="font-mono font-bold">
                    {items.reduce((sum, it) => sum + ((parseFloat(it.qty) || 0) * (parseFloat(it.unitPrice) || 0)), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
                  </span>
                </div>
                <div className="flex justify-between font-medium text-slate-600">
                  <span>ภาษีมูลค่าเพิ่ม (VAT 7%):</span>
                  <span className="font-mono">
                    {(items.reduce((sum, it) => sum + ((parseFloat(it.qty) || 0) * (parseFloat(it.unitPrice) || 0)), 0) * 0.07).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
                  </span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-2 text-sm">
                  <span>ยอดรวมทั้งสิ้น (Grand Total):</span>
                  <span className="font-mono text-sky-600">
                    {(items.reduce((sum, it) => sum + ((parseFloat(it.qty) || 0) * (parseFloat(it.unitPrice) || 0)), 0) * 1.07).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 transition-all cursor-pointer"
            >
              บันทึกฉบับร่าง (Save Draft)
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={e => handleFormSubmit(e, false)}
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-md transition-all cursor-pointer"
            >
              ส่งเพื่ออนุมัติ (Submit to Manager)
            </button>
          </div>
        </form>
      )}

      {/* DETAIL / PREVIEW / SIGNATURE MODE */}
      {viewMode === 'DETAIL' && selectedCapex && (
        <div className="space-y-6 max-w-4xl mx-auto text-left">
          {/* Action Header Panel (Hidden on print) */}
          <div className="flex justify-between items-center no-print">
            <button
              onClick={() => setViewMode('LIST')}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 border border-slate-200 px-3 py-1.5 bg-white rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              ย้อนกลับหน้าแรก
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 border border-slate-200 px-3.5 py-1.5 bg-white rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                พิมพ์เอกสาร (Print A4)
              </button>
              {(currentUser.employeeId === '43210344' || currentUser.role === UserRole.ADMINISTRATOR) && (
                <button
                  onClick={async () => {
                    if (window.confirm('คุณต้องการลบใบขอซื้อเครื่องจักร CAPEX นี้อย่างถาวรใช่หรือไม่?')) {
                      try {
                        const res = await fetch(`/api/capex/${selectedCapex.id}`, { method: 'DELETE' });
                        if (res.ok) {
                          triggerAlert('success', 'ลบใบขอซื้อเครื่องจักร CAPEX สำเร็จ');
                          setViewMode('LIST');
                          fetchCapex();
                        } else {
                          const err = await res.json();
                          triggerAlert('error', err.message || 'เกิดข้อผิดพลาดในการลบ');
                        }
                      } catch (err: any) {
                        triggerAlert('error', err.message || 'เกิดข้อผิดพลาด');
                      }
                    }
                  }}
                  className="text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                  ลบ CAPEX (Delete CAPEX)
                </button>
              )}
            </div>
          </div>

          {/* Approval Action Box (no-print) */}
          {canApprove(selectedCapex) && (
            <div className="bg-slate-950 border border-slate-800 text-white p-5 rounded-xl space-y-4 shadow-xl no-print">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                <h4 className="font-bold text-sm">การตรวจสอบและเซ็นอนุมัติดิจิทัล (Attestation Panel)</h4>
              </div>
              <p className="text-[11px] text-slate-300">
                คุณมีหน้าที่ต้องตรวจสอบเอกสารฉบับนี้ในฐานะ <strong className="text-sky-400 font-bold">{currentUser.title}</strong> โปรดระบุความเห็นและเขียนลายเซ็น หรืออัปโหลดไฟล์ลายเซ็นดิจิทัลของคุณเพื่อทำรายการ
              </p>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">ความคิดเห็นประกอบการพิจารณา (Comments):</label>
                <textarea
                  rows={2}
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="เช่น อนุมัติจัดหาเครื่องจักรทดแทนเพื่อให้สอดคล้องกับงบปี 2026..."
                  className="w-full text-xs p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end gap-3.5">
                <button
                  onClick={() => {
                    setIsRejectAction(true);
                    setShowSigPad(true);
                  }}
                  className="px-4 py-2 bg-rose-950 hover:bg-rose-900 text-rose-300 font-bold text-xs rounded-lg border border-rose-800 transition-all cursor-pointer"
                >
                  ปฏิเสธกลับ (Reject & Return)
                </button>
                <button
                  onClick={() => {
                    setIsRejectAction(false);
                    setShowSigPad(true);
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-md transition-all cursor-pointer"
                >
                  ลงนามอนุมัติ (Sign & Approve)
                </button>
              </div>
            </div>
          )}

          {/* 100% Fidelity A4 Printable Form Sheet */}
          <div className="bg-white p-[15mm] border border-slate-300 mx-auto print:border-none print:p-0 print:m-0 font-sans shadow-md print:shadow-none flex flex-col justify-between"
               style={{ width: '210mm', minHeight: '297mm' }}>
            
            {/* Header Structure */}
            <div className="border-4 double border-black p-2 mb-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <img 
                    src="https://lh3.googleusercontent.com/d/14E1UaRpJDWbTLzdI6FLvnwmLRTVPnTXd" 
                    alt="Company Logo" 
                    className="h-12 w-12 object-contain"
                    referrerPolicy="no-referrer"
                  />
                  <div className="text-left border-l border-slate-300 pl-3">
                    <h2 className="text-[13px] font-black text-black leading-tight">SUMINO AAPICO (THAILAND) CO., LTD.</h2>
                    <p className="text-[9px] font-bold text-slate-700 leading-none">Chonburi Factory, Thailand</p>
                  </div>
                </div>
                <div className="text-right border-l-2 border-black pl-4">
                  <h1 className="text-[15px] font-black tracking-tight text-slate-950">CAPITAL EXPENDITURE REQUISITION</h1>
                  <span className="text-[9px] font-bold bg-slate-100 px-2 py-0.5 border border-black font-mono">CAPEX FORM (F-GA-003)</span>
                </div>
              </div>
            </div>

            {/* Meta Information Check-sheet Grid */}
            <div className="grid grid-cols-12 border border-black text-[10px] leading-relaxed mb-4">
              {/* Box 1: Left Meta */}
              <div className="col-span-7 border-r border-black p-3 space-y-2">
                <div className="flex">
                  <span className="w-28 font-bold">Project / Asset Name:</span>
                  <span className="border-b border-dashed border-slate-600 flex-1 font-bold">{selectedCapex.projectName}</span>
                </div>
                <div className="flex">
                  <span className="w-28 font-bold">Asset Group / Class:</span>
                  <span className="border-b border-dashed border-slate-600 flex-1 font-semibold">{selectedCapex.assetGroup}</span>
                </div>
                <div className="flex">
                  <span className="w-28 font-bold">Department (แผนก):</span>
                  <span className="border-b border-dashed border-slate-600 flex-1">{selectedCapex.departmentName}</span>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className={`h-3 w-3 border border-black flex items-center justify-center ${selectedCapex.budgetStatus === 'WITHIN_BUDGET' ? 'bg-slate-900' : ''}`}>
                      {selectedCapex.budgetStatus === 'WITHIN_BUDGET' && <Check className="h-2 w-2 text-white" />}
                    </div>
                    <span className="font-bold">Within Budget (อยู่ในงบปี)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`h-3 w-3 border border-black flex items-center justify-center ${selectedCapex.budgetStatus === 'SPECIAL_REQUEST' ? 'bg-slate-900' : ''}`}>
                      {selectedCapex.budgetStatus === 'SPECIAL_REQUEST' && <Check className="h-2 w-2 text-white" />}
                    </div>
                    <span className="font-bold">Special Request (ขอพิเศษ)</span>
                  </div>
                </div>
              </div>

              {/* Box 2: Right Financial Payback Meta */}
              <div className="col-span-5 p-3 space-y-2">
                <div className="flex">
                  <span className="w-32 font-bold font-sans">Capex No. (เลขที่เอกสาร):</span>
                  <span className="border-b border-dashed border-slate-600 flex-1 font-bold font-mono text-slate-900">{selectedCapex.capexNumber}</span>
                </div>
                <div className="flex">
                  <span className="w-32 font-bold">Date (วันที่ออก):</span>
                  <span className="border-b border-dashed border-slate-600 flex-1 font-mono">{selectedCapex.date}</span>
                </div>
                <div className="flex">
                  <span className="w-32 font-bold text-sky-950 font-sans">Payback Period (คืนทุน):</span>
                  <span className="border-b border-dashed border-slate-600 flex-1 font-bold font-mono">{selectedCapex.paybackPeriod} Years (ปี)</span>
                </div>
                <div className="flex">
                  <span className="w-32 font-bold text-sky-950 font-sans">Savings/Year (ประหยัด/ปี):</span>
                  <span className="border-b border-dashed border-slate-600 flex-1 font-bold font-mono">
                    {selectedCapex.costSavingsPerYear.toLocaleString(undefined, { minimumFractionDigits: 2 })} THB
                  </span>
                </div>
                {selectedCapex.npvIrr && (
                  <div className="flex">
                    <span className="w-32 font-bold font-mono text-slate-500">NPV / IRR Ratio:</span>
                    <span className="border-b border-dashed border-slate-600 flex-1 font-mono text-[9px] font-semibold">{selectedCapex.npvIrr}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Objective Narrative Block */}
            <div className="border border-black p-3 mb-4 text-left">
              <span className="font-extrabold block text-[10px] uppercase tracking-wider text-slate-800 mb-1 border-b border-slate-100 pb-1">
                Objective & Justification for Asset Acquisition (วัตถุประสงค์ความสำคัญและเหตุผลจำเป็น):
              </span>
              <p className="text-[10px] leading-relaxed text-slate-700 whitespace-pre-wrap">{selectedCapex.purchaseObjective}</p>
            </div>

            {/* Items table with 100% padded grid lines and fixed empty row patterns */}
            <div className="flex-1 flex flex-col justify-start mb-4">
              <table className="w-full border-collapse border border-black text-[9.5px]">
                <thead>
                  <tr className="bg-slate-100 border-b border-black text-center font-bold">
                    <th className="border border-black py-1.5 px-1 w-10">NO.</th>
                    <th className="border border-black py-1.5 px-1 w-32">PART NO.</th>
                    <th className="border border-black py-1.5 px-2 text-left">DESCRIPTION OF INVESTMENT</th>
                    <th className="border border-black py-1.5 px-2 text-left">SPECIFICATION</th>
                    <th className="border border-black py-1.5 px-1 w-16">UNIT</th>
                    <th className="border border-black py-1.5 px-1 w-16">QTY</th>
                    <th className="border border-black py-1.5 px-1 w-24">UNIT PRICE</th>
                    <th className="border border-black py-1.5 px-1 w-24">TOTAL COST</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black font-mono">
                  {selectedCapex.items.map((item, idx) => (
                    <tr key={idx} className="text-center">
                      <td className="border-r border-black py-1 font-bold">{idx + 1}</td>
                      <td className="border-r border-black py-1 px-1 font-sans text-left">{item.partNo || '-'}</td>
                      <td className="border-r border-black py-1 px-2 font-sans text-left font-semibold">{item.description}</td>
                      <td className="border-r border-black py-1 px-2 font-sans text-left text-slate-500">{item.specification || '-'}</td>
                      <td className="border-r border-black py-1 font-sans">{item.unit}</td>
                      <td className="border-r border-black py-1 text-right pr-1">{item.qty}</td>
                      <td className="border-r border-black py-1 text-right pr-1">{item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-1 text-right pr-1 font-bold">{item.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                  {/* Empty Padding Rows to match 100% paper layouts */}
                  {Array.from({ length: Math.max(0, 10 - selectedCapex.items.length) }).map((_, idx) => (
                    <tr key={`empty-${idx}`} className="text-center h-[26px]">
                      <td className="border-r border-black py-1"></td>
                      <td className="border-r border-black py-1"></td>
                      <td className="border-r border-black py-1"></td>
                      <td className="border-r border-black py-1"></td>
                      <td className="border-r border-black py-1"></td>
                      <td className="border-r border-black py-1"></td>
                      <td className="border-r border-black py-1"></td>
                      <td className="py-1"></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Subtotals & VAT grid block at bottom of table */}
              <div className="grid grid-cols-12 border border-t-0 border-black text-[10px] leading-normal font-bold">
                <div className="col-span-8 p-2 border-r border-black flex items-center justify-between font-sans">
                  <span className="italic">Note: Prices are subject to 7% local VAT. All figures in Thai Baht.</span>
                  <span>TOTAL SUM VALUE (ยอดเงินรวม)</span>
                </div>
                <div className="col-span-4 p-2 text-right space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span className="font-sans font-medium text-slate-500 text-[9px]">Subtotal:</span>
                    <span>{selectedCapex.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans font-medium text-slate-500 text-[9px]">VAT 7%:</span>
                    <span>{selectedCapex.vat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-black border-t border-black pt-1 font-black text-[10.5px]">
                    <span className="font-sans text-[9px]">Grand Total:</span>
                    <span>{selectedCapex.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Corporate Signatures Grid (Fidelity identical to PO/PR forms) */}
            <div>
              <div className="grid grid-cols-3 border border-black text-[9.5px] font-sans text-center">
                {/* Signee block 1: Requested By */}
                <div className="border-r border-black p-3 relative min-h-[140px] flex flex-col justify-between items-center bg-slate-50/20">
                  <span className="font-bold uppercase tracking-wider block mb-1">Requested By (ผู้จัดเตรียม)</span>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
                    <div className="relative h-10 w-32 flex items-center justify-center">
                      {selectedCapex.workflowLogs.find(l => l.action === 'CREATED')?.signature && (
                        <>
                          {selectedCapex.workflowLogs.find(l => l.action === 'CREATED')?.signature?.companyStampData && (
                            <img 
                              src={selectedCapex.workflowLogs.find(l => l.action === 'CREATED')?.signature?.companyStampData} 
                              alt="Company Stamp" 
                              className="absolute h-10 object-contain opacity-50 mix-blend-multiply" 
                              referrerPolicy="no-referrer"
                            />
                          )}
                          <img 
                            src={selectedCapex.workflowLogs.find(l => l.action === 'CREATED')?.signature?.signatureData} 
                            alt="Originator Signature" 
                            className="relative h-8 object-contain mix-blend-multiply" 
                            referrerPolicy="no-referrer"
                          />
                        </>
                      )}
                    </div>
                  </div>
                  <div className="w-full mt-auto space-y-1">
                    <div className="border-b border-black text-[10.5px] font-bold py-0.5 truncate px-1">
                      {selectedCapex.workflowLogs.find(l => l.action === 'CREATED')?.userName || selectedCapex.requestorName}
                    </div>
                    <div className="font-bold">Originator (ผู้เขียน)</div>
                    <div className="text-[8.5px] text-slate-500">Date: {selectedCapex.date}</div>
                  </div>
                </div>

                {/* Signee block 2: Checked By */}
                <div className="border-r border-black p-3 relative min-h-[140px] flex flex-col justify-between items-center">
                  <span className="font-bold uppercase tracking-wider block mb-1">Checked By (ผู้ตรวจสอบ)</span>
                  {selectedCapex.workflowLogs.find(l => l.stepName === 'Department Manager Approval')?.signature && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
                      <div className="relative h-10 w-32 flex items-center justify-center">
                        {selectedCapex.workflowLogs.find(l => l.stepName === 'Department Manager Approval')?.signature?.companyStampData && (
                          <img 
                            src={selectedCapex.workflowLogs.find(l => l.stepName === 'Department Manager Approval')?.signature?.companyStampData} 
                            alt="Company Stamp" 
                            className="absolute h-10 object-contain opacity-50 mix-blend-multiply" 
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <img 
                          src={selectedCapex.workflowLogs.find(l => l.stepName === 'Department Manager Approval')?.signature?.signatureData} 
                          alt="Dept Mgr Signature" 
                          className="relative h-8 object-contain mix-blend-multiply" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>
                  )}
                  <div className="w-full mt-auto space-y-1">
                    <div className="border-b border-black text-[10.5px] font-bold py-0.5 truncate px-1">
                      {selectedCapex.workflowLogs.find(l => l.stepName === 'Department Manager Approval')?.userName || '...........................................'}
                    </div>
                    <div className="font-bold">Department Mgr. (ผจก. แผนก)</div>
                    <div className="text-[8.5px] text-slate-500">
                      Date: {selectedCapex.workflowLogs.find(l => l.stepName === 'Department Manager Approval')?.signature?.timestamp.substring(0, 10) || '..../..../....'}
                    </div>
                  </div>
                </div>

                {/* Signee block 3: Approved By */}
                <div className="p-3 relative min-h-[140px] flex flex-col justify-between items-center">
                  <span className="font-bold uppercase tracking-wider block mb-1">Approved By (ผู้อนุมัติขั้นสูงสุด)</span>
                  {selectedCapex.workflowLogs.find(l => l.stepName === 'Executive Approval')?.signature && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
                      <div className="relative h-10 w-32 flex items-center justify-center">
                        {selectedCapex.workflowLogs.find(l => l.stepName === 'Executive Approval')?.signature?.companyStampData && (
                          <img 
                            src={selectedCapex.workflowLogs.find(l => l.stepName === 'Executive Approval')?.signature?.companyStampData} 
                            alt="Company Stamp" 
                            className="absolute h-10 object-contain opacity-50 mix-blend-multiply" 
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <img 
                          src={selectedCapex.workflowLogs.find(l => l.stepName === 'Executive Approval')?.signature?.signatureData} 
                          alt="Executive Signature" 
                          className="relative h-8 object-contain mix-blend-multiply" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>
                  )}
                  <div className="w-full mt-auto space-y-1">
                    <div className="border-b border-black text-[10.5px] font-bold py-0.5 truncate px-1">
                      {selectedCapex.workflowLogs.find(l => l.stepName === 'Executive Approval')?.userName || '...........................................'}
                    </div>
                    <div className="font-bold">Managing Director (กรรมการผู้จัดการ)</div>
                    <div className="text-[8.5px] text-slate-500">
                      Date: {selectedCapex.workflowLogs.find(l => l.stepName === 'Executive Approval')?.signature?.timestamp.substring(0, 10) || '..../..../....'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer document revision tags */}
            <div className="flex justify-between items-center text-[8.5px] text-slate-500 font-mono pt-6">
              <span>SUMINO AAPICO Capital Allocation Matrix System</span>
              <div className="text-right leading-tight">
                <p>F-GA-003 Rev:01</p>
                <p>Effective date: 01 Jul'21</p>
              </div>
            </div>
          </div>

          {/* Workflow Log History (Audit Trail) */}
          <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-xs no-print mt-6 text-slate-800">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <ShieldCheck className="h-4.5 w-4.5 text-sky-600" />
              Audit Log Workflow Activity Tracking
            </h4>
            <div className="relative border-l-2 border-slate-100 pl-4 space-y-6">
              {selectedCapex.workflowLogs.map((log, idx) => (
                <div key={idx} className="relative">
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
        </div>
      )}

      {/* SIGNATURE DRAWING / UPLOADING POPUP */}
      {showSigPad && (
        <div className="no-print">
          <SignaturePad
            onSave={handleApproveAction}
            onCancel={() => setShowSigPad(false)}
            title={isRejectAction ? "Reject & Return Attestation" : "Sign & Approve CAPEX Requisition"}
            isExecutive={currentUser.role === UserRole.EXECUTIVE || selectedCapex?.status === CapexStatus.PENDING_EXECUTIVE}
          />
        </div>
      )}
    </div>
  );
}
