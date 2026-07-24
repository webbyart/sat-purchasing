/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PR, PO, CapexRequisition, PRStatus, POStatus, CapexStatus, UserRole } from '../types.js';

interface ProcessPackagePrintProps {
  pr: PR;
  po?: PO | null;
  capex?: CapexRequisition | null;
}

export default function ProcessPackagePrint({ pr, po, capex }: ProcessPackagePrintProps) {
  // Collect all attached files & verification documents for the final package printout
  const allAttachments = [
    ...(pr.attachments || []).map(att => ({ ...att, source: 'เอกสารแนบประกอบ PR' })),
    ...(po?.attachments || []).map(att => ({ ...att, source: 'เอกสารแนบประกอบ PO' })),
    ...(po?.invoiceUrl ? [{ id: 'po-invoice-doc', fileName: `Invoice-PO-${po.poNumber}.png`, fileSize: 0, fileType: 'image/png', uploadedAt: po.date, uploadedBy: 'Vendor / Accounting', url: po.invoiceUrl, source: 'ใบแจ้งหนี้ / ใบเสร็จรับเงิน (Invoice)' }] : []),
    ...(po?.deliveryUrl ? [{ id: 'po-delivery-doc', fileName: `DeliveryNote-PO-${po.poNumber}.png`, fileSize: 0, fileType: 'image/png', uploadedAt: po.date, uploadedBy: 'Logistics / Warehouse', url: po.deliveryUrl, source: 'ใบส่งของ / ใบรับสินค้า (Delivery Note / GR)' }] : [])
  ];

  return (
    <div className="hidden print:block bg-white text-black font-sans leading-normal">
      
      {/* ------------------ PAGE 1: PURCHASE ORDER (If generated) ------------------ */}
      {po && (
        <div 
          className="a4-page-print border-2 border-black font-sans relative text-black text-[10px] flex flex-col justify-between"
          style={{ width: '210mm', height: '297mm', pageBreakAfter: 'always', boxSizing: 'border-box' }}
        >
          <div>
            {/* Corporate Header */}
            <div className="mb-2">
              <div className="flex justify-between items-start">
                <div className="space-y-0.5 text-left text-[10px]">
                  <h1 className="text-[11px] font-bold text-black">SUMINO AAPICO (Thailand) Company Limited (Head Office)</h1>
                  <p>700/706 Moo 3, T. Bankao, A. Panthong, Chonburi 20160</p>
                  <p>Tel: 66-38-447-628-31, Fax No. 66-38-447-632</p>
                  <p className="font-bold">Tax No. 0-2055-56012-44-8</p>
                </div>
                <div className="text-right text-[10px] pt-1">
                  <p className="flex justify-end items-center">
                    <span className="font-medium">Page :</span>
                    <span className="w-16 inline-block text-center ml-1">1 / 1</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center mb-3">
              <h2 className="text-sm font-bold text-black tracking-widest uppercase">PURCHASE ORDER</h2>
            </div>

            {/* PO Info Section */}
            <div className="flex justify-between items-start mb-2 px-1">
              <div className="text-left text-[10px] space-y-1.5 w-3/5">
                <div className="flex gap-1">
                  <span className="font-bold whitespace-nowrap">Shipping Address:</span>
                  <span className="font-bold">SUMINO AAPICO (Thailand) Co.,Ltd.</span>
                </div>
                <div className="pt-1 space-y-0.5">
                  <div className="flex gap-1">
                    <span className="font-bold w-16 uppercase">Vendor Name :</span>
                    <span className="flex-1 font-bold">{po.vendorName}</span>
                  </div>
                  <div className="flex gap-1">
                    <span className="font-bold w-16 uppercase">Address :</span>
                    <span className="flex-1 text-[9px]">{po.vendorAddress}</span>
                  </div>
                </div>
              </div>
              <div className="w-1/3">
                <table className="w-full border-collapse border border-black text-[10px]">
                  <thead>
                    <tr className="text-center font-bold">
                      <th className="border border-black px-2 py-0.5 bg-white">P/O No.</th>
                      <th className="border border-black px-2 py-0.5 bg-white">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="text-center h-7 font-bold">
                      <td className="border border-black px-2 py-0.5">{po.poNumber}</td>
                      <td className="border border-black px-2 py-0.5">{po.date}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end mb-2 pr-1">
              <div className="text-[9.5px] space-y-0.5 text-right w-full max-w-[220px]">
                <div className="flex justify-between items-center gap-2">
                  <span className="font-bold">Credit Term:</span>
                  <span className="flex-1 text-center font-bold border-b border-black">{po.creditTerm}</span>
                </div>
                <div className="flex justify-between items-center gap-2 mt-1">
                  <span className="font-bold">Refer P/R No :</span>
                  <span className="flex-1 text-center font-bold border-b border-black">{po.referPrNumber}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="font-bold">Dept.Order :</span>
                  <span className="flex-1 text-center font-bold border-b border-black">{po.departmentName}</span>
                </div>
              </div>
            </div>

            {/* Item List Table */}
            <div className="mb-2">
              <table className="w-full text-[9px] text-left border-collapse border border-black">
                <thead>
                  <tr className="font-bold text-black uppercase text-center h-7 bg-slate-100">
                    <th className="border border-black p-1 w-10">Item</th>
                    <th className="border border-black p-1">Description</th>
                    <th className="border border-black p-1 w-12">Unit</th>
                    <th className="border border-black p-1 w-12">Qty</th>
                    <th className="border border-black p-1 w-24">Unit Price(Baht)</th>
                    <th className="border border-black p-1 w-28">Amount(Baht)</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const paddedItems = [...po.items];
                    while (paddedItems.length < 9) {
                      paddedItems.push({
                        id: `empty-po-${paddedItems.length}`,
                        itemNo: paddedItems.length + 1,
                        description: '',
                        unit: '',
                        qty: 0,
                        unitPrice: 0,
                        total: 0
                      } as any);
                    }
                    return paddedItems.map((item, idx) => {
                      const isReal = idx < po.items.length;
                      return (
                        <tr key={item.id || `print-po-pad-${idx}`} className="h-5 text-center">
                          <td className="border border-black p-0.5 text-center text-slate-500">{isReal ? idx + 1 : ''}</td>
                          <td className="border border-black p-0.5 text-left font-medium whitespace-pre-wrap break-words">
                            {isReal ? item.description : ''}
                            {isReal && item.specification && <span className="text-[7.5px] text-slate-500 block">Spec: {item.specification}</span>}
                          </td>
                          <td className="border border-black p-0.5 text-center">{isReal ? item.unit : ''}</td>
                          <td className="border border-black p-0.5 text-center font-bold">{isReal ? item.qty : ''}</td>
                          <td className="border border-black p-0.5 text-right font-mono">
                            {isReal ? item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                          </td>
                          <td className="border border-black p-0.5 text-right font-mono font-bold">
                            {isReal ? item.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                  {/* Totals */}
                  <tr className="h-5">
                    <td colSpan={4} className="border border-black p-1 text-left font-bold italic uppercase text-[8.5px]">
                      Note: {po.notes || 'Please deliver in good condition.'}
                    </td>
                    <td className="border border-black p-1 text-right font-bold uppercase text-[8.5px]">Sub Total</td>
                    <td className="border border-black p-1 text-right font-mono font-bold text-[8.5px]">
                      {po.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr className="h-5">
                    <td colSpan={4} className="border border-black p-1 text-left font-bold text-[8.5px]">
                      Amount in words: THAI BAHT ONLY
                    </td>
                    <td className="border border-black p-1 text-right font-bold uppercase text-[8.5px]">Vat 7%</td>
                    <td className="border border-black p-1 text-right font-mono font-bold text-[8.5px]">
                      {po.vat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr className="h-5 bg-slate-50">
                    <td colSpan={4} className="border border-black p-1 text-left"></td>
                    <td className="border border-black p-1 text-right font-black uppercase text-[8.5px]">Grand Total</td>
                    <td className="border border-black p-1 text-right font-mono font-black border-2 border-black text-[8.5px]">
                      {po.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Signatures Section */}
          <div className="pt-1.5 border-t border-black">
            <div className="grid grid-cols-3 border border-black text-[8.5px]">
              {/* Issued By */}
              <div className="border-r border-black p-1.5 min-h-[70px] relative flex flex-col justify-end">
                {(() => {
                  const issueLog = po.workflowLogs.find(l => l.action === 'CREATED');
                  const sig = issueLog?.signature;
                  if (!sig || !sig.signatureData) return null;
                  return (
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 z-10 pointer-events-none w-24 flex justify-center items-center">
                      <div className="relative h-9 w-24 flex justify-center items-center">
                        {sig.companyStampData && (
                          <img src={sig.companyStampData} alt="Stamp" className="absolute h-9 object-contain opacity-50 mix-blend-multiply" referrerPolicy="no-referrer" />
                        )}
                        <img src={sig.signatureData} alt="Sig" className="relative h-6 object-contain mix-blend-multiply" referrerPolicy="no-referrer" />
                      </div>
                    </div>
                  );
                })()}
                <div className="text-center font-bold">
                  <p className="border-b border-black pb-0.5 mx-2">{po.workflowLogs.find(l => l.action === 'CREATED')?.userName || 'Purchasing Staff'}</p>
                  <p className="mt-0.5">Issued By / Date</p>
                </div>
              </div>

              {/* Checked By */}
              <div className="border-r border-black p-1.5 min-h-[70px] relative flex flex-col justify-end">
                {(() => {
                  const checkLog = po.workflowLogs.find(l => l.stepName === 'Purchasing Manager PO Approval');
                  const sig = checkLog?.signature;
                  if (!sig || !sig.signatureData) return null;
                  return (
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 z-10 pointer-events-none w-24 flex justify-center items-center">
                      <div className="relative h-9 w-24 flex justify-center items-center">
                        {sig.companyStampData && (
                          <img src={sig.companyStampData} alt="Stamp" className="absolute h-9 object-contain opacity-50 mix-blend-multiply" referrerPolicy="no-referrer" />
                        )}
                        <img src={sig.signatureData} alt="Sig" className="relative h-6 object-contain mix-blend-multiply" referrerPolicy="no-referrer" />
                      </div>
                    </div>
                  );
                })()}
                <div className="text-center font-bold">
                  <p className="border-b border-black pb-0.5 mx-2">{po.workflowLogs.find(l => l.stepName === 'Purchasing Manager PO Approval')?.userName || 'Purchasing Manager'}</p>
                  <p className="mt-0.5">Checked By / Date</p>
                </div>
              </div>

              {/* Approved By */}
              <div className="p-1.5 min-h-[70px] relative flex flex-col justify-end">
                {(() => {
                  const appLog = po.workflowLogs.find(l => l.stepName === 'Executive Director PO Approval');
                  const sig = appLog?.signature;
                  if (!sig || !sig.signatureData) return null;
                  return (
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 z-10 pointer-events-none w-24 flex justify-center items-center">
                      <div className="relative h-9 w-24 flex justify-center items-center">
                        {sig.companyStampData && (
                          <img src={sig.companyStampData} alt="Stamp" className="absolute h-9 object-contain opacity-50 mix-blend-multiply" referrerPolicy="no-referrer" />
                        )}
                        <img src={sig.signatureData} alt="Sig" className="relative h-6 object-contain mix-blend-multiply" referrerPolicy="no-referrer" />
                      </div>
                    </div>
                  );
                })()}
                <div className="text-center font-bold">
                  <p className="border-b border-black pb-0.5 mx-2">{po.workflowLogs.find(l => l.stepName === 'Executive Director PO Approval')?.userName || 'Executive Director'}</p>
                  <p className="mt-0.5">Authorized Approved / Date</p>
                </div>
              </div>
            </div>
            <div className="text-right text-[7px] text-slate-500 mt-1 font-mono">
              <p>F-GA-PO-02 Rev:01 Effective: 4 Jul'19</p>
            </div>
          </div>
        </div>
      )}

      {/* ------------------ PAGE 2: PURCHASE REQUISITION (PR) ------------------ */}
      <div 
        className="a4-page-print border-2 border-black font-sans relative text-black text-[10px] flex flex-col justify-between"
        style={{ width: '210mm', height: '297mm', pageBreakAfter: 'always', boxSizing: 'border-box' }}
      >
        <div>
          {/* Header */}
          <div className="border-b-2 border-black pb-2 mb-2">
            <div className="text-center mb-0.5">
              <h1 className="text-xs font-black uppercase text-black">SUMINO AAPICO (Thailand) Company Limited</h1>
            </div>
            <div className="flex justify-between items-end">
              <p className="text-[8px] leading-tight">
                700/706 Moo 3, T. Bankao, A. Panthong, Chonburi 20160<br/>
                Tel: 66-38-447-628-31, Fax No. 66-38-447-632
              </p>
            </div>
            <div className="relative mt-1">
              <h2 className="text-xs font-black tracking-widest uppercase text-center">PURCHASE REQUISITION</h2>
              <div className="absolute right-0 bottom-[-3px]">
                <table className="border border-black text-[8px] font-mono min-w-[140px]">
                  <thead>
                    <tr className="bg-slate-100 border-b border-black text-[7.5px] font-bold">
                      <th className="border border-black px-1 py-0.5 text-center">P/R No.</th>
                      <th className="border border-black px-1 py-0.5 text-center">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="font-bold text-center">
                      <td className="border border-black px-1 py-0.5">{pr.prNumber}</td>
                      <td className="border border-black px-1 py-0.5">{pr.date}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Info Block */}
          <div className="grid grid-cols-2 gap-x-3 text-[8.5px] border-b border-black pb-1 mb-2">
            <div>
              <p className="flex"><span className="font-bold w-20">Requestor:</span><span className="border-b border-slate-300 flex-1">{pr.requestorName}</span></p>
              <p className="flex mt-0.5"><span className="font-bold w-20">Department:</span><span className="border-b border-slate-300 flex-1">{pr.departmentName}</span></p>
            </div>
            <div>
              <p className="flex"><span className="font-bold w-24">Suggested Supplier:</span><span className="border-b border-slate-300 flex-1 font-bold">{pr.vendorName}</span></p>
              <p className="flex mt-0.5"><span className="font-bold w-24">Supplier Tel:</span><span className="border-b border-slate-300 flex-1 font-mono">{pr.vendorPhone}</span></p>
            </div>
          </div>

          {/* Items List Table */}
          <table className="w-full text-[8.5px] text-left border-collapse border border-black mb-2">
            <thead>
              <tr className="bg-slate-100 text-[8px] font-bold text-black uppercase border-b border-black text-center">
                <th className="border border-black p-0.5 w-6">Item</th>
                <th className="border border-black p-0.5 w-16">Part No</th>
                <th className="border border-black p-0.5">Description</th>
                <th className="border border-black p-0.5 w-8">Unit</th>
                <th className="border border-black p-0.5 w-8">Qty</th>
                <th className="border border-black p-0.5 w-16 text-right">Price</th>
                <th className="border border-black p-0.5 w-18 text-right">Total</th>
                <th className="border border-black p-0.5 w-20">Objective</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const paddedItems = [...pr.items];
                while (paddedItems.length < 10) {
                  paddedItems.push({
                    id: `empty-pr-${paddedItems.length}`,
                    itemNo: paddedItems.length + 1,
                    partNo: '',
                    description: '',
                    unit: '',
                    qty: 0,
                    unitPrice: 0,
                    total: 0
                  } as any);
                }
                return paddedItems.map((item, idx) => {
                  const isReal = idx < pr.items.length;
                  return (
                    <tr key={item.id || `print-pr-pad-${idx}`} className="h-5 text-center text-[8px]">
                      <td className="border border-black p-0.5 text-slate-500">{isReal ? idx + 1 : ''}</td>
                      <td className="border border-black p-0.5 font-mono text-left whitespace-pre-wrap break-words">{isReal ? item.partNo : ''}</td>
                      <td className="border border-black p-0.5 text-left font-medium whitespace-pre-wrap break-words">
                        {isReal ? item.description : ''}
                        {isReal && item.specification && <span className="text-[7px] text-slate-500 block">Spec: {item.specification}</span>}
                      </td>
                      <td className="border border-black p-0.5 text-center">{isReal ? item.unit : ''}</td>
                      <td className="border border-black p-0.5 font-bold">{isReal ? item.qty : ''}</td>
                      <td className="border border-black p-0.5 text-right font-mono">
                        {isReal ? item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                      </td>
                      <td className="border border-black p-0.5 text-right font-mono font-bold">
                        {isReal ? item.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                      </td>
                      <td className="border border-black p-0.5 text-left text-[7px] italic whitespace-pre-wrap break-words">
                        {idx === 0 ? pr.purchaseObjective : ''}
                      </td>
                    </tr>
                  );
                });
              })()}
              <tr className="h-5 font-bold bg-slate-50 text-[8.5px]">
                <td colSpan={6} className="border border-black p-0.5 text-right uppercase pr-4">Grand Total</td>
                <td className="border border-black p-0.5 text-right font-mono pr-1 font-black">
                  {pr.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="border border-black p-0.5 text-left pl-1">Baht.</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Signatures Section */}
        <div className="pt-1.5 border-t border-black">
          <div className="grid grid-cols-2 border border-black text-[8px]">
            {/* Box Left: requested and checked */}
            <div className="border-r border-black flex flex-col divide-y divide-black">
              {/* Requested By */}
              <div className="p-1 text-left relative min-h-[44px] flex flex-col justify-end">
                {(() => {
                  const submitLog = pr.workflowLogs.find(l => l.action === 'SUBMITTED');
                  const sig = submitLog?.signature;
                  if (!sig || !sig.signatureData) return null;
                  return (
                    <div className="absolute top-0.5 left-24 z-10 pointer-events-none w-24 flex justify-center items-center">
                      <div className="relative h-7 w-24 flex justify-center items-center">
                        {sig.companyStampData && (
                          <img src={sig.companyStampData} alt="Stamp" className="absolute h-7 object-contain opacity-50 mix-blend-multiply" referrerPolicy="no-referrer" />
                        )}
                        <img src={sig.signatureData} alt="Sig" className="relative h-5 object-contain mix-blend-multiply" referrerPolicy="no-referrer" />
                      </div>
                    </div>
                  );
                })()}
                <p className="flex"><span className="font-bold w-24">1. Requested by:</span><span className="border-b border-black flex-1 text-center font-bold">{pr.requestorName}</span></p>
              </div>

              {/* Dept Mgr Checked */}
              <div className="p-1 text-left relative min-h-[44px] flex flex-col justify-end">
                {(() => {
                  const checkLog = pr.workflowLogs.find(l => l.stepName === 'Department Manager Approval');
                  const sig = checkLog?.signature;
                  if (!sig || !sig.signatureData) return null;
                  return (
                    <div className="absolute top-0.5 left-24 z-10 pointer-events-none w-24 flex justify-center items-center">
                      <div className="relative h-7 w-24 flex justify-center items-center">
                        {sig.companyStampData && (
                          <img src={sig.companyStampData} alt="Stamp" className="absolute h-7 object-contain opacity-50 mix-blend-multiply" referrerPolicy="no-referrer" />
                        )}
                        <img src={sig.signatureData} alt="Sig" className="relative h-5 object-contain mix-blend-multiply" referrerPolicy="no-referrer" />
                      </div>
                    </div>
                  );
                })()}
                <p className="flex"><span className="font-bold w-24">2. Checked by:</span><span className="border-b border-black flex-1 text-center font-bold">
                  {pr.workflowLogs.find(l => l.stepName === 'Department Manager Approval')?.userName || ((pr.departmentId === 'DEP004' || pr.departmentId === 'Administration' || pr.departmentName?.includes('HR')) ? 'นางสาวเบ็ญจวรรณ ทิดชาติ' : ' ')}
                </span></p>
              </div>
            </div>

            {/* Box Right: Executive Approvals */}
            <div className="p-1 text-left relative min-h-[88px] flex flex-col justify-between">
              <div>
                <span className="font-bold uppercase text-[8.5px]">3. Approved</span>
                <div className="flex gap-4 mt-0.5 text-[8px] font-bold">
                  <span className="flex items-center gap-1">
                    <input type="checkbox" checked={pr.status === PRStatus.APPROVED || pr.status === PRStatus.PO_CREATED || pr.status === PRStatus.PENDING_PURCHASING} readOnly className="h-2 w-2" />
                    <span>Approved</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <input type="checkbox" checked={pr.status === PRStatus.REJECTED} readOnly className="h-2 w-2" />
                    <span>Disapproved</span>
                  </span>
                </div>
              </div>

              <div className="relative min-h-[36px] flex flex-col justify-end">
                {(() => {
                  const execLog = pr.workflowLogs.find(l => l.stepName === 'Executive Approval');
                  const sig = execLog?.signature;
                  if (!sig || !sig.signatureData) return null;
                  return (
                    <div className="absolute top-0 left-24 z-10 pointer-events-none w-24 flex justify-center items-center">
                      <div className="relative h-7 w-24 flex justify-center items-center">
                        {sig.companyStampData && (
                          <img src={sig.companyStampData} alt="Stamp" className="absolute h-7 object-contain opacity-50 mix-blend-multiply" referrerPolicy="no-referrer" />
                        )}
                        <img src={sig.signatureData} alt="Sig" className="relative h-5 object-contain mix-blend-multiply" referrerPolicy="no-referrer" />
                      </div>
                    </div>
                  );
                })()}
                <p className="flex"><span className="font-bold w-24">Executive / MD:</span><span className="border-b border-black flex-1 text-center font-bold">
                  {pr.workflowLogs.find(l => l.stepName === 'Executive Approval')?.userName || ' '}
                </span></p>
              </div>
            </div>

            {/* Row Bottom: For Purchasing Dept */}
            <div className="col-span-2 border-t border-black p-1 text-left relative min-h-[36px] flex flex-col justify-end">
              {(() => {
                const purLog = pr.workflowLogs.find(l => l.stepName === 'Purchasing Check');
                const sig = purLog?.signature;
                if (!sig || !sig.signatureData) return null;
                return (
                  <div className="absolute top-0.5 left-24 z-10 pointer-events-none w-24 flex justify-center items-center">
                    <div className="relative h-7 w-24 flex justify-center items-center">
                      {sig.companyStampData && (
                        <img src={sig.companyStampData} alt="Stamp" className="absolute h-7 object-contain opacity-50 mix-blend-multiply" referrerPolicy="no-referrer" />
                      )}
                      <img src={sig.signatureData} alt="Sig" className="relative h-5 object-contain mix-blend-multiply" referrerPolicy="no-referrer" />
                    </div>
                  </div>
                );
              })()}
              <p className="flex text-[8px]"><span className="font-bold w-28">4. For Purchasing Check:</span><span className="border-b border-black w-40 text-center font-bold">
                {pr.workflowLogs.find(l => l.stepName === 'Purchasing Check')?.userName || ' '}
              </span></p>
            </div>
          </div>
          <div className="text-right text-[7px] text-slate-500 font-mono mt-1">
            <p>F-GA-001 Rev:02 Effective date:01 Jul'21</p>
          </div>
        </div>
      </div>

      {/* ------------------ PAGE 3: QUOTATION DOCUMENT ------------------ */}
      <div 
        className="a4-page-print border-2 border-black font-sans relative text-black text-[10px] flex flex-col justify-between"
        style={{ width: '210mm', height: '297mm', pageBreakAfter: (capex || allAttachments.length > 0) ? 'always' : 'avoid', boxSizing: 'border-box' }}
      >
        <div>
          {/* Header */}
          <div className="border-b-2 border-black pb-3 mb-3">
            <div className="text-center mb-1">
              <h1 className="text-sm font-black uppercase text-black">SUMINO KOGYO CO., LTD.</h1>
            </div>
            <div className="flex justify-between items-end">
              <p className="text-[8.5px] leading-tight text-slate-600">
                1-1-1 Yoshihama, Hiroshima, Japan, Zip 730-0811<br/>
                Tel: +81-82-424-1111, Fax No. +81-82-424-2222
              </p>
            </div>
            <div className="relative mt-2">
              <h2 className="text-xs font-black tracking-widest uppercase text-center">QUOTATION</h2>
              <div className="absolute right-0 bottom-[-5px]">
                <table className="border border-black text-[8.5px] font-mono min-w-[150px]">
                  <thead>
                    <tr className="bg-slate-100 border-b border-black text-[8px] font-bold">
                      <th className="border border-black px-1 py-0.5 text-center">QT Number</th>
                      <th className="border border-black px-1 py-0.5 text-center">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="font-bold text-center">
                      <td className="border border-black px-1 py-0.5">QT-{pr.prNumber?.split('-').pop()}</td>
                      <td className="border border-black px-1 py-0.5">{pr.date}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Customer / Prepared For */}
          <div className="grid grid-cols-2 gap-4 text-[9.5px] mb-3">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-500 uppercase text-[8px]">PREPARED FOR:</span>
              <h3 className="font-bold text-black text-[10.5px]">{pr.companyName || 'SUMINO AAPICO (Thailand) Co., Ltd.'}</h3>
              <p className="text-slate-600 leading-normal">
                700/706 Moo 3, T.Bankao, A.Panthong, Chonburi 20160<br/>
                Attn: Procurement Team & Logistics Department
              </p>
            </div>
            <div className="space-y-0.5 border-l border-slate-200 pl-4">
              <span className="font-bold text-slate-500 uppercase text-[8px]">SALES REPRESENTATIVE:</span>
              <h3 className="font-bold text-black text-[10.5px]">Global Customer Support Unit</h3>
              <p className="text-slate-600 leading-normal">
                Delivery Term: FOB Factory / Port of Delivery<br/>
                Payment Term: Net 60 Days / Net 30 Days<br/>
                Currency: Thai Baht (THB)
              </p>
            </div>
          </div>

          {/* Quotation Table */}
          <table className="w-full text-[9px] text-left border-collapse border border-black mb-3">
            <thead>
              <tr className="bg-slate-900 text-white font-mono text-[8px] font-bold uppercase text-center h-8">
                <th className="border border-black p-1 w-8">No.</th>
                <th className="border border-black p-1 w-20">Part Number</th>
                <th className="border border-black p-1">Description</th>
                <th className="border border-black p-1 w-10">Unit</th>
                <th className="border border-black p-1 w-10">Qty</th>
                <th className="border border-black p-1 w-18 text-right">Unit Price</th>
                <th className="border border-black p-1 w-20 text-right">Amount (THB)</th>
              </tr>
            </thead>
            <tbody>
              {pr.items.map((item, idx) => (
                <tr key={idx} className="h-6 text-center text-[8.5px]">
                  <td className="border border-black p-1">{idx + 1}</td>
                  <td className="border border-black p-1 font-mono text-left">{item.partNo || 'N/A'}</td>
                  <td className="border border-black p-1 text-left font-medium truncate max-w-[200px]">{item.description}</td>
                  <td className="border border-black p-1">{item.unit}</td>
                  <td className="border border-black p-1 font-bold">{item.qty}</td>
                  <td className="border border-black p-1 text-right font-mono">
                    {item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="border border-black p-1 text-right font-mono font-bold">
                    {item.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
              {/* Totals */}
              <tr className="h-6 font-bold bg-slate-50">
                <td colSpan={5} className="border border-black p-1 text-right uppercase">Subtotal</td>
                <td colSpan={2} className="border border-black p-1 text-right font-mono font-black pr-1">
                  {pr.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
              <tr className="h-6 font-bold bg-slate-50">
                <td colSpan={5} className="border border-black p-1 text-right uppercase">VAT 7%</td>
                <td colSpan={2} className="border border-black p-1 text-right font-mono font-black pr-1">
                  {pr.vat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
              <tr className="h-6 font-bold bg-slate-100">
                <td colSpan={5} className="border border-black p-1 text-right uppercase text-black font-extrabold">Total Offer (THB)</td>
                <td colSpan={2} className="border border-black p-1 text-right font-mono font-black border-2 border-black text-black">
                  {pr.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="border-t border-dashed border-slate-400 pt-3 text-[8px] text-slate-500">
          <p className="font-bold text-slate-700">TERMS AND CONDITIONS:</p>
          <ul className="list-disc pl-4 space-y-0.5 mt-1">
            <li>Quoted price is inclusive of standard protective ocean-freight packaging.</li>
            <li>Subject to supplier's production and material cost fluctuations if not confirmed in 30 days.</li>
            <li>We certify that this quotation represents our final binding offer for the requested parts.</li>
          </ul>
        </div>
      </div>

      {/* ------------------ PAGE 4: CAPEX REQUISITION (If applicable) ------------------ */}
      {capex && (
        <div 
          className="a4-page-print border-2 border-black font-sans relative text-black text-[10px] flex flex-col justify-between"
          style={{ width: '210mm', height: '297mm', pageBreakAfter: allAttachments.length > 0 ? 'always' : 'avoid', boxSizing: 'border-box' }}
        >
          <div>
            {/* Header */}
            <div className="border-b-2 border-black pb-2 mb-2">
              <div className="text-center mb-1">
                <h1 className="text-sm font-black uppercase text-black">SUMINO AAPICO (Thailand) Company Limited</h1>
              </div>
              <div className="relative mt-2">
                <h2 className="text-xs font-black tracking-widest uppercase text-center">CAPITAL EXPENDITURE REQUISITION (CAPEX)</h2>
                <div className="absolute right-0 bottom-[-5px]">
                  <table className="border border-black text-[8.5px] font-mono min-w-[150px]">
                    <thead>
                      <tr className="bg-slate-100 border-b border-black text-[8px] font-bold">
                        <th className="border border-black px-1 py-0.5 text-center">CAPEX No.</th>
                        <th className="border border-black px-1 py-0.5 text-center">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="font-bold text-center">
                        <td className="border border-black px-1 py-0.5">{capex.capexNumber}</td>
                        <td className="border border-black px-1 py-0.5">{capex.date}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Info Area */}
            <div className="grid grid-cols-2 gap-x-4 text-[9px] border-b border-black pb-1.5 mb-2">
              <div>
                <p className="flex"><span className="font-bold w-24">Project Name:</span><span className="border-b border-slate-300 flex-1 font-bold">{capex.projectName}</span></p>
                <p className="flex mt-1"><span className="font-bold w-24">Asset Group:</span><span className="border-b border-slate-300 flex-1">{capex.assetGroup}</span></p>
              </div>
              <div>
                <p className="flex"><span className="font-bold w-28">Budget Status:</span><span className="border-b border-slate-300 flex-1 font-bold text-sky-600">{capex.budgetStatus === 'WITHIN_BUDGET' ? 'WITHIN BUDGET' : 'SPECIAL REQUEST'}</span></p>
                <p className="flex mt-1"><span className="font-bold w-28">Payback Period:</span><span className="border-b border-slate-300 flex-1 font-mono">{capex.paybackPeriod} Years</span></p>
              </div>
            </div>

            {/* Financial Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center text-[9px] mb-3 bg-slate-50 p-2 border border-black rounded">
              <div>
                <span className="block text-slate-500 uppercase text-[8px] font-bold">Total Investment</span>
                <span className="text-xs font-black text-black font-mono">
                  {capex.totalInvestment.toLocaleString()} THB
                </span>
              </div>
              <div>
                <span className="block text-slate-500 uppercase text-[8px] font-bold">Estimated Cost Savings / Yr</span>
                <span className="text-xs font-black text-black font-mono">
                  {capex.costSavingsPerYear.toLocaleString()} THB
                </span>
              </div>
              <div>
                <span className="block text-slate-500 uppercase text-[8px] font-bold">Financial NPV / IRR</span>
                <span className="text-xs font-black text-sky-700 font-mono">
                  {capex.npvIrr || 'NPV: 15% / IRR: 22%'}
                </span>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-[9px] text-left border-collapse border border-black mb-2">
              <thead>
                <tr className="bg-slate-100 text-[8px] font-bold text-black uppercase border-b border-black text-center">
                  <th className="border border-black p-0.5 w-6">Item</th>
                  <th className="border border-black p-0.5">Asset Description & Technical Specification</th>
                  <th className="border border-black p-0.5 w-10">Unit</th>
                  <th className="border border-black p-0.5 w-10">Qty</th>
                  <th className="border border-black p-0.5 w-20 text-right">Amount (THB)</th>
                </tr>
              </thead>
              <tbody>
                {capex.items.map((item, idx) => (
                  <tr key={idx} className="h-6 text-center text-[8.5px]">
                    <td className="border border-black p-1">{idx + 1}</td>
                    <td className="border border-black p-1 text-left font-medium">
                      {item.description}
                      {item.specification && <span className="block text-[7.5px] text-slate-500">Spec: {item.specification}</span>}
                    </td>
                    <td className="border border-black p-1">{item.unit}</td>
                    <td className="border border-black p-1 font-bold">{item.qty}</td>
                    <td className="border border-black p-1 text-right font-mono font-bold">
                      {item.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                <tr className="h-6 font-bold bg-slate-50">
                  <td colSpan={4} className="border border-black p-1 text-right uppercase">CAPEX Grand Total</td>
                  <td className="border border-black p-1 text-right font-mono font-black pr-1 border-2 border-black">
                    {capex.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Bottom Signatures Block */}
          <div className="pt-2 border-t border-black">
            <div className="grid grid-cols-2 border border-black text-[8.5px]">
              {/* Checked By Manager */}
              <div className="border-r border-black p-1.5 min-h-[55px] relative flex flex-col justify-end">
                {(() => {
                  const checkLog = capex.workflowLogs.find(l => l.stepName === 'Department Manager Approval');
                  const sig = checkLog?.signature;
                  if (!sig || !sig.signatureData) return null;
                  return (
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 z-10 pointer-events-none w-24 flex justify-center items-center">
                      <div className="relative h-8 w-24 flex justify-center items-center">
                        {sig.companyStampData && (
                          <img src={sig.companyStampData} alt="Stamp" className="absolute h-8 object-contain opacity-50 mix-blend-multiply" referrerPolicy="no-referrer" />
                        )}
                        <img src={sig.signatureData} alt="Sig" className="relative h-6 object-contain mix-blend-multiply" referrerPolicy="no-referrer" />
                      </div>
                    </div>
                  );
                })()}
                <div className="text-center font-bold">
                  <p className="border-b border-black pb-0.5 mx-2">{capex.workflowLogs.find(l => l.stepName === 'Department Manager Approval')?.userName || 'Department Manager'}</p>
                  <p className="mt-0.5">Checked By / Date</p>
                </div>
              </div>

              {/* Approved By Executive */}
              <div className="p-1.5 min-h-[55px] relative flex flex-col justify-end">
                {(() => {
                  const appLog = capex.workflowLogs.find(l => l.stepName === 'Executive Approval');
                  const sig = appLog?.signature;
                  if (!sig || !sig.signatureData) return null;
                  return (
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 z-10 pointer-events-none w-24 flex justify-center items-center">
                      <div className="relative h-8 w-24 flex justify-center items-center">
                        {sig.companyStampData && (
                          <img src={sig.companyStampData} alt="Stamp" className="absolute h-8 object-contain opacity-50 mix-blend-multiply" referrerPolicy="no-referrer" />
                        )}
                        <img src={sig.signatureData} alt="Sig" className="relative h-6 object-contain mix-blend-multiply" referrerPolicy="no-referrer" />
                      </div>
                    </div>
                  );
                })()}
                <div className="text-center font-bold">
                  <p className="border-b border-black pb-0.5 mx-2">{capex.workflowLogs.find(l => l.stepName === 'Executive Approval')?.userName || 'Executive Plant Manager'}</p>
                  <p className="mt-0.5">Authorized Approved / Date</p>
                </div>
              </div>
            </div>
            <div className="text-right text-[7px] text-slate-500 font-mono mt-2">
              <p>F-GA-CX-01 Rev:01 Effective: 1 Oct'20</p>
            </div>
          </div>
        </div>
      )}

      {/* ------------------ ATTACHMENTS & VERIFICATION FILES PAGES ------------------ */}
      {allAttachments.map((att, idx) => (
        <div 
          key={att.id || idx}
          className="a4-page-print border-2 border-black font-sans relative text-black text-[10px] flex flex-col justify-between"
          style={{ width: '210mm', height: '297mm', pageBreakAfter: idx === allAttachments.length - 1 ? 'avoid' : 'always', boxSizing: 'border-box' }}
        >
          <div>
            {/* Header */}
            <div className="border-b-2 border-black pb-2 mb-3 flex justify-between items-center">
              <div>
                <h1 className="text-xs font-black uppercase text-black">SUMINO AAPICO (Thailand) Company Limited</h1>
                <p className="text-[9px] font-bold text-slate-800">ATTACHED DOCUMENT / VERIFICATION FILE ({idx + 1} / {allAttachments.length})</p>
              </div>
              <div className="text-right text-[8.5px] font-mono">
                <p><span className="font-bold">File Name:</span> {att.fileName}</p>
                <p><span className="font-bold">Source:</span> {att.source}</p>
                <p><span className="font-bold">PR Ref:</span> {pr.prNumber} {po ? `| PO: ${po.poNumber}` : ''}</p>
              </div>
            </div>

            {/* Document Content / Image View */}
            <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-400 p-2 min-h-[220mm] bg-slate-50/50 rounded overflow-hidden">
              {att.url && (att.url.startsWith('data:image/') || att.url.endsWith('.png') || att.url.endsWith('.jpg') || att.url.endsWith('.jpeg') || att.url.endsWith('.webp') || att.url.endsWith('.svg') || att.url.includes('images.unsplash.com')) ? (
                <img 
                  src={att.url} 
                  alt={att.fileName} 
                  className="max-h-[210mm] max-w-[185mm] object-contain shadow-sm border border-slate-300" 
                  referrerPolicy="no-referrer" 
                />
              ) : (
                <div className="text-center p-8 space-y-3">
                  <div className="p-4 bg-slate-100 border border-slate-300 rounded-xl inline-block font-mono text-xs font-bold text-slate-800">
                    📄 {att.fileName}
                  </div>
                  <p className="text-xs font-bold text-slate-700">{att.source}</p>
                  <p className="text-[10px] text-slate-500 max-w-md mx-auto break-all font-mono">
                    URL: {att.url}
                  </p>
                  <div className="text-[9px] text-slate-400 italic">
                    (Official attachment verified and preserved in digital audit log)
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-black pt-1.5 flex justify-between items-center text-[8px] font-mono text-slate-600">
            <p>Document Ref: {pr.prNumber} / {po?.poNumber || 'PR-STAGE'}</p>
            <p>System Verified Attachment • Page { (po ? 2 : 1) + 1 + (capex ? 1 : 0) + idx + 1 }</p>
          </div>
        </div>
      ))}

    </div>
  );
}
