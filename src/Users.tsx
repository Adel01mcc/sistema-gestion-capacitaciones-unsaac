import { useEffect, useState, type FormEvent } from 'react';
import { errorMessage, request } from './api';
import { EmptyState, Field, Icon, Loading, Modal, Notice, Pagination } from './components';
import { usePaged } from './hooks';
import { roleLabels, type Permission, type Role, type User } from './types';

function RoleChoices({ roles, selected, onChange }: { roles: Role[]; selected: string[]; onChange: (value: string[]) => void }) {
  return <div className="choice-grid">{roles.map((role) => <label className={`checkbox-choice ${selected.includes(role.code) ? 'selected' : ''}`} key={role.id}><input type="checkbox" checked={selected.includes(role.code)} onChange={(event) => onChange(event.target.checked ? [...selected, role.code] : selected.filter((code) => code !== role.code))} /><span>{role.name || roleLabels[role.code] || role.code}</span></label>)}</div>;
}

function UserForm({ user, roles, canAssignRoles, onClose, onSaved }: { user: User | null; roles: Role[]; canAssignRoles: boolean; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ first_name: user?.first_name ?? '', last_name: user?.last_name ?? '', email: user?.email ?? '', document: user?.document ?? '', department: user?.department ?? '', specialty: user?.specialty ?? '', active: user?.active ?? true, password: '' });
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['participante']);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const update = (field: keyof typeof form, value: string | boolean) => setForm((current) => ({ ...current, [field]: value }));
  async function submit(event: FormEvent) {
    event.preventDefault(); setError('');
    if (!user && canAssignRoles && selectedRoles.length === 0) { setError('Selecciona al menos un rol para la cuenta.'); return; }
    setSaving(true);
    const payload: Record<string, unknown> = { ...form, document: form.document.trim() || null };
    if (user && !form.password) delete payload.password;
    if (!user) payload.roles = canAssignRoles ? selectedRoles : ['participante'];
    try { await request(`/users${user ? `/${user.id}` : ''}`, { method: user ? 'PUT' : 'POST', body: JSON.stringify(payload) }); onSaved(); }
    catch (failure) { setError(errorMessage(failure)); }
    finally { setSaving(false); }
  }
  return <Modal title={user ? 'Editar usuario' : 'Registrar usuario'} description={user ? 'Actualiza la información y el estado de esta cuenta.' : 'Crea una cuenta y define su acceso al sistema.'} onClose={() => { if (!saving) onClose(); }}><form onSubmit={submit}><div className="modal-body"><Notice message={error} /><div className="form-grid">
    <Field label="Nombres *"><input autoComplete="given-name" value={form.first_name} onChange={(event) => update('first_name', event.target.value)} required maxLength={80} /></Field>
    <Field label="Apellidos *"><input autoComplete="family-name" value={form.last_name} onChange={(event) => update('last_name', event.target.value)} required maxLength={80} /></Field>
    <Field label="Correo electrónico *" wide><input type="email" autoComplete="email" value={form.email} onChange={(event) => update('email', event.target.value)} required maxLength={254} placeholder="nombre@ejemplo.com" /></Field>
    <Field label="Documento" hint="Opcional. No se exige un tipo de documento específico."><input value={form.document} onChange={(event) => update('document', event.target.value)} maxLength={20} /></Field>
    <Field label="Área"><input value={form.department} onChange={(event) => update('department', event.target.value)} maxLength={120} /></Field>
    <Field label="Especialidad" wide><input value={form.specialty} onChange={(event) => update('specialty', event.target.value)} maxLength={120} placeholder="Opcional; útil para instructores" /></Field>
    <Field label={user ? 'Nueva contraseña' : 'Contraseña *'} wide hint={user ? 'Deja este campo vacío para conservar la contraseña. Si la cambias, utiliza al menos 12 caracteres.' : 'Utiliza entre 12 y 128 caracteres y compártela de forma privada.'}><input type="password" autoComplete="new-password" value={form.password} onChange={(event) => update('password', event.target.value)} required={!user} minLength={12} maxLength={128} /></Field>
    <div className="wide"><label className="toggle-choice"><input type="checkbox" checked={form.active} onChange={(event) => update('active', event.target.checked)} /><span><strong>Cuenta activa</strong><small>Las cuentas inactivas no pueden iniciar sesión.</small></span></label></div>
    {!user && canAssignRoles && <fieldset className="wide role-fieldset"><legend>Roles de la cuenta *</legend><RoleChoices roles={roles} selected={selectedRoles} onChange={setSelectedRoles} /></fieldset>}
    {!user && !canAssignRoles && <div className="wide"><Notice message="La nueva cuenta tendrá el rol Participante. La asignación de otros roles requiere el permiso de gestión de roles." kind="info" /></div>}
  </div><p className="form-required">* Campos obligatorios.</p></div><div className="modal-actions"><button type="button" className="button secondary" disabled={saving} onClick={onClose}>Cancelar</button><button type="submit" className="button primary" disabled={saving}>{saving ? 'Guardando…' : user ? 'Guardar cambios' : 'Registrar usuario'}<Icon name="check" size={18} /></button></div></form></Modal>;
}

