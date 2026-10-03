import test, { afterEach } from 'node:test'; import assert from 'node:assert/strict';
import {
  cancelRailBatch, confirmRailArrival, createContainer, createGateAppointment, createRailBatch,
  deleteContainer, deleteGateAppointment, departRailBatch, editGateAppointment, interceptRailContainer,
  listRailBatches, pullRailContainer, railBatchDetail, railCandidates, railControlSummary,
  resolveRailIntercept, scanRailContainer, sealRailBatch, unsealRailBatch,
  updateContainer, updateRailWindow
} from './domain.js';

const future = (minutes: number) => new Date(Date.now() + minutes * 60000).toISOString();
const createdBatchIds = new Set<string>();
const createdAppointmentIds = new Set<string>();
const createdContainerIds = new Set<string>();

function registerBatch<T extends { id: string }>(batch: T) { createdBatchIds.add(batch.id); return batch; }
function seedBatch(containerIds: string[]) {
  const created = createRailBatch({
    trainNo: `X${Date.now().toString().slice(-5)}${Math.floor(Math.random() * 1000)}`, destStation: '测试到站',
    windowStart: future(60), windowEnd: future(120), containerIds
  });
  registerBatch(created.batch);
  return created.batch;
}
function completeRailAppointment(id: string) { editGateAppointment(id, { status: 'completed' }); }

// 测试用例共享同一内存台账：每轮结束后取消测试批次、还原集结箱状态
afterEach(() => {
  for (const id of createdBatchIds) {
    const batch = railBatchDetail(id);
    if (!batch || ['arrived', 'cancelled'].includes(batch.status)) continue;
    try { if (!batch.activeUnseal) unsealRailBatch(id, 'rail-window-change', '测试清理'); } catch { /* 草稿态无需解封 */ }
    try { cancelRailBatch(id, '测试清理'); } catch { /* 已结束 */ }
  }
  createdBatchIds.clear();
  for (const id of createdAppointmentIds) { try { deleteGateAppointment(id); } catch { /* 忽略 */ } }
  createdAppointmentIds.clear();
  const restore: Record<string, { status: 'at-gate' | 'in-yard' | 'hold'; customs: 'released' | 'hold' | 'inspection' }> = {
    'CXRU-2201108': { status: 'at-gate', customs: 'released' },
    'CXRU-2201115': { status: 'in-yard', customs: 'released' },
    'CXRU-2201131': { status: 'hold', customs: 'inspection' }
  };
  for (const [id, patch] of Object.entries(restore)) updateContainer(id, patch);
  try { editGateAppointment('APT-9010', { status: 'checked-in' }); } catch { /* 忽略 */ }
  try { editGateAppointment('APT-9011', { status: 'booked' }); } catch { /* 忽略 */ }
  for (const id of createdContainerIds) { try { deleteContainer(id); } catch { /* 忽略 */ } }
  createdContainerIds.clear();
});

test('rail: seed batches expose missing boxes and blocking reasons on console view', () => {
  // 先在未释放的种子草稿批上校验阻塞联动，再释放集结箱给后续用例
  const draft0 = railBatchDetail('RB-7108');
  assert.ok(draft0, 'RB-7108 草稿批次应存在');
  assert.equal(draft0!.canSeal, false, '存在查验/公路车道/未签到阻塞时不能封批');
  const reasons = draft0!.blockers.join('|');
  assert.ok(reasons.includes('海关查验中'));
  assert.ok(reasons.includes('公路车道'));
  assert.ok(reasons.includes('尚未在铁路闸口签到'));
  assert.ok(draft0!.missingYard.some(item => item.containerId === 'CXRU-2201131'));
  for (const id of ['CXRU-2201108', 'CXRU-2201115', 'CXRU-2201131', 'CXRU-2201147']) {
    assert.equal(pullRailContainer('RB-7108', id, '测试释放集结箱').id, 'RB-7108');
  }
  const summary = railControlSummary();
  assert.ok(summary.active >= 2);
  assert.ok(summary.missingAtStation >= 1);
  const transit = railBatchDetail('RB-7042');
  assert.equal(transit!.missingStation.some(item => item.containerId === 'CRWU-5002311'), true);
  assert.equal(transit!.missingStation.some(item => item.containerId === 'CRWU-5002325'), true);
});

