import Keycloak from 'keycloak-js';
import { keycloakConfig, getFrontendOrigin } from './config';

let keycloakInstance: Keycloak | null = null;

export function getKeycloak(): Keycloak | null {
  return keycloakInstance;
}

export function getKeycloakToken(): string | undefined {
  return keycloakInstance?.token ?? undefined;
}

export function isKeycloakAuthenticated(): boolean {
  return Boolean(keycloakInstance?.authenticated);
}

/**
 * 初始化 Keycloak。
 * 使用 onLoad: 'login-required' 时，未登录会跳转 Keycloak 登录页，登录成功后回跳到前端，Promise 在回跳后 resolve。
 */
export function initKeycloak(options?: { onLoad?: 'check-sso' | 'login-required' }): Promise<boolean> {
  if (keycloakInstance) {
    return Promise.resolve(keycloakInstance.authenticated ?? false);
  }
  const kc = new Keycloak({
    url: keycloakConfig.url,
    realm: keycloakConfig.realm,
    clientId: keycloakConfig.clientId,
  });
  keycloakInstance = kc;
  const onLoad = options?.onLoad ?? 'login-required';
  // 关闭 iframe 会话检测，避免本地/跨域或严格 Cookie 下出现 "Timeout when waiting for 3rd party check iframe message"
  return kc.init({ onLoad, checkLoginIframe: false }).then((authenticated) => {
    return authenticated;
  });
}

/**
 * 发请求前静默刷新 Token，减少请求中途 401。minValidity 单位秒，表示剩余有效时间低于该值则刷新。
 */
export function updateKeycloakToken(minValidity: number = 60): Promise<boolean> {
  if (!keycloakInstance) return Promise.resolve(false);
  return keycloakInstance.updateToken(minValidity);
}

/**
 * 跳转 Keycloak 登录页。显式传 redirectUri，由 keycloak-js 生成 .../auth?client_id=...&redirect_uri=...（? 与 redirect_uri 符合 OIDC）。
 */
export function keycloakLogin(): void {
  if (keycloakInstance) {
    keycloakInstance.login({
      redirectUri: `${getFrontendOrigin()}/`,
    });
  }
}

/**
 * 登出：跳转 Keycloak 登出并可选指定回跳地址，再清空前端状态
 */
export function keycloakLogout(redirectUri?: string): void {
  if (keycloakInstance) {
    const uri = redirectUri ?? `${getFrontendOrigin()}/home/login`;
    keycloakInstance.logout({ redirectUri: uri });
  }
}