function UserRolesForm({ user, roles, onClose, onSaved }: { user: User; roles: Role[]; onClose: () => void; onSaved: () => void }) {
  const [selected, setSelected] = useState(user.roles);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault(); setError('');
    if (!selected.length) { setError('Selecciona al menos un rol.'); return; }
    setSaving(true);
    try { await request(`/users/${user.id}/roles`, { method: 'PUT', body: JSON.stringify({ roles: selected }) }); onSaved(); }
    catch (failure) { setError(errorMessage(failure)); }
    finally { setSaving(false); }
  }
  return <Modal title="Asignar roles" description={`${user.first_name} ${user.last_name} · ${user.email}`} onClose={() => { if (!saving) onClose(); }}><form onSubmit={submit}><div className="modal-body"><Notice message={error} /><p className="form-intro">Cada rol habilita un conjunto de acciones. La cuenta recibe los permisos de todos sus roles.</p><RoleChoices roles={roles} selected={selected} onChange={setSelected} /><Notice message="El sistema protege la última cuenta administradora activa para conservar el acceso a la administración." kind="info" /></div><div className="modal-actions"><button type="button" className="button secondary" disabled={saving} onClick={onClose}>Cancelar</button><button type="submit" className="button primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar roles'}<Icon name="check" size={18} /></button></div></form></Modal>;
}

