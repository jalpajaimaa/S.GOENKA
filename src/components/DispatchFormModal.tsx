import React, { useState, useEffect } from 'react';
import { X, Save, Truck, Scale, DollarSign } from 'lucide-react';
import type { DispatchRecord, MaterialType } from '../types';

interface DispatchFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: DispatchRecord) => void;
  recordToEdit?: DispatchRecord | null;
}

export const DispatchFormModal: React.FC<DispatchFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  recordToEdit,
}) => {
  const [formData, setFormData] = useState<Partial<DispatchRecord>>({
    challanNo: `CH-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    vehicleNo: '',
    customerName: '',
    material: '20mm',
    grossWeight: 44.5,
    tareWeight: 14.5,
    ratePerTon: 520,
    royaltyPassNo: `DMG-EPASS-2026-${Math.floor(10000 + Math.random() * 90000)}`,
    paymentMode: 'Credit',
    supervisor: 'Pushpendra',
    destination: '',
    status: 'Completed',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (recordToEdit) {
      setFormData(recordToEdit);
    } else {
      setFormData({
        challanNo: `CH-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        vehicleNo: '',
        customerName: '',
        material: '20mm',
        grossWeight: 44.5,
        tareWeight: 14.5,
        ratePerTon: 520,
        royaltyPassNo: `DMG-EPASS-2026-${Math.floor(10000 + Math.random() * 90000)}`,
        paymentMode: 'Credit',
        supervisor: 'Pushpendra',
        destination: '',
        status: 'Completed',
      });
    }
    setErrors({});
  }, [recordToEdit, isOpen]);

  if (!isOpen) return null;

  const gross = Number(formData.grossWeight || 0);
  const tare = Number(formData.tareWeight || 0);
  const netWeight = gross > tare ? Number((gross - tare).toFixed(2)) : 0;
  const rate = Number(formData.ratePerTon || 0);
  const totalAmount = Math.round(netWeight * rate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.challanNo?.trim()) newErrors.challanNo = 'Challan No is required';
    if (!formData.vehicleNo?.trim()) newErrors.vehicleNo = 'Vehicle number is required';
    if (!formData.customerName?.trim()) newErrors.customerName = 'Customer name is required';
    if (gross <= 0) newErrors.grossWeight = 'Gross weight must be > 0';
    if (tare < 0) newErrors.tareWeight = 'Tare weight cannot be negative';
    if (gross <= tare) newErrors.grossWeight = 'Gross weight must be greater than Tare weight';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const finalRecord: DispatchRecord = {
      id: recordToEdit?.id || `disp-${Date.now()}`,
      challanNo: formData.challanNo!.trim(),
      date: formData.date || new Date().toISOString().split('T')[0],
      time: formData.time || '10:00',
      vehicleNo: formData.vehicleNo!.toUpperCase().trim(),
      customerName: formData.customerName!.trim(),
      material: (formData.material as MaterialType) || '20mm',
      grossWeight: gross,
      tareWeight: tare,
      netWeight,
      ratePerTon: rate,
      totalAmount,
      royaltyPassNo: formData.royaltyPassNo || 'DMG-PAID',
      paymentMode: (formData.paymentMode as any) || 'Credit',
      supervisor: formData.supervisor || 'Pushpendra',
      destination: formData.destination || '',
      status: (formData.status as any) || 'Completed',
      updatedAt: new Date().toISOString(),
    };

    onSave(finalRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-2xl my-8 rounded-2xl bg-zinc-900 border border-zinc-700 shadow-2xl text-zinc-100 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {recordToEdit ? 'Edit Weighbridge Dispatch Slip' : 'New Weighbridge Outward Dispatch Ticket'}
              </h2>
              <p className="text-xs text-zinc-400">
                Log weighbridge gross/tare, material dispatch, customer billing, and e-pass
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Row 1: Challan, Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Challan / Ticket # *</label>
              <input
                type="text"
                value={formData.challanNo || ''}
                onChange={(e) => setFormData({ ...formData, challanNo: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-amber-500"
              />
              {errors.challanNo && <p className="text-[11px] text-red-400 mt-1">{errors.challanNo}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Date *</label>
              <input
                type="date"
                value={formData.date || ''}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Time</label>
              <input
                type="time"
                value={formData.time || ''}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-amber-500"
              />
            </div>
          </div>

          {/* Row 2: Vehicle & Customer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Vehicle / Truck No. *</label>
              <input
                type="text"
                value={formData.vehicleNo || ''}
                onChange={(e) => setFormData({ ...formData, vehicleNo: e.target.value.toUpperCase() })}
                placeholder="e.g. RJ-14-GA-9421"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white font-mono uppercase focus:border-amber-500"
              />
              {errors.vehicleNo && <p className="text-[11px] text-red-400 mt-1">{errors.vehicleNo}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Customer / Project Party *</label>
              <input
                type="text"
                value={formData.customerName || ''}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="e.g. L&T Construction / NHAI Package-4"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500"
              />
              {errors.customerName && <p className="text-[11px] text-red-400 mt-1">{errors.customerName}</p>}
            </div>
          </div>

          {/* Row 3: Material & Weights */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
            <div className="flex items-center gap-2 mb-3">
              <Scale className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Material &amp; Weighbridge Readings
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Aggregate / Material</label>
                <select
                  value={formData.material || '20mm'}
                  onChange={(e) => setFormData({ ...formData, material: e.target.value as MaterialType })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-2.5 py-2 text-sm text-white focus:border-emerald-500"
                >
                  <option value="10mm">10mm Aggregate</option>
                  <option value="20mm">20mm Aggregate</option>
                  <option value="40mm">40mm Aggregate</option>
                  <option value="GSB">GSB Sub-Base</option>
                  <option value="Stone Dust">Stone Dust / M-Sand</option>
                  <option value="65mm Ballast">65mm Ballast</option>
                  <option value="Boulder ROM">Boulder ROM</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Gross Wt (MT) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.grossWeight ?? ''}
                  onChange={(e) => setFormData({ ...formData, grossWeight: Number(e.target.value) })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-emerald-500"
                />
                {errors.grossWeight && <p className="text-[11px] text-red-400 mt-1">{errors.grossWeight}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Tare Wt (MT)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.tareWeight ?? ''}
                  onChange={(e) => setFormData({ ...formData, tareWeight: Number(e.target.value) })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-emerald-400 mb-1">Net Weight (MT)</label>
                <div className="w-full bg-emerald-950/40 border border-emerald-500/40 rounded-xl px-3 py-2 text-sm text-emerald-300 font-mono font-bold">
                  {netWeight} MT
                </div>
              </div>
            </div>
          </div>

          {/* Row 4: Billing Rate & Total Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Rate per MT (₹)</label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  value={formData.ratePerTon ?? ''}
                  onChange={(e) => setFormData({ ...formData, ratePerTon: Number(e.target.value) })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-7 pr-3 py-2 text-sm text-white font-mono focus:border-amber-500"
                />
                <span className="absolute left-2.5 top-2 text-xs text-zinc-400">₹</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Total Bill Amount (₹)</label>
              <div className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-amber-400 font-mono font-bold">
                ₹ {totalAmount.toLocaleString()}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Payment Mode</label>
              <select
                value={formData.paymentMode || 'Credit'}
                onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value as any })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500"
              >
                <option value="Credit">Credit</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                <option value="Advance">Advance Adjusted</option>
              </select>
            </div>
          </div>

          {/* Row 5: Royalty Pass & Destination */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Mining Royalty / e-Pass No.</label>
              <input
                type="text"
                value={formData.royaltyPassNo || ''}
                onChange={(e) => setFormData({ ...formData, royaltyPassNo: e.target.value })}
                placeholder="DMG-EPASS-2026-..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Destination / Unloading Site</label>
              <input
                type="text"
                value={formData.destination || ''}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                placeholder="e.g. NHAI Ch. 44+200"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Supervisor Incharge</label>
              <input
                type="text"
                value={formData.supervisor || 'Pushpendra'}
                onChange={(e) => setFormData({ ...formData, supervisor: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-zinc-950 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 rounded-xl transition shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>{recordToEdit ? 'Update Dispatch Ticket' : 'Save & Issue Dispatch Ticket'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
