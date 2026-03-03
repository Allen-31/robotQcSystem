export interface LoginAccount {
  username: string;
  password: string;
  displayName: string;
  role: string;
}

export const loginAccountList: LoginAccount[] = [
  { username: 'admin', password: '123456', displayName: '系统管理员', role: '管理员' },
  { username: 'qc', password: '123456', displayName: '一线质检员', role: '质检员' },
  { username: 'pe', password: '123456', displayName: '工艺工程师', role: '工艺工程师' },
  { username: 'ops', password: '123456', displayName: '运维工程师', role: '运维工程师' },
];

