import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Trash2,
  Package,
  Plus,
  Sparkles,
  Clock,
  Loader2,
} from 'lucide-react';
import { usePlanningWizard } from '../context/PlanningWizardContext';
import { WizardProgress } from '../components/wizard/WizardProgress';
import { EventSummaryBanner } from '../components/wizard/EventSummaryBanner';
import {
  PackagingItemType,
  PlasticItemType,
  OtherWasteCategory,
  PACKAGING_TYPE_OPTIONS,
  PLASTIC_TYPE_OPTIONS,
  OTHER_WASTE_OPTIONS,
  WastePlanResponse,
} from '../types/waste';
import { wasteApi } from '../api/waste';
import { ExplainableMetric } from '../components/sustainability/ExplainableMetric';

export const WastePlanningPage: React.FC = () => {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const {
    event,
    loadEvent,
    budget,
    foodConfig,
    wasteConfig,
    addPackagingItem,
    removePackagingItem,
    addPlasticItem,
    removePlasticItem,
    addOtherWasteItem,
    removeOtherWasteItem,
    generatePlans,
    isGenerating,
  } = usePlanningWizard();

  // Loading indicator rotating messages
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const loadingMessages = [
    'Analyzing your event...',
    'Evaluating food and waste...',
    'Comparing sustainable alternatives...',
  ];

  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Form states for adding items
  const [newPkgType, setNewPkgType] = useState<PackagingItemType>('SPOON');
  const [newPlasticType, setNewPlasticType] = useState<PlasticItemType>('PLASTIC_CUP');
  const [newOtherCategory, setNewOtherCategory] = useState<OtherWasteCategory>('DECORATIONS');
  const [newOtherName, setNewOtherName] = useState('');
  const [newOtherQuantity, setNewOtherQuantity] = useState('10');

  const [previewResponse, setPreviewResponse] = useState<WastePlanResponse | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (eventId && (!event || event.id !== Number(eventId))) {
      loadEvent(Number(eventId)).catch((err) => setError(`Failed to load event: ${err.message}`));
    }
  }, [eventId]);

  const handleAddPackaging = (e: React.FormEvent) => {
    e.preventDefault();
    addPackagingItem({
      item_type: newPkgType,
      calculation_basis: 'PER_PERSON',
    });
  };

  const handleAddPlastic = (e: React.FormEvent) => {
    e.preventDefault();
    addPlasticItem({
      item_type: newPlasticType,
      calculation_basis: 'PER_PERSON',
    });
  };

  const handleAddOther = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOtherName.trim()) return;
    addOtherWasteItem({
      name: newOtherName.trim(),
      category: newOtherCategory,
      calculation_basis: 'CUSTOM',
      quantity: newOtherQuantity ? Number(newOtherQuantity) : 1,
      unit: 'items',
    });
    setNewOtherName('');
  };

  const handleCalculateWastePreview = async () => {
    if (!event) return;
    setIsPreviewLoading(true);
    setError(null);

    try {
      const response = await wasteApi.planWaste({
        event_id: event.id,
        food_waste: {
          food_plan_request: {
            event_id: event.id,
            meals: foodConfig.meals,
            default_dietary_preference: foodConfig.default_dietary_preference,
            vegetarian_ratio: foodConfig.vegetarian_ratio ? Number(foodConfig.vegetarian_ratio) : undefined,
          },
        },
        packaging_items: wasteConfig.packaging_items,
        plastic_items: wasteConfig.plastic_items,
        other_waste_items: wasteConfig.other_waste_items,
      });
      setPreviewResponse(response);
    } catch (err: any) {
      setError(err.message || 'Failed to calculate waste preview from backend.');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleGenerateMasterPlans = async () => {
    if (!event) {
      setError('Please create or select an event first.');
      return;
    }

    try {
      await generatePlans();
      const targetId = eventId || event.id;
      navigate(`/events/${targetId}/plans`);
    } catch (err: any) {
      setError(err.message || 'Plan generation failed. Please review inputs.');
    }
  };

  const handleBack = () => {
    const targetId = eventId || event?.id;
    navigate(`/events/${targetId}/food`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <WizardProgress currentStep={5} eventId={event?.id || Number(eventId)} />
      <EventSummaryBanner event={event} budget={budget} />

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-10">
        <div className="border-b border-slate-100 pb-6 mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold tracking-wide uppercase mb-3 border border-emerald-200">
            <Trash2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Step 5 of 6 • Waste Streams & Packaging</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Waste Planning & Footprint Reduction
          </h1>
          <p className="text-slate-600 text-sm mt-1.5 max-w-2xl">
            Configure event packaging components, plastic items, and other material streams. The backend Waste Module
            estimates item counts and single-use vs. reusable allocations.
          </p>
        </div>

        {error && (
          <div role="alert" className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
            {error}
          </div>
        )}

        {/* Paper Waste Waitlist Notice */}
        <div className="mb-8 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start space-x-3">
          <Clock className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
          <div>
            <strong className="text-slate-800">Domain Note on Paper Waste:</strong> Paper Waste estimation is
            explicitly <strong>WAITLISTED</strong> and not active in this release. Active waste streams include Food
            Waste, Component Packaging (plates, cups, cutlery), Plastic Items, and Miscellaneous materials.
          </div>
        </div>

        {/* 1. Packaging Waste Section */}
        <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Package className="w-4 h-4 text-emerald-600" />
                <span>Component Packaging Items</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Plates, cups, and cutlery used during food and refreshment sessions.
              </p>
            </div>
          </div>

          <div className="space-y-2.5 mb-4">
            {wasteConfig.packaging_items.map((pkg, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs shadow-sm"
              >
                <div>
                  <span className="font-bold text-slate-800 uppercase tracking-wide">
                    {pkg.item_type}
                  </span>
                  <span className="text-slate-400 ml-2">
                    Basis: {pkg.calculation_basis}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removePackagingItem(idx)}
                  className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Packaging Item */}
          <form onSubmit={handleAddPackaging} className="flex gap-3">
            <select
              value={newPkgType}
              onChange={(e) => setNewPkgType(e.target.value as PackagingItemType)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white flex-1"
            >
              {PACKAGING_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="inline-flex items-center space-x-1 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all focus:outline-none"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Packaging Item</span>
            </button>
          </form>
        </div>

        {/* 2. Plastic Items Section */}
        <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Trash2 className="w-4 h-4 text-emerald-600" />
                <span>Plastic Items</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Target items for waste reduction or elimination under constraints.
              </p>
            </div>
          </div>

          <div className="space-y-2.5 mb-4">
            {wasteConfig.plastic_items.map((plt, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs shadow-sm"
              >
                <div>
                  <span className="font-bold text-slate-800 uppercase tracking-wide">
                    {plt.item_type.replace('_', ' ')}
                  </span>
                  <span className="text-slate-400 ml-2">
                    Basis: {plt.calculation_basis}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removePlasticItem(idx)}
                  className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Plastic Item */}
          <form onSubmit={handleAddPlastic} className="flex gap-3">
            <select
              value={newPlasticType}
              onChange={(e) => setNewPlasticType(e.target.value as PlasticItemType)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white flex-1"
            >
              {PLASTIC_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="inline-flex items-center space-x-1 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all focus:outline-none"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Plastic Item</span>
            </button>
          </form>
        </div>

        {/* 3. Other Miscellaneous Waste Streams */}
        <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Other Miscellaneous Waste Streams</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Decorations, food containers, mixed waste, and broken items.
              </p>
            </div>
          </div>

          <div className="space-y-2.5 mb-4">
            {wasteConfig.other_waste_items.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No miscellaneous waste items configured.</p>
            ) : (
              wasteConfig.other_waste_items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs shadow-sm"
                >
                  <div>
                    <span className="font-bold text-slate-800">{item.name}</span>
                    <span className="text-slate-400 ml-2">
                      ({item.category} • {item.quantity} {item.unit})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeOtherWasteItem(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add Other Waste Item */}
          <form onSubmit={handleAddOther} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Item label (e.g. Stage Banners)"
              value={newOtherName}
              onChange={(e) => setNewOtherName(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
            />
            <select
              value={newOtherCategory}
              onChange={(e) => setNewOtherCategory(e.target.value as OtherWasteCategory)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
            >
              {OTHER_WASTE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                placeholder="Qty"
                value={newOtherQuantity}
                onChange={(e) => setNewOtherQuantity(e.target.value)}
                className="w-20 px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
              />
              <button
                type="submit"
                className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all focus:outline-none"
              >
                Add Item
              </button>
            </div>
          </form>
        </div>

        {/* Live Waste Module Preview */}
        <div className="pt-6 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Waste Module Evaluation (Pre-Check)</h3>
              <p className="text-xs text-slate-500">
                Run the domain calculator to inspect baseline waste numbers prior to full optimization.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCalculateWastePreview}
              disabled={isPreviewLoading}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition-colors focus:outline-none"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isPreviewLoading ? 'Calculating...' : 'Preview Waste Figures'}</span>
            </button>
          </div>

          {previewResponse && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <ExplainableMetric
                  label="Total Packaging"
                  value={previewResponse.packaging_waste.total_items}
                  unit="items"
                  sourceType="ESTIMATED"
                  explanation="Total plates, cups, and utensils required for attendees."
                />
                <ExplainableMetric
                  label="Reusable Items"
                  value={previewResponse.packaging_waste.total_reusable_items}
                  unit="items"
                  sourceType="ESTIMATED"
                  explanation="Based on reusable ratio assumptions for event type."
                />
                <ExplainableMetric
                  label="Single-Use Items"
                  value={previewResponse.packaging_waste.total_single_use_items}
                  unit="items"
                  sourceType="ESTIMATED"
                  explanation="Disposables required unless reusable alternative is chosen."
                />
                <ExplainableMetric
                  label="Plastic Items"
                  value={previewResponse.plastic_waste.total_planning_items}
                  unit="items"
                  sourceType="ESTIMATED"
                  explanation="Plastic bottles/cups estimated per person."
                />
              </div>

              {previewResponse.recommendations.length > 0 && (
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
                  <span className="font-bold text-slate-800 block">Waste Reduction Recommendations:</span>
                  {previewResponse.recommendations.map((rec, i) => (
                    <div key={i} className="text-slate-600">
                      <strong>{rec.title}:</strong> {rec.description} (<em>Impact: {rec.impact}</em>)
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Master Action: Generate Sustainable Plans */}
        <div className="pt-8 mt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <button
            type="button"
            onClick={handleBack}
            disabled={isGenerating}
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-sm transition-colors focus:outline-none"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Food Planning</span>
          </button>

          <button
            type="button"
            onClick={handleGenerateMasterPlans}
            disabled={isGenerating}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2.5 px-9 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-extrabold text-base shadow-lg shadow-emerald-600/30 transition-all focus:outline-none cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{loadingMessages[loadingMessageIndex]}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Generate Sustainable Plans</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
