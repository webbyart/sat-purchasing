
import React from 'react';
import { ArrowRight, FileText, FileCheck, ClipboardList, Briefcase, BookOpen } from 'lucide-react';

export default function PurchasingProcessView({ onNavigate }: { onNavigate: (view: string) => void }) {
  return (
    <div className="p-6 md:p-8 space-y-8 bg-white rounded-2xl border border-slate-200 shadow-xs">
      <header className="border-b border-slate-100 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">กระบวนการจัดซื้อ (Purchasing Process)</h2>
          <p className="text-sm text-slate-500 mt-1">ภาพรวมและขั้นตอนการดำเนินการจัดซื้อ (Non-productive)</p>
        </div>
        <button
          onClick={() => onNavigate('guide')}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer"
        >
          <BookOpen className="h-4 w-4" />
          <span>อ่านคู่มือการใช้งานระบบฉบับเต็ม (User Manual)</span>
        </button>
      </header>

      <div className="grid md:grid-cols-3 gap-6 items-start">
        {/* Input */}
        <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center gap-2 text-sky-700 font-bold">
            <ClipboardList className="h-5 w-5" />
            <span>Input (เอกสารตั้งต้น)</span>
          </div>
          <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4">
            <li>ใบขอซื้อ (PR)</li>
            <li>ใบเสนอราคา (Quotation)</li>
            <li>ใบรายงานการใช้บริการ (Service Report)</li>
            <li>แบบ/ตัวอย่างงาน/รูปภาพ/Drawing</li>
            <li>ผู้ร้องขอการสั่งซื้อ</li>
          </ul>
        </div>

        {/* Process */}
        <div className="flex justify-center items-center">
            <div className="p-6 rounded-full bg-adminty-primary text-white font-bold shadow-lg shadow-sky-200">
                การสั่งซื้อ (Purchase Order)
            </div>
            <ArrowRight className="h-8 w-8 text-slate-300 ml-4" />
        </div>

        {/* Output */}
        <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center gap-2 text-emerald-700 font-bold">
            <FileCheck className="h-5 w-5" />
            <span>Output (ผลลัพธ์)</span>
          </div>
          <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4">
            <li>ใบสั่งซื้อ (PO)</li>
            <li>สินค้าที่สั่งซื้อ</li>
            <li>เอกสารเรียกเก็บเงิน (Invoice)</li>
          </ul>
        </div>
      </div>
      
      <div className="pt-6 border-t border-slate-100 flex gap-4">
        <button 
          onClick={() => onNavigate('pr-new')}
          className="px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800"
        >
          สร้างใบขอซื้อ (PR) ใหม่
        </button>
        <button 
          onClick={() => onNavigate('pr')}
          className="px-5 py-2.5 bg-sky-600 text-white text-xs font-bold rounded-lg hover:bg-sky-700"
        >
          ดูรายการใบขอซื้อ (PR)
        </button>
      </div>
    </div>
  );
}
