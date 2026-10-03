import test from 'node:test'; import assert from 'node:assert/strict'; import { containerPlan, dashboard, gateConflicts, prioritizeTasks } from './domain.js';
test('dashboard aggregates berth, yard, gate and exception signals', () => { const data = dashboard(); assert.equal(data.activeVoyages, 2); assert.ok(data.yardUtilization > 0.7); assert.ok(data.blockedTasks >= 1); });
test('gate conflict engine detects same truck overlap', () => { const conflicts = gateConflicts(); assert.ok(conflicts.some(item => item.appointmentId === 'APT-9001' || item.appointmentId === 'APT-9004')); });
test('yard planner respects reefer and hazmat constraints', () => { const plan = containerPlan('TGHU-9831204'); assert.equal(plan?.recommendedBlock?.hazmatAllowed, true); assert.ok(plan?.reasons.some(reason => reason.includes('危险品'))); });
test('priority queue promotes customs inspection work', () => { const tasks = prioritizeTasks(); assert.equal(tasks[0].containerId, 'TGHU-9831204'); });

test('container create, update and delete form a complete audited CRUD cycle', async () => {
  const { createContainer, updateContainer, deleteContainer, containers } = await import('./domain.js');
  const created = createContainer({ id: 'TEST-CRUD-0001', voyageId: 'VOY-AX7', size: '20', isoType: '22G1', direction: 'import', status: 'in-yard', weightT: 10, reefer: false, customs: 'released', priority: 'normal', yardSlot: 'C03-R11-T1' });
  assert.equal(created.id, 'TEST-CRUD-0001');
  assert.equal(updateContainer(created.id, { weightT: 12 })?.weightT, 12);
  assert.equal(deleteContainer(created.id)?.id, 'TEST-CRUD-0001');
  assert.equal(containers.some(item => item.id === 'TEST-CRUD-0001'), false);
});

test('appointment and task domain operations support create, update and delete', async () => {
  const { createGateAppointment, editGateAppointment, deleteGateAppointment, createYardTask, updateYardTask, deleteYardTask } = await import('./domain.js');
  const appointment = createGateAppointment({ containerId: 'MSCU-4829017', truckNo: 'TEST-CRUD-01', driver: '测试司机', type: 'pickup', windowStart: new Date(Date.now()+3600000).toISOString(), windowEnd: new Date(Date.now()+7200000).toISOString(), lane: 'north' });
  assert.equal(editGateAppointment(appointment.id, { driver: '更新司机' })?.driver, '更新司机');
  assert.equal(deleteGateAppointment(appointment.id)?.id, appointment.id);
  const task = createYardTask({ kind: 'deliver', containerId: 'MSCU-4829017', from: 'A01-R01-T1', to: '南闸口', priority: 40, scheduledAt: new Date().toISOString(), estimatedMinutes: 12 });
  assert.equal(updateYardTask(task.id, { to: '北闸口' })?.to, '北闸口');
  assert.equal(deleteYardTask(task.id)?.id, task.id);
});

