/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from './firebase-applet-config.json' with { type: 'json' };
import { supabase } from './src/lib/supabase.js';

// Initialize Firebase Admin (with try/catch fallback to prevent container boot crashes)
let db_firestore: any = null;
try {
  if (!getApps().length && firebaseConfig && (firebaseConfig as any).projectId) {
    initializeApp({
      credential: applicationDefault(),
      projectId: (firebaseConfig as any).projectId,
    });
  }
  db_firestore = getFirestore((firebaseConfig as any).firestoreDatabaseId);
  db_firestore.settings({ ignoreUndefinedProperties: true });
} catch (e) {
  console.log('Note: Firebase Admin could not be initialized. Carrying on with robust Supabase primary database.');
}

import {
  UserRole,
  PRStatus,
  POStatus,
  User,
  Department,
  Vendor,
  PR,
  PO,
  WorkflowRule,
  NotificationLog,
  AuditLog,
  WorkflowLog,
  SignatureDetails,
  ComparisonSheet,
  ComparisonItem,
  VendorOffer,
  CapexStatus,
  CapexRequisition
} from './src/types.js';
import { MASTER_VENDORS } from './src/vendorsMasterList.js';

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'database.json');

// Ensure JSON parsing works
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initial State / Seed Data
const INITIAL_USERS: User[] = [
  {
    id: 'USR_ADMINMASTER',
    employeeId: '43210344',
    name: 'adminmaster',
    thaiName: 'ผู้ดูแลระบบสูงสุด',
    email: 'adminmaster@sumino.com',
    role: UserRole.ADMINISTRATOR,
    departmentId: 'DEP001', // Management
    title: 'Master Administrator',
    isActive: true,
    branch: 'Chonburi Branch (Head Office)',
    company: 'SUMINO AAPICO (Thailand) Company Limited'
  },
  {
    id: 'USR001',
    employeeId: 'SAT0417',
    name: 'Mr. Kitthana Khoommoll',
    thaiName: 'นายกิตติ์ธนา คำมูล',
    email: 'artkitthana.kh@gmail.com',
    role: UserRole.ADMINISTRATOR,
    departmentId: 'DEP004', // HR/GA
    title: 'IT Officer & Administrator',
    isActive: true,
    branch: 'Chonburi Branch (Head Office)',
    company: 'SUMINO AAPICO (Thailand) Company Limited'
  },
  {
    id: 'USR002',
    employeeId: 'SAT0608',
    name: 'Mr. Liu Dong',
    thaiName: 'นายลิว ดอง',
    email: 'liudong@sumino.com',
    role: UserRole.EXECUTIVE,
    departmentId: 'DEP001', // Management
    title: 'Managing Director',
    isActive: true,
    branch: 'Chonburi Branch (Head Office)',
    company: 'SUMINO AAPICO (Thailand) Company Limited'
  },
  {
    id: 'USR003',
    employeeId: 'SAT0615',
    name: 'Mr. Yoshiyuki Konishi',
    thaiName: 'นายโยชิยุกิ โคนิชิ',
    email: 'yoshiyuki@sumino.com',
    role: UserRole.EXECUTIVE,
    departmentId: 'DEP001', // Management
    title: 'Plant Manager',
    isActive: true,
    branch: 'Chonburi Branch (Head Office)',
    company: 'SUMINO AAPICO (Thailand) Company Limited'
  },
  {
    id: 'USR004',
    employeeId: 'SAT0011',
    name: 'Miss Thitaporn Jareonwong',
    thaiName: 'นางสาวฐิตาภรณ์ เจริญวงศ์',
    email: 'thitaporn@sumino.com',
    role: UserRole.DEPARTMENT_MANAGER,
    departmentId: 'DEP002', // PC&L
    title: 'PC&L Assistant Manager',
    isActive: true,
    branch: 'Chonburi Branch (Head Office)',
    company: 'SUMINO AAPICO (Thailand) Company Limited'
  },
  {
    id: 'USR005',
    employeeId: 'SAT0247',
    name: 'Mr. Thanawuth Phuthaweephong',
    thaiName: 'นายธนวุฒิ พัทวีพงศ์',
    email: 'thanawuth@sumino.com',
    role: UserRole.ASSISTANT_MANAGER,
    departmentId: 'DEP003', // Sales / Purchasing / PE
    title: 'Sales / Purchasing / PE Assistant Manager',
    isActive: true,
    branch: 'Chonburi Branch (Head Office)',
    company: 'SUMINO AAPICO (Thailand) Company Limited'
  },
  {
    id: 'USR006',
    employeeId: 'SAT0416',
    name: 'Miss Pornpun Chopchoen',
    thaiName: 'นางสาวพรพรรณ ช้อนชื่น',
    email: 'pornpun@sumino.com',
    role: UserRole.PURCHASING,
    departmentId: 'DEP003', // Sales / Purchasing / PE
    title: 'Sales / Purchasing Officer',
    isActive: true,
    branch: 'Chonburi Branch (Head Office)',
    company: 'SUMINO AAPICO (Thailand) Company Limited'
  },
  {
    id: 'USR007',
    employeeId: 'SAT0009',
    name: 'Miss Duangrat Thanachaiwongnart',
    thaiName: 'นางสาวดวงรัตน์ ธนชัยวงษ์นาถ',
    email: 'duangrat@sumino.com',
    role: UserRole.PURCHASING,
    departmentId: 'DEP004', // HR/GA
    title: 'Administration Senior Officer',
    isActive: true,
    branch: 'Chonburi Branch (Head Office)',
    company: 'SUMINO AAPICO (Thailand) Company Limited'
  },
  {
    id: 'USR008',
    employeeId: 'SAT0012',
    name: 'Mr. Attapol Sodklang',
    thaiName: 'นายอัฐพล สดกลาง',
    email: 'attapol@sumino.com',
    role: UserRole.EMPLOYEE,
    departmentId: 'DEP005', // Production
    title: 'Production Leader Kaizen',
    isActive: true,
    branch: 'Chonburi Branch (Head Office)',
    company: 'SUMINO AAPICO (Thailand) Company Limited'
  },
  {
    id: 'USR009',
    employeeId: 'SAT0015',
    name: 'Miss Montha Yawichai',
    thaiName: 'นางสาวมณฑา ยาวิชัย',
    email: 'montha@sumino.com',
    role: UserRole.EMPLOYEE,
    departmentId: 'DEP005', // Production
    title: 'Production Staff',
    isActive: true,
    branch: 'Chonburi Branch (Head Office)',
    company: 'SUMINO AAPICO (Thailand) Company Limited'
  },
  {
    id: 'USR010',
    employeeId: 'SAT0016',
    name: 'Mr. Akekarin Sutthamaruk',
    thaiName: 'นายเอกนรินทร์ สุธรรมรักษ์',
    email: 'akekarin@sumino.com',
    role: UserRole.DEPARTMENT_MANAGER,
    departmentId: 'DEP006', // QA/QC
    title: 'QA Supervisor',
    isActive: true,
    branch: 'Chonburi Branch (Head Office)',
    company: 'SUMINO AAPICO (Thailand) Company Limited'
  },
  {
    id: 'USR011',
    employeeId: 'SAT0020',
    name: 'Mr. Samarn Buchatham',
    thaiName: 'นายสมาน บุชาธรรม',
    email: 'samarn@sumino.com',
    role: UserRole.EMPLOYEE,
    departmentId: 'DEP005', // Production
    title: 'Production Die Maintenance Leader',
    isActive: true,
    branch: 'Chonburi Branch (Head Office)',
    company: 'SUMINO AAPICO (Thailand) Company Limited'
  },
  {
    id: 'USR012',
    employeeId: 'SAT0040',
    name: 'Miss Ithiya Pongseeak',
    thaiName: 'นางสาวอิทธิญา ผงสีอัก',
    email: 'ithiya@sumino.com',
    role: UserRole.EMPLOYEE,
    departmentId: 'DEP005', // Production
    title: 'Production Assembly Operator',
    isActive: true,
    branch: 'Chonburi Branch (Head Office)',
    company: 'SUMINO AAPICO (Thailand) Company Limited'
  },
  {
    id: 'USR013',
    employeeId: 'SAT0047',
    name: 'Miss Nattawan Srithonganan',
    thaiName: 'นางสาวณัฐวรรณ ศรีทองอนันต์',
    email: 'nattawan@sumino.com',
    role: UserRole.EMPLOYEE,
    departmentId: 'DEP005', // Production
    title: 'Production Assembly Leader',
    isActive: true,
    branch: 'Chonburi Branch (Head Office)',
    company: 'SUMINO AAPICO (Thailand) Company Limited'
  },
  {
    id: 'USR014',
    employeeId: 'SAT0085',
    name: 'Mr. Ekkaphop Phetsuriya',
    thaiName: 'นายเอกภพ เพ็ชรสุริยา',
    email: 'ekkaphop@sumino.com',
    role: UserRole.DEPARTMENT_MANAGER,
    departmentId: 'DEP005', // Production
    title: 'Production Office Assistant Manager',
    isActive: true,
    branch: 'Chonburi Branch (Head Office)',
    company: 'SUMINO AAPICO (Thailand) Company Limited'
  },
  {
    id: 'USR015',
    employeeId: 'SAT0087',
    name: 'Mr. Pattana Mongphet',
    thaiName: 'นายพัฒนา มองเพ็ชร',
    email: 'pattana@sumino.com',
    role: UserRole.EMPLOYEE,
    departmentId: 'DEP005', // Production
    title: 'Production Press Leader',
    isActive: true,
    branch: 'Chonburi Branch (Head Office)',
    company: 'SUMINO AAPICO (Thailand) Company Limited'
  },
  {
    id: 'USR016',
    employeeId: 'SAT0107',
    name: 'Miss Jirawan Inthong',
    thaiName: 'นางสาวจิราวรรณ อินทอง',
    email: 'jirawan@sumino.com',
    role: UserRole.DEPARTMENT_MANAGER,
    departmentId: 'DEP006', // QA/QC
    title: 'QC Supervisor',
    isActive: true,
    branch: 'Chonburi Branch (Head Office)',
    company: 'SUMINO AAPICO (Thailand) Company Limited'
  },
  {
    id: 'USR017',
    employeeId: 'SAT0214',
    name: 'Miss Benjawan Tidchat',
    thaiName: 'นางสาวเบ็ญจวรรณ ทิดชาติ',
    email: 'benjawan@sumino.com',
    role: UserRole.DEPARTMENT_MANAGER,
    departmentId: 'DEP004', // Administration
    title: 'HR/GA Assistant Manager',
    isActive: true,
    branch: 'Chonburi Branch (Head Office)',
    company: 'SUMINO AAPICO (Thailand) Company Limited'
  },
  {
    id: 'USR018',
    employeeId: 'SAT0312',
    name: 'Miss Kitsana Aorak',
    thaiName: 'นางสาวกฤษณกฤษณ์ โอรักษ์',
    email: 'kitsana@sumino.com',
    role: UserRole.DEPARTMENT_MANAGER,
    departmentId: 'DEP007', // Accounting
    title: 'Accounting/Finance Supervisor',
    isActive: true,
    branch: 'Chonburi Branch (Head Office)',
    company: 'SUMINO AAPICO (Thailand) Company Limited'
  },
  {
    id: 'USR019',
    employeeId: 'SAT0505',
    name: 'Miss Lalana Kulawong',
    thaiName: 'นางสาวลลนา กุลวงศ์',
    email: 'lalana@sumino.com',
    role: UserRole.EMPLOYEE,
    departmentId: 'DEP007', // Accounting
    title: 'Accounting/Finance Officer',
    isActive: true,
    branch: 'Chonburi Branch (Head Office)',
    company: 'SUMINO AAPICO (Thailand) Company Limited'
  },
  {
    id: 'USR020',
    employeeId: 'SAT0325',
    name: 'Miss Yenrudee Buaphorn',
    thaiName: 'นางสาวเย็นฤดี บัวพร',
    email: 'yenrudee@sumino.com',
    role: UserRole.EMPLOYEE,
    departmentId: 'DEP006', // QA/QC
    title: 'QMS Officer (DCC)',
    isActive: true,
    branch: 'Chonburi Branch (Head Office)',
    company: 'SUMINO AAPICO (Thailand) Company Limited'
  },
  {
    id: 'USR021',
    employeeId: 'SAT0396',
    name: 'Miss Wiraya Sabwilai',
    thaiName: 'นางสาววิระยา ทรัพย์วิลัย',
    email: 'wiraya@sumino.com',
    role: UserRole.EMPLOYEE,
    departmentId: 'DEP006', // QA/QC
    title: 'QMS Senior Officer',
    isActive: true,
    branch: 'Chonburi Branch (Head Office)',
    company: 'SUMINO AAPICO (Thailand) Company Limited'
  },
  {
    id: 'USR022',
    employeeId: 'SAT0458',
    name: 'Miss Thanaporn Kaewhan',
    thaiName: 'นางสาวธนาภรณ์ แก้วหาญ',
    email: 'thanaporn@sumino.com',
    role: UserRole.PURCHASING,
    departmentId: 'DEP004', // Administration
    title: 'Safety Officer',
    isActive: true,
    branch: 'Chonburi Branch (Head Office)',
    company: 'SUMINO AAPICO (Thailand) Company Limited'
  },
  {
    id: 'USR023',
    employeeId: 'SAT0465',
    name: 'Mr. Visarut Chaiyasit',
    thaiName: 'นายวิศรุต ไชยสิทธิ์',
    email: 'visarut@sumino.com',
    role: UserRole.EMPLOYEE,
    departmentId: 'DEP004', // Administration
    title: 'Administration Driver',
    isActive: true,
    branch: 'Chonburi Branch (Head Office)',
    company: 'SUMINO AAPICO (Thailand) Company Limited'
  },
  {
    id: 'USR024',
    employeeId: 'SAT0490',
    name: 'Mr. Ronnakorn Chantaranetsakul',
    thaiName: 'นายรณกร จันทรเนตรสกุล',
    email: 'ronnakorn@sumino.com',
    role: UserRole.EMPLOYEE,
    departmentId: 'DEP005', // Production Engineering
    title: 'Production Engineering Engineer',
    isActive: true,
    branch: 'Chonburi Branch (Head Office)',
    company: 'SUMINO AAPICO (Thailand) Company Limited'
  },
  {
    id: 'USR025',
    employeeId: 'SAT0566',
    name: 'Mr. Paryoon Suttakhet',
    thaiName: 'นายประยูร สุทธเขต',
    email: 'paryoon@sumino.com',
    role: UserRole.EMPLOYEE,
    departmentId: 'DEP002', // PC&L
    title: 'PC&L Staff',
    isActive: true,
    branch: 'Chonburi Branch (Head Office)',
    company: 'SUMINO AAPICO (Thailand) Company Limited'
  },
  {
    id: 'USR026',
    employeeId: 'SAT0617',
    name: 'Mr. Teeraphat Janthanu',
    thaiName: 'นายธีรภัทร์ จันทนู',
    email: 'teeraphat@sumino.com',
    role: UserRole.DEPARTMENT_MANAGER,
    departmentId: 'DEP002', // PC&L
    title: 'PC&L Assistant Manager',
    isActive: true,
    branch: 'Chonburi Branch (Head Office)',
    company: 'SUMINO AAPICO (Thailand) Company Limited'
  },
  {
    id: 'USR027',
    employeeId: 'SAT0406',
    name: 'Miss Jariya Phiwphan',
    thaiName: 'นางสาวจริยา ผิวพรรณ์',
    email: 'jariya@sumino.com',
    role: UserRole.PURCHASING,
    departmentId: 'DEP004', // Administration
    title: 'Officer (General Affairs/HR)',
    isActive: true,
    branch: 'Chonburi Branch (Head Office)',
    company: 'SUMINO AAPICO (Thailand) Company Limited'
  },
  {
    id: 'USR028',
    employeeId: 'SAT0417',
    name: 'Mr. Kitthana Khoommoll',
    thaiName: 'นายกิตติ์ธนา คำมูล',
    email: 'kitthana@sumino.com',
    role: UserRole.PURCHASING,
    departmentId: 'DEP004', // Administration
    title: 'IT Officer',
    isActive: true,
    branch: 'Chonburi Branch (Head Office)',
    company: 'SUMINO AAPICO (Thailand) Company Limited'
  }
];