export function UsersPage({ currentUser, onSessionRefresh }: { currentUser: User; onSessionRefresh: () => Promise<void> }) {
  const [page, setPage] = useState(1);
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [roles, setRoles] = useState<Role[]>([]);
  const [catalogError, setCatalogError] = useState('');
  const [catalogRevision, setCatalogRevision] = useState(0);
  const [editing, setEditing] = useState<User | null | undefined>(undefined);
  const [roleUser, setRoleUser] = useState<User | null>(null);
  const [success, setSuccess] = useState('');
  const query = new URLSearchParams({ page: String(page), pageSize: '10', search, role: roleFilter });
  const { data, meta, loading, error, reload } = usePaged<User>(`/users?${query}`);
  const canAssignRoles = currentUser.permissions.includes('roles.manage');
  const canEditPerson = (person: User) => canAssignRoles || !person.permissions.some((permission) => permission === 'users.manage' || permission === 'roles.manage');
  useEffect(() => {
    let active = true; setCatalogError('');
    request<{ data: Role[] }>('/roles').then((result) => { if (active) setRoles(result.data); }).catch((failure) => { if (active) setCatalogError(errorMessage(failure)); });
    return () => { active = false; };
  }, [catalogRevision]);
  function saved(message: string) { setEditing(undefined); setRoleUser(null); setSuccess(message); reload(); void onSessionRefresh(); }
  return <>
    <div className="page-heading"><div><p className="eyebrow">PERSONAS Y ACCESO</p><h1>Usuarios</h1><p>Gestiona las cuentas que forman parte del sistema.</p></div><button className="button primary" disabled={roles.length === 0} onClick={() => { setSuccess(''); setEditing(null); }}><Icon name="plus" size={19} />Registrar usuario</button></div>
    <Notice message={success} kind="success" /><Notice message={error} /><Notice message={catalogError} />{catalogError && <button className="button secondary retry-catalog" onClick={() => setCatalogRevision((value) => value + 1)}>Recargar roles</button>}
    <section className="panel"><div className="panel-topline"><div><h2>Directorio de usuarios</h2><p>Datos de las cuentas, roles asignados y estado de acceso.</p></div>{meta && <span className="count-badge">{meta.total} en total</span>}</div><form className="filter-bar" onSubmit={(event) => { event.preventDefault(); setPage(1); setSearch(searchDraft.trim()); }}><div className="search-input"><Icon name="search" size={18} /><input aria-label="Buscar usuarios por nombre o correo" value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder="Buscar por nombre o correo…" maxLength={160} /></div><select aria-label="Filtrar usuarios por rol" value={roleFilter} onChange={(event) => { setPage(1); setRoleFilter(event.target.value); }}><option value="">Todos los roles</option>{roles.map((role) => <option key={role.id} value={role.code}>{role.name}</option>)}</select><button type="submit" className="button secondary">Buscar</button></form>
      {loading ? <Loading /> : error ? <div className="retry-row"><button className="button secondary" onClick={reload}>Reintentar</button></div> : data.length === 0 ? <EmptyState title="No se encontraron usuarios" description="Prueba otra búsqueda o registra una nueva cuenta." /> : <div className="table-scroll"><table><thead><tr><th>Usuario</th><th>Área</th><th>Roles</th><th>Estado</th><th className="align-right">Acciones</th></tr></thead><tbody>{data.map((person) => <tr key={person.id}>
        <td><div className="person-cell"><span className="person-avatar">{person.first_name[0]}{person.last_name[0]}</span><div><strong>{person.first_name} {person.last_name}{person.id === currentUser.id && <span className="self-label">Tú</span>}</strong><span className="table-subtext">{person.email}</span></div></div></td>
        <td>{person.department || <span className="muted">Sin área</span>}</td><td><div className="role-pills">{person.roles.map((role) => <span className="role-pill" key={role}>{roles.find((item) => item.code === role)?.name || roleLabels[role] || role}</span>)}</div></td>
        <td><span className={`status-badge ${person.active ? 'status-active' : 'status-inactive'}`}><span />{person.active ? 'Activo' : 'Inactivo'}</span></td>
        <td className="align-right"><div className="table-actions">
          {canAssignRoles && <button className="button ghost small" disabled={!roles.length} onClick={() => { setSuccess(''); setRoleUser(person); }}>Roles</button>}
          <button className="icon-button" disabled={!canEditPerson(person)} title={canEditPerson(person) ? `Editar a ${person.first_name}` : 'Esta cuenta requiere gestión de roles para editarla'} aria-label={`Editar a ${person.first_name} ${person.last_name}`} onClick={() => { setSuccess(''); setEditing(person); }}><Icon name="edit" size={17} /></button>
        </div></td>
      </tr>)}</tbody></table></div>}
      {!loading && !error && <Pagination meta={meta} onPage={setPage} />}
    </section>
    {editing !== undefined && <UserForm user={editing} roles={roles} canAssignRoles={canAssignRoles} onClose={() => setEditing(undefined)} onSaved={() => saved(editing ? 'Los datos del usuario se actualizaron correctamente.' : 'La cuenta se registró correctamente.')} />}
    {canAssignRoles && roleUser && <UserRolesForm user={roleUser} roles={roles} onClose={() => setRoleUser(null)} onSaved={() => saved('Los roles se actualizaron correctamente.')} />}
  </>;
}