test('rail: batch is created from appointments/tasks/containers with dedupe and rejection', () => {
  const result = createRailBatch({
    trainNo: `X${Math.floor(Math.random() * 1e6)}`, destStation: '南京站',
    windowStart: future(30), windowEnd: future(90),
    appointmentIds: ['APT-9010', 'APT-9010'], taskIds: ['TASK-201'],
    containerIds: ['CXRU-2201115', 'MSCU-4829017']
  });
  registerBatch(result.batch);
  assert.equal(result.batch.members.length, 2, '同一箱的预约/任务来源应去重');
  assert.ok(result.rejected.some(item => item.containerId === 'MSCU-4829017'), '进口箱来源应被拒绝并给出原因');
});

test('rail: duplicate scan is idempotent and reports a clear outcome', () => {
  const batch = seedBatch(['CXRU-2201108']);
  const again = scanRailContainer(batch.id, 'CXRU-2201108');
  assert.equal(again.outcome, 'already-in-batch');
  assert.match(again.reason, /重复扫描/);
});

test('rail: sealed batch rejects arbitrary box changes without audited unseal', () => {
  const batch = seedBatch(['CXRU-2201108']);
  const sealed = sealRailBatch(batch.id);
  assert.equal(sealed.status, 'sealed');
  assert.throws(() => scanRailContainer(batch.id, 'CXRU-2201115'), /箱单冻结/);
  assert.throws(() => pullRailContainer(batch.id, 'CXRU-2201108', '随便撤一下'), /封批后不允许随意撤出/);
  assert.throws(() => unsealRailBatch(batch.id, 'someone-was-careless' as never, 'x'), /解封原因必须是/);
});

test('rail: full seal -> depart -> arrival -> duplicate scan closes the batch', () => {
  const batch = seedBatch(['CXRU-2201108']);
  assert.equal(sealRailBatch(batch.id).status, 'sealed');
  const departed = departRailBatch(batch.id);
  assert.equal(departed.status, 'in-transit');
  assert.throws(() => departRailBatch(batch.id), /已经发运|不能重复发运/);
  const arrival = confirmRailArrival(batch.id, 'CXRU-2201108');
  assert.equal(arrival.outcome, 'arrived');
  assert.equal(arrival.allArrived, true);
  assert.equal(arrival.batchStatus, 'arrived');
  const dup = confirmRailArrival(batch.id, 'CXRU-2201108');
  assert.equal(dup.outcome, 'already-arrived');
  assert.match(dup.reason, /重复扫描/);
});

test('rail: partial arrival keeps batch in-transit, foreign scan is mismatch', () => {
  const batch = seedBatch(['CXRU-2201108', 'CXRU-2201115']);
  completeRailAppointment('APT-9011');
  sealRailBatch(batch.id);
  departRailBatch(batch.id);
  const first = confirmRailArrival(batch.id, 'CXRU-2201108');
  assert.equal(first.allArrived, false);
  assert.equal(first.arrivedCount, 1);
  assert.equal(first.expectedCount, 2);
  assert.equal(first.batchStatus, 'in-transit');
  const detail = railBatchDetail(batch.id)!;
  assert.deepEqual(detail.missingStation.map(m => m.containerId), ['CXRU-2201115']);
  const foreign = confirmRailArrival(batch.id, 'MSCU-4829017');
  assert.equal(foreign.outcome, 'not-a-member');
  assert.match(foreign.reason, /不属于本批|箱号/);
  const second = confirmRailArrival(batch.id, 'CXRU-2201115');
  assert.equal(second.allArrived, true);
  assert.equal(second.batchStatus, 'arrived');
});

