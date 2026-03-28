'use client';

import { CheckCircle2, Palette } from 'lucide-react';
import { PRESET_COLORS } from './package-form.constants';

interface PackageDisplaySectionProps {
  formData: {
    isPopular: boolean;
    isRecommended: boolean;
    color: string;
    displayOrder: number;
    icon: string;
    badgeText: string;
  };
  onFormDataChange: (updater: (prev: any) => any) => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export default function PackageDisplaySection({
  formData,
  onFormDataChange,
  handleChange,
}: PackageDisplaySectionProps) {
  return (
    <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm rounded-2xl shadow-lg border border-neutral-200/60 dark:border-neutral-700/60 p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
          <Palette className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Wygląd i opcje</h2>
      </div>

      <div className="space-y-6">
        {/* Checkboxes */}
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                name="isPopular"
                checked={formData.isPopular}
                onChange={handleChange}
                className="w-5 h-5 rounded border-neutral-300 dark:border-neutral-600 text-blue-600 focus:ring-2 focus:ring-ring cursor-pointer"
              />
            </div>
            <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              🔥 Popularny
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                name="isRecommended"
                checked={formData.isRecommended}
                onChange={handleChange}
                className="w-5 h-5 rounded border-neutral-300 dark:border-neutral-600 text-green-600 focus:ring-2 focus:ring-green-500 cursor-pointer"
              />
            </div>
            <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
              ⭐ Polecany
            </span>
          </label>
        </div>

        {/* Color Picker */}
        <div>
          <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
            Kolor pakietu
          </label>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
            {PRESET_COLORS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => onFormDataChange((prev: any) => ({ ...prev, color: preset.value }))}
                className={`group relative w-full aspect-square rounded-xl transition-all ${
                  formData.color === preset.value
                    ? 'ring-4 ring-blue-500 ring-offset-2 dark:ring-offset-neutral-900 scale-110'
                    : 'hover:scale-105 hover:ring-2 hover:ring-neutral-300 dark:hover:ring-neutral-600'
                }`}
                style={{ backgroundColor: `#${preset.value}` }}
                title={preset.name}
              >
                {formData.color === preset.value && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-white drop-shadow-lg" />
                  </div>
                )}
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <input
              type="text"
              name="color"
              value={formData.color}
              onChange={handleChange}
              placeholder="3b82f6"
              maxLength={7}
              className="flex-1 px-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all font-mono text-sm"
            />
            <div 
              className="w-12 h-12 rounded-xl border-2 border-neutral-300 dark:border-neutral-600 shadow-sm"
              style={{ backgroundColor: `#${formData.color.replace('#', '')}` }}
            ></div>
          </div>
        </div>

        {/* Display inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label htmlFor="displayOrder" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              Kolejność
            </label>
            <input
              type="number"
              id="displayOrder"
              name="displayOrder"
              value={formData.displayOrder}
              onChange={handleChange}
              min="0"
              placeholder="0"
              className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label htmlFor="icon" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              Emoji
            </label>
            <input
              type="text"
              id="icon"
              name="icon"
              value={formData.icon}
              onChange={handleChange}
              placeholder="🎂"
              maxLength={4}
              className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all text-2xl text-center"
            />
          </div>

          <div>
            <label htmlFor="badgeText" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              Tekst odznaki
            </label>
            <input
              type="text"
              id="badgeText"
              name="badgeText"
              value={formData.badgeText}
              onChange={handleChange}
              placeholder="BESTSELLER"
              maxLength={20}
              className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all uppercase"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
