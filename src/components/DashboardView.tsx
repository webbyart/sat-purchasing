/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Briefcase,
  DollarSign,
  Building,
  User as UserIcon,
  ArrowRight,
  TrendingDown,
  Globe,
  Settings,
  Users,
  Award,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  BarChart2,
  Sliders,
  Check
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';
import { PR, PO, Department, User, UserRole, PRStatus, POStatus, WorkflowRule } from '../types.js';

const CustomBudgetTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-2xl border border-slate-700 text-xs space-y-1.5 z-30 font-sans max-w-xs">
        <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-1.5">
          <span className="font-bold text-sky-400 text-sm">{data.departmentName} ({data.code})</span>
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
            data.status === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
            data.status === 'WARNING' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
            'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
          }`}>
            {data.status}
          </span>
        </div>

        <div className="space-y-1 font-mono text-[11px]">
          <div className="flex justify-between text-slate-300">
            <span>Annual Budget Limit:</span>
            <span className="font-bold text-white">฿{data.budget.toLocaleString()} THB</span>
          </div>
          <div className="flex justify-between text-sky-300">
            <span>Spent Budget:</span>
            <span className="font-bold">฿{data.spent.toLocaleString()} THB ({data.usageRatio}%)</span>
          </div>
          <div className="flex justify-between text-emerald-300">
            <span>Remaining Capacity:</span>
            <span className="font-bold">฿{data.remaining.toLocaleString()} THB ({data.remainingRatio}%)</span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800 text-[10px] text-amber-300 flex items-center gap-1 font-mono">
          <ShieldCheck className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          <span>Rule: Orders &gt; ฿{data.execThreshold.toLocaleString()} THB require Exec Sign-off</span>
        </div>
      </div>
    );
  }
  return null;
};

interface DashboardViewProps {
  prs: PR[];
  pos: PO[];
  departments: Department[];
  workflowRules?: WorkflowRule[];
  onNavigate: (view: string, targetId?: string) => void;
  currentUser: User;
}

export default function DashboardView({ 
  prs: rawPRsInput = [], 
  pos: rawPOsInput = [], 
  departments: rawDeptsInput = [], 
  workflowRules = [],
  onNavigate, 
  currentUser 
}: DashboardViewProps) {
  const rawPRs = Array.isArray(rawPRsInput) ? rawPRsInput : [];
  const rawPOs = Array.isArray(rawPOsInput) ? rawPOsInput : [];
  const departments = Array.isArray(rawDeptsInput) ? rawDeptsInput : [];
  
  // Tab-state inside the comparative chart
  const [activeChartTab, setActiveChartTab] = useState<'value' | 'volume'>('value');

  // Filter purchase requisitions based on Role-Based Access Control (RBAC)
  const prs = React.useMemo(() => {
    if (!currentUser) return rawPRs;
    if (currentUser.role === UserRole.EMPLOYEE) {
      return rawPRs.filter(p => p.requestorId === currentUser.id || p.requestorEmail === currentUser.email);
    } else if (currentUser.role === UserRole.DEPARTMENT_MANAGER) {
      return rawPRs.filter(p => p.departmentId === currentUser.departmentId);
    } else if (currentUser.role === UserRole.EXECUTIVE) {
      return rawPRs.filter(p => p.status !== PRStatus.DRAFT && p.status !== PRStatus.PENDING_DEPT_MGR);
    }
    return rawPRs;
  }, [rawPRs, currentUser]);

  // Filter purchase orders based on RBAC
  const pos = React.useMemo(() => {
    if (!currentUser) return rawPOs;
    if (currentUser.role === UserRole.EMPLOYEE) {
      return rawPOs.filter(po => {
        const correspondingPR = rawPRs.find(pr => pr.id === po.referPrId);
        return correspondingPR ? (correspondingPR.requestorId === currentUser.id || correspondingPR.requestorEmail === currentUser.email) : false;
      });
    } else if (currentUser.role === UserRole.DEPARTMENT_MANAGER) {
      return rawPOs.filter(po => po.departmentId === currentUser.departmentId);
    } else if (currentUser.role === UserRole.EXECUTIVE) {
      return rawPOs.filter(po => po.status !== POStatus.DRAFT);
    }
    return rawPOs;
  }, [rawPOs, rawPRs, currentUser]);

  const [stats, setStats] = useState({
    pendingPR: 0,
    pendingPO: 0,
    approvedPR: 0,
    rejectedPR: 0,
    totalPRVal: 0,
    totalPOVal: 0
  });

  useEffect(() => {
    const pendingPR = prs.filter(p => ['PENDING_DEPT_MGR', 'PENDING_EXECUTIVE', 'PENDING_PURCHASING'].includes(p.status)).length;
    const pendingPO = pos.filter(p => ['PENDING_PURCHASING_MGR', 'PENDING_EXECUTIVE'].includes(p.status)).length;
    const approvedPR = prs.filter(p => ['APPROVED', 'PO_CREATED'].includes(p.status)).length;
    const rejectedPR = prs.filter(p => p.status === 'REJECTED').length;

    const totalPRVal = prs.reduce((sum, p) => sum + (p.status !== 'CANCELLED' ? p.grandTotal : 0), 0);
    const totalPOVal = pos.reduce((sum, p) => sum + (p.status !== 'CANCELLED' ? p.grandTotal : 0), 0);

    setStats({ pendingPR, pendingPO, approvedPR, rejectedPR, totalPRVal, totalPOVal });
  }, [prs, pos]);

  // Department expenditures allocation progress
  const deptSpends = departments.map(d => {
    const totalAllocated = d.budget;
    const totalSpent = d.spent;
    const percent = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;
    return {
      name: d.name,
      code: d.code,
      allocated: totalAllocated,
      spent: totalSpent,
      remaining: d.remaining,
      percent
    };
  });

  // Active workflow rule parameters
  const globalWorkflowRule = workflowRules[0] || {
    id: 'WFR001',
    departmentId: 'ALL',
    amountLimit: 100000,
    requireExecutiveApproval: true,
    parallelApproval: false,
    delegateActive: false
  };

  // Process departmental budget rules & capacity data for Recharts Progress Chart
  const rechartsBudgetData = departments.map(d => {
    const deptRule = workflowRules.find(r => r.departmentId === d.id) || globalWorkflowRule;
    const budget = d.budget || 0;
    const spent = d.spent || 0;
    const remaining = Math.max(0, budget - spent);
    const usageRatio = budget > 0 ? (spent / budget) * 100 : 0;
    const execThreshold = deptRule.amountLimit || 100000;

    return {
      departmentName: d.name,
      code: d.code,
      spent: spent,
      remaining: remaining,
      budget: budget,
      usageRatio: Math.round(usageRatio),
      remainingRatio: Math.max(0, 100 - Math.round(usageRatio)),
      execThreshold: execThreshold,
      requireExecutiveApproval: deptRule.requireExecutiveApproval,
      status: usageRatio >= 90 ? 'CRITICAL' : usageRatio >= 75 ? 'WARNING' : 'HEALTHY'
    };
  });

  // Top vendor contract distribution
  const vendorMap: { [name: string]: number } = {};
  pos.forEach(p => {
    if (p.status !== 'CANCELLED') {
      vendorMap[p.vendorName] = (vendorMap[p.vendorName] || 0) + p.grandTotal;
    }
  });
  const vendorSpend = Object.keys(vendorMap)
    .map(name => ({ name, value: vendorMap[name] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const maxVendorVal = vendorSpend.length > 0 ? Math.max(...vendorSpend.map(v => v.value)) : 1;

  // Monthly statistical trend mock data for dual-axis amCharts replication
  const monthlyData = [
    { month: 'ม.ค.', pr: 420000, po: 350000, itemsPR: 12, itemsPO: 10 },
    { month: 'ก.พ.', pr: 580000, po: 490000, itemsPR: 15, itemsPO: 12 },
    { month: 'มี.ค.', pr: 890000, po: 750000, itemsPR: 24, itemsPO: 19 },
    { month: 'เม.ย.', pr: 610000, po: 520000, itemsPR: 18, itemsPO: 14 },
    { month: 'พ.ค.', pr: 1200000, po: 1050000, itemsPR: 32, itemsPO: 28 },
    { month: 'มิ.ย.', pr: 950000, po: 880000, itemsPR: 27, itemsPO: 23 },
    { month: 'ก.ค.', pr: Math.max(stats.totalPRVal, 750000), po: Math.max(stats.totalPOVal, 620000), itemsPR: prs.length || 10, itemsPO: pos.length || 8 }
  ];

  const maxMonthlyVal = Math.max(...monthlyData.map(m => Math.max(m.pr, m.po))) || 1;
  const maxMonthlyItems = Math.max(...monthlyData.map(m => Math.max(m.itemsPR, m.itemsPO))) || 1;

  // Workflow Status Distribution (Donut Segment calculation)
  const prDrafts = prs.filter(p => p.status === 'DRAFT').length;
  const prApproved = stats.approvedPR;
  const prPending = stats.pendingPR;
  const prRejected = stats.rejectedPR;
  const totalSegments = prDrafts + prApproved + prPending + prRejected || 1;

  const prDraftPercent = Math.round((prDrafts / totalSegments) * 100);
  const prApprovedPercent = Math.round((prApproved / totalSegments) * 100);
  const prPendingPercent = Math.round((prPending / totalSegments) * 100);
  const prRejectedPercent = Math.round((prRejected / totalSegments) * 100);

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-left font-sans">
      
      {/* Adminty Breadcrumbs & Page Title Section */}
      <div className="bg-white p-5 rounded-lg shadow-2xs border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-adminty-primary inline-block" />
            ระบบแผงควบคุมระบบจัดซื้อ (e-Purchase Dashboard)
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            ภาพรวมกระบวนการขอซื้อและสั่งซื้อ ความก้าวหน้างบประมาณแผนก และเอกสารที่รออนุมัติ
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button 
            onClick={() => onNavigate('pr-new')}
            className="px-4 py-2 text-xs font-semibold bg-adminty-primary text-white rounded-md hover:opacity-90 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            id="btn-create-pr-dash"
          >
            <FileText className="h-4 w-4" />
            สร้างใบขอซื้อ (New PR)
          </button>
        </div>
      </div>

      {/* 4 Hero Stats Cards arranged as exactly shown in the Adminty UI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: PO spending (Orange style) */}
        <div className="bg-white rounded-lg border border-slate-100 shadow-3xs overflow-hidden group hover:shadow-md transition-shadow relative">
          <div className="p-5 flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">ยอดสั่งซื้อคอมมิต (PO Total)</p>
              <h3 className="text-xl font-black text-adminty-orange mt-2 font-sans tracking-tight">
                ฿{stats.totalPOVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </h3>
              <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                <span className="text-adminty-orange font-bold">↑ 34%</span>
                <span>เทียบกับสัปดาห์ก่อน</span>
              </p>
            </div>
            {/* Soft decorative chart wave representation in SVG */}
            <div className="w-16 h-10 opacity-80">
              <svg viewBox="0 0 100 40" className="w-full h-full">
                <path d="M0,35 Q15,5 30,25 T60,10 T90,30" fill="none" stroke="#fe9365" strokeWidth="3" strokeLinecap="round" />
                <circle cx="90" cy="30" r="4" fill="#fe9365" />
              </svg>
            </div>
          </div>
          <div className="h-1 bg-adminty-orange w-full" />
        </div>

        {/* Card 2: Workflows awaiting approval (Green style) */}
        <div className="bg-white rounded-lg border border-slate-100 shadow-3xs overflow-hidden group hover:shadow-md transition-shadow relative">
          <div className="p-5 flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">งานที่รอการอนุมัติ (Pending)</p>
              <h3 className="text-2xl font-black text-adminty-green mt-2 font-sans tracking-tight">
                {stats.pendingPR + stats.pendingPO} <span className="text-xs font-normal text-slate-400">รายการ</span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                <span className="text-adminty-green font-bold">Active</span>
                <span>รอผู้บริหารและจัดซื้อ</span>
              </p>
            </div>
            {/* Green mini wave */}
            <div className="w-16 h-10 opacity-80">
              <svg viewBox="0 0 100 40" className="w-full h-full">
                <path d="M0,15 Q20,35 40,10 T80,30 T100,5" fill="none" stroke="#0ac282" strokeWidth="3" strokeLinecap="round" />
                <circle cx="100" cy="5" r="4" fill="#0ac282" />
              </svg>
            </div>
          </div>
          <div className="h-1 bg-adminty-green w-full" />
        </div>

        {/* Card 3: Completed purchasing processes (Pink style) */}
        <div className="bg-white rounded-lg border border-slate-100 shadow-3xs overflow-hidden group hover:shadow-md transition-shadow relative">
          <div className="p-5 flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">อนุมัติเสร็จสมบูรณ์ (Approved)</p>
              <h3 className="text-2xl font-black text-adminty-pink mt-2 font-sans tracking-tight">
                {stats.approvedPR} <span className="text-xs font-normal text-slate-400">เอกสาร</span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                <span className="text-adminty-pink font-bold">100%</span>
                <span>ออกเป็นใบสั่งซื้อแล้ว</span>
              </p>
            </div>
            {/* Pink mini wave */}
            <div className="w-16 h-10 opacity-80">
              <svg viewBox="0 0 100 40" className="w-full h-full">
                <path d="M0,25 Q15,35 35,15 T70,5 T100,20" fill="none" stroke="#fe5d70" strokeWidth="3" strokeLinecap="round" />
                <circle cx="100" cy="20" r="4" fill="#fe5d70" />
              </svg>
            </div>
          </div>
          <div className="h-1 bg-adminty-pink w-full" />
        </div>

        {/* Card 4: Total requisitions raised (Blue style) */}
        <div className="bg-white rounded-lg border border-slate-100 shadow-3xs overflow-hidden group hover:shadow-md transition-shadow relative">
          <div className="p-5 flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">รวมมูลค่าเสนอขอซื้อ (PR Total)</p>
              <h3 className="text-xl font-black text-adminty-blue mt-2 font-sans tracking-tight">
                ฿{stats.totalPRVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </h3>
              <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                <span className="text-adminty-blue font-bold">฿{(stats.totalPRVal / 1.07).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                <span>(ก่อนภาษี VAT 7%)</span>
              </p>
            </div>
            {/* Blue mini wave */}
            <div className="w-16 h-10 opacity-80">
              <svg viewBox="0 0 100 40" className="w-full h-full">
                <path d="M0,10 Q25,5 50,30 T100,10" fill="none" stroke="#01a9ac" strokeWidth="3" strokeLinecap="round" />
                <circle cx="100" cy="10" r="4" fill="#01a9ac" />
              </svg>
            </div>
          </div>
          <div className="h-1 bg-adminty-blue w-full" />
        </div>
      </div>

      {/* Main Charts & Bento Grid mimicking amCharts license layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Card: Comparative amCharts visitors style (PR vs PO Spend / Count) */}
        <div className="bg-white p-5 rounded-lg border border-slate-100 lg:col-span-2 shadow-2xs">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800">กราฟเปรียบเทียบใบขอซื้อ vs ใบสั่งซื้อ MoM</h3>
              <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                เปรียบเทียบมูลค่ารวม (บาท) และปริมาณเอกสารรายเดือนเพื่อตรวจสอบความคลาดเคลื่อนในการสั่งซื้อ
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded-md self-end sm:self-auto shrink-0">
              <button 
                onClick={() => setActiveChartTab('value')}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-sm transition-all cursor-pointer ${
                  activeChartTab === 'value' ? 'bg-white text-slate-800 shadow-3xs' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                มูลค่าจัดซื้อ (฿)
              </button>
              <button 
                onClick={() => setActiveChartTab('volume')}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-sm transition-all cursor-pointer ${
                  activeChartTab === 'volume' ? 'bg-white text-slate-800 shadow-3xs' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                ปริมาณใบงาน (ใบ)
              </button>
            </div>
          </div>

          {/* High-fidelity responsive interactive SVG bar graph block */}
          <div className="h-64 flex items-end justify-between gap-1 sm:gap-2 pt-6 px-1 border-b border-slate-200 relative">
            
            {/* Grid Line simulation */}
            <div className="absolute left-0 right-0 top-0 border-t border-dashed border-slate-100 h-0 w-full" />
            <div className="absolute left-0 right-0 top-1/4 border-t border-dashed border-slate-100 h-0 w-full" />
            <div className="absolute left-0 right-0 top-2/4 border-t border-dashed border-slate-100 h-0 w-full" />
            <div className="absolute left-0 right-0 top-3/4 border-t border-dashed border-slate-100 h-0 w-full" />

            {monthlyData.map((data, idx) => {
              // Calculate heights proportionally based on selected tab
              const prVal = activeChartTab === 'value' ? data.pr : data.itemsPR;
              const poVal = activeChartTab === 'value' ? data.po : data.itemsPO;
              const maxVal = activeChartTab === 'value' ? maxMonthlyVal : maxMonthlyItems;

              const prHeight = (prVal / maxVal) * 80; // max 80% height for breathing room
              const poHeight = (poVal / maxVal) * 80;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                  
                  {/* Floating tooltip on hover */}
                  <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 bg-slate-900 text-white text-[9px] py-1 px-1.5 rounded-sm shadow-md pointer-events-none transition-all z-20 flex flex-col items-center w-28 text-center">
                    <p className="font-bold">{data.month}</p>
                    <p className="text-adminty-orange font-mono mt-0.5">
                      PR: {activeChartTab === 'value' ? `฿${(data.pr/1000).toFixed(0)}k` : `${data.itemsPR} ใบ`}
                    </p>
                    <p className="text-adminty-blue font-mono">
                      PO: {activeChartTab === 'value' ? `฿${(data.po/1000).toFixed(0)}k` : `${data.itemsPO} ใบ`}
                    </p>
                  </div>

                  <div className="flex items-end justify-center gap-1 sm:gap-1.5 w-full">
                    {/* PR Bar (Soft pastel orange/salmon) */}
                    <div 
                      className="w-3.5 sm:w-5 bg-adminty-orange rounded-t-sm transition-all duration-700 shadow-2xs hover:brightness-95 cursor-pointer" 
                      style={{ height: `${Math.max(prHeight, 4)}%` }}
                    />
                    {/* PO Bar (Soft pastel blue/cyan) */}
                    <div 
                      className="w-3.5 sm:w-5 bg-adminty-blue rounded-t-sm transition-all duration-700 shadow-2xs hover:brightness-95 cursor-pointer" 
                      style={{ height: `${Math.max(poHeight, 4)}%` }}
                    />
                  </div>

                  {/* Month Label */}
                  <span className="text-[10px] font-bold text-slate-400 mt-2 font-sans shrink-0">{data.month}</span>
                </div>
              );
            })}
          </div>

          {/* Chart Legends */}
          <div className="flex justify-center gap-6 mt-4 text-[10px] font-bold text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-adminty-orange rounded-xs inline-block" />
              มูลค่าเสนอขอซื้อจากแผนก (PR Target)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-adminty-blue rounded-xs inline-block" />
              สั่งซื้อจริงคอมมิตแล้ว (PO Released)
            </span>
          </div>
        </div>

        {/* Right Teal Card: Departmental Budget Spend allocation & counters */}
        <div className="bg-gradient-to-br from-[#01a9ac] to-[#018184] text-white p-5 rounded-lg shadow-2xs flex flex-col justify-between relative overflow-hidden group">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-teal-100">ฝ่ายและงบประมาณ</h3>
              <p className="text-2xl font-black mt-1 font-sans">92.4% <span className="text-xs font-normal text-teal-100">รวมอนุมัติสำเร็จ</span></p>
            </div>

            {/* Simulated vertical bar graphs block matching Adminty style */}
            <div className="flex justify-between items-end h-32 pt-4 px-1.5 relative border-b border-white/20">
              {deptSpends.map((dept, idx) => {
                const barHeight = Math.min(dept.percent, 100);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                    
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 bg-slate-900 text-white text-[9px] py-1 px-1.5 rounded shadow-md pointer-events-none transition-all z-20 w-28 text-center">
                      <p className="font-extrabold">{dept.name}</p>
                      <p className="font-mono mt-0.5">ใช้: {dept.percent.toFixed(1)}%</p>
                      <p className="text-teal-300 text-[8px] font-mono">{(dept.spent/1000).toFixed(0)}k / {(dept.allocated/1000).toFixed(0)}k</p>
                    </div>

                    <div className="w-3 bg-white/20 h-full rounded-t-sm overflow-hidden flex items-end">
                      <div 
                        className="w-full bg-white rounded-t-sm transition-all duration-700 cursor-pointer"
                        style={{ height: `${barHeight}%` }}
                      />
                    </div>
                    <span className="text-[8px] font-bold text-teal-100 mt-2 font-mono shrink-0">{dept.code}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
            <div className="flex justify-between text-xs text-teal-50">
              <span>งบประมาณฝ่ายทั้งหมด:</span>
              <span className="font-mono font-bold">฿{(departments.reduce((sum, d) => sum + d.budget, 0) / 1000000).toFixed(1)}M</span>
            </div>
            <div className="flex justify-between text-xs text-teal-50">
              <span>เบิกใช้สะสมรวม:</span>
              <span className="font-mono font-bold">฿{(departments.reduce((sum, d) => sum + d.spent, 0) / 1000000).toFixed(1)}M</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recharts Departmental Procurement Capacity & Workflow Rules Progress Section */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-2xs space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-sky-50 text-sky-600 rounded-lg border border-sky-100">
                <BarChart2 className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Departmental Budget Capacity & Workflow Threshold Analytics
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Real-time progress tracking comparing accumulated departmental expenditures against annual budget limits & active workflow approval rules.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200/60 shrink-0 text-xs">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span className="text-slate-600 font-medium">Exec Approval Rule:</span>
            <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-3xs">
              &gt; ฿{globalWorkflowRule.amountLimit.toLocaleString()} THB
            </span>
          </div>
        </div>

        {/* Recharts Progress Bar Chart */}
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={rechartsBudgetData}
              margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis 
                type="number" 
                tickFormatter={(val) => `฿${(val / 1000000).toFixed(1)}M`}
                tick={{ fontSize: 11, fill: '#64748b' }}
              />
              <YAxis 
                type="category" 
                dataKey="code" 
                tick={{ fontSize: 12, fontWeight: 'bold', fill: '#1e293b' }}
                width={60}
              />
              <Tooltip content={<CustomBudgetTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '12px', fontSize: '12px' }}
                formatter={(value) => <span className="text-slate-700 font-semibold">{value}</span>}
              />
              <Bar 
                dataKey="spent" 
                name="Spent Expenditure (THB)" 
                stackId="capacityStack" 
                fill="#0284c7" 
                radius={[0, 0, 0, 0]} 
                barSize={20}
              />
              <Bar 
                dataKey="remaining" 
                name="Remaining Procurement Capacity (THB)" 
                stackId="capacityStack" 
                fill="#10b981" 
                radius={[0, 4, 4, 0]} 
                barSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Department Capacity Breakdown Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          {rechartsBudgetData.map((item, idx) => (
            <div key={idx} className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 space-y-2 hover:bg-slate-50 transition-colors">
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs text-slate-800 truncate">{item.departmentName}</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold font-mono ${
                  item.status === 'CRITICAL' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                  item.status === 'WARNING' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                  'bg-emerald-100 text-emerald-700 border border-emerald-200'
                }`}>
                  {item.usageRatio}% USED
                </span>
              </div>

              {/* Progress Bar representation */}
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${
                    item.status === 'CRITICAL' ? 'bg-rose-500' :
                    item.status === 'WARNING' ? 'bg-amber-500' :
                    'bg-sky-500'
                  }`}
                  style={{ width: `${Math.min(item.usageRatio, 100)}%` }}
                />
              </div>

              <div className="text-[10px] space-y-0.5 pt-0.5 font-mono">
                <div className="flex justify-between text-slate-500">
                  <span>Capacity Left:</span>
                  <span className="font-bold text-emerald-600">฿{(item.remaining / 1000).toFixed(0)}k</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Rule Limit:</span>
                  <span className="text-slate-700">฿{(item.execThreshold / 1000).toFixed(0)}k</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Row Bento Section: Locations Table, Status Donut & Subscribers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bento Cell 1: Top Suppliers Volume (Global Sales by locations styled table) */}
        <div className="bg-white p-5 rounded-lg border border-slate-100 shadow-2xs lg:col-span-2">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">ซัพพลายเออร์ที่มียอดสั่งซื้อสูงสุด (Top suppliers)</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">รายชื่อบริษัทผู้ผลิตและอัตราส่วนส่วนแบ่งสัญญาสั่งซื้อสำเร็จในระบบ</p>
            </div>
            <span className="text-[10px] font-bold text-adminty-primary cursor-pointer hover:underline">รายละเอียดผู้ค้า</span>
          </div>

          <div className="space-y-4">
            {vendorSpend.length > 0 ? (
              vendorSpend.map((vendor, idx) => {
                const widthPercent = (vendor.value / maxVendorVal) * 100;
                // Alternate bar colors dynamically using the Adminty palette
                const barColors = ['bg-adminty-orange', 'bg-adminty-blue', 'bg-adminty-green', 'bg-adminty-pink', 'bg-indigo-500'];
                const textColor = ['text-adminty-orange', 'text-adminty-blue', 'text-adminty-green', 'text-adminty-pink', 'text-indigo-500'];
                const selectedColor = barColors[idx % barColors.length];
                const selectedText = textColor[idx % textColor.length];

                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs items-center">
                      <span className="font-bold text-slate-700 truncate max-w-[200px] flex items-center gap-2">
                        <span className={`h-1.5 w-1.5 rounded-full ${selectedColor}`} />
                        {vendor.name}
                      </span>
                      <span className={`font-mono font-extrabold ${selectedText}`}>฿{vendor.value.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden border border-slate-100">
                      <div 
                        className={`${selectedColor} h-full rounded-full transition-all duration-700`} 
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-44 flex flex-col items-center justify-center text-slate-400 text-xs">
                <span>ไม่มีข้อมูลสถิติผู้ซัพพลายเออร์</span>
              </div>
            )}
          </div>
        </div>

        {/* Bento Cell 2: Purchase requisition Status pie representation (New users donut) */}
        <div className="bg-white p-5 rounded-lg border border-slate-100 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">สัดส่วนสถานะเอกสารขอซื้อ (PR Status Ratio)</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">แบ่งตามสถานะของเอกสารภายในระบบคลาวด์</p>
          </div>

          {/* Styled interactive React circular SVG representing donut */}
          <div className="my-5 flex justify-center items-center relative">
            <svg width="140" height="140" viewBox="0 0 42 42" className="transform -rotate-90">
              {/* Draft Segment (Slate/Grey) */}
              <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#e2e8f0" strokeWidth="4" />
              
              {/* Approved segment (Green) */}
              <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#0ac282" strokeWidth="4" 
                strokeDasharray={`${prApprovedPercent} ${100 - prApprovedPercent}`} strokeDashoffset="0" />
              
              {/* Pending segment (Orange) */}
              <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#fe9365" strokeWidth="4" 
                strokeDasharray={`${prPendingPercent} ${100 - prPendingPercent}`} strokeDashoffset={`-${prApprovedPercent}`} />
              
              {/* Rejected segment (Pink) */}
              <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#fe5d70" strokeWidth="4" 
                strokeDasharray={`${prRejectedPercent} ${100 - prRejectedPercent}`} strokeDashoffset={`-${prApprovedPercent + prPendingPercent}`} />
            </svg>
            
            {/* Centered label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-base font-black text-slate-800">{totalSegments}</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">PRs Total</span>
            </div>
          </div>

          {/* Status Breakdown Legend & counts */}
          <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-500 pt-2 border-t border-slate-50">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-adminty-green inline-block" />
              <span>อนุมัติเสร็จ ({prApprovedPercent}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-adminty-orange inline-block" />
              <span>รออนุมัติ ({prPendingPercent}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-adminty-pink inline-block" />
              <span>ปฏิเสธ ({prRejectedPercent}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" />
              <span>ร่างเอกสาร ({prDraftPercent}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-side Action Center: Recent Submissions & Partner list cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent PRs Raised list (mimicking latest tables) */}
        <div className="bg-white rounded-lg border border-slate-100 overflow-hidden shadow-3xs lg:col-span-2">
          <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">เอกสารขอซื้อล่าสุด (Recent PRs)</h3>
            <button 
              onClick={() => onNavigate('pr')}
              className="text-[11px] font-bold text-adminty-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              ดูทั้งหมด
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="overflow-x-auto scrollbar-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 border-b border-slate-100 font-sans uppercase">
                  <th className="p-3">เลขที่เอกสาร PR</th>
                  <th className="p-3">ผู้เบิก / แผนก</th>
                  <th className="p-3">ยอดรวมสุทธิ</th>
                  <th className="p-3 text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {prs.slice(0, 4).map((pr, idx) => (
                  <tr 
                    key={idx} 
                    className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                    onClick={() => onNavigate('pr-details', pr.id)}
                  >
                    <td className="p-3 font-mono font-extrabold text-slate-800">{pr.prNumber}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-800">{pr.requestorThaiName || pr.requestorName}</div>
                      <div className="text-[10px] text-slate-400">{pr.departmentName}</div>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-600">
                      ฿{pr.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-1 text-[9px] font-bold rounded-full ${
                        pr.status === 'PENDING_DEPT_MGR' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                        pr.status === 'PENDING_EXECUTIVE' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                        pr.status === 'PENDING_PURCHASING' ? 'bg-sky-50 text-sky-600 border border-sky-100' :
                        pr.status === 'APPROVED' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                        pr.status === 'PO_CREATED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        pr.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                        'bg-slate-50 text-slate-500 border border-slate-100'
                      }`}>
                        {pr.status === 'PENDING_DEPT_MGR' ? 'รอ ผจก. ฝ่ายอนุมัติ' :
                         pr.status === 'PENDING_EXECUTIVE' ? 'รอผู้บริหารอนุมัติ' :
                         pr.status === 'PENDING_PURCHASING' ? 'รอจัดซื้อตรวจสอบ' :
                         pr.status === 'APPROVED' ? 'รอออกใบสั่งซื้อ (PO)' :
                         pr.status === 'PO_CREATED' ? 'ออกใบสั่งซื้อสำเร็จ' :
                         pr.status === 'REJECTED' ? 'ปฏิเสธคำขอ' : 'แบบร่างเอกสาร'}
                      </span>
                    </td>
                  </tr>
                ))}
                {prs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-400 text-xs font-semibold">
                      ไม่พบเอกสารใบเสนอขอซื้อที่บันทึกไว้ในระบบ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side mini stats list cells (Subscriber/Followers mock style) */}
        <div className="space-y-4">
          
          {/* Box 1: Subscribers list growth representation */}
          <div className="bg-white p-5 rounded-lg border border-slate-100 shadow-3xs flex justify-between items-center group relative overflow-hidden">
            <div className="space-y-1">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">ผู้ตรวจอนุมัติหลัก (Authorized Signers)</h4>
              <p className="text-xl font-black text-slate-800">4 ท่านหลัก</p>
              <p className="text-[10px] text-slate-400">ควบคุมสายงานบังคับบัญชาแบบอัตโนมัติ</p>
            </div>
            <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600">
              <Users className="h-5 w-5" />
            </div>
          </div>

          {/* Box 2: Suppliers counters */}
          <div className="bg-white p-5 rounded-lg border border-slate-100 shadow-3xs flex justify-between items-center group relative overflow-hidden">
            <div className="space-y-1">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">ทะเบียนซัพพลายเออร์ (Approved Suppliers)</h4>
              <p className="text-xl font-black text-slate-800">12 บริษัทชั้นนำ</p>
              <p className="text-[10px] text-slate-400">คัดกรองความน่าเชื่อถือระดับองค์กร Sumino</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
              <Award className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
