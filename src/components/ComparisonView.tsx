import React, { useState, useMemo } from 'react';
import {
  Scale,
  Search,
  Plus,
  Printer,
  ArrowLeft,
  Trash2,
  Check,
  Star,
  ExternalLink,
  Coins,
  Eye,
  ShoppingCart,
  Sparkles,
  FileText,
  Building,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { ComparisonSheet, ComparisonItem, Vendor, PR, PO, User, UserRole, PRStatus } from '../types.js';

interface ComparisonViewProps {
  comparisons: ComparisonSheet[];
  prs: PR[];
  vendors: Vendor[];
  currentUser: User;
  onRefresh: () => void;
  onNavigate: (view: string, id?: string) => void;
}

export default function ComparisonView({
  comparisons,
  prs,
  vendors,
  currentUser,
  onRefresh,
  onNavigate
}: ComparisonViewProps) {
  const [viewMode, setViewMode] = useState<'LIST' | 'CREATE' | 'DETAIL'>('LIST');
  const [selectedSheet, setSelectedSheet] = useState<ComparisonSheet | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Creation State
  const [selectedPrId, setSelectedPrId] = useState<string>('');
  const [comparisonItems, setComparisonItems] = useState<ComparisonItem[]>([]);
  const [comparedVendors, setComparedVendors] = useState<Vendor[]>([]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter comparisons
  const filteredComparisons = useMemo(() => {
    return comparisons.filter(c => {
      const matchSearch =
        c.csNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.referPrNumber && c.referPrNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        c.departmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.notes && c.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Role filtering: Employees see their own or dept-specific comparisons
      // HR/GA (DEP004) sees everything (purchasing context)
      if (currentUser.departmentId === 'DEP004') {
        return matchSearch;
      }
      
      if (currentUser.role === UserRole.EMPLOYEE) {
        return matchSearch && c.createdById === currentUser.id;
      } else if (currentUser.role === UserRole.DEPARTMENT_MANAGER) {
        return matchSearch && c.departmentId === currentUser.departmentId;
      }
      return matchSearch;
    });
  }, [comparisons, searchQuery, currentUser]);

  // List of approved PRs for dropdown reference
  const availablePrs = useMemo(() => {
    return prs.filter(pr => pr.status === PRStatus.APPROVED || pr.status === PRStatus.PENDING_PURCHASING);
  }, [prs]);

  // Handle PR Selection
  const handlePrReferenceChange = (prId: string) => {
    setSelectedPrId(prId);
    if (!prId) {
      setComparisonItems([]);
      setComparedVendors([]);
      return;
    }

    const pr = prs.find(p => p.id === prId);
    if (!pr) return;

    // Map PR items to Comparison Items
    const mappedItems: ComparisonItem[] = pr.items.map((item, idx) => ({
      id: `CI-${Date.now()}-${idx}`,
      prItemId: item.id,
      partNo: item.partNo,
      description: item.description,
      specification: item.specification || '',
      unit: item.unit,
      qty: item.qty,
      offers: []
    }));

    setComparisonItems(mappedItems);

    // Auto-select the PR vendor as one of compared vendors if exists
    const prVendor = vendors.find(v => v.id === pr.suggestedVendorId || v.name === pr.vendorName);
    if (prVendor) {
      setComparedVendors([prVendor]);
      // Seed initial offer for that vendor
      const seeded = mappedItems.map(mi => {
        const prItem = pr.items.find(pi => pi.id === mi.prItemId);
        return {
          ...mi,
          offers: [{
            vendorId: prVendor.id,
            vendorName: prVendor.name,
            unitPrice: prItem ? prItem.unitPrice : 0,
            totalPrice: prItem ? (prItem.qty * prItem.unitPrice) : 0,
            isBestOffer: true
          }],
          selectedVendorId: prVendor.id,
          selectedPrice: prItem ? prItem.unitPrice : 0
        };
      });
      setComparisonItems(seeded);
    }
  };

  // Add ad-hoc item
  const handleAddAdHocItem = () => {
    const newItem: ComparisonItem = {
      id: `CI-ADHOC-${Date.now()}-${Math.floor(Math.random() * 100)}`,
      partNo: '',
      description: '',
      specification: '',
      unit: 'PCS',
      qty: 1,
      offers: comparedVendors.map(v => ({
        vendorId: v.id,
        vendorName: v.name,
        unitPrice: 0,
        totalPrice: 0,
        isBestOffer: false
      }))
    };
    setComparisonItems([...comparisonItems, newItem]);
  };

  // Remove comparison item
  const handleRemoveItem = (idx: number) => {
    setComparisonItems(comparisonItems.filter((_, i) => i !== idx));
  };

  // Add vendor to comparison
  const handleAddVendor = (vendorId: string) => {
    if (!vendorId) return;
    const vendor = vendors.find(v => v.id === vendorId);
    if (!vendor || comparedVendors.some(v => v.id === vendorId)) return;

    const updatedVendors = [...comparedVendors, vendor];
    setComparedVendors(updatedVendors);

    // Update all items with empty offer for this vendor
    const updatedItems = comparisonItems.map(item => {
      const existingOffers = [...item.offers];
      if (!existingOffers.some(o => o.vendorId === vendorId)) {
        existingOffers.push({
          vendorId: vendor.id,
          vendorName: vendor.name,
          unitPrice: 0,
          totalPrice: 0,
          isBestOffer: false
        });
      }
      return { ...item, offers: existingOffers };
    });

    setComparisonItems(updatedItems);
  };

  // Remove vendor from comparison
  const handleRemoveVendor = (vendorId: string) => {
    setComparedVendors(comparedVendors.filter(v => v.id !== vendorId));
    setComparisonItems(comparisonItems.map(item => ({
      ...item,
      offers: item.offers.filter(o => o.vendorId !== vendorId),
      selectedVendorId: item.selectedVendorId === vendorId ? undefined : item.selectedVendorId,
      selectedPrice: item.selectedVendorId === vendorId ? undefined : item.selectedPrice
    })));
  };

  // Handle Offer Price Input
  const handlePriceChange = (itemIdx: number, vendorId: string, priceStr: string) => {
    const price = parseFloat(priceStr) || 0;
    const updatedItems = [...comparisonItems];
    const item = updatedItems[itemIdx];

    // Find and update offer price
    const offerIdx = item.offers.findIndex(o => o.vendorId === vendorId);
    if (offerIdx !== -1) {
      item.offers[offerIdx].unitPrice = price;
      item.offers[offerIdx].totalPrice = item.qty * price;
    } else {
      const vendor = vendors.find(v => v.id === vendorId);
      item.offers.push({
        vendorId,
        vendorName: vendor ? vendor.name : 'Unknown',
        unitPrice: price,
        totalPrice: item.qty * price,
        isBestOffer: false
      });
    }

    // Auto-calculate best (lowest positive) offer
    let lowestPrice = Infinity;
    let lowestVendorId = '';

    item.offers.forEach(o => {
      if (o.unitPrice > 0 && o.unitPrice < lowestPrice) {
        lowestPrice = o.unitPrice;
        lowestVendorId = o.vendorId;
      }
    });

    item.offers.forEach(o => {
      o.isBestOffer = o.vendorId === lowestVendorId && o.unitPrice > 0;
    });

    // Default auto-select best vendor if none chosen yet or previous was best
    if (!item.selectedVendorId || item.selectedVendorId === lowestVendorId || !item.offers.some(o => o.vendorId === item.selectedVendorId)) {
      item.selectedVendorId = lowestVendorId || undefined;
      item.selectedPrice = lowestVendorId ? lowestPrice : undefined;
    }

    setComparisonItems(updatedItems);
  };

  // Select Winner manually for an item
  const handleSelectWinner = (itemIdx: number, vendorId: string, price: number) => {
    const updatedItems = [...comparisonItems];
    updatedItems[itemIdx].selectedVendorId = vendorId;
    updatedItems[itemIdx].selectedPrice = price;
    setComparisonItems(updatedItems);
  };

  // Save the Comparison Sheet to server
  const handleSaveComparison = async () => {
    if (comparisonItems.length === 0) {
      alert('กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการเพื่อเปรียบเทียบ');
      return;
    }

    // Validate that each item has a chosen vendor
    const missingWinner = comparisonItems.some(item => !item.selectedVendorId);
    if (missingWinner) {
      alert('กรุณาเลือกผู้ขายที่จะสั่งซื้อสำหรับสินค้าทุกรายการ');
      return;
    }

    setIsSubmitting(true);
    try {
      const refPr = prs.find(p => p.id === selectedPrId);

      const payload = {
        date: new Date().toISOString().split('T')[0],
        referPrId: selectedPrId || undefined,
        referPrNumber: refPr ? refPr.prNumber : undefined,
        departmentId: refPr ? refPr.departmentId : currentUser.departmentId || 'DEP001',
        departmentName: refPr ? refPr.departmentName : 'Purchasing',
        items: comparisonItems,
        notes,
        createdById: currentUser.id,
        createdByName: currentUser.name,
        userRole: currentUser.role
      };

      const res = await fetch('/api/comparison', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('บันทึกข้อมูลการเปรียบเทียบราคาเรียบร้อยแล้ว');
        onRefresh();
        setViewMode('LIST');
        // Clear creation state
        setSelectedPrId('');
        setComparisonItems([]);
        setComparedVendors([]);
        setNotes('');
      } else {
        alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดทางเทคนิค');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trigger Automatic PO Generation
  const handleGeneratePOs = async (sheetId: string) => {
    if (!confirm('ต้องการสร้างใบสั่งซื้อ (PO) โดยอัตโนมัติอ้างอิงตามราคาเปรียบเทียบนี้หรือไม่?\nระบบจะแยกใบสั่งซื้อตามผู้ขายที่ได้รับเลือกในแต่ละรายการ')) return;

    try {
      const res = await fetch(`/api/comparison/${sheetId}/generate-pos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });

      if (res.ok) {
        const data = await res.json();
        alert(`ดำเนินการสั่งซื้อสำเร็จ!\nสร้างใบสั่งซื้อใหม่จำนวน ${data.createdPOs.length} ฉบับ เรียบร้อยแล้ว`);
        onRefresh();
        setViewMode('LIST');
      } else {
        const errData = await res.json();
        alert(`ไม่สามารถออกใบสั่งซื้อได้: ${errData.message || 'ข้อผิดพลาดเซิร์ฟเวอร์'}`);
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดขณะส่งคำขอออกใบสั่งซื้อ');
    }
  };

  // Quick Drill Down into PR details
  const handleDrillDownPR = (prId: string) => {
    onNavigate('pr-details', prId);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8">
      {/* Printable Area styling */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .no-print {
            display: none !important;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 20px !important;
          }
        }
      `}</style>

      {/* HEADER SECTION */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Scale className="h-6 w-6 text-sky-600" />
            <span>การเปรียบเทียบราคาและการสั่งซื้อ (Comparison Sheet)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            เปรียบเทียบเสนอราคาจากผู้ขายหลายราย เลือกรายการที่ดีที่สุด พร้อมออกใบสั่งซื้อ (PO) อัตโนมัติแยกรายผู้ขาย
          </p>
        </div>

        {viewMode === 'LIST' && (
          <button
            onClick={() => setViewMode('CREATE')}
            className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg text-xs transition-all shadow-md cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>บันทึกเปรียบเทียบราคาใหม่</span>
          </button>
        )}
      </div>

      {/* ALERT/STATUS FEEDBACK */}
      {viewMode === 'LIST' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 no-print">
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs flex items-center gap-3.5">
            <div className="p-3 bg-sky-50 rounded-xl text-sky-600">
              <Scale className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">เอกสารเปรียบเทียบทั้งหมด</p>
              <h4 className="text-lg font-black text-slate-800 mt-0.5">{comparisons.length} ฉบับ</h4>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs flex items-center gap-3.5">
            <div className="p-3 bg-teal-50 rounded-xl text-teal-600">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ออกใบสั่งซื้อแล้ว (Full)</p>
              <h4 className="text-lg font-black text-slate-800 mt-0.5">
                {comparisons.filter(c => c.status === 'PO_CREATED').length} ฉบับ
              </h4>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs flex items-center gap-3.5">
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">รอดำเนินการสั่งซื้อ / สั่งซื้อบางส่วน</p>
              <h4 className="text-lg font-black text-slate-800 mt-0.5">
                {comparisons.filter(c => c.status === 'COMPLETED' || c.status === 'PARTIALLY_PO_CREATED').length} ฉบับ
              </h4>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 1: LISTING */}
      {viewMode === 'LIST' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden no-print">
          {/* Search Bar */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาเลขที่ CS, ใบขอซื้ออ้างอิง, แผนก, รายละเอียด..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="p-4">เลขที่เอกสาร CS</th>
                  <th className="p-4">วันที่ทำรายการ</th>
                  <th className="p-4">ใบขอซื้ออ้างอิง (PR)</th>
                  <th className="p-4">แผนกจัดซื้อ</th>
                  <th className="p-4">ผู้บันทึก</th>
                  <th className="p-4">สถานะสั่งซื้อ</th>
                  <th className="p-4 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredComparisons.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-sky-600">
                      <button
                        onClick={() => {
                          setSelectedSheet(c);
                          setViewMode('DETAIL');
                        }}
                        className="hover:underline text-left cursor-pointer font-bold focus:outline-none"
                      >
                        {c.csNumber}
                      </button>
                    </td>
                    <td className="p-4 font-medium text-slate-500">{c.date}</td>
                    <td className="p-4">
                      {c.referPrId ? (
                        <button
                          onClick={() => handleDrillDownPR(c.referPrId!)}
                          className="font-semibold text-slate-700 hover:text-sky-600 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {c.referPrNumber}
                          <ExternalLink className="h-3 w-3 inline shrink-0" />
                        </button>
                      ) : (
                        <span className="text-slate-400 italic">กรอกข้อมูลโดยตรง (Ad-hoc)</span>
                      )}
                    </td>
                    <td className="p-4 font-medium text-slate-600">{c.departmentName}</td>
                    <td className="p-4 font-medium text-slate-500">{c.createdByName}</td>
                    <td className="p-4">
                      {c.status === 'PO_CREATED' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ออก PO ครบถ้วน (Full)
                        </span>
                      )}
                      {c.status === 'PARTIALLY_PO_CREATED' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                          ออก PO บางส่วน (Partially)
                        </span>
                      )}
                      {c.status === 'COMPLETED' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          พร้อมออกใบสั่งซื้อ
                        </span>
                      )}
                      {c.status === 'DRAFT' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          ฉบับร่าง (Draft)
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedSheet(c);
                            setViewMode('DETAIL');
                          }}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                          title="ดูรายละเอียดและรายงาน"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {c.status !== 'PO_CREATED' && (
                          <button
                            onClick={() => handleGeneratePOs(c.id)}
                            className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
                            title="Generate ใบสั่งซื้อ PO อัตโนมัติ"
                          >
                            <ShoppingCart className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedSheet(c);
                            setTimeout(() => window.print(), 200);
                          }}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                          title="พิมพ์เอกสารเปรียบเทียบ"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                        {currentUser && (currentUser.employeeId === '43210344' || currentUser.role === UserRole.ADMINISTRATOR) && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (window.confirm('คุณต้องการลบเอกสารเปรียบเทียบราคานี้ใช่หรือไม่?')) {
                                try {
                                  const res = await fetch(`/api/comparison/${c.id}`, { method: 'DELETE' });
                                  if (res.ok) {
                                    alert('ลบเอกสารเปรียบเทียบราคาสำเร็จ');
                                    onRefresh();
                                  } else {
                                    const err = await res.json();
                                    alert(err.message || 'เกิดข้อผิดพลาดในการลบ');
                                  }
                                } catch (err: any) {
                                  alert(err.message || 'เกิดข้อผิดพลาด');
                                }
                              }
                            }}
                            className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                            title="ลบเอกสารเปรียบเทียบราคา (Master Admin)"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredComparisons.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-slate-400 font-medium">
                      ไม่พบเอกสารเปรียบเทียบราคาที่ค้นหา
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: DETAIL MODE & PRINT PREVIEW */}
      {viewMode === 'DETAIL' && selectedSheet && (
        <div className="space-y-6">
          {/* Actions toolbar */}
          <div className="flex items-center justify-between no-print bg-white p-4 rounded-xl border border-slate-100 shadow-2xs">
            <button
              onClick={() => {
                setSelectedSheet(null);
                setViewMode('LIST');
              }}
              className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold text-xs"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>กลับสู่รายการทั้งหมด</span>
            </button>

            <div className="flex items-center gap-2">
              {selectedSheet.status !== 'PO_CREATED' && (
                <button
                  onClick={() => handleGeneratePOs(selectedSheet.id)}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg text-xs shadow-md cursor-pointer transition-all"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span>Generate ใบสั่งซื้อ (PO) อัตโนมัติ</span>
                </button>
              )}
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold py-2 px-4 rounded-lg text-xs shadow-3xs cursor-pointer transition-all"
              >
                <Printer className="h-4 w-4" />
                <span>พิมพ์ใบเปรียบเทียบราคา</span>
              </button>
              {currentUser && (currentUser.employeeId === '43210344' || currentUser.role === UserRole.ADMINISTRATOR) && (
                <button
                  onClick={async () => {
                    if (window.confirm('คุณต้องการลบเอกสารเปรียบเทียบราคานี้อย่างถาวรใช่หรือไม่?')) {
                      try {
                        const res = await fetch(`/api/comparison/${selectedSheet.id}`, { method: 'DELETE' });
                        if (res.ok) {
                          alert('ลบเอกสารเปรียบเทียบราคาสำเร็จ');
                          setSelectedSheet(null);
                          setViewMode('LIST');
                          onRefresh();
                        } else {
                          const err = await res.json();
                          alert(err.message || 'เกิดข้อผิดพลาดในการลบ');
                        }
                      } catch (err: any) {
                        alert(err.message || 'เกิดข้อผิดพลาด');
                      }
                    }
                  }}
                  className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-4 rounded-lg text-xs shadow-md cursor-pointer transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>ลบเอกสาร (Delete Sheet)</span>
                </button>
              )}
            </div>
          </div>

          {/* Drill down Info Alert if PO Created */}
          {selectedSheet.items.some(i => i.poCreated) && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3 no-print">
              <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-left text-xs">
                <h4 className="font-bold text-emerald-800">เอกสารนี้ทำการสั่งซื้อไปแล้ว</h4>
                <p className="text-emerald-700 mt-1">
                  รายการสินค้าในเอกสารเปรียบเทียบนี้ได้รับการจัดทำใบสั่งซื้อ (PO) เรียบร้อยแล้ว ท่านสามารถเข้าตรวจดูใบสั่งซื้อที่สร้างขึ้นได้ที่หน้าเมนู ใบสั่งซื้อ (PO)
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {Array.from(new Set(selectedSheet.items.filter(i => i.poNumber).map(i => i.poNumber))).map(poNum => (
                    <span key={poNum} className="bg-emerald-100 text-emerald-800 font-mono font-bold px-2 py-1 rounded text-[10px] border border-emerald-300">
                      Reference PO: {poNum}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PRINTABLE AREA */}
          <div id="print-area" className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-10 space-y-8 text-left">
            {/* Form Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between pb-6 border-b border-slate-200 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sky-700">
                  <Building className="h-6 w-6" />
                  <span className="text-lg font-black tracking-wider uppercase">SUMINO AAPICO (THAILAND) CO., LTD.</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                  700/706 Moo 3, T.Bankao, A.Panthong, Chonburi 20160<br />
                  Tax ID: 0105553018247 | Tel: +66 (0) 3810 9300
                </p>
              </div>
              <div className="text-right space-y-1">
                <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">ใบเปรียบเทียบราคาผู้ขาย</h3>
                <p className="text-xs font-bold text-sky-600 uppercase font-mono tracking-wider">PRICE COMPARISON SHEET</p>
                <div className="text-xs space-y-1 pt-3 font-medium text-slate-600">
                  <p><span className="text-slate-400">เลขที่เอกสาร / No:</span> <span className="font-bold font-mono text-slate-900">{selectedSheet.csNumber}</span></p>
                  <p><span className="text-slate-400">วันที่ / Date:</span> <span className="font-bold text-slate-900">{selectedSheet.date}</span></p>
                  <p>
                    <span className="text-slate-400">อ้างอิง PR / Ref PR:</span>{' '}
                    <span className="font-bold text-slate-900">{selectedSheet.referPrNumber || 'กรอกข้อมูลโดยตรง'}</span>
                  </p>
                  <p><span className="text-slate-400">แผนก / Dept:</span> <span className="font-bold text-slate-900">{selectedSheet.departmentName}</span></p>
                </div>
              </div>
            </div>

            {/* Matrix Price Comparison Table */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">ตารางวิเคราะห์เสนอราคาเปรียบเทียบ (Price Analysis Matrix)</h4>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 font-bold border-b border-slate-200">
                      <th className="p-3 border-r border-slate-200 text-slate-600 shrink-0 w-8">#</th>
                      <th className="p-3 border-r border-slate-200 text-slate-600 w-1/4">รายละเอียดสินค้า / Specification</th>
                      <th className="p-3 border-r border-slate-200 text-center text-slate-600 w-16">จำนวน / Qty</th>
                      <th className="p-3 border-r border-slate-200 text-center text-slate-600 w-16">หน่วย</th>
                      
                      {/* Gather unique vendors listed in this sheet */}
                      {Array.from(
                        new Set(
                          selectedSheet.items.flatMap(item => item.offers.map(o => JSON.stringify({ id: o.vendorId, name: o.vendorName })))
                        )
                      ).map((vendorStr: string, vIdx) => {
                        const vendorObj = JSON.parse(vendorStr);
                        return (
                          <th key={vendorObj.id} className="p-3 text-center border-r border-slate-200 text-slate-800 bg-sky-50/50 w-32 shrink-0">
                            <span className="block font-black truncate">{vendorObj.name}</span>
                            <span className="block text-[9px] text-slate-400 font-mono">เสนอราคารายที่ {vIdx + 1}</span>
                          </th>
                        );
                      })}
                      <th className="p-3 text-center text-sky-800 bg-sky-100/40 w-36">ผู้ขายที่ได้รับเลือก</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedSheet.items.map((item, idx) => {
                      const comparedVendorsList = Array.from(
                        new Set(
                          selectedSheet.items.flatMap(i => i.offers.map(o => o.vendorId))
                        )
                      );

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/35">
                          <td className="p-3 border-r border-slate-200 text-center font-semibold text-slate-400">{idx + 1}</td>
                          <td className="p-3 border-r border-slate-200">
                            <div className="font-bold text-slate-800">{item.description}</div>
                            {item.partNo && <div className="text-[10px] text-slate-400 font-mono mt-0.5">Part No: {item.partNo}</div>}
                            {item.specification && <div className="text-[10px] text-slate-500 italic mt-0.5">{item.specification}</div>}
                          </td>
                          <td className="p-3 border-r border-slate-200 text-center font-bold text-slate-700">{item.qty}</td>
                          <td className="p-3 border-r border-slate-200 text-center text-slate-500 font-medium">{item.unit}</td>

                          {/* Render prices for each vendor in columns */}
                          {comparedVendorsList.map(vendorId => {
                            const offer = item.offers.find(o => o.vendorId === vendorId);
                            const isWinner = item.selectedVendorId === vendorId;
                            const isCheapest = offer?.isBestOffer;

                            return (
                              <td
                                key={`${item.id || idx}-${vendorId}`}
                                className={`p-3 border-r border-slate-200 text-right font-medium transition-colors ${
                                  isWinner
                                    ? 'bg-sky-50/30'
                                    : isCheapest
                                    ? 'bg-emerald-50/20'
                                    : ''
                                }`}
                              >
                                {offer && offer.unitPrice > 0 ? (
                                  <div className="space-y-0.5">
                                    <span className={`block font-semibold ${isCheapest ? 'text-emerald-700' : 'text-slate-700'}`}>
                                      {offer.unitPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                    </span>
                                    <span className="block text-[9.5px] text-slate-400 font-mono">
                                      Total: {offer.totalPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                    </span>
                                    {isCheapest && (
                                      <span className="inline-flex items-center gap-0.5 bg-emerald-100 text-emerald-800 text-[8px] font-extrabold px-1.5 py-0.2 rounded mt-1">
                                        <Star className="h-2 w-2 fill-emerald-600 text-emerald-600" /> Lowest
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-300 italic text-[11px]">ไม่เสนอราคา</span>
                                )}
                              </td>
                            );
                          })}

                          {/* Final Chosen Winner column */}
                          <td className="p-3 text-center bg-sky-100/10 font-bold">
                            {item.selectedVendorId ? (
                              <div className="space-y-1">
                                <span className="block text-slate-800 text-[11px] truncate leading-tight">
                                  {item.offers.find(o => o.vendorId === item.selectedVendorId)?.vendorName || 'ผู้เสนอราคารายนี้'}
                                </span>
                                <span className="inline-block bg-sky-600 text-white font-mono font-bold px-1.5 py-0.5 rounded text-[10.5px]">
                                  {(item.selectedPrice || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} THB
                                </span>
                                {item.poCreated && item.poNumber && (
                                  <span className="block text-[9px] text-emerald-600 font-bold mt-1 uppercase font-mono">
                                    Ordered: {item.poNumber}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-rose-500 italic">ไม่ได้ระบุ</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Price Summary Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
              <div className="bg-slate-50 rounded-xl p-4 text-xs text-left space-y-2">
                <h5 className="font-bold text-slate-700">หมายเหตุและข้อตกลง / Note</h5>
                <p className="text-slate-600 leading-relaxed italic whitespace-pre-line">
                  {selectedSheet.notes || 'ไม่มีหมายเหตุเพิ่มเติม'}
                </p>
              </div>

              <div className="bg-sky-50/40 rounded-xl p-4 text-xs space-y-2.5 text-left border border-sky-100/50">
                <h5 className="font-bold text-sky-800">สรุปยอดที่เลือกเปรียบเทียบ (Comparison Winner Summary)</h5>
                
                {/* Calculate summary by winning vendor */}
                {(() => {
                  const summary: { [name: string]: number } = {};
                  selectedSheet.items.forEach(i => {
                    if (i.selectedVendorId) {
                      const vendorName = i.offers.find(o => o.vendorId === i.selectedVendorId)?.vendorName || 'Unknown Vendor';
                      const cost = i.qty * (i.selectedPrice || 0);
                      summary[vendorName] = (summary[vendorName] || 0) + cost;
                    }
                  });

                  return (
                    <div className="space-y-1.5 divide-y divide-sky-100/50">
                      {Object.entries(summary).map(([vName, cost]) => (
                        <div key={vName} className="flex justify-between items-center py-1 text-slate-700">
                          <span className="font-semibold truncate max-w-xs">{vName}</span>
                          <span className="font-bold font-mono">
                            {cost.toLocaleString('th-TH', { minimumFractionDigits: 2 })} THB
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center py-2 text-sky-950 font-black text-sm border-t border-sky-200">
                        <span>ยอดรวมผลเปรียบราคาที่เลือก:</span>
                        <span className="font-mono">
                          {Object.values(summary).reduce((a, b) => a + b, 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} THB
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Printable Signatures */}
            <div className="grid grid-cols-3 gap-6 pt-16 text-center text-xs">
              <div className="space-y-12">
                <div className="border-b border-dashed border-slate-300 mx-auto w-48 h-8"></div>
                <div>
                  <p className="font-bold text-slate-800">{selectedSheet.createdByName}</p>
                  <p className="text-[10px] text-slate-400">ผู้จัดทำเสนอราคาเปรียบเทียบ / Prepared By</p>
                </div>
              </div>

              <div className="space-y-12">
                <div className="border-b border-dashed border-slate-300 mx-auto w-48 h-8"></div>
                <div>
                  <p className="font-bold text-slate-800">....................................................</p>
                  <p className="text-[10px] text-slate-400">ผู้ตรวจสอบ / Checked By</p>
                </div>
              </div>

              <div className="space-y-12">
                <div className="border-b border-dashed border-slate-300 mx-auto w-48 h-8"></div>
                <div>
                  <p className="font-bold text-slate-800">....................................................</p>
                  <p className="text-[10px] text-slate-400">ผู้อนุมัติสั่งซื้อ / Authorized Approval</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: NEW CS FORM (CREATION MODE) */}
      {viewMode === 'CREATE' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:p-8 space-y-6 text-left">
          {/* Header toolbar */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-black text-slate-800">สร้างเอกสารเปรียบเทียบราคาเสนอซื้อ (New Price Comparison Sheet)</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">เลือกใบอนุมัติขอซื้อ (PR) เพื่อดึงข้อมูลอัตโนมัติ หรือจัดทำเปรียบเทียบราคาโดยตรง</p>
            </div>
            <button
              onClick={() => {
                setViewMode('LIST');
                setSelectedPrId('');
                setComparisonItems([]);
                setComparedVendors([]);
                setNotes('');
              }}
              className="text-slate-400 hover:text-slate-800 font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" /> ยกเลิก
            </button>
          </div>

          {/* Step 1: Select Reference PR or direct entry */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 text-left">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                อ้างอิงใบขอซื้อจัดซื้อจัดจ้าง (Approved PR Link)
              </label>
              <select
                value={selectedPrId}
                onChange={(e) => handlePrReferenceChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none font-semibold text-slate-700"
              >
                <option value="">-- กรอกแบบบันทึกราคาโดยตรง (Direct Entry / Ad-hoc) --</option>
                {availablePrs.map(pr => (
                  <option key={pr.id} value={pr.id}>
                    {pr.prNumber} - {pr.departmentName} - {pr.grandTotal.toLocaleString('th-TH')} THB
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                เพิ่มผู้ขายเพื่อร่วมเสนอราคาเปรียบเทียบ (Compare Vendors)
              </label>
              <div className="flex gap-2">
                <select
                  onChange={(e) => {
                    handleAddVendor(e.target.value);
                    e.target.value = '';
                  }}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none font-semibold text-slate-700"
                >
                  <option value="">-- เลือกผู้ขายจากฐานข้อมูลเพื่อเพิ่มในตารางเปรียบเทียบ --</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Render List of compared vendors */}
          {comparedVendors.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">
                ผู้เสนอราคาเปรียบเทียบขณะนี้:
              </label>
              <div className="flex flex-wrap gap-2">
                {comparedVendors.map((vendor, vIdx) => (
                  <span
                    key={vendor.id}
                    className="inline-flex items-center gap-1.5 bg-sky-50 text-sky-800 font-bold px-2.5 py-1 rounded-lg text-xs border border-sky-100"
                  >
                    <span className="text-[10px] font-mono text-sky-500 bg-white px-1.5 py-0.2 rounded border border-sky-100 shrink-0">
                      รายที่ {vIdx + 1}
                    </span>
                    <span className="truncate max-w-xs">{vendor.name}</span>
                    <button
                      onClick={() => handleRemoveVendor(vendor.id)}
                      className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer shrink-0 ml-1"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Comparison Input Matrix Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                ตารางบันทึกการเสนอราคาเปรียบเทียบสินค้า
              </h4>
              {!selectedPrId && (
                <button
                  type="button"
                  onClick={handleAddAdHocItem}
                  className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-700 text-xs font-bold"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>เพิ่มสินค้าชิ้นใหม่</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 font-bold border-b border-slate-200 text-slate-600">
                    <th className="p-3 border-r border-slate-200 w-8">#</th>
                    <th className="p-3 border-r border-slate-200 w-1/3">รายละเอียดสินค้า / Specification</th>
                    <th className="p-3 border-r border-slate-200 text-center w-20">จำนวน / Qty</th>
                    <th className="p-3 border-r border-slate-200 text-center w-20">หน่วย</th>
                    
                    {/* Render Columns for Compared Vendors */}
                    {comparedVendors.map((vendor, vIdx) => (
                      <th key={vendor.id} className="p-3 text-center border-r border-slate-200 bg-sky-50/30 w-36">
                        <div className="truncate font-bold text-slate-800">{vendor.name}</div>
                        <div className="text-[9px] text-slate-400 font-medium">ราคาต่อหน่วย (THB)</div>
                      </th>
                    ))}
                    {!selectedPrId && <th className="p-3 text-center text-slate-400 w-12"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {comparisonItems.map((item, itemIdx) => (
                    <tr key={item.id} className="hover:bg-slate-50/25">
                      <td className="p-3 border-r border-slate-200 text-center font-bold text-slate-400">{itemIdx + 1}</td>
                      <td className="p-3 border-r border-slate-200">
                        {selectedPrId ? (
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-800">{item.description}</span>
                            {item.partNo && <div className="text-[10px] text-slate-400 font-mono">Part No: {item.partNo}</div>}
                            {item.specification && <div className="text-[10.5px] text-slate-500 italic">{item.specification}</div>}
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <input
                              type="text"
                              placeholder="คำอธิบายสินค้า/Specifications (เช่น เหล็กเส้น, ลวดเชื่อม)"
                              value={item.description}
                              onChange={(e) => {
                                const list = [...comparisonItems];
                                list[itemIdx].description = e.target.value;
                                setComparisonItems(list);
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none font-semibold text-slate-700"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                placeholder="Part Number (ถ้ามี)"
                                value={item.partNo}
                                onChange={(e) => {
                                  const list = [...comparisonItems];
                                  list[itemIdx].partNo = e.target.value;
                                  setComparisonItems(list);
                                }}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[10px] focus:ring-1 focus:ring-sky-500 focus:outline-none"
                              />
                              <input
                                type="text"
                                placeholder="Specification (ถ้ามี)"
                                value={item.specification}
                                onChange={(e) => {
                                  const list = [...comparisonItems];
                                  list[itemIdx].specification = e.target.value;
                                  setComparisonItems(list);
                                }}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[10px] focus:ring-1 focus:ring-sky-500 focus:outline-none"
                              />
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="p-3 border-r border-slate-200 text-center">
                        {selectedPrId ? (
                          <span className="font-bold text-slate-700">{item.qty}</span>
                        ) : (
                          <input
                            type="number"
                            min="1"
                            value={item.qty}
                            onChange={(e) => {
                              const qtyVal = parseInt(e.target.value) || 1;
                              const list = [...comparisonItems];
                              list[itemIdx].qty = qtyVal;
                              // recalculate totals
                              list[itemIdx].offers.forEach(o => { o.totalPrice = qtyVal * o.unitPrice; });
                              setComparisonItems(list);
                            }}
                            className="w-16 mx-auto bg-slate-50 border border-slate-200 rounded-lg py-1 text-center font-bold focus:ring-1 focus:ring-sky-500 focus:outline-none"
                          />
                        )}
                      </td>
                      <td className="p-3 border-r border-slate-200 text-center">
                        {selectedPrId ? (
                          <span className="text-slate-500">{item.unit}</span>
                        ) : (
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => {
                              const list = [...comparisonItems];
                              list[itemIdx].unit = e.target.value;
                              setComparisonItems(list);
                            }}
                            className="w-12 mx-auto bg-slate-50 border border-slate-200 rounded-lg py-1 text-center text-slate-600 focus:ring-1 focus:ring-sky-500 focus:outline-none"
                          />
                        )}
                      </td>

                      {/* Render input field for each compared vendor offer */}
                      {comparedVendors.map(vendor => {
                        const offer = item.offers.find(o => o.vendorId === vendor.id);
                        const isCheapest = offer?.isBestOffer;
                        const isChosen = item.selectedVendorId === vendor.id;

                        return (
                          <td
                            key={`${item.id || itemIdx}-${vendor.id}`}
                            className={`p-3 border-r border-slate-200 text-right transition-colors ${
                              isChosen ? 'bg-sky-50/20' : isCheapest ? 'bg-emerald-50/10' : ''
                            }`}
                          >
                            <div className="space-y-1.5 text-right">
                              <input
                                type="number"
                                min="0"
                                placeholder="0.00"
                                value={offer ? (offer.unitPrice || '') : ''}
                                onChange={(e) => handlePriceChange(itemIdx, vendor.id, e.target.value)}
                                className={`w-28 ml-auto bg-white border rounded-lg px-2.5 py-1 text-right font-bold font-mono focus:ring-1 focus:ring-sky-500 focus:outline-none ${
                                  isCheapest ? 'border-emerald-500 text-emerald-700 bg-emerald-50/5' : 'border-slate-200 text-slate-700'
                                }`}
                              />
                              {offer && offer.unitPrice > 0 && (
                                <div className="space-y-1">
                                  <span className="block text-[10px] text-slate-400 font-mono">
                                    Total: {offer.totalPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                  </span>

                                  {/* Select/Unselect checkbox */}
                                  <button
                                    type="button"
                                    onClick={() => handleSelectWinner(itemIdx, vendor.id, offer.unitPrice)}
                                    className={`w-full text-center py-0.5 rounded text-[9.5px] font-bold block border transition-all cursor-pointer ${
                                      isChosen
                                        ? 'bg-sky-600 border-sky-600 text-white shadow-3xs'
                                        : isCheapest
                                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                  >
                                    {isChosen ? (
                                      <span className="flex items-center justify-center gap-0.5">
                                        <Check className="h-3 w-3 shrink-0" /> ชนะเปรียบราคา
                                      </span>
                                    ) : isCheapest ? (
                                      <span className="flex items-center justify-center gap-0.5">
                                        <Star className="h-2.5 w-2.5 fill-emerald-600 text-emerald-600 shrink-0 animate-pulse" /> เลือก (ถูกที่สุด)
                                      </span>
                                    ) : (
                                      'เลือกผู้ขายนี้'
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}

                      {!selectedPrId && (
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(itemIdx)}
                            className="p-1.5 hover:bg-rose-50 text-slate-300 hover:text-rose-600 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {comparisonItems.length === 0 && (
                    <tr>
                      <td colSpan={5 + comparedVendors.length} className="p-8 text-center text-slate-400 font-medium">
                        กรุณาเลือกใบขอซื้อ (PR) ด้านบน หรือ กดปุ่ม 'เพิ่มสินค้าชิ้นใหม่' เพื่อใส่รายการวิเคราะห์ราคา
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Form Notes & Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-100">
            <div className="space-y-1.5 text-left">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                บันทึกข้อตกลง / เงื่อนไขเพิ่มเติม (Notes / Terms)
              </label>
              <textarea
                rows={3}
                placeholder="เช่น กำหนดส่งมอบ, เงื่อนไขการชำระเงิน หรือข้อเปรียบเทียบเชิงคุณภาพอื่นๆ..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 placeholder-slate-400 focus:ring-1 focus:ring-sky-500 focus:outline-none font-medium"
              />
            </div>

            <div className="bg-sky-50/40 border border-sky-100/50 rounded-xl p-4 text-xs flex flex-col justify-between">
              <div className="text-left space-y-2">
                <h5 className="font-bold text-sky-800 flex items-center gap-1">
                  <Coins className="h-4 w-4 text-sky-600" />
                  <span>สรุปรายการสั่งซื้อที่ได้รับการคัดเลือก:</span>
                </h5>
                <div className="space-y-1.5 text-slate-600 font-medium max-h-24 overflow-y-auto">
                  {comparisonItems.map((item, idx) => {
                    const winnerOffer = item.offers.find(o => o.vendorId === item.selectedVendorId);
                    return (
                      <div key={item.id} className="flex justify-between items-center text-[11px]">
                        <span className="truncate max-w-[200px]">
                          {idx + 1}. {item.description || 'สินค้าไม่ได้ระบุชื่อ'}
                        </span>
                        <span>
                          {winnerOffer ? (
                            <span className="font-bold text-sky-700">
                              {winnerOffer.vendorName} ({ (item.qty * (item.selectedPrice || 0)).toLocaleString('th-TH') } THB)
                            </span>
                          ) : (
                            <span className="text-rose-500 italic">ยังไม่ได้เลือกผู้ขาย</span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-sky-100 pt-3 flex justify-between items-center text-sky-950 font-black text-sm">
                <span>ยอดรวมคัดเลือกจัดสั่งซื้อสะสม:</span>
                <span className="font-mono">
                  {comparisonItems
                    .reduce((sum, i) => sum + i.qty * (i.selectedPrice || 0), 0)
                    .toLocaleString('th-TH', { minimumFractionDigits: 2 })}{' '}
                  THB
                </span>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setViewMode('LIST');
                setSelectedPrId('');
                setComparisonItems([]);
                setComparedVendors([]);
                setNotes('');
              }}
              className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSaveComparison}
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4 animate-pulse" />
              <span>{isSubmitting ? 'กำลังบันทึกข้อมูล...' : 'บันทึกข้อมูลเปรียบเทียบเสร็จสมบูรณ์'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