function RoleForm({ role, permissions, onClose, onSaved }: { role: Role; permissions: Permission[]; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(role.name);
  const [selected, setSelected] = useState(role.permissions);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setSaving(true);
    try { await request(`/roles/${role.id}`, { method: 'PUT', body: JSON.stringify({ name, permissions: selected }) }); onSaved(); }
    catch (failure) { setError(errorMessage(failure)); }
    finally { setSaving(false); }
  }
  return <Modal title={`Editar rol: ${role.name}`} description="Define las acciones que podrán realizar las cuentas con este rol." onClose={() => { if (!saving) onClose(); }}><form onSubmit={submit}><div className="modal-body"><Notice message={error} /><Field label="Nombre del rol *"><input value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} /></Field><fieldset className="permission-fieldset"><legend>Permisos habilitados</legend><div className="permissions-list">{permissions.map((permission) => <label key={permission.code} className="permission-choice"><input type="checkbox" checked={selected.includes(permission.code)} onChange={(event) => setSelected(event.target.checked ? [...selected, permission.code] : selected.filter((code) => code !== permission.code))} /><span>{permission.name}</span></label>)}</div></fieldset></div><div className="modal-actions"><button type="button" className="button secondary" disabled={saving} onClick={onClose}>Cancelar</button><button type="submit" className="button primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar permisos'}<Icon name="check" size={18} /></button></div></form></Modal>;
}

export function RolesPage({ onSessionRefresh }: { onSessionRefresh: () => Promise<void> }) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState<Role | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true; setLoading(true); setError('');
    Promise.all([request<{ data: Role[] }>('/roles'), request<{ data: Permission[] }>('/permissions')]).then(([roleResult, permissionResult]) => {
      if (active) { setRoles(roleResult.data); setPermissions(permissionResult.data); }
    }).catch((failure) => { if (active) setError(errorMessage(failure)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [revision]);
  return <>
    <div className="page-heading"><div><p className="eyebrow">ADMINISTRACIÓN DEL ACCESO</p><h1>Roles y permisos</h1><p>Asigna responsabilidades con un acceso adecuado a cada persona.</p></div><span className="context-chip"><Icon name="shield" size={17} />Acceso por roles</span></div>
    <Notice message={success} kind="success" /><Notice message={error} />
    {loading ? <Loading /> : error ? <button className="button secondary" onClick={() => setRevision((value) => value + 1)}>Reintentar</button> : <div className="roles-grid">{roles.map((role) => <section className="role-card" key={role.id}><div className="role-card-heading"><span className={`role-card-icon ${role.code === 'administrador' ? 'teal' : ''}`}><Icon name={role.code === 'instructor' ? 'book' : role.code === 'participante' ? 'users' : 'shield'} size={23} /></span><span className="count-badge">{role.permissions.length} permisos</span></div><h2>{role.name}</h2><p>{role.code === 'administrador' ? 'Acceso completo para administrar y mantener el sistema.' : `Acciones disponibles para las cuentas con rol ${role.name.toLocaleLowerCase('es')}.`}</p><ul className="role-permission-summary">{role.permissions.length ? role.permissions.map((code) => <li key={code}><Icon name="check" size={15} /><span>{permissions.find((permission) => permission.code === code)?.name ?? code}</span></li>) : <li className="muted">Sin permisos habilitados.</li>}</ul><div className="role-card-footer">{role.code === 'administrador' ? <span className="protected-label"><Icon name="shield" size={15} />Rol protegido</span> : <button className="button secondary" onClick={() => { setSuccess(''); setEditing(role); }}><Icon name="edit" size={16} />Editar permisos</button>}</div></section>)}</div>}
    {editing && <RoleForm role={editing} permissions={permissions} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); setSuccess('Los permisos del rol se guardaron correctamente.'); setRevision((value) => value + 1); void onSessionRefresh(); }} />}
  </>;
}
