import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, HardHat } from 'lucide-react';
import type { ProductionRecord, ShiftType } from '../types';

interface ProductionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: ProductionRecord) => void;
  recordToEdit?: ProductionRecord | null;
}

export const ProductionFormModal: React.FC<ProductionFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  recordToEdit,
}) => {
  const [formData, setFormData] = useState<Partial<ProductionRecord>>({
    date: new Date().toISOString().split('T')[0],
    shift: 'Day',
    supervisor: 'Pushpendra',
    quarryBench: 'Bench-3 Pushpendra Block',
    romFedTons: 1200,
    operatingHours: 8.5,
    breakdownHours: 0.5,
    downtimeReason: '',
    aggregate10mm: 220,
    aggregate20mm: 410,
    aggregate40mm: 180,
    gsb: 190,
    stoneDust: 180,
    ballast65mm: 0,
    wasteReject: 20,
    dieselLiters: 140,
    electricityKwh: 560,
    blastingHoles: 0,
    explosiveKg: 0,
    equipmentLogs: 'Jaw C-106, Cone GP-200S, Excavator EX-210',
    remarks: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (recordToEdit) {
      setFormData(recordToEdit);
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        shift: 'Day',
        supervisor: 'Pushpendra',
        quarryBench: 'Bench-3 Pushpendra Block',
        romFedTons: 1200,
        operatingHours: 8.5,
        breakdownHours: 0.5,
        downtimeReason: '',
        aggregate10mm: 220,
        aggregate20mm: 410,
        aggregate40mm: 180,
        gsb: 190,
        stoneDust: 180,
        ballast65mm: 0,
        wasteReject: 20,
        dieselLiters: 140,
        electricityKwh: 560,
        blastingHoles: 0,
        explosiveKg: 0,
        equipmentLogs: 'Jaw C-106, Cone GP-200S, Excavator EX-210',
        remarks: '',
      });
    }
    setErrors({});
  }, [recordToEdit, isOpen]);

  if (!isOpen) return null;

  const p10 = Number(formData.aggregate10mm || 0);
  const p20 = Number(formData.aggregate20mm || 0);
  const p40 = Number(formData.aggregate40mm || 0);
  const gsb = Number(formData.gsb || 0);
  const dust = Number(formData.stoneDust || 0);
  const ballast = Number(formData.ballast65mm || 0);
  const totalCalculated = p10 + p20 + p40 + gsb + dust + ballast;
  const romFed = Number(formData.romFedTons || 0);
  const recoveryPercent = romFed > 0 ? Number(((totalCalculated / romFed) * 100).toFixed(1)) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.supervisor) newErrors.supervisor = 'Supervisor name is required';
    if (romFed <= 0) newErrors.romFedTons = 'ROM Fed must be greater than 0';
    if (Number(formData.operatingHours || 0) < 0) newErrors.operatingHours = 'Cannot be negative';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const finalRecord: ProductionRecord = {
      id: recordToEdit?.id || `prod-${Date.now()}`,
      date: formData.date!,
      shift: (formData.shift as ShiftType) || 'Day',
      supervisor: formData.supervisor || 'Pushpendra',
      quarryBench: formData.quarryBench || 'Bench-3 Pushpendra Block',
      romFedTons: romFed,
      operatingHours: Number(formData.operatingHours || 0),
      breakdownHours: Number(formData.breakdownHours || 0),
      downtimeReason: formData.downtimeReason || '',
      aggregate10mm: p10,
      aggregate20mm: p20,
      aggregate40mm: p40,
      gsb,
      stoneDust: dust,
      ballast65mm: ballast,
      wasteReject: Number(formData.wasteReject || 0),
      totalProduction: totalCalculated,
      recoveryPercent,
      dieselLiters: Number(formData.dieselLiters || 0),
      electricityKwh: Number(formData.electricityKwh || 0),
      blastingHoles: Number(formData.blastingHoles || 0),
      explosiveKg: Number(formData.explosiveKg || 0),
      equipmentLogs: formData.equipmentLogs || '',
      remarks: formData.remarks || '',
      updatedAt: new Date().toISOString(),
    };

    onSave(finalRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-3xl my-8 rounded-2xl bg-zinc-900 border border-zinc-700 shadow-2xl text-zinc-100 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <HardHat className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {recordToEdit ? 'Edit Crushing Production Record' : 'New Crushing & Mining Production Entry'}
              </h2>
              <p className="text-xs text-zinc-400">
                Log daily ROM feed, plant hours, aggregate yields, and energy consumption
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Section 1: Basic Shift & Location Info */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3">
              Shift &amp; Operation Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Date *</label>
                <input
                  type="date"
                  value={formData.date || ''}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden focus:border-amber-500"
                />
                {errors.date && <p className="text-[11px] text-red-400 mt-1">{errors.date}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Shift</label>
                <select
                  value={formData.shift || 'Day'}
                  onChange={(e) => setFormData({ ...formData, shift: e.target.value as ShiftType })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden focus:border-amber-500"
                >
                  <option value="Day">Day Shift</option>
                  <option value="Night">Night Shift</option>
                  <option value="General">General Shift</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Supervisor / Incharge *</label>
                <input
                  type="text"
                  value={formData.supervisor || ''}
                  onChange={(e) => setFormData({ ...formData, supervisor: e.target.value })}
                  placeholder="e.g. Pushpendra"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden focus:border-amber-500"
                />
                {errors.supervisor && <p className="text-[11px] text-red-400 mt-1">{errors.supervisor}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Quarry Bench / Face</label>
                <input
                  type="text"
                  value={formData.quarryBench || ''}
                  onChange={(e) => setFormData({ ...formData, quarryBench: e.target.value })}
                  placeholder="Bench-3 Pushpendra Block"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: ROM Fed & Running Hours */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3">
              Crusher Feed &amp; Operating Hours
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">ROM Fed (MT / Tons) *</label>
                <input
                  type="number"
                  step="any"
                  value={formData.romFedTons ?? ''}
                  onChange={(e) => setFormData({ ...formData, romFedTons: Number(e.target.value) })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-hidden focus:border-amber-500"
                />
                {errors.romFedTons && <p className="text-[11px] text-red-400 mt-1">{errors.romFedTons}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Running Hours (Hrs)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.operatingHours ?? ''}
                  onChange={(e) => setFormData({ ...formData, operatingHours: Number(e.target.value) })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Breakdown / Idle (Hrs)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.breakdownHours ?? ''}
                  onChange={(e) => setFormData({ ...formData, breakdownHours: Number(e.target.value) })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-hidden focus:border-amber-500"
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-xs font-medium text-zinc-300 mb-1">Downtime Reason (if any)</label>
              <input
                type="text"
                value={formData.downtimeReason || ''}
                onChange={(e) => setFormData({ ...formData, downtimeReason: e.target.value })}
                placeholder="e.g. Jaw hopper choke, conveyor tracking, grid power outage"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-amber-500"
              />
            </div>
          </div>

          {/* Section 3: Aggregate Product Production Breakdown */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Crushed Aggregate Outputs (Metric Tons)
              </h3>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-zinc-400">
                  Total Produced:{' '}
                  <strong className="text-amber-400 font-mono text-sm">{totalCalculated.toLocaleString()} MT</strong>
                </span>
                <span className="text-zinc-400">
                  Recovery:{' '}
                  <strong
                    className={`font-mono text-sm ${
                      recoveryPercent >= 95 ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {recoveryPercent}%
                  </strong>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">10mm (MT)</label>
                <input
                  type="number"
                  step="any"
                  value={formData.aggregate10mm ?? ''}
                  onChange={(e) => setFormData({ ...formData, aggregate10mm: Number(e.target.value) })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-sm text-white font-mono focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">20mm (MT)</label>
                <input
                  type="number"
                  step="any"
                  value={formData.aggregate20mm ?? ''}
                  onChange={(e) => setFormData({ ...formData, aggregate20mm: Number(e.target.value) })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-sm text-white font-mono focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">40mm (MT)</label>
                <input
                  type="number"
                  step="any"
                  value={formData.aggregate40mm ?? ''}
                  onChange={(e) => setFormData({ ...formData, aggregate40mm: Number(e.target.value) })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-sm text-white font-mono focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">GSB (MT)</label>
                <input
                  type="number"
                  step="any"
                  value={formData.gsb ?? ''}
                  onChange={(e) => setFormData({ ...formData, gsb: Number(e.target.value) })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-sm text-white font-mono focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Stone Dust (MT)</label>
                <input
                  type="number"
                  step="any"
                  value={formData.stoneDust ?? ''}
                  onChange={(e) => setFormData({ ...formData, stoneDust: Number(e.target.value) })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-sm text-white font-mono focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">65mm Ballast</label>
                <input
                  type="number"
                  step="any"
                  value={formData.ballast65mm ?? ''}
                  onChange={(e) => setFormData({ ...formData, ballast65mm: Number(e.target.value) })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-sm text-white font-mono focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Fuel & Utilities */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3">
              Energy &amp; Mining Consumables
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Diesel (Litres)</label>
                <input
                  type="number"
                  value={formData.dieselLiters ?? ''}
                  onChange={(e) => setFormData({ ...formData, dieselLiters: Number(e.target.value) })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Electricity (kWh)</label>
                <input
                  type="number"
                  value={formData.electricityKwh ?? ''}
                  onChange={(e) => setFormData({ ...formData, electricityKwh: Number(e.target.value) })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Blasting Holes</label>
                <input
                  type="number"
                  value={formData.blastingHoles ?? ''}
                  onChange={(e) => setFormData({ ...formData, blastingHoles: Number(e.target.value) })}
                  placeholder="0"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Explosives (kg)</label>
                <input
                  type="number"
                  value={formData.explosiveKg ?? ''}
                  onChange={(e) => setFormData({ ...formData, explosiveKg: Number(e.target.value) })}
                  placeholder="0"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Machinery & Remarks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Equipment Logs</label>
              <input
                type="text"
                value={formData.equipmentLogs || ''}
                onChange={(e) => setFormData({ ...formData, equipmentLogs: e.target.value })}
                placeholder="e.g. Jaw C-106, Cone GP-200S, Excavator EX-210"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Remarks / Shift Notes</label>
              <input
                type="text"
                value={formData.remarks || ''}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                placeholder="e.g. Target reached, quality checked"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500"
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
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-zinc-950 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 rounded-xl transition shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>{recordToEdit ? 'Update Production Entry' : 'Save Production Entry'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
