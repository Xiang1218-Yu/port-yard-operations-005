import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

type Dashboard = { activeVoyages: number; berthMoves: number; yardUtilization: number; gateQueue: number; pendingTasks: number; blockedTasks: number; reeferAlerts: number; hazmatHolds: number; lateVessels: number };
type Voyage = { id: string; vessel: string; service: string; eta: string; etd: string; status: string; berth: string; movesPlanned: number; movesDone: number; lateRisk: string };
type Container = { id: string; voyageId: string; size: '20'|'40'|'45'; isoType: string; direction: 'import'|'export'|'transshipment'; status: string; weightT: number; reefer: boolean; temperature?: number; hazmatClass?: string; customs: 'released'|'inspection'|'hold'; priority: string; yardSlot: string; appointmentId?: string; lastEvent: string };
type Block = { id: string; zone: string; capacity: number; occupied: number; reeferPlugs: number; usedPlugs: number; hazmatAllowed: boolean; heat: number; utilization: number; freeSlots: number; pressure: string };
type Conflict = { severity: string; appointmentId: string; reason: string };
type Appointment = { id: string; containerId: string; truckNo: string; driver: string; type: 'pickup'|'dropoff'; windowStart: string; windowEnd: string; lane: 'north'|'south'|'rail'; status: string; exception?: string };
type Task = { id: string; kind: string; containerId: string; from: string; to: string; equipmentId?: string; priority: number; score: number; status: string; blockingReasons: string[]; estimatedMinutes: number; scheduledAt: string };
type Equipment = { id: string; name: string; kind: string; status: string; location: string; battery: number; queue: number; movesPerHour: number };
type RailUnsealReason = 'customs-inspection' | 'id-mismatch' | 'rail-window-change';
type RailMemberView = { containerId: string; state: string; source: string; refId?: string; note?: string; addedAt: string; arrivedAt?: string; container?: { id: string; size: string; direction: string; status: string; customs: string; yardSlot: string; hazmatClass?: string; reefer: boolean; lastEvent: string }; appointment?: { id: string; lane: string; status: string }; openTasks: { id: string; kind: string; status: string; to: string; blockingReasons: string[] }[]; blockers: string[]; ready: boolean };
type RailBatch = { id: string; trainNo: string; originStation: string; destStation: string; windowStart: string; windowEnd: string; lane: string; status: 'draft'|'sealed'|'in-transit'|'arrived'|'cancelled'; members: RailMemberView[]; activeMembers: RailMemberView[]; readyCount: number; missingYard: { containerId: string; blockers: string[] }[]; missingStation: { containerId: string; state: string }[]; blockers: string[]; warnings: string[]; canSeal: boolean; canDepart: boolean; frozen: boolean; sealedAt?: string; departedAt?: string; completedAt?: string; cancelReason?: string; activeUnseal?: { reason: RailUnsealReason; actor: string; at: string; note: string }; unsealHistory: { reason: RailUnsealReason; actor: string; at: string; note: string }[]; lastEvent: string };
type RailCandidate = { containerId: string; status: string; direction: string; customs: string; yardSlot: string; appointmentId?: string; appointmentLane?: string; appointmentStatus?: string; taskIds: string[]; blockers: string[]; inBatchId?: string };
type RailSummary = { total: number; active: number; inTransit: number; unsealed: number; missingAtStation: number; blockedBatches: { id: string; trainNo: string; status: string; missingYard: { containerId: string; blockers: string[] }[]; missingStation: { containerId: string; state: string }[]; blockers: string[] }[] };
type Section = 'control'|'containers'|'gate'|'rail'|'yard'|'tasks';
type Editor = { entity: 'container'|'appointment'|'task'; mode: 'create'|'edit'; id?: string; values: Record<string, string|boolean> };

const RAIL_STATUS_LABEL: Record<string, string> = { draft: '集结中', sealed: '已封批', 'in-transit': '在途', arrived: '已到站', cancelled: '已取消' };
const RAIL_MEMBER_LABEL: Record<string, string> = { pending: '待集结', 'at-gate': '铁路闸口', 'on-rail': '在途', arrived: '已到站', intercepted: '查验拦截', pulled: '已撤出' };
const RAIL_UNSEAL_TEXT: Record<RailUnsealReason, string> = { 'customs-inspection': '海关查验拦截', 'id-mismatch': '箱号/封志不符', 'rail-window-change': '铁路窗口变更' };
const railBatchOf = (containerId: string, batches?: RailBatch[]) => (batches ?? []).find(batch => ['draft', 'sealed', 'in-transit'].includes(batch.status) && batch.activeMembers.some(member => member.containerId === containerId));

