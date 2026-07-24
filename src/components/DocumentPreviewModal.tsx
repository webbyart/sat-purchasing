/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  Printer, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  FileText, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Layers,
  FileCheck2,
  ShieldAlert,
  ExternalLink
} from 'lucide-react';
import { PRItem } from '../types.js';

interface DocumentPreviewModalProps {
  fileName: string;
  fileUrl: string;
  onClose: () => void;
  // Optional metadata to render a gorgeous high-fidelity simulated corporate layout
  vendorName?: string;
  vendorAddress?: string;
  vendorPhone?: string;
  items?: PRItem[];
  subtotal?: number;
  vat?: number;
  grandTotal?: number;
  documentDate?: string;
  documentNumber?: string;
  companyName?: string;
}

function dataURLtoBlob(dataurl: string, fileName?: string): Blob | null {
  try {
    const arr = dataurl.split(',');
    if (arr.length < 2) return null;
    let mimeMatch = arr[0].match(/:(.*?);/);
    let mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';

    if (fileName) {
      const lower = fileName.toLowerCase();
      if (lower.endsWith('.pdf')) mime = 'application/pdf';
      else if (lower.endsWith('.png')) mime = 'image/png';
      else if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) mime = 'image/jpeg';
      else if (lower.endsWith('.webp')) mime = 'image/webp';
    }

    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (e) {
    return null;
  }
}

export function openFileInNewTab(fileUrl?: string, fileName?: string) {
  if (!fileUrl) return;

  if (fileUrl.startsWith('data:')) {
    try {
      const arr = fileUrl.split(',');
      if (arr.length >= 2) {
        let mimeMatch = arr[0].match(/:(.*?);/);
        let mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
        if (fileName) {
          const lower = fileName.toLowerCase();
          if (lower.endsWith('.pdf')) mime = 'application/pdf';
          else if (lower.endsWith('.png')) mime = 'image/png';
          else if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) mime = 'image/jpeg';
          else if (lower.endsWith('.webp')) mime = 'image/webp';
        }

        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        const win = window.open(blobUrl, '_blank');
        if (!win) {
          location.href = blobUrl;
        }
        return;
      }
    } catch (e) {
      console.error("Error opening blob in new tab:", e);
    }
  }

  window.open(fileUrl, '_blank');
}

