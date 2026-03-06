import { Button, Card, Checkbox, Col, Input, Modal, Row, Select, Space, Tag, Tree, Typography, message } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useI18n } from '../../../i18n/I18nProvider';
import { usePermissionManage } from '../../../logic/deployConfig/usePermissionManage';
import { setRolePermissionConfig } from '../../../logic/deployConfig/permissionStore';
import { getStoredRoles } from '../../../logic/deployConfig/roleStore';
import type { PermissionAction } from '../../../shared/types/deployConfig';
import './PermissionManagePage.css';

const ACTION_LABEL_KEYS: Record<PermissionAction, string> = {
  display: 'permissionManage.action.display',
  create: 'permissionManage.action.create',
  edit: 'permissionManage.action.edit',
  delete: 'permissionManage.action.delete',
  import: 'permissionManage.action.import',
  export: 'permissionManage.action.export',
  detail: 'permissionManage.action.detail',
  review: 'permissionManage.action.review',
  cancel: 'permissionManage.action.cancel',
  enable: 'permissionManage.action.enable',
  disable: 'permissionManage.action.disable',
  role: 'permissionManage.action.role',
  changePassword: 'permissionManage.action.changePassword',
  viewVideo: 'permissionManage.action.viewVideo',
  viewImage: 'permissionManage.action.viewImage',
};

type PermissionSnapshot = {
  checkedKeys: string[];
  permissionMap: Record<string, PermissionAction[]>;
};

function normalizePermissionMap(map: Record<string, PermissionAction[]>): Record<string, PermissionAction[]> {
  const normalized: Record<string, PermissionAction[]> = {};
  Object.keys(map)
    .sort()
    .forEach((key) => {
      normalized[key] = [...map[key]].sort();
    });
  return normalized;
}

function getActionsByNode(pathOrId: string, title: string): PermissionAction[] {
  const lower = `${pathOrId} ${title}`.toLowerCase();
  const containsAny = (keywords: string[]) => keywords.some((keyword) => lower.includes(keyword));

  if (containsAny(['usermanage'])) {
    return ['display', 'create', 'edit', 'delete', 'import', 'export', 'role', 'changePassword'];
  }
  if (containsAny(['rolemanage'])) {
    return ['display', 'create', 'edit', 'delete'];
  }
  if (containsAny(['permissionmanage'])) {
    return ['display', 'edit'];
  }
  if (containsAny(['workordermanage'])) {
    return ['display', 'detail', 'review', 'edit', 'cancel', 'delete', 'import', 'export'];
  }
  if (containsAny(['reinspectionrecord'])) {
    return ['display', 'export', 'viewVideo', 'viewImage'];
  }
  if (containsAny(['workstationmanage', 'workstationpositionmanage'])) {
    return ['display', 'detail', 'enable', 'disable', 'review'];
  }
  if (
    containsAny([
      'workstationconfig',
      'workstationpositionconfig',
      'wireharnesstype',
      'terminalconfig',
      'workshopconfig',
      'robottype',
      'robotgroup',
      'robotparts',
      'chargestrategy',
      'homingstrategy',
      'configtemplate',
      'mapmanage',
      'packagemanage',
      'servicemanage',
    ])
  ) {
    return ['display', 'create', 'edit', 'delete', 'import', 'export', 'enable', 'disable'];
  }
  if (containsAny(['robotlist', 'robotmanage', 'taskmanage', 'taskorchestration'])) {
    return ['display', 'detail', 'create', 'edit', 'delete', 'import', 'export', 'enable', 'disable', 'cancel'];
  }
  if (containsAny(['publishmanage'])) {
    return ['display', 'create', 'detail', 'cancel', 'export'];
  }
  if (containsAny(['filemanage'])) {
    return ['display', 'detail', 'import', 'export', 'delete'];
  }
  if (containsAny(['qualitystatistics', 'qualityreport', 'devicestatistics', 'exceptionstatistics'])) {
    return ['display', 'detail', 'export', 'create'];
  }
  if (containsAny(['exceptionnotification', 'loginlog', 'operationlog', 'apilog'])) {
    return ['display', 'detail', 'export'];
  }

  return ['display'];
}

export function PermissionManagePage() {
  return <PermissionManagePageInner />;
}

interface PermissionManagePageProps {
  fixedRole?: string;
  hideHeaderCard?: boolean;
  onSaved?: () => void;
}