const api = '/api';
const pct = (value: number) => `${Math.round(value * 100)}%`;
const time = (value: string) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const toLocalInput = (value?: string) => {
  const date = value ? new Date(value) : new Date(Date.now() + 30 * 60000);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const defaultValues = (entity: Editor['entity']): Record<string, string|boolean> => {
  if (entity === 'container') return { id: '', voyageId: 'VOY-AX7', size: '40', isoType: '45G1', direction: 'import', status: 'in-yard', weightT: '20', reefer: false, temperature: '4', hazmatClass: '', customs: 'released', priority: 'normal', yardSlot: 'C03-R01-T1' };
  if (entity === 'appointment') return { containerId: '', truckNo: '', driver: '', type: 'pickup', windowStart: toLocalInput(), windowEnd: toLocalInput(new Date(Date.now() + 60 * 60000).toISOString()), lane: 'north' };
  return { kind: 'receive', containerId: '', from: '闸口', to: 'C03-R01-T1', equipmentId: '', priority: '50', scheduledAt: toLocalInput(), estimatedMinutes: '20', status: 'queued' };
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${api}${path}`, { ...init, headers: { ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...init?.headers } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || `请求失败 (${response.status})`);
  return body as T;
}

export default function App() {
  const [dashboard, setDashboard] = useState<Dashboard>();
  const [voyages, setVoyages] = useState<Voyage[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [railBatches, setRailBatches] = useState<RailBatch[]>([]);
  const [railCandidatesList, setRailCandidatesList] = useState<RailCandidate[]>([]);
  const [railSummary, setRailSummary] = useState<RailSummary>();
  const [railCreate, setRailCreate] = useState<{ trainNo: string; destStation: string; windowStart: string; windowEnd: string; picked: string[] }>();
  const [railPrompt, setRailPrompt] = useState<{ kind: 'unseal'|'pull'|'intercept'|'resolve-pull'|'cancel'|'scan'|'arrival'|'window'; batchId: string; containerId?: string; reason?: RailUnsealReason; title: string }>();
  const [railInput, setRailInput] = useState('');
  const [railBusy, setRailBusy] = useState(false);
  const [tab, setTab] = useState<Section>('control');
  const [selectedVoyage, setSelectedVoyage] = useState('VOY-AX7');
  const [editor, setEditor] = useState<Editor>();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [d, v, ctn, b, cf, a, t, e, rb, rc, rs] = await Promise.all([
      request<Dashboard>('/dashboard'), request<Voyage[]>('/voyages'), request<Container[]>('/containers'),
      request<Block[]>('/yard/heatmap'), request<Conflict[]>('/gate/conflicts'), request<Appointment[]>('/gate/appointments'),
      request<Task[]>('/tasks'), request<Equipment[]>('/equipment'),
      request<RailBatch[]>('/rail/batches'), request<RailCandidate[]>('/rail/candidates'), request<RailSummary>('/rail/summary')
    ]);
    setDashboard(d); setVoyages(v); setContainers(ctn); setBlocks(b); setConflicts(cf); setAppointments(a); setTasks(t); setEquipment(e);
    setRailBatches(rb); setRailCandidatesList(rc); setRailSummary(rs);
  }, []);
  useEffect(() => { void load().catch(reason => setError(reason instanceof Error ? reason.message : '无法连接服务端')); }, [load]);

  const mutate = async (path: string, method: string, body?: unknown) => {
    setBusy(true); setError('');
    try {
      await request(path, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
      await load(); setEditor(undefined); setMessage('操作已保存，作业台数据已刷新');
    } catch (reason) { setError(reason instanceof Error ? reason.message : '操作失败'); }
    finally { setBusy(false); }
  };
  const openCreate = (entity: Editor['entity']) => { setError(''); setEditor({ entity, mode: 'create', values: defaultValues(entity) }); };
  const openEdit = (entity: Editor['entity'], id: string, values: Record<string, string|boolean>) => { setError(''); setEditor({ entity, mode: 'edit', id, values: { ...values } }); };
  const updateField = (key: string, value: string|boolean) => setEditor(current => current ? { ...current, values: { ...current.values, [key]: value } } : current);
  const saveEditor = async (event: FormEvent) => {
    event.preventDefault(); if (!editor) return;
    const { entity, mode, id, values } = editor;
    const payload: Record<string, unknown> = entity === 'container' ? {
      ...(mode === 'create' ? { id: values.id } : {}), voyageId: values.voyageId, size: values.size, isoType: values.isoType,
      direction: values.direction, status: values.status, weightT: Number(values.weightT), reefer: Boolean(values.reefer),
      ...(values.reefer ? { temperature: Number(values.temperature) } : {}), ...(values.hazmatClass ? { hazmatClass: values.hazmatClass } : {}),
      customs: values.customs, priority: values.priority, yardSlot: values.yardSlot
    } : entity === 'appointment' ? {
      containerId: values.containerId, truckNo: values.truckNo, driver: values.driver, type: values.type,
      windowStart: new Date(String(values.windowStart)).toISOString(), windowEnd: new Date(String(values.windowEnd)).toISOString(), lane: values.lane
    } : {
      kind: values.kind, containerId: values.containerId, from: values.from, to: values.to, priority: Number(values.priority),
      scheduledAt: new Date(String(values.scheduledAt)).toISOString(), estimatedMinutes: Number(values.estimatedMinutes),
      ...(values.equipmentId ? { equipmentId: values.equipmentId } : {}), ...(mode === 'edit' ? { status: values.status } : {})
    };
    await mutate(entity === 'container' ? `/containers${mode === 'edit' ? `/${id}` : ''}` : entity === 'appointment' ? `/gate/appointments${mode === 'edit' ? `/${id}` : ''}` : `/tasks${mode === 'edit' ? `/${id}` : ''}`, mode === 'create' ? 'POST' : 'PATCH', payload);
  };
  const remove = async (entity: Editor['entity'], id: string) => {
    if (!window.confirm(`确认删除 ${id}？相关数据的联动处理会写入审计记录。`)) return;
    const path = entity === 'container' ? `/containers/${id}` : entity === 'appointment' ? `/gate/appointments/${id}` : `/tasks/${id}`;
    await mutate(path, 'DELETE');
  };
  const updateAppointmentStatus = async (id: string, status: string) => mutate(`/gate/appointments/${id}`, 'PATCH', { status });
  const assign = async (id: string, equipmentId: string) => equipmentId ? mutate(`/tasks/${id}/assign`, 'PATCH', { equipmentId }) : mutate(`/tasks/${id}`, 'PATCH', { equipmentId: '', status: 'queued' });

  // 铁路批次操作：所有封批后的变更都走带原因的审计接口
  const railAction = async (path: string, body?: unknown, okText?: string) => {
    setRailBusy(true); setError('');
    try {
      const result = await request<unknown>(path, { method: 'POST', body: JSON.stringify(body ?? {}) });
      await load();
      setRailPrompt(undefined); setRailInput('');
      const detail = result as { reason?: string };
      setMessage(okText || (typeof detail?.reason === 'string' ? detail.reason : '铁路批次操作完成，数据已刷新'));
    } catch (reason) { setError(reason instanceof Error ? reason.message : '铁路批次操作失败'); }
    finally { setRailBusy(false); }
  };
  const railPatch = async (path: string, body: unknown, okText: string) => {
    setRailBusy(true); setError('');
    try { await request(path, { method: 'PATCH', body: JSON.stringify(body) }); await load(); setRailPrompt(undefined); setRailInput(''); setMessage(okText); }
    catch (reason) { setError(reason instanceof Error ? reason.message : '窗口变更失败'); }
    finally { setRailBusy(false); }
  };
  const submitRailCreate = async () => {
    if (!railCreate || !railCreate.trainNo.trim() || !railCreate.destStation.trim()) { setError('车次和到站不能为空'); return; }
    if (!railCreate.picked.length) { setError('请至少从箱务/预约/任务中勾选一个箱子'); return; }
    setRailBusy(true); setError('');
    try {
      const result = await request<{ batch: RailBatch; rejected: { containerId: string; reason: string }[] }>('/rail/batches', { method: 'POST', body: JSON.stringify({ trainNo: railCreate.trainNo, destStation: railCreate.destStation, windowStart: new Date(railCreate.windowStart).toISOString(), windowEnd: new Date(railCreate.windowEnd).toISOString(), containerIds: railCreate.picked }) });
      await load(); setRailCreate(undefined);
      setMessage(result.rejected.length ? `批次 ${result.batch.id} 已创建，${result.rejected.length} 箱被拒绝：${result.rejected.map(r => r.reason).join('；')}` : `批次 ${result.batch.id} 已创建并加入 ${result.batch.members.length} 箱`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : '创建铁路批次失败'); }
    finally { setRailBusy(false); }
  };
  const submitRailPrompt = () => {
    if (!railPrompt) return;
    const { kind, batchId, containerId, reason } = railPrompt;
    const text = railInput.trim();
    if (kind === 'unseal' && reason) return void railAction(`/rail/batches/${batchId}/unseal`, { reason, note: text || '控制台发起解封' }, `已按「${RAIL_UNSEAL_TEXT[reason]}」解封，箱单可受控调整，修正后请重新封批`);
    if (kind === 'pull') return void railAction(`/rail/batches/${batchId}/pull`, { containerId, reason: text || '控制台撤出' }, `${containerId} 已撤出批次`);
    if (kind === 'intercept') return void railAction(`/rail/batches/${batchId}/intercept`, { containerId, note: text || '海关查验拦截' }, `${containerId} 已查验拦截，批次自动解封`);
    if (kind === 'resolve-pull') return void railAction(`/rail/batches/${batchId}/intercept/resolve`, { containerId, action: 'pull', reason: text || '查验未通过，扣箱' }, `${containerId} 查验后撤出`);
    if (kind === 'cancel') return void railAction(`/rail/batches/${batchId}/cancel`, { reason: text || '控制台取消批次' }, '批次已取消，箱回集结区');
    if (kind === 'scan') return void railAction(`/rail/batches/${batchId}/scan`, { containerId: text.toUpperCase(), source: 'appointment' });
    if (kind === 'arrival') return void railAction(`/rail/batches/${batchId}/arrival`, { containerId: text.toUpperCase() });
    if (kind === 'window') {
      const [start, end] = text.split('|');
      return void railPatch(`/rail/batches/${batchId}/window`, { windowStart: new Date(start).toISOString(), windowEnd: new Date(end).toISOString() }, '铁路窗口已更新');
    }
  };
  const selected = voyages.find(voyage => voyage.id === selectedVoyage);
  const remaining = selected ? selected.movesPlanned - selected.movesDone : 0;
  const maxHeat = useMemo(() => Math.max(...blocks.map(block => block.heat), 1), [blocks]);

  if (!dashboard && error) return <main className="connection-error"><div className="eyebrow">API CONNECTION ERROR</div><h1>无法连接港口作业服务</h1><p>{error}</p><p>请从项目根目录运行 <code>npm run dev</code>，确认前端 5178 和 API 4107 均已启动。</p><button onClick={() => { setError(''); void load().catch(reason => setError(reason instanceof Error ? reason.message : '无法连接服务端')); }}>重新连接</button></main>;
  if (!dashboard) return <div className="loading">正在连接码头实时作业中台…</div>;

  return <main>
    <header><div><div className="eyebrow">PORT OPS / YARD & GATE CONTROL</div><h1>HarborGrid <span>港口集装箱堆场协同与闸口调度</span></h1><p>把船期、箱务、堆场容量、危险品/冷藏约束、闸口预约与场内设备任务放在同一条作业链路上。</p></div><div className="header-right"><span className="live"><i/> TOS LINKED</span><span className="clock">LIVE · {new Date().toLocaleTimeString()}</span></div></header>
    {message && <div className="toast" onClick={() => setMessage('')}>{message} ×</div>}{error && <div className="form-error page-error">{error}<button onClick={() => setError('')}>关闭</button></div>}
    <section className="kpis"><div><small>ACTIVE VESSELS</small><b>{dashboard.activeVoyages}<em> 艘</em></b><span>{dashboard.lateVessels} 艘存在延误风险</span></div><div><small>YARD UTILIZATION</small><b>{pct(dashboard.yardUtilization)}</b><span>可用堆位 / 危险品隔离纳管</span></div><div><small>GATE QUEUE</small><b>{dashboard.gateQueue}<em> 车</em></b><span>预约、已进场与车道排队</span></div><div><small>EXCEPTIONS</small><b>{dashboard.blockedTasks + dashboard.reeferAlerts + dashboard.hazmatHolds}<em> 项</em></b><span>{dashboard.blockedTasks} 作业阻塞 · {dashboard.reeferAlerts} 冷藏告警</span></div></section>
    <nav className="tabs"><button className={tab==='control'?'active':''} onClick={() => setTab('control')}>作业驾驶舱</button><button className={tab==='containers'?'active':''} onClick={() => setTab('containers')}>箱务台账 / CRUD</button><button className={tab==='gate'?'active':''} onClick={() => setTab('gate')}>闸口预约</button><button className={tab==='rail'?'active':''} onClick={() => setTab('rail')}>铁路批次</button><button className={tab==='yard'?'active':''} onClick={() => setTab('yard')}>堆场热区</button><button className={tab==='tasks'?'active':''} onClick={() => setTab('tasks')}>设备任务</button><span>最后同步 {new Date().toLocaleTimeString()}</span></nav>
    {tab === 'control' && <div className="layout"><section className="panel vessel-panel"><div className="panel-head"><div><div className="eyebrow">VESSEL WINDOW / 船期窗口</div><h2>泊位作业进度</h2></div><span className="muted">剩余作业动态计算</span></div>{voyages.map(voyage => <button key={voyage.id} className={`vessel ${selectedVoyage===voyage.id?'selected':''}`} onClick={() => setSelectedVoyage(voyage.id)}><span className={`vessel-dot ${voyage.status}`}/><span className="vessel-main"><b>{voyage.vessel}</b><small>{voyage.id} · {voyage.service} · {voyage.berth}</small><i><em style={{ width: `${Math.min(100, voyage.movesDone / voyage.movesPlanned * 100)}%` }}/></i></span><span className="vessel-move"><b>{voyage.movesDone.toLocaleString()}</b><small>/ {voyage.movesPlanned.toLocaleString()} moves</small></span><strong className={voyage.lateRisk}>{voyage.lateRisk==='high'?'HIGH':voyage.lateRisk==='medium'?'WATCH':'ON TIME'}</strong></button>)}</section><section className="panel focus-panel"><div className="panel-head"><div><div className="eyebrow">SELECTED VOYAGE / {selected?.id}</div><h2>{selected?.vessel}</h2></div><span className={`badge ${selected?.lateRisk}`}>{selected?.status}</span></div><div className="voyage-stats"><div><small>ETA</small><b>{selected&&time(selected.eta)}</b><span>预计靠泊</span></div><div><small>ETD</small><b>{selected&&time(selected.etd)}</b><span>计划离港</span></div><div><small>REMAINING</small><b>{remaining}</b><span>剩余翻箱</span></div></div><div className="berth-map"><div className="water"><span>岸线 / BERTH</span><i className="ship" style={{ left: `${selected?.berth==='B07'?50:24}%` }}>{selected?.vessel}</i><b>B01</b><b>B04</b><b>B07</b><b>B10</b></div></div><div className="callout"><strong>调度策略</strong><span>已把 {dashboard.blockedTasks} 个阻塞任务、{dashboard.gateQueue} 车闸口压力纳入当前窗口；优先保护冷藏与危险品安全约束。</span></div></section><section className="panel wide"><div className="panel-head"><h3>异常与联动信号</h3><span>{conflicts.length} gate conflicts detected</span></div><div className="signal-grid"><div><strong className="critical">{dashboard.blockedTasks}</strong><span>设备/约束阻塞</span><small>最高优先级：海关查验任务</small></div><div><strong className="warning">{conflicts.length}</strong><span>闸口预约冲突</span><small>同车重叠窗口需人工重排</small></div><div><strong className="warning">{dashboard.reeferAlerts}</strong><span>冷藏与温控风险</span><small>查验区电源余量接近阈值</small></div><div><strong className="ok">{equipment.filter(item => item.status==='available').length}</strong><span>可调度设备</span><small>场桥 / 正面吊 / 集卡</small></div></div></section></div>}
    {tab === 'containers' && <section className="panel wide"><div className="panel-head"><div><div className="eyebrow">CONTAINER REGISTER / CRUD</div><h2>箱务台账</h2><span className="muted">新增、查询、编辑、删除；危险品与冷藏箱受堆场约束校验</span></div><button className="primary-action" onClick={() => openCreate('container')}>＋ 新增箱务</button></div><div className="table container-table"><div className="tr th"><span>箱号 / 航次</span><span>尺寸 / 流向</span><span>箱况 / 海关</span><span>堆位</span><span>重量 / 属性</span><span>操作</span></div>{containers.map(container => <div className="tr" key={container.id}><span><b>{container.id}</b><small>{container.voyageId} · {container.lastEvent}</small>{railBatchOf(container.id, railBatches) && <small className="rail-linked">铁路批次 {railBatchOf(container.id, railBatches)!.id} · {railBatchOf(container.id, railBatches)!.trainNo} · {RAIL_STATUS_LABEL[railBatchOf(container.id, railBatches)!.status] ?? railBatchOf(container.id, railBatches)!.status}{railBatchOf(container.id, railBatches)!.unsealed ? ' · 已解封' : ''}</small>}</span><span>{container.size}ft · {container.direction}<small>{container.isoType}</small></span><span><b>{container.status}</b><small>海关：{container.customs}</small></span><span>{container.yardSlot}</span><span>{container.weightT}t<small>{container.reefer?`冷藏 ${container.temperature}°C`:container.hazmatClass?`危险品 ${container.hazmatClass} 类`:'普通箱'}</small></span><span className="row-actions"><button onClick={() => openEdit('container', container.id, { ...container, weightT: String(container.weightT), temperature: String(container.temperature ?? 4), hazmatClass: container.hazmatClass ?? '' })}>编辑</button><button className="danger-action" onClick={() => void remove('container', container.id)}>删除</button></span></div>)}</div></section>}
    {tab === 'gate' && <section className="panel wide"><div className="panel-head"><div><div className="eyebrow">GATE APPOINTMENT / SLOT CONTROL</div><h2>闸口预约与车道状态</h2><span className="muted">支持新增预约、编辑时隙、签到/完成和删除</span></div><button className="primary-action" onClick={() => openCreate('appointment')}>＋ 新增预约</button></div>{conflicts.map(conflict => <div className="conflict" key={`${conflict.appointmentId}-${conflict.reason}`}><strong>{conflict.severity}</strong><b>{conflict.appointmentId}</b><span>{conflict.reason}</span></div>)}<div className="table"><div className="tr th"><span>预约</span><span>箱号 / 车辆</span><span>窗口</span><span>车道</span><span>状态</span><span>操作</span></div>{appointments.map(appointment => <div className="tr" key={appointment.id}><span><b>{appointment.id}</b><small>{appointment.type}</small></span><span><b>{appointment.containerId}</b><small>{appointment.truckNo} · {appointment.driver}</small></span><span>{time(appointment.windowStart)}—{time(appointment.windowEnd)}</span><span>{appointment.lane}</span><span className={`pill ${appointment.status}`}>{appointment.status}</span><span className="row-actions">{appointment.status==='booked'?<button onClick={() => void updateAppointmentStatus(appointment.id, 'checked-in')}>签到</button>:appointment.status==='checked-in'?<button onClick={() => void updateAppointmentStatus(appointment.id, 'completed')}>完成</button>:null}<button onClick={() => openEdit('appointment', appointment.id, { ...appointment, windowStart: toLocalInput(appointment.windowStart), windowEnd: toLocalInput(appointment.windowEnd) })}>编辑</button><button className="danger-action" onClick={() => void remove('appointment', appointment.id)}>删除</button></span></div>)}</div></section>}
    {tab === 'rail' && <section className="panel wide rail-panel">
      <div className="panel-head"><div><div className="eyebrow">RAIL HANDOVER / 铁路交接批次</div><h2>铁路班列批次交接</h2><span className="muted">集结 → 封批 → 发运 → 到站；封批后仅查验 / 箱号不符 / 窗口变更可审计解封</span></div><button className="primary-action" onClick={() => { setError(''); setRailCreate({ trainNo: `X${8600 + railBatches.length + Math.floor(Math.random() * 90)}`, destStation: '', windowStart: toLocalInput(), windowEnd: toLocalInput(new Date(Date.now() + 120 * 60000).toISOString()), picked: [] }); }}>＋ 新建铁路批次</button></div>
      <div className="rail-kpis">
        <div><small>ACTIVE BATCHES</small><b>{railSummary?.active ?? 0}</b><span>在途 {railSummary?.inTransit ?? 0} 批</span></div>
        <div><small>UNSEALED</small><b className={railSummary?.unsealed ? 'critical' : ''}>{railSummary?.unsealed ?? 0}</b><span>解封待处置批次</span></div>
        <div><small>MISSING AT STATION</small><b className={railSummary?.missingAtStation ? 'warning' : ''}>{railSummary?.missingAtStation ?? 0}</b><span>在途未到站箱</span></div>
        <div><small>BLOCKED</small><b className={railSummary?.blockedBatches.length ? 'critical' : ''}>{railSummary?.blockedBatches.length ?? 0}</b><span>存在缺箱/阻塞批次</span></div>
      </div>
      {railSummary && railSummary.blockedBatches.length > 0 && <div className="rail-board"><div className="eyebrow">缺箱与阻塞看板</div>
        {railSummary.blockedBatches.map(item => <div className="rail-block-line" key={item.id}>
          <b>{item.trainNo} · {item.id}</b><span className={`pill ${item.status}`}>{RAIL_STATUS_LABEL[item.status] ?? item.status}</span>
          {item.missingYard.map(m => <span className="block-chip" key={`y-${m.containerId}`}>场内缺 {m.containerId}：{m.blockers[0]}</span>)}
          {item.missingStation.map(m => <span className="block-chip warn" key={`s-${m.containerId}`}>到站缺 {m.containerId}（{RAIL_MEMBER_LABEL[m.state] ?? m.state}）</span>)}
          {item.missingYard.length === 0 && item.missingStation.length === 0 && item.blockers.slice(0, 2).map((reason, i) => <span className="block-chip" key={i}>{reason}</span>)}
        </div>)}
      </div>}
      <div className="rail-batch-list">
        {railBatches.map(batch => <div className={`rail-card ${batch.status} ${batch.activeUnseal ? 'unsealed' : ''}`} key={batch.id}>
          <div className="rail-card-head">
            <div><b>{batch.trainNo}</b><small>{batch.id} · {batch.originStation} → {batch.destStation} · 车道 {batch.lane}</small><small>{time(batch.windowStart)}—{time(batch.windowEnd)}</small></div>
            <div className="rail-card-state"><span className={`pill ${batch.status}`}>{RAIL_STATUS_LABEL[batch.status] ?? batch.status}</span><small>{batch.activeMembers.length} 箱在单 · {batch.readyCount} 箱就绪</small></div>
          </div>
          {batch.activeUnseal && <div className="rail-unseal-banner"><strong>已解封 · {RAIL_UNSEAL_TEXT[batch.activeUnseal.reason]}</strong><span>{batch.activeUnseal.note}（{batch.activeUnseal.actor} · {new Date(batch.activeUnseal.at).toLocaleTimeString()}）— 修正箱单后必须重新封批</span></div>}
          {batch.status === 'cancelled' && batch.cancelReason && <div className="rail-unseal-banner cancel"><span>取消原因：{batch.cancelReason}</span></div>}
          {batch.warnings.map((warning, i) => <div className="rail-warning" key={`w${i}`}>⚠ {warning}</div>)}
          <div className="table rail-table"><div className="tr th"><span>箱号</span><span>状态联动</span><span>海关 / 预约车道</span><span>场内任务</span><span>阻塞 / 说明</span><span>操作</span></div>
            {batch.members.map(member => <div className={`tr ${member.state === 'pulled' ? 'pulled-row' : ''}`} key={member.containerId}>
              <span><b>{member.containerId}</b><small>{member.container?.size}ft · {member.container?.direction} · {member.container?.yardSlot ?? '-'}</small></span>
              <span><span className={`pill rail-member ${member.state}`}>{RAIL_MEMBER_LABEL[member.state] ?? member.state}</span><small>{member.source === 'appointment' ? `来自预约 ${member.refId ?? ''}` : member.source === 'task' ? `来自任务 ${member.refId ?? ''}` : '来自箱务'}</small></span>
              <span>{member.container?.customs ?? '-'}<small>{member.appointment ? `${member.appointment.lane} 车道 · ${member.appointment.status}` : '无铁路预约'}</small></span>
              <span>{member.openTasks.length ? member.openTasks.map(task => <small key={task.id} className={task.status === 'blocked' ? 'blocked-text' : ''}>{task.id} {task.kind}/{task.status}{task.blockingReasons.length ? `：${task.blockingReasons[0]}` : ''}</small>) : <small>无未完成任务</small>}</span>
              <span>{member.state === 'pulled' || member.state === 'arrived' ? <small>{member.note ?? (member.arrivedAt ? `到站于 ${new Date(member.arrivedAt).toLocaleTimeString()}` : '')}</small> : member.blockers.length ? member.blockers.map((reason, i) => <small className="blocked-text" key={i}>{reason}</small>) : <small className="ready-text">满足封批/发运条件</small>}</span>
              <span className="row-actions">
                {member.state === 'intercepted' && <button onClick={() => { if (window.confirm('确认海关已放行并把箱放回箱单？需海关状态为已放行。')) void railAction(`/rail/batches/${batch.id}/intercept/resolve`, { containerId: member.containerId, action: 'release', reason: '查验通过放行' }, `${member.containerId} 已放回箱单，请重新封批`); }}>查验放行</button>}
                {member.state === 'intercepted' && <button className="danger-action" onClick={() => setRailPrompt({ kind: 'resolve-pull', batchId: batch.id, containerId: member.containerId, title: `查验后撤出 ${member.containerId}` })}>查验后撤出</button>}
                {member.state !== 'pulled' && member.state !== 'arrived' && batch.status !== 'cancelled' && (batch.status === 'draft' || batch.activeUnseal) && <button className="danger-action" onClick={() => setRailPrompt({ kind: 'pull', batchId: batch.id, containerId: member.containerId, title: `从批次撤出 ${member.containerId}` })}>撤出</button>}
                {batch.status === 'in-transit' && !batch.activeUnseal && member.state === 'on-rail' && <button onClick={() => setRailPrompt({ kind: 'intercept', batchId: batch.id, containerId: member.containerId, title: `海关查验拦截 ${member.containerId}` })}>查验拦截</button>}
              </span>
            </div>)}
          </div>
          {batch.blockers.length > 0 && (batch.status === 'draft' || batch.activeUnseal) && <div className="rail-blockers"><strong>封批阻塞（{batch.blockers.length}）</strong>{batch.blockers.map((reason, i) => <span key={i}>· {reason}</span>)}</div>}
          {batch.status === 'in-transit' && !batch.activeUnseal && <div className="rail-missing-station"><strong>到站进度 {batch.members.filter(m => m.state === 'arrived').length}/{batch.activeMembers.length}</strong>{batch.missingStation.length ? <span>缺箱：{batch.missingStation.map(m => m.containerId).join('、')}（等待到站扫描）</span> : <span>全部到站</span>}</div>}
          <div className="rail-actions">
            {batch.status === 'draft' && <button className="primary-action" disabled={!batch.canSeal || railBusy} onClick={() => void railAction(`/rail/batches/${batch.id}/seal`, {}, `批次 ${batch.id} 已封批，箱单冻结`)}>封批</button>}
            {batch.activeUnseal && <button className="primary-action" disabled={!batch.canSeal || railBusy} onClick={() => void railAction(`/rail/batches/${batch.id}/seal`, {}, `批次 ${batch.id} 已重新封批`)}>重新封批</button>}
            {batch.status === 'sealed' && !batch.departedAt && <button className="primary-action" disabled={!batch.canDepart || railBusy} onClick={() => void railAction(`/rail/batches/${batch.id}/depart`, {}, `${batch.trainNo} 已从铁路闸口发运`)}>铁路闸口放行 / 发运</button>}
            {batch.status === 'sealed' && !batch.departedAt && batch.canSeal && <small className="muted">已封批待发运：全部箱子需完成铁路车道签到</small>}
            {batch.status === 'in-transit' && !batch.activeUnseal && <button onClick={() => setRailPrompt({ kind: 'arrival', batchId: batch.id, title: `到站扫描确认（${batch.destStation}）` })}>到站扫描确认</button>}
            {(batch.status === 'draft' || batch.activeUnseal) && <button onClick={() => setRailPrompt({ kind: 'scan', batchId: batch.id, title: `集结区扫描加箱 → ${batch.trainNo}` })}>扫描加箱</button>}
            {(batch.status === 'sealed' || batch.status === 'in-transit') && !batch.activeUnseal && <button onClick={() => setRailPrompt({ kind: 'unseal', batchId: batch.id, reason: 'customs-inspection', title: `解封批次 ${batch.trainNo}：海关查验` })}>查验解封</button>}
            {(batch.status === 'sealed' || batch.status === 'in-transit') && !batch.activeUnseal && <button onClick={() => setRailPrompt({ kind: 'unseal', batchId: batch.id, reason: 'id-mismatch', title: `解封批次 ${batch.trainNo}：箱号不符` })}>箱号不符解封</button>}
            {(batch.status === 'sealed' || batch.status === 'in-transit') && !batch.activeUnseal && <button onClick={() => setRailPrompt({ kind: 'unseal', batchId: batch.id, reason: 'rail-window-change', title: `解封批次 ${batch.trainNo}：窗口变更` })}>窗口变更解封</button>}
            {(batch.status === 'draft' || batch.activeUnseal) && <button onClick={() => setRailPrompt({ kind: 'window', batchId: batch.id, title: `修改铁路窗口 ${batch.trainNo}` })}>改窗口</button>}
            {batch.status !== 'arrived' && batch.status !== 'cancelled' && <button className="danger-action" onClick={() => setRailPrompt({ kind: 'cancel', batchId: batch.id, title: `取消批次 ${batch.trainNo}` })}>取消批次</button>}
          </div>
          {batch.unsealHistory.length > 0 && <div className="rail-history"><strong>解封审计链（{batch.unsealHistory.length}）</strong>{batch.unsealHistory.map((record, i) => <small key={i}>· {new Date(record.at).toLocaleString()} {RAIL_UNSEAL_TEXT[record.reason]} / {record.actor}：{record.note}</small>)}</div>}
          <div className="rail-last-event">最近事件：{batch.lastEvent}</div>
        </div>)}
      </div>
    </section>}
    {tab === 'yard' && <section className="panel wide"><div className="panel-head"><div><div className="eyebrow">YARD HEATMAP / STACK DENSITY</div><h2>堆场容量与安全约束</h2></div><span className="muted">实时区块压力</span></div><div className="yard-grid">{blocks.map(block => <div className={`block ${block.pressure}`} key={block.id}><div className="block-top"><b>{block.id}</b><strong>{pct(block.utilization)}</strong></div><span>{block.zone}</span><div className="heat"><i style={{ width: `${block.heat / maxHeat * 100}%` }}/></div><div className="block-stats"><span>空位 {block.freeSlots}</span><span>冷插 {block.usedPlugs}/{block.reeferPlugs}</span><span>{block.hazmatAllowed?'危险品可入':'普通区'}</span></div></div>)}</div><div className="yard-note"><span>堆位推荐会同时考虑容量、热区、危险品隔离、冷藏插座和设备可达性。</span><b>A01 → C03 重排建议可释放 21 个低热度堆位</b></div></section>}
    {tab === 'tasks' && <div className="layout"><section className="panel wide"><div className="panel-head"><div><div className="eyebrow">TASK DISPATCH / EQUIPMENT POOL</div><h2>场内任务优先级与设备指派</h2><span className="muted">支持新增、编辑、删除和设备指派</span></div><button className="primary-action" onClick={() => openCreate('task')}>＋ 新建任务</button></div><div className="table task-table"><div className="tr th"><span>任务</span><span>箱号</span><span>路径</span><span>优先级</span><span>状态</span><span>设备 / 操作</span></div>{tasks.map(task => <div className="tr" key={task.id}><span><b>{task.id}</b><small>{task.kind} · {task.estimatedMinutes}min</small></span><span>{task.containerId}</span><span>{task.from} → {task.to}</span><span className={task.score>95?'critical':''}>{task.score}</span><span><span className={`pill ${task.status}`}>{task.status}</span>{task.blockingReasons.length>0&&<small className="blocked-text">{task.blockingReasons[0]}</small>}</span><span className="task-actions"><select value={task.equipmentId??''} onChange={event => void assign(task.id, event.target.value)}><option value="">未指派</option>{equipment.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button onClick={() => openEdit('task', task.id, { kind: task.kind, containerId: task.containerId, from: task.from, to: task.to, equipmentId: task.equipmentId ?? '', priority: String(task.priority), estimatedMinutes: String(task.estimatedMinutes), scheduledAt: toLocalInput(task.scheduledAt), status: task.status })}>编辑</button><button className="danger-action" onClick={() => void remove('task', task.id)}>删除</button></span></div>)}</div></section><section className="panel"><div className="panel-head"><h3>设备池</h3><span>{equipment.length} assets</span></div>{equipment.map(item => <div className="equipment" key={item.id}><i className={`equip-dot ${item.status}`}/><div><b>{item.name}</b><small>{item.location} · 队列 {item.queue}</small></div><strong>{item.battery}%</strong></div>)}</section></div>}
    <footer>HarborGrid · 内存种子数据 + REST API · 箱务台账、闸口预约、场内任务提供完整增删改查操作</footer>
    {editor && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setEditor(undefined); }}><form className="editor-modal" onSubmit={saveEditor}><div className="modal-head"><div><div className="eyebrow">{editor.mode.toUpperCase()} / {editor.entity.toUpperCase()}</div><h2>{editor.mode==='create'?'创建':'编辑'}{editor.entity==='container'?'箱务记录':editor.entity==='appointment'?'闸口预约':'作业任务'}</h2></div><button type="button" className="icon-button" onClick={() => setEditor(undefined)}>×</button></div>
      {editor.entity === 'container' && <div className="form-grid">
        <label>集装箱号<input required disabled={editor.mode==='edit'} value={String(editor.values.id)} onChange={event => updateField('id', event.target.value.toUpperCase())}/></label>
        <label>关联航次<select value={String(editor.values.voyageId)} onChange={event => updateField('voyageId', event.target.value)}>{voyages.filter(voyage => voyage.status!=='departed').map(voyage => <option key={voyage.id} value={voyage.id}>{voyage.id} · {voyage.vessel}</option>)}</select></label>
        <label>尺寸<select value={String(editor.values.size)} onChange={event => updateField('size', event.target.value)}><option value="20">20 ft</option><option value="40">40 ft</option><option value="45">45 ft</option></select></label>
        <label>ISO 箱型<input required value={String(editor.values.isoType)} onChange={event => updateField('isoType', event.target.value)}/></label>
        <label>作业流向<select value={String(editor.values.direction)} onChange={event => updateField('direction', event.target.value)}><option value="import">进口</option><option value="export">出口</option><option value="transshipment">中转</option></select></label>
        <label>箱状态<select value={String(editor.values.status)} onChange={event => updateField('status', event.target.value)}>{['in-transit','at-gate','in-yard','on-quay','released','hold'].map(value => <option key={value} value={value}>{value}</option>)}</select></label>
        <label>重量 (吨)<input type="number" min="0.1" step="0.1" required value={String(editor.values.weightT)} onChange={event => updateField('weightT', event.target.value)}/></label>
        <label>海关状态<select value={String(editor.values.customs)} onChange={event => updateField('customs', event.target.value)}><option value="released">已放行</option><option value="inspection">查验中</option><option value="hold">扣留</option></select></label>
        <label>优先级<select value={String(editor.values.priority)} onChange={event => updateField('priority', event.target.value)}><option value="normal">普通</option><option value="hot">急箱</option><option value="reefer">冷藏</option><option value="hazmat">危险品</option></select></label>
        <label>堆位<input required placeholder="例如 B07-R03-T2" value={String(editor.values.yardSlot)} onChange={event => updateField('yardSlot', event.target.value.toUpperCase())}/></label>
        <label>危险品类别<input placeholder="非危险品留空" value={String(editor.values.hazmatClass)} onChange={event => updateField('hazmatClass', event.target.value)}/></label>
        <label className="check-label"><input type="checkbox" checked={Boolean(editor.values.reefer)} onChange={event => updateField('reefer', event.target.checked)}/>冷藏箱</label>
        {Boolean(editor.values.reefer) && <label>目标温度 (°C)<input type="number" step="0.1" value={String(editor.values.temperature)} onChange={event => updateField('temperature', event.target.value)}/></label>}
      </div>}
      {editor.entity === 'appointment' && <div className="form-grid">
        <label>集装箱<select required value={String(editor.values.containerId)} onChange={event => updateField('containerId', event.target.value)}><option value="">选择箱号</option>{containers.map(container => <option key={container.id} value={container.id}>{container.id} · {container.status}</option>)}</select></label>
        <label>预约类型<select value={String(editor.values.type)} onChange={event => updateField('type', event.target.value)}><option value="pickup">提箱</option><option value="dropoff">进场</option></select></label>
        <label>车牌号<input required value={String(editor.values.truckNo)} onChange={event => updateField('truckNo', event.target.value)}/></label><label>司机<input required value={String(editor.values.driver)} onChange={event => updateField('driver', event.target.value)}/></label>
        <label>窗口开始<input type="datetime-local" required value={String(editor.values.windowStart)} onChange={event => updateField('windowStart', event.target.value)}/></label><label>窗口结束<input type="datetime-local" required value={String(editor.values.windowEnd)} onChange={event => updateField('windowEnd', event.target.value)}/></label>
        <label>闸口车道<select value={String(editor.values.lane)} onChange={event => updateField('lane', event.target.value)}><option value="north">北闸口</option><option value="south">南闸口</option><option value="rail">铁路闸口</option></select></label>
      </div>}
      {editor.entity === 'task' && <div className="form-grid">
        <label>任务类型<select value={String(editor.values.kind)} onChange={event => updateField('kind', event.target.value)}>{['receive','deliver','rehandle','load','discharge','inspect'].map(value => <option key={value} value={value}>{value}</option>)}</select></label>
        <label>关联箱号<select required value={String(editor.values.containerId)} onChange={event => updateField('containerId', event.target.value)}><option value="">选择箱号</option>{containers.map(container => <option key={container.id} value={container.id}>{container.id}</option>)}</select></label>
        <label>起点<input required value={String(editor.values.from)} onChange={event => updateField('from', event.target.value)}/></label><label>终点<input required value={String(editor.values.to)} onChange={event => updateField('to', event.target.value)}/></label>
        <label>优先级 (1–100)<input type="number" min="1" max="100" required value={String(editor.values.priority)} onChange={event => updateField('priority', event.target.value)}/></label><label>预计时长 (分钟)<input type="number" min="1" required value={String(editor.values.estimatedMinutes)} onChange={event => updateField('estimatedMinutes', event.target.value)}/></label>
        <label>计划时间<input type="datetime-local" required value={String(editor.values.scheduledAt)} onChange={event => updateField('scheduledAt', event.target.value)}/></label><label>指派设备<select value={String(editor.values.equipmentId)} onChange={event => updateField('equipmentId', event.target.value)}><option value="">暂不指派</option>{equipment.map(item => <option key={item.id} value={item.id}>{item.name} · {item.status}</option>)}</select></label>
        {editor.mode==='edit' && <label>任务状态<select value={String(editor.values.status)} onChange={event => updateField('status', event.target.value)}>{['queued','assigned','executing','blocked','done'].map(value => <option key={value} value={value}>{value}</option>)}</select></label>}
      </div>}
      {error && <div className="form-error">{error}</div>}<div className="modal-actions"><button type="button" onClick={() => setEditor(undefined)}>取消</button><button className="primary-action" disabled={busy}>{busy?'保存中…':'保存'}</button></div>
    </form></div>}
    {railCreate && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setRailCreate(undefined); }}>
      <form className="editor-modal" onSubmit={event => { event.preventDefault(); void submitRailCreate(); }}>
        <div className="modal-head"><div><div className="eyebrow">CREATE / RAIL BATCH</div><h2>新建铁路交接批次</h2></div><button type="button" className="icon-button" onClick={() => setRailCreate(undefined)}>×</button></div>
        <div className="form-grid">
          <label>列车车次<input required value={railCreate.trainNo} onChange={event => setRailCreate({ ...railCreate, trainNo: event.target.value })} placeholder="例如 X8611"/></label>
          <label>到站<input required value={railCreate.destStation} onChange={event => setRailCreate({ ...railCreate, destStation: event.target.value })} placeholder="例如 义乌西站"/></label>
          <label>窗口开始<input type="datetime-local" required value={railCreate.windowStart} onChange={event => setRailCreate({ ...railCreate, windowStart: event.target.value })}/></label>
          <label>窗口结束<input type="datetime-local" required value={railCreate.windowEnd} onChange={event => setRailCreate({ ...railCreate, windowEnd: event.target.value })}/></label>
        </div>
        <div className="rail-pick-head"><div className="eyebrow">从箱务 / 铁路预约 / 场内任务选择集结箱</div><small>已选 {railCreate.picked.length} 箱；非出口、已离场、已被其他在途批次接管的箱不可选</small></div>
        <div className="rail-candidate-list">
          {railCandidatesList.map(candidate => {
            const checked = railCreate.picked.includes(candidate.containerId);
            const disabled = Boolean(candidate.inBatchId);
            return <label key={candidate.containerId} className={`rail-candidate ${checked ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}>
              <input type="checkbox" disabled={disabled} checked={checked || disabled} onChange={event => setRailCreate({ ...railCreate, picked: event.target.checked ? [...railCreate.picked, candidate.containerId] : railCreate.picked.filter(id => id !== candidate.containerId) })}/>
              <span><b>{candidate.containerId}</b><small>{candidate.status} · {candidate.direction} · 海关 {candidate.customs} · {candidate.yardSlot}</small></span>
              <span className="candidate-sources">{candidate.appointmentId ? <em className={candidate.appointmentLane === 'rail' ? 'rail-tag' : 'road-tag'}>预约 {candidate.appointmentId} / {candidate.appointmentLane} / {candidate.appointmentStatus}</em> : null}{candidate.taskIds.map(taskId => <em key={taskId} className="task-tag">任务 {taskId}</em>)}{candidate.inBatchId ? <em className="inbatch-tag">已在 {candidate.inBatchId}</em> : null}</span>
              {candidate.blockers.length > 0 && !candidate.inBatchId && <small className="blocked-text">{candidate.blockers[0]}</small>}
            </label>;
          })}
        </div>
        {error && <div className="form-error">{error}</div>}
        <div className="modal-actions"><button type="button" onClick={() => setRailCreate(undefined)}>取消</button><button className="primary-action" disabled={railBusy}>{railBusy ? '创建中…' : '创建批次（按选择箱初始化）'}</button></div>
      </form>
    </div>}
    {railPrompt && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) { setRailPrompt(undefined); setRailInput(''); } }}>
      <form className="editor-modal rail-prompt-modal" onSubmit={event => { event.preventDefault(); void submitRailPrompt(); }}>
        <div className="modal-head"><div><div className="eyebrow">RAIL BATCH ACTION</div><h2>{railPrompt.title}</h2></div><button type="button" className="icon-button" onClick={() => { setRailPrompt(undefined); setRailInput(''); }}>×</button></div>
        {railPrompt.kind === 'unseal' && <div className="rail-prompt-body"><p>封批后的箱单变更必须留痕。解封后批次回到可调整状态，修正完成后需要显式<b>重新封批</b>才能继续发运/到站。</p><label>解封原因说明（写入审计）<textarea rows={3} value={railInput} onChange={event => setRailInput(event.target.value)} placeholder="例如：合肥海关机检图像异常，需开箱人工复查"/></label></div>}
        {railPrompt.kind === 'window' && <div className="rail-prompt-body"><p>窗口变更属于封批后变更，本操作仅在草稿/已解封状态可用；封批状态请先走「窗口变更解封」。</p><label>新窗口开始 / 结束<input type="datetime-local" value={railInput.split('|')[0] ?? toLocalInput()} onChange={event => setRailInput(`${event.target.value}|${railInput.split('|')[1] ?? toLocalInput(new Date(Date.now() + 120 * 60000).toISOString())}`)}/><input type="datetime-local" value={railInput.split('|')[1] ?? toLocalInput(new Date(Date.now() + 120 * 60000).toISOString())} onChange={event => setRailInput(`${railInput.split('|')[0] ?? toLocalInput()}|${event.target.value}`)}/></label></div>}
        {railPrompt.kind === 'scan' && <div className="rail-prompt-body"><p>扫描集结区/铁路闸口箱号。重复扫描会被识别并忽略；已被其他在途批次接管的箱会被拒绝。</p><label>扫描箱号<input autoFocus value={railInput} onChange={event => setRailInput(event.target.value.toUpperCase())} placeholder="例如 CXRU-2201108"/></label></div>}
        {railPrompt.kind === 'arrival' && <div className="rail-prompt-body"><p>到站扫描：部分到站时批次保持在途并列出缺箱；扫描到非本批箱号会提示箱号不符；重复扫描给出已确认时间。</p><label>到站扫描箱号<input autoFocus value={railInput} onChange={event => setRailInput(event.target.value.toUpperCase())} placeholder="例如 CRWU-5002311"/></label></div>}
        {(railPrompt.kind === 'pull' || railPrompt.kind === 'resolve-pull') && <div className="rail-prompt-body"><label>撤出原因（写入审计）<textarea rows={3} value={railInput} onChange={event => setRailInput(event.target.value)} placeholder={railPrompt.kind === 'resolve-pull' ? '例如：查验未通过，海关扣箱待处理' : '例如：箱损改走下一班列'}/></label></div>}
        {railPrompt.kind === 'intercept' && <div className="rail-prompt-body"><p>海关查验拦截会自动按「海关查验拦截」解封批次，该箱暂停到站确认，等待查验放行或撤出。</p><label>查验说明<textarea rows={3} value={railInput} onChange={event => setRailInput(event.target.value)} placeholder="例如：到站前海关布控拦截"/></label></div>}
        {railPrompt.kind === 'cancel' && <div className="rail-prompt-body"><p>封批/在途批次不能直接取消：如批次仍封批，请关闭本弹窗先走对应原因的解封流程。</p><label>取消原因（写入审计）<textarea rows={3} value={railInput} onChange={event => setRailInput(event.target.value)} placeholder="例如：路局通知班列停运，箱回集结区"/></label></div>}
        {error && <div className="form-error">{error}</div>}
        <div className="modal-actions"><button type="button" onClick={() => { setRailPrompt(undefined); setRailInput(''); }}>取消</button><button className="primary-action" disabled={railBusy}>{railBusy ? '提交中…' : '确认提交'}</button></div>
      </form>
    </div>}
  </main>;
}