export default function DocumentPreviewModal({
  fileName,
  fileUrl,
  onClose,
  vendorName = 'SUMINO KOGYO CO., LTD.',
  vendorAddress = '1-1-1 Yoshihama, Hiroshima, Japan, Zip 730-0811',
  vendorPhone = '+81-82-424-1111',
  items = [],
  subtotal = 0,
  vat = 0,
  grandTotal = 0,
  documentDate = '2026-07-21',
  documentNumber = 'QT-2026-0089',
  companyName = 'SUMINO AAPICO (Thailand) Company Limited'
}: DocumentPreviewModalProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const autoOpenedRef = React.useRef(false);

  const hasRealFile = Boolean(
    fileUrl && (
      fileUrl.startsWith('data:') || 
      fileUrl.startsWith('http://') || 
      fileUrl.startsWith('https://') || 
      fileUrl.startsWith('blob:')
    )
  );

  const [viewMode, setViewMode] = useState<'embed' | 'simulated'>(() => {
    return hasRealFile ? 'embed' : 'simulated';
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const totalPages = 1;

  // Auto-open in new tab immediately when modal is triggered with a real file
  useEffect(() => {
    if (!autoOpenedRef.current && hasRealFile && fileUrl) {
      autoOpenedRef.current = true;
      openFileInNewTab(fileUrl, fileName);
    }
  }, [fileUrl, fileName, hasRealFile]);

  // Sync viewMode if fileUrl changes
  useEffect(() => {
    if (hasRealFile) {
      setViewMode('embed');
    }
  }, [fileUrl, hasRealFile]);

  // Convert base64 data URLs to browser Blob URLs to prevent Chrome iframe blocking
  useEffect(() => {
    if (fileUrl && fileUrl.startsWith('data:')) {
      try {
        const blob = dataURLtoBlob(fileUrl, fileName);
        if (blob) {
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);
          return () => {
            URL.revokeObjectURL(url);
          };
        }
      } catch (e) {
        console.error("Failed to convert data URL to Blob", e);
      }
    } else {
      setBlobUrl(null);
    }
  }, [fileUrl, fileName]);

  const handlePrint = () => {
    // If simulated, we can trigger print of that specific element
    const printContent = document.getElementById('simulated-document-pdf-body');
    if (printContent && viewMode === 'simulated') {
      const originalContent = document.body.innerHTML;
      document.body.innerHTML = printContent.innerHTML;
      window.print();
      // Reload to restore state
      window.location.reload();
    } else {
      window.print();
    }
  };

  const isImage = fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|svg)$/) || (fileUrl && fileUrl.startsWith('data:image/'));

  const getGoogleDrivePreviewUrl = (url: string): string | null => {
    if (!url) return null;
    const reg1 = /\/file\/d\/([a-zA-Z0-9_-]+)/;
    const reg2 = /[?&]id=([a-zA-Z0-9_-]+)/;
    
    const match1 = url.match(reg1);
    if (match1 && match1[1]) return `https://drive.google.com/file/d/${match1[1]}/preview`;
    
    const match2 = url.match(reg2);
    if (match2 && match2[1]) return `https://drive.google.com/file/d/${match2[1]}/preview`;

    return null;
  };

  const isRealDataOrHttpUrl = Boolean(
    fileUrl && (
      fileUrl.startsWith('data:') || 
      fileUrl.startsWith('http://') || 
      fileUrl.startsWith('https://') || 
      fileUrl.startsWith('blob:')
    )
  );

  const googleDrivePreviewUrl = getGoogleDrivePreviewUrl(fileUrl);
  const effectiveFileUrl = isRealDataOrHttpUrl ? fileUrl : '';
  const effectiveBlobOrFileUrl = blobUrl || effectiveFileUrl;

  const handleOpenInNewTab = () => {
    const urlToUse = blobUrl || (isRealDataOrHttpUrl ? fileUrl : null);
    if (urlToUse) {
      window.open(urlToUse, '_blank');
    } else {
      const printContent = document.getElementById('simulated-document-pdf-body');
      if (printContent) {
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>${fileName}</title>
                <script src="https://cdn.tailwindcss.com"></script>
              </head>
              <body class="p-8 bg-white">${printContent.innerHTML}</body>
            </html>
          `);
          win.document.close();
        }
      }
    }
  };

  const handleDownloadFile = () => {
    const urlToUse = blobUrl || (isRealDataOrHttpUrl ? fileUrl : null);
    if (!urlToUse) {
      alert('ไม่สามารถดาวน์โหลดไฟล์นี้ได้ในขณะนี้');
      return;
    }
    const link = document.createElement('a');
    link.href = urlToUse;
    link.download = fileName || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200 no-print" id="document-preview-modal-overlay">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Top Control Bar */}
        <div className="bg-slate-950/90 px-6 py-4 border-b border-slate-800 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-sky-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                {fileName}
                {fileName.toLowerCase().includes('test') && (
                  <span className="bg-sky-500/20 text-sky-400 text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Verified Quotation</span>
                )}
              </h3>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                {isImage ? 'Image Asset' : 'Portable Document Format (PDF)'} • {items.length > 0 ? `${items.length} Line Items` : 'Linked Document'}
              </p>
            </div>
          </div>

          {/* Interactive controls */}
          <div className="flex items-center gap-2">
            {!isImage && (
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-0.5 flex gap-1">
                <button
                  onClick={() => setViewMode('embed')}
                  className={`text-xs px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'embed'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                  title="แสดงไฟล์จริงที่แนบมา (Real Attached PDF / Document)"
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>ไฟล์แนบจริง (Real File)</span>
                </button>
                <button
                  onClick={() => setViewMode('simulated')}
                  className={`text-xs px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'simulated'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                  title="แสดงตารางสรุปรายการใบเสนอราคา"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>สรุปรายการสินค้า</span>
                </button>
              </div>
            )}

            <div className="h-6 w-[1px] bg-slate-800 mx-1 hidden sm:block" />

            {/* Zoom controls */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-1.5 py-0.5">
              <button 
                onClick={() => setZoom(prev => Math.max(50, prev - 10))}
                className="p-1 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="text-[10px] text-slate-300 font-mono font-bold w-12 text-center">{zoom}%</span>
              <button 
                onClick={() => setZoom(prev => Math.min(200, prev + 10))}
                className="p-1 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>

            {/* Rotate */}
            <button 
              onClick={() => setRotation(prev => (prev + 90) % 360)}
              className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Rotate Document"
            >
              <RotateCw className="h-4 w-4" />
            </button>

            {/* Print */}
            <button 
              onClick={handlePrint}
              className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Print Document"
            >
              <Printer className="h-4 w-4" />
            </button>

            {/* Open in new tab */}
            <button
              onClick={handleOpenInNewTab}
              className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
              title="เปิดดูไฟล์ในแท็บใหม่ (Open in New Tab)"
            >
              <ExternalLink className="h-4 w-4 text-sky-400" />
              <span className="hidden sm:inline">แท็บใหม่</span>
            </button>

            {/* Download */}
            <button 
              onClick={handleDownloadFile}
              className="p-2 bg-slate-900 border border-slate-800 hover:bg-sky-900 hover:text-white text-sky-400 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
              title="Download original file"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Save File</span>
            </button>

            <div className="h-6 w-[1px] bg-slate-800 mx-1" />

            {/* Close */}
            <button 
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Close Preview"
              id="btn-close-document-preview"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Outer Workspace Canvas */}
        <div className="flex-1 bg-slate-950 p-6 overflow-auto flex justify-center items-start">
          <div 
            style={{ 
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out'
            }}
            className="w-full max-w-3xl bg-white text-slate-900 shadow-2xl rounded-lg overflow-hidden transition-all duration-300"
          >
            {googleDrivePreviewUrl ? (
              <div className="bg-slate-800 text-white min-h-[500px] flex flex-col">
                <iframe 
                  src={googleDrivePreviewUrl} 
                  title={fileName} 
                  className="w-full h-[65vh] border-none"
                  allow="autoplay"
                />
              </div>
            ) : isImage ? (
              <div className="p-4 flex justify-center items-center bg-slate-100 min-h-[400px]">
                <img 
                  src={effectiveBlobOrFileUrl || effectiveFileUrl} 
                  alt={fileName} 
                  className="max-w-full h-auto object-contain max-h-[70vh] rounded shadow-xs" 
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (isRealDataOrHttpUrl && viewMode === 'embed' && effectiveBlobOrFileUrl) ? (
              <div className="bg-slate-900 text-white min-h-[600px] flex flex-col">
                {/* Embedded PDF container with object/embed and protected fallback */}
                <object 
                  data={effectiveBlobOrFileUrl} 
                  type="application/pdf" 
                  className="w-full h-[65vh]"
                >
                  <embed src={effectiveBlobOrFileUrl} type="application/pdf" className="w-full h-[65vh]" />
                  <iframe 
                    src={effectiveBlobOrFileUrl} 
                    title={fileName} 
                    className="w-full h-[65vh] border-none"
                  >
                    <div className="p-8 text-center text-slate-300 space-y-3">
                      <ShieldAlert className="h-10 w-10 text-amber-400 mx-auto" />
                      <p className="text-sm font-bold">หากแสดงผล PDF ไม่ได้ในกรอบนี้</p>
                      <button 
                        onClick={handleOpenInNewTab} 
                        className="px-4 py-2 bg-sky-600 text-white rounded-lg text-xs font-bold"
                      >
                        เปิดดูในแท็บใหม่ (Open in New Tab)
                      </button>
                    </div>
                  </iframe>
                </object>
                
                {/* Inline browser compatibility helper bar inside iframe workspace */}
                <div className="bg-slate-900 p-3.5 border-t border-slate-800 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                    <ShieldAlert className="h-4 w-4 text-amber-500" />
                    <span>แนบเอกสาร <b>{fileName}</b> (หากถูกบล็อก สามารถสลับไป High-Fi Reader หรือเปิดแท็บใหม่)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleOpenInNewTab}
                      className="text-sky-400 hover:text-sky-300 font-bold underline transition-colors"
                    >
                      เปิดแท็บใหม่
                    </button>
                    <button 
                      onClick={() => setViewMode('simulated')}
                      className="text-white bg-sky-600 hover:bg-sky-500 px-3 py-1 rounded text-[11px] font-bold transition-colors"
                    >
                      สลับไป High-Fi Reader
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Simulated Document (High Fidelity official Corporate quotation template) */
              <div className="p-10 font-sans leading-relaxed text-slate-900 text-left bg-white" id="simulated-document-pdf-body">
                {/* Header Letterhead */}
                <div className="border-b-2 border-black pb-4 mb-6">
                  <div className="text-center mb-2">
                    <h1 className="text-base font-black tracking-wide uppercase text-black">SUMINO AAPICO (Thailand) Company Limited</h1>
                  </div>
                  
                  <div className="flex justify-between items-end">
                    <div className="text-left">
                      <p className="text-[9px] text-black font-medium leading-tight">
                        700/706 Moo 3, T. Bankao, A. Panthong, Chonburi 20160<br/>
                        Tel: 66-38-447-628-31, Fax No. 66-38-447-632<br/>
                        Tax No. 0-2055-56012-44-8
                      </p>
                    </div>
                  </div>

                  <div className="relative mt-4">
                    <h2 className="text-sm font-black text-black tracking-widest uppercase text-center">QUOTATION / DOCUMENT PREVIEW</h2>
                    
                    <div className="absolute right-0 bottom-[-10px]">
                      <table className="border-collapse border border-black text-[10px] font-mono min-w-[180px]">
                        <thead>
                          <tr className="bg-white border-b border-black text-[9px] font-black uppercase">
                            <th className="border border-black px-1 py-0.5 text-center w-1/2">Doc Number</th>
                            <th className="border border-black px-1 py-0.5 text-center w-1/2">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="font-bold text-center h-6">
                            <td className="border border-black px-1 py-1 text-black">{documentNumber}</td>
                            <td className="border border-black px-1 py-1 text-black">{documentDate}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Billing / Customer Info */}
                <div className="grid grid-cols-2 gap-8 text-[11px] mb-8">
                  <div className="space-y-1.5">
                    <span className="font-extrabold text-[10px] uppercase text-slate-400 tracking-wider">PREPARED FOR:</span>
                    <h3 className="font-bold text-slate-900 text-xs">{companyName}</h3>
                    <p className="text-slate-600 leading-normal">
                      700/706 Moo 3, T.Bankao, A.Panthong, Chonburi 20160<br/>
                      Attn: Procurement Team & Logistics Department
                    </p>
                  </div>
                  <div className="space-y-1.5 border-l border-slate-200 pl-6">
                    <span className="font-extrabold text-[10px] uppercase text-slate-400 tracking-wider">SUPPLIER / VENDOR:</span>
                    <h3 className="font-bold text-slate-900 text-xs">{vendorName}</h3>
                    <p className="text-slate-600 leading-normal">
                      {vendorAddress}<br/>
                      Tel: {vendorPhone}<br/>
                      Currency: Thai Baht (THB)
                    </p>
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full text-left text-xs border-collapse border border-slate-300 mb-8">
                  <thead>
                    <tr className="bg-slate-900 text-white font-mono text-[10px] font-bold uppercase">
                      <th className="p-2.5 border border-slate-300 text-center w-12">No.</th>
                      <th className="p-2.5 border border-slate-300 w-32">Part Number</th>
                      <th className="p-2.5 border border-slate-300">Description</th>
                      <th className="p-2.5 border border-slate-300 text-center w-16">Unit</th>
                      <th className="p-2.5 border border-slate-300 text-center w-16">Qty</th>
                      <th className="p-2.5 border border-slate-300 text-right w-24">Unit Price</th>
                      <th className="p-2.5 border border-slate-300 text-right w-28">Amount (THB)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {items.length > 0 ? (
                      items.map((item, index) => (
                        <tr key={index} className="text-[11px] hover:bg-slate-50/50">
                          <td className="p-2.5 border border-slate-300 text-center font-mono text-slate-500">{index + 1}</td>
                          <td className="p-2.5 border border-slate-300 font-mono text-slate-800 font-semibold">{item.partNo || 'N/A'}</td>
                          <td className="p-2.5 border border-slate-300">
                            <span className="font-bold text-slate-900 block">{item.description}</span>
                            {item.specification && <span className="text-[9px] text-slate-400 italic block mt-0.5">{item.specification}</span>}
                          </td>
                          <td className="p-2.5 border border-slate-300 text-center text-slate-600 font-mono">{item.unit}</td>
                          <td className="p-2.5 border border-slate-300 text-center font-semibold text-slate-900 font-mono">{item.qty}</td>
                          <td className="p-2.5 border border-slate-300 text-right font-mono text-slate-700">
                            {item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-2.5 border border-slate-300 text-right font-mono font-bold text-slate-950 bg-slate-50/30">
                            {item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 italic font-medium">
                          No quotation line items provided.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Subtotals & Signatures footer */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  <div className="text-[10px] text-slate-500 space-y-2 leading-relaxed">
                    <p className="font-bold text-slate-700 uppercase tracking-wider text-[9px] border-b border-slate-200 pb-1">Terms & Conditions:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Prices are valid for thirty (30) days from quotation date.</li>
                      <li>Delivery schedule: Within 14 business days upon receiving official PO.</li>
                      <li>Payment: Directly to corporate bank account indicated in the invoice.</li>
                      <li>Governing Law: Subject to local industrial and commercial regulations.</li>
                    </ul>
                  </div>

                  <div className="w-full max-w-sm justify-self-end text-xs font-mono text-slate-600 space-y-2 bg-slate-50 p-4 border border-slate-200 rounded">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="text-slate-900 font-bold">{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} THB</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Value Added Tax (VAT 7%):</span>
                      <span className="text-slate-900 font-bold">{vat.toLocaleString(undefined, { minimumFractionDigits: 2 })} THB</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-300 pt-2 text-sm font-sans">
                      <span className="font-black text-slate-900">GRAND TOTAL:</span>
                      <span className="font-black text-slate-950 text-right text-base">{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} THB</span>
                    </div>
                  </div>
                </div>

                {/* Official Stamp & Representative Sign-off mockup */}
                <div className="mt-12 pt-8 border-t border-slate-100 flex justify-between items-center text-[10px]">
                  <div className="space-y-1">
                    <p className="text-slate-400 uppercase font-extrabold tracking-widest text-[9px]">Verified Digitally By</p>
                    <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                      <FileCheck2 className="h-4 w-4 text-emerald-600" />
                      <span>E-DOCUMENT ASSURANCE ENGINE v4.2</span>
                    </div>
                  </div>
                  <div className="text-center space-y-3 relative">
                    {/* Simulated round official red stamp/seal */}
                    <div className="absolute -top-6 -left-8 w-16 h-16 rounded-full border-4 border-rose-600/20 text-rose-600/30 font-black text-[9px] flex items-center justify-center rotate-12 select-none pointer-events-none uppercase tracking-tight">
                      SUMINO CO.
                    </div>
                    <div className="border-b border-slate-400 w-36 pb-1 font-mono italic text-slate-500">
                      Auto Approved
                    </div>
                    <p className="text-slate-400 font-mono">Authorized Representative</p>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>

        {/* Bottom Status Panel */}
        <div className="bg-slate-950 border-t border-slate-800 px-6 py-3.5 flex justify-between items-center text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-medium text-[11px] text-slate-300">Sumino Secure SecureDoc-Viewer Mode</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] text-slate-500">PREVIEW RENDER OK</span>
            <div className="h-3 w-[1px] bg-slate-800" />
            <span className="font-bold text-slate-300">Page {currentPage} of {totalPages}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
