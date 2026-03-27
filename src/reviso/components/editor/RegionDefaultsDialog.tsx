import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import { DebouncedColorPicker } from '../common/DebouncedColorPicker';
import { useUiStore } from '../../stores/uiStore';
import { useDocumentStore } from '../../stores/documentStore';
import type { RegionDefaults } from '../../types/ui';

interface RegionDefaultsDialogProps {
  open: boolean;
  onClose: () => void;
}

export const RegionDefaultsDialog: React.FC<RegionDefaultsDialogProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const regionDefaults = useUiStore((s) => s.regionDefaults);
  const setRegionDefaults = useUiStore((s) => s.setRegionDefaults);
  const updateAllRegionsStyle = useDocumentStore((s) => s.updateAllRegionsStyle);

  const [draft, setDraft] = useState<RegionDefaults>({ ...regionDefaults });
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft({ ...regionDefaults });
      setShowConfirm(false);
    }
  }, [open, regionDefaults]);

  const updateDraft = useCallback((partial: Partial<RegionDefaults>) => {
    setDraft((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleSave = useCallback(() => {
    setRegionDefaults(draft);
    onClose();
  }, [draft, setRegionDefaults, onClose]);

  const handleApplyAll = useCallback(() => {
    setShowConfirm(true);
  }, []);

  const handleConfirmApplyAll = useCallback(() => {
    setRegionDefaults(draft);
    updateAllRegionsStyle(draft);
    setShowConfirm(false);
    onClose();
  }, [draft, setRegionDefaults, updateAllRegionsStyle, onClose]);

  const selectStyle: React.CSSProperties = {
    height: 28,
    fontSize: 12,
    background: theme.palette.background.default,
    color: theme.palette.text.primary,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 4,
    padding: '0 4px',
    cursor: 'pointer',
    outline: 'none',
  };

  const toggleStyle = (active: boolean): React.CSSProperties => ({
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    borderRadius: 4,
    cursor: 'pointer',
    userSelect: 'none',
    border: `1px solid ${theme.palette.divider}`,
    background: active ? theme.palette.primary.main : theme.palette.background.default,
    color: active ? theme.palette.primary.contrastText : theme.palette.text.secondary,
  });

  const hasBg = draft.backgroundColor !== 'transparent';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontSize: 14, pb: 1 }}>Region Default Settings</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          Configure default styles for new regions. Use &quot;Save &amp; Apply to All Pages&quot; to update all existing regions.
        </Typography>

        {/* Font Family */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="body2" sx={{ fontSize: 12 }}>Font Family</Typography>
          <select
            value={draft.fontFamily}
            onChange={(e) => updateDraft({ fontFamily: e.target.value })}
            style={{ ...selectStyle, minWidth: 120 }}
          >
            <option value="Inter">Inter</option>
            <option value="Roboto">Roboto</option>
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Courier New">Courier New</option>
            <option value="Georgia">Georgia</option>
          </select>
        </Box>

        {/* Font Style */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="body2" sx={{ fontSize: 12 }}>Font Style</Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <div
              onClick={() => updateDraft({ fontWeight: draft.fontWeight === 'bold' ? 'normal' : 'bold' })}
              style={{ ...toggleStyle(draft.fontWeight === 'bold'), fontWeight: 700 }}
              title="Bold"
            >B</div>
            <div
              onClick={() => updateDraft({ fontStyle: draft.fontStyle === 'italic' ? 'normal' : 'italic' })}
              style={{ ...toggleStyle(draft.fontStyle === 'italic'), fontStyle: 'italic' }}
              title="Italic"
            >I</div>
            <div
              onClick={() => updateDraft({ textDecoration: draft.textDecoration === 'line-through' ? 'none' : 'line-through' })}
              style={{ ...toggleStyle(draft.textDecoration === 'line-through'), textDecoration: 'line-through' }}
              title="Strikethrough"
            >S</div>
          </Box>
        </Box>

        {/* Font Color */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="body2" sx={{ fontSize: 12 }}>Font Color</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: 1,
                border: `1px solid ${theme.palette.divider}`,
                backgroundColor: draft.fontColor,
              }}
            />
            <DebouncedColorPicker
              value={draft.fontColor}
              onChange={(c) => updateDraft({ fontColor: c })}
              style={{ width: 28, height: 28 }}
            />
          </Box>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Border */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="body2" sx={{ fontSize: 12 }}>Border</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <div
              onClick={() => updateDraft({ borderVisible: !draft.borderVisible })}
              style={{
                width: 28,
                height: 28,
                border: `2px solid ${draft.borderVisible ? (draft.borderColor) : theme.palette.grey[600]}`,
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                cursor: 'pointer',
                userSelect: 'none',
                opacity: draft.borderVisible ? 1 : 0.4,
              }}
              title={draft.borderVisible ? 'Hide border' : 'Show border'}
            >{draft.borderVisible ? '✓' : ''}</div>
            <DebouncedColorPicker
              value={draft.borderColor}
              onChange={(c) => updateDraft({ borderColor: c })}
              style={{ width: 28, height: 28 }}
            />
          </Box>
        </Box>

        {/* Background Color */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="body2" sx={{ fontSize: 12 }}>Background</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <div
              onClick={() => updateDraft({ backgroundColor: hasBg ? 'transparent' : '#333333' })}
              style={{
                width: 28,
                height: 28,
                border: `2px solid ${theme.palette.text.secondary}`,
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                cursor: 'pointer',
                userSelect: 'none',
                backgroundColor: hasBg ? draft.backgroundColor : 'transparent',
              }}
              title={hasBg ? 'Remove background' : 'Add background'}
            >{hasBg ? '✓' : ''}</div>
            {hasBg ? (
              <DebouncedColorPicker
                value={draft.backgroundColor}
                onChange={(c) => updateDraft({ backgroundColor: c })}
                style={{ width: 28, height: 28 }}
              />
            ) : (
              <DebouncedColorPicker
                value="#000000"
                onChange={(c) => updateDraft({ backgroundColor: c })}
                style={{ width: 28, height: 28, opacity: 0.4 }}
              />
            )}
          </Box>
        </Box>

        {/* Text Position */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ fontSize: 12 }}>Text Position</Typography>
          <select
            value={draft.textPosition}
            onChange={(e) => updateDraft({ textPosition: e.target.value as RegionDefaults['textPosition'] })}
            style={{ ...selectStyle, minWidth: 100 }}
          >
            <option value="inside">Inside</option>
            <option value="top">Top</option>
            <option value="bottom">Bottom</option>
          </select>
        </Box>

        {/* Confirmation prompt */}
        {showConfirm && (
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              bgcolor: 'warning.main',
              color: 'warning.contrastText',
              borderRadius: 1,
              fontSize: 12,
            }}
          >
            <Typography variant="body2" sx={{ fontSize: 12, fontWeight: 600, mb: 1 }}>
              This will overwrite styles on all existing regions across all pages.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button
                size="small"
                variant="text"
                onClick={() => setShowConfirm(false)}
                sx={{ fontSize: 11, color: 'inherit', minHeight: 26 }}
              >
                Cancel
              </Button>
              <Button
                size="small"
                variant="contained"
                color="error"
                onClick={handleConfirmApplyAll}
                sx={{ fontSize: 11, minHeight: 26 }}
              >
                Confirm &amp; Apply
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} size="small" sx={{ fontSize: 11 }}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="outlined" size="small" sx={{ fontSize: 11 }}>
          Save
        </Button>
        <Button
          onClick={handleApplyAll}
          variant="contained"
          size="small"
          sx={{ fontSize: 11 }}
          disabled={showConfirm}
        >
          Save &amp; Apply to All Pages
        </Button>
      </DialogActions>
    </Dialog>
  );
};
