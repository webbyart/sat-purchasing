import { supabase } from './supabase.js';
import { 
  User, 
  Department, 
  Vendor, 
  PR, 
  PO, 
  WorkflowRule, 
  AuditLog, 
  NotificationLog, 
  ComparisonSheet, 
  CapexRequisition,
  UserRole,
  PRStatus,
  POStatus,
  SignatureDetails
} from '../types.js';

// ============================================================================
// Supabase Row Mappers (Client Side)
// ============================================================================

export function resolveDepartmentName(deptId?: string, rawDeptName?: string): string {
  if (rawDeptName && rawDeptName !== 'Unknown Department' && rawDeptName !== 'undefined' && rawDeptName.trim() !== '') {
    return rawDeptName;
  }
  const id = (deptId || '').trim();
  if (id === 'DEP001' || id === 'MGMT') return 'Management';
  if (id === 'DEP002' || id === 'PC&L' || id === 'PCL') return 'PC&L (Production Control & Logistics)';
  if (id === 'DEP003' || id === 'PUR' || id === 'SALES') return 'Sales / Purchasing / PE';
  if (id === 'DEP004' || id === 'HRGA' || id === 'HR/GA' || id === 'HR') return 'HR / General Affairs';
  if (id === 'DEP005' || id === 'PROD') return 'Production';
  if (id === 'DEP006' || id === 'QAQC' || id === 'QA/QC') return 'QA / QC';
  if (id === 'DEP007' || id === 'ACT') return 'Accounting';

  return 'HR / General Affairs';
}

export function mapUserFromDb(row: any): User {
  const empId = String(row.employee_id || row.employeeId || row.emp_id || row.id || '').trim();
  let rawRole = String(row.role || 'EMPLOYEE').toUpperCase();
  if (rawRole === 'ADMINISTRATOR' || rawRole === 'ADMIN' || rawRole === 'MASTER ADMIN' || rawRole === 'SYSTEM ADMIN' || row.role === 'Administrator') {
    rawRole = UserRole.ADMINISTRATOR;
  }
  const role = Object.values(UserRole).includes(rawRole as UserRole) ? (rawRole as UserRole) : UserRole.EMPLOYEE;
  const deptId = String(row.department_id || row.departmentId || row.dept_id || 'DEP004');
  const deptName = resolveDepartmentName(deptId, row.department_name || row.departmentName);

  return {
    id: String(row.id || empId),
    employeeId: empId,
    name: String(row.name || row.user_name_en || row.english_name || 'Employee User'),
    thaiName: row.thai_name || row.user_name_th || row.thaiName || '',
    email: String(row.email || (empId ? `${empId.toLowerCase()}@sat.co.th` : 'user@sat.co.th')),
    role: role,
    departmentId: deptId,
    departmentName: deptName,
    title: String(row.title || row.position || row.role || 'Employee'),
    signatureUrl: row.signature_url || row.signatureUrl,
    isActive: row.is_active !== undefined ? Boolean(row.is_active) : true,
    branch: String(row.branch || 'Chonburi Branch (Head Office)'),
    company: String(row.company || 'SUMINO AAPICO (Thailand) Company Limited')
  };
}

export function mapVendorFromDb(row: any): Vendor {
  const code = String(row.code || row.vendor_code || (row.vendor_id ? `VND${String(row.vendor_id).padStart(3, '0')}` : (row.id || '')));
  const id = String(row.id ? row.id : (row.vendor_id ? row.vendor_id : code));
  const name = String(row.name || row.vendor_name_en || row.vendor_name_th || 'Unknown Vendor');
  const address = String(row.address || '');
  const phone = String(row.phone || row.telephone || row.mobile || '');
  const fax = String(row.fax || '');
  const taxId = String(row.taxId || row.tax_id || '');
  const contactPerson = String(row.contactPerson || row.contact_person || '');
  
  let creditTerm = row.creditTerm || row.credit_term;
  if (!creditTerm) {
    if (row.credit_day) {
      creditTerm = `${row.credit_day} Days`;
    } else if (row.payment_term) {
      creditTerm = String(row.payment_term);
    } else {
      creditTerm = '30 Days';
    }
  }

  return {
    id,
    code,
    name,
    address,
    phone,
    fax,
    taxId,
    contactPerson,
    creditTerm: String(creditTerm)
  };
}

export function mapVendorToDb(v: any) {
  return {
    id: String(v.id || `VND-${Date.now()}`),
    code: v.code || `VND-${Date.now()}`,
    name: v.name,
    address: v.address || '-',
    phone: v.phone || '-',
    fax: v.fax || '',
    tax_id: v.taxId || '-',
    contact_person: v.contactPerson || '',
    credit_term: v.creditTerm || '30 Days'
  };
}