const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'DEP001', name: 'Management', code: 'MGMT', budget: 15000000, spent: 4200000, remaining: 10800000 },
  { id: 'DEP002', name: 'PC&L (Production Control & Logistics)', code: 'PC&L', budget: 5000000, spent: 1200000, remaining: 3800000 },
  { id: 'DEP003', name: 'Sales / Purchasing / PE', code: 'PUR', budget: 2500000, spent: 650000, remaining: 1850000 },
  { id: 'DEP004', name: 'HR / General Affairs', code: 'HRGA', budget: 2000000, spent: 480000, remaining: 1520000 },
  { id: 'DEP005', name: 'Production', code: 'PROD', budget: 10000000, spent: 2500000, remaining: 7500000 },
  { id: 'DEP006', name: 'QA / QC', code: 'QAQC', budget: 3000000, spent: 900000, remaining: 2100000 },
  { id: 'DEP007', name: 'Accounting', code: 'ACT', budget: 4000000, spent: 1100000, remaining: 2900000 }
];

const INITIAL_VENDORS: Vendor[] = [
  {
    id: 'VND001',
    name: 'AAPICO Plastics Co., Ltd.',
    code: 'VND001',
    address: '700/302 Moo 6, Amata City Chonburi Industrial Estate, Tambon Donhuaroh, Amphur Muang, Chonburi 20000',
    phone: '038-456-001',
    fax: '038-456-005',
    taxId: '0105537042890',
    contactPerson: 'K. Somchai',
    creditTerm: '30 Days'
  },
  {
    id: 'VND002',
    name: 'Sumino Kogyo Co., Ltd. (Japan)',
    code: 'VND002',
    address: '1-1-1 Yoshihama, Hiroshima, Japan, Zip 730-0811',
    phone: '+81-82-424-1111',
    fax: '+81-82-424-2222',
    taxId: '0205560124480',
    contactPerson: 'Mr. Kenji Sato',
    creditTerm: '60 Days'
  },
  {
    id: 'VND003',
    name: 'Toyota Tsusho (Thailand) Co., Ltd.',
    code: 'VND003',
    address: '999/9 Rama 9 Road, Suanluang, Bangkok 10250',
    phone: '02-663-9100',
    fax: '02-663-9111',
    taxId: '0105500000111',
    contactPerson: 'K. Sarit',
    creditTerm: '30 Days'
  },
  {
    id: 'VND004',
    name: 'Siam Steel Service Center PLC',
    code: 'VND004',
    address: '51/1 Moo 2, Poochaosamingprai Road, Bangyaprak, Phrapradaeng, Samutprakarn 10130',
    phone: '02-385-5011',
    fax: '02-385-5022',
    taxId: '0107537000213',
    contactPerson: 'K. Anchalee',
    creditTerm: '45 Days'
  },
  ...MASTER_VENDORS.map((v, i) => ({
    id: `VND${(i + 5).toString().padStart(3, '0')}`,
    code: `VND${(i + 5).toString().padStart(3, '0')}`,
    ...v
  }))
];

const INITIAL_WORKFLOW_RULES: WorkflowRule[] = [
  {
    id: 'WFR001',
    departmentId: 'ALL',
    amountLimit: 100000, // Manager approves up to 100k, higher goes to Executive
    requireExecutiveApproval: true,
    parallelApproval: false,
    delegateActive: false
  }
];

// Helper to Load/Save Database JSON
interface DatabaseSchema {
  users: User[];
  departments: Department[];
  vendors: Vendor[];
  workflowRules: WorkflowRule[];
  purchaseRequisitions: PR[];
  purchaseOrders: PO[];
  notifications: NotificationLog[];
  auditLogs: AuditLog[];
  comparisonSheets: ComparisonSheet[];
  capexRequisitions?: CapexRequisition[];
  runningNumbers: {
    year: number;
    prCounter: number;
    poCounter: number;
    csCounter: number;
    capexCounter?: number;
  };
  surveys?: any[];
  deliveries?: any[];
  deposits?: any[];
  cashPurchases?: any[];
  creditPurchases?: any[];
  returns?: any[];
  adjustments?: any[];
  landedCosts?: any[];
}

function loadDB(): DatabaseSchema {
  if (!fs.existsSync(DB_FILE)) {
    const defaultDB: DatabaseSchema = {
      users: INITIAL_USERS,
      departments: INITIAL_DEPARTMENTS,
      vendors: INITIAL_VENDORS,
      workflowRules: INITIAL_WORKFLOW_RULES,
      purchaseRequisitions: [],
      purchaseOrders: [],
      notifications: [],
      comparisonSheets: [],
      capexRequisitions: [],
      surveys: [],
      deliveries: [],
      deposits: [],
      cashPurchases: [],
      creditPurchases: [],
      returns: [],
      adjustments: [],
      landedCosts: [],
      auditLogs: [
        {
          id: 'LOG001',
          timestamp: new Date().toISOString(),
          userId: 'SYSTEM',
          userName: 'System Init',
          userRole: UserRole.ADMINISTRATOR,
          action: 'DB_INITIALIZATION',
          module: 'SYSTEM',
          details: 'Electronic Purchasing Database seeded with default enterprise configuration successfully.',
          ipAddress: '127.0.0.1',
          userAgent: 'Server-Side'
        }
      ],
      runningNumbers: {
        year: 2026,
        prCounter: 0,
        poCounter: 0,
        csCounter: 0,
        capexCounter: 0
      }
    };
    
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultDB, null, 2), 'utf-8');
    return defaultDB;
  }
  const loaded = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  loaded.users = INITIAL_USERS;
  loaded.departments = INITIAL_DEPARTMENTS;
  if (!loaded.vendors) {
    loaded.vendors = INITIAL_VENDORS;
  } else {
    // Filter out malformed vendors missing name/id and ensure valid structure
    loaded.vendors = loaded.vendors
      .filter((v: any) => v && typeof v === 'object')
      .map((v: any, idx: number) => ({
        id: v.id ? String(v.id) : `VND${(idx + 1).toString().padStart(3, '0')}`,
        code: v.code ? String(v.code) : (v.id ? String(v.id) : `VND${(idx + 1).toString().padStart(3, '0')}`),
        name: v.name ? String(v.name) : 'General Vendor',
        address: v.address || '',
        phone: v.phone || '',
        fax: v.fax || '',
        taxId: v.taxId || '',
        contactPerson: v.contactPerson || '',
        creditTerm: v.creditTerm || '30 Days'
      }));
    INITIAL_VENDORS.forEach(iv => {
      if (iv?.name && !loaded.vendors.some((v: any) => v?.name && v.name.toLowerCase() === iv.name.toLowerCase())) {
        loaded.vendors.push(iv);
      }
    });
  }
  if (!loaded.comparisonSheets) {
    loaded.comparisonSheets = [];
  }
  if (!loaded.capexRequisitions) {
    loaded.capexRequisitions = [];
  }
  if (!loaded.runningNumbers) {
    loaded.runningNumbers = { year: 2026, prCounter: 0, poCounter: 0, csCounter: 0, capexCounter: 0 };
  }
  if (loaded.runningNumbers.csCounter === undefined) {
    loaded.runningNumbers.csCounter = 0;
  }
  if (loaded.runningNumbers.capexCounter === undefined) {
    loaded.runningNumbers.capexCounter = 0;
  }
  if (loaded.purchaseRequisitions) {
    loaded.purchaseRequisitions = loaded.purchaseRequisitions.filter((p: any) => p.id !== 'PR-SAMPLE-01' && p.prNumber !== 'PR26000001');
  }
  if (loaded.purchaseOrders) {
    loaded.purchaseOrders = loaded.purchaseOrders.filter((p: any) => p.id !== 'PO-SAMPLE-01' && p.poNumber !== 'PO26000001');
  }
  if (loaded.notifications) {
    loaded.notifications = loaded.notifications.filter((n: any) => !n.title?.includes('PR26000001'));
  }
  if (!loaded.surveys) loaded.surveys = [];
  if (!loaded.deliveries) loaded.deliveries = [];
  if (!loaded.deposits) loaded.deposits = [];
  if (!loaded.cashPurchases) loaded.cashPurchases = [];
  if (!loaded.creditPurchases) loaded.creditPurchases = [];
  if (!loaded.returns) loaded.returns = [];
  if (!loaded.adjustments) loaded.adjustments = [];
  if (!loaded.landedCosts) loaded.landedCosts = [];

  fs.writeFileSync(DB_FILE, JSON.stringify(loaded, null, 2), 'utf-8');
  return loaded;
}


// ============================================================================
// Supabase Data Mappers (To/From PostgreSQL Snake Case)
// ============================================================================

function mapUserToDb(u: any) {
  return {
    id: u.id,
    employee_id: u.employeeId,
    name: u.name,
    thai_name: u.thaiName,
    email: u.email,
    role: u.role,
    department_id: u.departmentId,
    title: u.title,
    is_active: u.isActive,
    branch: u.branch,
    company: u.company,
    signature_url: u.signatureUrl
  };
}

function mapUserFromDb(row: any): User {
  return {
    id: row.id,
    employeeId: row.employee_id,
    name: row.name,
    thaiName: row.thai_name,
    email: row.email,
    role: row.role,
    departmentId: row.department_id,
    title: row.title,
    isActive: row.is_active,
    branch: row.branch,
    company: row.company,
    signatureUrl: row.signature_url
  };
}

function mapDepartmentToDb(d: any) {
  return {
    id: d.id,
    name: d.name,
    code: d.code,
    budget: d.budget,
    spent: d.spent,
    remaining: d.remaining
  };
}

function mapDepartmentFromDb(row: any): Department {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    budget: Number(row.budget || 0),
    spent: Number(row.spent || 0),
    remaining: Number(row.remaining || 0)
  };
}

function mapVendorToDb(v: any) {
  const isNumericId = /^\d+$/.test(String(v.id));
  const record: any = {
    vendor_code: v.code || v.id || `VND${Date.now()}`,
    vendor_name_en: v.name || '',
    vendor_name_th: v.name || '',
    address: v.address || '',
    telephone: v.phone || '',
    fax: v.fax || '',
    tax_id: v.taxId || '',
    contact_person: v.contactPerson || '',
    payment_term: v.creditTerm || '30 Days',
    credit_day: parseInt(v.creditTerm) || 30,
    status: 'Active'
  };
  if (isNumericId) {
    record.vendor_id = parseInt(v.id, 10);
  }
  return record;
}

function mapVendorFromDb(row: any): Vendor {
  const code = row.code || row.vendor_code || (row.vendor_id ? `VND${String(row.vendor_id).padStart(3, '0')}` : (row.id || ''));
  const id = row.id ? String(row.id) : (row.vendor_id ? String(row.vendor_id) : (code || `VND-${Date.now()}`));
  const name = row.name || row.vendor_name_en || row.vendor_name_th || 'Unknown Vendor';
  const address = row.address || '';
  const phone = row.phone || row.telephone || row.mobile || '';
  const fax = row.fax || '';
  const taxId = row.taxId || row.tax_id || '';
  const contactPerson = row.contactPerson || row.contact_person || '';
  let creditTerm = row.creditTerm || row.credit_term;
  if (!creditTerm) {
    if (row.credit_day) {
      creditTerm = `${row.credit_day} Days`;
    } else if (row.payment_term) {
      creditTerm = row.payment_term;
    } else {
      creditTerm = '30 Days';
    }
  }

  return {
    id: String(id),
    code: String(code),
    name: String(name),
    address: String(address),
    phone: String(phone),
    fax: String(fax),
    taxId: String(taxId),
    contactPerson: String(contactPerson),
    creditTerm: String(creditTerm)
  };
}

function mapWorkflowRuleToDb(w: any) {
  return {
    id: w.id,
    department_id: w.departmentId,
    amount_limit: w.amountLimit,
    require_executive_approval: w.requireExecutiveApproval,
    parallel_approval: w.parallelApproval,
    delegate_active: w.delegateActive
  };
}

function mapWorkflowRuleFromDb(row: any): WorkflowRule {
  return {
    id: row.id,
    departmentId: row.department_id,
    amountLimit: Number(row.amount_limit || 0),
    requireExecutiveApproval: row.require_executive_approval,
    parallelApproval: row.parallel_approval,
    delegateActive: row.delegate_active
  };
}

function mapPRToDb(pr: any) {
  return {
    id: pr.id,
    pr_number: pr.prNumber,
    date: pr.date,
    requestor_id: pr.requestorId,
    requestor_name: pr.requestorName,
    requestor_email: pr.requestorEmail,
    department_id: pr.departmentId,
    department_name: pr.departmentName,
    suggested_vendor_id: pr.suggestedVendorId,
    vendor_name: pr.vendorName,
    vendor_address: pr.vendorAddress,
    vendor_phone: pr.vendorPhone,
    vendor_fax: pr.vendorFax,
    vendor_tax_id: pr.vendorTaxId,
    items: pr.items,
    purchase_objective: pr.purchaseObjective,
    subtotal: pr.subtotal,
    vat: pr.vat,
    grand_total: pr.grandTotal,
    status: pr.status,
    attachments: pr.attachments,
    workflow_logs: pr.workflowLogs,
    current_step_index: pr.currentStepIndex,
    company_name: pr.companyName,
    branch_name: pr.branchName
  };
}

function resolveDepartmentName(deptId?: string, rawDeptName?: string): string {
  if (rawDeptName && rawDeptName !== 'Unknown Department' && rawDeptName !== 'undefined' && rawDeptName.trim() !== '') {
    return rawDeptName;
  }
  const id = (deptId || '').trim();
  const d = db?.departments?.find((dept: any) => dept && (dept.id === id || dept.code === id || dept.id === 'DEP' + id));
  if (d && d.name) return d.name;

  if (id === 'DEP001' || id === 'MGMT') return 'Management';
  if (id === 'DEP002' || id === 'PC&L' || id === 'PCL') return 'PC&L (Production Control & Logistics)';
  if (id === 'DEP003' || id === 'PUR' || id === 'SALES') return 'Sales / Purchasing / PE';
  if (id === 'DEP004' || id === 'HRGA' || id === 'HR/GA' || id === 'HR') return 'HR / General Affairs';
  if (id === 'DEP005' || id === 'PROD') return 'Production';
  if (id === 'DEP006' || id === 'QAQC' || id === 'QA/QC') return 'QA / QC';
  if (id === 'DEP007' || id === 'ACT') return 'Accounting';

  return 'HR / General Affairs';
}