test('rail: customs intercept auto-unseals and requires resolution + reseal', () => {
  const batch = seedBatch(['CXRU-2201108']);
  sealRailBatch(batch.id);
  const intercepted = interceptRailContainer(batch.id, 'CXRU-2201108', '海关机检图像异常');
  assert.equal(intercepted.activeUnseal?.reason, 'customs-inspection');
  const member = intercepted.activeMembers.find(m => m.containerId === 'CXRU-2201108')!;
  assert.equal(member.state, 'intercepted');
  assert.throws(() => sealRailBatch(batch.id), /查验拦截|海关查验中/);
  assert.throws(() => resolveRailIntercept(batch.id, 'CXRU-2201108', 'release', '放行'), /海关状态仍为/);
  // 海关系统先行放行，值班员再把箱放回箱单，然后重新封批
  updateContainer('CXRU-2201108', { customs: 'released' });
  const resolved = resolveRailIntercept(batch.id, 'CXRU-2201108', 'release', '机检无误，查验通过');
  assert.equal(resolved.members.find(m => m.containerId === 'CXRU-2201108')!.state, 'at-gate');
  const resealed = sealRailBatch(batch.id);
  assert.equal(resealed.status, 'sealed');
  assert.equal(resealed.activeUnseal, undefined);
  assert.equal(resealed.unsealHistory.length, 1, '解封-重新封批必须保留审计痕迹');
});

test('rail: intercepted container blocks arrival until pulled, then batch completes', () => {
  const batch = seedBatch(['CXRU-2201108', 'CXRU-2201115']);
  completeRailAppointment('APT-9011');
  sealRailBatch(batch.id);
  departRailBatch(batch.id);
  interceptRailContainer(batch.id, 'CXRU-2201115', '到站前海关拦截');
  const blocked = confirmRailArrival(batch.id, 'CXRU-2201115');
  assert.equal(blocked.outcome, 'intercepted');
  resolveRailIntercept(batch.id, 'CXRU-2201115', 'pull', '查验未通过，扣箱');
  const other = confirmRailArrival(batch.id, 'CXRU-2201108');
  assert.equal(other.allArrived, true, '撤出的箱不计入应到站，其余箱到齐即关闭批次');
});

test('rail: rail-window-change unseal auditable, allows box swap and reseal', () => {
  const batch = seedBatch(['CXRU-2201108']);
  sealRailBatch(batch.id);
  assert.throws(() => updateRailWindow(batch.id, { windowStart: future(120), windowEnd: future(180) }), /窗口已冻结/);
  unsealRailBatch(batch.id, 'rail-window-change', '路局通知装车窗口后移 1 小时');
  const updated = updateRailWindow(batch.id, { windowStart: future(120), windowEnd: future(180) });
  assert.equal(updated.activeUnseal?.reason, 'rail-window-change');
  pullRailContainer(batch.id, 'CXRU-2201108', '窗口变更，该箱改走下一班列');
  scanRailContainer(batch.id, 'CXRU-2201115');
  completeRailAppointment('APT-9011');
  const resealed = sealRailBatch(batch.id);
  assert.equal(resealed.status, 'sealed');
  assert.equal(resealed.unsealHistory.at(-1)?.reason, 'rail-window-change');
});

test('rail: cancelling a sealed batch requires unseal first', () => {
  const batch = seedBatch(['CXRU-2201108']);
  sealRailBatch(batch.id);
  assert.throws(() => cancelRailBatch(batch.id, '计划取消'), /请先[\s\S]*解封/);
  unsealRailBatch(batch.id, 'rail-window-change', '班列停运');
  const cancelled = cancelRailBatch(batch.id, '班列停运，箱回集结区');
  assert.equal(cancelled.status, 'cancelled');
  assert.ok(cancelled.members.every(m => m.state === 'pulled'));
});