export function mapDepartmentFromDb(row: any): Department {
  return {
    id: String(row.id),
    name: String(row.name || row.dept_name || ''),
    code: String(row.code || row.dept_code || row.id),
    budget: Number(row.budget || 0),
    spent: Number(row.spent || 0),
    remaining: Number(row.remaining || (row.budget ? row.budget - (row.spent || 0) : 0))
  };
}

export function mapWorkflowRuleFromDb(row: any): WorkflowRule {
  return {
    id: String(row.id),
    departmentId: String(row.department_id || row.departmentId || 'ALL'),
    amountLimit: Number(row.amount_limit || row.amountLimit || 100000),
    requireExecutiveApproval: Boolean(row.require_executive_approval ?? row.requireExecutiveApproval ?? true),
    parallelApproval: Boolean(row.parallel_approval ?? row.parallelApproval ?? false),
    delegateActive: Boolean(row.delegate_active ?? row.delegateActive ?? false)
  };
}

export function mapPRFromDb(row: any): PR {
  const parseJson = (val: any) => typeof val === 'string' ? JSON.parse(val) : (val || []);
  const deptId = String(row.department_id || row.departmentId || 'DEP004');
  const deptName = resolveDepartmentName(deptId, row.department_name || row.departmentName);
  return {
    id: String(row.id),
    prNumber: String(row.pr_number || row.prNumber || row.id),
    date: String(row.date || row.created_at || new Date().toISOString().split('T')[0]),
    requestorId: String(row.requestor_id || row.requestorId || ''),
    requestorName: String(row.requestor_name || row.requestorName || ''),
    requestorEmail: String(row.requestor_email || row.requestorEmail || ''),
    departmentId: deptId,
    departmentName: deptName,
    suggestedVendorId: row.suggested_vendor_id || row.suggestedVendorId || '',
    vendorName: row.vendor_name || row.vendorName || '',
    vendorAddress: row.vendor_address || row.vendorAddress || '',
    vendorPhone: row.vendor_phone || row.vendorPhone || '',
    vendorFax: row.vendor_fax || row.vendorFax || '',
    vendorTaxId: row.vendor_tax_id || row.vendorTaxId || '',
    items: parseJson(row.items),
    purchaseObjective: String(row.purchase_objective || row.purchaseObjective || ''),
    subtotal: Number(row.subtotal || 0),
    vat: Number(row.vat || 0),
    grandTotal: Number(row.grand_total || row.grandTotal || 0),
    status: (row.status as PRStatus) || PRStatus.DRAFT,
    attachments: parseJson(row.attachments),
    workflowLogs: parseJson(row.workflow_logs || row.workflowLogs),
    currentStepIndex: Number(row.current_step_index || row.currentStepIndex || 0),
    companyName: String(row.company_name || row.companyName || 'SUMINO AAPICO (Thailand) Company Limited'),
    branchName: String(row.branch_name || row.branchName || 'Chonburi Branch (Head Office)')
  };
}

export function mapPRToDb(pr: PR) {
  return {
    id: pr.id,
    pr_number: pr.prNumber,
    date: pr.date || new Date().toISOString().split('T')[0],
    requestor_id: pr.requestorId,
    requestor_name: pr.requestorName,
    requestor_email: pr.requestorEmail || '',
    department_id: pr.departmentId,
    department_name: pr.departmentName,
    suggested_vendor_id: pr.suggestedVendorId || null,
    vendor_name: pr.vendorName || '',
    vendor_address: pr.vendorAddress || '',
    vendor_phone: pr.vendorPhone || '',
    vendor_fax: pr.vendorFax || '',
    vendor_tax_id: pr.vendorTaxId || '',
    items: pr.items || [],
    purchase_objective: pr.purchaseObjective || '',
    subtotal: pr.subtotal || 0,
    vat: pr.vat || 0,
    grand_total: pr.grandTotal || 0,
    status: pr.status || PRStatus.DRAFT,
    attachments: pr.attachments || [],
    workflow_logs: pr.workflowLogs || [],
    current_step_index: pr.currentStepIndex || 0,
    company_name: pr.companyName || 'SUMINO AAPICO (Thailand) Company Limited',
    branch_name: pr.branchName || 'Chonburi Branch (Head Office)'
  };
}

