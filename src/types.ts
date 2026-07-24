/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserRole {
  EMPLOYEE = 'EMPLOYEE',
  DEPARTMENT_MANAGER = 'DEPARTMENT_MANAGER',
  PURCHASING = 'PURCHASING',
  ASSISTANT_MANAGER = 'ASSISTANT_MANAGER',
  PURCHASING_MANAGER = 'PURCHASING_MANAGER',
  EXECUTIVE = 'EXECUTIVE',
  ADMINISTRATOR = 'ADMINISTRATOR'
}

export enum PRStatus {
  DRAFT = 'DRAFT',
  PENDING_DEPT_MGR = 'PENDING_DEPT_MGR',
  PENDING_EXECUTIVE = 'PENDING_EXECUTIVE',
  PENDING_PURCHASING = 'PENDING_PURCHASING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PO_CREATED = 'PO_CREATED',
  CANCELLED = 'CANCELLED'
}

export enum POStatus {
  DRAFT = 'DRAFT',
  PENDING_PURCHASING_MGR = 'PENDING_PURCHASING_MGR',
  PENDING_EXECUTIVE = 'PENDING_EXECUTIVE',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SENT_TO_VENDOR = 'SENT_TO_VENDOR',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED'
}

export interface User {
  id: string;
  employeeId: string;
  name: string;
  thaiName?: string;
  email: string;
  role: UserRole;
  departmentId: string;
  departmentName?: string;
  title: string;
  signatureUrl?: string;
  isActive: boolean;
  branch: string;
  company: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  budget: number;
  spent: number;
  remaining: number;
}

export interface Vendor {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  fax?: string;
  taxId: string;
  contactPerson: string;
  creditTerm: string;
}

export interface PRItem {
  id: string;
  itemNo: number;
  partNo: string;
  description: string;
  specification?: string;
  unit: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  uploadedBy: string;
  url: string; // Base64 or local URL
}

export interface SignatureDetails {
  signedBy: string;
  role: UserRole;
  title: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  browser: string;
  device: string;
  geoCoordinates?: string;
  signatureData: string; // Base64 drawing
  companyStampData?: string; // Base64 company stamp image if uploaded
  digitalHash: string; // SHA-256 visual checksum
}

export interface WorkflowLog {
  id: string;
  action: string; // e.g. 'CREATED', 'APPROVED', 'REJECTED', 'COMMENTED'
  stepName: string;
  performedBy: string;
  userName: string;
  userRole: UserRole;
  comment?: string;
  timestamp: string;
  signature?: SignatureDetails;
}

export interface PR {
  id: string;
  prNumber: string;
  date: string;
  requestorId: string;
  requestorName: string;
  requestorEmail: string;
  departmentId: string;
  departmentName: string;
  suggestedVendorId: string;
  vendorName: string;
  vendorAddress: string;
  vendorPhone: string;
  vendorFax?: string;
  vendorTaxId: string;
  items: PRItem[];
  purchaseObjective: string;
  subtotal: number;
  vat: number; // 7%
  grandTotal: number;
  status: PRStatus;
  attachments: Attachment[];
  workflowLogs: WorkflowLog[];
  currentStepIndex: number;
  companyName: string;
  branchName: string;
}

export interface PO {
  id: string;
  poNumber: string;
  referPrId: string;
  referPrNumber: string;
  date: string;
  vendorId: string;
  vendorName: string;
  vendorAddress: string;
  vendorPhone: string;
  vendorFax?: string;
  vendorTaxId: string;
  shippingAddress: string;
  departmentId: string;
  departmentName: string;
  creditTerm: string;
  items: PRItem[]; // same structure as PR items
  subtotal: number;
  vat: number;
  grandTotal: number;
  status: POStatus;
  notes: string;
  attachments: Attachment[];
  workflowLogs: WorkflowLog[];
  currentStepIndex: number;
  companyName: string;
  branchName: string;
  invoiceUrl?: string;
  deliveryUrl?: string;
  depositUrl?: string;
}

export interface WorkflowRule {
  id: string;
  departmentId: string; // 'ALL' or specific
  amountLimit: number; // e.g. 100,000 THB limit for manager
  requireExecutiveApproval: boolean;
  parallelApproval: boolean;
  delegateActive: boolean;
  delegateUserId?: string;
}

export interface NotificationLog {
  id: string;
  recipientEmail: string;
  recipientName: string;
  title: string;
  message: string;
  channel: 'EMAIL' | 'LINE' | 'TEAMS' | 'WEB';
  timestamp: string;
  isRead: boolean;
  status: 'SENT' | 'FAILED';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  module: 'PR' | 'PO' | 'AUTH' | 'WORKFLOW' | 'SYSTEM' | 'COMPARISON';
  details: string;
  ipAddress: string;
  userAgent: string;
}

export interface VendorOffer {
  vendorId: string;
  vendorName: string;
  unitPrice: number;
  totalPrice: number;
  isBestOffer: boolean;
}

export interface ComparisonItem {
  id: string;
  prItemId?: string;
  partNo: string;
  description: string;
  specification?: string;
  unit: string;
  qty: number;
  offers: VendorOffer[];
  selectedVendorId?: string;
  selectedPrice?: number;
  poCreated?: boolean;
  poNumber?: string;
}

export interface ComparisonSheet {
  id: string;
  csNumber: string;
  date: string;
  referPrId?: string;
  referPrNumber?: string;
  departmentId: string;
  departmentName: string;
  status: 'DRAFT' | 'COMPLETED' | 'PO_CREATED' | 'PARTIALLY_PO_CREATED';
  items: ComparisonItem[];
  createdById: string;
  createdByName: string;
  createdAt: string;
  notes?: string;
  workflowLogs?: WorkflowLog[];
  currentStepIndex?: number;
}

export enum CapexStatus {
  DRAFT = 'DRAFT',
  PENDING_DEPT_MGR = 'PENDING_DEPT_MGR',
  PENDING_EXECUTIVE = 'PENDING_EXECUTIVE',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface CapexRequisition {
  id: string;
  capexNumber: string;
  date: string;
  requestorId: string;
  requestorName: string;
  requestorEmail: string;
  departmentId: string;
  departmentName: string;
  assetGroup: string;
  projectName: string;
  budgetStatus: 'WITHIN_BUDGET' | 'SPECIAL_REQUEST';
  totalInvestment: number;
  paybackPeriod: number;
  costSavingsPerYear: number;
  npvIrr?: string;
  items: PRItem[];
  purchaseObjective: string;
  subtotal: number;
  vat: number;
  grandTotal: number;
  status: CapexStatus;
  attachments: Attachment[];
  workflowLogs: WorkflowLog[];
  currentStepIndex: number;
  companyName: string;
  branchName: string;
}

export interface ChatRoom {
  id: string;
  name?: string;
  type: 'PRIVATE' | 'GROUP';
  participantIds: string[];
  lastMessage?: string;
  lastMessageAt?: string;
  createdAt: string;
  unreadCounts?: Record<string, number>; // unread count per user
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
  readBy?: string[]; // list of user IDs who read this message
}

