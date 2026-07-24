/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Building, 
  LayoutDashboard, 
  FileText, 
  FileCheck, 
  Sliders, 
  ShieldAlert, 
  UserCheck, 
  ChevronRight,
  LogOut,
  Sparkles,
  Scale,
  Wallet,
  Menu,
  BookOpen
} from 'lucide-react';
import { User, UserRole, PR, PO } from '../types.js';
import { translations, Language } from '../lib/translations.js';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  currentUser: User;
  allUsers: User[];
  onSwitchUser: (userId: string) => void;
  onLogout?: () => void;
  prs: PR[];
  pos: PO[];
  lang?: Language;
}

export default function Sidebar({ 
  currentView, 
  onNavigate, 
  currentUser, 
  allUsers, 
  onSwitchUser, 
  onLogout,
  prs = [],
  pos = [],
  lang = 'TH'
}: SidebarProps) {
  
  const t = translations[lang] || translations.TH;

  // Categorized items mimicking Adminty design
  const navigationItems = [
    { id: 'dashboard', name: t.menuDashboard, icon: LayoutDashboard, badge: { text: 'NEW', color: 'bg-adminty-blue text-white' } },
  ];

  const purchasingItems = [
    { id: 'guide', name: t.menuGuide, icon: BookOpen, badge: { text: 'คู่มือ', color: 'bg-emerald-600 text-white font-bold' } },
    { id: 'process', name: t.menuProcess, icon: Building },
    { id: 'pr', name: t.menuPR, icon: FileText, badge: { text: prs.length.toString(), color: 'bg-adminty-green text-white' } },
    { id: 'comparison', name: t.menuComparison, icon: Scale },
    { id: 'po', name: t.menuPO, icon: FileCheck, badge: { text: pos.length.toString(), color: 'bg-indigo-500 text-white' } },
    { id: 'capex', name: t.menuCapex, icon: Sparkles },
    { id: 'other-modules', name: t.menuOtherModules, icon: Wallet, badge: { text: 'HOT', color: 'bg-adminty-pink text-white animate-pulse' } },
  ];

  const adminItems = [
    { id: 'admin', name: t.menuAdmin, icon: Sliders, roleRequired: UserRole.ADMINISTRATOR },
    { id: 'audit', name: t.menuAudit, icon: ShieldAlert, roleRequired: UserRole.ADMINISTRATOR }
  ];

  const handleNavClick = (id: string) => {
    onNavigate(id);
  };

  const renderNavGroup = (title: string, items: typeof purchasingItems) => {
    return (
      <div className="space-y-1">
        <h3 className="px-4 pt-4 pb-2 text-[10px] uppercase font-bold tracking-widest text-slate-400 font-sans">
          {title}
        </h3>
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentView.startsWith(item.id);

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-none text-xs font-medium tracking-wide transition-all border-l-[3px] text-left cursor-pointer ${
                isActive
                  ? 'bg-slate-700/50 text-white border-adminty-primary font-bold'
                  : 'border-transparent text-slate-300 hover:bg-slate-700/20 hover:text-white'
              }`}
              id={`nav-${item.id}`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-[15px] w-[15px] ${isActive ? 'text-adminty-primary' : 'text-slate-400 group-hover:text-white'}`} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-extrabold font-mono tracking-tight ${item.badge.color}`}>
                  {item.badge.text}
                </span>
              )}
              {('roleRequired' in item) && item.roleRequired && (
                <span className={`text-[8px] border px-1.5 py-0.2 rounded font-mono tracking-wider font-semibold ${
                  isActive 
                    ? 'bg-adminty-primary text-white border-adminty-primary' 
                    : 'bg-slate-700 text-slate-300 border-slate-600'
                }`}>
                  ADMIN
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <aside className="hidden md:flex w-72 bg-adminty-sidebar text-white flex flex-col h-screen shrink-0 border-r border-slate-700 no-print font-sans shadow-lg">
      
      {/* Title block with company logo */}
      <div className="h-20 border-b border-slate-700 flex items-center justify-between px-5 bg-slate-900/40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-white p-1 flex items-center justify-center shadow-md">
            <img 
              src="https://lh3.googleusercontent.com/d/14E1UaRpJDWbTLzdI6FLvnwmLRTVPnTXd" 
              alt="Logo" 
              className="h-full w-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="text-left">
            <div className="flex flex-col">
              <span className="text-[11px] font-black tracking-widest text-white uppercase leading-tight">SUMINO AAPICO</span>
              <span className="text-[9px] text-slate-400 font-sans tracking-tight uppercase leading-tight">Smart e-Purchase</span>
            </div>
          </div>
        </div>
        <button className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-700/40 transition-all">
          <Menu className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Navigation lists grouped just like Adminty */}
      <nav className="flex-1 space-y-2 overflow-y-auto scrollbar-hidden py-3 text-left">
        {renderNavGroup(t.navGroupNavigation, navigationItems)}
        {renderNavGroup(t.navGroupPurchasing, purchasingItems)}
        {renderNavGroup(t.navGroupSettings, adminItems)}
      </nav>

      {/* Active User Footer panel resembling Adminty's profile block */}
      <div className="p-4 border-t border-slate-700 bg-slate-900/30 flex items-center justify-between">
        <div className="truncate text-left flex-1 mr-2 flex items-center gap-2.5">
          {/* Avatar simulation circle */}
          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white font-black font-sans uppercase shrink-0 shadow-inner text-xs border border-slate-600">
            {currentUser.name.substring(0, 2)}
          </div>
          <div className="truncate text-left">
            <p className="text-[11px] font-bold text-white truncate leading-snug">{currentUser.thaiName || currentUser.name}</p>
            <p className="text-[9px] text-slate-400 font-mono tracking-tight truncate leading-tight">{currentUser.title}</p>
            <span className="inline-block bg-slate-700 text-adminty-primary text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-sm mt-0.5">
              {currentUser.employeeId} ({currentUser.role})
            </span>
          </div>
        </div>
        {onLogout && (
          <button
            onClick={onLogout}
            className="p-2 bg-slate-700/60 hover:bg-adminty-pink text-slate-300 hover:text-white rounded-lg border border-slate-600 hover:border-transparent transition-colors shadow-sm cursor-pointer shrink-0"
            title="ออกจากระบบ (Sign Out)"
            id="sidebar-logout-button"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </aside>
  );
}