export function mapPOFromDb(row: any): PO {
  const parseJson = (val: any) => typeof val === 'string' ? JSON.parse(val) : (val || []);
  const deptId = String(row.department_id || row.departmentId || 'DEP004');
  const deptName = resolveDepartmentName(deptId, row.department_name || row.departmentName);
  return {
    id: String(row.id),
    poNumber: String(row.po_number || row.poNumber || row.id),
    referPrId: String(row.refer_pr_id || row.referPrId || ''),
    referPrNumber: String(row.refer_pr_number || row.referPrNumber || ''),
    date: String(row.date || row.created_at || new Date().toISOString().split('T')[0]),
    vendorId: String(row.vendor_id || row.vendorId || ''),
    vendorName: String(row.vendor_name || row.vendorName || ''),
    vendorAddress: String(row.vendor_address || row.vendorAddress || ''),
    vendorPhone: String(row.vendor_phone || row.vendorPhone || ''),
    vendorFax: String(row.vendor_fax || row.vendorFax || ''),
    vendorTaxId: String(row.vendor_tax_id || row.vendorTaxId || ''),
    shippingAddress: String(row.shipping_address || row.shippingAddress || ''),
    departmentId: deptId,
    departmentName: deptName,
    creditTerm: String(row.credit_term || row.creditTerm || '30 Days'),
    items: parseJson(row.items),
    subtotal: Number(row.subtotal || 0),
    vat: Number(row.vat || 0),
    grandTotal: Number(row.grand_total || row.grandTotal || 0),
    status: (row.status as POStatus) || POStatus.DRAFT,
    notes: String(row.notes || ''),
    attachments: parseJson(row.attachments),
    workflowLogs: parseJson(row.workflow_logs || row.workflowLogs),
    currentStepIndex: Number(row.current_step_index || row.currentStepIndex || 0),
    companyName: String(row.company_name || row.companyName || 'SUMINO AAPICO (Thailand) Company Limited'),
    branchName: String(row.branch_name || row.branchName || 'Chonburi Branch (Head Office)'),
    deliveryUrl: row.delivery_url || row.deliveryUrl,
    depositUrl: row.deposit_url || row.depositUrl
  };
}

export function mapPOToDb(po: PO) {
  return {
    id: po.id,
    po_number: po.poNumber,
    refer_pr_id: po.referPrId || '',
    refer_pr_number: po.referPrNumber || '',
    date: po.date || new Date().toISOString().split('T')[0],
    vendor_id: po.vendorId || '',
    vendor_name: po.vendorName || '',
    vendor_address: po.vendorAddress || '',
    vendor_phone: po.vendorPhone || '',
    vendor_fax: po.vendorFax || '',
    vendor_tax_id: po.vendorTaxId || '',
    shipping_address: po.shippingAddress || '',
    department_id: po.departmentId || '',
    department_name: po.departmentName || '',
    credit_term: po.creditTerm || '30 Days',
    items: po.items || [],
    subtotal: po.subtotal || 0,
    vat: po.vat || 0,
    grand_total: po.grandTotal || 0,
    status: po.status || POStatus.DRAFT,
    notes: po.notes || '',
    attachments: po.attachments || [],
    workflow_logs: po.workflowLogs || [],
    current_step_index: po.currentStepIndex || 0,
    company_name: po.companyName || 'SUMINO AAPICO (Thailand) Company Limited',
    branch_name: po.branchName || 'Chonburi Branch (Head Office)',
    delivery_url: po.deliveryUrl || null,
    deposit_url: po.depositUrl || null
  };
}

// ============================================================================
// Helper: Running Number Generator for Direct Supabase Writes
// ============================================================================

async function getNextRunningNumber(type: 'pr' | 'po' | 'cs' | 'capex'): Promise<string> {
  const currentYear = new Date().getFullYear();
  let counter = 1;

  try {
    const { data } = await supabase.from('running_numbers').select('*').eq('id', 'main').single();
    if (data) {
      const year = data.year || currentYear;
      const key = `${type}_counter`;
      counter = (data[key] || 0) + 1;
      await supabase.from('running_numbers').upsert({
        id: 'main',
        year,
        [key]: counter
      });
    } else {
      await supabase.from('running_numbers').upsert({
        id: 'main',
        year: currentYear,
        pr_counter: type === 'pr' ? 1 : 0,
        po_counter: type === 'po' ? 1 : 0,
        cs_counter: type === 'cs' ? 1 : 0,
        capex_counter: type === 'capex' ? 1 : 0
      });
    }
  } catch (err) {
    console.warn('[Supabase Running Number] error:', err);
  }

  const prefix = type.toUpperCase();
  const yrStr = String(currentYear).substring(2);
  return `${prefix}${yrStr}${String(counter).padStart(6, '0')}`;
}

// ============================================================================
// API Client Functions with Direct Supabase Fallback for Static Host Deployments
// ============================================================================

