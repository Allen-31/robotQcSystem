/**
 * Keycloak 前端配置（与 Keycloak Client robot-qc-frontend 一致）
 * 在 .env 中设置：VITE_KEYCLOAK_URL、VITE_KEYCLOAK_REALM、VITE_KEYCLOAK_CLIENT_ID
 * Keycloak 控制台该 Client 的 Valid redirect URIs、Web origins 需包含前端地址（如 http://localhost:5173 及生产域名）
 */
function getEnv(): Record<string, string> | undefined {
  const m = typeof import.meta !== 'undefined' ? (import.meta as { env?: unknown }).env : undefined;
  return m && typeof m === 'object' && !Array.isArray(m) ? (m as Record<string, string>) : undefined;
}

/**
 * Keycloak 根地址（含上下文路径）。必须与后端 issuer-uri 一致。
 * 若 Keycloak 控制台在 http://localhost:8081/auth/，则此处填 http://localhost:8081/auth；
 * 若在 http://localhost:8081/，则填 http://localhost:8081。否则登录会跳到 Keycloak 出现 "Page not found"。
 */
export const keycloakConfig = {
  url: getEnv()?.VITE_KEYCLOAK_URL ?? 'http://localhost:8081',
  realm: getEnv()?.VITE_KEYCLOAK_REALM ?? 'robot-qc',
  clientId: getEnv()?.VITE_KEYCLOAK_CLIENT_ID ?? 'robot-qc-frontend',
};

/** 前端应用根地址，用于登出 redirectUri 等 */
export function getFrontendOrigin(): string {
  if (typeof window === 'undefined') {
    return getEnv()?.VITE_APP_ORIGIN ?? 'http://localhost:5173';
  }
  return window.location.origin;
}
