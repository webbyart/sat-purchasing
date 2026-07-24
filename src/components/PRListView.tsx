/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  FileText, 
  Plus, 
  Eye, 
  Trash2, 
  AlertCircle,
  Download,
  Printer
} from 'lucide-react';
import { PR, PRStatus, User, UserRole } from '../types.js';

interface PRListViewProps {
  prs: PR[];
  currentUser: User;
  onNavigate: (view: string, id?: string) => void;
  onCancelRequest?: (id: string) => void;
}

export default function PRListView({ prs = [], currentUser, onNavigate, onCancelRequest }: PRListViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | PRStatus>('ALL');
  const [filteredPrs, setFilteredPrs] = useState<PR[]>([]);

  useEffect(() => {
    let result = Array.isArray(prs) ? prs : [];
    if (!currentUser) {
      setFilteredPrs([]);
      return;
    }

    // Apply role-based filtering:
    // 1. Employee sees only their own PRs (unless in HR/GA dept)
    // 2. Department Manager sees PRs within their department (unless in HR/GA dept)
    // 3. Executive sees PRs that are past department manager approval state (PENDING_EXECUTIVE, APPROVED, PO_CREATED, REJECTED, CANCELLED)
    if (currentUser.role === UserRole.EMPLOYEE && currentUser.departmentId !== 'DEP004') {
      result = result.filter(pr => pr.requestorId === currentUser.id || pr.requestorEmail === currentUser.email);
    } else if (currentUser.role === UserRole.DEPARTMENT_MANAGER && currentUser.departmentId !== 'DEP004') {
      result = result.filter(pr => pr.departmentId === currentUser.departmentId);
    } else if (currentUser.role === UserRole.EXECUTIVE) {
      result = result.filter(pr => pr.status !== PRStatus.DRAFT && pr.status !== PRStatus.PENDING_DEPT_MGR);
    }

    if (statusFilter !== 'ALL') {
      result = result.filter(pr => pr.status === statusFilter);
    }

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(pr => {
        if (!pr) return false;
        const prNum = pr.prNumber || '';
        const reqName = pr.requestorName || '';
        const vName = pr.vendorName || '';
        const deptName = pr.departmentName || '';
        const obj = pr.purchaseObjective || '';
        return (
          prNum.toLowerCase().includes(term) ||
          reqName.toLowerCase().includes(term) ||
          vName.toLowerCase().includes(term) ||
          deptName.toLowerCase().includes(term) ||
          obj.toLowerCase().includes(term)
        );
      });
    }

    // Sort newest first
    setFilteredPrs([...result].reverse());
  }, [prs, searchTerm, statusFilter, currentUser]);

  const getStatusBadgeClass = (status: PRStatus) => {
    switch (status) {
      case PRStatus.DRAFT:
        return 'bg-slate-100 text-slate-700 border border-slate-200';
      case PRStatus.PENDING_DEPT_MGR:
        return 'bg-amber-50 text-amber-600 border border-amber-200';
      case PRStatus.PENDING_EXECUTIVE:
        return 'bg-purple-50 text-purple-600 border border-purple-200';
      case PRStatus.PENDING_PURCHASING:
        return 'bg-sky-50 text-sky-600 border border-sky-200';
      case PRStatus.APPROVED:
        return 'bg-indigo-50 text-indigo-600 border border-indigo-200';
      case PRStatus.PO_CREATED:
        return 'bg-emerald-50 text-emerald-600 border border-emerald-200';
      case PRStatus.REJECTED:
        return 'bg-rose-50 text-rose-600 border border-rose-200';
      case PRStatus.CANCELLED:
        return 'bg-slate-100 text-slate-400 line-through border border-slate-200';
      default:
        return 'bg-slate-50 text-slate-500';
    }
  };

  const totalPRValue = filteredPrs.reduce((sum, pr) => sum + (pr.grandTotal || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top action layout (hidden during printing) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Purchase Requisitions (PR)</h2>
          <p className="text-xs text-slate-500">View corporate purchase flows, review pending signatures, or generate new requests.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 text-xs font-semibold bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
            id="btn-export-pr-pdf"
            title="Export current PR list as PDF report"
          >
            <Download className="h-4 w-4 text-rose-600" />
            <span>Export to PDF</span>
          </button>
          <button
            onClick={() => onNavigate('pr-new')}
            className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            id="btn-create-pr-list"
          >
            <Plus className="h-4 w-4" />
            <span>Create PR Request</span>
          </button>
        </div>
      </div>

      {/* Dashboard Summary Cards - Pastel Theme (hidden during printing) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 no-print">
        {(['ALL', ...Object.values(PRStatus)] as const).map((status) => {
          const count = status === 'ALL' 
            ? prs.length 
            : prs.filter(p => p.status === status).length;

          const getPastelColors = (s: string) => {
            switch (s) {
              case 'ALL': return 'bg-blue-50 border-blue-100 text-blue-700';
              case PRStatus.DRAFT: return 'bg-slate-50 border-slate-100 text-slate-600';
              case PRStatus.PENDING_DEPT_MGR: return 'bg-amber-50 border-amber-100 text-amber-700';
              case PRStatus.PENDING_EXECUTIVE: return 'bg-purple-50 border-purple-100 text-purple-700';
              case PRStatus.PENDING_PURCHASING: return 'bg-sky-50 border-sky-100 text-sky-700';
              case PRStatus.APPROVED: return 'bg-teal-50 border-teal-100 text-teal-700';
              case PRStatus.REJECTED: return 'bg-rose-50 border-rose-100 text-rose-700';
              case PRStatus.PO_CREATED: return 'bg-emerald-50 border-emerald-100 text-emerald-700';
              case PRStatus.CANCELLED: return 'bg-gray-100 border-gray-200 text-gray-500';
              default: return 'bg-slate-50 border-slate-100 text-slate-600';
            }
          };

          const isActive = statusFilter === status;
          const colors = getPastelColors(status);

          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all hover:shadow-sm ${colors} ${
                isActive ? 'ring-2 ring-offset-2 ring-slate-900 opacity-100 scale-105' : 'opacity-80 hover:opacity-100'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider mb-1">
                {status === 'ALL' ? 'All Requests' : status.replace('_', ' ')}
              </span>
              <span className="text-2xl font-black">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Searching / Filtering Box */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-4 no-print">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by PR number, requestor, supplier, cost center, department or objectives..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 bg-slate-50/50 hover:bg-slate-50 rounded-lg focus:bg-white focus:ring-1 focus:ring-sky-500 transition-all outline-none"
              id="search-pr-input"
            />
          </div>

          {/* Quick Filter Select */}
          <div className="flex gap-2.5 items-center">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 outline-none hover:bg-slate-50"
              id="filter-pr-status"
            >
              <option value="ALL">Show All Status</option>
              <option value={PRStatus.DRAFT}>Drafts Only</option>
              <option value={PRStatus.PENDING_DEPT_MGR}>Pending Manager Approval</option>
              <option value={PRStatus.PENDING_EXECUTIVE}>Pending Executive Approval</option>
              <option value={PRStatus.PENDING_PURCHASING}>Pending Purchasing Check</option>
              <option value={PRStatus.APPROVED}>Approved (Ready for PO)</option>
              <option value={PRStatus.PO_CREATED}>PO Created</option>
              <option value={PRStatus.REJECTED}>Rejected Requisitions</option>
              <option value={PRStatus.CANCELLED}>Cancelled Requests</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main PR Table Layout (Screen View) */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">
                <th className="p-4 w-12 text-center">#</th>
                <th className="p-4">PR Number</th>
                <th className="p-4">Requestor Details</th>
                <th className="p-4">Supplier</th>
                <th className="p-4 text-right">Grand Total</th>
                <th className="p-4 text-center">Workflow Stage</th>
                <th className="p-4 text-center w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredPrs.map((pr, idx) => (
                <tr 
                  key={pr.id} 
                  className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                  onClick={() => onNavigate('pr-details', pr.id)}
                  id={`pr-row-${pr.id}`}
                >
                  <td className="p-4 text-center text-slate-400 font-mono font-medium">{idx + 1}</td>
                  <td className="p-4 font-mono font-semibold text-slate-900">
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>{pr.prNumber}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block font-normal font-sans mt-0.5">Raised: {pr.date}</span>
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-slate-800">{pr.requestorName}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{pr.departmentName}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-slate-800 truncate max-w-[150px]" title={pr.vendorName}>
                      {pr.vendorName}
                    </div>
                    <span className="text-[10px] text-slate-400 block">Credit: {pr.vendorTaxId ? 'Verified Tax' : 'N/A'}</span>
                  </td>
                  <td className="p-4 text-right font-mono font-bold text-slate-900">
                    {pr.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} THB
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wide inline-block ${getStatusBadgeClass(pr.status)}`}>
                      {pr.status === PRStatus.APPROVED 
                        ? 'APPROVED (รอออก PO)' 
                        : (pr.status === PRStatus.PENDING_DEPT_MGR ? 'Send Assismanager approved' : pr.status.replace('_', ' '))}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {pr.status === PRStatus.APPROVED && (
                        <button
                          onClick={() => onNavigate('pr-details', pr.id)}
                          className="px-2 py-1 text-[10px] font-extrabold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-2xs transition-all flex items-center gap-1 cursor-pointer shrink-0"
                          title="คลิกเพื่อออกใบสั่งซื้อ (PO) ทันที"
                        >
                          <FileText className="h-3 w-3" />
                          <span>ออก PO</span>
                        </button>
                      )}

                      <button
                        onClick={() => onNavigate('pr-details', pr.id)}
                        className="p-1.5 text-slate-500 hover:text-sky-600 border border-slate-200 hover:border-sky-300 bg-white rounded-lg shadow-2xs hover:bg-sky-50 transition-all"
                        title="View Details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      
                      {((pr.status === PRStatus.DRAFT) || currentUser?.employeeId === '43210344' || currentUser?.role === UserRole.ADMINISTRATOR) && onCancelRequest && (
                        <button
                          onClick={() => onCancelRequest(pr.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-300 bg-white rounded-lg shadow-2xs hover:bg-rose-50 transition-all cursor-pointer"
                          title={currentUser?.employeeId === '43210344' || currentUser?.role === UserRole.ADMINISTRATOR ? "ลบใบขอซื้อ (Admin Master)" : "ลบร่างใบขอซื้อ"}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPrs.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <AlertCircle className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-xs text-slate-600">No Requisitions Found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Modify your search query or status filter criteria and try again.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable PDF Export Document (Visible only when printing) */}
      <div className="hidden print:block p-8 bg-white text-slate-900 text-xs font-sans space-y-6" id="printable-pr-summary-report">
        {/* Report Header */}
        <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">SUMINO AAPICO (THAILAND) CO., LTD.</h1>
            <p className="text-[10px] text-slate-500">700/318 Moo 6, Amata City Chonburi Industrial Estate, Chonburi 20000</p>
            <h2 className="text-sm font-bold text-sky-800 mt-2 uppercase">Purchase Requisition (PR) Export Report</h2>
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
            <span className="text-[10px] text-slate-500 font-medium block">Total Requisitions</span>
            <span className="text-sm font-bold text-slate-900 font-mono">{filteredPrs.length} PRs</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-medium block">Status Scope</span>
            <span className="text-sm font-bold text-slate-900">{statusFilter}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 font-medium block">Combined Total Amount</span>
            <span className="text-sm font-bold text-slate-900 font-mono">{totalPRValue.toLocaleString(undefined, { minimumFractionDigits: 2 })} THB</span>
          </div>
        </div>

        {/* Data Table */}
        <table className="w-full text-left border-collapse border border-slate-300">
          <thead>
            <tr className="bg-slate-100 text-[10px] font-bold uppercase text-slate-700">
              <th className="p-2 border border-slate-300 w-8 text-center">#</th>
              <th className="p-2 border border-slate-300">PR Number</th>
              <th className="p-2 border border-slate-300">Date</th>
              <th className="p-2 border border-slate-300">Requestor & Dept</th>
              <th className="p-2 border border-slate-300">Supplier / Vendor</th>
              <th className="p-2 border border-slate-300 text-center">Status</th>
              <th className="p-2 border border-slate-300 text-right">Grand Total (THB)</th>
            </tr>
          </thead>
          <tbody className="text-[10px]">
            {filteredPrs.map((pr, idx) => (
              <tr key={pr.id} className="border-b border-slate-200">
                <td className="p-2 border border-slate-300 text-center font-mono">{idx + 1}</td>
                <td className="p-2 border border-slate-300 font-mono font-bold">{pr.prNumber}</td>
                <td className="p-2 border border-slate-300">{pr.date}</td>
                <td className="p-2 border border-slate-300">
                  <div className="font-semibold">{pr.requestorName}</div>
                  <div className="text-[9px] text-slate-500">{pr.departmentName}</div>
                </td>
                <td className="p-2 border border-slate-300">{pr.vendorName}</td>
                <td className="p-2 border border-slate-300 text-center uppercase font-semibold">{pr.status.replace('_', ' ')}</td>
                <td className="p-2 border border-slate-300 text-right font-mono font-bold">
                  {pr.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
            <tr className="bg-slate-100 font-bold">
              <td colSpan={6} className="p-2 border border-slate-300 text-right uppercase">Total Amount:</td>
              <td className="p-2 border border-slate-300 text-right font-mono text-xs text-slate-900">
                {totalPRValue.toLocaleString(undefined, { minimumFractionDigits: 2 })} THB
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
            <p className="font-bold text-slate-600">Checked By Manager</p>
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
