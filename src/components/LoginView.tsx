/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Key, Building2, UserCheck, AlertCircle, LogIn } from 'lucide-react';
import { User } from '../types.js';

interface LoginViewProps {
  allUsers: User[];
  onLogin: (employeeId: string) => Promise<boolean>;
}

export default function LoginView({ allUsers, onLogin }: LoginViewProps) {
  const [empIdInput, setEmpIdInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empIdInput.trim()) {
      setErrorMsg('กรุณากรอกรหัสพนักงาน (Please enter Employee ID)');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const success = await onLogin(empIdInput.trim().toUpperCase());
      if (!success) {
        setErrorMsg('ไม่พบรหัสพนักงานนี้ในระบบ (Employee ID not found)');
      }
    } catch (err) {
      setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-sky-50/50 p-4 font-sans antialiased">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl overflow-hidden border border-sky-100 grid md:grid-cols-12 min-h-[580px]">
        
        {/* Left Side: Brand & Context Presentation */}
        <div className="md:col-span-5 bg-gradient-to-br from-sky-600 to-sky-800 p-8 md:p-12 text-white flex flex-col justify-between text-left">
          <div className="space-y-4">
            <div className="bg-white p-2 rounded-2xl w-fit backdrop-blur-xs">
              <img 
                src="https://lh3.googleusercontent.com/d/14E1UaRpJDWbTLzdI6FLvnwmLRTVPnTXd" 
                alt="Company Logo" 
                className="h-10 object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">SUMINO AAPICO</h2>
              <p className="text-xs text-sky-200 font-medium uppercase tracking-widest mt-1">
                Company Limited
              </p>
            </div>
          </div>

          <div className="space-y-4 my-8 md:my-0">
            <h1 className="text-2xl md:text-3xl font-black leading-tight tracking-tight">
              ระบบจัดซื้ออิเล็กทรอนิกส์<br />
              <span className="text-sky-200 font-semibold text-lg md:text-xl">E-Purchasing Portal</span>
            </h1>
            <p className="text-xs text-sky-100/90 leading-relaxed max-w-sm">
              ระบบอนุมัติใบขอซื้อ (PR) และออกใบสั่งซื้อ (PO) แบบไร้กระดาษ 
              รองรับการอนุมัติแบบเป็นขั้นตามลำดับสายงาน (RBAC) และการตรวจสอบที่เข้มงวด
            </p>
          </div>

          <div className="border-t border-white/20 pt-4 flex items-center justify-between text-[10px] text-sky-200/80 font-mono">
            <span>CHONBURI PLANT 1</span>
            <span>SECURE MD5 HASHED</span>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="md:col-span-7 p-8 md:p-12 flex flex-col justify-center text-left">
          <div className="max-w-md w-full mx-auto space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800">เข้าสู่ระบบ / Employee Portal</h2>
              <p className="text-xs text-slate-400 mt-1">กรุณากรอกรหัสพนักงานเพื่อระบุตัวตนและตรวจสอบสิทธิ์ตามแผนกของคุณ</p>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2 animate-shake">
                <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-500 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                  รหัสพนักงาน (Employee ID)
                </label>
                <div className="relative">
                  <UserCheck className="absolute left-3.5 top-3 text-slate-400 h-4 w-4" />
                  <input
                    type="text"
                    value={empIdInput}
                    onChange={(e) => setEmpIdInput(e.target.value)}
                    placeholder="ป้อนรหัสพนักงานของท่านเพื่อล๊อกอิน"
                    className="w-full pl-10 pr-4 py-2.5 text-xs font-mono font-bold border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all outline-none"
                    id="login-emp-id-input"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-sky-600 hover:bg-sky-700 text-white py-2.5 rounded-xl font-bold text-xs transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                disabled={isSubmitting}
                id="login-submit-button"
              >
                <LogIn className="h-4 w-4" />
                {isSubmitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ (Sign In)'}
              </button>
            </form>



            <div className="text-center text-[10px] text-slate-400 leading-normal pt-2">
              Sumino Aapico Enterprise Workflow Security Engine • <span className="font-mono">v2.4-stable</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
