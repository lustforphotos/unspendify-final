import { useState } from 'react';
import { Tag, X, Check } from 'lucide-react';
import { recordCorrection, getCategoryLabel, getCategoryColor } from '../lib/classification';
import { useAuth } from '../contexts/AuthContext';

interface ToolClassificationActionsProps {
  toolId: string;
  currentCategory: string;
  onUpdate?: () => void;
  compact?: boolean;
}

export default function ToolClassificationActions({
  toolId,
  currentCategory,
  onUpdate,
  compact = false,
}: ToolClassificationActionsProps) {
  const { user } = useAuth();
  const [showActions, setShowActions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleCorrection(type: 'not_marketing' | 'is_marketing') {
    if (!user) return;

    try {
      setSubmitting(true);
      const adjustment = type === 'not_marketing' ? -40 : 40;
      await recordCorrection(toolId, user.id, type, currentCategory, undefined, adjustment);
      setSuccess(true);
      setShowActions(false);
      if (onUpdate) onUpdate();
      setTimeout(() => setSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to record correction:', error);
    } finally {
      setSubmitting(false);
    }
  }

  if (compact) {
    return (
      <div className="relative inline-block">
        <button
          onClick={() => setShowActions(!showActions)}
          className="inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-md bg-slate-800 border border-slate-700 hover:border-slate-600 transition-colors"
          disabled={submitting}
        >
          <Tag size={12} className={getCategoryColor(currentCategory)} />
          <span className="text-slate-300">{getCategoryLabel(currentCategory)}</span>
        </button>

        {showActions && (
          <div className="absolute top-full left-0 mt-1 z-10 bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-2 min-w-[200px]">
            <div className="text-xs text-slate-400 mb-2 px-2">Adjust classification:</div>
            <div className="space-y-1">
              {currentCategory !== 'marketing' && (
                <button
                  onClick={() => handleCorrection('is_marketing')}
                  disabled={submitting}
                  className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded transition-colors disabled:opacity-50"
                >
                  Mark as Marketing
                </button>
              )}
              {currentCategory !== 'other' && (
                <button
                  onClick={() => handleCorrection('not_marketing')}
                  disabled={submitting}
                  className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded transition-colors disabled:opacity-50"
                >
                  Not a Marketing Tool
                </button>
              )}
              <button
                onClick={() => setShowActions(false)}
                className="w-full text-left px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag size={16} className={getCategoryColor(currentCategory)} />
          <span className="text-sm text-slate-300">{getCategoryLabel(currentCategory)}</span>
        </div>
        {!showActions && !success && (
          <button
            onClick={() => setShowActions(true)}
            className="text-xs text-slate-400 hover:text-slate-300 transition-colors"
          >
            Adjust
          </button>
        )}
      </div>

      {success && (
        <div className="flex items-center gap-2 text-xs text-green-400">
          <Check size={14} />
          <span>Updated</span>
        </div>
      )}

      {showActions && (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Adjust classification</span>
            <button
              onClick={() => setShowActions(false)}
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          <div className="space-y-2">
            {currentCategory !== 'marketing' && (
              <button
                onClick={() => handleCorrection('is_marketing')}
                disabled={submitting}
                className="w-full text-left px-3 py-2 text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors disabled:opacity-50"
              >
                This is a Marketing Tool
              </button>
            )}
            {currentCategory !== 'other' && (
              <button
                onClick={() => handleCorrection('not_marketing')}
                disabled={submitting}
                className="w-full text-left px-3 py-2 text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors disabled:opacity-50"
              >
                Not a Marketing Tool
              </button>
            )}
          </div>

          <p className="text-xs text-slate-500 mt-2">
            This helps improve future classifications
          </p>
        </div>
      )}
    </div>
  );
}
