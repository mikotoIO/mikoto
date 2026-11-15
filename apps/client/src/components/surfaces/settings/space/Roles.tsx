import { MikotoSpace, Role } from '@mikoto-io/mikoto.js';
import { checkPermission, permissions } from '@mikoto-io/permcheck';
import { useSetAtom } from 'jotai';
import { Ban, Plus, Shield, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSnapshot } from 'valtio/react';

import { modalState } from '@/components/ContextMenu';
import {
  Button,
  Field,
  Form,
  IconButton,
  Input,
  PageTitle,
  RoleName,
  Section,
  Switch,
  Tag,
  cx,
  toast,
  useAppearance,
} from '@/design';
import { useMikoto } from '@/hooks';
import { toAppError, useErrorElement } from '@/hooks/useErrorElement';
import { SettingSurface } from '@/views';

import { ConfirmDialog, ListEmpty, SaveBar } from '../common';
import styles from './Roles.module.css';

const EVERYONE = '@everyone';

const rolePermissionData = [
  {
    name: 'Superuser',
    description:
      'Grants every permission. Give this only to people you fully trust.',
    permission: permissions.superuser,
  },
  {
    name: 'Manage space',
    description: "Change the space's name, icon, handle and visibility.",
    permission: permissions.manageSpace,
  },
  {
    name: 'Manage channels',
    description: 'Create, rename, reorder and delete channels.',
    permission: permissions.manageChannels,
  },
  {
    name: 'Manage roles',
    description:
      'Create, edit and delete roles, with permissions they hold themselves.',
    permission: permissions.manageRoles,
  },
  {
    name: 'Assign roles',
    description:
      'Give members roles, or take them away, up to their own permissions.',
    permission: permissions.assignRoles,
  },
  {
    name: 'Moderator',
    description: "Delete anyone's messages and manage invites.",
    permission: permissions.moderator,
  },
  {
    name: 'Manage messages',
    description: "Delete other members' messages.",
    permission: permissions.manageMessages,
  },
  {
    name: 'Manage invites',
    description: 'Create, view and revoke invite links.',
    permission: permissions.manageInvites,
  },
  {
    name: 'Kick and ban members',
    description: 'Remove members from the space, and keep them out.',
    permission: permissions.ban,
  },
  {
    name: 'Manage bots',
    description: 'Add your bots to this space.',
    permission: permissions.manageBots,
  },
];

const ROLE_COLORS = [
  '#F80688',
  '#AD0DF2',
  '#006FFF',
  '#00D68B',
  '#FF981A',
  '#F72649',
];

const HEX = /^#[0-9a-f]{6}$/i;

function RoleColorPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (color: string | null) => void;
}) {
  const normalized = value?.toLowerCase() ?? null;
  return (
    <div className={styles.colors}>
      <IconButton
        aria-label="No color"
        aria-pressed={value === null}
        className={cx(styles.swatch, styles.noColor)}
        onClick={() => onChange(null)}
      >
        <Ban size={14} />
      </IconButton>
      {ROLE_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          className={styles.swatch}
          style={{ '--c': c }}
          aria-label={c}
          aria-pressed={normalized === c.toLowerCase()}
          onClick={() => onChange(c)}
        />
      ))}
      <label className={styles.custom}>
        <input
          type="color"
          aria-label="Custom role color"
          value={value && HEX.test(value) ? value : '#006fff'}
          onChange={(e) => onChange(e.target.value)}
        />
        {value ? value.toUpperCase() : 'Custom'}
      </label>
    </div>
  );
}

function RolePreview({ name, color }: { name: string; color: string | null }) {
  const mikoto = useMikoto();
  const [appearance] = useAppearance();
  const memberName = mikoto.user.me?.name ?? 'Member';
  return (
    <div className={styles.preview} aria-label="Preview" role="group">
      <span className={styles.previewItem}>
        <RoleName
          className={styles.previewName}
          name={memberName}
          roleColor={color}
          roleName={name || 'Role'}
        />
      </span>
      {appearance.roleStyle === 'color' && (
        <Tag color={color}>{name || 'Role'}</Tag>
      )}
    </div>
  );
}

function RolePermissionEditor({
  perms,
  onChange,
}: {
  perms: string;
  onChange: (perms: string) => void;
}) {
  const perm = BigInt(perms);
  return (
    <>
      {rolePermissionData.map((x) => (
        <Field
          key={x.permission.toString()}
          orientation="horizontal"
          label={x.name}
          description={x.description}
        >
          <Switch
            checked={checkPermission(x.permission, perm)}
            onCheckedChange={(on) =>
              onChange(
                (on ? perm | x.permission : perm & ~x.permission).toString(),
              )
            }
          />
        </Field>
      ))}
    </>
  );
}

interface RoleValues {
  name: string;
  position: number;
  color: string | null;
  permissions: string;
}

const ROLE_FORM_ID = 'role-editor-form';