export async function loginUserApi(employeeId: string): Promise<{ user: User } | null> {
  const trimmed = employeeId.trim();
  const lowerInput = trimmed.toLowerCase();

  // 1. Query Supabase 'users' table directly (User ให้อ้างอิงจาก ตาราง user โดยตรง)
  try {
    const { data: supaUsers, error } = await supabase.from('users').select('*');
    if (!error && supaUsers && supaUsers.length > 0) {
      const found = supaUsers.find((row: any) => {
        const empId = String(row.employee_id || row.emp_id || row.id || '').trim().toLowerCase();
        const email = String(row.email || '').trim().toLowerCase();
        const id = String(row.id || '').trim().toLowerCase();
        const name = String(row.name || '').trim().toLowerCase();

        if (empId === lowerInput || email === lowerInput || id === lowerInput || name === lowerInput) return true;
        
        if (lowerInput.match(/^\d+$/)) {
          const pad4 = 'sat' + lowerInput.padStart(4, '0');
          const pad3 = 'sat' + lowerInput.padStart(3, '0');
          if (empId === pad4 || empId === pad3 || empId.endsWith(lowerInput)) return true;
        }

        if ((lowerInput === '43210344' || lowerInput === 'adminmaster' || lowerInput === 'admin master') && 
            (id === '49' || id === '1' || empId === '43210344' || name.includes('admin'))) {
          return true;
        }

        return false;
      });

      if (found) {
        return { user: mapUserFromDb(found) };
      }
    }
  } catch (supaErr) {
    console.error('[API Client] Direct Supabase user query error:', supaErr);
  }

  // 2. Secondary API endpoint fallback
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId: trimmed })
    });
    if (res.ok) {
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (data && data.user) {
          return { user: data.user };
        }
      }
    }
  } catch (err) {
    // Silent
  }

  // Fallback for Master Admin if network/table error
  if (lowerInput === '43210344' || lowerInput === 'adminmaster' || lowerInput === 'admin master') {
    return {
      user: {
        id: '49',
        employeeId: '43210344',
        name: 'Admin Master',
        thaiName: 'แอดมินมาสเตอร์',
        email: 'adminmaster@sumino.com',
        role: UserRole.ADMINISTRATOR,
        departmentId: 'ALL',
        departmentName: 'Executive / Administration',
        title: 'Master Administrator',
        isActive: true,
        branch: 'Chonburi Branch (Head Office)',
        company: 'SUMINO AAPICO (Thailand) Company Limited'
      }
    };
  }

  return null;
}

export async function fetchAllDataApi() {
  const fetchEndpoint = async (path: string, supaTable: string, mapper: (r: any) => any) => {
    try {
      const res = await fetch(path);
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          if (Array.isArray(data)) return data;
        }
      }
    } catch (e) {
      // ignore, fall back to Supabase
    }

    try {
      const { data, error } = await supabase.from(supaTable).select('*');
      if (!error && Array.isArray(data)) {
        return data.map(mapper);
      }
    } catch (sErr) {
      console.warn(`Supabase fallback query failed for table ${supaTable}:`, sErr);
    }
    return [];
  };

  const [
    users,
    departments,
    vendors,
    prs,
    pos,
    workflowRules,
    auditLogs,
    notifications,
    comparisons,
    capex
  ] = await Promise.all([
    fetchEndpoint('/api/auth/users', 'users', mapUserFromDb),
    fetchEndpoint('/api/departments', 'departments', mapDepartmentFromDb),
    fetchEndpoint('/api/vendors', 'vendors', mapVendorFromDb),
    fetchEndpoint('/api/pr', 'purchase_requisitions', mapPRFromDb),
    fetchEndpoint('/api/po', 'purchase_orders', mapPOFromDb),
    fetchEndpoint('/api/workflow/rules', 'workflow_rules', mapWorkflowRuleFromDb),
    fetchEndpoint('/api/audit-logs', 'audit_logs', (r) => ({
      id: String(r.id),
      timestamp: String(r.timestamp),
      userId: String(r.user_id || r.userId),
      userName: String(r.user_name || r.userName),
      userRole: r.user_role || r.userRole,
      action: String(r.action),
      module: String(r.module),
      details: String(r.details || ''),
      ipAddress: r.ip_address || r.ipAddress,
      userAgent: r.user_agent || r.userAgent
    })),
    fetchEndpoint('/api/notifications', 'notifications', (r) => ({
      id: String(r.id),
      recipientEmail: r.recipient_email || r.recipientEmail,
      recipientName: r.recipient_name || r.recipientName,
      title: r.title,
      message: r.message,
      channel: r.channel,
      timestamp: r.timestamp,
      isRead: Boolean(r.is_read ?? r.isRead),
      status: r.status
    })),
    fetchEndpoint('/api/comparison', 'comparison_sheets', (r) => ({
      id: String(r.id),
      csNumber: r.cs_number || r.csNumber,
      referPrId: r.refer_pr_id || r.referPrId,
      referPrNumber: r.refer_pr_number || r.referPrNumber,
      date: r.date,
      departmentId: r.department_id || r.departmentId,
      departmentName: r.department_name || r.departmentName,
      items: typeof r.items === 'string' ? JSON.parse(r.items) : (r.items || []),
      status: r.status,
      workflowLogs: typeof r.workflow_logs === 'string' ? JSON.parse(r.workflow_logs) : (r.workflow_logs || []),
      currentStepIndex: Number(r.current_step_index || r.currentStepIndex || 0),
      createdById: r.requestor_id || r.requestorId,
      createdByName: r.requestor_name || r.requestorName,
      createdAt: r.date,
      notes: r.notes || ''
    })),
    fetchEndpoint('/api/capex', 'capex_requisitions', (r) => ({
      id: String(r.id),
      capexNumber: r.capex_number || r.capexNumber,
      date: r.date,
      projectName: r.project_name || r.projectName,
      assetGroup: r.asset_group || r.assetGroup,
      budgetStatus: r.budget_status || r.budgetStatus,
      paybackPeriod: Number(r.payback_period || r.paybackPeriod || 0),
      totalInvestment: Number(r.total_investment || r.totalInvestment || 0),
      costSavingsPerYear: Number(r.cost_savings_per_year || r.costSavingsPerYear || 0),
      npvIrr: r.npv_irr || r.npvIrr,
      items: typeof r.items === 'string' ? JSON.parse(r.items) : (r.items || []),
      subtotal: Number(r.subtotal || 0),
      vat: Number(r.vat || 0),
      grandTotal: Number(r.grand_total || r.grandTotal || 0),
      status: r.status,
      requestorId: r.requestor_id || r.requestorId,
      requestorName: r.requestor_name || r.requestorName,
      requestorEmail: r.requestor_email || r.requestorEmail || '',
      departmentId: r.department_id || r.departmentId,
      departmentName: r.department_name || r.departmentName,
      workflowLogs: typeof r.workflow_logs === 'string' ? JSON.parse(r.workflow_logs) : (r.workflow_logs || []),
      currentStepIndex: Number(r.current_step_index || r.currentStepIndex || 0),
      purchaseObjective: r.purchase_objective || r.purchaseObjective || '',
      attachments: typeof r.attachments === 'string' ? JSON.parse(r.attachments) : (r.attachments || []),
      companyName: r.company_name || r.companyName || '',
      branchName: r.branch_name || r.branchName || ''
    }))
  ]);

  return {
    users,
    departments,
    vendors,
    prs,
    pos,
    workflowRules,
    auditLogs,
    notifications,
    comparisons,
    capex
  };
}

