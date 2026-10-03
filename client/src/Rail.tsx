import { useEffect, useState } from 'react';

type Container = { id: string; direction: string; status: string; customs: string; yardSlot: string; lastEvent: string };
type Blocker = { level: 'critical' | 'warning'; code: string; scope: 'batch' | 'member'; containerId?: string; message: string };
type MemberView = { member: { containerId: string; source: 'manual' | 'appointment' | 'task'; sourceRef?: string; state: string; lastEvent: string }; container?: Container; expectedState: string; blockers: Blocker[] };
type Missing = { containerId: string; state: string; expectedState: string; reason: string };
type Scan = { id: string; containerId: string; checkpoint: 'staging' | 'gate' | 'arrival'; result: 'ok' | 'duplicate' | 'intercepted' | 'not-in-batch' | 'mismatch' | 'blocked'; at: string; detail: string; operator: string };
type Unseal = { id: string; reason: 'customs-inspection' | 'number-mismatch' | 'window-change'; fromStatus: string; requestedBy: string; openedAt: string; closedAt?: string; note: string; resolution?: string };
export type RailBatchView = {
  id: string; trainNo: string; railWindowStart: string; railWindowEnd: string; direction: 'import' | 'export' | 'transshipment';
  originStation: string; destinationStation: string; status: string; sealNo?: string; sealedAt?: string; departedAt?: string; arrivedAt?: string;
  directionLabel: string; statusLabel: string; memberCount: number; activeCount: number; stagedCount: number; gatedCount: number;
  arrivedCount: number; heldCount: number; withdrawnCount: number; memberViews: MemberView[]; missing: Missing[];
  blockers: Blocker[]; readyToSeal: boolean; openUnseal?: Unseal; unseals: Unseal[]; scans: Scan[]; note: string;
};
type RailResult = { ok: boolean; outcome: string; batch: RailBatchView; scan?: Scan };
type Candidate = { container: Container; railAppointment?: { id: string; status: string }; deliverTask?: { id: string; status: string } };

