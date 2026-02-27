export interface MenuNode {
  id: string;
  name: string;
  code: string;
  icon?: string;
  path?: string;
  permission?: string;
  children?: MenuNode[];
}

export interface RouteMeta {
  id: string;
  name: string;
  code: string;
  path: string;
  permission?: string;
}