// ----------------------------------------------------------------------------
// Create / Save PR
// ----------------------------------------------------------------------------
export async function createPrApi(prData: any, currentUser: User): Promise<PR> {
  // 1. Try Express backend endpoint
  try {
    const res = await fetch('/api/pr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prData)
    });
    if (res.ok) {
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await res.json();
      }
    }
  } catch (err) {
    console.warn('[API Client] POST /api/pr unavailable, using direct Supabase write...');
  }

  // 2. Direct Supabase Execution
  const prId = `PR-${Date.now()}`;
  const prNumber = await getNextRunningNumber('pr');
  
  const items = (prData.items || []).map((item: any, idx: number) => {
    const qty = Number(item.qty || 1);
    const unitPrice = Number(item.unitPrice || 0);
    return {
      id: item.id || `PRI-${Date.now()}-${idx}`,
      itemNo: idx + 1,
      partNo: item.partNo || '',
      description: item.description || 'Item',
      specification: item.specification || '',
      unit: item.unit || 'PCS',
      qty,
      unitPrice,
      total: qty * unitPrice
    };
  });

  const subtotal = items.reduce((sum: number, i: any) => sum + i.total, 0);
  const vat = subtotal * 0.07;
  const grandTotal = subtotal + vat;

  const initialLog = {
    id: `WFL-${Date.now()}-0`,
    action: prData.status === PRStatus.PENDING_DEPT_MGR ? 'SUBMITTED' : 'CREATED',
    stepName: prData.status === PRStatus.PENDING_DEPT_MGR ? 'Pending Manager Approval' : 'Draft Created',
    performedBy: currentUser.id,
    userName: currentUser.name,
    userRole: currentUser.role,
    comment: prData.status === PRStatus.PENDING_DEPT_MGR ? 'PR submitted for department manager review.' : 'Draft PR saved.',
    timestamp: new Date().toISOString()
  };

  const newPr: PR = {
    id: prId,
    prNumber,
    date: new Date().toISOString().split('T')[0],
    requestorId: currentUser.id,
    requestorName: currentUser.name,
    requestorEmail: currentUser.email || `${currentUser.id.toLowerCase()}@sat.co.th`,
    departmentId: currentUser.departmentId || 'Administration',
    departmentName: currentUser.departmentName || 'Administration Department',
    suggestedVendorId: prData.suggestedVendorId || '',
    vendorName: prData.vendorName || '',
    vendorAddress: prData.vendorAddress || '-',
    vendorPhone: prData.vendorPhone || '-',
    vendorFax: prData.vendorFax || '',
    vendorTaxId: prData.vendorTaxId || '-',
    items,
    purchaseObjective: prData.purchaseObjective || '-',
    subtotal,
    vat,
    grandTotal,
    status: prData.status || PRStatus.DRAFT,
    attachments: prData.attachments || [],
    workflowLogs: [initialLog],
    currentStepIndex: 0,
    companyName: prData.companyName || 'SUMINO AAPICO (Thailand) Company Limited',
    branchName: prData.branchName || 'Chonburi Branch (Head Office)'
  };

  const dbRow = mapPRToDb(newPr);
  const { error } = await supabase.from('purchase_requisitions').upsert(dbRow);
  if (error) {
    console.error('[Supabase Save PR] Error:', error);
    throw new Error(`Supabase Save Failed: ${error.message}`);
  }

  // Record Audit Log in Supabase
  try {
    await supabase.from('audit_logs').insert({
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user_id: currentUser.id,
      user_name: currentUser.name,
      user_role: currentUser.role,
      action: 'CREATE_PR',
      module: 'PR',
      details: `Created PR ${prNumber} with Grand Total: ${grandTotal.toLocaleString()} THB`
    });
  } catch (e) {
    // Non-blocking log error
  }

  return newPr;
}

