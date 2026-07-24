import React, { useState } from 'react';
import { 
  BookOpen, 
  FileText, 
  CheckCircle2, 
  Building, 
  Scale, 
  FileCheck, 
  Printer, 
  HelpCircle, 
  ShieldCheck, 
  Users, 
  ArrowRight, 
  Search, 
  ChevronRight, 
  Clock, 
  AlertTriangle, 
  Send, 
  Download, 
  Sparkles,
  Zap,
  Info,
  Layers,
  FileSignature
} from 'lucide-react';

interface UserManualViewProps {
  onNavigate: (view: string, id?: string) => void;
}

export default function UserManualView({ onNavigate }: UserManualViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'roles' | 'matrix' | 'documents' | 'faq'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtering helper
  const matchesSearch = (text: string) => {
    if (!searchQuery) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  return (
    <div className="space-y-6 text-slate-800 font-sans pb-12">
      {/* Page Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-sky-900 text-white rounded-2xl p-6 md:p-8 shadow-lg border border-slate-700 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-sky-500/20 text-sky-300 px-3 py-1 rounded-full text-xs font-bold border border-sky-400/30">
              <BookOpen className="h-4 w-4" />
              <span>SYSTEM USER MANUAL & GUIDE v2.5</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
              คู่มือการใช้งานระบบจัดซื้อจัดจ้าง (Smart e-Purchase Guide)
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-normal">
              คำอธิบายขั้นตอนการทำงาน วงเงินสายอนุมัติ การออกเอกสาร A4 และการใช้งานสิทธิ์บทบาทต่างๆ อย่างละเอียดยิบ
            </p>
          </div>

          <div className="flex flex-wrap gap-2 cursor-pointer shrink-0">
            <button
              onClick={() => window.print()}
              className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 py-2 rounded-xl border border-white/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Printer className="h-4 w-4 text-sky-300" />
              <span>พิมพ์คู่มือการใช้งาน</span>
            </button>
            <button
              onClick={() => onNavigate('pr-new')}
              className="bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="h-4 w-4" />
              <span>ทดลองสร้าง PR ใหม่</span>
            </button>
          </div>
        </div>

        {/* Search Bar inside Manual */}
        <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาหัวข้อคู่มือ เช่น 'สายอนุมัติ', 'CS', 'วิธีอนุมัติ', 'พิมพ์ A4'..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-600 rounded-xl text-xs text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-sky-400 font-sans"
              id="manual-search-input"
            />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-sky-300 hover:underline cursor-pointer"
            >
              ล้างคำค้นหา
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 scrollbar-hidden">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>1. ภาพรวมกระบวนการ (Workflow Overview)</span>
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'roles'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>2. คู่มือตามบทบาทผู้ใช้ (Guide by Role)</span>
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'matrix'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Zap className="h-4 w-4" />
          <span>3. เงื่อนไขสายอนุมัติ (Approval Matrix)</span>
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'documents'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Printer className="h-4 w-4" />
          <span>4. การออกเอกสาร & พิมพ์ A4</span>
        </button>

        <button
          onClick={() => setActiveTab('faq')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'faq'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <HelpCircle className="h-4 w-4" />
          <span>5. คำถามที่พบบ่อย (FAQ)</span>
        </button>
      </div>

      {/* TAB 1: WORKFLOW OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Visual Step-by-Step Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Step 1 */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs hover:border-sky-300 transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-sky-100 text-sky-800 font-extrabold text-[10px] px-3 py-1 rounded-bl-xl font-mono">
                STEP 01
              </div>
              <div className="h-10 w-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">1. สร้างใบขอซื้อ (PR Request)</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                พนักงาน (Requestor) กรอกข้อมูลรายการสินค้า/บริการ เลือกแผนก แนบไฟล์ Quotation / Drawing และระบุวัตถุประสงค์
              </p>
              <div className="pt-2">
                <button
                  onClick={() => onNavigate('pr-new')}
                  className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>ลองสร้าง PR</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs hover:border-amber-300 transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-amber-100 text-amber-800 font-extrabold text-[10px] px-3 py-1 rounded-bl-xl font-mono">
                STEP 02
              </div>
              <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">2. อนุมัติตามสายงาน (Approval)</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                ระบบส่งแจ้งเตือนไปยังผู้จัดการแผนก และผู้บริหารอนุมัติพร้อมประทับลายเซ็นดิจิทัลอัตโนมัติ
              </p>
              <div className="pt-2">
                <button
                  onClick={() => onNavigate('pr')}
                  className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>ตรวจรายการ PR</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs hover:border-purple-300 transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-purple-100 text-purple-800 font-extrabold text-[10px] px-3 py-1 rounded-bl-xl font-mono">
                STEP 03
              </div>
              <div className="h-10 w-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Scale className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">3. ตารางเปรียบเทียบราคา (CS)</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                จัดซื้อสร้างตาราง Comparison Sheet เปรียบเทียบใบเสนอราคาอย่างน้อย 3 รายเพื่อคัดเลือก Vendor ที่คุ้มค่าที่สุด
              </p>
              <div className="pt-2">
                <button
                  onClick={() => onNavigate('comparison')}
                  className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>ดูตาราง CS</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs hover:border-emerald-300 transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-emerald-100 text-emerald-800 font-extrabold text-[10px] px-3 py-1 rounded-bl-xl font-mono">
                STEP 04
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <FileCheck className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">4. ออกใบสั่งซื้อ (PO Creation)</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                แปลง PR ที่ผ่านการอนุมัติสมบูรณ์เป็น PO ส่งออกฟอร์ม A4 ให้ผู้ขายและรับสินค้าเข้าคลัง
              </p>
              <div className="pt-2">
                <button
                  onClick={() => onNavigate('po')}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>ดูรายการ PO</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Comprehensive Process Flow Explanation Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Layers className="h-4.5 w-4.5 text-sky-400" />
                ตารางอธิบายรายละเอียดกระบวนการจัดซื้อ (Process Details Breakdown)
              </h3>
              <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded border border-slate-700">
                SUMINO AAPICO STANDARD
              </span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {/* Row 1 */}
              <div className="p-4 hover:bg-slate-50/50 flex flex-col md:flex-row gap-4 items-start">
                <div className="w-full md:w-56 shrink-0 space-y-1">
                  <span className="bg-sky-100 text-sky-800 text-[10px] font-extrabold px-2 py-0.5 rounded font-mono">
                    STAGE 1: INPUT & PR CREATION
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm">การจัดเตรียมเอกสารตั้งต้น</h4>
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-slate-600 leading-relaxed">
                    ผู้ร้องขอ (Requestor) ต้องเตรียมเอกสารประกอบการขอซื้อ ได้แก่:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-700">
                    <li><strong>ใบเสนอราคา (Quotation):</strong> จากผู้ขายอย่างน้อย 1 ราย (หรือ 3 รายหากมีมูลค่าสูง)</li>
                    <li><strong>รายละเอียดสเปก/Drawing/รูปถ่าย:</strong> เอกสารแนบผ่านระบบ หรือ Google Drive</li>
                    <li><strong>งบประมาณ (Budget Type):</strong> ระบุว่าเป็นงบประมาณปกติ (PR) หรือ งบลงทุนเครื่องจักร (CAPEX)</li>
                  </ul>
                </div>
              </div>

              {/* Row 2 */}
              <div className="p-4 hover:bg-slate-50/50 flex flex-col md:flex-row gap-4 items-start">
                <div className="w-full md:w-56 shrink-0 space-y-1">
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded font-mono">
                    STAGE 2: AUTOMATIC WORKFLOW
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm">การรันสายการอนุมัติ</h4>
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-slate-600 leading-relaxed">
                    เมื่อกดส่งใบขอซื้อ ระบบจะคำนวณวงเงินและส่งการแจ้งเตือนแบบเรียลไทม์:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-700">
                    <li><strong>ผู้จัดการฝ่าย (Dept Manager):</strong> ตรวจสอบความจำเป็นและงบประมาณของแผนก</li>
                    <li><strong>เจ้าหน้าที่จัดซื้อ (Purchasing):</strong> ตรวจสอบราคา ตาราง CS และเงื่อนไขการชำระเงิน (Credit Terms)</li>
                    <li><strong>ผู้บริหารสูงสุด (MD / Executive):</strong> อนุมัติขั้นสุดท้ายสำหรับยอดเกิน 200,000 THB หรือ CAPEX</li>
                  </ul>
                </div>
              </div>

              {/* Row 3 */}
              <div className="p-4 hover:bg-slate-50/50 flex flex-col md:flex-row gap-4 items-start">
                <div className="w-full md:w-56 shrink-0 space-y-1">
                  <span className="bg-purple-100 text-purple-800 text-[10px] font-extrabold px-2 py-0.5 rounded font-mono">
                    STAGE 3: PRICE COMPARISON
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm">การเปรียบเทียบราคา (CS)</h4>
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-slate-600 leading-relaxed">
                    กรณีที่สเปกสินค้าเหมือนกันหรือเป็นงานรับเหมา:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-700">
                    <li>จัดซื้อสร้าง Comparison Sheet ในระบบเพื่อเปรียบเทียบราคา เงื่อนไขการรับประกัน และระยะเวลาส่งมอบ</li>
                    <li>ระบบเลือก Vendor ที่ผ่านเกณฑ์อัตโนมัติเพื่อใช้เป็นฐานข้อมูลในการสร้าง PO</li>
                  </ul>
                </div>
              </div>

              {/* Row 4 */}
              <div className="p-4 hover:bg-slate-50/50 flex flex-col md:flex-row gap-4 items-start">
                <div className="w-full md:w-56 shrink-0 space-y-1">
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded font-mono">
                    STAGE 4: PO & DELIVERY
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm">การสร้างใบสั่งซื้อ และรับสินค้า</h4>
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-slate-600 leading-relaxed">
                    หลัง PR อนุมัติครบถ้วน จัดซื้อกดยืนยันสร้าง PO:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-700">
                    <li>ระบบสร้างเลข PO26XXXXXX อัตโนมัติ พร้อมประทับตราบริษัท SUMINO AAPICO</li>
                    <li>ส่งเอกสาร PO รูปแบบ A4 ทางไลน์ (LINE Notify) หรือ Email ถึง Vendor</li>
                    <li>เมื่อสินค้ามาส่ง เจ้าหน้าที่รับของและตรวจสอบใบรับสินค้า/Invoice</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GUIDE BY ROLE */}
      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Requestor Guide */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">1. ผู้ขอซื้อ (Requestor / Employee)</h3>
                <p className="text-[11px] text-slate-400">บทบาทพนักงานทุกแผนกที่ต้องการขอซื้อสินค้า/บริการ</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <h4 className="font-bold text-slate-800">ขั้นตอนการใช้งาน:</h4>
              <ol className="list-decimal pl-4 space-y-2">
                <li>ไปที่เมนู <strong>"ใบขอซื้อ (PR)"</strong> &rarr; กดปุ่ม <strong>"+ สร้าง PR ใหม่"</strong></li>
                <li>กรอกวัตถุประสงค์ของการจัดซื้อ เลือกประเภทงบประมาณ</li>
                <li>เพิ่มรายการสินค้า จำนวน และราคาต่อหน่วยจากใบเสนอราคา</li>
                <li>แนบลิงก์หรือไฟล์ใบเสนอราคา (Quotation PDF)</li>
                <li>กด <strong>"ส่งขออนุมัติ PR"</strong> ระบบจะรันส่งให้ผู้จัดการแผนกอนุมัติต่อทันที</li>
              </ol>
            </div>
          </div>

          {/* Department Manager Guide */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">2. ผู้จัดการแผนก (Department Manager)</h3>
                <p className="text-[11px] text-slate-400">ผู้อนุมัติขั้นแรกระดับฝ่าย/แผนก</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <h4 className="font-bold text-slate-800">ขั้นตอนการใช้งาน:</h4>
              <ol className="list-decimal pl-4 space-y-2">
                <li>เมื่อมี PR ใหม่ ระบบจะขึ้นกระดิ่งแจ้งเตือน หรือดูที่รายการ <strong>"รออนุมัติ (Pending)"</strong></li>
                <li>เปิดดูรายละเอียด PR ตรวจสอบเหตุผลความจำเป็น และยอดเงินรวม</li>
                <li>กดปุ่ม <strong>"อนุมัติ (Approve)"</strong> หรือ <strong>"ไม่อนุมัติ / ให้แก้ไข (Reject)"</strong></li>
                <li>ระบบจะประทับลายเซ็นดิจิทัลอัตโนมัติลงในแบบฟอร์ม A4</li>
              </ol>
            </div>
          </div>

          {/* Purchasing Guide */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                <Building className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">3. เจ้าหน้าที่จัดซื้อ (Purchasing Staff)</h3>
                <p className="text-[11px] text-slate-400">ผู้ตรวจสอบราคา เปรียบเทียบผู้ขาย และออก PO</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <h4 className="font-bold text-slate-800">ขั้นตอนการใช้งาน:</h4>
              <ol className="list-decimal pl-4 space-y-2">
                <li>ตรวจสอบ PR ที่ผ่านการอนุมัติจากผู้จัดการแผนกแล้ว</li>
                <li>สร้างตารางเปรียบเทียบราคา (CS) ในกรณีที่ต้องการเทียบราคา 3 ราย</li>
                <li>ตรวจสอบเงื่อนไข เครดิตเทอม และกำหนดส่งมอบ</li>
                <li>กดปุ่ม <strong>"ออกใบสั่งซื้อ (Create PO)"</strong> เพื่อแปลง PR เป็น PO26XXXXXX</li>
              </ol>
            </div>
          </div>

          {/* Executive / MD Guide */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">4. ผู้บริหารสูงสุด (Executive / MD)</h3>
                <p className="text-[11px] text-slate-400">ผู้อนุมัติขั้นสูงสุดสำหรับวงเงินสูงหรือโครงการ CAPEX</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <h4 className="font-bold text-slate-800">ขั้นตอนการใช้งาน:</h4>
              <ol className="list-decimal pl-4 space-y-2">
                <li>พิจารณาอนุมัติรายการ PR ยอดเงินเกิน 200,000 บาท หรือใบขอซื้อเครื่องจักร (CAPEX)</li>
                <li>ตรวจตารางเปรียบเทียบราคา (CS) และเหตุผลประกอบการคัดเลือก Vendor</li>
                <li>กดอนุมัติด้วย Digital Signature เพื่อปลดล็อกการสร้าง PO ของฝ่ายจัดซื้อ</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: APPROVAL MATRIX */}
      {activeTab === 'matrix' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs space-y-0">
          <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Zap className="h-4.5 w-4.5 text-amber-400" />
                ตารางวงเงินและสายการอนุมัติ (Approval Hierarchy Rules)
              </h3>
              <p className="text-[11px] text-slate-300">กำหนดตามระเบียบบริษัท SUMINO AAPICO (Thailand) Company Limited</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs text-slate-700">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 font-extrabold uppercase text-[10px] text-slate-600 font-mono">
                  <th className="p-4">ช่วงวงเงิน (Budget Range)</th>
                  <th className="p-4">ประเภทรายการ</th>
                  <th className="p-4">ลำดับผู้อนุมัติ (Approvers Chain)</th>
                  <th className="p-4">เอกสารประกอบที่ต้องใช้</th>
                  <th className="p-4 text-center">สิทธิ์ออก PO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-900 font-mono">ไม่เกิน 50,000 THB</td>
                  <td className="p-4">วัสดุสิ้นเปลือง / ค่าใช้จ่ายทั่วไป</td>
                  <td className="p-4">
                    <span className="font-semibold text-slate-800">Requestor &rarr; Dept Manager &rarr; Purchasing Staff</span>
                  </td>
                  <td className="p-4 text-slate-500">ใบเสนอราคา 1 ราย</td>
                  <td className="p-4 text-center font-bold text-emerald-600">อัตโนมัติหลัง Dept Mgr อนุมัติ</td>
                </tr>

                <tr className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-900 font-mono">50,000 - 200,000 THB</td>
                  <td className="p-4">อะไหล่เครื่องจักร / รับเหมาบริการ</td>
                  <td className="p-4">
                    <span className="font-semibold text-slate-800">Requestor &rarr; Dept Manager &rarr; Purchasing Manager</span>
                  </td>
                  <td className="p-4 text-slate-500">ใบเสนอราคา 1-2 ราย</td>
                  <td className="p-4 text-center font-bold text-emerald-600">หลัง Purchasing Mgr อนุมัติ</td>
                </tr>

                <tr className="hover:bg-slate-50 bg-amber-50/30">
                  <td className="p-4 font-bold text-amber-900 font-mono">เกิน 200,000 THB</td>
                  <td className="p-4">รายการมูลค่าสูง / เครื่องมือผลิต</td>
                  <td className="p-4">
                    <span className="font-semibold text-amber-900">Requestor &rarr; Dept Manager &rarr; Purchasing &rarr; Executive / MD</span>
                  </td>
                  <td className="p-4 text-amber-800 font-medium">ตารางเปรียบเทียบราคา (CS) อย่างน้อย 3 ราย</td>
                  <td className="p-4 text-center font-bold text-amber-700">ต้องรอ MD อนุมัติเท่านั้น</td>
                </tr>

                <tr className="hover:bg-slate-50 bg-purple-50/30">
                  <td className="p-4 font-bold text-purple-900 font-mono">CAPEX (งบลงทุน)</td>
                  <td className="p-4">แม่พิมพ์ / เครื่องจักรใหม่ / อาคาร</td>
                  <td className="p-4">
                    <span className="font-semibold text-purple-900">Requestor &rarr; Dept Manager &rarr; Purchasing Mgr &rarr; MD</span>
                  </td>
                  <td className="p-4 text-purple-800 font-medium">แบบวิเคราะห์ ROI + ใบขอซื้อ CAPEX + CS</td>
                  <td className="p-4 text-center font-bold text-purple-700">ต้องรอ MD อนุมัติเท่านั้น</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: DOCUMENTS & PRINTING */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Printer className="h-4.5 w-4.5 text-sky-600" />
              การออกเอกสารแบบฟอร์ม A4 และการพิมพ์ (A4 Document Output)
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              ระบบรองรับการแสดงผลแบบฟอร์มมาตรฐาน A4 สำหรับจัดพิมพ์ลงกระดาษหรือบันทึกเป็น PDF พร้อมลายเซ็นดิจิทัลกำกับ
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="border border-slate-200 rounded-xl p-4 space-y-2 bg-slate-50">
                <span className="text-[10px] font-bold text-sky-600 bg-sky-100 px-2 py-0.5 rounded font-mono">
                  PR FORM A4
                </span>
                <h4 className="font-bold text-slate-800 text-xs">แบบฟอร์มใบขอซื้อ (PR)</h4>
                <p className="text-[11px] text-slate-500">
                  แสดงตารางรายการสินค้า ราคา วัตถุประสงค์ และบล็อกลายเซ็นผู้ขอซื้อ ผู้จัดการ และฝ่ายจัดซื้อ
                </p>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 space-y-2 bg-slate-50">
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded font-mono">
                  PO FORM A4
                </span>
                <h4 className="font-bold text-slate-800 text-xs">แบบฟอร์มใบสั่งซื้อ (PO)</h4>
                <p className="text-[11px] text-slate-500">
                  แบบฟอร์มทางการสำหรับส่งให้ Vendor พร้อมที่อยู่บริษัท เงื่อนไขเครดิตเทอม และตรายางบริษัท
                </p>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 space-y-2 bg-slate-50">
                <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded font-mono">
                  PROCESS PACKAGE
                </span>
                <h4 className="font-bold text-slate-800 text-xs">ชุดเอกสารรวม (Package)</h4>
                <p className="text-[11px] text-slate-500">
                  รวบรวม PR + PO + Comparison Sheet + Audit Trail เข้าด้วยกันเพื่อส่งฝ่ายบัญชี/การเงิน
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: FAQ & TROUBLESHOOTING */}
      {activeTab === 'faq' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <HelpCircle className="h-4.5 w-4.5 text-sky-600" />
            คำถามที่พบบ่อย และการแก้ปัญหา (FAQ & Troubleshooting)
          </h3>

          <div className="divide-y divide-slate-100 text-xs space-y-3 pt-2">
            <div className="pt-3 space-y-1">
              <h4 className="font-bold text-slate-800 text-xs flex items-center gap-2">
                <Info className="h-4 w-4 text-sky-500 shrink-0" />
                Q: หากต้องการแก้ไขรายการใน PR หลังส่งอนุมัติไปแล้ว ต้องทำอย่างไร?
              </h4>
              <p className="text-slate-600 pl-6 leading-relaxed">
                A: หาก PR อยู่ในสถานะรออนุมัติ (Pending) ผู้ขอซื้อสามารถกดปุ่ม "ยกเลิกการขอซื้อ" หรือให้ผู้จัดการอนุมัติกด "ไม่อนุมัติ (Reject)" พร้อมระบุหมายเหตุ เพื่อให้ PR กลับไปเป็นร่างแก้ไข
              </p>
            </div>

            <div className="pt-3 space-y-1">
              <h4 className="font-bold text-slate-800 text-xs flex items-center gap-2">
                <Info className="h-4 w-4 text-sky-500 shrink-0" />
                Q: ลายเซ็นดิจิทัล (Digital Signature) มาจากไหน และปลอดภัยหรือไม่?
              </h4>
              <p className="text-slate-600 pl-6 leading-relaxed">
                A: ลายเซ็นดิจิทัลถูกดึงมาจากโปรไฟล์พนักงานในระบบอย่างเป็นทางการ ซึ่งผูกกับรหัสพนักงานและประทับเวลา (Timestamp) ลงใน Audit Log ทุกครั้งที่มีการอนุมัติ
              </p>
            </div>

            <div className="pt-3 space-y-1">
              <h4 className="font-bold text-slate-800 text-xs flex items-center gap-2">
                <Info className="h-4 w-4 text-sky-500 shrink-0" />
                Q: สามารถแนบไฟล์ Quotation เพิ่มเติมหลังจากสร้าง PR ได้หรือไม่?
              </h4>
              <p className="text-slate-600 pl-6 leading-relaxed">
                A: ได้ เจ้าหน้าที่จัดซื้อหรือผู้ขอซื้อสามารถอัปโหลดไฟล์ไปยัง Google Drive ที่เชื่อมต่ออยู่ หรือใส่ลิงก์ไฟล์แนบเพิ่มเติมในรายละเอียด PR ได้ตลอดเวลา
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
