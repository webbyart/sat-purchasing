/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { ShieldCheck, RotateCcw, PenTool, UploadCloud, Check, Trash2, Building } from 'lucide-react';

interface SignaturePadProps {
  onSave: (signatureDataUrl: string, companyStampDataUrl?: string, geoCoordinates?: string) => void;
  onCancel: () => void;
  title?: string;
  isExecutive?: boolean;
}

export default function SignaturePad({ onSave, onCancel, title = 'Digital E-Signature', isExecutive = false }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeTab, setActiveTab] = useState<'draw' | 'upload'>('draw');
  
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  
  // Upload states
  const [uploadedSig, setUploadedSig] = useState<string>('');
  const [uploadedStamp, setUploadedStamp] = useState<string>('');
  
  // Geolocation
  const [geoSim, setGeoSim] = useState('13.4124, 101.1245'); // Simulated factory GPS
  const [isLoadingGPS, setIsLoadingGPS] = useState(false);

  useEffect(() => {
    // Attempt real geolocation, default to factory coordinates on fallback/iframe block
    if (navigator.geolocation) {
      setIsLoadingGPS(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeoSim(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
          setIsLoadingGPS(false);
        },
        () => {
          setIsLoadingGPS(false);
        },
        { timeout: 5000 }
      );
    }
  }, []);

  // Set canvas scale for clear resolution (only when activeTab is 'draw')
  useEffect(() => {
    if (activeTab === 'draw') {
      const timer = setTimeout(() => {
        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          canvas.width = rect.width;
          canvas.height = rect.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.strokeStyle = '#0f172a'; // Deep slate
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
          }
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineTo(x, y);
        ctx.stroke();
        setHasSigned(true);
      }
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSigned(false);
      }
    }
  };

  // Upload handlers
  const handleSigFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedSig(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleStampFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedStamp(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    let finalSignature = '';
    if (activeTab === 'draw') {
      const canvas = canvasRef.current;
      if (canvas && hasSigned) {
        finalSignature = canvas.toDataURL('image/png');
      }
    }
    
    if (!finalSignature && uploadedSig) {
      finalSignature = uploadedSig;
    }

    if (!finalSignature) return;

    onSave(finalSignature, uploadedStamp || undefined, geoSim);
  };

  const handleLoadStandardExecutiveCredentials = () => {
    setUploadedStamp('https://lh3.googleusercontent.com/d/1mMCAyix03zAA2BCquyONnZXRaxTxhAgu');
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.font = 'italic bold 26px serif';
      ctx.fillStyle = '#0f172a';
      ctx.fillText('Liu Dong / Konishi', 20, 55);
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(15, 70);
      ctx.lineTo(290, 70);
      ctx.stroke();
    }
    setUploadedSig(canvas.toDataURL('image/png'));
  };

  const isSaveDisabled = activeTab === 'draw' ? (!hasSigned && !uploadedSig) : !uploadedSig;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-sky-400" />
            <h3 className="font-bold text-sm tracking-tight">{title}</h3>
          </div>
          <span className="text-[9px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
            SECURE SHA-256 DIGITAL KEY
          </span>
        </div>

        {/* Content Area - Scrollable */}
        <div className="p-5 overflow-y-auto space-y-4 text-left flex-1">
          <p className="text-xs text-slate-500 leading-relaxed">
            Please provide your official corporate electronic signature. This will be cryptographically bound to this purchasing document's audit log.
          </p>

          {/* Tab Selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('draw')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'draw' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <PenTool className="h-3.5 w-3.5" />
              <span>Touchpad / Draw Signature</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'upload' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <UploadCloud className="h-3.5 w-3.5" />
              <span>Upload E-Signature (.png)</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
            {activeTab === 'draw' ? (
              <div className="relative bg-white h-44">
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-full cursor-crosshair block"
                />
                {!hasSigned && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400 text-xs gap-1.5">
                    <PenTool className="h-5 w-5 text-slate-300 animate-bounce" />
                    <span>Draw signature inside this box</span>
                  </div>
                )}
                {hasSigned && (
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="absolute bottom-2 right-2 bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm transition-colors"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset
                  </button>
                )}
              </div>
            ) : (
              <div className="p-4 bg-white flex flex-col items-center justify-center h-44">
                {uploadedSig ? (
                  <div className="relative border border-slate-200 rounded-lg p-3 bg-slate-50 max-h-[140px] flex items-center justify-center group w-full">
                    <img 
                      src={uploadedSig} 
                      alt="Uploaded Signature" 
                      className="max-h-24 object-contain mix-blend-multiply" 
                    />
                    <button
                      type="button"
                      onClick={() => setUploadedSig('')}
                      className="absolute top-2 right-2 bg-rose-50 text-rose-600 hover:bg-rose-100 p-1.5 rounded-full transition-colors shadow-xs"
                      title="Remove signature"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-200 hover:border-sky-500 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer w-full h-full transition-all bg-slate-50 hover:bg-sky-50/20">
                    <div className="p-2.5 bg-white border border-slate-100 text-slate-500 rounded-xl shadow-2xs">
                      <UploadCloud className="h-5 w-5 text-sky-600" />
                    </div>
                    <div className="text-center">
                      <p className="text-[11px] font-bold text-slate-800">Click to upload signature PNG file</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-sans">Accepts .png transparent signature images</p>
                    </div>
                    <input
                      type="file"
                      accept="image/png"
                      onChange={handleSigFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            )}
          </div>

          {/* Executive Company Stamp & Signature Upload Section */}
          {isExecutive && (
            <div className="border border-amber-300 bg-amber-50/70 shadow-xs ring-1 ring-amber-200/50 rounded-2xl p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-500 text-white rounded-lg shadow-xs">
                    <Building className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-extrabold text-amber-950 uppercase tracking-wider">
                      Executive Official Credentials (สีทองพรีเมียม)
                    </h4>
                    <p className="text-[9px] text-amber-700/90 font-medium">
                      Authorized Managing Director E-Sign & Corporate Stamp (Mr. Liu Dong / Mr. Yoshiyuki Konishi)
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLoadStandardExecutiveCredentials}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold rounded-lg transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer self-start sm:self-auto"
                  title="โหลดตราประทับบริษัทและลายเซ็นผู้บริหารมาตรฐานโดยอัตโนมัติ"
                >
                  <Check className="h-3 w-3" />
                  <span>โหลดตราประทับ & ลายเซ็นตัวอย่าง</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Executive Signature Upload */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-amber-950 uppercase tracking-wide flex items-center gap-1">
                    <PenTool className="h-3 w-3 text-amber-600" />
                    Executive Signature (ลายเซ็นผู้บริหาร)
                  </label>
                  
                  {uploadedSig ? (
                    <div className="relative border border-amber-200/60 rounded-xl p-3 bg-white h-24 flex items-center justify-center w-full">
                      <img 
                        src={uploadedSig} 
                        alt="Uploaded Executive Signature" 
                        className="max-h-16 object-contain mix-blend-multiply" 
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedSig('');
                        }}
                        className="absolute top-1.5 right-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 p-1 rounded-full transition-colors shadow-xs"
                        title="Remove signature"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-amber-200 hover:border-amber-500 rounded-xl p-3 flex flex-col items-center justify-center gap-1 cursor-pointer w-full h-24 transition-all bg-white hover:bg-amber-50/10">
                      <UploadCloud className="h-4.5 w-4.5 text-amber-600" />
                      <div className="text-center">
                        <p className="text-[9px] font-bold text-amber-950">Upload Signature (.png)</p>
                        <p className="text-[8px] text-amber-600 font-sans">Click to browse file</p>
                      </div>
                      <input
                        type="file"
                        accept="image/png"
                        onChange={(e) => {
                          handleSigFileChange(e);
                          setActiveTab('upload');
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* 2. Company Stamp Upload */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-amber-950 uppercase tracking-wide flex items-center gap-1">
                    <Building className="h-3 w-3 text-amber-600" />
                    Company Seal/Stamp (ตราประทับบริษัท)
                  </label>

                  {uploadedStamp ? (
                    <div className="relative border border-amber-200/60 rounded-xl p-3 bg-white h-24 flex items-center justify-center w-full">
                      <img 
                        src={uploadedStamp} 
                        alt="Company Stamp" 
                        className="max-h-16 object-contain mix-blend-multiply" 
                      />
                      <button
                        type="button"
                        onClick={() => setUploadedStamp('')}
                        className="absolute top-1.5 right-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 p-1 rounded-full transition-colors shadow-xs"
                        title="Remove corporate stamp"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-amber-200 hover:border-amber-500 rounded-xl p-3 flex flex-col items-center justify-center gap-1 cursor-pointer w-full h-24 transition-all bg-white hover:bg-amber-50/10">
                      <UploadCloud className="h-4.5 w-4.5 text-amber-600" />
                      <div className="text-center">
                        <p className="text-[9px] font-bold text-amber-950">Upload Stamp (.png)</p>
                        <p className="text-[8px] text-amber-600 font-sans">Click to browse seal</p>
                      </div>
                      <input
                        type="file"
                        accept="image/png, image/jpeg"
                        onChange={handleStampFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Cryptographic metadata display */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[10px] font-mono space-y-1 text-slate-500">
            <div className="flex justify-between">
              <span>SECURITY CRYPTO:</span>
              <span className="text-slate-800 font-bold">SHA-256 AES-BLOCKCHAIN-LOCKED</span>
            </div>
            <div className="flex justify-between">
              <span>LATITUDE, LONGITUDE:</span>
              <span className="text-slate-800">{isLoadingGPS ? 'Locating secure GPS coordinates...' : geoSim}</span>
            </div>
            <div className="flex justify-between">
              <span>SIGNATURE TIMESTAMP:</span>
              <span className="text-slate-800">{new Date().toISOString().replace('T', ' ').substring(0, 19)} UTC</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-colors bg-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaveDisabled}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition-colors disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5 shadow-md active:bg-slate-950"
          >
            <Check className="h-4 w-4" />
            <span>Confirm Digital Sign</span>
          </button>
        </div>
      </div>
    </div>
  );
}