// ----------------------------------------------------------------------------
// Update PR Status
// ----------------------------------------------------------------------------
export async function updatePrStatusApi(id: string, updateData: any): Promise<boolean> {
  try {
    const res = await fetch(`/api/pr/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    if (res.ok) return true;
  } catch (err) {
    console.warn(`[API Client] PUT /api/pr/${id} failed, using Supabase fallback...`);
  }

  // Fallback to direct Supabase update
  try {
    const { data: existing } = await supabase.from('purchase_requisitions').select('*').eq('id', id).single();
    if (!existing) throw new Error('PR not found in database');

    const pr = mapPRFromDb(existing);
    const updatedStatus = updateData.status || pr.status;

    let subtotal = pr.subtotal;
    let vat = pr.vat;
    let grandTotal = pr.grandTotal;
    let items = pr.items;

    if (updateData.items && updateData.items.length > 0) {
      items = updateData.items.map((item: any, idx: number) => ({
        id: item.id || `PRI-${Date.now()}-${idx}`,
        itemNo: idx + 1,
        partNo: item.partNo || '',
        description: item.description,
        specification: item.specification || '',
        unit: item.unit || 'PCS',
        qty: Number(item.qty || 1),
        unitPrice: Number(item.unitPrice || 0),
        total: Number(item.qty || 1) * Number(item.unitPrice || 0)
      }));
      subtotal = items.reduce((s: number, i: any) => s + i.total, 0);
      vat = subtotal * 0.07;
      grandTotal = subtotal + vat;
    }

    const updatedPR: PR = {
      ...pr,
      items,
      subtotal,
      vat,
      grandTotal,
      status: updatedStatus,
      purchaseObjective: updateData.purchaseObjective || pr.purchaseObjective,
      attachments: updateData.attachments || pr.attachments
    };

    const { error } = await supabase.from('purchase_requisitions').upsert(mapPRToDb(updatedPR));
    if (error) throw new Error(error.message);
    return true;
  } catch (err: any) {
    console.error('[Supabase PR Update] Error:', err);
    throw new Error(err?.message || 'Failed updating PR in Supabase');
  }
}

// ----------------------------------------------------------------------------
// Delete PR
// ----------------------------------------------------------------------------
export async function deletePrApi(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/pr/${id}`, { method: 'DELETE' });
    if (res.ok) {
      try {
        await supabase.from('purchase_requisitions').delete().or(`id.eq.${id},pr_number.eq.${id}`);
      } catch (e) {}
      return true;
    }
  } catch (err) {
    // fallback to Supabase
  }

  try {
    const { error } = await supabase.from('purchase_requisitions').delete().or(`id.eq.${id},pr_number.eq.${id}`);
    if (error) console.error(error);
    return true;
  } catch (err: any) {
    console.error('[Supabase PR Delete] Error:', err);
    return true;
  }
}

