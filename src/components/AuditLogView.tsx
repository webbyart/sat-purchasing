/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Download, 
  Activity, 
  Building, 
  Terminal,
  Clock
} from 'lucide-react';
import { AuditLog } from '../types.js';

interface AuditLogViewProps {
  logs: AuditLog[];
}

export default function AuditLogView({ logs }: AuditLogViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('ALL');
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    let result = logs;

    if (moduleFilter !== 'ALL') {
      result = result.filter(l => l.module === moduleFilter);
    }

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(l => 
        l.userName.toLowerCase().includes(term) ||
        l.action.toLowerCase().includes(term) ||
        l.details.toLowerCase().includes(term) ||
        l.ipAddress.toLowerCase().includes(term) ||
        l.userId.toLowerCase().includes(term)
      );
    }

    setFilteredLogs(result);
  }, [logs, searchTerm, moduleFilter]);

  const exportCSV = () => {
    const headers = ['Timestamp', 'User ID', 'User Name', 'Role', 'Action', 'Module', 'Details', 'IP Address', 'User Agent'];
    const rows = filteredLogs.map(l => [
      l.timestamp,
      l.userId,
      l.userName,
      l.userRole,
      l.action,
      l.module,
      `"${l.details.replace(/"/g, '""')}"`,
      l.ipAddress,
      `"${l.userAgent.replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SuminoAapico_Procurement_AuditTrail_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top action block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Security Audit Logs & Verification</h2>
          <p className="text-xs text-slate-500">
            Real-time digital signatures logs, session accesses, and cost center budget alterations
          </p>
        </div>

        <button
          onClick={exportCSV}
          disabled={filteredLogs.length === 0}
          className="px-4 py-2 text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none"
          id="btn-export-audit"
        >
          <Download className="h-4 w-4" />
          Export Log History (CSV)
        </button>
      </div>

      {/* Summary status and search */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search audit trail by actor, exact action description, IP address or user ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 bg-slate-50/50 hover:bg-slate-50 rounded-lg focus:bg-white focus:ring-1 focus:ring-sky-500 transition-all outline-none"
              id="search-audit-input"
            />
          </div>

          {/* Module Select */}
          <div className="flex gap-2.5 items-center">
            <Terminal className="h-4 w-4 text-slate-400" />
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 outline-none hover:bg-slate-50"
              id="filter-audit-module"
            >
              <option value="ALL">All Modules</option>
              <option value="PR">Purchase Requisitions (PR)</option>
              <option value="PO">Purchase Orders (PO)</option>
              <option value="WORKFLOW">Workflow Engine Actions</option>
              <option value="AUTH">Authentication / Logins</option>
              <option value="SYSTEM">System Adjustments</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Audit table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs text-slate-700">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">
                <th className="p-4 w-48">Timestamp (UTC)</th>
                <th className="p-4 w-48">Actor Details</th>
                <th className="p-4 w-44">Action Event</th>
                <th className="p-4 w-28 text-center">Module</th>
                <th className="p-4">Detailed Description</th>
                <th className="p-4 w-32">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/40">
                  <td className="p-4 font-mono text-[10px] text-slate-500 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-300" />
                    {log.timestamp.replace('T', ' ').substring(0, 19)}
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-slate-800">{log.userName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">ID: {log.userId} • {log.userRole}</div>
                  </td>
                  <td className="p-4 font-mono font-bold text-slate-700 text-[10.5px]">
                    {log.action}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-md font-mono ${
                      log.module === 'AUTH' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                      log.module === 'PR' ? 'bg-sky-50 text-sky-600 border border-sky-100' :
                      log.module === 'PO' ? 'bg-teal-50 text-teal-600 border border-teal-100' :
                      log.module === 'WORKFLOW' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {log.module}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600 font-medium font-sans leading-relaxed text-[11px]">
                    {log.details}
                  </td>
                  <td className="p-4">
                    <div className="font-mono text-[10.5px] text-slate-600">{log.ipAddress}</div>
                    <div className="text-[9px] text-slate-400 font-sans truncate max-w-[120px]" title={log.userAgent}>
                      {log.userAgent}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400 font-semibold text-xs">
                    No matching audit trail logs recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