function mapPRFromDb(row: any): PR {
  const deptId = row.department_id || row.departmentId || 'DEP004';
  const deptName = resolveDepartmentName(deptId, row.department_name || row.departmentName);
  return {
    id: row.id,
    prNumber: row.pr_number,
    date: row.date,
    requestorId: row.requestor_id,
    requestorName: row.requestor_name,
    requestorEmail: row.requestor_email,
    departmentId: deptId,
    departmentName: deptName,
    suggestedVendorId: row.suggested_vendor_id,
    vendorName: row.vendor_name,
    vendorAddress: row.vendor_address,
    vendorPhone: row.vendor_phone,
    vendorFax: row.vendor_fax,
    vendorTaxId: row.vendor_tax_id,
    items: row.items || [],
    purchaseObjective: row.purchase_objective,
    subtotal: Number(row.subtotal || 0),
    vat: Number(row.vat || 0),
    grandTotal: Number(row.grand_total || 0),
    status: row.status,
    attachments: row.attachments || [],
    workflowLogs: row.workflow_logs || [],
    currentStepIndex: row.current_step_index || 0,
    companyName: row.company_name,
    branchName: row.branch_name
  };
}

function mapPOToDb(po: any) {
  return {
    id: po.id,
    po_number: po.poNumber,
    refer_pr_id: po.referPrId,
    refer_pr_number: po.referPrNumber,
    date: po.date,
    vendor_id: po.vendorId,
    vendor_name: po.vendorName,
    vendor_address: po.vendorAddress,
    vendor_phone: po.vendorPhone,
    vendor_fax: po.vendorFax,
    vendor_tax_id: po.vendorTaxId,
    shipping_address: po.shippingAddress,
    department_id: po.departmentId,
    department_name: po.departmentName,
    credit_term: po.creditTerm,
    items: po.items,
    subtotal: po.subtotal,
    vat: po.vat,
    grand_total: po.grandTotal,
    status: po.status,
    notes: po.notes,
    attachments: po.attachments,
    workflow_logs: po.workflowLogs,
    current_step_index: po.currentStepIndex,
    company_name: po.companyName,
    branch_name: po.branchName,
    delivery_url: po.deliveryUrl,
    deposit_url: po.depositUrl
  };
}

function mapPOFromDb(row: any): PO {
  const deptId = row.department_id || row.departmentId || 'DEP004';
  const deptName = resolveDepartmentName(deptId, row.department_name || row.departmentName);
  return {
    id: row.id,
    poNumber: row.po_number,
    referPrId: row.refer_pr_id,
    referPrNumber: row.refer_pr_number,
    date: row.date,
    vendorId: row.vendor_id,
    vendorName: row.vendor_name,
    vendorAddress: row.vendor_address,
    vendorPhone: row.vendor_phone,
    vendorFax: row.vendor_fax,
    vendorTaxId: row.vendor_tax_id,
    shippingAddress: row.shipping_address,
    departmentId: deptId,
    departmentName: deptName,
    creditTerm: row.credit_term,
    items: row.items || [],
    subtotal: Number(row.subtotal || 0),
    vat: Number(row.vat || 0),
    grandTotal: Number(row.grand_total || 0),
    status: row.status,
    notes: row.notes,
    attachments: row.attachments || [],
    workflowLogs: row.workflow_logs || [],
    currentStepIndex: row.current_step_index || 0,
    companyName: row.company_name,
    branchName: row.branch_name,
    deliveryUrl: row.delivery_url,
    depositUrl: row.deposit_url
  };
}


// ============================================================================
// Supabase Data Mappers (Comparison Sheets, Capex, Notifications, logs)
// ============================================================================

function mapCSToDb(cs: any) {
  return {
    id: cs.id,
    cs_number: cs.csNumber,
    refer_pr_id: cs.referPrId,
    refer_pr_number: cs.referPrNumber,
    date: cs.date,
    requestor_id: cs.createdById || cs.requestorId || '',
    requestor_name: cs.createdByName || cs.requestorName || '',
    department_id: cs.departmentId,
    department_name: cs.departmentName,
    items: cs.items,
    status: cs.status,
    workflow_logs: cs.workflowLogs || [],
    current_step_index: cs.currentStepIndex || 0
  };
}

function mapCSFromDb(row: any): ComparisonSheet {
  return {
    id: row.id,
    csNumber: row.cs_number,
    referPrId: row.refer_pr_id,
    referPrNumber: row.refer_pr_number,
    date: row.date,
    departmentId: row.department_id,
    departmentName: row.department_name,
    items: row.items || [],
    status: row.status,
    workflowLogs: row.workflow_logs || [],
    currentStepIndex: row.current_step_index || 0,
    createdById: row.requestor_id,
    createdByName: row.requestor_name,
    createdAt: row.date,
    notes: ''
  };
}

function mapCapexToDb(cx: any) {
  return {
    id: cx.id,
    capex_number: cx.capexNumber,
    date: cx.date,
    project_name: cx.projectName,
    asset_group: cx.assetGroup,
    budget_status: cx.budgetStatus,
    payback_period: cx.paybackPeriod,
    total_investment: cx.totalInvestment,
    cost_savings_per_year: cx.costSavingsPerYear,
    npv_irr: cx.npvIrr,
    items: cx.items,
    subtotal: cx.subtotal,
    vat: cx.vat,
    grand_total: cx.grandTotal,
    status: cx.status,
    requestor_id: cx.requestorId,
    requestor_name: cx.requestorName,
    department_id: cx.departmentId,
    department_name: cx.departmentName,
    workflow_logs: cx.workflowLogs || [],
    current_step_index: cx.currentStepIndex || 0
  };
}

function mapCapexFromDb(row: any): CapexRequisition {
  return {
    id: row.id,
    capexNumber: row.capex_number,
    date: row.date,
    projectName: row.project_name,
    assetGroup: row.asset_group,
    budgetStatus: row.budget_status,
    paybackPeriod: Number(row.payback_period || 0),
    totalInvestment: Number(row.total_investment || 0),
    costSavingsPerYear: Number(row.cost_savings_per_year || 0),
    npvIrr: row.npv_irr,
    items: row.items || [],
    subtotal: Number(row.subtotal || 0),
    vat: Number(row.vat || 0),
    grandTotal: Number(row.grand_total || 0),
    status: row.status,
    requestorId: row.requestor_id,
    requestorName: row.requestor_name,
    requestorEmail: row.requestor_email || '',
    departmentId: row.department_id,
    departmentName: row.department_name,
    workflowLogs: row.workflow_logs || [],
    currentStepIndex: row.current_step_index || 0,
    purchaseObjective: row.purchase_objective || '',
    attachments: row.attachments || [],
    companyName: row.company_name || '',
    branchName: row.branch_name || ''
  };
}

function mapNotificationToDb(n: any) {
  return {
    id: n.id,
    recipient_email: n.recipientEmail,
    recipient_name: n.recipientName,
    title: n.title,
    message: n.message,
    channel: n.channel,
    timestamp: n.timestamp,
    is_read: n.isRead,
    status: n.status
  };
}

function mapNotificationFromDb(row: any): NotificationLog {
  return {
    id: row.id,
    recipientEmail: row.recipient_email,
    recipientName: row.recipient_name,
    title: row.title,
    message: row.message,
    channel: row.channel,
    timestamp: row.timestamp,
    isRead: row.is_read,
    status: row.status
  };
}

function mapAuditLogToDb(a: any) {
  return {
    id: a.id,
    timestamp: a.timestamp,
    user_id: a.userId,
    user_name: a.userName,
    user_role: a.userRole,
    action: a.action,
    module: a.module,
    details: a.details,
    ip_address: a.ipAddress,
    user_agent: a.userAgent
  };
}

function mapAuditLogFromDb(row: any): AuditLog {
  return {
    id: row.id,
    timestamp: row.timestamp,
    userId: row.user_id,
    userName: row.user_name,
    userRole: row.user_role,
    action: row.action,
    module: row.module,
    details: row.details,
    ipAddress: row.ip_address,
    userAgent: row.user_agent
  };
}

function mapRunningNumbersToDb(rn: any) {
  return {
    id: 'main',
    year: rn.year,
    pr_counter: rn.prCounter,
    po_counter: rn.poCounter,
    cs_counter: rn.csCounter,
    capex_counter: rn.capexCounter || 0
  };
}

function mapRunningNumbersFromDb(row: any) {
  return {
    year: row.year,
    prCounter: row.pr_counter || 0,
    poCounter: row.po_counter || 0,
    csCounter: row.cs_counter || 0,
    capexCounter: row.capex_counter || 0
  };
}

// ============================================================================
// Supabase Read/Write Real-time Synchronization Engines
// ============================================================================

async function saveToSupabase(localDb: DatabaseSchema) {
  try {
    console.log('[Supabase Sync] Saving running numbers...');
    await supabase.from('running_numbers').upsert(mapRunningNumbersToDb(localDb.runningNumbers));

    console.log('[Supabase Sync] Syncing users...');
    if (localDb.users && localDb.users.length > 0) {
      await supabase.from('users').upsert(localDb.users.map(mapUserToDb));
    }

    console.log('[Supabase Sync] Syncing departments...');
    if (localDb.departments && localDb.departments.length > 0) {
      await supabase.from('departments').upsert(localDb.departments.map(mapDepartmentToDb));
    }

    console.log('[Supabase Sync] Syncing vendors...');
    if (localDb.vendors && localDb.vendors.length > 0) {
      await supabase.from('vendors').upsert(localDb.vendors.map(mapVendorToDb));
    }

    console.log('[Supabase Sync] Syncing workflow rules...');
    if (localDb.workflowRules && localDb.workflowRules.length > 0) {
      await supabase.from('workflow_rules').upsert(localDb.workflowRules.map(mapWorkflowRuleToDb));
    }

    console.log('[Supabase Sync] Syncing PRs...');
    if (localDb.purchaseRequisitions && localDb.purchaseRequisitions.length > 0) {
      await supabase.from('purchase_requisitions').upsert(localDb.purchaseRequisitions.map(mapPRToDb));
    }

    console.log('[Supabase Sync] Syncing POs...');
    if (localDb.purchaseOrders && localDb.purchaseOrders.length > 0) {
      await supabase.from('purchase_orders').upsert(localDb.purchaseOrders.map(mapPOToDb));
    }

    console.log('[Supabase Sync] Syncing Comparison Sheets...');
    if (localDb.comparisonSheets && localDb.comparisonSheets.length > 0) {
      await supabase.from('comparison_sheets').upsert(localDb.comparisonSheets.map(mapCSToDb));
    }

    console.log('[Supabase Sync] Syncing CAPEX...');
    const capexList = localDb.capexRequisitions || [];
    if (capexList.length > 0) {
      await supabase.from('capex_requisitions').upsert(capexList.map(mapCapexToDb));
    }

    console.log('[Supabase Sync] Syncing notifications (last 200)...');
    if (localDb.notifications && localDb.notifications.length > 0) {
      await supabase.from('notifications').upsert(localDb.notifications.slice(0, 200).map(mapNotificationToDb));
    }

    console.log('[Supabase Sync] Syncing audit logs (last 200)...');
    if (localDb.auditLogs && localDb.auditLogs.length > 0) {
      await supabase.from('audit_logs').upsert(localDb.auditLogs.slice(0, 200).map(mapAuditLogToDb));
    }

    // Sync other modules list
    const auxiliaryModules = [
      { table: 'surveys', list: localDb.surveys },
      { table: 'deliveries', list: localDb.deliveries },
      { table: 'deposits', list: localDb.deposits },
      { table: 'cash_purchases', list: localDb.cashPurchases },
      { table: 'credit_purchases', list: localDb.creditPurchases },
      { table: 'returns', list: localDb.returns },
      { table: 'adjustments', list: localDb.adjustments },
      { table: 'landed_costs', list: localDb.landedCosts }
    ];

    for (const aux of auxiliaryModules) {
      if (aux.list && aux.list.length > 0) {
        const rows = aux.list.map((item: any) => ({
          id: item.id || `DOC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          data: item
        }));
        await supabase.from(aux.table).upsert(rows);
      }
    }

    console.log('[Supabase Sync] Synchronization with Supabase completed successfully!');
  } catch (err) {
    console.error('[Supabase Sync] Failed to synchronize state to Supabase:', err);
  }
}

function saveDB(db: DatabaseSchema) {
  // 1. Keep local database.json file as fallback/cache/backup
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write local backup DB file:', err);
  }
  
  // 2. Perform real-time upsert to Supabase
  saveToSupabase(db).catch(err => console.error('[Supabase async replicate error]:', err));
}

// Load local file cache as basic scaffold
const db = loadDB();

async function initializeSupabaseData() {
  try {
    console.log('[Supabase Init] Synchronizing data with Supabase...');

    // Purge any sample records from earlier initializations
    try {
      await supabase.from('purchase_requisitions').delete().eq('id', 'PR-SAMPLE-01');
      await supabase.from('purchase_orders').delete().eq('id', 'PO-SAMPLE-01');
    } catch (e) {
      console.warn('[Supabase Init] Purge sample query error:', e);
    }

    // 1. Sync running numbers
    const { data: runData, error: runErr } = await supabase.from('running_numbers').select('*').eq('id', 'main');
    if (runData && runData.length > 0) {
      db.runningNumbers = mapRunningNumbersFromDb(runData[0]);
      console.log('[Supabase Init] Running numbers loaded from Supabase.');
    } else {
      console.log('[Supabase Init] Initializing running numbers in Supabase...');
      await supabase.from('running_numbers').upsert(mapRunningNumbersToDb(db.runningNumbers));
    }

    // 2. Sync Users
    const { data: dbUsers, error: usersErr } = await supabase.from('users').select('*');
    if (dbUsers && dbUsers.length > 0) {
      db.users = dbUsers.map(mapUserFromDb);
      console.log(`[Supabase Init] Loaded ${db.users.length} users from Supabase.`);
    } else {
      console.log('[Supabase Init] Seeding initial master users to Supabase...');
      await supabase.from('users').upsert(db.users.map(mapUserToDb));
    }

    // 3. Sync Departments
    const { data: dbDepts, error: deptsErr } = await supabase.from('departments').select('*');
    if (dbDepts && dbDepts.length > 0) {
      db.departments = dbDepts.map(mapDepartmentFromDb);
      console.log(`[Supabase Init] Loaded ${db.departments.length} departments from Supabase.`);
    } else {
      console.log('[Supabase Init] Seeding initial departments to Supabase...');
      await supabase.from('departments').upsert(db.departments.map(mapDepartmentToDb));
    }

    // 4. Sync Vendors
    const { data: dbVendors, error: vendorsErr } = await supabase.from('vendors').select('*');
    if (dbVendors && dbVendors.length > 0) {
      db.vendors = dbVendors.map(mapVendorFromDb);
      console.log(`[Supabase Init] Loaded ${db.vendors.length} vendors from Supabase.`);
    } else {
      console.log('[Supabase Init] Seeding initial master vendors to Supabase...');
      await supabase.from('vendors').upsert(db.vendors.map(mapVendorToDb));
    }

    // 5. Sync Workflow Rules
    const { data: dbRules, error: rulesErr } = await supabase.from('workflow_rules').select('*');
    if (dbRules && dbRules.length > 0) {
      db.workflowRules = dbRules.map(mapWorkflowRuleFromDb);
      console.log(`[Supabase Init] Loaded ${db.workflowRules.length} workflow rules from Supabase.`);
    } else {
      console.log('[Supabase Init] Seeding initial workflow rules to Supabase...');
      await supabase.from('workflow_rules').upsert(db.workflowRules.map(mapWorkflowRuleToDb));
    }

    // 6. Sync PRs (100% direct Supabase data)
    const { data: dbPRs, error: prErr } = await supabase.from('purchase_requisitions').select('*');
    if (dbPRs) {
      db.purchaseRequisitions = dbPRs.map(mapPRFromDb);
      console.log(`[Supabase Init] Loaded ${db.purchaseRequisitions.length} PRs from Supabase.`);
    } else {
      db.purchaseRequisitions = [];
    }

    // 7. Sync POs (100% direct Supabase data)
    const { data: dbPOs, error: poErr } = await supabase.from('purchase_orders').select('*');
    if (dbPOs) {
      db.purchaseOrders = dbPOs.map(mapPOFromDb);
      console.log(`[Supabase Init] Loaded ${db.purchaseOrders.length} POs from Supabase.`);
    } else {
      db.purchaseOrders = [];
    }

    // 8. Sync Comparison Sheets (100% direct Supabase data)
    const { data: dbCS, error: csErr } = await supabase.from('comparison_sheets').select('*');
    if (dbCS) {
      db.comparisonSheets = dbCS.map(mapCSFromDb);
      console.log(`[Supabase Init] Loaded ${db.comparisonSheets.length} Comparison Sheets from Supabase.`);
    } else {
      db.comparisonSheets = [];
    }

    // 9. Sync CAPEX (100% direct Supabase data)
    const { data: dbCapex, error: capexErr } = await supabase.from('capex_requisitions').select('*');
    if (dbCapex) {
      db.capexRequisitions = dbCapex.map(mapCapexFromDb);
      console.log(`[Supabase Init] Loaded ${db.capexRequisitions.length} Capex Requisitions from Supabase.`);
    } else {
      db.capexRequisitions = [];
    }

    // 10. Sync Notifications (100% direct Supabase data)
    const { data: dbNotifications, error: notifErr } = await supabase.from('notifications').select('*');
    if (dbNotifications) {
      db.notifications = dbNotifications.map(mapNotificationFromDb);
      console.log(`[Supabase Init] Loaded ${db.notifications.length} notifications from Supabase.`);
    } else {
      db.notifications = [];
    }

    // 11. Sync Audit Logs (100% direct Supabase data)
    const { data: dbAudit, error: auditErr } = await supabase.from('audit_logs').select('*');
    if (dbAudit) {
      db.auditLogs = dbAudit.map(mapAuditLogFromDb);
      console.log(`[Supabase Init] Loaded ${db.auditLogs.length} audit logs from Supabase.`);
    } else {
      db.auditLogs = [];
    }

    // 12. Sync Auxiliary tables
    const auxiliaryModules = [
      { table: 'surveys', key: 'surveys' },
      { table: 'deliveries', key: 'deliveries' },
      { table: 'deposits', key: 'deposits' },
      { table: 'cash_purchases', key: 'cashPurchases' },
      { table: 'credit_purchases', key: 'creditPurchases' },
      { table: 'returns', key: 'returns' },
      { table: 'adjustments', key: 'adjustments' },
      { table: 'landed_costs', key: 'landedCosts' }
    ];

    for (const aux of auxiliaryModules) {
      const { data: dbAux, error: auxErr } = await supabase.from(aux.table).select('*');
      if (dbAux && dbAux.length > 0) {
        (db as any)[aux.key] = dbAux.map(row => row.data);
        console.log(`[Supabase Init] Loaded ${dbAux.length} records for auxiliary ${aux.table} from Supabase.`);
      } else {
        const listToSeed = (db as any)[aux.key] || [];
        if (listToSeed.length > 0) {
          const rows = listToSeed.map((item: any) => ({
            id: item.id || `DOC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            data: item
          }));
          await supabase.from(aux.table).upsert(rows);
        }
      }
    }

    // Ensure the system-wide Master Administrator is registered
    const hasAdminMaster = db.users.some(u => u.employeeId === '43210344');
    if (!hasAdminMaster) {
      const adminMasterUser: User = {
        id: 'USR_ADMINMASTER',
        employeeId: '43210344',
        name: 'adminmaster',
        thaiName: 'ผู้ดูแลระบบสูงสุด',
        email: 'adminmaster@sumino.com',
        role: UserRole.ADMINISTRATOR,
        departmentId: 'DEP001',
        title: 'Master Administrator',
        isActive: true,
        branch: 'Chonburi Branch (Head Office)',
        company: 'SUMINO AAPICO (Thailand) Company Limited'
      };
      db.users.push(adminMasterUser);
      await supabase.from('users').upsert(mapUserToDb(adminMasterUser));
    }

    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
      console.log('[Supabase Init] Local cache database synced completely from Supabase.');
    } catch (e) {
      console.error('[Supabase Init] Failed to write local cache:', e);
    }
  } catch (err) {
    console.error('[Supabase Init] Initialization failed:', err);
  }
}