// ----------------------------------------------------------------------------
// Approve / Reject PR
// ----------------------------------------------------------------------------
export async function approvePrApi(
  id: string, 
  currentUser: User, 
  comment: string, 
  signatureData: string, 
  companyStampData?: string, 
  geoCoordinates?: string, 
  isReject?: boolean
): Promise<boolean> {
  try {
    const res = await fetch(`/api/pr/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        comment,
        signatureData,
        companyStampData,
        geoCoordinates,
        isReject
      })
    });
    if (res.ok) return true;
  } catch (err) {
    console.warn(`[API Client] POST /api/pr/${id}/approve failed, using Supabase fallback...`);
  }

  // Supabase Fallback
  try {
    const { data: existing } = await supabase.from('purchase_requisitions').select('*').eq('id', id).single();
    if (!existing) throw new Error('PR not found');

    const pr = mapPRFromDb(existing);

    let newStatus = pr.status;
    let stepName = 'Reviewed';

    if (isReject) {
      newStatus = PRStatus.REJECTED;
      stepName = 'Rejected';
    } else {
      if (pr.status === PRStatus.PENDING_DEPT_MGR || pr.status === PRStatus.DRAFT) {
        if (pr.grandTotal > 100000) {
          newStatus = PRStatus.PENDING_EXECUTIVE;
          stepName = 'Approved by Department Manager';
        } else {
          newStatus = PRStatus.APPROVED;
          stepName = 'Approved (Final)';
        }
      } else if (pr.status === PRStatus.PENDING_EXECUTIVE) {
        newStatus = PRStatus.APPROVED;
        stepName = 'Approved by Executive';
      } else {
        newStatus = PRStatus.APPROVED;
      }
    }

    const digitalHash = Math.random().toString(36).substring(2, 15);
    const signature = signatureData ? {
      signedBy: currentUser.name,
      role: currentUser.role,
      title: currentUser.title,
      timestamp: new Date().toISOString(),
      ipAddress: '127.0.0.1',
      userAgent: 'Web App Client',
      browser: 'Web App',
      device: 'Desktop',
      signatureData,
      companyStampData,
      geoCoordinates,
      digitalHash
    } : undefined;

    const newLog = {
      id: `WFL-${Date.now()}`,
      action: isReject ? 'REJECTED' : 'APPROVED',
      stepName,
      performedBy: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      comment: comment || (isReject ? 'PR rejected.' : 'PR digitally signed and approved.'),
      timestamp: new Date().toISOString(),
      signature
    };

    const updatedPR: PR = {
      ...pr,
      status: newStatus,
      workflowLogs: [...pr.workflowLogs, newLog]
    };

    const { error } = await supabase.from('purchase_requisitions').upsert(mapPRToDb(updatedPR));
    if (error) throw new Error(error.message);
    return true;
  } catch (err: any) {
    console.error('[Supabase Approve PR] Error:', err);
    throw new Error(err?.message || 'Failed signing & approving PR');
  }
}

// ----------------------------------------------------------------------------
// Generate PO from PR
// ----------------------------------------------------------------------------
export async function generatePoApi(
  prId: string, 
  currentUser: User, 
  signatureData?: string, 
  companyStampData?: string
): Promise<PO> {
  try {
    const res = await fetch('/api/po/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prId, userId: currentUser.id, signatureData, companyStampData })
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('[API Client] POST /api/po/generate failed, using Supabase fallback...');
  }

  // Supabase Fallback
  const { data: prData } = await supabase.from('purchase_requisitions').select('*').eq('id', prId).single();
  if (!prData) throw new Error('PR not found in Supabase');

  const pr = mapPRFromDb(prData);
  const poId = `PO-${Date.now()}`;
  const poNumber = await getNextRunningNumber('po');

  const digitalHash = Math.random().toString(36).substring(2, 15);
  const initialLog = {
    id: `WFL-${Date.now()}-0`,
    action: 'CREATED',
    stepName: 'PO Generated from Approved PR',
    performedBy: currentUser.id,
    userName: currentUser.name,
    userRole: currentUser.role,
    comment: `PO generated from PR ${pr.prNumber}`,
    timestamp: new Date().toISOString(),
    signature: signatureData ? {
      signedBy: currentUser.name,
      role: currentUser.role,
      title: currentUser.title,
      timestamp: new Date().toISOString(),
      ipAddress: '127.0.0.1',
      userAgent: 'Web App Client',
      browser: 'Web App',
      device: 'Desktop',
      signatureData,
      companyStampData,
      digitalHash
    } : undefined
  };

  const newPo: PO = {
    id: poId,
    poNumber,
    referPrId: pr.id,
    referPrNumber: pr.prNumber,
    date: new Date().toISOString().split('T')[0],
    vendorId: pr.suggestedVendorId || '',
    vendorName: pr.vendorName || '',
    vendorAddress: pr.vendorAddress || '',
    vendorPhone: pr.vendorPhone || '',
    vendorFax: pr.vendorFax || '',
    vendorTaxId: pr.vendorTaxId || '',
    shippingAddress: '700/706 Moo 3, Tambon Bankao, Amphur Panthong, Chonburi 20160',
    departmentId: pr.departmentId,
    departmentName: pr.departmentName,
    creditTerm: '30 Days',
    items: pr.items,
    subtotal: pr.subtotal,
    vat: pr.vat,
    grandTotal: pr.grandTotal,
    status: POStatus.PENDING_PURCHASING_MGR,
    notes: `PO created automatically from PR ${pr.prNumber}`,
    attachments: pr.attachments,
    workflowLogs: [initialLog],
    currentStepIndex: 0,
    companyName: pr.companyName,
    branchName: pr.branchName
  };

  // Upsert PO
  const { error: poErr } = await supabase.from('purchase_orders').upsert(mapPOToDb(newPo));
  if (poErr) throw new Error(poErr.message);

  // Update PR status to PO_CREATED
  pr.status = PRStatus.PO_CREATED;
  await supabase.from('purchase_requisitions').upsert(mapPRToDb(pr));

  return newPo;
}

// ----------------------------------------------------------------------------
// Delete PO
// ----------------------------------------------------------------------------
export async function deletePoApi(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/po/${id}`, { method: 'DELETE' });
    if (res.ok) {
      try {
        await supabase.from('purchase_orders').delete().or(`id.eq.${id},po_number.eq.${id}`);
      } catch (e) {}
      return true;
    }
  } catch (err) {
    // fallback
  }

  try {
    const { error } = await supabase.from('purchase_orders').delete().or(`id.eq.${id},po_number.eq.${id}`);
    if (error) console.error(error);
    return true;
  } catch (err: any) {
    return true;
  }
}