import { describe } from 'node:test';
// ── 铁路交接批次全生命周期 ──
describe('rail handover batches', { concurrency: false }, () => {

  test('rail: forming batch reports missing boxes and blocks sealing until cleared', async () => {
  const { railBatchView, sealRailBatch, withdrawRailContainer, editGateAppointment, updateYardTask, railStageScan } = await import('./domain.js');
  const before = railBatchView('RAIL-7042')!;
  assert.equal(before.status, 'forming');
  assert.ok(before.missing.some(item => item.containerId === 'RALU-5011002'), '未集结箱必须出现在缺箱清单');
  assert.ok(before.missing.some(item => item.containerId === 'RALU-5011003' && item.reason.includes('查验')));
  assert.ok(before.blockers.some(item => item.code === 'road-pickup-open'), '公路提箱预约必须作为阻塞项');
  assert.ok(before.blockers.some(item => item.code === 'customs-inspection'));
  assert.equal(before.readyToSeal, false);
  assert.throws(() => sealRailBatch('RAIL-7042'), /封批被拒/);
  // 处理阻塞：撤查验箱、撤公路预约、集结剩余箱
  withdrawRailContainer('RAIL-7042', 'RALU-5011003', '海关查验未完成，改挂下一批次');
  editGateAppointment('APT-9103', { status: 'cancelled' });
  updateYardTask('TASK-202', { status: 'done' });
  railStageScan('RAIL-7042', 'RALU-5011002');
  const cleared = railBatchView('RAIL-7042')!;
  assert.equal(cleared.missing.length, 0, '缺箱清单应清空');
  assert.equal(cleared.blockers.filter(item => item.level === 'critical').length, 0, '严重阻塞应全部解除（窗口临近告警可保留）');
  assert.equal(cleared.readyToSeal, true);
});

  test('rail: duplicate staging scan is idempotent and outside-box scan is rejected', async () => {
  const { railStageScan } = await import('./domain.js');
  const again = railStageScan('RAIL-7042', 'RALU-5011001');
  assert.equal(again.scan?.result, 'duplicate');
  assert.match(again.outcome, /重复扫描/);
  const outside = railStageScan('RAIL-7042', 'FCIU-9920310');
  assert.equal(outside.scan?.result, 'not-in-batch');
  assert.match(outside.outcome, /不在批次/);
});

  test('rail: sealed batch locks containers and only audited unseal allows changes', async () => {
  const { sealRailBatch, addRailContainers, unsealRailBatch, railBatchView, updateContainer, deleteYardTask, withdrawRailContainer, resealRailBatch } = await import('./domain.js');
  const sealed = sealRailBatch('RAIL-7042');
  assert.equal(sealed.batch.status, 'sealed');
  assert.ok(sealed.batch.sealNo);
  assert.throws(() => addRailContainers('RAIL-7042', ['FCIU-9920310']), /不能改箱/);
  assert.throws(() => updateContainer('RALU-5011001', { status: 'released' }), /解封流程/);
  assert.throws(() => deleteYardTask('TASK-201'), /铁路送箱任务不能删除/);
  // 无说明的解封被拒；三种合法原因才放行
  assert.throws(() => unsealRailBatch('RAIL-7042', { reason: 'window-change', note: '' }), /审计/);
  const opened = unsealRailBatch('RAIL-7042', { reason: 'window-change', requestedBy: '铁路调度', note: '上线计划晚点 90 分钟，调整窗口' });
  assert.equal(opened.batch.status, 'unsealed');
  assert.equal(opened.batch.openUnseal?.reason, 'window-change');
  // 解封后可以改箱，且每次解封单只能开一张
  addRailContainers('RAIL-7042', ['FCIU-9920310']);
  assert.throws(() => unsealRailBatch('RAIL-7042', { reason: 'customs-inspection', note: '再次尝试解封' }), /已处于解封流程/);
  assert.ok(railBatchView('RAIL-7042')!.members.some(m => m.containerId === 'FCIU-9920310'));
  // 清理临时箱并重新封批，供后续闸口/发运用例使用
  withdrawRailContainer('RAIL-7042', 'FCIU-9920310', '测试用临时箱撤出');
  const resealed = resealRailBatch('RAIL-7042');
  assert.equal(resealed.batch.status, 'sealed');
});

  test('rail: gate number mismatch opens unseal flow and supports confirm or swap', async () => {
  const { railGateScan, resolveMismatchRailContainer, resealRailBatch } = await import('./domain.js');
  // 第一箱正常过闸；第二箱扫码时扫到清单外的箱号 -> 箱号不符解封
  assert.equal(railGateScan('RAIL-7042', 'RALU-5011001').scan?.result, 'ok');
  const mismatch = railGateScan('RAIL-7042', 'OOLU-7734201');
  assert.equal(mismatch.batch.status, 'unsealed');
  assert.equal(mismatch.batch.openUnseal?.reason, 'number-mismatch');
  assert.equal(mismatch.scan?.result, 'mismatch');
  const member = mismatch.batch.memberViews.find(v => v.member.state === 'number-mismatch');
  assert.ok(member, '被期待的清单箱应标记为箱号不符');
  resolveMismatchRailContainer('RAIL-7042', member!.member.containerId, 'confirmed');
  const resealed = resealRailBatch('RAIL-7042');
  assert.equal(resealed.batch.status, 'sealed');
});

  test('rail: departure, partial arrival and customs interception unseal in-transit batch', async () => {
  const { railGateScan, departRailBatch, railArrivalScan, railBatchView, releaseCustomsRailContainer, resealRailBatch, holdCustomsRailContainer } = await import('./domain.js');
  for (const id of ['RALU-5011001', 'RALU-5011002', 'RALU-5011004']) {
    const gate = railGateScan('RAIL-7042', id);
    assert.ok(['ok', 'duplicate'].includes(gate.scan?.result ?? ''), `${id} 应已过闸（前序用例可能已扫），实际 ${gate.scan?.result}`);
  }
  const dup = railGateScan('RAIL-7042', 'RALU-5011001');
  assert.equal(dup.scan?.result, 'duplicate');
  const departed = departRailBatch('RAIL-7042');
  assert.equal(departed.batch.status, 'in-transit');
  const first = railArrivalScan('RAIL-7042', 'RALU-5011001');
  assert.equal(first.batch.status, 'partial-arrived');
  assert.match(first.outcome, /仍有 2 箱未到站/);
  // 第二箱在途被海关布控（尚未到站）-> 自动解封挂起
  holdCustomsRailContainer('RAIL-7042', 'RALU-5011002', '在途布控开箱查验');
  const view = railBatchView('RAIL-7042')!;
  assert.equal(view.status, 'unsealed');
  assert.equal(view.openUnseal?.reason, 'customs-inspection');
  assert.ok(view.missing.some(m => m.containerId === 'RALU-5011002' && m.reason.includes('查验')));
  // 解封期间其他箱不允许继续到站扫描
  assert.equal(railArrivalScan('RAIL-7042', 'RALU-5011004').scan?.result, 'blocked');
  // 查验放行后解封单自动关闭，重封恢复部分到站；挂起箱先补到站，最后一箱到站 -> 全部到站
  const released = releaseCustomsRailContainer('RAIL-7042', 'RALU-5011002', '查验无误放行');
  assert.match(released.outcome, /解封单 .* 已关闭/);
  const back = resealRailBatch('RAIL-7042');
  assert.equal(back.batch.status, 'partial-arrived');
  const second = railArrivalScan('RAIL-7042', 'RALU-5011002');
  assert.equal(second.batch.status, 'partial-arrived');
  const last = railArrivalScan('RAIL-7042', 'RALU-5011004');
  assert.equal(last.batch.status, 'arrived');
  assert.equal(last.batch.memberCount, last.batch.arrivedCount + last.batch.withdrawnCount);
  // 已到站批次不能重复到站扫描
  assert.equal(railArrivalScan('RAIL-7042', 'RALU-5011004').scan?.result, 'blocked');
});

  test('rail: seed import batch shows partial arrival with customs hold, and cancel rules hold', async () => {
  const { railBatchView, cancelRailBatch, createRailBatch } = await import('./domain.js');
  const view = railBatchView('RAIL-7038')!;
  assert.equal(view.status, 'unsealed');
  assert.equal(view.openUnseal?.reason, 'customs-inspection');
  assert.ok(view.missing.some(m => m.containerId === 'IMTU-6022002' && m.reason.includes('查验')));
  assert.ok(!view.missing.some(m => m.containerId === 'IMTU-6022003'), '查验解封期已过闸的在途箱不算缺箱');
  assert.equal(view.memberViews.find(m => m.member.containerId === 'IMTU-6022003')?.member.state, 'gated');
  assert.throws(() => cancelRailBatch('RAIL-7038', '在途不能取消'), /不能直接取消|解封/);
  // 重复车次建档被拒（XH-7791 的解封批次仍有效）
  assert.throws(() => createRailBatch({ trainNo: 'XH-7791', railWindowStart: new Date(Date.now() + 3600000).toISOString(), railWindowEnd: new Date(Date.now() + 7200000).toISOString(), direction: 'import', originStation: '金华东', destinationStation: '本场' }), /已存在有效批次/);
});

  test('rail: batch creation pulls from rail appointments and tasks, rejects road lane and direction mismatch', async () => {
  const { createRailBatch } = await import('./domain.js');
  assert.throws(() => createRailBatch({ trainNo: 'XH-T1', railWindowStart: new Date(Date.now() + 3600000).toISOString(), railWindowEnd: new Date(Date.now() + 7200000).toISOString(), direction: 'export', originStation: '本场', destinationStation: '外地', fromAppointments: ['APT-9001'] }), /不是铁路车道|不一致/);
  assert.throws(() => createRailBatch({ trainNo: 'XH-T2', railWindowStart: new Date(Date.now() + 3600000).toISOString(), railWindowEnd: new Date(Date.now() + 7200000).toISOString(), direction: 'import', originStation: '外地', destinationStation: '本场', containerIds: ['RALU-5011001'] }), /流向/);
});

  test('rail: cancel releases forming batch roster and cancelled batch cannot gate scan', async () => {
  const { createRailBatch, cancelRailBatch, railGateScan, railBatchList, containers: ctn } = await import('./domain.js');
  // 用一个未被占用的出口箱
  const freeExport = ctn.find(c => c.direction === 'export' && !railBatchList().some(b => b.members.some(m => m.containerId === c.id && m.state !== 'withdrawn')));
  assert.ok(freeExport);
  const batch = createRailBatch({ trainNo: 'XH-T9', railWindowStart: new Date(Date.now() + 3600000).toISOString(), railWindowEnd: new Date(Date.now() + 7200000).toISOString(), direction: 'export', originStation: '本场', destinationStation: '外地', containerIds: [freeExport!.id] });
  assert.throws(() => cancelRailBatch(batch.id, ''), /审计/);
  const cancelled = cancelRailBatch(batch.id, '铁路计划取消');
  assert.equal(cancelled.batch.status, 'cancelled');
  const scan = railGateScan(batch.id, freeExport!.id);
  assert.equal(scan.scan?.result, 'blocked');
});
});