// Execute Supabase Initializer
initializeSupabaseData();



// Helper to generate dynamic running numbers (PR26000002, PO26000002, etc.)
function generateNextPRNumber(): string {
  const currentYearShort = new Date().getFullYear().toString().substring(2); // '26'
  db.runningNumbers.prCounter += 1;
  const seq = db.runningNumbers.prCounter.toString().padStart(6, '0');
  saveDB(db);
  return `PR${currentYearShort}${seq}`;
}

function generateNextPONumber(): string {
  const currentYearShort = new Date().getFullYear().toString().substring(2); // '26'
  db.runningNumbers.poCounter += 1;
  const seq = db.runningNumbers.poCounter.toString().padStart(6, '0');
  saveDB(db);
  return `PO${currentYearShort}${seq}`;
}

function generateNextCSNumber(): string {
  const currentYearShort = new Date().getFullYear().toString().substring(2); // '26'
  db.runningNumbers.csCounter += 1;
  const seq = db.runningNumbers.csCounter.toString().padStart(6, '0');
  saveDB(db);
  return `CS${currentYearShort}${seq}`;
}

// Log actions in Audit Trail
function logAudit(userId: string, userName: string, role: UserRole, action: string, module: 'PR' | 'PO' | 'AUTH' | 'WORKFLOW' | 'SYSTEM' | 'COMPARISON', details: string, req: express.Request) {
  const audit: AuditLog = {
    id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    userId,
    userName,
    userRole: role,
    action,
    module,
    details,
    ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
    userAgent: req.headers['user-agent'] || 'Unknown Browser'
  };
  db.auditLogs.unshift(audit);
  saveDB(db);
}