function RoleEditor({
  role,
  space,
  onDeleted,
}: {
  space: MikotoSpace;
  role: Role;
  onDeleted: () => void;
}) {
  const mikoto = useMikoto();
  const setModal = useSetAtom(modalState);
  const error = useErrorElement();
  const isEveryone = role.name === EVERYONE;

  const form = useForm<RoleValues>({
    defaultValues: {
      name: role.name,
      position: role.position,
      color: role.color ?? null,
      permissions: role.permissions,
    },
  });
  const { isDirty, isSubmitting, errors } = form.formState;
  const name = form.watch('name');
  const color = form.watch('color');
  const perms = form.watch('permissions');

  return (
    <div className={styles.editor}>
      <h3 className={styles.editorTitle}>Edit {role.name}</h3>
      {error.el}
      <Form
        id={ROLE_FORM_ID}
        onSubmit={form.handleSubmit(async (data) => {
          error.setError(null);
          try {
            const payload = { ...data, name: data.name.trim() };
            await mikoto.rest['roles.update'](payload, {
              params: { spaceId: space.id, roleId: role.id },
            });
            form.reset(payload);
            toast({ title: 'Role saved', type: 'success' });
          } catch (e) {
            error.setError(e);
          }
        })}
      >
        {!isEveryone && (
          <Section title="Display">
            <Field label="Role name" error={errors.name?.message}>
              <Input
                autoComplete="off"
                {...form.register('name', {
                  validate: (v) =>
                    v.trim().length > 0 || 'Enter a name for the role.',
                })}
              />
            </Field>
            <Field
              label="Priority"
              description="Higher numbers rank higher. A member's highest role sets their name color."
              error={errors.position?.message}
            >
              <Input
                className={styles.position}
                autoComplete="off"
                type="number"
                min={0}
                max={99}
                {...form.register('position', {
                  valueAsNumber: true,
                  validate: (v) =>
                    (Number.isInteger(v) && v >= 0 && v <= 99) ||
                    'Use a whole number from 0 to 99.',
                })}
              />
            </Field>
            <Field
              label="Color"
              description="Colors are adjusted automatically so names stay readable."
            >
              <RoleColorPicker
                value={color}
                onChange={(c) =>
                  form.setValue('color', c, { shouldDirty: true })
                }
              />
            </Field>
            <RolePreview name={name} color={color} />
          </Section>
        )}

        <Section
          title="Permissions"
          description={
            isEveryone
              ? 'What everyone in the space can do, before other roles are added.'
              : 'Members with this role can do the following, in addition to what @everyone can.'
          }
        >
          <RolePermissionEditor
            perms={perms}
            onChange={(p) =>
              form.setValue('permissions', p, { shouldDirty: true })
            }
          />
        </Section>
      </Form>

      {!isEveryone && (
        <Section title="Delete role">
          <Field
            orientation="horizontal"
            label="Delete this role"
            description="Members keep their other roles."
          >
            <Button
              variant="dangerGhost"
              onClick={() =>
                setModal({
                  elem: (
                    <ConfirmDialog
                      title={`Delete ${role.name}?`}
                      description="Everyone with this role loses it and the permissions it grants. This can't be undone."
                      confirmLabel="Delete role"
                      onConfirm={async () => {
                        await mikoto.rest['roles.delete'](undefined, {
                          params: { spaceId: space.id, roleId: role.id },
                        });
                        toast({
                          title: `${role.name} deleted`,
                          type: 'success',
                        });
                        onDeleted();
                      }}
                    />
                  ),
                })
              }
            >
              <Trash2 size={14} aria-hidden />
              Delete role
            </Button>
          </Field>
        </Section>
      )}

      <SaveBar
        dirty={isDirty}
        saving={isSubmitting}
        form={ROLE_FORM_ID}
        onReset={() => form.reset()}
      />
    </div>
  );
}

export function RolesSubsurface({ space }: { space: MikotoSpace }) {
  const { t } = useTranslation();
  const mikoto = useMikoto();
  const spaceRoles = useSnapshot(space.roles);
  const [creating, setCreating] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  // Highest priority first, @everyone at the bottom.
  const roles = [...spaceRoles.values()].sort((a, b) => {
    if (a.name === EVERYONE) return 1;
    if (b.name === EVERYONE) return -1;
    return b.position - a.position;
  });
  const role = roles.find((x) => x.id === selectedRoleId) ?? roles[0];

  const createRole = async () => {
    setCreating(true);
    try {
      const created = await mikoto.rest['roles.create'](
        { name: 'New role' },
        { params: { spaceId: space.id } },
      );
      setSelectedRoleId(created.id);
      toast({ title: 'Role created', type: 'success' });
    } catch (e) {
      toast({
        title: "Couldn't create a role",
        description: toAppError(e)?.message,
        type: 'error',
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <SettingSurface wide>
      <PageTitle
        title={t('spaceSettings.roles.title')}
        description="Roles group permissions and give members a color or tag."
        actions={
          <Button variant="primary" loading={creating} onClick={createRole}>
            <Plus size={15} aria-hidden />
            Create role
          </Button>
        }
      />
      {roles.length === 0 || !role ? (
        <ListEmpty
          icon={<Shield size={18} />}
          title="No roles yet"
          description="Create a role to give members permissions and a color."
        />
      ) : (
        <div className={styles.layout}>
          <nav className={styles.list} aria-label="Roles">
            <div className={styles.listHead}>
              {roles.length} {roles.length === 1 ? 'role' : 'roles'}
            </div>
            {roles.map((r) => (
              <button
                key={r.id}
                type="button"
                className={styles.roleRow}
                aria-current={role.id === r.id}
                onClick={() => setSelectedRoleId(r.id)}
              >
                <span
                  className={cx(styles.dot, r.color && styles.dotColored)}
                  style={r.color ? { '--role': r.color } : undefined}
                  aria-hidden
                />
                <span className={styles.roleName}>{r.name}</span>
              </button>
            ))}
          </nav>
          <RoleEditor
            key={role.id}
            role={role}
            space={space}
            onDeleted={() => setSelectedRoleId(null)}
          />
        </div>
      )}
    </SettingSurface>
  );
}
