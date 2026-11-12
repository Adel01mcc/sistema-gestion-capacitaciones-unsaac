import { useEffect, useState, type FormEvent } from 'react';
import { ApiError, errorMessage, request, setCsrfToken } from './api';
import { Field, Icon, Loading, Notice, type IconName } from './components';
import { DashboardPage, TrainingsPage } from './Trainings';
import { RolesPage, UsersPage } from './Users';
import { roleLabels, type User } from './types';

type View = 'dashboard' | 'trainings' | 'users' | 'roles';
type AuthResponse = { data: { user: User; csrfToken: string } };

function Login({ onLogin, initialError }: { onLogin: (result: AuthResponse) => void; initialError: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(initialError);
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setPending(true);
    try { onLogin(await request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })); }
    catch (failure) { setError(errorMessage(failure)); }
    finally { setPending(false); }
  }
  return <div className="login-layout">
    <section className="login-story"><a className="brand" href="#" aria-label="Paz Sur, inicio de sesión"><span className="brand-mark">P<span>↗</span></span><span>PAZ SUR<small>GESTIÓN DE CAPACITACIONES</small></span></a>
      <div className="login-message"><span className="section-kicker">APRENDER NOS HACE CRECER</span><h1>El conocimiento<br />impulsa a<br /><em>nuestro equipo.</em></h1><p>Un espacio para organizar la formación y acompañar el desarrollo de las personas.</p><div className="login-line" /><span className="login-location">Cusco, Perú <span>·</span> Proyecto académico UNSAAC</span></div>
      <div className="story-shape shape-one" /><div className="story-shape shape-two" />
    </section>
    <main className="login-panel"><div className="login-form"><span className="section-kicker">BIENVENIDO A PAZ SUR</span><h2>Tu equipo, conectado.</h2><p className="muted">Inicia sesión para gestionar tus capacitaciones.</p><Notice message={error} /><form onSubmit={submit}>
      <Field label="Correo electrónico"><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nombre@ejemplo.com" autoComplete="username" required maxLength={254} /></Field>
      <Field label="Contraseña"><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="Tu contraseña" required maxLength={128} /></Field>
      <button type="submit" className="button primary login-submit" disabled={pending}>{pending ? 'Ingresando…' : 'Iniciar sesión'}<Icon name="arrow" /></button>
    </form><p className="login-help">Solicita tu cuenta al administrador del sistema.<br />Para la demostración, utiliza las credenciales configuradas al preparar los datos ficticios.</p></div><footer>Ingeniería de Software I <span>·</span> UNSAAC</footer></main>
  </div>;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [sessionError, setSessionError] = useState('');
  const [view, setView] = useState<View>('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  function acceptSession(result: AuthResponse) {
    setCsrfToken(result.data.csrfToken); setUser(result.data.user); setSessionError(''); setView('dashboard');
  }
  useEffect(() => {
    let active = true;
    request<AuthResponse>('/auth/me').then((result) => { if (active) acceptSession(result); })
      .catch((failure: unknown) => { if (active && !(failure instanceof ApiError && failure.status === 401)) setSessionError(errorMessage(failure)); })
      .finally(() => { if (active) setChecking(false); });
    const expired = () => { setUser(null); setCsrfToken(''); setSessionError('La sesión terminó. Inicia sesión nuevamente.'); };
    window.addEventListener('session-expired', expired);
    return () => { active = false; window.removeEventListener('session-expired', expired); };
  }, []);
  async function refreshSession() {
    try { const result = await request<AuthResponse>('/auth/me'); setUser(result.data.user); setCsrfToken(result.data.csrfToken); }
    catch (failure) {
      if (failure instanceof ApiError && failure.status === 401) {
        setUser(null); setCsrfToken(''); setSessionError('La sesión terminó. Inicia sesión nuevamente.');
      } else setLogoutError(errorMessage(failure));
    }
  }
  async function logout() {
    setLogoutPending(true); setLogoutError('');
    try { await request('/auth/logout', { method: 'POST', body: JSON.stringify({}) }); setUser(null); setCsrfToken(''); setSessionError(''); }
    catch (failure) { setLogoutError(errorMessage(failure)); }
    finally { setLogoutPending(false); }
  }
  if (checking) return <div className="boot-screen"><span className="brand-mark">P<span>↗</span></span><Loading /></div>;
  if (!user) return <Login onLogin={acceptSession} initialError={sessionError} />;
  const can = (permission: string) => user.permissions.includes(permission);
  const nav: { id: View; label: string; icon: IconName; visible: boolean }[] = [
    { id: 'dashboard', label: 'Vista general', icon: 'grid', visible: true },
    { id: 'trainings', label: 'Capacitaciones', icon: 'calendar', visible: true },
    { id: 'users', label: 'Usuarios', icon: 'users', visible: can('users.manage') },
    { id: 'roles', label: 'Roles y permisos', icon: 'shield', visible: can('roles.manage') },
  ];
  const activeView = nav.find((item) => item.id === view && item.visible)?.id ?? 'dashboard';
  const navigate = (next: View) => { setView(next); setMenuOpen(false); };
  const initials = `${user.first_name[0] ?? ''}${user.last_name[0] ?? ''}`;
  return <div className="app-layout"><a className="skip-link" href="#main-content">Ir al contenido principal</a>
    {menuOpen && <button className="sidebar-scrim" aria-label="Cerrar menú" onClick={() => setMenuOpen(false)} />}
    <aside className={`sidebar ${menuOpen ? 'is-open' : ''}`}><button className="brand brand-button" onClick={() => navigate('dashboard')}><span className="brand-mark">P<span>↗</span></span><span>PAZ SUR<small>FORMACIÓN Y DESARROLLO</small></span></button>
      <div className="sidebar-group-label">ESPACIO DE TRABAJO</div><nav aria-label="Navegación principal">{nav.filter((item) => item.visible).map((item) => <button key={item.id} className={`nav-item ${activeView === item.id ? 'active' : ''}`} aria-current={activeView === item.id ? 'page' : undefined} onClick={() => navigate(item.id)}><Icon name={item.icon} /><span>{item.label}</span>{activeView === item.id && <span className="nav-dot" />}</button>)}</nav>
      <div className="sidebar-note"><div className="sidebar-note-icon"><Icon name="book" size={22} /></div><strong>Crecer empieza<br />por aprender.</strong><p>Formación organizada para un equipo preparado.</p></div>
      <div className="sidebar-footer"><span className="sidebar-footer-dot" />Proyecto académico · UNSAAC</div>
    </aside>
    <div className="workspace"><header className="topbar"><div className="breadcrumb"><button className="icon-button mobile-menu" aria-label="Abrir menú" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><Icon name="menu" /></button><span>Mi espacio</span><span className="breadcrumb-separator">/</span><strong>{nav.find((item) => item.id === activeView)?.label}</strong></div><div className="topbar-user"><div className="user-avatar">{initials}</div><div className="user-identity"><strong>{user.first_name} {user.last_name}</strong><span>{user.roles.map((role) => roleLabels[role] ?? role).join(' · ')}</span></div><button className="icon-button logout-button" onClick={logout} disabled={logoutPending} aria-label={logoutPending ? 'Cerrando sesión' : 'Cerrar sesión'} title="Cerrar sesión"><Icon name="logout" size={18} /></button></div></header>
      <main className="main-content" id="main-content" tabIndex={-1}><Notice message={logoutError} />
        {activeView === 'dashboard' && <DashboardPage user={user} onNavigate={() => navigate('trainings')} />}
        {activeView === 'trainings' && <TrainingsPage user={user} />}
        {activeView === 'users' && <UsersPage currentUser={user} onSessionRefresh={refreshSession} />}
        {activeView === 'roles' && <RolesPage onSessionRefresh={refreshSession} />}
      </main><footer className="workspace-footer"><span>Paz Sur · Gestión de capacitaciones</span><span>Demostración académica con datos ficticios</span></footer>
    </div>
  </div>;
}
