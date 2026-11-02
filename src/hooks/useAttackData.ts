// ─── useAttackData — bundled dataset per framework + STIX uploads ───────────

import { useCallback, useEffect, useRef, useState } from 'react';
import type { AttackDataset, FrameworkConfig, FrameworkId } from '../types';
import { loadAttackData } from '../data/loadAttackData';
import { getFrameworkConfig } from '../data/frameworkConfig';
import { detectFramework, parseStixBundle, type StixBundle } from '../engine/stixParser';

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

interface Loaded { fw: FrameworkId; data: AttackDataset }

export function useAttackData(cfg: FrameworkConfig, setFramework: (fw: FrameworkId) => void) {
  const [bundled, setBundled] = useState<Loaded | null>(null);
  const [loadError, setLoadError] = useState<{ fw: FrameworkId; message: string } | null>(null);
  const [uploaded, setUploaded] = useState<(Loaded & { name: string }) | null>(null);
  const [useUpload, setUseUpload] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [autoDetectedFw, setAutoDetectedFw] = useState<FrameworkId | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    loadAttackData(controller.signal, cfg)
      .then(data => { if (!controller.signal.aborted) setBundled({ fw: cfg.id, data }); })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setLoadError({ fw: cfg.id, message: err instanceof Error ? err.message : String(err) });
      });
    return () => controller.abort();
  }, [cfg]);

  const handleUpload = useCallback((file: File) => {
    setUploadError(null);
    setAutoDetectedFw(null);
    if (file.size > MAX_UPLOAD_BYTES) { setUploadError('File too large (max 100 MB)'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const bundle = JSON.parse(String(reader.result)) as StixBundle;
        const detected = detectFramework(bundle) ?? cfg.id;
        const target = detected === cfg.id ? cfg : getFrameworkConfig(detected);
        const data = parseStixBundle(bundle, target, 'Upload: ' + file.name);
        if (detected !== cfg.id) {
          setFramework(detected);
          setAutoDetectedFw(detected);
          setTimeout(() => setAutoDetectedFw(null), 4000);
        }
        setUploaded({ fw: detected, data, name: file.name });
        setUseUpload(true);
      } catch (err: unknown) {
        setUploadError(err instanceof Error ? err.message : 'Failed to parse STIX file');
      }
    };
    reader.onerror = () => setUploadError('Failed to read file');
    reader.readAsText(file);
  }, [cfg, setFramework]);

  const uploadActive = useUpload && uploaded?.fw === cfg.id;
  const dataset = uploadActive ? uploaded!.data : bundled?.fw === cfg.id ? bundled.data : null;
  const loading = !dataset && loadError?.fw !== cfg.id;

  return {
    dataset,
    loading,
    loadError: loadError?.fw === cfg.id ? loadError.message : null,
    uploadedFileName: uploaded?.fw === cfg.id ? uploaded.name : null,
    uploadActive,
    setUseUpload,
    uploadError, setUploadError,
    autoDetectedFw,
    fileInputRef,
    handleUpload,
  };
}
