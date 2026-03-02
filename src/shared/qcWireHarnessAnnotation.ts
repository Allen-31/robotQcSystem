export interface QcPoint {
  x: number;
  y: number;
  description: string;
}

export interface QcWireHarnessAnnotationStore {
  pointsByHarnessId: Record<string, QcPoint[]>;
  imageByHarnessId: Record<string, string>;
}

const STORAGE_KEY = 'robot-qc-wire-harness-annotations-v1';

export function loadQcWireHarnessAnnotations(): QcWireHarnessAnnotationStore {
  if (typeof window === 'undefined') {
    return {
      pointsByHarnessId: {},
      imageByHarnessId: {},
    };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        pointsByHarnessId: {},
        imageByHarnessId: {},
      };
    }
    const parsed = JSON.parse(raw) as Partial<QcWireHarnessAnnotationStore>;
    return {
      pointsByHarnessId: parsed.pointsByHarnessId ?? {},
      imageByHarnessId: parsed.imageByHarnessId ?? {},
    };
  } catch {
    return {
      pointsByHarnessId: {},
      imageByHarnessId: {},
    };
  }
}

export function saveQcWireHarnessAnnotations(payload: QcWireHarnessAnnotationStore): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}