// Trigger Simulated Multi-Channel Notification logs
function triggerNotifications(recipient: User, title: string, message: string) {
  const channels: ('EMAIL' | 'LINE' | 'TEAMS' | 'WEB')[] = ['EMAIL', 'LINE', 'WEB'];
  channels.forEach(channel => {
    const notifyLog: NotificationLog = {
      id: `NOT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      recipientEmail: recipient.email,
      recipientName: recipient.name,
      title,
      message,
      channel,
      timestamp: new Date().toISOString(),
      isRead: false,
      status: 'SENT'
    };
    db.notifications.unshift(notifyLog);
  });
  saveDB(db);
}

// REST API ROUTING
// 1. Auth Endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, employeeId } = req.body;
  let user;
  if (employeeId) {
    user = db.users.find(u => u.employeeId.toUpperCase() === employeeId.toUpperCase());
  } else if (email) {
    user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }
  if (!user) {
    return res.status(401).json({ message: 'User not found. Please check your credentials.' });
  }
  logAudit(user.id, user.name, user.role, 'LOGIN_SUCCESS', 'AUTH', `User logged in successfully under title: ${user.title}`, req);
  res.json({ user });
});

app.get('/api/auth/users', (req, res) => {
  res.json(db.users);
});

app.post('/api/auth/users', (req, res) => {
  const {
    employeeId,
    name,
    thaiName,
    email,
    role,
    departmentId,
    title,
    branch,
    company,
    isActive,
    signatureUrl
  } = req.body;

  if (!name || !email || !employeeId) {
    return res.status(400).json({ message: 'Missing required user fields: name, email, employeeId' });
  }

  // Check duplicate employee ID or email
  const existingEmployee = db.users.find(
    u => u.employeeId.toUpperCase() === employeeId.toUpperCase() || u.email.toLowerCase() === email.toLowerCase()
  );
  if (existingEmployee) {
    return res.status(400).json({ message: 'รหัสพนักงาน หรือ อีเมลนี้มีอยู่ในระบบเรียบร้อยแล้ว (Employee ID or email already exists)' });
  }

  const userId = `USR_${Date.now()}`;
  const newUser: User = {
    id: userId,
    employeeId,
    name,
    thaiName: thaiName || name,
    email,
    role: role || UserRole.EMPLOYEE,
    departmentId: departmentId || 'DEP-ENG',
    title: title || 'Staff',
    isActive: isActive !== undefined ? isActive : true,
    branch: branch || 'Chonburi Branch (Head Office)',
    company: company || 'SUMINO AAPICO (Thailand) Company Limited',
    signatureUrl: signatureUrl || ''
  };

  db.users.push(newUser);
  saveDB(db);

  logAudit(userId, name, newUser.role, 'CREATE_USER', 'AUTH', `Created new employee user: ${name} (${employeeId})`, req);
  res.status(201).json({ user: newUser });
});

app.put('/api/auth/users/:id', (req, res) => {
  const { id } = req.params;
  const { employeeId, name, thaiName, email, role, departmentId, title, branch, company, isActive, signatureUrl } = req.body;
  const userIdx = db.users.findIndex(u => u.id === id);
  if (userIdx === -1) {
    return res.status(404).json({ message: 'User not found' });
  }

  db.users[userIdx] = {
    ...db.users[userIdx],
    employeeId: employeeId || db.users[userIdx].employeeId,
    name: name || db.users[userIdx].name,
    thaiName: thaiName !== undefined ? thaiName : db.users[userIdx].thaiName,
    email: email || db.users[userIdx].email,
    role: role || db.users[userIdx].role,
    departmentId: departmentId || db.users[userIdx].departmentId,
    title: title || db.users[userIdx].title,
    branch: branch || db.users[userIdx].branch,
    company: company || db.users[userIdx].company,
    isActive: isActive !== undefined ? isActive : db.users[userIdx].isActive,
    signatureUrl: signatureUrl !== undefined ? signatureUrl : db.users[userIdx].signatureUrl
  };

  saveDB(db);
  logAudit(id, db.users[userIdx].name, db.users[userIdx].role, 'UPDATE_USER', 'AUTH', `Updated employee user details: ${db.users[userIdx].name}`, req);
  res.json({ user: db.users[userIdx] });
});

// 2. Department routes
app.get('/api/departments', (req, res) => {
  res.json(db.departments);
});

// 3. Vendors routes
app.get('/api/vendors', (req, res) => {
  res.json(db.vendors);
});

app.post('/api/vendors', async (req, res) => {
  try {
    const { name, address, phone, fax, taxId, contactPerson, creditTerm } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Vendor name is required' });
    }
    const vendorList = Array.isArray(db.vendors) ? db.vendors : [];
    let maxNum = 0;
    for (const v of vendorList) {
      if (v && (v.id || v.code)) {
        const idStr = String(v.code || v.id);
        const match = idStr.match(/\d+/);
        if (match) {
          const num = parseInt(match[0], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
    }
    const vendorCode = `VND${(maxNum + 1).toString().padStart(3, '0')}`;
    const newVendor: Vendor = {
      id: vendorCode,
      code: vendorCode,
      name: name.trim(),
      address: address ? String(address).trim() : '',
      phone: phone ? String(phone).trim() : '',
      fax: fax ? String(fax).trim() : '',
      taxId: taxId ? String(taxId).trim() : '',
      contactPerson: contactPerson ? String(contactPerson).trim() : '',
      creditTerm: creditTerm ? String(creditTerm).trim() : '30 Days'
    };
    if (!db.vendors) {
      db.vendors = [];
    }
    db.vendors.push(newVendor);
    saveDB(db);

    try {
      const dbRow = mapVendorToDb(newVendor);
      delete dbRow.vendor_id;
      const { data, error } = await supabase.from('vendors').insert(dbRow).select();
      if (data && data[0]) {
        const createdFromSupa = mapVendorFromDb(data[0]);
        newVendor.id = createdFromSupa.id;
      }
    } catch (sErr) {
      console.warn('[Supabase Direct Vendor Insert] Note:', sErr);
    }

    return res.json(newVendor);
  } catch (err: any) {
    console.error('Error creating vendor:', err);
    return res.status(500).json({ error: err?.message || 'Failed to register vendor' });
  }
});

// 4. PR Routes
app.get('/api/pr', (req, res) => {
  res.json(db.purchaseRequisitions);
});

app.get('/api/pr/:id', (req, res) => {
  const pr = db.purchaseRequisitions.find(p => p.id === req.params.id);
  if (!pr) return res.status(404).json({ message: 'PR not found' });
  res.json(pr);
});

app.post('/api/pr', (req, res) => {
  try {
    const {
      requestorId,
      suggestedVendorId,
      items,
      purchaseObjective,
      attachments,
      companyName,
      branchName
    } = req.body;

    let requestor = db.users?.find(u => u && u.id === requestorId);
    if (!requestor) {
      requestor = (db.users && db.users[0]) || {
        id: requestorId || 'USR001',
        employeeId: 'EMP001',
        name: 'Employee',
        email: 'employee@sumino.co.th',
        role: UserRole.EMPLOYEE,
        departmentId: 'DEP002',
        title: 'Staff',
        isActive: true,
        company: 'SUMINO AAPICO (Thailand) Co., LTD.',
        branch: 'Chonburi'
      };
    }

    const targetDeptId = req.body.departmentId || req.body.department_id || requestor.departmentId || 'DEP004';
    const deptName = resolveDepartmentName(targetDeptId, req.body.departmentName || requestor.departmentName);

    const vendorList = Array.isArray(db.vendors) ? db.vendors : [];
    let vendor = vendorList.find(v => v && (v.id === suggestedVendorId || v.code === suggestedVendorId));
    if (!vendor) {
      vendor = vendorList.find(v => v && v.name && v.name.toLowerCase() === String(suggestedVendorId).toLowerCase());
    }
    if (!vendor) {
      vendor = {
        id: suggestedVendorId || `VND-${Date.now()}`,
        code: suggestedVendorId || 'VND-UNKNOWN',
        name: 'General Vendor',
        address: '-',
        phone: '-',
        fax: '',
        taxId: '-',
        contactPerson: '',
        creditTerm: '30 Days'
      };
    }

    const safeItems = Array.isArray(items) ? items : [];
    const subtotal = safeItems.reduce((sum: number, item: any) => {
      const q = parseFloat(item?.qty) || 0;
      const p = parseFloat(item?.unitPrice) || 0;
      return sum + (q * p);
    }, 0);
    const vat = subtotal * 0.07;
    const grandTotal = subtotal + vat;

    const prNumber = generateNextPRNumber();

    // Initial workflow log
    const initialLog: WorkflowLog = {
      id: `WFL-${Date.now()}-00`,
      action: 'CREATED',
      stepName: 'Draft Created',
      performedBy: requestor.id,
      userName: requestor.name,
      userRole: requestor.role,
      comment: 'Purchase requisition raised in system.',
      timestamp: new Date().toISOString()
    };

    const newPR: PR = {
      id: `PR-${Date.now()}`,
      prNumber,
      date: new Date().toISOString().split('T')[0],
      requestorId: requestor.id,
      requestorName: requestor.name,
      requestorEmail: requestor.email,
      departmentId: requestor.departmentId,
      departmentName: deptName,
      suggestedVendorId: vendor.id,
      vendorName: vendor.name,
      vendorAddress: vendor.address || '-',
      vendorPhone: vendor.phone || '-',
      vendorFax: vendor.fax || '',
      vendorTaxId: vendor.taxId || '-',
      items: safeItems.map((item: any, idx: number) => {
        const qty = parseFloat(item?.qty) || 1;
        const unitPrice = parseFloat(item?.unitPrice) || 0;
        return {
          id: `PRI-${Date.now()}-${idx}`,
          itemNo: idx + 1,
          partNo: item?.partNo || '',
          description: item?.description || 'Item',
          specification: item?.specification || '',
          unit: item?.unit || 'PCS',
          qty,
          unitPrice,
          total: qty * unitPrice
        };
      }),
      purchaseObjective: purchaseObjective || '-',
      subtotal,
      vat,
      grandTotal,
      status: PRStatus.DRAFT,
      attachments: attachments || [],
      workflowLogs: [initialLog],
      currentStepIndex: 0,
      companyName: companyName || 'SUMINO AAPICO (Thailand) Company Limited',
      branchName: branchName || 'Chonburi Branch (Head Office)'
    };

    if (!db.purchaseRequisitions) {
      db.purchaseRequisitions = [];
    }
    db.purchaseRequisitions.push(newPR);
    saveDB(db);

    logAudit(requestor.id, requestor.name, requestor.role, 'CREATE_PR', 'PR', `Created PR ${prNumber} with Grand Total: ${grandTotal.toLocaleString()} THB`, req);
    return res.json(newPR);
  } catch (err: any) {
    console.error('Error creating PR:', err);
    return res.status(500).json({ message: err?.message || 'Failed to create PR' });
  }
});

// Update or Submit PR
app.put('/api/pr/:id', (req, res) => {
  const { id } = req.params;
  const { items, purchaseObjective, status, suggestedVendorId, attachments, signatureData, companyStampData, geoCoordinates } = req.body;
  const prIdx = db.purchaseRequisitions.findIndex(p => p.id === id);
  if (prIdx === -1) return res.status(404).json({ message: 'PR not found' });

  const currentPR = db.purchaseRequisitions[prIdx];
  const vendor = suggestedVendorId ? db.vendors.find(v => v.id === suggestedVendorId) : null;

  let finalSubtotal = currentPR.subtotal;
  let finalVat = currentPR.vat;
  let finalGrandTotal = currentPR.grandTotal;

  if (items && items.length > 0) {
    finalSubtotal = items.reduce((sum: number, item: any) => sum + (parseFloat(item.qty) * parseFloat(item.unitPrice)), 0);
    finalVat = finalSubtotal * 0.07;
    finalGrandTotal = finalSubtotal + finalVat;
  }

  const updatedPR: PR = {
    ...currentPR,
    purchaseObjective: purchaseObjective || currentPR.purchaseObjective,
    suggestedVendorId: vendor ? vendor.id : currentPR.suggestedVendorId,
    vendorName: vendor ? vendor.name : currentPR.vendorName,
    vendorAddress: vendor ? vendor.address : currentPR.vendorAddress,
    vendorPhone: vendor ? vendor.phone : currentPR.vendorPhone,
    vendorFax: vendor ? vendor.fax : currentPR.vendorFax,
    vendorTaxId: vendor ? vendor.taxId : currentPR.vendorTaxId,
    items: items ? items.map((item: any, idx: number) => ({
      id: item.id || `PRI-${Date.now()}-${idx}`,
      itemNo: idx + 1,
      partNo: item.partNo || '',
      description: item.description,
      specification: item.specification || '',
      unit: item.unit || 'PCS',
      qty: parseFloat(item.qty),
      unitPrice: parseFloat(item.unitPrice),
      total: parseFloat(item.qty) * parseFloat(item.unitPrice)
    })) : currentPR.items,
    subtotal: finalSubtotal,
    vat: finalVat,
    grandTotal: finalGrandTotal,
    status: status || currentPR.status,
    attachments: attachments || currentPR.attachments
  };

  // If status is transitioning to PENDING_DEPT_MGR, notify manager
  if (status === PRStatus.PENDING_DEPT_MGR && currentPR.status !== PRStatus.PENDING_DEPT_MGR) {
    const submitter = db.users.find(u => u.id === currentPR.requestorId);
    
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const ua = req.headers['user-agent'] || 'Unknown Browser';
    const digitalHash = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // Add Workflow Log
    const signature = (signatureData || submitter?.signatureUrl) ? {
      signedBy: submitter?.name || currentPR.requestorName,
      role: submitter?.role || UserRole.EMPLOYEE,
      title: submitter?.title || 'Requestor',
      timestamp: new Date().toISOString(),
      ipAddress: ip,
      userAgent: ua,
      browser: 'Web App',
      device: 'Desktop',
      signatureData: signatureData || submitter?.signatureUrl || '',
      companyStampData: companyStampData || undefined,
      geoCoordinates: geoCoordinates || undefined,
      digitalHash: digitalHash
    } : undefined;

    updatedPR.workflowLogs.push({
      id: `WFL-${Date.now()}`,
      action: 'SUBMITTED',
      stepName: 'Pending Manager Approval',
      performedBy: currentPR.requestorId,
      userName: currentPR.requestorName,
      userRole: UserRole.EMPLOYEE,
      comment: 'PR submitted for department manager review.',
      timestamp: new Date().toISOString(),
      signature
    });

    // Notify Department Manager
    const manager = db.users.find(u => u.role === UserRole.DEPARTMENT_MANAGER && (u.departmentId === currentPR.departmentId || ((currentPR.departmentId === 'Administration' || currentPR.departmentId === 'HR / General Affairs' || currentPR.departmentName?.includes('HR')) && u.departmentId === 'DEP004')));
    if (manager) {
      const prRef = currentPR.prNumber || `Draft ${currentPR.id.substring(3, 11)}`;
      triggerNotifications(manager, `New PR Submission: ${prRef}`, `Purchase request ${prRef} by ${currentPR.requestorName} is waiting for your digital signature and approval.`);
    }
  }

  db.purchaseRequisitions[prIdx] = updatedPR;
  saveDB(db);

  logAudit(currentPR.requestorId, currentPR.requestorName, UserRole.EMPLOYEE, 'UPDATE_PR', 'PR', `Submitted/Updated PR ${currentPR.prNumber} to status ${status}`, req);
  res.json(updatedPR);
});

// DELETE endpoints for PR, PO, CAPEX, and Comparison Sheets
app.delete('/api/pr/:id', async (req, res) => {
  const { id } = req.params;
  const prIdx = db.purchaseRequisitions.findIndex(p => p.id === id || p.prNumber === id);
  let deletedPRNumber = id;

  if (prIdx !== -1) {
    deletedPRNumber = db.purchaseRequisitions[prIdx].prNumber || id;
    db.purchaseRequisitions.splice(prIdx, 1);
    saveDB(db);
  }
  
  try {
    const { error } = await supabase.from('purchase_requisitions').delete().or(`id.eq.${id},pr_number.eq.${id}`);
    if (error) console.error('[Supabase Delete PR] error:', error);
  } catch (err) {
    console.error('[Supabase Delete PR] Exception:', err);
  }
  
  logAudit('SYSTEM', 'Admin Action', UserRole.ADMINISTRATOR, 'DELETE_PR', 'PR', `Deleted PR ${deletedPRNumber}`, req);
  res.json({ success: true, message: 'PR deleted successfully' });
});

app.delete('/api/po/:id', async (req, res) => {
  const { id } = req.params;
  const poIdx = db.purchaseOrders.findIndex(p => p.id === id || p.poNumber === id);
  let deletedPONumber = id;

  if (poIdx !== -1) {
    deletedPONumber = db.purchaseOrders[poIdx].poNumber || id;
    db.purchaseOrders.splice(poIdx, 1);
    saveDB(db);
  }
  
  try {
    const { error } = await supabase.from('purchase_orders').delete().or(`id.eq.${id},po_number.eq.${id}`);
    if (error) console.error('[Supabase Delete PO] error:', error);
  } catch (err) {
    console.error('[Supabase Delete PO] Exception:', err);
  }
  
  logAudit('SYSTEM', 'Admin Action', UserRole.ADMINISTRATOR, 'DELETE_PO', 'PO', `Deleted PO ${deletedPONumber}`, req);
  res.json({ success: true, message: 'PO deleted successfully' });
});

app.delete('/api/capex/:id', async (req, res) => {
  const { id } = req.params;
  const capexIdx = db.capexRequisitions.findIndex(c => c.id === id || c.capexNumber === id);
  let deletedCAPEXNumber = id;

  if (capexIdx !== -1) {
    deletedCAPEXNumber = db.capexRequisitions[capexIdx].capexNumber || id;
    db.capexRequisitions.splice(capexIdx, 1);
    saveDB(db);
  }
  
  try {
    const { error } = await supabase.from('capex_requisitions').delete().or(`id.eq.${id},capex_number.eq.${id}`);
    if (error) console.error('[Supabase Delete CAPEX] error:', error);
  } catch (err) {
    console.error('[Supabase Delete CAPEX] Exception:', err);
  }
  
  logAudit('SYSTEM', 'Admin Action', UserRole.ADMINISTRATOR, 'DELETE_CAPEX', 'SYSTEM', `Deleted CAPEX ${deletedCAPEXNumber}`, req);
  res.json({ success: true, message: 'CAPEX deleted successfully' });
});

app.delete('/api/comparison/:id', async (req, res) => {
  const { id } = req.params;
  const csIdx = db.comparisonSheets.findIndex(c => c.id === id || c.csNumber === id);
  let deletedCSNumber = id;

  if (csIdx !== -1) {
    deletedCSNumber = db.comparisonSheets[csIdx].csNumber || id;
    db.comparisonSheets.splice(csIdx, 1);
    saveDB(db);
  }
  
  try {
    const { error } = await supabase.from('comparison_sheets').delete().or(`id.eq.${id},cs_number.eq.${id}`);
    if (error) console.error('[Supabase Delete CS] error:', error);
  } catch (err) {
    console.error('[Supabase Delete CS] Exception:', err);
  }
  
  logAudit('SYSTEM', 'Admin Action', UserRole.ADMINISTRATOR, 'DELETE_CS', 'COMPARISON', `Deleted Comparison Sheet ${deletedCSNumber}`, req);
  res.json({ success: true, message: 'Comparison Sheet deleted successfully' });
});

// PR Approve / Reject with Signature
app.post('/api/pr/:id/approve', (req, res) => {
  const { id } = req.params;
  const { userId, comment, signatureData, companyStampData, geoCoordinates, isReject } = req.body;

  const prIdx = db.purchaseRequisitions.findIndex(p => p.id === id);
  if (prIdx === -1) return res.status(404).json({ message: 'PR not found' });

  const currentPR = db.purchaseRequisitions[prIdx];
  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(400).json({ message: 'User not found' });

  // Browser meta
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const ua = req.headers['user-agent'] || 'Unknown Browser';
  const digitalHash = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  const sig: SignatureDetails = {
    signedBy: user.name,
    role: user.role,
    title: user.title,
    timestamp: new Date().toISOString(),
    ipAddress: ip,
    userAgent: ua,
    browser: 'Web Browser',
    device: 'Web Client Device',
    geoCoordinates,
    signatureData,
    companyStampData: companyStampData || (
      (!isReject && (user.role === UserRole.EXECUTIVE || user.role === UserRole.DEPARTMENT_MANAGER || user.role === UserRole.PURCHASING_MANAGER || user.role === UserRole.ASSISTANT_MANAGER || user.role === UserRole.PURCHASING))
        ? 'https://lh3.googleusercontent.com/d/1mMCAyix03zAA2BCquyONnZXRaxTxhAgu'
        : undefined
    ),
    digitalHash
  };

  if (isReject) {
    currentPR.status = PRStatus.REJECTED;
    currentPR.workflowLogs.push({
      id: `WFL-${Date.now()}`,
      action: 'REJECTED',
      stepName: (user.role === UserRole.DEPARTMENT_MANAGER || user.role === UserRole.PURCHASING_MANAGER) ? 'Department Manager Approval' : 'Executive Approval',
      performedBy: user.id,
      userName: user.name,
      userRole: user.role,
      comment: comment || 'Rejected without comment.',
      timestamp: new Date().toISOString(),
      signature: sig
    });

    // Notify submitter
    const requester = db.users.find(u => u.id === currentPR.requestorId);
    if (requester) {
      triggerNotifications(requester, `PR Rejected: ${currentPR.prNumber}`, `Your purchase request ${currentPR.prNumber} was rejected by ${user.name}. Reason: ${comment}`);
    }

    db.purchaseRequisitions[prIdx] = currentPR;
    saveDB(db);
    logAudit(user.id, user.name, user.role, 'REJECT_PR', 'WORKFLOW', `Rejected PR ${currentPR.prNumber}`, req);
    return res.json(currentPR);
  }

  // Approval Process Flow based on current PR status
  if (currentPR.status === PRStatus.PENDING_DEPT_MGR) {
    const limitRule = db.workflowRules.find(r => r.departmentId === 'ALL' || r.departmentId === currentPR.departmentId);
    const limit = limitRule ? limitRule.amountLimit : 100000;

    currentPR.workflowLogs.push({
      id: `WFL-${Date.now()}`,
      action: 'APPROVED',
      stepName: 'Department Manager Approval',
      performedBy: user.id,
      userName: user.name,
      userRole: user.role,
      comment: comment || 'Approved by Manager.',
      timestamp: new Date().toISOString(),
      signature: sig
    });

    currentPR.status = PRStatus.PENDING_EXECUTIVE;
    const execs = db.users.filter(u => u.role === UserRole.EXECUTIVE);
    for (const exec of execs) {
      triggerNotifications(exec, `Pending Management PR Approval: ${currentPR.prNumber}`, `PR ${currentPR.prNumber} by ${currentPR.requestorName} requires Management E-Sign (Mr. Liu Dong / Mr. Yoshiyuki Konishi).`);
    }
  } else if (currentPR.status === PRStatus.PENDING_EXECUTIVE) {
    currentPR.status = PRStatus.PENDING_PURCHASING;
    currentPR.workflowLogs.push({
      id: `WFL-${Date.now()}`,
      action: 'APPROVED',
      stepName: 'Executive Approval',
      performedBy: user.id,
      userName: user.name,
      userRole: user.role,
      comment: comment || 'Approved by Executive Plant Manager.',
      timestamp: new Date().toISOString(),
      signature: sig
    });

    const pur = db.users.find(u => u.role === UserRole.PURCHASING);
    if (pur) {
      triggerNotifications(pur, `PR Approved & Pending Purchasing Check: ${currentPR.prNumber}`, `PR ${currentPR.prNumber} (Executive approved) requires Purchasing 'Check By' signature before PO.`);
    }
  } else if (currentPR.status === PRStatus.PENDING_PURCHASING) {
    currentPR.status = PRStatus.APPROVED;
    currentPR.workflowLogs.push({
      id: `WFL-${Date.now()}`,
      action: 'APPROVED',
      stepName: 'Purchasing Check',
      performedBy: user.id,
      userName: user.name,
      userRole: user.role,
      comment: comment || 'Checked and validated by Purchasing.',
      timestamp: new Date().toISOString(),
      signature: sig
    });
    
    const requester = db.users.find(u => u.id === currentPR.requestorId);
    if (requester) {
      triggerNotifications(requester, `PR Fully Checked & Ready: ${currentPR.prNumber}`, `Your PR ${currentPR.prNumber} has been checked by Purchasing and is now ready for PO processing.`);
    }
  }

  db.purchaseRequisitions[prIdx] = currentPR;
  saveDB(db);
  logAudit(user.id, user.name, user.role, 'APPROVE_PR', 'WORKFLOW', `Approved PR ${currentPR.prNumber}`, req);
  res.json(currentPR);
});

// 4.5 CAPEX Requisition Routes
app.get('/api/capex', (req, res) => {
  res.json(db.capexRequisitions || []);
});

app.get('/api/capex/:id', (req, res) => {
  const capexList = db.capexRequisitions || [];
  const cx = capexList.find(c => c.id === req.params.id);
  if (!cx) return res.status(404).json({ message: 'CAPEX Requisition not found' });
  res.json(cx);
});

app.post('/api/capex', (req, res) => {
  const {
    userId,
    assetGroup,
    projectName,
    budgetStatus,
    totalInvestment,
    paybackPeriod,
    costSavingsPerYear,
    npvIrr,
    items,
    purchaseObjective,
    companyName,
    branchName
  } = req.body;

  const requestor = db.users.find(u => u.id === userId);
  if (!requestor) return res.status(400).json({ message: 'User not found' });

  const dept = db.departments.find(d => d.id === requestor.departmentId);
  const deptName = dept ? dept.name : 'Unknown Department';

  // Increment counter
  if (db.runningNumbers.capexCounter === undefined) {
    db.runningNumbers.capexCounter = 0;
  }
  db.runningNumbers.capexCounter += 1;
  const yearSuffix = String(db.runningNumbers.year).substring(2, 4);
  const capexNumber = `CP${yearSuffix}${String(db.runningNumbers.capexCounter).padStart(6, '0')}`;

  const subtotal = items.reduce((sum: number, item: any) => sum + (parseFloat(item.qty) * parseFloat(item.unitPrice)), 0);
  const vat = subtotal * 0.07;
  const grandTotal = subtotal + vat;

  // Add initial log
  const initialLog: WorkflowLog = {
    id: `WFL-${Date.now()}`,
    action: 'CREATED',
    stepName: 'Draft Requisition',
    performedBy: requestor.id,
    userName: requestor.thaiName || requestor.name,
    userRole: requestor.role,
    comment: 'CAPEX Capital Expenditure Requisition draft saved.',
    timestamp: new Date().toISOString()
  };

  const newCapex: CapexRequisition = {
    id: `CPX-${Date.now()}`,
    capexNumber,
    date: new Date().toISOString().split('T')[0],
    requestorId: requestor.id,
    requestorName: requestor.thaiName || requestor.name,
    requestorEmail: requestor.email,
    departmentId: requestor.departmentId,
    departmentName: deptName,
    assetGroup: assetGroup || 'Machinery & Equipment',
    projectName: projectName || 'Line Expansion Asset Acquisition',
    budgetStatus: budgetStatus || 'WITHIN_BUDGET',
    totalInvestment: parseFloat(totalInvestment) || grandTotal,
    paybackPeriod: parseFloat(paybackPeriod) || 0,
    costSavingsPerYear: parseFloat(costSavingsPerYear) || 0,
    npvIrr: npvIrr || '',
    items: items.map((item: any, idx: number) => ({
      id: `CXI-${Date.now()}-${idx}`,
      itemNo: idx + 1,
      partNo: item.partNo || '',
      description: item.description,
      specification: item.specification || '',
      unit: item.unit || 'PCS',
      qty: parseFloat(item.qty),
      unitPrice: parseFloat(item.unitPrice),
      total: parseFloat(item.qty) * parseFloat(item.unitPrice)
    })),
    purchaseObjective: purchaseObjective || '',
    subtotal,
    vat,
    grandTotal,
    status: CapexStatus.DRAFT,
    attachments: [],
    workflowLogs: [initialLog],
    currentStepIndex: 0,
    companyName: companyName || 'SUMINO AAPICO (Thailand) Company Limited',
    branchName: branchName || 'Chonburi Branch (Head Office)'
  };

  if (!db.capexRequisitions) db.capexRequisitions = [];
  db.capexRequisitions.push(newCapex);
  saveDB(db);

  logAudit(requestor.id, requestor.name, requestor.role, 'CREATE_CAPEX', 'PR', `Created CAPEX ${capexNumber} with total: ${grandTotal.toLocaleString()} THB`, req);
  res.json(newCapex);
});

app.put('/api/capex/:id', (req, res) => {
  const { id } = req.params;
  const {
    items,
    purchaseObjective,
    status,
    assetGroup,
    projectName,
    budgetStatus,
    totalInvestment,
    paybackPeriod,
    costSavingsPerYear,
    npvIrr
  } = req.body;

  if (!db.capexRequisitions) db.capexRequisitions = [];
  const idx = db.capexRequisitions.findIndex(c => c.id === id);
  if (idx === -1) return res.status(404).json({ message: 'CAPEX not found' });

  const currentCx = db.capexRequisitions[idx];

  let subtotal = currentCx.subtotal;
  let vat = currentCx.vat;
  let grandTotal = currentCx.grandTotal;

  if (items && items.length > 0) {
    subtotal = items.reduce((sum: number, item: any) => sum + (parseFloat(item.qty) * parseFloat(item.unitPrice)), 0);
    vat = subtotal * 0.07;
    grandTotal = subtotal + vat;
  }

  const updatedCx: CapexRequisition = {
    ...currentCx,
    projectName: projectName || currentCx.projectName,
    assetGroup: assetGroup || currentCx.assetGroup,
    budgetStatus: budgetStatus || currentCx.budgetStatus,
    totalInvestment: parseFloat(totalInvestment) || currentCx.totalInvestment,
    paybackPeriod: parseFloat(paybackPeriod) || currentCx.paybackPeriod,
    costSavingsPerYear: parseFloat(costSavingsPerYear) || currentCx.costSavingsPerYear,
    npvIrr: npvIrr || currentCx.npvIrr,
    purchaseObjective: purchaseObjective || currentCx.purchaseObjective,
    items: items ? items.map((item: any, i: number) => ({
      id: item.id || `CXI-${Date.now()}-${i}`,
      itemNo: i + 1,
      partNo: item.partNo || '',
      description: item.description,
      specification: item.specification || '',
      unit: item.unit || 'PCS',
      qty: parseFloat(item.qty),
      unitPrice: parseFloat(item.unitPrice),
      total: parseFloat(item.qty) * parseFloat(item.unitPrice)
    })) : currentCx.items,
    subtotal,
    vat,
    grandTotal,
    status: status || currentCx.status
  };

  if (status === CapexStatus.PENDING_DEPT_MGR && currentCx.status !== CapexStatus.PENDING_DEPT_MGR) {
    const submitter = db.users.find(u => u.id === currentCx.requestorId);
    const signature = submitter?.signatureUrl ? {
      signedBy: submitter.name,
      role: submitter.role,
      title: submitter.title,
      timestamp: new Date().toISOString(),
      ipAddress: '127.0.0.1',
      userAgent: 'Agent',
      browser: 'Web App',
      device: 'Desktop',
      signatureData: submitter.signatureUrl,
      digitalHash: Math.random().toString(36).substring(7)
    } : undefined;

    updatedCx.workflowLogs.push({
      id: `WFL-${Date.now()}`,
      action: 'SUBMITTED',
      stepName: 'Pending Manager Approval',
      performedBy: currentCx.requestorId,
      userName: currentCx.requestorName,
      userRole: UserRole.EMPLOYEE,
      comment: 'CAPEX submitted for review and approval.',
      timestamp: new Date().toISOString(),
      signature
    });

    const manager = db.users.find(u => u.role === UserRole.DEPARTMENT_MANAGER && u.departmentId === currentCx.departmentId);
    if (manager) {
      triggerNotifications(manager, `New CAPEX Submission: ${currentCx.capexNumber}`, `CAPEX requisition ${currentCx.capexNumber} by ${currentCx.requestorName} requires your signature.`);
    }
  }

  db.capexRequisitions[idx] = updatedCx;
  saveDB(db);

  logAudit(currentCx.requestorId, currentCx.requestorName, UserRole.EMPLOYEE, 'UPDATE_CAPEX', 'PR', `Submitted/Updated CAPEX ${currentCx.capexNumber} to status ${status}`, req);
  res.json(updatedCx);
});

app.post('/api/capex/:id/approve', (req, res) => {
  const { id } = req.params;
  const { userId, comment, signatureData, companyStampData, geoCoordinates, isReject } = req.body;

  if (!db.capexRequisitions) db.capexRequisitions = [];
  const idx = db.capexRequisitions.findIndex(c => c.id === id);
  if (idx === -1) return res.status(404).json({ message: 'CAPEX Requisition not found' });

  const currentCx = db.capexRequisitions[idx];
  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(400).json({ message: 'User not found' });

  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const ua = req.headers['user-agent'] || 'Unknown Browser';
  const digitalHash = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  const sig: SignatureDetails = {
    signedBy: user.name,
    role: user.role,
    title: user.title,
    timestamp: new Date().toISOString(),
    ipAddress: ip,
    userAgent: ua,
    browser: 'Web Browser',
    device: 'Web Client Device',
    geoCoordinates,
    signatureData,
    companyStampData: companyStampData || (
      (!isReject && (user.role === UserRole.EXECUTIVE || user.role === UserRole.DEPARTMENT_MANAGER || user.role === UserRole.PURCHASING_MANAGER || user.role === UserRole.ASSISTANT_MANAGER || user.role === UserRole.PURCHASING))
        ? 'https://lh3.googleusercontent.com/d/1mMCAyix03zAA2BCquyONnZXRaxTxhAgu'
        : undefined
    ),
    digitalHash
  };

  if (isReject) {
    currentCx.status = CapexStatus.REJECTED;
    currentCx.workflowLogs.push({
      id: `WFL-${Date.now()}`,
      action: 'REJECTED',
      stepName: user.role === UserRole.DEPARTMENT_MANAGER ? 'Department Manager Approval' : 'Executive Approval',
      performedBy: user.id,
      userName: user.thaiName || user.name,
      userRole: user.role,
      comment: comment || 'Rejected without comment.',
      timestamp: new Date().toISOString(),
      signature: sig
    });

    const requester = db.users.find(u => u.id === currentCx.requestorId);
    if (requester) {
      triggerNotifications(requester, `CAPEX Rejected: ${currentCx.capexNumber}`, `Your CAPEX ${currentCx.capexNumber} was rejected by ${user.name}. Reason: ${comment}`);
    }

    db.capexRequisitions[idx] = currentCx;
    saveDB(db);
    logAudit(user.id, user.name, user.role, 'REJECT_CAPEX', 'WORKFLOW', `Rejected CAPEX ${currentCx.capexNumber}`, req);
    return res.json(currentCx);
  }

  // Approval Flow
  if (user.role === UserRole.DEPARTMENT_MANAGER) {
    currentCx.workflowLogs.push({
      id: `WFL-${Date.now()}`,
      action: 'APPROVED',
      stepName: 'Department Manager Approval',
      performedBy: user.id,
      userName: user.thaiName || user.name,
      userRole: user.role,
      comment: comment || 'Approved by Department Manager.',
      timestamp: new Date().toISOString(),
      signature: sig
    });

    currentCx.status = CapexStatus.PENDING_EXECUTIVE;
    
    // Notify Executive MD/Plant Mgr
    const exec = db.users.find(u => u.role === UserRole.EXECUTIVE);
    if (exec) {
      triggerNotifications(exec, `Pending Executive CAPEX Approval: ${currentCx.capexNumber}`, `CAPEX ${currentCx.capexNumber} approved by Mgr. Needs Managing Director signature.`);
    }
  } else if (user.role === UserRole.EXECUTIVE) {
    currentCx.status = CapexStatus.APPROVED;
    currentCx.workflowLogs.push({
      id: `WFL-${Date.now()}`,
      action: 'APPROVED',
      stepName: 'Executive Approval',
      performedBy: user.id,
      userName: user.thaiName || user.name,
      userRole: user.role,
      comment: comment || 'Approved by Executive Plant Manager.',
      timestamp: new Date().toISOString(),
      signature: sig
    });

    // Notify originator
    const requester = db.users.find(u => u.id === currentCx.requestorId);
    if (requester) {
      triggerNotifications(requester, `CAPEX Approved: ${currentCx.capexNumber}`, `Congratulations! Your CAPEX ${currentCx.capexNumber} has been fully approved by Executive.`);
    }
  }

  db.capexRequisitions[idx] = currentCx;
  saveDB(db);
  logAudit(user.id, user.name, user.role, 'APPROVE_CAPEX', 'WORKFLOW', `Approved CAPEX ${currentCx.capexNumber}`, req);
  res.json(currentCx);
});

// 5. PO Routes
app.get('/api/po', (req, res) => {
  res.json(db.purchaseOrders);
});

app.get('/api/po/:id', (req, res) => {
  const po = db.purchaseOrders.find(p => p.id === req.params.id);
  if (!po) return res.status(404).json({ message: 'PO not found' });
  res.json(po);
});

// Update PO details
app.put('/api/po/:id', (req, res) => {
  const { id } = req.params;
  const { creditTerm, notes, shippingAddress, status, items, attachments } = req.body;
  const poIdx = db.purchaseOrders.findIndex(p => p.id === id);
  if (poIdx === -1) return res.status(404).json({ message: 'PO not found' });

  const currentPO = db.purchaseOrders[poIdx];
  let finalSubtotal = currentPO.subtotal;
  let finalVat = currentPO.vat;
  let finalGrandTotal = currentPO.grandTotal;

  if (items && items.length > 0) {
    finalSubtotal = items.reduce((sum: number, item: any) => sum + (parseFloat(item.qty) * parseFloat(item.unitPrice)), 0);
    finalVat = finalSubtotal * 0.07;
    finalGrandTotal = finalSubtotal + finalVat;
  }

  const updatedPO: PO = {
    ...currentPO,
    creditTerm: creditTerm || currentPO.creditTerm,
    notes: notes || currentPO.notes,
    shippingAddress: shippingAddress || currentPO.shippingAddress,
    status: status || currentPO.status,
    attachments: attachments || currentPO.attachments,
    items: items ? items.map((item: any, idx: number) => ({
      id: item.id || `PRI-${Date.now()}-${idx}`,
      itemNo: idx + 1,
      partNo: item.partNo || '',
      description: item.description,
      specification: item.specification || '',
      unit: item.unit || 'PCS',
      qty: parseFloat(item.qty),
      unitPrice: parseFloat(item.unitPrice),
      total: parseFloat(item.qty) * parseFloat(item.unitPrice)
    })) : currentPO.items,
    subtotal: finalSubtotal,
    vat: finalVat,
    grandTotal: finalGrandTotal
  };

  db.purchaseOrders[poIdx] = updatedPO;
  saveDB(db);

  logAudit('SYSTEM', 'Admin Action', UserRole.ADMINISTRATOR, 'UPDATE_PO', 'PO', `Updated PO ${currentPO.poNumber}`, req);
  res.json(updatedPO);
});

// Generate PO from approved PR
app.post('/api/po/generate', (req, res) => {
  const { prId, userId, signatureData, companyStampData } = req.body;
  
  const prIdx = db.purchaseRequisitions.findIndex(p => p.id === prId);
  if (prIdx === -1) return res.status(404).json({ message: 'PR not found' });

  const pr = db.purchaseRequisitions[prIdx];
  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(400).json({ message: 'Purchasing user not found' });

  const poNumber = generateNextPONumber();

  // Deduct Department Budget upon PO Generation
  const deptIdx = db.departments.findIndex(d => d.id === pr.departmentId);
  if (deptIdx !== -1) {
    db.departments[deptIdx].spent += pr.grandTotal;
    db.departments[deptIdx].remaining -= pr.grandTotal;
  }

  // Create initial PO workflow logs
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const ua = req.headers['user-agent'] || 'Unknown Browser';
  const digitalHash = Math.random().toString(36).substring(2, 15);

  const sig: SignatureDetails = {
    signedBy: user.name,
    role: user.role,
    title: user.title,
    timestamp: new Date().toISOString(),
    ipAddress: ip,
    userAgent: ua,
    browser: 'Web App',
    device: 'Desktop',
    signatureData: signatureData || user.signatureUrl || '',
    companyStampData: companyStampData,
    digitalHash
  };

  const initialLog: WorkflowLog = {
    id: `WFL-PO-${Date.now()}`,
    action: 'CREATED',
    stepName: 'PO Generated',
    performedBy: user.id,
    userName: user.name,
    userRole: user.role,
    comment: `PO raised and mapped automatically from Approved PR: ${pr.prNumber}`,
    timestamp: new Date().toISOString(),
    signature: sig
  };

  const newPO: PO = {
    id: `PO-${Date.now()}`,
    poNumber,
    referPrId: pr.id,
    referPrNumber: pr.prNumber,
    date: new Date().toISOString().split('T')[0],
    vendorId: pr.suggestedVendorId,
    vendorName: pr.vendorName,
    vendorAddress: pr.vendorAddress,
    vendorPhone: pr.vendorPhone,
    vendorFax: pr.vendorFax,
    vendorTaxId: pr.vendorTaxId,
    shippingAddress: 'SUMINO AAPICO (Thailand) Co., Ltd. 700/706 Moo 3, T.Bankao, A.Panthong, Chonburi 20160',
    departmentId: pr.departmentId,
    departmentName: pr.departmentName,
    creditTerm: '30 Days',
    items: pr.items,
    subtotal: pr.subtotal,
    vat: pr.vat,
    grandTotal: pr.grandTotal,
    status: POStatus.PENDING_PURCHASING_MGR,
    notes: '1. Delivery: After receive of PO\n2. Payment term: 30 Days after receiving billing note\n3. Place of shipment: At Sumino aapico (Thailand) factory',
    attachments: pr.attachments,
    workflowLogs: [initialLog],
    currentStepIndex: 1,
    companyName: pr.companyName,
    branchName: pr.branchName
  };

  // Update PR status to PO_CREATED
  pr.status = PRStatus.PO_CREATED;
  db.purchaseRequisitions[prIdx] = pr;

  db.purchaseOrders.push(newPO);
  saveDB(db);

  // Notify Purchasing Manager
  const purMgr = db.users.find(u => u.role === UserRole.PURCHASING_MANAGER);
  if (purMgr) {
    triggerNotifications(purMgr, `New PO Approval Pending: ${poNumber}`, `PO ${poNumber} mapped from approved ${pr.prNumber} has been created and is waiting for your signature.`);
  }

  logAudit(user.id, user.name, user.role, 'GENERATE_PO', 'PO', `Generated PO ${poNumber} from approved PR ${pr.prNumber}`, req);
  res.json(newPO);
});

// PO Approve / Reject with Signature
app.post('/api/po/:id/approve', (req, res) => {
  const { id } = req.params;
  const { userId, comment, signatureData, companyStampData, geoCoordinates, isReject } = req.body;

  const poIdx = db.purchaseOrders.findIndex(p => p.id === id);
  if (poIdx === -1) return res.status(404).json({ message: 'PO not found' });

  const currentPO = db.purchaseOrders[poIdx];
  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(400).json({ message: 'User not found' });

  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const ua = req.headers['user-agent'] || 'Unknown Browser';
  const digitalHash = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  const sig: SignatureDetails = {
    signedBy: user.name,
    role: user.role,
    title: user.title,
    timestamp: new Date().toISOString(),
    ipAddress: ip,
    userAgent: ua,
    browser: 'Web Browser',
    device: 'Web Client',
    geoCoordinates,
    signatureData,
    companyStampData: companyStampData || (
      (!isReject && (user.role === UserRole.EXECUTIVE || user.role === UserRole.DEPARTMENT_MANAGER || user.role === UserRole.PURCHASING_MANAGER || user.role === UserRole.ASSISTANT_MANAGER || user.role === UserRole.PURCHASING))
        ? 'https://lh3.googleusercontent.com/d/1mMCAyix03zAA2BCquyONnZXRaxTxhAgu'
        : undefined
    ),
    digitalHash
  };

  if (isReject) {
    currentPO.status = POStatus.REJECTED;
    currentPO.workflowLogs.push({
      id: `WFL-PO-${Date.now()}`,
      action: 'REJECTED',
      stepName: (user.role === UserRole.PURCHASING_MANAGER || user.role === UserRole.ASSISTANT_MANAGER) ? 'Purchasing Manager PO Approval' : 'Executive Director PO Approval',
      performedBy: user.id,
      userName: user.name,
      userRole: user.role,
      comment: comment || 'Rejected without comment.',
      timestamp: new Date().toISOString(),
      signature: sig
    });

    // Rollback budget since PO rejected
    const deptIdx = db.departments.findIndex(d => d.id === currentPO.departmentId);
    if (deptIdx !== -1) {
      db.departments[deptIdx].spent -= currentPO.grandTotal;
      db.departments[deptIdx].remaining += currentPO.grandTotal;
    }

    // Set corresponding PR back to PENDING_PURCHASING
    const prIdx = db.purchaseRequisitions.findIndex(p => p.id === currentPO.referPrId);
    if (prIdx !== -1) {
      db.purchaseRequisitions[prIdx].status = PRStatus.PENDING_PURCHASING;
    }

    db.purchaseOrders[poIdx] = currentPO;
    saveDB(db);
    logAudit(user.id, user.name, user.role, 'REJECT_PO', 'WORKFLOW', `Rejected PO ${currentPO.poNumber}`, req);
    return res.json(currentPO);
  }

  if (user.role === UserRole.PURCHASING_MANAGER || user.role === UserRole.ASSISTANT_MANAGER) {
    currentPO.status = POStatus.PENDING_EXECUTIVE;
    currentPO.workflowLogs.push({
      id: `WFL-PO-${Date.now()}`,
      action: 'APPROVED',
      stepName: 'Purchasing Manager PO Approval',
      performedBy: user.id,
      userName: user.name,
      userRole: user.role,
      comment: comment || 'Approved by Purchasing Manager. Ready for MD signature.',
      timestamp: new Date().toISOString(),
      signature: sig
    });

    // Notify Executive MD
    const exec = db.users.find(u => u.role === UserRole.EXECUTIVE);
    if (exec) {
      triggerNotifications(exec, `Pending PO Executive Approval: ${currentPO.poNumber}`, `PO ${currentPO.poNumber} from PC&L department has been signed by Purchasing Manager. MD signature required.`);
    }
  } else if (user.role === UserRole.EXECUTIVE) {
    currentPO.status = POStatus.APPROVED;
    currentPO.workflowLogs.push({
      id: `WFL-PO-${Date.now()}`,
      action: 'APPROVED',
      stepName: 'Executive Director PO Approval',
      performedBy: user.id,
      userName: user.name,
      userRole: user.role,
      comment: comment || 'Approved and Issued by Executive MD.',
      timestamp: new Date().toISOString(),
      signature: sig
    });

    // Trigger Notification to Submitter and Purchasing
    const pur = db.users.find(u => u.role === UserRole.PURCHASING);
    if (pur) {
      triggerNotifications(pur, `PO Fully Approved: ${currentPO.poNumber}`, `PO ${currentPO.poNumber} has received all enterprise signatures and is ready to be sent to Vendor: ${currentPO.vendorName}.`);
    }
  }

  db.purchaseOrders[poIdx] = currentPO;
  saveDB(db);
  logAudit(user.id, user.name, user.role, 'APPROVE_PO', 'WORKFLOW', `Approved PO ${currentPO.poNumber}`, req);
  res.json(currentPO);
});

// Issue PO (Purchasing Officer Sign-off)
app.post('/api/po/:id/issue', (req, res) => {
  const { id } = req.params;
  const { userId, signatureData, companyStampData, geoCoordinates } = req.body;
  
  const poIdx = db.purchaseOrders.findIndex(p => p.id === id);
  if (poIdx === -1) return res.status(404).json({ message: 'PO not found' });
  
  const currentPO = db.purchaseOrders[poIdx];
  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(400).json({ message: 'User not found' });

  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const ua = req.headers['user-agent'] || 'Unknown Browser';
  const digitalHash = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + "-issued";

  const sig: SignatureDetails = {
    signedBy: user.name,
    role: user.role,
    title: user.title,
    timestamp: new Date().toISOString(),
    ipAddress: ip,
    userAgent: ua,
    browser: 'Web Browser',
    device: 'Web Client',
    geoCoordinates,
    signatureData,
    companyStampData: companyStampData || (
      (user.role === UserRole.EXECUTIVE || user.role === UserRole.DEPARTMENT_MANAGER || user.role === UserRole.PURCHASING_MANAGER || user.role === UserRole.ASSISTANT_MANAGER || user.role === UserRole.PURCHASING) 
        ? 'https://lh3.googleusercontent.com/d/1mMCAyix03zAA2BCquyONnZXRaxTxhAgu' 
        : undefined
    ),
    digitalHash
  };

  // Find CREATED log to update or add new log
  let createdLogIdx = currentPO.workflowLogs.findIndex(l => l.action === 'CREATED');
  
  if (createdLogIdx !== -1) {
    currentPO.workflowLogs[createdLogIdx].signature = sig;
    currentPO.workflowLogs[createdLogIdx].timestamp = new Date().toISOString();
  } else {
    currentPO.workflowLogs.push({
      id: `WFL-PO-ISSUE-${Date.now()}`,
      action: 'CREATED',
      stepName: 'PO Issuance',
      performedBy: user.id,
      userName: user.name,
      userRole: user.role,
      comment: 'Officially issued PO with digital signature.',
      timestamp: new Date().toISOString(),
      signature: sig
    });
  }

  // Ensure status is PENDING_PURCHASING_MGR after issuance
  if (currentPO.status === POStatus.DRAFT) {
    currentPO.status = POStatus.PENDING_PURCHASING_MGR;
  }

  db.purchaseOrders[poIdx] = currentPO;
  saveDB(db);
  logAudit(user.id, user.name, user.role, 'ISSUE_PO', 'WORKFLOW', `Issued PO ${currentPO.poNumber}`, req);
  res.json(currentPO);
});

// Send PO to Vendor
app.post('/api/po/:id/send-vendor', (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  const poIdx = db.purchaseOrders.findIndex(p => p.id === id);
  if (poIdx === -1) return res.status(404).json({ message: 'PO not found' });

  const currentPO = db.purchaseOrders[poIdx];
  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(400).json({ message: 'User not found' });

  currentPO.status = POStatus.SENT_TO_VENDOR;
  currentPO.workflowLogs.push({
    id: `WFL-PO-${Date.now()}`,
    action: 'SENT_TO_VENDOR',
    stepName: 'PO Dispatched',
    performedBy: user.id,
    userName: user.name,
    userRole: user.role,
    comment: 'PO successfully sent to Vendor with standard purchase terms.',
    timestamp: new Date().toISOString()
  });

  db.purchaseOrders[poIdx] = currentPO;
  saveDB(db);

  logAudit(user.id, user.name, user.role, 'SEND_PO_VENDOR', 'PO', `Dispatched PO ${currentPO.poNumber} to vendor ${currentPO.vendorName}`, req);
  res.json(currentPO);
});

// Upload invoice & delivery documents to PO
app.post('/api/po/:id/upload-docs', (req, res) => {
  const { id } = req.params;
  const { invoiceUrl, deliveryUrl, userId } = req.body;
  const poIdx = db.purchaseOrders.findIndex(p => p.id === id);
  if (poIdx === -1) return res.status(404).json({ message: 'PO not found' });

  const currentPO = db.purchaseOrders[poIdx];
  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(400).json({ message: 'User not found' });

  if (invoiceUrl) currentPO.invoiceUrl = invoiceUrl;
  if (deliveryUrl) currentPO.deliveryUrl = deliveryUrl;

  db.purchaseOrders[poIdx] = currentPO;
  saveDB(db);

  logAudit(user.id, user.name, user.role, 'UPLOAD_PO_DOCS', 'PO', `Uploaded invoice/delivery records for PO ${currentPO.poNumber}`, req);
  res.json(currentPO);
});

// Close Job
app.post('/api/po/:id/close', (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  const poIdx = db.purchaseOrders.findIndex(p => p.id === id);
  if (poIdx === -1) return res.status(404).json({ message: 'PO not found' });

  const currentPO = db.purchaseOrders[poIdx];
  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(400).json({ message: 'User not found' });

  currentPO.status = POStatus.CLOSED;
  currentPO.workflowLogs.push({
    id: `WFL-PO-${Date.now()}`,
    action: 'CLOSED',
    stepName: 'Job Closed',
    performedBy: user.id,
    userName: user.name,
    userRole: user.role,
    comment: 'PO completed, delivery items verified, and job closed.',
    timestamp: new Date().toISOString()
  });

  db.purchaseOrders[poIdx] = currentPO;
  saveDB(db);

  logAudit(user.id, user.name, user.role, 'CLOSE_PO', 'PO', `Closed PO job for PO ${currentPO.poNumber}`, req);
  res.json(currentPO);
});

// 6. Workflow configurations
app.get('/api/workflow/rules', (req, res) => {
  res.json(db.workflowRules);
});

app.put('/api/workflow/rules/:id', (req, res) => {
  const { id } = req.params;
  const { amountLimit, requireExecutiveApproval, parallelApproval, delegateActive, delegateUserId } = req.body;
  const ruleIdx = db.workflowRules.findIndex(r => r.id === id);
  if (ruleIdx === -1) return res.status(404).json({ message: 'Rule not found' });

  db.workflowRules[ruleIdx] = {
    ...db.workflowRules[ruleIdx],
    amountLimit: parseFloat(amountLimit),
    requireExecutiveApproval,
    parallelApproval,
    delegateActive,
    delegateUserId
  };
  saveDB(db);
  res.json(db.workflowRules[ruleIdx]);
});

// 7. Audit & Logs
app.get('/api/audit-logs', (req, res) => {
  res.json(db.auditLogs);
});

app.get('/api/notifications', (req, res) => {
  res.json(db.notifications);
});

app.post('/api/notifications/read-all', (req, res) => {
  db.notifications.forEach(n => { n.isRead = true; });
  saveDB(db);
  res.json({ success: true });
});

app.post('/api/notifications/:id/read', (req, res) => {
  const { id } = req.params;
  const notif = db.notifications.find(n => n.id === id);
  if (notif) {
    notif.isRead = true;
    saveDB(db);
  }
  res.json({ success: true });
});

// 8. Chat Rooms & Messages API routes (Supabase persistence)
app.get('/api/chat/rooms', async (req, res) => {
  try {
    const { userId } = req.query;
    const { data, error } = await supabase
      .from('chat_rooms')
      .select('*')
      .order('last_message_at', { ascending: false });

    if (!error && data) {
      const rooms = data.map(r => ({
        id: r.id,
        name: r.name || undefined,
        type: r.type || 'PRIVATE',
        participantIds: Array.isArray(r.participant_ids) ? r.participant_ids : [],
        lastMessage: r.last_message || undefined,
        lastMessageAt: r.last_message_at || undefined,
        createdAt: r.created_at,
        unreadCounts: r.unread_counts || {}
      }));
      if (userId) {
        return res.json(rooms.filter(r => r.participantIds.includes(String(userId))));
      }
      return res.json(rooms);
    }
  } catch (e) {
    console.error('API /api/chat/rooms error:', e);
  }
  res.json([]);
});

app.post('/api/chat/rooms', async (req, res) => {
  try {
    const { id, name, type, participantIds, createdAt } = req.body;
    const roomPayload = {
      id,
      name: name || null,
      type: type || 'PRIVATE',
      participant_ids: participantIds || [],
      last_message_at: new Date().toISOString(),
      created_at: createdAt || new Date().toISOString(),
      unread_counts: {}
    };
    await supabase.from('chat_rooms').upsert(roomPayload);
    res.json({ success: true, room: roomPayload });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to create chat room' });
  }
});

app.get('/api/chat/messages', async (req, res) => {
  try {
    const { roomId } = req.query;
    if (!roomId) return res.status(400).json({ error: 'roomId parameter required' });

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', String(roomId))
      .order('created_at', { ascending: true });

    if (!error && data) {
      const messages = data.map(m => ({
        id: m.id,
        roomId: m.room_id,
        senderId: m.sender_id,
        senderName: m.sender_name,
        text: m.text,
        createdAt: m.created_at,
        readBy: Array.isArray(m.read_by) ? m.read_by : []
      }));
      return res.json(messages);
    }
  } catch (e) {
    console.error('API /api/chat/messages error:', e);
  }
  res.json([]);
});

app.post('/api/chat/messages', async (req, res) => {
  try {
    const { id, roomId, senderId, senderName, text, createdAt, readBy } = req.body;
    const msgId = id || `MSG_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = createdAt || new Date().toISOString();

    const msgPayload = {
      id: msgId,
      room_id: roomId,
      sender_id: senderId,
      sender_name: senderName,
      text,
      created_at: nowIso,
      read_by: readBy || [senderId]
    };

    await supabase.from('chat_messages').insert(msgPayload);

    // Update last message in room
    const { data: roomData } = await supabase.from('chat_rooms').select('*').eq('id', roomId).single();
    if (roomData) {
      const updatedUnread = { ...(roomData.unread_counts || {}) };
      if (Array.isArray(roomData.participant_ids)) {
        roomData.participant_ids.forEach((pId: string) => {
          if (pId !== senderId) {
            updatedUnread[pId] = (updatedUnread[pId] || 0) + 1;
          }
        });
      }
      await supabase.from('chat_rooms').update({
        last_message: text,
        last_message_at: nowIso,
        unread_counts: updatedUnread
      }).eq('id', roomId);
    }

    res.json({ success: true, message: msgPayload });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to post chat message' });
  }
});

// Price Comparison (Comparison Sheets) API routes
app.get('/api/comparison', (req, res) => {
  res.json(db.comparisonSheets || []);
});

app.post('/api/comparison', (req, res) => {
  const {
    id,
    date,
    referPrId,
    referPrNumber,
    departmentId,
    departmentName,
    items,
    notes,
    createdById,
    createdByName,
    userRole
  } = req.body;

  const isNew = !id || !db.comparisonSheets.some(cs => cs.id === id);
  const csId = id || `CS-${Date.now()}`;
  const csNumber = isNew ? generateNextCSNumber() : (db.comparisonSheets.find(cs => cs.id === csId)?.csNumber || generateNextCSNumber());

  const sheet: ComparisonSheet = {
    id: csId,
    csNumber,
    date: date || new Date().toISOString().split('T')[0],
    referPrId,
    referPrNumber,
    departmentId: departmentId || 'DEP001',
    departmentName: departmentName || 'Purchasing',
    status: isNew ? 'COMPLETED' : (db.comparisonSheets.find(cs => cs.id === csId)?.status || 'COMPLETED'),
    items: items || [],
    createdById: createdById || 'SYSTEM',
    createdByName: createdByName || 'System',
    createdAt: new Date().toISOString(),
    notes
  };

  if (isNew) {
    db.comparisonSheets.unshift(sheet);
    logAudit(createdById || 'SYSTEM', createdByName || 'System', userRole || UserRole.PURCHASING, 'CREATE_COMPARISON', 'COMPARISON', `Created Price Comparison Sheet: ${csNumber}`, req);
  } else {
    const idx = db.comparisonSheets.findIndex(cs => cs.id === csId);
    if (idx !== -1) {
      db.comparisonSheets[idx] = { ...db.comparisonSheets[idx], ...sheet };
    }
    logAudit(createdById || 'SYSTEM', createdByName || 'System', userRole || UserRole.PURCHASING, 'UPDATE_COMPARISON', 'COMPARISON', `Updated Price Comparison Sheet: ${csNumber}`, req);
  }

  saveDB(db);
  res.json(sheet);
});

app.post('/api/comparison/:id/generate-pos', (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  const cs = db.comparisonSheets.find(c => c.id === id);
  if (!cs) return res.status(404).json({ message: 'Comparison sheet not found' });

  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(400).json({ message: 'User not found' });

  // Group items by selectedVendorId
  const itemsByVendor: { [vendorId: string]: ComparisonItem[] } = {};
  cs.items.forEach(item => {
    if (item.selectedVendorId) {
      if (!itemsByVendor[item.selectedVendorId]) {
        itemsByVendor[item.selectedVendorId] = [];
      }
      itemsByVendor[item.selectedVendorId].push(item);
    }
  });

  const createdPOs: PO[] = [];

  Object.entries(itemsByVendor).forEach(([vendorId, compItems]) => {
    const vendor = db.vendors.find(v => v.id === vendorId) || {
      id: vendorId,
      name: compItems[0]?.offers.find(o => o.vendorId === vendorId)?.vendorName || 'Unknown Vendor',
      address: 'N/A',
      phone: 'N/A',
      taxId: 'N/A',
      creditTerm: '30 Days'
    };

    const poNumber = generateNextPONumber();

    // Convert comparison items to PRItem-like structure for the PO
    const poItems = compItems.map((ci, index) => ({
      id: `POI-${Date.now()}-${index}`,
      itemNo: index + 1,
      partNo: ci.partNo,
      description: ci.description,
      specification: ci.specification || '',
      unit: ci.unit,
      qty: ci.qty,
      unitPrice: ci.selectedPrice || 0,
      total: ci.qty * (ci.selectedPrice || 0)
    }));

    const subtotal = poItems.reduce((sum, item) => sum + item.total, 0);
    const vat = subtotal * 0.07;
    const grandTotal = subtotal + vat;

    const initialLog: WorkflowLog = {
      id: `WFL-PO-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action: 'CREATED',
      stepName: 'PO Generated from Price Comparison',
      performedBy: user.id,
      userName: user.name,
      userRole: user.role,
      comment: `PO raised and mapped automatically from Price Comparison Sheet: ${cs.csNumber}`,
      timestamp: new Date().toISOString()
    };

    const newPO: PO = {
      id: `PO-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      poNumber,
      referPrId: cs.referPrId || '',
      referPrNumber: cs.referPrNumber || cs.csNumber,
      date: new Date().toISOString().split('T')[0],
      vendorId: vendor.id,
      vendorName: vendor.name,
      vendorAddress: vendor.address,
      vendorPhone: vendor.phone,
      vendorTaxId: vendor.taxId,
      shippingAddress: 'SUMINO AAPICO (Thailand) Co., Ltd. 700/706 Moo 3, T.Bankao, A.Panthong, Chonburi 20160',
      departmentId: cs.departmentId,
      departmentName: cs.departmentName,
      creditTerm: vendor.creditTerm || '30 Days',
      items: poItems,
      subtotal,
      vat,
      grandTotal,
      status: POStatus.PENDING_PURCHASING_MGR,
      notes: '1. Delivery: After receive of PO\n2. Payment term: 30 Days after receiving billing note\n3. Place of shipment: At Sumino aapico (Thailand) factory',
      attachments: [],
      workflowLogs: [initialLog],
      currentStepIndex: 1,
      companyName: 'SUMINO AAPICO (Thailand) Company Limited',
      branchName: 'Chonburi Branch (Head Office)'
    };

    db.purchaseOrders.push(newPO);
    createdPOs.push(newPO);

    // Deduct budget
    const deptIdx = db.departments.findIndex(d => d.id === cs.departmentId);
    if (deptIdx !== -1) {
      db.departments[deptIdx].spent += grandTotal;
      db.departments[deptIdx].remaining -= grandTotal;
    }

    // Trigger notification
    const purMgr = db.users.find(u => u.role === UserRole.PURCHASING_MANAGER);
    if (purMgr) {
      triggerNotifications(purMgr, `New PO Approval Pending: ${poNumber}`, `PO ${poNumber} mapped from Price Comparison Sheet ${cs.csNumber} is pending approval.`);
    }

    // Mark items in CS as PO created
    compItems.forEach(ci => {
      ci.poCreated = true;
      ci.poNumber = poNumber;
    });
  });

  // Check if all items in comparison have POs
  const allHasPO = cs.items.every(ci => ci.poCreated || ci.selectedVendorId === undefined);
  cs.status = allHasPO ? 'PO_CREATED' : 'PARTIALLY_PO_CREATED';

  // If there's a referenced PR, update its status
  if (cs.referPrId) {
    const pr = db.purchaseRequisitions.find(p => p.id === cs.referPrId);
    if (pr) {
      pr.status = PRStatus.PO_CREATED;
    }
  }

  saveDB(db);

  logAudit(user.id, user.name, user.role, 'GENERATE_PO_FROM_CS', 'COMPARISON', `Generated ${createdPOs.length} POs from Comparison Sheet ${cs.csNumber}`, req);

  res.json({ success: true, createdPOs });
});

// 7.5 Other Purchasing Modules endpoints
app.get('/api/other-modules', (req, res) => {
  res.json({
    surveys: db.surveys || [],
    deliveries: db.deliveries || [],
    deposits: db.deposits || [],
    cashPurchases: db.cashPurchases || [],
    creditPurchases: db.creditPurchases || [],
    returns: db.returns || [],
    adjustments: db.adjustments || [],
    landedCosts: db.landedCosts || []
  });
});

app.post('/api/other-modules', (req, res) => {
  const { tab, userId, userName, ...fields } = req.body;
  const id = `DOC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const record = { id, userId, userName, ...fields };

  if (tab === 'survey') {
    if (!db.surveys) db.surveys = [];
    db.surveys.unshift(record);
    logAudit(userId || 'SYSTEM', userName || 'User', UserRole.PURCHASING, 'CREATE_SURVEY', 'COMPARISON', `Created new price survey for vendor: ${fields.vendorName}`, req);
  } else if (tab === 'delivery') {
    if (!db.deliveries) db.deliveries = [];
    db.deliveries.unshift(record);
    logAudit(userId || 'SYSTEM', userName || 'User', UserRole.PURCHASING, 'CREATE_DELIVERY_SCHEDULE', 'PO', `Scheduled delivery date: ${fields.expectedDate} for PO ID: ${fields.poId}`, req);
  } else if (tab === 'deposit') {
    if (!db.deposits) db.deposits = [];
    db.deposits.unshift(record);
    logAudit(userId || 'SYSTEM', userName || 'User', UserRole.PURCHASING, 'RECORD_DEPOSIT_PAYMENT', 'PO', `Recorded PO deposit payment of ${fields.amount} THB`, req);
  } else if (tab === 'cash') {
    if (!db.cashPurchases) db.cashPurchases = [];
    db.cashPurchases.unshift(record);
    logAudit(userId || 'SYSTEM', userName || 'User', UserRole.PURCHASING, 'RECORD_CASH_PURCHASE', 'PO', `Recorded cash purchase of ${fields.amount} THB from ${fields.vendorName}`, req);
  } else if (tab === 'credit') {
    if (!db.creditPurchases) db.creditPurchases = [];
    db.creditPurchases.unshift(record);
    logAudit(userId || 'SYSTEM', userName || 'User', UserRole.PURCHASING, 'RECORD_CREDIT_PURCHASE', 'PO', `Recorded credit purchase of ${fields.amount} THB from ${fields.vendorName}`, req);
  } else if (tab === 'return') {
    if (!db.returns) db.returns = [];
    db.returns.unshift(record);
    logAudit(userId || 'SYSTEM', userName || 'User', UserRole.PURCHASING, 'RECORD_DEBIT_NOTE', 'PO', `Created purchase return / debit note for ${fields.vendorName}, amount: ${fields.amount} THB`, req);
  } else if (tab === 'debit_adjust') {
    if (!db.adjustments) db.adjustments = [];
    db.adjustments.unshift(record);
    logAudit(userId || 'SYSTEM', userName || 'User', UserRole.PURCHASING, 'RECORD_CREDIT_NOTE', 'PO', `Created credit note adjustment for ${fields.vendorName}, amount: ${fields.amount} THB`, req);
  } else if (tab === 'landed') {
    if (!db.landedCosts) db.landedCosts = [];
    db.landedCosts.unshift(record);
    logAudit(userId || 'SYSTEM', userName || 'User', UserRole.PURCHASING, 'ALLOCATE_LANDED_COST', 'PO', `Allocated landed costs for PO ID: ${fields.poId}`, req);
  }

  saveDB(db);
  res.json({ success: true, record });
});

// 8. Analytics & Dashboard Data
app.get('/api/dashboard', (req, res) => {
  const prs = db.purchaseRequisitions;
  const pos = db.purchaseOrders;

  // Aggregate cards
  const waitingApprovalPR = prs.filter(p => [PRStatus.PENDING_DEPT_MGR, PRStatus.PENDING_EXECUTIVE].includes(p.status)).length;
  const waitingApprovalPO = pos.filter(p => [POStatus.PENDING_PURCHASING_MGR, POStatus.PENDING_EXECUTIVE].includes(p.status)).length;
  const approvedPR = prs.filter(p => p.status === PRStatus.APPROVED || p.status === PRStatus.PO_CREATED).length;
  const rejectedPR = prs.filter(p => p.status === PRStatus.REJECTED).length;

  const totalPRSpend = prs.reduce((sum, p) => sum + p.grandTotal, 0);
  const totalPOSpend = pos.reduce((sum, p) => sum + p.grandTotal, 0);

  // Department budgets
  const deptBudgets = db.departments.map(d => ({
    name: d.name,
    budget: d.budget,
    spent: d.spent,
    remaining: d.remaining
  }));

  // Vendor distribution
  const vendorSpend: { [name: string]: number } = {};
  pos.forEach(p => {
    vendorSpend[p.vendorName] = (vendorSpend[p.vendorName] || 0) + p.grandTotal;
  });
  const vendorDistribution = Object.keys(vendorSpend).map(name => ({
    name,
    amount: vendorSpend[name]
  }));

  res.json({
    cards: {
      waitingApprovalPR,
      waitingApprovalPO,
      approvedPR,
      rejectedPR,
      totalPRSpend,
      totalPOSpend
    },
    deptBudgets,
    vendorDistribution
  });
});

// Vite Setup for Asset Serving & Static SPA Routing
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Enterprise Server] running at http://localhost:${PORT}`);
  });
}

startServer();