export function PermissionManagePageInner({ fixedRole, hideHeaderCard = false, onSaved }: PermissionManagePageProps = {}) {
  const { t } = useI18n();
  const [messageApi, contextHolder] = message.useMessage();
  const [keyword, setKeyword] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [snapshotsByRole, setSnapshotsByRole] = useState<Record<string, PermissionSnapshot>>({});

  const {
    rootNodes,
    titleMap,
    allKeys,
    roleOptions,
    selectedRole,
    setSelectedRole,
    checkedKeys,
    setCheckedKeys,
    selectedKey,
    setSelectedKey,
    permissionMapForSelectedRole,
    setPermissionMapForSelectedRole,
    patchNodePermissions,
    getNodePermissions,
    getAncestorKeys,
    getDescendantKeys,
    toTreeData,
  } = usePermissionManage();

  const rawTreeData = useMemo(() => toTreeData(rootNodes, t), [rootNodes, t, toTreeData]);

  useEffect(() => {
    if (fixedRole && fixedRole !== selectedRole) {
      setSelectedRole(fixedRole);
    }
  }, [fixedRole, selectedRole, setSelectedRole]);

  useEffect(() => {
    setExpandedKeys(allKeys);
  }, [allKeys]);

  useEffect(() => {
    setSnapshotsByRole((prev) => {
      if (prev[selectedRole]) {
        return prev;
      }
      return {
        ...prev,
        [selectedRole]: {
          checkedKeys: [...checkedKeys],
          permissionMap: normalizePermissionMap(permissionMapForSelectedRole),
        },
      };
    });
  }, [selectedRole, checkedKeys, permissionMapForSelectedRole]);

  const currentSnapshot = snapshotsByRole[selectedRole];
  const isDirty = useMemo(() => {
    if (!currentSnapshot) {
      return false;
    }
    const currentChecked = [...checkedKeys].sort();
    const savedChecked = [...currentSnapshot.checkedKeys].sort();
    const currentMap = normalizePermissionMap(permissionMapForSelectedRole);
    const savedMap = normalizePermissionMap(currentSnapshot.permissionMap);
    return JSON.stringify(currentChecked) !== JSON.stringify(savedChecked) || JSON.stringify(currentMap) !== JSON.stringify(savedMap);
  }, [checkedKeys, permissionMapForSelectedRole, currentSnapshot]);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!isDirty) {
        return;
      }
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const memberCount = useMemo(() => getStoredRoles().find((item) => item.name === selectedRole)?.memberCount ?? 0, [selectedRole]);
  const selectedMenuCount = checkedKeys.length;
  const selectedButtonCount = Object.values(permissionMapForSelectedRole).reduce((sum, actions) => sum + actions.length, 0);

  const actionLabelMap = useMemo<Record<PermissionAction, string>>(
    () =>
      (Object.keys(ACTION_LABEL_KEYS) as PermissionAction[]).reduce((acc, action) => {
        acc[action] = t(ACTION_LABEL_KEYS[action]);
        return acc;
      }, {} as Record<PermissionAction, string>),
    [t],
  );

  const highlight = (text: string): ReactNode => {
    const normalized = keyword.trim();
    if (!normalized) {
      return text;
    }
    const index = text.toLowerCase().indexOf(normalized.toLowerCase());
    if (index < 0) {
      return text;
    }
    return (
      <>
        {text.slice(0, index)}
        <span style={{ backgroundColor: '#fff1b8' }}>{text.slice(index, index + normalized.length)}</span>
        {text.slice(index + normalized.length)}
      </>
    );
  };

  const setNodePermissionsWithRules = (nodeKey: string, permissions: PermissionAction[]) => {
    if (!checkedKeys.includes(nodeKey)) {
      return;
    }
    setPermissionMapForSelectedRole({
      ...permissionMapForSelectedRole,
      [nodeKey]: permissions,
    });
  };

  const toggleNodeAction = (nodeKey: string, action: PermissionAction, checked: boolean) => {
    const current = new Set(getNodePermissions(nodeKey));
    if (checked) {
      current.add(action);
    } else {
      current.delete(action);
    }
    setNodePermissionsWithRules(nodeKey, Array.from(current));
  };

  const syncCheckAndPermissions = (nextCheckedKeys: string[]) => {
    const prevChecked = new Set(checkedKeys);
    const nextChecked = new Set(nextCheckedKeys);
    const nextWithDescendants = new Set(nextCheckedKeys);

    [...nextChecked].forEach((key) => {
      getDescendantKeys(key).forEach((descendant) => {
        nextWithDescendants.add(descendant);
      });
    });

    const finalCheckedKeys = Array.from(nextWithDescendants);
    const finalCheckedSet = new Set(finalCheckedKeys);
    const added = [...finalCheckedSet].filter((key) => !prevChecked.has(key));
    const removed = [...prevChecked].filter((key) => !finalCheckedSet.has(key));

    const patch: Record<string, PermissionAction[]> = {};
    const forceFullActionKeys = new Set<string>();

    added.forEach((key) => {
      const descendants = getDescendantKeys(key);
      if (descendants.length > 0) {
        forceFullActionKeys.add(key);
        descendants.forEach((descKey) => forceFullActionKeys.add(descKey));
      }
    });

    added.forEach((key) => {
      const nodeLabel = t(titleMap[key] ?? '');
      const actions = getActionsByNode(key, nodeLabel);
      if (forceFullActionKeys.has(key)) {
        patch[key] = [...new Set(actions)];
      } else if (actions.includes('display')) {
        const current = new Set(getNodePermissions(key));
        current.add('display');
        patch[key] = Array.from(current);
      }
    });

    forceFullActionKeys.forEach((key) => {
      const nodeLabel = t(titleMap[key] ?? '');
      const actions = getActionsByNode(key, nodeLabel);
      patch[key] = [...new Set(actions)];
    });

    removed.forEach((key) => {
      patch[key] = [];
      getDescendantKeys(key).forEach((descKey) => {
        patch[descKey] = [];
      });
    });

    setCheckedKeys(finalCheckedKeys);
    if (Object.keys(patch).length > 0) {
      patchNodePermissions(patch);
    }
  };

  const handleSearch = (value: string) => {
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      setExpandedKeys(allKeys);
      return;
    }
    const matchedKeys = Object.entries(titleMap)
      .filter(([key, titleKey]) => {
        const nodeTitle = t(titleKey).toLowerCase();
        const actionText = getActionsByNode(key, t(titleKey))
          .map((action) => actionLabelMap[action].toLowerCase())
          .join(' ');
        return nodeTitle.includes(normalized) || key.toLowerCase().includes(normalized) || actionText.includes(normalized);
      })
      .map(([key]) => key);

    const nextExpanded = new Set<string>();
    matchedKeys.forEach((key) => {
      nextExpanded.add(key);
      getAncestorKeys(key).forEach((ancestor) => nextExpanded.add(ancestor));
    });
    setExpandedKeys(Array.from(nextExpanded));
  };

  const handleCheckAllMenus = () => {
    const nextCheckedKeys = [...allKeys];
    const patch: Record<string, PermissionAction[]> = {};

    nextCheckedKeys.forEach((key) => {
      const nodeLabel = t(titleMap[key] ?? '');
      const actions = getActionsByNode(key, nodeLabel);
      patch[key] = [...new Set(actions)];
    });

    setCheckedKeys(nextCheckedKeys);
    if (Object.keys(patch).length > 0) {
      patchNodePermissions(patch);
    }
  };

  const saveChanges = () => {
    const snapshot = {
      checkedKeys: [...checkedKeys],
      permissionMap: normalizePermissionMap(permissionMapForSelectedRole),
    };

    setRolePermissionConfig(selectedRole, snapshot);
    setSnapshotsByRole((prev) => ({
      ...prev,
      [selectedRole]: {
        checkedKeys: snapshot.checkedKeys,
        permissionMap: snapshot.permissionMap,
      },
    }));
    messageApi.success(t('permissionManage.saveSuccess'));
    onSaved?.();
  };

  const rollbackChanges = () => {
    if (!currentSnapshot) {
      return;
    }
    setCheckedKeys([...currentSnapshot.checkedKeys]);
    setPermissionMapForSelectedRole({ ...currentSnapshot.permissionMap });
    messageApi.info(t('permissionManage.rollbackDone'));
  };

  const switchRole = (role: string) => {
    if (fixedRole) {
      return;
    }
    if (role === selectedRole) {
      return;
    }
    if (!isDirty) {
      setSelectedRole(role);
      return;
    }
    Modal.confirm({
      title: t('permissionManage.switchRoleConfirmTitle'),
      content: t('permissionManage.switchRoleConfirmContent'),
      okText: t('permissionManage.switchRoleConfirmOk'),
      cancelText: t('qcConfig.common.cancel'),
      onOk: () => setSelectedRole(role),
    });
  };

  const renderNodeTitle = (nodeKey: string, nodeLabel: string): ReactNode => {
    const checked = checkedKeys.includes(nodeKey);
    const actions = getActionsByNode(nodeKey, nodeLabel);
    const selectedActions = new Set(getNodePermissions(nodeKey));

    return (
      <div
        className={`permission-node-row ${checked ? 'permission-node-row-checked' : ''}`}
        onClick={(event) => {
          event.stopPropagation();
          setSelectedKey(nodeKey);
        }}
      >
        <div className="permission-node-menu">
          <Typography.Text strong>{highlight(nodeLabel)}</Typography.Text>
        </div>
        <div className="permission-node-actions">
          <span className="permission-node-actions-label">{t('permissionManage.permissionsTitle')}:</span>
          <Space wrap size={[8, 4]}>
            {actions.map((action) => (
              <Checkbox
                key={`${nodeKey}-${action}`}
                className="permission-action-checkbox"
                checked={selectedActions.has(action)}
                disabled={!checked}
                onChange={(event) => toggleNodeAction(nodeKey, action, event.target.checked)}
              >
                {highlight(actionLabelMap[action])}
              </Checkbox>
            ))}
          </Space>
        </div>
      </div>
    );
  };

  const treeData = useMemo(() => {
    const build = (nodes: DataNode[]): DataNode[] =>
      nodes.map((node) => ({
        ...node,
        title: renderNodeTitle(String(node.key), String(node.title)),
        children: node.children ? build(node.children) : undefined,
      }));
    return build(rawTreeData);
  }, [rawTreeData, checkedKeys, permissionMapForSelectedRole, keyword, selectedKey]);

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {contextHolder}
      {hideHeaderCard ? null : (
        <Card>
          <Row gutter={[12, 12]} align="middle" justify="space-between">
            <Col xs={24} lg={5}>
              <Typography.Title level={4} style={{ margin: 0 }}>
                {t('permissionManage.pageTitle')}
              </Typography.Title>
            </Col>
            <Col xs={24} lg={7}>
              <Space wrap={false}>
                {fixedRole ? (
                  <Tag color="purple" style={{ marginInlineEnd: 0 }}>
                    {`${t('permissionManage.roleLabel')}: ${selectedRole}`}
                  </Tag>
                ) : (
                  <>
                    <Typography.Text style={{ whiteSpace: 'nowrap' }}>{t('permissionManage.roleLabel')}</Typography.Text>
                    <Select style={{ width: 220 }} value={selectedRole} options={roleOptions} onChange={switchRole} disabled={Boolean(fixedRole)} />
                  </>
                )}
                <Tag color="processing">{t('permissionManage.summary.memberCount', { count: memberCount })}</Tag>
                <Tag color="blue">{t('permissionManage.summary.totalCount', { count: selectedMenuCount + selectedButtonCount })}</Tag>
              </Space>
            </Col>
            <Col xs={24} lg={12}>
              <Space wrap style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Tag color="geekblue">
                  {t('permissionManage.summary.menuCount')}: {selectedMenuCount}
                </Tag>
                <Tag color="cyan">
                  {t('permissionManage.summary.buttonCount')}: {selectedButtonCount}
                </Tag>
                <Button type="primary" onClick={saveChanges}>
                  {t('permissionManage.save')}
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>
      )}

      <Card title={t('permissionManage.menuTreeTitle')} styles={{ body: { minHeight: 460 } }}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Input.Search
            allowClear
            value={keyword}
            placeholder={t('permissionManage.menuSearchPlaceholder')}
            onChange={(event) => {
              const next = event.target.value;
              setKeyword(next);
              handleSearch(next);
            }}
          />
          <Space wrap>
            <Button onClick={handleCheckAllMenus}>{t('permissionManage.menuCheckAll')}</Button>
            <Button onClick={() => syncCheckAndPermissions([])}>{t('permissionManage.menuClearAll')}</Button>
            <Button onClick={() => setExpandedKeys(allKeys)}>{t('permissionManage.menuExpandAll')}</Button>
            <Button onClick={() => setExpandedKeys(rootNodes.map((item) => item.key))}>{t('permissionManage.menuCollapseAll')}</Button>
          </Space>
          <Typography.Text type="secondary">{t('permissionManage.checkedCount', { count: checkedKeys.length })}</Typography.Text>
        </Space>
        <Tree
          className="permission-manage-tree"
          checkable
          expandedKeys={expandedKeys}
          checkedKeys={checkedKeys}
          selectedKeys={selectedKey ? [selectedKey] : []}
          treeData={treeData}
          onExpand={(keys) => setExpandedKeys(keys as string[])}
          onSelect={(keys) => setSelectedKey((keys[0] as string) || null)}
          onCheck={(nextCheckedKeys) => {
            if (Array.isArray(nextCheckedKeys)) {
              syncCheckAndPermissions(nextCheckedKeys as string[]);
              return;
            }
            syncCheckAndPermissions(nextCheckedKeys.checked as string[]);
          }}
        />
      </Card>

      {isDirty ? (
        <Card style={{ position: 'sticky', bottom: 8, zIndex: 1000, borderColor: '#faad14' }} bodyStyle={{ padding: '10px 16px' }}>
          <Row align="middle" justify="space-between">
            <Col>
              <Typography.Text type="warning">{t('permissionManage.unsavedBar')}</Typography.Text>
            </Col>
            <Col>
              <Space>
                <Button onClick={rollbackChanges}>{t('permissionManage.rollback')}</Button>
                <Button type="primary" onClick={saveChanges}>
                  {t('permissionManage.save')}
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>
      ) : null}
    </Space>
  );
}
