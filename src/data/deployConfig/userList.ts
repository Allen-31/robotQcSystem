import type { UserManageRecord } from '../../shared/types/deployConfig';

export const userList: UserManageRecord[] = [
  {
    code: 'USR-001',
    name: '张伟',
    phone: '13800001111',
    email: 'zhang.wei@robotqc.com',
    status: 'enabled',
    lastLoginAt: '2026-03-02 08:21:40',
    roles: ['管理员'],
    password: '123456',
  },
  {
    code: 'USR-002',
    name: '李娜',
    phone: '13800002222',
    email: 'li.na@robotqc.com',
    status: 'enabled',
    lastLoginAt: '2026-03-01 19:36:14',
    roles: ['质检员'],
    password: '123456',
  },
  {
    code: 'USR-003',
    name: '王浩',
    phone: '13800003333',
    email: 'wang.hao@robotqc.com',
    status: 'disabled',
    lastLoginAt: '2026-02-26 14:02:08',
    roles: ['工艺工程师'],
    password: '123456',
  },
  {
    code: 'USR-004',
    name: '陈宇',
    phone: '13800004444',
    email: 'chen.yu@robotqc.com',
    status: 'enabled',
    lastLoginAt: '2026-03-01 09:41:52',
    roles: ['运维工程师'],
    password: '123456',
  },
];