test('rail: same train cannot own two active batches and cross-batch join is rejected', () => {
  const mkBox = (suffix: string) => {
    const box = createContainer({ id: `RAIL-XBATCH-${suffix}`, voyageId: 'VOY-QF2', size: '40', isoType: '45G1', direction: 'export', status: 'in-yard', weightT: 18, reefer: false, customs: 'released', priority: 'normal', yardSlot: 'C03-R10-T1' });
    createdContainerIds.add(box.id);
    const appointment = createGateAppointment({ containerId: box.id, truckNo: `沪A·RX${suffix}`, driver: '铁路理货员', type: 'pickup', windowStart: future(-10), windowEnd: future(30), lane: 'rail' });
    createdAppointmentIds.add(appointment.id);
    return box.id;
  };
  const boxA = mkBox('A'); const boxB = mkBox('B');
  const batch = registerBatch(createRailBatch({ trainNo: `DUO${Math.floor(Math.random() * 1e6)}`, destStation: '甲站', windowStart: future(10), windowEnd: future(20), containerIds: [boxA] }).batch);
  assert.throws(
    () => createRailBatch({ trainNo: batch.trainNo, destStation: '乙站', windowStart: future(30), windowEnd: future(40), containerIds: [boxB] }),
    /同一车次不能重复建批/
  );
  const other = registerBatch(createRailBatch({ trainNo: `DUP${Math.floor(Math.random() * 1e6)}`, destStation: '丙站', windowStart: future(10), windowEnd: future(20), containerIds: [boxB] }).batch);
  const attempt = scanRailContainer(other.id, boxA);
  assert.equal(attempt.outcome, 'rejected', `预期跨批加入被拒，实际：${attempt.outcome} / ${attempt.reason}`);
  assert.match(attempt.reason, /已被[\s\S]*批次[\s\S]*接管/);
  assert.equal(railCandidates().find(c => c.containerId === boxA)?.inBatchId, batch.id);
});

test('rail: pulled container can be re-added and travels to arrival', () => {
  const box = createContainer({ id: 'RAIL-READD-1', voyageId: 'VOY-QF2', size: '40', isoType: '45G1', direction: 'export', status: 'in-yard', weightT: 18, reefer: false, customs: 'released', priority: 'normal', yardSlot: 'C03-R10-T1' });
  createdContainerIds.add(box.id);
  const appointment = createGateAppointment({ containerId: box.id, truckNo: '沪A·RR1', driver: '铁路理货员', type: 'pickup', windowStart: future(-10), windowEnd: future(30), lane: 'rail' });
  createdAppointmentIds.add(appointment.id);
  editGateAppointment(appointment.id, { status: 'completed' });
  const batch = seedBatch([box.id]);
  pullRailContainer(batch.id, box.id, '集结区临时翻箱');
  const reAdd = scanRailContainer(batch.id, box.id);
  assert.equal(reAdd.outcome, 'reactivated');
  sealRailBatch(batch.id);
  departRailBatch(batch.id);
  const arrival = confirmRailArrival(batch.id, box.id);
  assert.equal(arrival.allArrived, true);
  assert.ok(listRailBatches().length >= 2);
});

test('rail: export box with completed rail appointment seals without blockers', () => {
  const box = createContainer({ id: 'RAIL-TEST-BOX-1', voyageId: 'VOY-QF2', size: '40', isoType: '45G1', direction: 'export', status: 'in-yard', weightT: 18, reefer: false, customs: 'released', priority: 'normal', yardSlot: 'C03-R10-T1' });
  createdContainerIds.add(box.id);
  const appointment = createGateAppointment({ containerId: box.id, truckNo: '沪A·R9999', driver: '铁路理货员', type: 'pickup', windowStart: future(-10), windowEnd: future(30), lane: 'rail' });
  createdAppointmentIds.add(appointment.id);
  editGateAppointment(appointment.id, { status: 'completed' });
  const batch = seedBatch([box.id]);
  const sealed = sealRailBatch(batch.id);
  assert.equal(sealed.status, 'sealed');
  assert.equal(sealed.blockers.length, 0);
});
