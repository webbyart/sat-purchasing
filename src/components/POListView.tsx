/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  FileCheck, 
  Eye, 
  AlertCircle,
  ClipboardList,
  FileEdit,
  Clock,
  UserCheck,
  CheckCircle,
  XCircle,
  Send,
  FileCheck2,
  Ban,
  Trash2,
  Download
} from 'lucide-react';
import { PO, POStatus, PR, PRStatus, User, UserRole } from '../types.js';

interface POListViewProps {
  pos: PO[];
  prs?: PR[];
  currentUser: User | null;
  onNavigate: (view: string, id?: string) => void;
  onDeletePO?: (id: string) => void;
}

export default function POListView({ pos = [], prs = [], currentUser, onNavigate, onDeletePO }: POListViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | POStatus>('ALL');
  const [filteredPos, setFilteredPos] = useState<PO[]>([]);

  // PRs that are fully APPROVED and waiting for PO creation
  const approvedPrsPendingPO = (prs || []).filter(pr => 
    pr.status === PRStatus.APPROVED && !pos.some(po => po.referPrId === pr.id)
  );

  useEffect(() => {
    let result = Array.isArray(pos) ? pos : [];

    if (statusFilter !== 'ALL') {
      result = result.filter(po => po.status === statusFilter);
    }

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(po => {
        if (!po) return false;
        const poNum = po.poNumber || '';
        const referPr = po.referPrNumber || '';
        const vName = po.vendorName || '';
        const deptName = po.departmentName || '';
        return (
          poNum.toLowerCase().includes(term) ||
          referPr.toLowerCase().includes(term) ||
          vName.toLowerCase().includes(term) ||
          deptName.toLowerCase().includes(term)
        );
      });
    }

    setFilteredPos([...result].reverse());
  }, [pos, searchTerm, statusFilter]);

  const getStatusBadgeClass = (status: POStatus) => {
    switch (status) {
      case POStatus.DRAFT:
        return 'bg-slate-100 text-slate-700 border border-slate-200';
      case POStatus.PENDING_PURCHASING_MGR:
        return 'bg-amber-50 text-amber-600 border border-amber-200';
      case POStatus.PENDING_EXECUTIVE:
        return 'bg-purple-50 text-purple-600 border border-purple-200';
      case POStatus.APPROVED:
        return 'bg-teal-50 text-teal-600 border border-teal-200';
      case POStatus.SENT_TO_VENDOR:
        return 'bg-blue-50 text-blue-600 border border-blue-200';
      case POStatus.CLOSED:
        return 'bg-emerald-50 text-emerald-600 border border-emerald-200';
      case POStatus.CANCELLED:
        return 'bg-slate-100 text-slate-400 line-through border border-slate-200';
      default:
        return 'bg-slate-50 text-slate-500';
    }
  };

  const totalPOValue = filteredPos.reduce((sum, po) => sum + (po.grandTotal || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header (hidden during printing) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Purchase Orders (PO)</h2>
          <p className="text-xs text-slate-500">Track fully committed procurements, upload invoice billings, and coordinate supplier deliveries.</p>
        </div>
        <button
          onClick={() => window.print()}
          className="px-3.5 py-2 text-xs font-semibold bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          id="btn-export-po-pdf"
          title="Export current PO list as PDF report"
        >
          <Download className="h-4 w-4 text-rose-600" />
          <span>Export to PDF</span>
        </button>
      </div>

      {/* Pending PO Issuance Queue from Approved PRs */}
      {approvedPrsPendingPO.length > 0 && (
        <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 border-2 border-emerald-500/70 rounded-2xl p-5 text-white shadow-xl no-print space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5 text-left">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-xl shrink-0">
                <CheckCircle className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <span>ใบขอซื้อ (PR) อนุมัติแล้ว ย้ายมารอออกใบสั่งซื้อ (PO)</span>
                  <span className="px-2 py-0.5 bg-emerald-500 text-slate-950 text-[10px] font-black rounded-full">
                    {approvedPrsPendingPO.length} รายการ
                  </span>
                </h3>
                <p className="text-[11px] text-slate-300">
                  รายการ PR ด้านล่างอนุมัติสมบูรณ์แล้ว สามารถคลิกเพื่อดำเนินการออกใบสั่งซื้อ (PO) ได้ทันที
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('pr')}
              className="text-[11px] font-semibold text-sky-300 hover:text-white underline cursor-pointer self-start md:self-auto shrink-0"
            >
              ดูรายการ PR ทั้งหมด →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {approvedPrsPendingPO.map(pr => (
              <div key={pr.id} className="bg-slate-800/90 border border-slate-700/80 hover:border-emerald-500/60 rounded-xl p-3.5 space-y-2 flex flex-col justify-between transition-all text-left">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-mono font-bold text-sky-400 text-xs">{pr.prNumber}</span>
                    <span className="px-2 py-0.5 bg-emerald-900/80 text-emerald-300 border border-emerald-700/80 text-[9px] font-bold rounded-md uppercase">
                      APPROVED
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-200 mt-1 line-clamp-1">{pr.vendorName}</p>
                  <p className="text-[10px] text-slate-400">{pr.departmentName} • {pr.requestorName}</p>
                </div>

                <div className="flex items-center justify-between border-t border-slate-700/60 pt-2.5 mt-1">
                  <span className="text-xs font-black font-mono text-emerald-400">
                    {pr.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} THB
                  </span>
                  <button
                    onClick={() => onNavigate('pr-details', pr.id)}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-md hover:scale-102 active:scale-98"
                  >
                    <FileCheck className="h-3.5 w-3.5" />
                    <span>ออก PO ทันที</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Beautiful Colorful Dashboard Summary Cards (hidden during printing) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-3 no-print">
        {[
          {
            status: 'ALL' as const,
            label: 'All Orders',
            thaiLabel: 'ใบสั่งซื้อทั้งหมด',
            count: pos.length,
            icon: ClipboardList,
            borderClass: 'border-l-4 border-indigo-500',
            activeClass: 'ring-2 ring-indigo-500 bg-indigo-50/40 border-indigo-300',
            normalClass: 'bg-white hover:bg-indigo-50/20 border-slate-200',
            iconContainer: 'bg-indigo-50 text-indigo-600',
            activeIconContainer: 'bg-indigo-500 text-white',
          },
          {
            status: POStatus.DRAFT,
            label: 'DRAFT',
            thaiLabel: 'แบบร่าง',
            count: pos.filter(p => p.status === POStatus.DRAFT).length,
            icon: FileEdit,
            borderClass: 'border-l-4 border-zinc-400',
            activeClass: 'ring-2 ring-zinc-500 bg-zinc-50 border-zinc-300',
            normalClass: 'bg-white hover:bg-zinc-50/50 border-slate-200',
            iconContainer: 'bg-zinc-100 text-zinc-600',
            activeIconContainer: 'bg-zinc-600 text-white',
          },
          {
            status: POStatus.PENDING_PURCHASING_MGR,
            label: 'PENDING PURCHASING_MGR',
            thaiLabel: 'รอ ผจก. จัดซื้อ',
            count: pos.filter(p => p.status === POStatus.PENDING_PURCHASING_MGR).length,
            icon: Clock,
            borderClass: 'border-l-4 border-amber-500',
            activeClass: 'ring-2 ring-amber-500 bg-amber-50 border-amber-200',
            normalClass: 'bg-white hover:bg-amber-50/30 border-slate-200',
            iconContainer: 'bg-amber-50 text-amber-600',
            activeIconContainer: 'bg-amber-500 text-white',
          },
          {
            status: POStatus.PENDING_EXECUTIVE,
            label: 'PENDING EXECUTIVE',
            thaiLabel: 'รอผู้บริหารอนุมัติ',
            count: pos.filter(p => p.status === POStatus.PENDING_EXECUTIVE).length,
            icon: UserCheck,
            borderClass: 'border-l-4 border-purple-500',
            activeClass: 'ring-2 ring-purple-500 bg-purple-50 border-purple-200',
            normalClass: 'bg-white hover:bg-purple-50/30 border-slate-200',
            iconContainer: 'bg-purple-50 text-purple-600',
            activeIconContainer: 'bg-purple-600 text-white',
          },
          {
            status: POStatus.APPROVED,
            label: 'APPROVED',
            thaiLabel: 'อนุมัติแล้ว',
            count: pos.filter(p => p.status === POStatus.APPROVED).length,
            icon: CheckCircle,
            borderClass: 'border-l-4 border-teal-500',
            activeClass: 'ring-2 ring-teal-500 bg-teal-50 border-teal-200',
            normalClass: 'bg-white hover:bg-teal-50/30 border-slate-200',
            iconContainer: 'bg-teal-50 text-teal-600',
            activeIconContainer: 'bg-teal-500 text-white',
          },
          {
            status: POStatus.REJECTED,
            label: 'REJECTED',
            thaiLabel: 'ปฏิเสธ / ส่งคืน',
            count: pos.filter(p => p.status === POStatus.REJECTED).length,
            icon: XCircle,
            borderClass: 'border-l-4 border-rose-500',
            activeClass: 'ring-2 ring-rose-500 bg-rose-50 border-rose-200',
            normalClass: 'bg-white hover:bg-rose-50/30 border-slate-200',
            iconContainer: 'bg-rose-50 text-rose-600',
            activeIconContainer: 'bg-rose-500 text-white',
          },
          {
            status: POStatus.SENT_TO_VENDOR,
            label: 'SENT TO_VENDOR',
            thaiLabel: 'ส่งให้คู่ค้าแล้ว',
            count: pos.filter(p => p.status === POStatus.SENT_TO_VENDOR).length,
            icon: Send,
            borderClass: 'border-l-4 border-blue-500',
            activeClass: 'ring-2 ring-blue-500 bg-blue-50 border-blue-200',
            normalClass: 'bg-white hover:bg-blue-50/30 border-slate-200',
            iconContainer: 'bg-blue-50 text-blue-600',
            activeIconContainer: 'bg-blue-500 text-white',
          },
          {
            status: POStatus.CLOSED,
            label: 'CLOSED',
            thaiLabel: 'ปิดงานเสร็จสิ้น',
            count: pos.filter(p => p.status === POStatus.CLOSED).length,
            icon: FileCheck2,
            borderClass: 'border-l-4 border-emerald-500',
            activeClass: 'ring-2 ring-emerald-500 bg-emerald-50 border-emerald-200',
            normalClass: 'bg-white hover:bg-emerald-50/30 border-slate-200',
            iconContainer: 'bg-emerald-50 text-emerald-600',
            activeIconContainer: 'bg-emerald-500 text-white',
          },
          {
            status: POStatus.CANCELLED,
            label: 'CANCELLED',
            thaiLabel: 'ยกเลิก',
            count: pos.filter(p => p.status === POStatus.CANCELLED).length,
            icon: Ban,
            borderClass: 'border-l-4 border-slate-400',
            activeClass: 'ring-2 ring-slate-500 bg-slate-100 border-slate-300',
            normalClass: 'bg-white hover:bg-slate-50 border-slate-200',
            iconContainer: 'bg-slate-100 text-slate-500',
            activeIconContainer: 'bg-slate-500 text-white',
          },
        ].map((card) => {
          const IconComponent = card.icon;
          const isSelected = statusFilter === card.status;
          return (
            <button
              key={card.status}
              onClick={() => setStatusFilter(card.status)}
              className={`flex flex-col justify-between p-3.5 border rounded-xl text-left transition-all hover:scale-[1.02] hover:shadow-sm active:scale-95 duration-150 cursor-pointer ${card.borderClass} ${
                isSelected ? card.activeClass : card.normalClass
              }`}
              id={`po-dashboard-card-${card.status}`}
            >
              <div className="flex items-center justify-between w-full mb-3">
                <span className={`p-1.5 rounded-lg transition-colors ${
                  isSelected ? card.activeIconContainer : card.iconContainer
                }`}>
                  <IconComponent className="h-4 w-4 shrink-0" />
                </span>
                <span className={`text-lg font-mono font-bold tracking-tight ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                  {card.count}
                </span>
              </div>
              <div className="space-y-0.5">
                <div className={`text-[10px] font-bold tracking-wider uppercase truncate max-w-full ${isSelected ? 'text-slate-900' : 'text-slate-600'}`} title={card.label}>
                  {card.label.replace('_', ' ')}
                </div>
                <div className="text-[9px] text-slate-400 font-medium font-sans block truncate">
                  {card.thaiLabel}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Search and Filters (hidden during printing) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-4 no-print">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by PO number, reference PR, vendor name, credit terms or departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 bg-slate-50/50 hover:bg-slate-50 rounded-lg focus:bg-white focus:ring-1 focus:ring-sky-500 transition-all outline-none"
              id="search-po-input"
            />
          </div>

          {/* Selector */}
          <div className="flex gap-2.5 items-center">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 outline-none hover:bg-slate-50"
              id="filter-po-status"
            >
              <option value="ALL">Show All Status</option>
              <option value={POStatus.PENDING_PURCHASING_MGR}>Pending Manager Check</option>
              <option value={POStatus.PENDING_EXECUTIVE}>Pending MD Approval</option>
              <option value={POStatus.APPROVED}>Approved PO</option>
              <option value={POStatus.SENT_TO_VENDOR}>Dispatched to Vendor</option>
              <option value={POStatus.CLOSED}>Completed / Closed Jobs</option>
            </select>
          </div>
        </div>

        {/* Tab filters */}
        <div className="flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
          {(['ALL', ...Object.values(POStatus)] as const).map((status) => {
            const count = status === 'ALL' 
              ? pos.length 
              : pos.filter(p => p.status === status).length;

            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                  statusFilter === status
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                }`}
              >
                {status === 'ALL' ? 'All Orders' : status.replace('_', ' ')}
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-mono ${
                  statusFilter === status ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* PO Table (Screen View) */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">
                <th className="p-4 w-12 text-center">#</th>
                <th className="p-4">PO Number</th>
                <th className="p-4">Ref. PR Details</th>
                <th className="p-4">Supplier</th>
                <th className="p-4 text-right">Committed Value</th>
                <th className="p-4 text-center">Procurement Status</th>
                <th className="p-4 text-center w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredPos.map((po, idx) => (
                <tr 
                  key={po.id} 
                  className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                  onClick={() => onNavigate('po-details', po.id)}
                  id={`po-row-${po.poNumber}`}
                >
                  <td className="p-4 text-center text-slate-400 font-mono font-medium">{idx + 1}</td>
                  <td className="p-4 font-mono font-semibold text-slate-900">
                    <div className="flex items-center gap-1.5">
                      <FileCheck className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>{po.poNumber}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block font-normal font-sans mt-0.5">Dispatched: {po.date}</span>
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-slate-800">{po.referPrNumber}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{po.departmentName}</div>
                  </td>
                  <td className="p-4 font-semibold text-slate-800">
                    <div className="truncate max-w-[150px]" title={po.vendorName}>
                      {po.vendorName}
                    </div>
                    <span className="text-[10px] text-slate-400 block font-mono font-normal">Terms: {po.creditTerm}</span>
                  </td>
                  <td className="p-4 text-right font-mono font-bold text-slate-900">
                    {po.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} THB
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wide inline-block ${getStatusBadgeClass(po.status)}`}>
                      {po.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onNavigate('po-details', po.id)}
                        className="p-1.5 text-slate-500 hover:text-sky-600 border border-slate-200 hover:border-sky-300 bg-white rounded-lg shadow-2xs hover:bg-sky-50 transition-all cursor-pointer"
                        title="View Details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      {(currentUser?.employeeId === '43210344' || currentUser?.role === UserRole.ADMINISTRATOR) && onDeletePO && (
                        <button
                          onClick={() => onDeletePO(po.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-300 bg-white rounded-lg shadow-2xs hover:bg-rose-50 transition-all cursor-pointer"
                          title="ลบใบสั่งซื้อ (Admin Master)"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPos.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <AlertCircle className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-xs text-slate-600">No Purchase Orders Found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Please check back later or generate new POs from fully approved requisitions.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable PO PDF Export Document (Visible only when printing) */}
      <div className="hidden print:block p-8 bg-white text-slate-900 text-xs font-sans space-y-6" id="printable-po-summary-report">
        {/* Report Header */}
        <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">SUMINO AAPICO (THAILAND) CO., LTD.</h1>
            <p className="text-[10px] text-slate-500">700/318 Moo 6, Amata City Chonburi Industrial Estate, Chonburi 20000</p>
            <h2 className="text-sm font-bold text-indigo-800 mt-2 uppercase">Purchase Order (PO) Export Report</h2>
          </div>
          <div className="text-right text-[10px] space-y-1">
            <p className="font-bold">Date: {new Date().toLocaleDateString('en-GB')}</p>
            <p className="text-slate-500">Time: {new Date().toLocaleTimeString()}</p>
            <p className="text-slate-500">Filter: {statusFilter === 'ALL' ? 'All Statuses' : statusFilter}</p>
            <p className="text-slate-500">Generated By: {currentUser?.name || 'System User'}</p>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-3 gap-4 p-3 bg-slate-50 border border-slate-200 rounded-md">
          <div>
            <span className="text-[10px] text-slate-500 font-medium block">Total Purchase Orders</span>
            <span className="text-sm font-bold text-slate-900 font-mono">{filteredPos.length} Orders</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-medium block">Status Filter</span>
            <span className="text-sm font-bold text-slate-900">{statusFilter}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 font-medium block">Committed Order Value</span>
            <span className="text-sm font-bold text-slate-900 font-mono">{totalPOValue.toLocaleString(undefined, { minimumFractionDigits: 2 })} THB</span>
          </div>
        </div>

        {/* Data Table */}
        <table className="w-full text-left border-collapse border border-slate-300">
          <thead>
            <tr className="bg-slate-100 text-[10px] font-bold uppercase text-slate-700">
              <th className="p-2 border border-slate-300 w-8 text-center">#</th>
              <th className="p-2 border border-slate-300">PO Number</th>
              <th className="p-2 border border-slate-300">Ref PR</th>
              <th className="p-2 border border-slate-300">PO Date</th>
              <th className="p-2 border border-slate-300">Department</th>
              <th className="p-2 border border-slate-300">Supplier / Vendor</th>
              <th className="p-2 border border-slate-300 text-center">Credit Terms</th>
              <th className="p-2 border border-slate-300 text-center">Status</th>
              <th className="p-2 border border-slate-300 text-right">Net Value (THB)</th>
            </tr>
          </thead>
          <tbody className="text-[10px]">
            {filteredPos.map((po, idx) => (
              <tr key={po.id} className="border-b border-slate-200">
                <td className="p-2 border border-slate-300 text-center font-mono">{idx + 1}</td>
                <td className="p-2 border border-slate-300 font-mono font-bold">{po.poNumber}</td>
                <td className="p-2 border border-slate-300 font-mono">{po.referPrNumber}</td>
                <td className="p-2 border border-slate-300">{po.date}</td>
                <td className="p-2 border border-slate-300">{po.departmentName}</td>
                <td className="p-2 border border-slate-300">{po.vendorName}</td>
                <td className="p-2 border border-slate-300 text-center font-mono">{po.creditTerm}</td>
                <td className="p-2 border border-slate-300 text-center uppercase font-semibold">{po.status.replace('_', ' ')}</td>
                <td className="p-2 border border-slate-300 text-right font-mono font-bold">
                  {po.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
            <tr className="bg-slate-100 font-bold">
              <td colSpan={8} className="p-2 border border-slate-300 text-right uppercase">Total Value:</td>
              <td className="p-2 border border-slate-300 text-right font-mono text-xs text-slate-900">
                {totalPOValue.toLocaleString(undefined, { minimumFractionDigits: 2 })} THB
              </td>
            </tr>
          </tbody>
        </table>

        {/* Footer / Approval Sign-off */}
        <div className="pt-8 border-t border-slate-200 grid grid-cols-3 gap-6 text-center text-[10px]">
          <div className="space-y-8">
            <p className="font-bold text-slate-600">Report Exported By</p>
            <div className="border-b border-slate-400 w-3/4 mx-auto pb-1">({currentUser?.name || 'Authorized Staff'})</div>
            <p className="text-slate-400 text-[9px]">Date: ____ / ____ / ________</p>
          </div>
          <div className="space-y-8">
            <p className="font-bold text-slate-600">Checked By Purchasing Mgr</p>
            <div className="border-b border-slate-400 w-3/4 mx-auto pb-1">Signature</div>
            <p className="text-slate-400 text-[9px]">Date: ____ / ____ / ________</p>
          </div>
          <div className="space-y-8">
            <p className="font-bold text-slate-600">Approved By Executive</p>
            <div className="border-b border-slate-400 w-3/4 mx-auto pb-1">Signature</div>
            <p className="text-slate-400 text-[9px]">Date: ____ / ____ / ________</p>
          </div>
        </div>
      </div>
    </div>
  );
}
