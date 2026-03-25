// ─── useStixLoader — STIX data source management, loading, and file upload ───

import { useState, useEffect, useRef, useCallback } from 'react';
import { loadStixData } from '../data/loadAttackData';
import { detectFramework, parseStixBundle } from '../engine/stixParser';
import { getFrameworkConfig } from '../data/frameworkConfig';

interface UseStixLoaderArgs {
  framework: string;
  fwConfig: any;
  setFramework: (fw: string) => void;
  setCustomPositions: (pos: Record<string, { x: number; y: number }>) => void;
}

export function useStixLoader({
  framework, fwConfig, setFramework, setCustomPositions,
}: UseStixLoaderArgs) {
  const [dataSource, setDataSource] = useState("stix");
  const [customData, setCustomData] = useState<any>(null);
  const [stixLoading, setStixLoading] = useState(false);
  const [stixError, setStixError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [autoDetectedFw, setAutoDetectedFw] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navFileInputRef = useRef<HTMLInputElement | null>(null);

  // Load STIX data when data source or framework changes
  useEffect(() => {
    const controller = new AbortController();
    setCustomPositions({});
    if (dataSource === "stix") {
      setStixLoading(true);
      setStixError(null);
      loadStixData(controller.signal, fwConfig as any).then((data: any) => {
        if (controller.signal.aborted) return;
        setCustomData(data);
        setStixLoading(false);
      }).catch((err: any) => {
        if (controller.signal.aborted) return;
        setStixError(err.message);
        setStixLoading(false);
        if (fwConfig.hasBuiltin) setDataSource("builtin");
      });
    } else if (dataSource === "upload") {
      // Data already set by handleStixFileUpload
    } else {
      setCustomData(null);
      setStixError(null);
      setUploadedFileName(null);
      setUploadError(null);
    }
    return () => controller.abort();
  }, [dataSource, framework]);

  // Handle STIX file upload with auto-detection
  const handleStixFileUpload = useCallback((file: File) => {
    setUploadError(null);
    setAutoDetectedFw(null);
    if (file.size > 25 * 1024 * 1024) { setUploadError("File too large (max 25 MB)"); return; }
    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const bundle = JSON.parse(e.target.result);
        const detected = detectFramework(bundle);
        let activeFwConfig = fwConfig;
        if (detected && detected !== framework) {
          setFramework(detected);
          activeFwConfig = getFrameworkConfig(detected);
          setAutoDetectedFw(detected);
          setTimeout(() => setAutoDetectedFw(null), 3000);
        }
        const result = parseStixBundle(bundle, activeFwConfig as any);
        setCustomData(result);
        setUploadedFileName(file.name);
        setDataSource("upload");
      } catch (err: any) {
        setUploadError(err.message || "Failed to parse STIX file");
      }
    };
    reader.onerror = () => setUploadError("Failed to read file");
    reader.readAsText(file);
  }, [fwConfig, framework, setFramework]);

  const resetLoader = useCallback(() => {
    setUploadedFileName(null);
    setUploadError(null);
    setAutoDetectedFw(null);
    // Trigger STIX reload: set to builtin briefly then back to stix
    setDataSource("builtin");
    setTimeout(() => setDataSource("stix"), 0);
  }, []);

  return {
    dataSource, setDataSource,
    customData, setCustomData,
    stixLoading, stixError, setStixError,
    uploadedFileName, setUploadedFileName,
    uploadError, setUploadError,
    autoDetectedFw, setAutoDetectedFw,
    fileInputRef, navFileInputRef,
    handleStixFileUpload, resetLoader,
  };
}