// ----------------------------------------------------------------------------
// Save Vendor
// ----------------------------------------------------------------------------
export async function saveVendorApi(vendorData: any): Promise<Vendor> {
  try {
    const res = await fetch('/api/vendors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vendorData)
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('[API Client] POST /api/vendors failed, using Supabase fallback...');
  }

  const vId = `VND-${Date.now()}`;
  const vendor: Vendor = {
    id: vId,
    code: vendorData.code || `VND-${String(Date.now()).substring(8)}`,
    name: vendorData.name,
    address: vendorData.address || '-',
    phone: vendorData.phone || '-',
    fax: vendorData.fax || '',
    taxId: vendorData.taxId || '-',
    contactPerson: vendorData.contactPerson || '',
    creditTerm: vendorData.creditTerm || '30 Days'
  };

  const { error } = await supabase.from('vendors').upsert(mapVendorToDb(vendor));
  if (error) throw new Error(error.message);

  return vendor;
}

// ----------------------------------------------------------------------------
// Update PR Step Signature
// ----------------------------------------------------------------------------
export async function updatePrStepSignatureApi(
  id: string,
  userId: string,
  stepName: string,
  action: string,
  signatureData: string,
  companyStampData?: string,
  geoCoordinates?: string
): Promise<boolean> {
  try {
    const res = await fetch(`/api/pr/${id}/step-signature`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, stepName, action, signatureData, companyStampData, geoCoordinates })
    });
    if (res.ok) return true;
  } catch (e) {
    console.warn("API error updating step signature:", e);
  }

  // Fallback via Supabase
  try {
    const { data: existing } = await supabase.from('purchase_requisitions').select('*').eq('id', id).single();
    if (existing) {
      const pr = mapPRFromDb(existing);
      const ip = '127.0.0.1';
      const ua = navigator.userAgent;
      const digitalHash = Math.random().toString(36).substring(2, 15);
      const sig: SignatureDetails = {
        signedBy: pr.requestorName,
        role: UserRole.EMPLOYEE,
        title: 'Staff',
        timestamp: new Date().toISOString(),
        ipAddress: ip,
        userAgent: ua,
        browser: 'Web Browser',
        device: 'Web Client Device',
        geoCoordinates,
        signatureData,
        companyStampData,
        digitalHash
      };

      const existingLogIdx = pr.workflowLogs.findIndex(l => l.stepName === stepName || (action && l.action === action));
      if (existingLogIdx !== -1) {
        pr.workflowLogs[existingLogIdx].signature = sig;
        pr.workflowLogs[existingLogIdx].timestamp = new Date().toISOString();
      } else {
        pr.workflowLogs.push({
          id: `WFL-${Date.now()}`,
          action: action || 'APPROVED',
          stepName: stepName || 'Approved',
          performedBy: userId,
          userName: pr.requestorName,
          userRole: UserRole.EMPLOYEE,
          comment: 'Signature added / updated.',
          timestamp: new Date().toISOString(),
          signature: sig
        });
      }

      await supabase.from('purchase_requisitions').update(mapPRToDb(pr)).eq('id', id);
      return true;
    }
  } catch (err) {
    console.error("Supabase fallback step signature error:", err);
  }

  return false;
}
