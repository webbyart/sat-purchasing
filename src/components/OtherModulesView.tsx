/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  FileSearch, 
  CalendarClock, 
  Coins, 
  Wallet, 
  CreditCard, 
  Undo2, 
  PlusCircle, 
  TrendingUp, 
  Ship, 
  Scale, 
  FileText, 
  Check, 
  Clock, 
  Truck, 
  ChevronRight, 
  Search, 
  Printer, 
  Plus, 
  Building2, 
  AlertCircle 
} from 'lucide-react';
import { motion } from 'motion/react';
import { User, PO, PR } from '../types.js';

interface OtherModulesViewProps {
  currentUser: User;
  pos: PO[];
  prs: PR[];
  onNavigate: (view: string, id?: string) => void;
}

type TabType = 'survey' | 'delivery' | 'deposit' | 'cash' | 'credit' | 'return' | 'debit_adjust' | 'landed';

export default function OtherModulesView({ currentUser, pos, prs, onNavigate }: OtherModulesViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('survey');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data lists state
  const [surveys, setSurveys] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [cashPurchases, setCashPurchases] = useState<any[]>([]);
  const [creditPurchases, setCreditPurchases] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [landedCosts, setLandedCosts] = useState<any[]>([]);

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields state
  const [formData, setFormData] = useState<any>({
    vendorName: '',
    contactPerson: '',
    phone: '',
    date: new Date().toISOString().split('T')[0],
    poId: '',
    expectedDate: '',
    carrier: '',
    trackingNo: '',
    amount: '',
    paymentMethod: 'Bank Transfer',
    refNo: '',
    invoiceNo: '',
    taxInvoiceNo: '',
    creditTerm: '30 Days',
    reason: '',
    dutyCost: '',
    freightCost: '',
    insuranceCost: '',
    handlingCost: ''
  });

  // Fetch all lists from backend
  const fetchModuleData = async () => {
    try {
      const res = await fetch('/api/other-modules').then(r => r.json());
      setSurveys(res.surveys || []);
      setDeliveries(res.deliveries || []);
      setDeposits(res.deposits || []);
      setCashPurchases(res.cashPurchases || []);
      setCreditPurchases(res.creditPurchases || []);
      setReturns(res.returns || []);
      setAdjustments(res.adjustments || []);
      setLandedCosts(res.landedCosts || []);
    } catch (e) {
      console.error('Failed fetching modules data', e);
    }
  };

  useEffect(() => {
    fetchModuleData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = { ...formData, tab: activeTab, userId: currentUser.id, userName: currentUser.thaiName || currentUser.name };
      const res = await fetch('/api/other-modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowAddForm(false);
        // Reset form
        setFormData({
          vendorName: '',
          contactPerson: '',
          phone: '',
          date: new Date().toISOString().split('T')[0],
          poId: '',
          expectedDate: '',
          carrier: '',
          trackingNo: '',
          amount: '',
          paymentMethod: 'Bank Transfer',
          refNo: '',
          invoiceNo: '',
          taxInvoiceNo: '',
          creditTerm: '30 Days',
          reason: '',
          dutyCost: '',
          freightCost: '',
          insuranceCost: '',
          handlingCost: ''
        });
        fetchModuleData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = (item: any) => {
    window.print();
  };

  // Helper lists filtering
  const approvedPOs = pos.filter(po => po.status === 'APPROVED' || po.status === 'SENT_TO_VENDOR');

  const tabs: { id: TabType; name: string; icon: any; color: string }[] = [
    { id: 'survey', name: 'สำรวจราคา (Survey)', icon: FileSearch, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { id: 'delivery', name: 'กำหนดวันรับสินค้า', icon: CalendarClock, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { id: 'deposit', name: 'จ่ายเงินมัดจำ', icon: Coins, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { id: 'cash', name: 'ซื้อสด (Cash)', icon: Wallet, color: 'text-sky-600 bg-sky-50 border-sky-200' },
    { id: 'credit', name: 'ซื้อเชื่อ (Credit)', icon: CreditCard, color: 'text-violet-600 bg-violet-50 border-violet-200' },
    { id: 'return', name: 'ส่งคืน / ลดหนี้', icon: Undo2, color: 'text-rose-600 bg-rose-50 border-rose-200' },
    { id: 'debit_adjust', name: 'เพิ่มหนี้', icon: TrendingUp, color: 'text-fuchsia-600 bg-fuchsia-50 border-fuchsia-200' },
    { id: 'landed', name: 'Landed Cost', icon: Ship, color: 'text-teal-600 bg-teal-50 border-teal-200' }
  ];

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="text-left">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-sky-600" />
            ระบบบริหารการซื้อและการชำระเงินที่เกี่ยวข้อง
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            โมดูลเสริมสำหรับดูแลตรวจสอบใบสำคัญสำรวจราคา การรับสินค้า บันทึกการซื้อสด ซื้อเชื่อ บันทึกส่งคืนและลดหนี้ ตลอดจนการกระจายต้นทุน Landed Cost
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer"
          >
            {showAddForm ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showAddForm ? 'ปิดหน้าต่างบันทึก' : 'บันทึกรายการใหม่'}
          </button>
        </div>
      </div>

      {/* Tabs list navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setShowAddForm(false);
              }}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                isActive 
                  ? 'bg-sky-600 border-sky-600 text-white shadow-md' 
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <Icon className={`h-5 w-5 mb-1.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span className="text-[10px] font-bold line-clamp-1">{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Adding Document Form Overlay */}
      {showAddForm && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm text-left max-w-3xl mx-auto"
        >
          <div className="border-b border-slate-100 pb-3 mb-4 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <PlusCircle className="h-5 w-5 text-sky-600" />
              บันทึกเอกสาร: {tabs.find(t => t.id === activeTab)?.name}
            </h3>
            <span className="text-[10px] font-mono bg-sky-50 text-sky-700 border border-sky-200 px-2.5 py-0.5 rounded font-bold uppercase">
              {activeTab}
            </span>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">วันที่บันทึก / วันออกเอกสาร</label>
                <input
                  type="date"
                  name="date"
                  required
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Dynamic form inputs depending on tab */}
              {activeTab === 'survey' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">ชื่อผู้เสนอราคา / ผู้ขาย</label>
                    <input
                      type="text"
                      name="vendorName"
                      required
                      placeholder="เช่น บจก. เอบีซี ออโตเมชั่น"
                      value={formData.vendorName}
                      onChange={handleInputChange}
                      className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">ชื่อผู้ติดต่อ</label>
                    <input
                      type="text"
                      name="contactPerson"
                      placeholder="เช่น คุณสมชาย"
                      value={formData.contactPerson}
                      onChange={handleInputChange}
                      className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">เบอร์โทรศัพท์ผู้ติดต่อ</label>
                    <input
                      type="text"
                      name="phone"
                      placeholder="เช่น 02-123-4567"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">รายละเอียดการเสนอราคา / ราคาเปรียบเทียบเบื้องต้น</label>
                    <textarea
                      name="reason"
                      rows={2}
                      placeholder="เช่น เสนอราคา Bracket AP-PL-902 ชิ้นละ 250 บาท ยืนราคา 30 วัน มีของพร้อมส่ง"
                      value={formData.reason}
                      onChange={handleInputChange}
                      className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </>
              )}

              {(activeTab === 'delivery' || activeTab === 'deposit') && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">อ้างอิงใบสั่งซื้อ (PO)</label>
                    <select
                      name="poId"
                      required
                      value={formData.poId}
                      onChange={handleInputChange}
                      className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 bg-white"
                    >
                      <option value="">-- กรุณาเลือกใบสั่งซื้อ --</option>
                      {approvedPOs.map((po: PO) => (
                        <option key={po.id} value={po.id}>
                          {po.poNumber} ({po.vendorName}) - {po.grandTotal.toLocaleString()} THB
                        </option>
                      ))}
                    </select>
                  </div>

                  {activeTab === 'delivery' && (
                    <>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">กำหนดวันรับสินค้าจริง</label>
                        <input
                          type="date"
                          name="expectedDate"
                          required
                          value={formData.expectedDate}
                          onChange={handleInputChange}
                          className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">ผู้ขนส่ง / ขนส่งโดย</label>
                        <input
                          type="text"
                          name="carrier"
                          placeholder="เช่น Kerry Express, DHL, แผนกจัดส่งของผู้เสนอราคา"
                          value={formData.carrier}
                          onChange={handleInputChange}
                          className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">เลขที่ติดตาม (Tracking No.) / ทะเบียนรถ</label>
                        <input
                          type="text"
                          name="trackingNo"
                          placeholder="เช่น TH0123456789 หรือ 3กข-1234"
                          value={formData.trackingNo}
                          onChange={handleInputChange}
                          className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                        />
                      </div>
                    </>
                  )}

                  {activeTab === 'deposit' && (
                    <>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">จำนวนเงินมัดจำที่จ่าย (THB)</label>
                        <input
                          type="number"
                          name="amount"
                          required
                          placeholder="เช่น 15000"
                          value={formData.amount}
                          onChange={handleInputChange}
                          className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">ช่องทางการชำระเงิน</label>
                        <select
                          name="paymentMethod"
                          value={formData.paymentMethod}
                          onChange={handleInputChange}
                          className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 bg-white"
                        >
                          <option value="Bank Transfer">เงินโอนธนาคาร (Bank Transfer)</option>
                          <option value="Cash">เงินสด (Cash)</option>
                          <option value="Check">เช็คธนาคาร (Cheque)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">เลขที่อ้างอิงการจ่าย / สลิปโอนเงิน</label>
                        <input
                          type="text"
                          name="refNo"
                          placeholder="เช่น SLIP-00123"
                          value={formData.refNo}
                          onChange={handleInputChange}
                          className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              {(activeTab === 'cash' || activeTab === 'credit') && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">ผู้จัดจำหน่าย / Vendor</label>
                    <input
                      type="text"
                      name="vendorName"
                      required
                      placeholder="เช่น บจก. พลังงานสยาม"
                      value={formData.vendorName}
                      onChange={handleInputChange}
                      className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">เลขที่ใบส่งของ / เลขที่ใบกำกับภาษี</label>
                    <input
                      type="text"
                      name="taxInvoiceNo"
                      placeholder="เช่น INV-9001"
                      required
                      value={formData.taxInvoiceNo}
                      onChange={handleInputChange}
                      className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">ยอดรวมค่าใช้จ่ายทั้งหมด (THB)</label>
                    <input
                      type="number"
                      name="amount"
                      required
                      placeholder="เช่น 3500"
                      value={formData.amount}
                      onChange={handleInputChange}
                      className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  {activeTab === 'credit' && (
                    <>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">เงื่อนไขการชำระเงิน (Credit Term)</label>
                        <select
                          name="creditTerm"
                          value={formData.creditTerm}
                          onChange={handleInputChange}
                          className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 bg-white"
                        >
                          <option value="15 Days">15 วัน</option>
                          <option value="30 Days">30 วัน</option>
                          <option value="45 Days">45 วัน</option>
                          <option value="60 Days">60 วัน</option>
                        </select>
                      </div>
                    </>
                  )}
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">รายละเอียดรายการของที่ซื้อ</label>
                    <textarea
                      name="reason"
                      rows={2}
                      placeholder="เช่น สั่งซื้อน้ำมันหล่อลื่นเครื่องจักร จำนวน 3 ถัง สำหรับงานซ่อมบำรุงในโรงงาน"
                      value={formData.reason}
                      onChange={handleInputChange}
                      className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </>
              )}

              {(activeTab === 'return' || activeTab === 'debit_adjust') && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">ผู้ขาย (ระบุเพื่อลดหนี้หรือเพิ่มหนี้)</label>
                    <input
                      type="text"
                      name="vendorName"
                      required
                      placeholder="เช่น บจก. ชลบุรี อะไหล่ยนต์"
                      value={formData.vendorName}
                      onChange={handleInputChange}
                      className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">อ้างอิงเลขที่ใบกำกับภาษีเดิม</label>
                    <input
                      type="text"
                      name="taxInvoiceNo"
                      required
                      placeholder="เช่น INV-8820"
                      value={formData.taxInvoiceNo}
                      onChange={handleInputChange}
                      className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">มูลค่าเงินปรับปรุงลด/เพิ่มภาษี (THB)</label>
                    <input
                      type="number"
                      name="amount"
                      required
                      placeholder="เช่น 1200"
                      value={formData.amount}
                      onChange={handleInputChange}
                      className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">เหตุผลในการ {activeTab === 'return' ? 'ส่งคืนสินค้า/ลดราคาสินค้า' : 'เพิ่มราคา/ปรับปรุงภาษีเพิ่มเติม'}</label>
                    <input
                      type="text"
                      name="reason"
                      required
                      placeholder="เช่น สินค้าชำรุดเสียหายจากโรงงาน หรือ ราคาคิดต่ำเกินจริง"
                      value={formData.reason}
                      onChange={handleInputChange}
                      className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </>
              )}

              {activeTab === 'landed' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">อ้างอิงใบสั่งซื้อหลัก (PO)</label>
                    <select
                      name="poId"
                      required
                      value={formData.poId}
                      onChange={handleInputChange}
                      className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 bg-white"
                    >
                      <option value="">-- กรุณาเลือกใบสั่งซื้อเพื่อเกลี่ยต้นทุน --</option>
                      {approvedPOs.map((po: PO) => (
                        <option key={po.id} value={po.id}>
                          {po.poNumber} ({po.vendorName}) - {po.grandTotal.toLocaleString()} THB
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">ค่าขนส่งต่างประเทศ (Freight, THB)</label>
                    <input
                      type="number"
                      name="freightCost"
                      placeholder="เช่น 8500"
                      value={formData.freightCost}
                      onChange={handleInputChange}
                      className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">ภาษีนำเข้า / พิธีการศุลกากร (Duty Cost, THB)</label>
                    <input
                      type="number"
                      name="dutyCost"
                      placeholder="เช่น 4200"
                      value={formData.dutyCost}
                      onChange={handleInputChange}
                      className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">ค่าประกันภัยขนส่ง (Insurance, THB)</label>
                    <input
                      type="number"
                      name="insuranceCost"
                      placeholder="เช่น 1500"
                      value={formData.insuranceCost}
                      onChange={handleInputChange}
                      className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">ค่าแรงเคลียร์ของ / รถขนส่งในประเทศ (THB)</label>
                    <input
                      type="number"
                      name="handlingCost"
                      placeholder="เช่น 3000"
                      value={formData.handlingCost}
                      onChange={handleInputChange}
                      className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกรายการ'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Main Grid display area */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs text-left">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              รายการบันทึกทั้งหมด ({
                activeTab === 'survey' ? surveys.length :
                activeTab === 'delivery' ? deliveries.length :
                activeTab === 'deposit' ? deposits.length :
                activeTab === 'cash' ? cashPurchases.length :
                activeTab === 'credit' ? creditPurchases.length :
                activeTab === 'return' ? returns.length :
                activeTab === 'debit_adjust' ? adjustments.length :
                landedCosts.length
              } รายการ)
            </h2>
            <p className="text-[11px] text-slate-500">พิมพ์ตรวจสอบ ค้นหา และวิเคราะห์ข้อมูลในแต่ละรายการได้</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหารายการ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Dynamic List Rendering */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <th className="p-3 text-left w-28">เลขที่เอกสาร</th>
                <th className="p-3 text-left">วันที่ทำรายการ</th>
                <th className="p-3 text-left">รายละเอียด</th>
                <th className="p-3 text-left">ผู้ทำรายการ</th>
                <th className="p-3 text-right">จำนวนเงินรวม (THB)</th>
                <th className="p-3 text-center w-24">การพิมพ์</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* SURVEYS */}
              {activeTab === 'survey' && surveys.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="p-3 font-mono font-bold text-sky-800">{item.docNo || `SRV-${item.id.substring(0,6).toUpperCase()}`}</td>
                  <td className="p-3 text-slate-600">{item.date}</td>
                  <td className="p-3 text-slate-800">
                    <p className="font-bold">{item.vendorName}</p>
                    <p className="text-[10px] text-slate-500">ติดต่อ: {item.contactPerson} ({item.phone})</p>
                    <p className="text-[10px] text-slate-600 bg-amber-50/70 border border-amber-100 p-1.5 rounded-md mt-1 italic">{item.reason}</p>
                  </td>
                  <td className="p-3 text-slate-600">{item.userName || 'System Auto'}</td>
                  <td className="p-3 text-right font-bold text-slate-900">-</td>
                  <td className="p-3 text-center">
                    <button onClick={() => handlePrint(item)} className="p-1 text-slate-400 hover:text-sky-600 cursor-pointer">
                      <Printer className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {/* DELIVERIES */}
              {activeTab === 'delivery' && deliveries.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="p-3 font-mono font-bold text-sky-800">{`DLV-${item.id.substring(0,6).toUpperCase()}`}</td>
                  <td className="p-3 text-slate-600">{item.date}</td>
                  <td className="p-3 text-slate-800">
                    <p className="font-bold flex items-center gap-1 text-indigo-700">
                      <Truck className="h-3.5 w-3.5" />
                      อ้างอิงใบสั่งซื้อ: {item.poNumber || 'PO260001'}
                    </p>
                    <p className="text-[10px] text-slate-500">กำหนดส่งมอบ: {item.expectedDate}</p>
                    <p className="text-[10px] text-slate-500">จัดส่งโดย: {item.carrier} (Tracking: {item.trackingNo})</p>
                  </td>
                  <td className="p-3 text-slate-600">{item.userName}</td>
                  <td className="p-3 text-right font-bold text-slate-900">-</td>
                  <td className="p-3 text-center">
                    <button onClick={() => handlePrint(item)} className="p-1 text-slate-400 hover:text-sky-600 cursor-pointer">
                      <Printer className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {/* DEPOSITS */}
              {activeTab === 'deposit' && deposits.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="p-3 font-mono font-bold text-sky-800">{`DPS-${item.id.substring(0,6).toUpperCase()}`}</td>
                  <td className="p-3 text-slate-600">{item.date}</td>
                  <td className="p-3 text-slate-800">
                    <p className="font-bold">มัดจำใบสั่งซื้อ: {item.poNumber || 'PO260002'}</p>
                    <p className="text-[10px] text-slate-500">ช่องทาง: {item.paymentMethod} (Ref: {item.refNo})</p>
                  </td>
                  <td className="p-3 text-slate-600">{item.userName}</td>
                  <td className="p-3 text-right font-bold text-emerald-600">{parseFloat(item.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                  <td className="p-3 text-center">
                    <button onClick={() => handlePrint(item)} className="p-1 text-slate-400 hover:text-sky-600 cursor-pointer">
                      <Printer className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {/* CASH PURCHASES */}
              {activeTab === 'cash' && cashPurchases.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="p-3 font-mono font-bold text-sky-800">{`CSH-${item.id.substring(0,6).toUpperCase()}`}</td>
                  <td className="p-3 text-slate-600">{item.date}</td>
                  <td className="p-3 text-slate-800">
                    <p className="font-bold">จ่ายสดให้: {item.vendorName}</p>
                    <p className="text-[10px] text-slate-500">เลขที่ใบเสร็จรับเงิน/ใบกำกับภาษี: {item.taxInvoiceNo}</p>
                    <p className="text-[10px] text-slate-600 italic">{item.reason}</p>
                  </td>
                  <td className="p-3 text-slate-600">{item.userName}</td>
                  <td className="p-3 text-right font-bold text-slate-900">{parseFloat(item.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                  <td className="p-3 text-center">
                    <button onClick={() => handlePrint(item)} className="p-1 text-slate-400 hover:text-sky-600 cursor-pointer">
                      <Printer className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {/* CREDIT PURCHASES */}
              {activeTab === 'credit' && creditPurchases.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="p-3 font-mono font-bold text-sky-800">{`CRD-${item.id.substring(0,6).toUpperCase()}`}</td>
                  <td className="p-3 text-slate-600">{item.date}</td>
                  <td className="p-3 text-slate-800">
                    <p className="font-bold">ตั้งหนี้เจ้าหนี้: {item.vendorName}</p>
                    <p className="text-[10px] text-slate-500">เลขที่ใบกำกับภาษี: {item.taxInvoiceNo} (เครดิตเทอม: {item.creditTerm})</p>
                    <p className="text-[10px] text-slate-600 italic">{item.reason}</p>
                  </td>
                  <td className="p-3 text-slate-600">{item.userName}</td>
                  <td className="p-3 text-right font-bold text-slate-900">{parseFloat(item.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                  <td className="p-3 text-center">
                    <button onClick={() => handlePrint(item)} className="p-1 text-slate-400 hover:text-sky-600 cursor-pointer">
                      <Printer className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {/* RETURNS / DEBIT NOTES */}
              {activeTab === 'return' && returns.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="p-3 font-mono font-bold text-sky-800">{`RTN-${item.id.substring(0,6).toUpperCase()}`}</td>
                  <td className="p-3 text-slate-600">{item.date}</td>
                  <td className="p-3 text-slate-800">
                    <p className="font-bold text-rose-600">ลดหนี้ให้กับ: {item.vendorName}</p>
                    <p className="text-[10px] text-slate-500">อ้างอิงใบกำกับภาษีเดิม: {item.taxInvoiceNo}</p>
                    <p className="text-[10px] text-slate-500">เหตุผลส่งคืน: {item.reason}</p>
                  </td>
                  <td className="p-3 text-slate-600">{item.userName}</td>
                  <td className="p-3 text-right font-bold text-rose-600">-{parseFloat(item.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                  <td className="p-3 text-center">
                    <button onClick={() => handlePrint(item)} className="p-1 text-slate-400 hover:text-sky-600 cursor-pointer">
                      <Printer className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {/* CREDIT ADJUSTMENTS */}
              {activeTab === 'debit_adjust' && adjustments.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="p-3 font-mono font-bold text-sky-800">{`ADJ-${item.id.substring(0,6).toUpperCase()}`}</td>
                  <td className="p-3 text-slate-600">{item.date}</td>
                  <td className="p-3 text-slate-800">
                    <p className="font-bold text-fuchsia-600">เพิ่มหนี้ / ปรับปรุงเพิ่มราคา: {item.vendorName}</p>
                    <p className="text-[10px] text-slate-500">อ้างอิงใบกำกับภาษีเดิม: {item.taxInvoiceNo}</p>
                    <p className="text-[10px] text-slate-500">เหตุผลปรับราคา: {item.reason}</p>
                  </td>
                  <td className="p-3 text-slate-600">{item.userName}</td>
                  <td className="p-3 text-right font-bold text-fuchsia-600">+{parseFloat(item.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                  <td className="p-3 text-center">
                    <button onClick={() => handlePrint(item)} className="p-1 text-slate-400 hover:text-sky-600 cursor-pointer">
                      <Printer className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {/* LANDED COSTS */}
              {activeTab === 'landed' && landedCosts.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="p-3 font-mono font-bold text-sky-800">{`LDC-${item.id.substring(0,6).toUpperCase()}`}</td>
                  <td className="p-3 text-slate-600">{item.date}</td>
                  <td className="p-3 text-slate-800">
                    <p className="font-bold text-teal-700">เกลี่ยต้นทุนนำเข้า PO: {item.poNumber || 'PO260003'}</p>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-slate-500 mt-1 max-w-sm">
                      <span>• ค่าขนส่งเรือ/แอร์: {parseFloat(item.freightCost || 0).toLocaleString()} THB</span>
                      <span>• ภาษีและพิธีการศุลกากร: {parseFloat(item.dutyCost || 0).toLocaleString()} THB</span>
                      <span>• ประกันภัยสินค้า: {parseFloat(item.insuranceCost || 0).toLocaleString()} THB</span>
                      <span>• จัดส่งในประเทศ: {parseFloat(item.handlingCost || 0).toLocaleString()} THB</span>
                    </div>
                  </td>
                  <td className="p-3 text-slate-600">{item.userName}</td>
                  <td className="p-3 text-right font-bold text-teal-600">
                    {((parseFloat(item.freightCost || 0)) + 
                      (parseFloat(item.dutyCost || 0)) + 
                      (parseFloat(item.insuranceCost || 0)) + 
                      (parseFloat(item.handlingCost || 0))).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-center">
                    <button onClick={() => handlePrint(item)} className="p-1 text-slate-400 hover:text-sky-600 cursor-pointer">
                      <Printer className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {/* EMPTY STATE */}
              {((activeTab === 'survey' && surveys.length === 0) ||
                (activeTab === 'delivery' && deliveries.length === 0) ||
                (activeTab === 'deposit' && deposits.length === 0) ||
                (activeTab === 'cash' && cashPurchases.length === 0) ||
                (activeTab === 'credit' && creditPurchases.length === 0) ||
                (activeTab === 'return' && returns.length === 0) ||
                (activeTab === 'debit_adjust' && adjustments.length === 0) ||
                (activeTab === 'landed' && landedCosts.length === 0)) && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    ไม่มีรายการบันทึกสำหรับโมดูลนี้ในขณะนี้ คลิกปุ่ม "บันทึกรายการใหม่" ด้านบนเพื่อเพิ่มข้อมูลลงในระบบฐานข้อมูลคลาวด์จริง (Firestore)
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
