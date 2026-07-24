/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Sliders, 
  Users, 
  Building, 
  Truck, 
  ShieldAlert, 
  Save, 
  Plus, 
  Check, 
  ToggleLeft, 
  ToggleRight,
  UserPlus,
  Edit,
  X,
  Search,
  UserCheck,
  UserX,
  FileSignature
} from 'lucide-react';
import { Vendor, Department, User, WorkflowRule, UserRole } from '../types.js';

interface AdminPanelProps {
  users: User[];
  vendors: Vendor[];
  departments: Department[];
  workflowRules: WorkflowRule[];
  onUpdateWorkflowRule: (id: string, ruleData: Partial<WorkflowRule>) => void;
  onAddVendor: (vendor: Partial<Vendor>) => void;
  onAddUser?: (user: Partial<User>) => void;
  onUpdateUser: (id: string, userData: Partial<User>) => void;
}

export default function AdminPanel({ 
  users, 
  vendors, 
  departments, 
  workflowRules, 
  onUpdateWorkflowRule, 
  onAddVendor,
  onAddUser,
  onUpdateUser
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'workflow' | 'users' | 'vendors' | 'departments'>('workflow');
  
  // User Management Modal & Search State
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userFormData, setUserFormData] = useState({
    employeeId: '',
    name: '',
    thaiName: '',
    email: '',
    role: UserRole.EMPLOYEE,
    departmentId: '',
    title: '',
    branch: 'Chonburi Branch (Head Office)',
    company: 'SUMINO AAPICO (Thailand) Company Limited',
    isActive: true,
    signatureUrl: ''
  });

  // New Vendor Form States
  const [newVendor, setNewVendor] = useState({
    name: '',
    address: '',
    phone: '',
    fax: '',
    taxId: '',
    contactPerson: '',
    creditTerm: '30 Days'
  });
  const [successMsg, setSuccessMsg] = useState('');

  // Workflow Config States
  const currentRule = workflowRules[0] || {
    id: 'WFR001',
    departmentId: 'ALL',
    amountLimit: 100000,
    requireExecutiveApproval: true,
    parallelApproval: false,
    delegateActive: false
  };

  const [workflowLimit, setWorkflowLimit] = useState(currentRule.amountLimit);
  const [reqExec, setReqExec] = useState(currentRule.requireExecutiveApproval);
  const [parallelApp, setParallelApp] = useState(currentRule.parallelApproval);
  const [delegateAct, setDelegateAct] = useState(currentRule.delegateActive);
  const [delegateId, setDelegateId] = useState(currentRule.delegateUserId || '');

  const handleOpenAddUserModal = () => {
    setEditingUser(null);
    setUserFormData({
      employeeId: `432${Math.floor(10000 + Math.random() * 90000)}`,
      name: '',
      thaiName: '',
      email: '',
      role: UserRole.EMPLOYEE,
      departmentId: departments[0]?.id || 'DEP-ENG',
      title: 'Staff Member',
      branch: 'Chonburi Branch (Head Office)',
      company: 'SUMINO AAPICO (Thailand) Company Limited',
      isActive: true,
      signatureUrl: ''
    });
    setShowUserModal(true);
  };

  const handleOpenEditUserModal = (user: User) => {
    setEditingUser(user);
    setUserFormData({
      employeeId: user.employeeId || '',
      name: user.name || '',
      thaiName: user.thaiName || '',
      email: user.email || '',
      role: user.role || UserRole.EMPLOYEE,
      departmentId: user.departmentId || departments[0]?.id || 'DEP-ENG',
      title: user.title || '',
      branch: user.branch || 'Chonburi Branch (Head Office)',
      company: user.company || 'SUMINO AAPICO (Thailand) Company Limited',
      isActive: user.isActive !== undefined ? user.isActive : true,
      signatureUrl: user.signatureUrl || ''
    });
    setShowUserModal(true);
  };

  const handleSaveUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.name || !userFormData.email || !userFormData.employeeId) {
      alert('กรุณากรอก รหัสพนักงาน, ชื่อ-นามสกุล และ อีเมล ให้ครบถ้วน');
      return;
    }

    if (editingUser) {
      onUpdateUser(editingUser.id, userFormData);
      setSuccessMsg(`ปรับปรุงข้อมูลผู้ใช้งาน ${userFormData.name} (${userFormData.employeeId}) และบันทึกลงฐานข้อมูล Supabase แล้ว`);
    } else {
      if (onAddUser) {
        onAddUser(userFormData);
        setSuccessMsg(`เพิ่มผู้ใช้งานใหม่ ${userFormData.name} (${userFormData.employeeId}) และบันทึกลงฐานข้อมูล Supabase เรียบร้อยแล้ว`);
      }
    }

    setShowUserModal(false);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleSaveWorkflow = () => {
    onUpdateWorkflowRule(currentRule.id, {
      amountLimit: workflowLimit,
      requireExecutiveApproval: reqExec,
      parallelApproval: parallelApp,
      delegateActive: delegateAct,
      delegateUserId: delegateId
    });
    setSuccessMsg('Workflow Engine parameters updated successfully.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleAddVendorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendor.name || !newVendor.name.trim()) return;
    onAddVendor({
      ...newVendor,
      address: newVendor.address ? newVendor.address.trim() : '-',
      phone: newVendor.phone ? newVendor.phone.trim() : '-',
      taxId: newVendor.taxId ? newVendor.taxId.trim() : '-'
    });
    setNewVendor({
      name: '',
      address: '',
      phone: '',
      fax: '',
      taxId: '',
      contactPerson: '',
      creditTerm: '30 Days'
    });
    setSuccessMsg('Supplier registered inside master registry catalog.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Configuration Panel</h2>
        <p className="text-xs text-slate-500 font-sans">
          Manage master records, configure approval limit matrices, assign delegation acting profiles, and control system policies.
        </p>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-xs flex items-center gap-1.5 font-medium">
          <Check className="h-4.5 w-4.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs list */}
      <div className="flex border-b border-slate-200 gap-1.5 overflow-x-auto no-print">
        <button
          onClick={() => setActiveTab('workflow')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'workflow'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Sliders className="h-4 w-4" />
          Workflow Engine Configuration
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'users'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Users className="h-4 w-4" />
          Employee Directory (RBAC)
        </button>
        <button
          onClick={() => setActiveTab('vendors')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'vendors'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Truck className="h-4 w-4" />
          Supplier Master Directory
        </button>
        <button
          onClick={() => setActiveTab('departments')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'departments'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Building className="h-4 w-4" />
          Cost Center Budgets
        </button>
      </div>

      {/* TABS CONTENT */}
      {/* 1. Workflow Engine Rules */}
      {activeTab === 'workflow' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sliders className="h-5 w-5 text-sky-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-800">Purchasing Sign-off Limits Matrix</h3>
              <p className="text-[11px] text-slate-400">Configure cost control rules and executive bypass thresholds</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Limit Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Department Manager Approval Limit (THB)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={workflowLimit}
                  onChange={(e) => setWorkflowLimit(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-3 pr-12 text-xs font-mono font-semibold text-slate-800 focus:bg-white outline-none focus:ring-1 focus:ring-sky-500"
                  id="admin-limit-input"
                />
                <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400 font-mono">THB</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Any PR request exceeding this limit will automatically escalate to the Managing Director (Executive) for double signature.
              </p>
            </div>

            {/* Toggle Rules */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Policy Guidelines</span>
              
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Management E-Sign Routing</h4>
                  <p className="text-[10px] text-slate-400">Configured PR approvals following Department Manager review to automatically route to Executive Management (Mr. Liu Dong / Mr. Yoshiyuki Konishi) for final digital E-Sign and stamp attestation.</p>
                </div>
                <button
                  onClick={() => setReqExec(!reqExec)}
                  className="text-slate-500 hover:text-slate-800"
                  id="btn-toggle-esign-routing"
                >
                  {reqExec ? <ToggleRight className="h-8 w-8 text-sky-600" /> : <ToggleLeft className="h-8 w-8 text-slate-300" />}
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Parallel Approvals Process</h4>
                  <p className="text-[10px] text-slate-400">Enable simultaneous reviews by other department units.</p>
                </div>
                <button
                  onClick={() => setParallelApp(!parallelApp)}
                  className="text-slate-500 hover:text-slate-800"
                >
                  {parallelApp ? <ToggleRight className="h-8 w-8 text-sky-600" /> : <ToggleLeft className="h-8 w-8 text-slate-300" />}
                </button>
              </div>
            </div>
          </div>

          {/* Delegation Acting manager */}
          <div className="border-t border-slate-100 pt-5 space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <ShieldAlert className="h-4.5 w-4.5 text-amber-500" />
                Acting Manager Delegation (Vacation / Business Trip)
              </h4>
              <p className="text-[10px] text-slate-400">
                Temporarily assign another employee as the acting department manager to prevent procurement approval pipeline bottlenecks.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Delegation Active State</h4>
                  <p className="text-[10px] text-slate-400">Toggle whether acting rights are currently delegated.</p>
                </div>
                <button
                  onClick={() => setDelegateAct(!delegateAct)}
                  className="text-slate-500 hover:text-slate-800"
                >
                  {delegateAct ? <ToggleRight className="h-8 w-8 text-sky-600" /> : <ToggleLeft className="h-8 w-8 text-slate-300" />}
                </button>
              </div>

              {delegateAct && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Acting Deputy / Delegated User:</label>
                  <select
                    value={delegateId}
                    onChange={(e) => setDelegateId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 outline-none"
                    id="admin-delegate-select"
                  >
                    <option value="">-- Choose Acting Deputy Manager --</option>
                    {users.filter(u => u.role === UserRole.EMPLOYEE).map((u, idx) => (
                      <option key={u.id || u.employeeId || `emp-${idx}`} value={u.id}>{u.name} ({u.employeeId})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 flex justify-end">
            <button
              onClick={handleSaveWorkflow}
              className="px-5 py-2 text-xs font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex items-center gap-1.5 shadow-sm"
              id="btn-save-workflow"
            >
              <Save className="h-4 w-4" />
              Save Settings
            </button>
          </div>
        </div>
      )}

      {/* 2. Employee Directory (RBAC) */}
      {activeTab === 'users' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs space-y-0">
          {/* Header & Controls */}
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-sky-600" />
                การจัดการผู้ใช้งานระบบ (User & RBAC Directory)
              </h3>
              <p className="text-[11px] text-slate-500">
                เพิ่มผู้ใช้งาน กำหนดสิทธิ์บทบาท (RBAC) และจัดการพนักงานในระบบ (บันทึกลงฐานข้อมูล Supabase)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Search bar */}
              <div className="relative flex-1 md:w-64">
                <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ, รหัสพนักงาน, แผนก..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-sky-500 font-sans"
                  id="admin-search-users"
                />
              </div>

              {/* Add user button */}
              <button
                onClick={handleOpenAddUserModal}
                id="btn-add-new-user"
                className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
              >
                <UserPlus className="h-4 w-4" />
                <span>+ เพิ่มผู้ใช้งานใหม่</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs text-slate-700">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-600 font-mono">
                  <th className="p-3.5">รหัสพนักงาน</th>
                  <th className="p-3.5">ชื่อ-นามสกุล / อีเมล</th>
                  <th className="p-3.5">แผนก / ตำแหน่ง</th>
                  <th className="p-3.5">บทบาทสิทธิ์ (RBAC)</th>
                  <th className="p-3.5 text-center">สถานะ</th>
                  <th className="p-3.5 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users
                  .filter(u => {
                    if (!userSearchQuery) return true;
                    const q = userSearchQuery.toLowerCase();
                    return (
                      u.name.toLowerCase().includes(q) ||
                      (u.thaiName && u.thaiName.toLowerCase().includes(q)) ||
                      u.employeeId.toLowerCase().includes(q) ||
                      u.email.toLowerCase().includes(q) ||
                      (u.title && u.title.toLowerCase().includes(q)) ||
                      u.role.toLowerCase().includes(q)
                    );
                  })
                  .map((user, idx) => (
                    <tr key={user.id || user.employeeId || `usr-${idx}`} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-slate-900">{user.employeeId}</td>
                      <td className="p-3.5 font-semibold text-slate-900">
                        <div>{user.name}</div>
                        {user.thaiName && (
                          <div className="text-[11px] text-slate-600 font-sans font-normal">{user.thaiName}</div>
                        )}
                        <div className="text-[10px] text-slate-400 font-normal font-sans">{user.email}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-medium text-slate-800">{user.title || 'Staff'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">DEP: {user.departmentId}</div>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                          user.role === UserRole.ADMINISTRATOR ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                          user.role === UserRole.EXECUTIVE ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                          user.role === UserRole.PURCHASING ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                          user.role === UserRole.DEPARTMENT_MANAGER ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        {user.isActive ? (
                          <span className="text-emerald-600 text-[11px] font-bold inline-flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                            ACTIVE
                          </span>
                        ) : (
                          <span className="text-rose-600 text-[11px] font-bold inline-flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 inline-block" />
                            INACTIVE
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleOpenEditUserModal(user)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 mx-auto transition-colors cursor-pointer border border-slate-200"
                          title="แก้ไขข้อมูลผู้ใช้งาน"
                        >
                          <Edit className="h-3.5 w-3.5 text-slate-600" />
                          <span>แก้ไข</span>
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Supplier Master Directory */}
      {activeTab === 'vendors' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List of Vendors */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs lg:col-span-2">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">Approved Vendors Directory</h3>
              <p className="text-[11px] text-slate-400">Corporate list of authorized material supplies and credit terms</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs text-slate-700">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">
                    <th className="p-3.5">Vendor Code</th>
                    <th className="p-3.5">Supplier Details</th>
                    <th className="p-3.5">Address</th>
                    <th className="p-3.5">Credit Terms</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vendors.map((vend, idx) => (
                    <tr key={vend.id || vend.code || `vnd-${idx}`} className="hover:bg-slate-50/40">
                      <td className="p-3.5 font-mono font-bold text-slate-950">{vend.code}</td>
                      <td className="p-3.5 font-semibold text-slate-800">
                        <div>{vend.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono font-normal">TAX ID: {vend.taxId}</div>
                      </td>
                      <td className="p-3.5 text-slate-500 text-[11px] max-w-[200px] truncate" title={vend.address}>
                        {vend.address}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900 font-mono">{vend.creditTerm}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* New Supplier form */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Add New Partner Supplier</h3>
            
            <form onSubmit={handleAddVendorSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-600 block">Vendor Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AAPICO Parts Co., Ltd."
                  value={newVendor.name}
                  onChange={(e) => setNewVendor({...newVendor, name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:bg-white outline-none focus:ring-1 focus:ring-sky-500 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600 block">Tax Registration ID (Tax ID):</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 0105537042890"
                  value={newVendor.taxId}
                  onChange={(e) => setNewVendor({...newVendor, taxId: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:bg-white outline-none focus:ring-1 focus:ring-sky-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600 block">Contact Telephone / Phone:</label>
                <input
                  type="text"
                  placeholder="e.g. 02-385-5011"
                  value={newVendor.phone}
                  onChange={(e) => setNewVendor({...newVendor, phone: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:bg-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600 block">Billing Terms (Credit Terms):</label>
                <select
                  value={newVendor.creditTerm}
                  onChange={(e) => setNewVendor({...newVendor, creditTerm: e.target.value})}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 outline-none"
                >
                  <option value="Cash">Immediate Cash Payment</option>
                  <option value="15 Days">15 Days Credit</option>
                  <option value="30 Days">30 Days Standard Credit</option>
                  <option value="45 Days">45 Days Corporate Credit</option>
                  <option value="60 Days">60 Days Enterprise Credit</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600 block">Vendor Corporate Address:</label>
                <textarea
                  rows={2}
                  placeholder="Complete shipping & head office address details..."
                  value={newVendor.address}
                  onChange={(e) => setNewVendor({...newVendor, address: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:bg-white outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-bold transition-colors flex items-center justify-center gap-1"
                id="btn-add-vendor"
              >
                <Plus className="h-4 w-4" />
                Register Vendor
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. Cost Center Budgets */}
      {activeTab === 'departments' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">Corporate Cost Center Budgets</h3>
            <p className="text-[11px] text-slate-400">View fiscal limits, total spendings, and active remaining balances per department unit</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs text-slate-700">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">
                  <th className="p-3.5">Cost Code</th>
                  <th className="p-3.5">Department Name</th>
                  <th className="p-3.5 text-right">Authorized Budget</th>
                  <th className="p-3.5 text-right">Actual Spent</th>
                  <th className="p-3.5 text-right">Remaining Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {departments.map((dept, idx) => (
                  <tr key={dept.id || dept.code || `dept-${idx}`} className="hover:bg-slate-50/40 font-medium">
                    <td className="p-3.5 font-mono font-bold text-slate-900">{dept.code}</td>
                    <td className="p-3.5 font-semibold text-slate-800">{dept.name}</td>
                    <td className="p-3.5 text-right font-mono">{dept.budget.toLocaleString()} THB</td>
                    <td className="p-3.5 text-right font-mono text-rose-600">-{dept.spent.toLocaleString()} THB</td>
                    <td className="p-3.5 text-right font-mono text-emerald-600 font-bold">{dept.remaining.toLocaleString()} THB</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* USER MANAGEMENT MODAL DIALOG */}
      {showUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8" id="user-management-modal">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4.5 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-500/20 text-sky-400 rounded-lg">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {editingUser ? 'แก้ไขข้อมูลผู้ใช้งานระบบ (Edit Employee)' : 'เพิ่มผู้ใช้งานใหม่ (Add New Employee)'}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    กำหนดรายละเอียดพนักงานและบันทึกสิทธิ์ลงฐานข้อมูล Supabase
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowUserModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveUserSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* รหัสพนักงาน */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block text-[11px]">
                    รหัสพนักงาน (Employee ID) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น 43210344"
                    value={userFormData.employeeId}
                    onChange={(e) => setUserFormData({ ...userFormData, employeeId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white outline-none focus:ring-1 focus:ring-sky-500 font-mono font-bold text-slate-900"
                    id="input-user-emp-id"
                  />
                </div>

                {/* อีเมลองค์กร */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block text-[11px]">
                    อีเมลองค์กร (Corporate Email) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="เช่น name@sumino.com"
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white outline-none focus:ring-1 focus:ring-sky-500 text-slate-900"
                    id="input-user-email"
                  />
                </div>

                {/* ชื่อภาษาอังกฤษ */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block text-[11px]">
                    ชื่อ-นามสกุล ภาษาอังกฤษ (Full Name) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น Mr. Thanawat Patwiwong"
                    value={userFormData.name}
                    onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white outline-none focus:ring-1 focus:ring-sky-500 font-medium text-slate-900"
                    id="input-user-name"
                  />
                </div>

                {/* ชื่อภาษาไทย */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block text-[11px]">
                    ชื่อ-นามสกุล ภาษาไทย (Thai Name)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น นาย ธนวัฒน์ ภัทรวิวงศ์"
                    value={userFormData.thaiName}
                    onChange={(e) => setUserFormData({ ...userFormData, thaiName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white outline-none focus:ring-1 focus:ring-sky-500 text-slate-900"
                    id="input-user-thainame"
                  />
                </div>

                {/* แผนก */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block text-[11px]">
                    แผนก / ฝ่าย (Department) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={userFormData.departmentId}
                    onChange={(e) => setUserFormData({ ...userFormData, departmentId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white outline-none focus:ring-1 focus:ring-sky-500 font-medium text-slate-900"
                    id="select-user-department"
                  >
                    {departments.map((dept, idx) => (
                      <option key={dept.id || dept.code || `dept-opt-${idx}`} value={dept.id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* ตำแหน่งงาน */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block text-[11px]">
                    ตำแหน่งงาน (Job Title / Position)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น Procurement Specialist"
                    value={userFormData.title}
                    onChange={(e) => setUserFormData({ ...userFormData, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white outline-none focus:ring-1 focus:ring-sky-500 text-slate-900"
                    id="input-user-title"
                  />
                </div>

                {/* บทบาท RBAC Role */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block text-[11px]">
                    สิทธิ์บทบาทระบบ (RBAC Role) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={userFormData.role}
                    onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value as UserRole })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white outline-none focus:ring-1 focus:ring-sky-500 font-bold text-slate-900"
                    id="select-user-role"
                  >
                    <option value={UserRole.EMPLOYEE}>EMPLOYEE (พนักงานทั่วไป - Requestor)</option>
                    <option value={UserRole.DEPARTMENT_MANAGER}>DEPARTMENT_MANAGER (ผู้จัดการแผนกอนุมัติ)</option>
                    <option value={UserRole.PURCHASING}>PURCHASING (เจ้าหน้าที่จัดซื้อ)</option>
                    <option value={UserRole.PURCHASING_MANAGER}>PURCHASING_MANAGER (ผู้จัดการฝ่ายจัดซื้อ)</option>
                    <option value={UserRole.ASSISTANT_MANAGER}>ASSISTANT_MANAGER (ผู้ช่วยผู้จัดการ)</option>
                    <option value={UserRole.EXECUTIVE}>EXECUTIVE (ผู้บริหารสูงสุด / MD)</option>
                    <option value={UserRole.ADMINISTRATOR}>ADMINISTRATOR (ผู้ดูแลระบบสูงสุด)</option>
                  </select>
                </div>

                {/* สถานะใช้งาน */}
                <div className="space-y-1 flex flex-col justify-end">
                  <label className="font-bold text-slate-700 block text-[11px]">
                    สถานะบัญชีใช้งาน (Account Status)
                  </label>
                  <div
                    onClick={() => setUserFormData({ ...userFormData, isActive: !userFormData.isActive })}
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer select-none transition-all ${
                      userFormData.isActive ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    {userFormData.isActive ? (
                      <>
                        <UserCheck className="h-4 w-4 text-emerald-600" />
                        <span className="font-bold text-xs">เปิดใช้งาน (ACTIVE)</span>
                      </>
                    ) : (
                      <>
                        <UserX className="h-4 w-4 text-rose-600" />
                        <span className="font-bold text-xs">ระงับการใช้งาน (INACTIVE)</span>
                      </>
                    )}
                  </div>
                </div>

                {/* สาขา */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block text-[11px]">
                    สาขาที่สังกัด (Branch)
                  </label>
                  <input
                    type="text"
                    value={userFormData.branch}
                    onChange={(e) => setUserFormData({ ...userFormData, branch: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white outline-none focus:ring-1 focus:ring-sky-500 text-slate-900"
                  />
                </div>

                {/* บริษัท */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block text-[11px]">
                    บริษัท (Company)
                  </label>
                  <input
                    type="text"
                    value={userFormData.company}
                    onChange={(e) => setUserFormData({ ...userFormData, company: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white outline-none focus:ring-1 focus:ring-sky-500 text-slate-900"
                  />
                </div>
              </div>

              {/* Digital Signature Link/Preview */}
              <div className="border-t border-slate-100 pt-3 space-y-1.5">
                <label className="font-bold text-slate-700 flex items-center gap-1.5 text-[11px]">
                  <FileSignature className="h-4 w-4 text-sky-600" />
                  ลายเซ็นดิจิทัล (Digital Signature URL or Path)
                </label>
                <input
                  type="text"
                  placeholder="เช่น /signatures/thanawat_sig.png"
                  value={userFormData.signatureUrl}
                  onChange={(e) => setUserFormData({ ...userFormData, signatureUrl: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white outline-none focus:ring-1 focus:ring-sky-500 font-mono text-slate-900"
                />
                {userFormData.signatureUrl && (
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-3">
                    <span className="text-[10px] text-slate-500 font-mono">Preview Signature:</span>
                    <img
                      src={userFormData.signatureUrl}
                      alt="Signature Preview"
                      className="h-8 max-w-[120px] object-contain border border-slate-200 rounded bg-white p-1"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Modal Buttons */}
              <div className="border-t border-slate-100 pt-4 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer"
                >
                  ยกเลิก (Cancel)
                </button>
                <button
                  type="submit"
                  id="btn-submit-user-form"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>{editingUser ? 'บันทึกการแก้ไข' : 'บันทึกผู้ใช้งานใหม่'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