const api = '/api';
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${api}${path}`, { ...init, headers: { ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...init?.headers } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || `请求失败 (${response.status})`);
  return body as T;
}
const dtLocal = (value?: string) => { const d = value ? new Date(value) : new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
const time = (value: string) => new Date(value).toLocaleString([], { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

const statePill: Record<string, string> = { planned: 'queued', staged: 'assigned', gated: 'checked-in', arrived: 'done', withdrawn: 'cancelled', 'inspection-hold': 'blocked', 'number-mismatch': 'exception' };
const stateLabel: Record<string, string> = { planned: '计划中', staged: '已集结', gated: '已过闸', arrived: '已到站', withdrawn: '已撤出', 'inspection-hold': '查验挂起', 'number-mismatch': '箱号不符' };
const scanLabel: Record<string, string> = { ok: '通过', duplicate: '重复扫描', intercepted: '查验拦截', 'not-in-batch': '不在清单', mismatch: '箱号不符', blocked: '已拦截' };
const unsealLabel: Record<string, string> = { 'customs-inspection': '海关查验', 'number-mismatch': '箱号不符', 'window-change': '铁路窗口变更' };
const sourceLabel: Record<string, string> = { manual: '手工', appointment: '铁路预约', task: '场内任务' };

interface Props { batches: RailBatchView[]; onChanged: () => Promise<void>; notify: (message: string, isError?: boolean) => void; }

export default function RailTab({ batches, onChanged, notify }: Props) {
  const [selectedId, setSelectedId] = useState(batches[0]?.id ?? '');
  useEffect(() => { if (!batches.some(b => b.id === selectedId)) setSelectedId(batches[0]?.id ?? ''); }, [batches, selectedId]);
  const batch = batches.find(b => b.id === selectedId) ?? batches[0];
  const [busy, setBusy] = useState(false);
  const [scanId, setScanId] = useState('');
  const [addId, setAddId] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const call = async (path: string, body?: unknown) => {
    setBusy(true);
    try {
      const result = await request<RailResult>(path, { method: 'POST', ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
      notify(`${result.scan ? `[${scanLabel[result.scan.result]}] ` : ''}${result.outcome}`, false);
      await onChanged();
      if (result.batch?.id) setSelectedId(result.batch.id);
      return result;
    } catch (error) { notify(error instanceof Error ? error.message : '操作失败', true); }
    finally { setBusy(false); }
  };
  const promptNote = async (action: (note: string) => Promise<unknown>) => { const note = window.prompt('请填写原因 / 情况说明（将写入审计与解封单）'); if (note === null) return; await action(note); };

  if (!batch) return <section className="panel wide rail-empty"><h2>铁路交接批次</h2><p>暂无批次，先从箱务、铁路预约或场内送箱任务创建一个批次。</p><CreateBatch onChanged={onChanged} notify={notify} onCreated={id => setSelectedId(id)} embedded /></section>;

  const open = batch.openUnseal;
  const preDeparture = batch.status === 'forming' || batch.status === 'sealed' || (batch.status === 'unsealed' && (open?.fromStatus === 'sealed'));
  const inTransit = batch.status === 'in-transit' || batch.status === 'partial-arrived' || (batch.status === 'unsealed' && (open?.fromStatus === 'in-transit' || open?.fromStatus === 'partial-arrived'));
  const scanCheckpoint = batch.status === 'forming' || (batch.status === 'unsealed' && !inTransit) ? 'staging' : batch.status === 'sealed' ? 'gate' : 'arrival';
  const submitScan = () => { if (!scanId.trim()) return; call(`/rail/batches/${batch.id}/scan/${scanCheckpoint}`, { containerId: scanId.trim().toUpperCase() }).then(() => setScanId('')); };

  return <div className="rail-layout">
    <section className="panel rail-list">
      <div className="panel-head"><div><div className="eyebrow">RAIL HANDOVER / 批次列表</div><h2>铁路交接批次</h2></div><button className="primary-action" onClick={() => setShowCreate(v => !v)}>{showCreate ? '收起' : '＋ 新建批次'}</button></div>
      {showCreate && <CreateBatch onChanged={onChanged} notify={notify} onCreated={id => { setSelectedId(id); setShowCreate(false); }} />}
      <div className="batch-cards">
        {batches.map(item => <button key={item.id} className={`batch-card ${item.id === batch.id ? 'selected' : ''} ${item.status}`} onClick={() => setSelectedId(item.id)}>
          <div className="batch-card-top"><b>{item.trainNo}</b><span className={`pill ${item.status}`}>{item.statusLabel}</span></div>
          <small>{item.id} · {item.directionLabel}</small>
          <small>{item.originStation} → {item.destinationStation}</small>
          <div className="batch-progress"><i><em style={{ width: `${item.activeCount ? item.arrivedCount / item.activeCount * 100 : 0}%` }} /></i></div>
          <div className="batch-card-stats"><span>集结 {item.stagedCount}</span><span>过闸 {item.gatedCount}</span><span>到站 {item.arrivedCount}/{item.activeCount}</span>{item.heldCount > 0 && <span className="critical">挂起 {item.heldCount}</span>}</div>
          {(item.status === 'unsealed' || item.missing.length > 0) && <div className="batch-alert-dot">{item.status === 'unsealed' ? `解封中·${unsealLabel[item.openUnseal?.reason ?? ''] ?? ''}` : `缺 ${item.missing.length} 箱`}</div>}
        </button>)}
      </div>
    </section>

    <section className="panel rail-detail">
      <div className="panel-head">
        <div><div className="eyebrow">BATCH {batch.id} / {batch.trainNo}</div><h2>{batch.originStation} → {batch.destinationStation} <span className="muted">{batch.directionLabel}</span></h2></div>
        <div className="rail-head-side"><span className={`pill ${batch.status}`}>{batch.statusLabel}</span>{batch.sealNo && <span className="seal-no">封志 {batch.sealNo}</span>}</div>
      </div>

      <div className="rail-meta">
        <span>铁路窗口：<b>{time(batch.railWindowStart)}–{time(batch.railWindowEnd)}</b></span>
        <span>封批：{batch.sealedAt ? time(batch.sealedAt) : '—'}</span>
        <span>发运：{batch.departedAt ? time(batch.departedAt) : '—'}</span>
        <span>到站：{batch.arrivedAt ? time(batch.arrivedAt) : '—'}</span>
      </div>

      {open && <div className={`rail-unseal-banner ${open.reason}`}>
        <div><strong>解封流程 {open.id} · {unsealLabel[open.reason]}</strong><span>{open.note}</span><small>申请人：{open.requestedBy} · 开启 {time(open.openedAt)} · 解封前阶段 {open.fromStatus}{open.resolution ? ` · 处理：${open.resolution}` : ''}</small></div>
      </div>}

      <div className="rail-alerts">
        {batch.blockers.filter(b => b.level === 'critical').map((b, i) => <div key={`c${i}`} className="rail-alert critical"><b>阻塞</b><span>{b.scope === 'member' ? `${b.containerId}：` : ''}{b.message}</span></div>)}
        {batch.blockers.filter(b => b.level === 'warning').map((b, i) => <div key={`w${i}`} className="rail-alert warning"><b>告警</b><span>{b.scope === 'member' ? `${b.containerId}：` : ''}{b.message}</span></div>)}
      </div>

      {batch.missing.length > 0 && <div className="rail-missing">
        <h3>当前缺箱 / 未达阶段（{batch.missing.length}）</h3>
        <div className="table"><div className="tr th"><span>箱号</span><span>当前</span><span>要求</span><span>阻塞原因</span></div>
          {batch.missing.map(m => <div className="tr missing-row" key={m.containerId}><span><b>{m.containerId}</b></span><span><span className={`pill ${statePill[m.state]}`}>{stateLabel[m.state]}</span></span><span>{stateLabel[m.expectedState]}</span><span className="blocked-text">{m.reason}</span></div>)}
        </div>
      </div>}

      <div className="rail-actions">
        {batch.status === 'forming' && <button className="primary-action" disabled={busy || !batch.readyToSeal} title={batch.readyToSeal ? '' : batch.blockers.filter(b => b.level === 'critical').map(b => b.message).join('；') || '还有缺箱'} onClick={() => void call(`/rail/batches/${batch.id}/seal`)}>封批</button>}
        {batch.status === 'sealed' && <button className="primary-action" disabled={busy || batch.gatedCount !== batch.activeCount} onClick={() => void call(`/rail/batches/${batch.id}/depart`)}>发运 {batch.gatedCount}/{batch.activeCount}</button>}
        {batch.status === 'unsealed' && <button className="primary-action" disabled={busy || batch.blockers.some(b => b.level === 'critical' && b.code !== 'unsealed') || batch.missing.length > 0} title={batch.missing.map(m => `${m.containerId}: ${m.reason}`).join('；') || batch.blockers.filter(b => b.level === 'critical' && b.code !== 'unsealed').map(b => b.message).join('；')} onClick={() => void call(`/rail/batches/${batch.id}/reseal`)}>重新封批{open ? '' : '（解封单已关闭）'}</button>}
        {['sealed', 'in-transit', 'partial-arrived'].includes(batch.status) && <>
          <button disabled={busy} onClick={() => void promptNote(note => call(`/rail/batches/${batch.id}/unseal`, { reason: 'customs-inspection', requestedBy: '海关查验科', note }))}>查验解封</button>
          <button disabled={busy} onClick={() => void promptNote(note => call(`/rail/batches/${batch.id}/unseal`, { reason: 'window-change', requestedBy: '铁路调度', note }))}>窗口变更解封</button>
        </>}
        {(batch.status === 'forming' || batch.status === 'sealed') && <button className="danger-action" disabled={busy} onClick={() => void promptNote(reason => call(`/rail/batches/${batch.id}/cancel`, { reason }))}>取消批次</button>}
        {(batch.status === 'forming' || batch.status === 'unsealed') && <button disabled={busy} onClick={async () => { const s = dtLocal(); const e = dtLocal(new Date(Date.now() + 2 * 3600000).toISOString()); const ws = window.prompt('新窗口开始', s); if (!ws) return; const we = window.prompt('新窗口结束', e); if (!we) return; await promptNote(reason => call(`/rail/batches/${batch.id}/window`, { railWindowStart: new Date(ws).toISOString(), railWindowEnd: new Date(we).toISOString(), reason })); }}>变更窗口</button>}
      </div>

      {(preDeparture || inTransit) && <div className="rail-scan">
        <span className="eyebrow">{scanCheckpoint === 'staging' ? '集结 / 解封处理扫描' : scanCheckpoint === 'gate' ? '铁路闸口扫描' : '到站扫描'}</span>
        <input placeholder="扫描 / 输入箱号" value={scanId} onChange={e => setScanId(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && submitScan()} />
        <button className="primary-action" disabled={busy} onClick={submitScan}>扫描确认</button>
      </div>}

      <div className="table rail-member-table">
        <div className="tr th"><span>箱号 / 来源</span><span>成员状态</span><span>海关</span><span>当前位置</span><span>最近事件 / 操作</span></div>
        {batch.memberViews.map(({ member, container, blockers }) => <div className="tr" key={member.containerId}>
          <span><b>{member.containerId}</b><small>{sourceLabel[member.source]}{member.sourceRef ? ` · ${member.sourceRef}` : ''}</small></span>
          <span><span className={`pill ${statePill[member.state]}`}>{stateLabel[member.state]}</span>{blockers.length > 0 && <small className="blocked-text">{blockers[0].message}</small>}</span>
          <span className={container?.customs !== 'released' ? 'critical' : ''}>{container?.customs ?? '—'}</span>
          <span>{container?.yardSlot ?? '—'}</span>
          <span className="rail-member-actions"><small>{member.lastEvent}</small>
            <span className="row-actions">
              {(batch.status === 'forming' || batch.status === 'unsealed') && member.state !== 'withdrawn' && <button className="danger-action" disabled={busy} onClick={() => void promptNote(reason => call(`/rail/batches/${batch.id}/withdraw`, { containerId: member.containerId, reason }))}>撤出</button>}
              {(batch.status === 'forming' || batch.status === 'unsealed') && member.state !== 'withdrawn' && container?.customs === 'released' && <button disabled={busy} onClick={() => void promptNote(note => call(`/rail/batches/${batch.id}/customs/hold`, { containerId: member.containerId, note }))}>海关布控</button>}
              {member.state === 'inspection-hold' && <button className="primary-action" disabled={busy} onClick={() => void call(`/rail/batches/${batch.id}/customs/release`, { containerId: member.containerId, note: '查验完成放行' })}>查验放行</button>}
              {member.state === 'number-mismatch' && <>
                <button className="primary-action" disabled={busy} onClick={() => void call(`/rail/batches/${batch.id}/mismatch/resolve`, { containerId: member.containerId, resolution: 'confirmed' })}>核对无误</button>
                <button disabled={busy} onClick={() => { const actual = window.prompt('输入实际到站箱号（换箱处理）'); if (actual) void call(`/rail/batches/${batch.id}/mismatch/resolve`, { containerId: member.containerId, resolution: 'swap', actualContainerId: actual }); }}>换箱</button>
              </>}
            </span>
          </span>
        </div>)}
      </div>

      {(batch.status === 'forming' || batch.status === 'unsealed') && <div className="rail-add">
        <span className="eyebrow">加入批次</span>
        <input placeholder="输入箱号，或从候选选择" value={addId} onChange={e => setAddId(e.target.value.toUpperCase())} />
        <AddCandidates key={batch.id + batch.direction} batch={batch} onPick={id => setAddId(id)} />
        <button className="primary-action" disabled={busy || !addId.trim()} onClick={() => void call(`/rail/batches/${batch.id}/containers`, { containerIds: [addId.trim()] }).then(() => setAddId(''))}>加入</button>
      </div>}

      <div className="rail-history">
        <div>
          <h3>最近扫描</h3>
          {batch.scans.slice(0, 6).map(scan => <div key={scan.id} className={`rail-log ${scan.result}`}><span className={`pill ${scan.result === 'ok' ? 'done' : scan.result === 'duplicate' ? 'queued' : 'blocked'}`}>{scanLabel[scan.result]}</span><b>{scan.containerId}</b><small>{scan.checkpoint === 'staging' ? '集结' : scan.checkpoint === 'gate' ? '闸口' : '到站'} · {scan.operator} · {time(scan.at)}</small><small>{scan.detail}</small></div>)}
          {batch.scans.length === 0 && <p className="muted">暂无扫描记录</p>}
        </div>
        <div>
          <h3>解封记录（{batch.unseals.length}）</h3>
          {batch.unseals.map(u => <div key={u.id} className="rail-log unseal-log"><span className={`pill ${u.closedAt ? 'done' : 'blocked'}`}>{u.closedAt ? '已关闭' : '处理中'}</span><b>{unsealLabel[u.reason]} · {u.id}</b><small>{u.note}</small><small>{u.requestedBy} · {time(u.openedAt)}{u.resolution ? ` · ${u.resolution}` : ''}</small></div>)}
          {batch.unseals.length === 0 && <p className="muted">无解封记录，封批后清单完整锁定</p>}
        </div>
      </div>
    </section>
  </div>;
}

function AddCandidates({ batch, onPick }: { batch: RailBatchView; onPick: (id: string) => void }) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  useEffect(() => { void request<Candidate[]>(`/rail/candidates/${batch.direction}`).then(setCandidates).catch(() => setCandidates([])); }, [batch.direction]);
  const inBatch = new Set(batch.memberViews.map(m => m.member.containerId));
  const free = candidates.filter(c => !inBatch.has(c.container.id)).slice(0, 8);
  if (!free.length) return <span className="muted rail-candidates-empty">无其他同流向可加入箱</span>;
  return <div className="rail-candidates">{free.map(({ container, railAppointment, deliverTask }) => <button key={container.id} type="button" onClick={() => onPick(container.id)} title={container.lastEvent}>
    {container.id}{railAppointment ? ` · 预约${railAppointment.id}` : deliverTask ? ` · 任务${deliverTask.id}` : ''}
  </button>)}</div>;
}

function CreateBatch({ onChanged, notify, onCreated, embedded }: { onChanged: () => Promise<void>; notify: Props['notify']; onCreated: (id: string) => void; embedded?: boolean }) {
  const [form, setForm] = useState({ trainNo: '', direction: 'export' as 'import' | 'export' | 'transshipment', originStation: '本场铁路闸口', destinationStation: '', railWindowStart: dtLocal(), railWindowEnd: dtLocal(new Date(Date.now() + 2 * 3600000).toISOString()) });
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  useEffect(() => { setPicked({}); void request<Candidate[]>(`/rail/candidates/${form.direction}`).then(setCandidates).catch(() => setCandidates([])); }, [form.direction]);
  const submit = async () => {
    if (!form.trainNo.trim() || !form.destinationStation.trim()) { notify('车次与目的站必填', true); return; }
    setBusy(true);
    try {
      const result = await request<RailResult>('/rail/batches', { method: 'POST', body: JSON.stringify({
        ...form, railWindowStart: new Date(form.railWindowStart).toISOString(), railWindowEnd: new Date(form.railWindowEnd).toISOString(),
        containerIds: Object.keys(picked).filter(id => picked[id])
      }) });
      notify(`批次 ${result.batch.id} 已创建：${result.batch.memberCount} 箱，集结中`);
      await onChanged(); onCreated(result.batch.id);
    } catch (error) { notify(error instanceof Error ? error.message : '创建失败', true); }
    finally { setBusy(false); }
  };
  return <div className={`rail-create ${embedded ? '' : 'panel wide'}`}>
    <div className="form-grid">
      <label>车次<input value={form.trainNo} onChange={e => setForm({ ...form, trainNo: e.target.value })} placeholder="例如 XH-R88" /></label>
      <label>运输方向<select value={form.direction} onChange={e => setForm({ ...form, direction: e.target.value as typeof form.direction })}><option value="export">出口（铁路集港）</option><option value="import">进口（铁路疏港）</option><option value="transshipment">中转（铁路转运）</option></select></label>
      <label>始发站<input value={form.originStation} onChange={e => setForm({ ...form, originStation: e.target.value })} /></label>
      <label>目的站<input value={form.destinationStation} onChange={e => setForm({ ...form, destinationStation: e.target.value })} placeholder="例如 金华东" /></label>
      <label>窗口开始<input type="datetime-local" value={form.railWindowStart} onChange={e => setForm({ ...form, railWindowStart: e.target.value })} /></label>
      <label>窗口结束<input type="datetime-local" value={form.railWindowEnd} onChange={e => setForm({ ...form, railWindowEnd: e.target.value })} /></label>
    </div>
    <div className="rail-pick">
      <span className="eyebrow">从箱务 / 铁路预约 / 场内任务选箱（{Object.values(picked).filter(Boolean).length} 已选）</span>
      <div className="rail-pick-list">{candidates.slice(0, 12).map(({ container, railAppointment, deliverTask }) => <label key={container.id} className={picked[container.id] ? 'picked' : ''}>
        <input type="checkbox" checked={!!picked[container.id]} onChange={e => setPicked(p => ({ ...p, [container.id]: e.target.checked }))} />
        <span><b>{container.id}</b><small>{container.customs === 'released' ? '海关已放行' : `海关${container.customs}`} · {container.yardSlot}{railAppointment ? ` · 铁路预约 ${railAppointment.id}（${railAppointment.status}）` : ''}{deliverTask ? ` · 送箱任务 ${deliverTask.id}（${deliverTask.status}）` : ''}</small></span>
      </label>)}{candidates.length === 0 && <small className="muted">该方向暂无可加入的箱</small>}</div>
    </div>
    <div className="modal-actions"><button className="primary-action" disabled={busy} onClick={submit}>{busy ? '创建中…' : '创建批次'}</button></div>
  </div>;
}
