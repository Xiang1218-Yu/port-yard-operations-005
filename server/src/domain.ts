export type ContainerStatus = 'in-transit' | 'at-gate' | 'in-yard' | 'on-quay' | 'released' | 'hold';
export type EquipmentKind = 'quay-crane' | 'yard-crane' | 'terminal-truck' | 'reach-stacker';
export type TaskStatus = 'queued' | 'assigned' | 'executing' | 'blocked' | 'done';
export type AppointmentStatus = 'booked' | 'checked-in' | 'completed' | 'cancelled' | 'exception';

export interface Voyage { id: string; vessel: string; imo: string; service: string; eta: string; etd: string; status: 'approaching' | 'berthed' | 'loading' | 'departed'; berth: string; movesPlanned: number; movesDone: number; lateRisk: 'low' | 'medium' | 'high'; }
export interface Container { id: string; voyageId: string; size: '20' | '40' | '45'; isoType: string; direction: 'import' | 'export' | 'transshipment'; status: ContainerStatus; weightT: number; reefer: boolean; temperature?: number; hazmatClass?: string; customs: 'released' | 'inspection' | 'hold'; priority: 'normal' | 'hot' | 'reefer' | 'hazmat'; yardSlot: string; appointmentId?: string; lastEvent: string; }
export interface YardBlock { id: string; zone: string; rows: number; tiers: number; capacity: number; occupied: number; reeferPlugs: number; usedPlugs: number; hazmatAllowed: boolean; equipment: EquipmentKind[]; heat: number; }
export interface GateAppointment { id: string; containerId: string; truckNo: string; driver: string; type: 'pickup' | 'dropoff'; windowStart: string; windowEnd: string; lane: 'north' | 'south' | 'rail'; status: AppointmentStatus; sealVerified: boolean; weightVerified: boolean; exception?: string; }
export interface Equipment { id: string; name: string; kind: EquipmentKind; status: 'available' | 'working' | 'maintenance' | 'offline'; location: string; battery: number; queue: number; movesPerHour: number; }
export interface YardTask { id: string; kind: 'receive' | 'deliver' | 'rehandle' | 'load' | 'discharge' | 'inspect'; containerId: string; from: string; to: string; equipmentId?: string; priority: number; status: TaskStatus; scheduledAt: string; blockingReasons: string[]; estimatedMinutes: number; }
export interface AuditEvent { id: string; actor: string; action: string; entity: string; entityId: string; at: string; details: string; }

const start = Date.now(); const iso = (minutes: number) => new Date(start + minutes * 60000).toISOString();
export const voyages: Voyage[] = [
  { id: 'VOY-AX7', vessel: 'MSC Aurora', imo: 'IMO9382014', service: 'AE-3', eta: iso(-90), etd: iso(350), status: 'berthed', berth: 'B07', movesPlanned: 1240, movesDone: 886, lateRisk: 'medium' },
  { id: 'VOY-QF2', vessel: 'Ever Quartz', imo: 'IMO9721103', service: 'TP9', eta: iso(190), etd: iso(890), status: 'approaching', berth: 'B04', movesPlanned: 760, movesDone: 0, lateRisk: 'high' },
  { id: 'VOY-RD8', vessel: 'ONE Redwood', imo: 'IMO9812340', service: 'PNW', eta: iso(-700), etd: iso(-330), status: 'departed', berth: 'B02', movesPlanned: 520, movesDone: 520, lateRisk: 'low' }
];
export const blocks: YardBlock[] = [
  { id: 'A01', zone: 'North Import', rows: 14, tiers: 5, capacity: 280, occupied: 247, reeferPlugs: 18, usedPlugs: 16, hazmatAllowed: false, equipment: ['yard-crane', 'terminal-truck'], heat: 78 },
  { id: 'B07', zone: 'Central Transshipment', rows: 18, tiers: 5, capacity: 360, occupied: 302, reeferPlugs: 24, usedPlugs: 19, hazmatAllowed: true, equipment: ['yard-crane', 'reach-stacker', 'terminal-truck'], heat: 91 },
  { id: 'C03', zone: 'Export Pre-staging', rows: 12, tiers: 4, capacity: 192, occupied: 128, reeferPlugs: 8, usedPlugs: 3, hazmatAllowed: false, equipment: ['yard-crane', 'terminal-truck'], heat: 54 },
  { id: 'D05', zone: 'Inspection & Hold', rows: 8, tiers: 3, capacity: 96, occupied: 72, reeferPlugs: 5, usedPlugs: 4, hazmatAllowed: true, equipment: ['reach-stacker'], heat: 63 }
];
export const containers: Container[] = [
  { id: 'MSCU-4829017', voyageId: 'VOY-AX7', size: '40', isoType: '45G1', direction: 'import', status: 'in-yard', weightT: 22.4, reefer: false, customs: 'released', priority: 'hot', yardSlot: 'A01-R07-T3', lastEvent: '卸船完成 08:42' },
  { id: 'EISU-1288420', voyageId: 'VOY-AX7', size: '40', isoType: '45R1', direction: 'import', status: 'in-yard', weightT: 27.8, reefer: true, temperature: -18, customs: 'released', priority: 'reefer', yardSlot: 'B07-R03-T2', lastEvent: '温度回传正常 08:51' },
  { id: 'TGHU-9831204', voyageId: 'VOY-AX7', size: '20', isoType: '22K2', direction: 'transshipment', status: 'hold', weightT: 19.7, reefer: false, hazmatClass: '3', customs: 'inspection', priority: 'hazmat', yardSlot: 'D05-R02-T1', lastEvent: '海关查验挂起' },
  { id: 'OOLU-7734201', voyageId: 'VOY-AX7', size: '40', isoType: '45G1', direction: 'export', status: 'at-gate', weightT: 24.1, reefer: false, customs: 'released', priority: 'normal', yardSlot: 'C03-R06-T1', appointmentId: 'APT-9001', lastEvent: '南闸口已称重' },
  { id: 'CMAU-6001722', voyageId: 'VOY-QF2', size: '40', isoType: '45G1', direction: 'import', status: 'in-transit', weightT: 23.5, reefer: false, customs: 'released', priority: 'hot', yardSlot: 'B07-R10-T1', lastEvent: '船期 ETA +35min' },
  { id: 'FCIU-9920310', voyageId: 'VOY-QF2', size: '20', isoType: '22G1', direction: 'export', status: 'in-yard', weightT: 12.2, reefer: false, customs: 'released', priority: 'normal', yardSlot: 'C03-R04-T2', lastEvent: '待装船' },
  { id: 'TEMU-1774029', voyageId: 'VOY-AX7', size: '40', isoType: '45R1', direction: 'import', status: 'in-yard', weightT: 26.3, reefer: true, temperature: 4, customs: 'inspection', priority: 'reefer', yardSlot: 'D05-R05-T1', lastEvent: '待海关查验' },
  { id: 'RALU-5011001', voyageId: 'VOY-AX7', size: '40', isoType: '45G1', direction: 'export', status: 'in-yard', weightT: 21.6, reefer: false, customs: 'released', priority: 'normal', yardSlot: 'C03-R08-T1', appointmentId: 'APT-9101', lastEvent: '铁路批次集结完成，等待封批' },
  { id: 'RALU-5011002', voyageId: 'VOY-AX7', size: '40', isoType: '45G1', direction: 'export', status: 'in-yard', weightT: 23.0, reefer: false, customs: 'released', priority: 'normal', yardSlot: 'C03-R08-T2', appointmentId: 'APT-9102', lastEvent: '铁路预约已确认，未到集结区' },
  { id: 'RALU-5011003', voyageId: 'VOY-AX7', size: '20', isoType: '22T1', direction: 'export', status: 'hold', weightT: 18.4, reefer: false, hazmatClass: '3', customs: 'inspection', priority: 'hazmat', yardSlot: 'D05-R06-T1', lastEvent: '海关布控查验，禁止铁路发运' },
  { id: 'RALU-5011004', voyageId: 'VOY-AX7', size: '40', isoType: '45G1', direction: 'export', status: 'in-yard', weightT: 24.8, reefer: false, customs: 'released', priority: 'normal', yardSlot: 'C03-R09-T1', appointmentId: 'APT-9103', lastEvent: '场内集结完成，但仍挂着公路提箱预约' },
  { id: 'IMTU-6022001', voyageId: 'VOY-RD8', size: '40', isoType: '45G1', direction: 'import', status: 'released', weightT: 22.1, reefer: false, customs: 'released', priority: 'normal', yardSlot: '到站已提离', appointmentId: 'APT-9201', lastEvent: '到站确认，收货人提离' },
  { id: 'IMTU-6022002', voyageId: 'VOY-RD8', size: '40', isoType: '45R1', direction: 'import', status: 'in-transit', weightT: 27.1, reefer: true, temperature: -18, customs: 'inspection', priority: 'reefer', yardSlot: '铁路在途 X7791', appointmentId: 'APT-9202', lastEvent: '在途海关查验拦截，批次已解封' },
  { id: 'IMTU-6022003', voyageId: 'VOY-RD8', size: '20', isoType: '22G1', direction: 'import', status: 'in-transit', weightT: 13.9, reefer: false, customs: 'released', priority: 'normal', yardSlot: '铁路在途 X7791', appointmentId: 'APT-9203', lastEvent: '随铁路批次 X7791 在途' }
];
export const appointments: GateAppointment[] = [
  { id: 'APT-9001', containerId: 'OOLU-7734201', truckNo: '沪A·7K229', driver: '陈海', type: 'dropoff', windowStart: iso(-14), windowEnd: iso(16), lane: 'south', status: 'checked-in', sealVerified: true, weightVerified: true },
  { id: 'APT-9002', containerId: 'MSCU-4829017', truckNo: '苏E·66218', driver: '王建国', type: 'pickup', windowStart: iso(34), windowEnd: iso(64), lane: 'north', status: 'booked', sealVerified: false, weightVerified: false },
  { id: 'APT-9003', containerId: 'EISU-1288420', truckNo: '沪B·02891', driver: '赵晨', type: 'pickup', windowStart: iso(38), windowEnd: iso(68), lane: 'north', status: 'booked', sealVerified: false, weightVerified: false },
  { id: 'APT-9004', containerId: 'FCIU-9920310', truckNo: '沪A·7K229', driver: '陈海', type: 'pickup', windowStart: iso(4), windowEnd: iso(22), lane: 'south', status: 'booked', sealVerified: false, weightVerified: false, exception: '同一车辆相邻窗口过短' },
  { id: 'APT-9101', containerId: 'RALU-5011001', truckNo: 'XH-R77', driver: '铁路集结', type: 'dropoff', windowStart: iso(-40), windowEnd: iso(60), lane: 'rail', status: 'checked-in', sealVerified: true, weightVerified: true },
  { id: 'APT-9102', containerId: 'RALU-5011002', truckNo: 'XH-R77', driver: '铁路集结', type: 'dropoff', windowStart: iso(-30), windowEnd: iso(70), lane: 'rail', status: 'booked', sealVerified: false, weightVerified: false },
  { id: 'APT-9103', containerId: 'RALU-5011004', truckNo: '沪B·77102', driver: '公路车队误约', type: 'pickup', windowStart: iso(50), windowEnd: iso(80), lane: 'north', status: 'booked', sealVerified: false, weightVerified: false, exception: '该箱已由铁路批次接管，公路提箱预约需撤销' },
  { id: 'APT-9201', containerId: 'IMTU-6022001', truckNo: 'XH-7791', driver: '铁路到达', type: 'pickup', windowStart: iso(-600), windowEnd: iso(-540), lane: 'rail', status: 'completed', sealVerified: true, weightVerified: true },
  { id: 'APT-9202', containerId: 'IMTU-6022002', truckNo: 'XH-7791', driver: '铁路到达', type: 'pickup', windowStart: iso(-560), windowEnd: iso(-500), lane: 'rail', status: 'checked-in', sealVerified: true, weightVerified: true },
  { id: 'APT-9203', containerId: 'IMTU-6022003', truckNo: 'XH-7791', driver: '铁路到达', type: 'pickup', windowStart: iso(-560), windowEnd: iso(-500), lane: 'rail', status: 'checked-in', sealVerified: true, weightVerified: true }
];
export const equipment: Equipment[] = [
  { id: 'QC-07', name: '岸桥 QC-07', kind: 'quay-crane', status: 'working', location: 'B07 / MSC Aurora', battery: 96, queue: 4, movesPerHour: 31 },
  { id: 'YC-12', name: '场桥 YC-12', kind: 'yard-crane', status: 'working', location: 'B07-R03', battery: 72, queue: 9, movesPerHour: 24 },
  { id: 'YC-05', name: '场桥 YC-05', kind: 'yard-crane', status: 'available', location: 'C03-R06', battery: 88, queue: 3, movesPerHour: 27 },
  { id: 'TT-31', name: '集卡 TT-31', kind: 'terminal-truck', status: 'working', location: '南闸口', battery: 61, queue: 2, movesPerHour: 8 },
  { id: 'RS-02', name: '正面吊 RS-02', kind: 'reach-stacker', status: 'maintenance', location: 'D05', battery: 34, queue: 0, movesPerHour: 14 }
];
export const tasks: YardTask[] = [
  { id: 'TASK-101', kind: 'deliver', containerId: 'MSCU-4829017', from: 'A01-R07-T3', to: '南闸口', equipmentId: 'YC-12', priority: 92, status: 'assigned', scheduledAt: iso(12), blockingReasons: [], estimatedMinutes: 18 },
  { id: 'TASK-102', kind: 'rehandle', containerId: 'EISU-1288420', from: 'B07-R03-T2', to: 'D05-R05-T1', equipmentId: 'YC-12', priority: 88, status: 'queued', scheduledAt: iso(24), blockingReasons: ['查验区插件余量接近阈值'], estimatedMinutes: 26 },
  { id: 'TASK-103', kind: 'inspect', containerId: 'TGHU-9831204', from: 'D05-R02-T1', to: 'D05-R02-T1', priority: 125, status: 'blocked', scheduledAt: iso(4), blockingReasons: ['RS-02 维护中', '待海关查验窗口'], estimatedMinutes: 32 },
  { id: 'TASK-104', kind: 'load', containerId: 'FCIU-9920310', from: 'C03-R04-T2', to: 'B07 / VOY-QF2', equipmentId: 'YC-05', priority: 75, status: 'queued', scheduledAt: iso(76), blockingReasons: [], estimatedMinutes: 21 },
  { id: 'TASK-201', kind: 'deliver', containerId: 'RALU-5011001', from: 'C03-R08-T1', to: '铁路闸口 / XH-R77', equipmentId: 'YC-05', priority: 80, status: 'done', scheduledAt: iso(-30), blockingReasons: [], estimatedMinutes: 16 },
  { id: 'TASK-202', kind: 'deliver', containerId: 'RALU-5011002', from: 'C03-R08-T2', to: '铁路闸口 / XH-R77', priority: 80, status: 'queued', scheduledAt: iso(30), blockingReasons: ['未到铁路集结区'], estimatedMinutes: 16 },
  { id: 'TASK-203', kind: 'inspect', containerId: 'RALU-5011003', from: 'D05-R06-T1', to: 'D05-R06-T1', priority: 120, status: 'blocked', scheduledAt: iso(20), blockingReasons: ['海关查验布控中', '查验区正面吊 RS-02 维护'], estimatedMinutes: 40 },
  { id: 'TASK-204', kind: 'deliver', containerId: 'RALU-5011004', from: 'C03-R09-T1', to: '铁路闸口 / XH-R77', equipmentId: 'YC-05', priority: 80, status: 'done', scheduledAt: iso(-20), blockingReasons: [], estimatedMinutes: 16 }
];
export const auditEvents: AuditEvent[] = [{ id: 'AUD-500', actor: '中控调度员', action: 'REPLAN', entity: 'voyage', entityId: 'VOY-AX7', at: new Date(start - 20 * 60000).toISOString(), details: '因 QC-07 瞬时降速，重新计算 14 个高优先级作业' }];

function parseSlot(slot: string) { const match = slot.match(/^([A-Z]\d\d)-/); return match?.[1]; }
export function dashboard() {
  const activeVoyages = voyages.filter(v => v.status !== 'departed');
  const yardCapacity = blocks.reduce((sum, block) => sum + block.capacity, 0); const yardOccupied = blocks.reduce((sum, block) => sum + block.occupied, 0);
  return { activeVoyages: activeVoyages.length, berthMoves: activeVoyages.reduce((sum, v) => sum + v.movesPlanned - v.movesDone, 0), yardUtilization: yardOccupied / yardCapacity, gateQueue: appointments.filter(a => a.status === 'checked-in').length + 7, pendingTasks: tasks.filter(t => t.status !== 'done').length, blockedTasks: tasks.filter(t => t.status === 'blocked').length, reeferAlerts: containers.filter(c => c.reefer && (c.customs === 'inspection' || (c.temperature ?? 0) > 5)).length, hazmatHolds: containers.filter(c => c.hazmatClass && c.customs !== 'released').length, lateVessels: activeVoyages.filter(v => v.lateRisk === 'high').length, railActiveBatches: railBatches.filter(b => isRailActive(b.status)).length, railUnsealedBatches: railBatches.filter(b => b.status === 'unsealed').length, railMissingContainers: railBatches.filter(b => isRailActive(b.status)).reduce((sum, b) => sum + computeView(b).missing.length, 0) };
}
export function gateConflicts() {
  const result: { severity: 'critical' | 'warning'; appointmentId: string; reason: string }[] = [];
  appointments.forEach((a, index) => appointments.slice(index + 1).forEach(b => {
    const overlap = a.truckNo === b.truckNo && new Date(a.windowStart).getTime() < new Date(b.windowEnd).getTime() && new Date(b.windowStart).getTime() < new Date(a.windowEnd).getTime();
    if (overlap) result.push({ severity: 'critical', appointmentId: a.id, reason: `车辆 ${a.truckNo} 与 ${b.id} 时间窗口重叠，需重新分配闸口时隙` });
  }));
  appointments.filter(a => a.status === 'booked').forEach(a => { const container = containers.find(c => c.id === a.containerId); if (container?.customs !== 'released') result.push({ severity: 'warning', appointmentId: a.id, reason: `箱 ${a.containerId} 海关状态为 ${container?.customs}，无法无条件放行` }); });
  railBatches.filter(batch => isRailActive(batch.status)).forEach(batch => {
    batch.members.forEach(member => {
      if (member.state === 'withdrawn') return;
      const roadPickup = appointments.find(a => a.containerId === member.containerId && a.lane !== 'rail' && a.type === 'pickup' && a.status !== 'cancelled');
      if (roadPickup) result.push({ severity: 'critical', appointmentId: roadPickup.id, reason: `箱 ${member.containerId} 已由铁路批次 ${batch.id}（${batch.trainNo}）接管，公路提箱预约必须撤销` });
      if (canRosterEdit(batch.status) && (member.state === 'planned')) {
        const railAppointment = appointments.find(a => a.containerId === member.containerId && a.lane === 'rail' && a.status === 'booked');
        if (railAppointment) result.push({ severity: 'warning', appointmentId: railAppointment.id, reason: `铁路批次 ${batch.id} 等待 ${member.containerId} 集结，铁路预约尚未签到` });
      }
    });
  });
  return result;
}
export function yardHeatmap() { return blocks.map(block => ({ ...block, utilization: block.occupied / block.capacity, freeSlots: block.capacity - block.occupied, pressure: block.heat > 85 ? 'critical' : block.heat > 65 ? 'warning' : 'normal' })); }
export function containerPlan(containerId: string) {
  const container = containers.find(c => c.id === containerId); if (!container) return undefined;
  const reasons: string[] = []; const candidates = blocks.filter(block => block.capacity > block.occupied && (!container.hazmatClass || block.hazmatAllowed) && (!container.reefer || block.reeferPlugs > block.usedPlugs));
  if (container.customs !== 'released' && container.status === 'in-yard') reasons.push('海关未放行，必须保持在查验/监管区');
  const ranked = candidates.map(block => ({ block, score: (block.capacity - block.occupied) * 2 - block.heat - (container.reefer && block.reeferPlugs - block.usedPlugs < 3 ? 18 : 0) - (container.hazmatClass && !block.hazmatAllowed ? 100 : 0) })).sort((a, b) => b.score - a.score);
  if (!ranked.length) reasons.push('没有同时满足危险品、冷藏电源与容量约束的区块');
  const selected = ranked[0]?.block; if (container.reefer && selected) reasons.push(`需要占用 ${selected.reeferPlugs - selected.usedPlugs} 个剩余冷插位中的 1 个`);
  if (container.hazmatClass) reasons.push(`危险品 ${container.hazmatClass} 级，只能进入有隔离资质的区块`);
  return { container, recommendedBlock: selected, alternatives: ranked.slice(1, 3).map(item => item.block), reasons };
}
export function prioritizeTasks() { return tasks.map(task => ({ ...task, score: task.priority + (task.blockingReasons.length ? -20 : 10) + (task.kind === 'inspect' ? 12 : 0) })).sort((a, b) => b.score - a.score); }
export function createAppointment(input: Omit<GateAppointment, 'id' | 'status' | 'sealVerified' | 'weightVerified'>) {
  const container = containers.find(item => item.id === input.containerId); if (!container) throw new Error('箱号不存在');
  if (container.customs !== 'released' && input.type === 'pickup') throw new Error('海关未放行，不能预约提箱');
  const item: GateAppointment = { ...input, id: `APT-${Date.now()}`, status: 'booked', sealVerified: false, weightVerified: false }; appointments.unshift(item); container.appointmentId = item.id; return item;
}
export function updateAppointment(id: string, patch: Partial<Pick<GateAppointment, 'status' | 'sealVerified' | 'weightVerified' | 'exception'>>) { const item = appointments.find(a => a.id === id); if (!item) return undefined; Object.assign(item, patch); const container = containers.find(c => c.id === item.containerId); if (item.status === 'checked-in' && container) container.status = 'at-gate'; if (item.status === 'completed' && container) container.status = item.type === 'pickup' ? 'released' : 'in-yard'; auditEvents.unshift({ id: `AUD-${Date.now()}`, actor: '闸口值班员', action: 'GATE_UPDATE', entity: 'appointment', entityId: id, at: new Date().toISOString(), details: JSON.stringify(patch) }); return item; }
export function assignTask(id: string, equipmentId: string) { const task = tasks.find(item => item.id === id); const machine = equipment.find(item => item.id === equipmentId); if (!task || !machine) return undefined; const blockingReasons = [...task.blockingReasons]; if (machine.status === 'maintenance' || machine.status === 'offline') blockingReasons.push(`${machine.name} 当前不可用`); if (task.kind === 'inspect' && machine.kind !== 'reach-stacker') blockingReasons.push('查验作业需要正面吊或专用设备'); task.equipmentId = equipmentId; task.status = blockingReasons.length ? 'blocked' : 'assigned'; task.blockingReasons = blockingReasons; auditEvents.unshift({ id: `AUD-${Date.now()}`, actor: '中控调度员', action: 'ASSIGN_TASK', entity: 'yard-task', entityId: id, at: new Date().toISOString(), details: `${equipmentId} -> ${task.containerId}` }); return task; }
export function containerDetail(id: string) { const container = containers.find(item => item.id === id); if (!container) return undefined; return { container, voyage: voyages.find(v => v.id === container.voyageId), appointment: appointments.find(a => a.id === container.appointmentId), plan: containerPlan(id), tasks: tasks.filter(t => t.containerId === id) }; }

export type ContainerInput = Omit<Container, 'lastEvent' | 'appointmentId'> & { appointmentId?: string };
export type AppointmentInput = Pick<GateAppointment, 'containerId' | 'truckNo' | 'driver' | 'type' | 'windowStart' | 'windowEnd' | 'lane'>;
export type TaskInput = Pick<YardTask, 'kind' | 'containerId' | 'from' | 'to' | 'priority' | 'scheduledAt' | 'estimatedMinutes'> & { equipmentId?: string };

function recordAudit(action: string, entity: string, entityId: string, details: string) {
  auditEvents.unshift({ id: `AUD-${Date.now()}`, actor: '中控调度员', action, entity, entityId, at: new Date().toISOString(), details });
}

export function createContainer(input: ContainerInput) {
  const id = input.id.trim().toUpperCase();
  if (!id) throw new Error('箱号不能为空');
  if (containers.some(item => item.id === id)) throw new Error(`箱号 ${id} 已存在`);
  if (!voyages.some(item => item.id === input.voyageId)) throw new Error('关联航次不存在');
  const blockId = parseSlot(input.yardSlot);
  if (blockId && !blocks.some(block => block.id === blockId)) throw new Error('堆位所属区块不存在');
  if (input.hazmatClass && blockId && !blocks.find(block => block.id === blockId)?.hazmatAllowed) throw new Error('危险品不能进入当前堆场区块');
  if (input.reefer && blockId) {
    const block = blocks.find(item => item.id === blockId);
    if (block && block.reeferPlugs <= block.usedPlugs) throw new Error('当前区块没有可用冷藏插座');
  }
  const item: Container = { ...input, id, lastEvent: `人工建档 ${new Date().toLocaleString()}` };
  containers.unshift(item);
  recordAudit('CREATE', 'container', item.id, '新增集装箱台账记录');
  return item;
}

export function updateContainer(id: string, patch: Partial<Omit<Container, 'id' | 'lastEvent'>>) {
  const item = containers.find(container => container.id === id);
  if (!item) return undefined;
  const lockedByRail = assertRailContainerEditable(id);
  if (lockedByRail) {
    const railSensitive = ['customs', 'status', 'direction', 'yardSlot'] as const;
    const touchedSensitive = railSensitive.some(key => key in patch && patch[key] !== item[key]);
    if (touchedSensitive) throw new Error(lockedByRail);
  }
  if (patch.voyageId && !voyages.some(voyage => voyage.id === patch.voyageId)) throw new Error('关联航次不存在');
  const next = { ...item, ...patch };
  const blockId = parseSlot(next.yardSlot);
  if (blockId && !blocks.some(block => block.id === blockId)) throw new Error('堆位所属区块不存在');
  if (next.hazmatClass && blockId && !blocks.find(block => block.id === blockId)?.hazmatAllowed) throw new Error('危险品不能进入当前堆场区块');
  Object.assign(item, patch, { lastEvent: `台账更新 ${new Date().toLocaleString()}` });
  recordAudit('UPDATE', 'container', id, '更新集装箱台账字段');
  return item;
}

export function deleteContainer(id: string) {
  const railLock = assertRailContainerEditable(id);
  if (railLock) throw new Error(railLock);
  const index = containers.findIndex(item => item.id === id);
  if (index < 0) return undefined;
  const [item] = containers.splice(index, 1);
  const removedAppointments = appointments.filter(appointment => appointment.containerId === id);
  for (const appointment of removedAppointments) appointments.splice(appointments.indexOf(appointment), 1);
  const removedTasks = tasks.filter(task => task.containerId === id);
  for (const task of removedTasks) tasks.splice(tasks.indexOf(task), 1);
  recordAudit('DELETE', 'container', id, `删除箱务记录，并级联清理 ${removedAppointments.length} 条预约、${removedTasks.length} 条未完成任务`);
  return item;
}

export function createGateAppointment(input: AppointmentInput) {
  const container = containers.find(item => item.id === input.containerId);
  if (!container) throw new Error('箱号不存在');
  if (input.type === 'pickup' && container.customs !== 'released') throw new Error('海关未放行，不能预约提箱');
  if (input.type === 'pickup' && input.lane !== 'rail') {
    const railLock = assertRailContainerEditable(input.containerId);
    if (railLock) throw new Error(`公路提箱预约失败：${railLock}`);
  }
  if (new Date(input.windowEnd) <= new Date(input.windowStart)) throw new Error('预约结束时间必须晚于开始时间');
  const item: GateAppointment = { ...input, id: `APT-${Date.now()}`, status: 'booked', sealVerified: false, weightVerified: false };
  appointments.unshift(item);
  container.appointmentId = item.id;
  recordAudit('CREATE', 'appointment', item.id, `为 ${item.containerId} 创建闸口预约`);
  return item;
}

export function editGateAppointment(id: string, patch: Partial<AppointmentInput & Pick<GateAppointment, 'status' | 'sealVerified' | 'weightVerified' | 'exception'>>) {
  const item = appointments.find(appointment => appointment.id === id);
  if (!item) return undefined;
  if (patch.containerId && !containers.some(container => container.id === patch.containerId)) throw new Error('箱号不存在');
  if (patch.windowStart && patch.windowEnd && new Date(patch.windowEnd) <= new Date(patch.windowStart)) throw new Error('预约结束时间必须晚于开始时间');
  const nextLane = patch.lane ?? item.lane; const nextType = patch.type ?? item.type; const nextStatus = patch.status ?? item.status; const nextContainerId = patch.containerId ?? item.containerId;
  if (nextType === 'pickup' && nextLane !== 'rail' && nextStatus !== 'cancelled') {
    const railLock = assertRailContainerEditable(nextContainerId);
    if (railLock) throw new Error(`公路提箱操作被拒：${railLock}；请先撤销该公路预约`);
  }
  const previousContainer = containers.find(container => container.id === item.containerId);
  Object.assign(item, patch);
  const nextContainer = containers.find(container => container.id === item.containerId);
  if (previousContainer && previousContainer.id !== nextContainer?.id && previousContainer.appointmentId === id) previousContainer.appointmentId = undefined;
  if (nextContainer) nextContainer.appointmentId = id;
  if (item.status === 'checked-in' && nextContainer) nextContainer.status = 'at-gate';
  if (item.status === 'completed' && nextContainer) nextContainer.status = item.type === 'pickup' ? 'released' : 'in-yard';
  recordAudit('UPDATE', 'appointment', id, `更新预约状态/时隙：${JSON.stringify(patch)}`);
  return item;
}

export function deleteGateAppointment(id: string) {
  const index = appointments.findIndex(item => item.id === id);
  if (index < 0) return undefined;
  const [item] = appointments.splice(index, 1);
  const container = containers.find(entry => entry.id === item.containerId);
  if (container?.appointmentId === id) container.appointmentId = undefined;
  recordAudit('DELETE', 'appointment', id, `取消并删除 ${item.containerId} 的闸口预约`);
  return item;
}

export function createYardTask(input: TaskInput) {
  if (!containers.some(container => container.id === input.containerId)) throw new Error('关联箱号不存在');
  if (input.priority < 1 || input.priority > 100) throw new Error('优先级范围为 1–100');
  if (input.estimatedMinutes <= 0) throw new Error('预计作业时长必须大于 0');
  if (input.kind === 'deliver' && input.to.includes('铁路')) {
    const railLock = assertRailContainerEditable(input.containerId);
    if (railLock) throw new Error(`铁路送箱任务被拒：${railLock}`);
  }
  const item: YardTask = { ...input, id: `TASK-${Date.now()}`, status: input.equipmentId ? 'assigned' : 'queued', blockingReasons: [], scheduledAt: input.scheduledAt };
  tasks.unshift(item);
  recordAudit('CREATE', 'yard-task', item.id, `创建 ${input.kind} 任务，关联 ${input.containerId}`);
  return item;
}

export function updateYardTask(id: string, patch: Partial<TaskInput & Pick<YardTask, 'status' | 'blockingReasons'>>) {
  const item = tasks.find(task => task.id === id);
  if (!item) return undefined;
  if (patch.containerId && !containers.some(container => container.id === patch.containerId)) throw new Error('关联箱号不存在');
  if (patch.priority !== undefined && (patch.priority < 1 || patch.priority > 100)) throw new Error('优先级范围为 1–100');
  if (item.kind === 'deliver' && item.to.includes('铁路')) {
    const railLock = assertRailContainerEditable(patch.containerId ?? item.containerId);
    if (railLock) throw new Error(`铁路送箱任务不能随意改动：${railLock}`);
  }
  Object.assign(item, patch);
  recordAudit('UPDATE', 'yard-task', id, `更新场内作业任务：${JSON.stringify(patch)}`);
  return item;
}

export function deleteYardTask(id: string) {
  const item = tasks.find(entry => entry.id === id);
  if (!item) return undefined;
  if (item.kind === 'deliver' && item.to.includes('铁路')) {
    const railLock = assertRailContainerEditable(item.containerId);
    if (railLock) throw new Error(`铁路送箱任务不能删除：${railLock}`);
  }
  tasks.splice(tasks.indexOf(item), 1);
  recordAudit('DELETE', 'yard-task', id, `删除 ${item.containerId} 的场内任务`);
  return item;
}

// ─────────────────────────────────────────────────────────────
// 铁路交接批次 Rail handover batches
// 铁路闸口与公路提箱签到不是同一条链路：箱先在场内集结(staging)，由铁路批次
// 接管后封批(seal)、过铁路闸口发运(depart)、到站确认(arrive)。途中查验、箱号
// 不符或铁路窗口变更必须走可审计的解封(unseal)流程，封批后禁止随意改箱。
// ─────────────────────────────────────────────────────────────

export type RailBatchStatus = 'forming' | 'sealed' | 'in-transit' | 'partial-arrived' | 'arrived' | 'unsealed' | 'cancelled';
export type RailMemberState = 'planned' | 'staged' | 'gated' | 'arrived' | 'withdrawn' | 'inspection-hold' | 'number-mismatch';
export type UnsealReason = 'customs-inspection' | 'number-mismatch' | 'window-change';
export type RailAction = 'add' | 'withdraw' | 'stage-scan' | 'gate-scan' | 'seal' | 'unseal' | 'reseal' | 'depart' | 'arrive-scan' | 'cancel';

export interface RailUnseal { id: string; reason: UnsealReason; fromStatus: 'sealed' | 'in-transit' | 'partial-arrived'; requestedBy: string; openedAt: string; closedAt?: string; note: string; resolution?: string; }
export interface RailScanEvent { id: string; containerId: string; checkpoint: 'staging' | 'gate' | 'arrival'; result: 'ok' | 'duplicate' | 'intercepted' | 'not-in-batch' | 'mismatch' | 'blocked'; at: string; lane?: string; operator: string; detail: string; }
export interface RailBatchMember { containerId: string; source: 'manual' | 'appointment' | 'task'; sourceRef?: string; state: RailMemberState; addedAt: string; updatedAt: string; lastEvent: string; history: { at: string; action: string; detail: string }[]; }
export interface RailBatch { id: string; trainNo: string; railWindowStart: string; railWindowEnd: string; direction: Container['direction']; originStation: string; destinationStation: string; lane: 'rail'; status: RailBatchStatus; sealNo?: string; sealedAt?: string; departedAt?: string; arrivedAt?: string; prevStatus?: Exclude<RailBatchStatus, 'unsealed' | 'cancelled'>; members: RailBatchMember[]; unseals: RailUnseal[]; scans: RailScanEvent[]; createdAt: string; updatedAt: string; note: string; }

const railNow = () => new Date().toISOString();
let railSeq = 0;
const railId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${(railSeq++).toString(36)}`;
const phaseRank: RailBatchStatus[] = ['forming', 'sealed', 'in-transit', 'partial-arrived', 'arrived'];
const memberStateLabel: Record<RailMemberState, string> = { planned: '计划中', staged: '已集结', gated: '已过闸', arrived: '已到站', withdrawn: '已撤出', 'inspection-hold': '查验挂起', 'number-mismatch': '箱号不符' };
const unsealReasonLabel: Record<UnsealReason, string> = { 'customs-inspection': '海关查验', 'number-mismatch': '箱号不符', 'window-change': '铁路窗口变更' };

export const railBatches: RailBatch[] = [
  {
    id: 'RAIL-7042', trainNo: 'XH-R77', railWindowStart: iso(-20), railWindowEnd: iso(120), direction: 'export', originStation: '本场铁路闸口', destinationStation: '金华东', lane: 'rail', status: 'forming',
    members: [
      { containerId: 'RALU-5011001', source: 'appointment', sourceRef: 'APT-9101', state: 'staged', addedAt: iso(-38), updatedAt: iso(-28), lastEvent: '集结区扫描到位', history: [{ at: iso(-38), action: 'add', detail: '从铁路预约 APT-9101 加入' }, { at: iso(-28), action: 'stage-scan', detail: '集结区扫码确认' }] },
      { containerId: 'RALU-5011002', source: 'appointment', sourceRef: 'APT-9102', state: 'planned', addedAt: iso(-34), updatedAt: iso(-34), lastEvent: '等待场内送箱到集结区', history: [{ at: iso(-34), action: 'add', detail: '从铁路预约 APT-9102 加入' }] },
      { containerId: 'RALU-5011003', source: 'manual', state: 'inspection-hold', addedAt: iso(-30), updatedAt: iso(-10), lastEvent: '海关布控查验，禁止铁路发运', history: [{ at: iso(-30), action: 'add', detail: '手工加入批次' }, { at: iso(-10), action: 'inspection-hold', detail: '海关布控查验，撤出集结序列' }] },
      { containerId: 'RALU-5011004', source: 'task', sourceRef: 'TASK-204', state: 'staged', addedAt: iso(-26), updatedAt: iso(-20), lastEvent: '集结区扫描到位；公路提箱预约仍未撤销', history: [{ at: iso(-26), action: 'add', detail: '从场内任务 TASK-204 加入' }, { at: iso(-20), action: 'stage-scan', detail: '集结区扫码确认' }] }
    ],
    unseals: [], scans: [], createdAt: iso(-42), updatedAt: iso(-10), note: '出口集结批次，封批前需解决查验箱与公路预约冲突'
  },
  {
    id: 'RAIL-7038', trainNo: 'XH-7791', railWindowStart: iso(-620), railWindowEnd: iso(-480), direction: 'import', originStation: '金华东', destinationStation: '本场铁路线', lane: 'rail', status: 'unsealed', prevStatus: 'partial-arrived', sealNo: 'SEAL-7791-A', sealedAt: iso(-600), departedAt: iso(-560),
    members: [
      { containerId: 'IMTU-6022001', source: 'appointment', sourceRef: 'APT-9201', state: 'arrived', addedAt: iso(-640), updatedAt: iso(-590), lastEvent: '到站确认', history: [{ at: iso(-640), action: 'add', detail: '从铁路预约 APT-9201 加入' }, { at: iso(-605), action: 'stage-scan', detail: '集结区扫码确认' }, { at: iso(-565), action: 'gate-scan', detail: '铁路闸口放行发运' }, { at: iso(-590), action: 'arrive-scan', detail: '到站扫码确认' }] },
      { containerId: 'IMTU-6022002', source: 'appointment', sourceRef: 'APT-9202', state: 'inspection-hold', addedAt: iso(-640), updatedAt: iso(-520), lastEvent: '到站海关布控查验，批次解封', history: [{ at: iso(-640), action: 'add', detail: '从铁路预约 APT-9202 加入' }, { at: iso(-604), action: 'stage-scan', detail: '集结区扫码确认' }, { at: iso(-562), action: 'gate-scan', detail: '铁路闸口放行发运' }, { at: iso(-520), action: 'inspection-hold', detail: '到站海关查验拦截' }] },
      { containerId: 'IMTU-6022003', source: 'appointment', sourceRef: 'APT-9203', state: 'gated', addedAt: iso(-640), updatedAt: iso(-561), lastEvent: '在途/待到站确认', history: [{ at: iso(-640), action: 'add', detail: '从铁路预约 APT-9203 加入' }, { at: iso(-603), action: 'stage-scan', detail: '集结区扫码确认' }, { at: iso(-561), action: 'gate-scan', detail: '铁路闸口放行发运' }] }
    ],
    unseals: [
      { id: 'UNS-7791-01', reason: 'customs-inspection', fromStatus: 'partial-arrived', requestedBy: '海关查验科', openedAt: iso(-520), note: 'IMTU-6022002 到站布控查验，批次立即解封并停止后续放行', resolution: undefined }
    ],
    scans: [
      { id: 'SCN-7791-01', containerId: 'IMTU-6022001', checkpoint: 'arrival', result: 'ok', at: iso(-590), lane: 'rail', operator: '铁路值班员', detail: '到站确认' },
      { id: 'SCN-7791-02', containerId: 'IMTU-6022002', checkpoint: 'arrival', result: 'intercepted', at: iso(-520), lane: 'rail', operator: '海关查验科', detail: '到站布控查验' }
    ],
    createdAt: iso(-660), updatedAt: iso(-520), note: '进口批次部分到站，因查验处于解封状态'
  }
];

export interface RailBlocker { level: 'critical' | 'warning'; code: string; scope: 'batch' | 'member'; containerId?: string; message: string; }
export interface RailMemberView { member: RailBatchMember; container?: Container; expectedState: RailMemberState; blockers: RailBlocker[]; }
export interface RailMissingEntry { containerId: string; state: RailMemberState; expectedState: RailMemberState; reason: string; }
export interface RailBatchView extends RailBatch { directionLabel: string; statusLabel: string; memberCount: number; activeCount: number; stagedCount: number; gatedCount: number; arrivedCount: number; heldCount: number; withdrawnCount: number; memberViews: RailMemberView[]; missing: RailMissingEntry[]; blockers: RailBlocker[]; readyToSeal: boolean; openUnseal?: RailUnseal; }

export function isRailActive(status: RailBatchStatus) { return status !== 'cancelled' && status !== 'arrived'; }
export function canRosterEdit(status: RailBatchStatus) { return status === 'forming' || status === 'unsealed'; }
export function isBeforeDeparture(status: RailBatchStatus, openUnseal?: RailUnseal) {
  if (status === 'forming' || status === 'sealed') return true;
  if (status === 'unsealed' && openUnseal) return phaseRank.indexOf(openUnseal.fromStatus) < phaseRank.indexOf('in-transit');
  return false;
}

function expectedStateFor(status: RailBatchStatus, openUnseal?: RailUnseal): RailMemberState {
  if (status === 'forming') return 'staged';
  if (status === 'sealed') return 'gated';
  if (status === 'unsealed' && openUnseal) {
    // 窗口变更只是调度调整，不推进实体作业阶段，期望状态保持解封前阶段
    if (openUnseal.reason === 'window-change') return openUnseal.fromStatus === 'sealed' ? 'staged' : 'gated';
    // 箱号不符发生在过闸作业中途，重封只要求回到集结待过闸，后续继续逐箱过闸
    if (openUnseal.reason === 'number-mismatch') return 'staged';
    // 查验解封只挂起涉事箱；在途阶段解封期望保持在「已过闸」，未到站由部分到站状态表达，不阻塞重封
    if (openUnseal.reason === 'customs-inspection' || openUnseal.fromStatus !== 'sealed') return 'gated';
    return 'gated';
  }
  if (status === 'in-transit' || status === 'partial-arrived' || status === 'arrived') return 'arrived';
  return 'staged';
}

function memberBlockers(batch: RailBatch, member: RailBatchMember): RailBlocker[] {
  const blockers: RailBlocker[] = [];
  if (member.state === 'withdrawn') return blockers;
  const container = containers.find(item => item.id === member.containerId);
  if (!container) { blockers.push({ level: 'critical', code: 'container-missing', scope: 'member', containerId: member.containerId, message: `箱 ${member.containerId} 在箱务台账中不存在` }); return blockers; }
  if (container.direction !== batch.direction) blockers.push({ level: 'critical', code: 'direction-mismatch', scope: 'member', containerId: container.id, message: `运输方向 ${container.direction} 与批次 ${batch.direction} 不一致` });
  if (member.state === 'inspection-hold' || container.customs === 'inspection') blockers.push({ level: 'critical', code: 'customs-inspection', scope: 'member', containerId: container.id, message: '海关查验中，禁止随铁路批次发运' });
  else if (container.customs === 'hold') blockers.push({ level: 'critical', code: 'customs-hold', scope: 'member', containerId: container.id, message: '海关扣留状态，需先放行' });
  if (member.state === 'number-mismatch') blockers.push({ level: 'critical', code: 'number-mismatch', scope: 'member', containerId: container.id, message: '扫描箱号与封批清单不符，待核对处理' });
  const memberTasks = tasks.filter(task => task.containerId === container.id);
  if (memberTasks.some(task => task.status === 'blocked')) blockers.push({ level: 'critical', code: 'task-blocked', scope: 'member', containerId: container.id, message: `场内任务阻塞：${memberTasks.find(task => task.status === 'blocked')?.blockingReasons[0] ?? '未知原因'}` });
  else if (memberTasks.some(task => task.kind === 'inspect' && task.status !== 'done')) blockers.push({ level: 'warning', code: 'inspection-open', scope: 'member', containerId: container.id, message: '存在未完成查验任务' });
  const roadAppointment = appointments.find(appointment => appointment.containerId === container.id && appointment.lane !== 'rail' && appointment.type === 'pickup' && appointment.status !== 'cancelled');
  if (roadAppointment) blockers.push({ level: 'critical', code: 'road-pickup-open', scope: 'member', containerId: container.id, message: `公路提箱预约 ${roadAppointment.id}（${roadAppointment.lane} 车道）仍有效，铁路接管后必须撤销` });
  const railAppointment = appointments.find(appointment => appointment.containerId === container.id && appointment.lane === 'rail');
  if (railAppointment && railAppointment.status === 'exception') blockers.push({ level: 'warning', code: 'rail-appointment-exception', scope: 'member', containerId: container.id, message: `铁路预约 ${railAppointment.id} 处于异常状态：${railAppointment.exception ?? '未说明'}` });
  return blockers;
}

function computeView(batch: RailBatch): RailBatchView {
  const openUnseal = batch.unseals.find(item => !item.closedAt);
  const expected = expectedStateFor(batch.status, openUnseal);
  const memberViews: RailMemberView[] = batch.members.map(member => ({ member, container: containers.find(item => item.id === member.containerId), expectedState: expected, blockers: memberBlockers(batch, member) }));
  const missing: RailMissingEntry[] = [];
  const activeViews = memberViews.filter(view => view.member.state !== 'withdrawn');
  // 缺箱 = 落后于当前阶段要求的箱；已经超前/达到后续阶段（如在途时已过闸）不算缺箱
  const stateRank: Record<RailMemberState, number> = { planned: 0, staged: 1, gated: 2, arrived: 3, withdrawn: -1, 'inspection-hold': -1, 'number-mismatch': -1 };
  const expectedRank = stateRank[expected];
  for (const view of activeViews) {
    const state = view.member.state;
    if (state === 'inspection-hold') missing.push({ containerId: view.member.containerId, state, expectedState: expected, reason: '海关查验拦截' });
    else if (state === 'number-mismatch') missing.push({ containerId: view.member.containerId, state, expectedState: expected, reason: '箱号不符待核对' });
    else if (stateRank[state] < expectedRank) missing.push({ containerId: view.member.containerId, state, expectedState: expected, reason: `当前${memberStateLabel[state]}，要求${memberStateLabel[expected]}` });
  }
  const blockers: RailBlocker[] = [];
  for (const view of activeViews) blockers.push(...view.blockers);
  if (!activeViews.length) blockers.push({ level: 'critical', code: 'empty-roster', scope: 'batch', message: '批次没有在册箱，无法封批' });
  const now = Date.now();
  const departed = phaseRank.indexOf(batch.status) >= phaseRank.indexOf('in-transit') || (batch.status === 'unsealed' && openUnseal && phaseRank.indexOf(openUnseal.fromStatus) >= phaseRank.indexOf('in-transit'));
  if (!departed && new Date(batch.railWindowEnd).getTime() < now) blockers.push({ level: 'critical', code: 'window-expired', scope: 'batch', message: '铁路装车上线窗口已过期，需走窗口变更解封/改批' });
  else if (!departed && new Date(batch.railWindowStart).getTime() - now < 15 * 60000) blockers.push({ level: 'warning', code: 'window-soon', scope: 'batch', message: '距铁路窗口开始不足 15 分钟' });
  if (openUnseal) blockers.push({ level: 'critical', code: 'unsealed', scope: 'batch', message: `批次处于解封流程：${unsealReasonLabel[openUnseal.reason]}（${openUnseal.id}），处理后必须重新封批` });
  if (batch.status === 'cancelled') blockers.length = 0;
  const readyToSeal = isRailActive(batch.status) && canRosterEdit(batch.status) && activeViews.length > 0 && !blockers.some(item => item.level === 'critical') && !missing.length;
  return {
    ...batch, directionLabel: batch.direction === 'import' ? '进口（铁路疏港）' : batch.direction === 'export' ? '出口（铁路集港）' : '中转（铁路转运）',
    statusLabel: { forming: '集结中', sealed: '已封批', 'in-transit': '在途', 'partial-arrived': '部分到站', arrived: '全部到站', unsealed: '已解封', cancelled: '已取消' }[batch.status],
    memberCount: batch.members.length, activeCount: activeViews.length,
    stagedCount: activeViews.filter(view => ['staged', 'gated', 'arrived'].includes(view.member.state)).length,
    gatedCount: activeViews.filter(view => ['gated', 'arrived'].includes(view.member.state)).length,
    arrivedCount: activeViews.filter(view => view.member.state === 'arrived').length,
    heldCount: activeViews.filter(view => view.member.state === 'inspection-hold' || view.member.state === 'number-mismatch' || view.container?.customs === 'hold').length,
    withdrawnCount: batch.members.filter(member => member.state === 'withdrawn').length,
    memberViews, missing, blockers, readyToSeal, openUnseal
  };
}

function railAudit(action: string, details: string, actor: string) {
  auditEvents.unshift({ id: railId('AUD'), actor, action: `RAIL_${action.toUpperCase().replace(/-/g, '_')}`, entity: 'rail-batch', entityId: details.slice(0, 0), at: railNow(), details });
}
function recordRailAudit(action: string, batch: RailBatch, details: string, actor: string) {
  auditEvents.unshift({ id: railId('AUD'), actor, action: `RAIL_${action.toUpperCase().replace(/-/g, '_')}`, entity: 'rail-batch', entityId: batch.id, at: railNow(), details });
}
function logMember(member: RailBatchMember, action: string, detail: string) {
  member.history.push({ at: railNow(), action, detail });
  member.lastEvent = detail; member.updatedAt = railNow();
}
function getBatch(id: string): RailBatch { const batch = railBatches.find(item => item.id === id); if (!batch) throw new Error(`铁路批次 ${id} 不存在`); return batch; }
function findActiveMember(containerId: string, excludeBatchId?: string) {
  for (const batch of railBatches) { if (batch.id === excludeBatchId || !isRailActive(batch.status)) continue; const member = batch.members.find(item => item.containerId === containerId && item.state !== 'withdrawn'); if (member) return { batch, member }; }
  return undefined;
}
function pushScan(batch: RailBatch, event: Omit<RailScanEvent, 'id' | 'at'>): RailScanEvent { const scan = { ...event, id: railId('SCN'), at: railNow() }; batch.scans.unshift(scan); return scan; }

function assertCanRoster(batch: RailBatch) { if (!canRosterEdit(batch.status)) throw new Error(`批次「${{ forming: '集结中', sealed: '已封批', 'in-transit': '在途', 'partial-arrived': '部分到站', arrived: '全部到站', unsealed: '已解封', cancelled: '已取消' }[batch.status]}」状态下不能改箱：仅集结中或解封后可调整，其他情况须先走解封流程`); }
function assertMemberUsable(containerId: string, direction: Container['direction'], excludeBatchId?: string) {
  const container = containers.find(item => item.id === containerId);
  if (!container) throw new Error(`箱号 ${containerId} 不存在`);
  if (container.direction !== direction) throw new Error(`箱 ${containerId} 流向为 ${container.direction}，与 ${direction} 批次不一致`);
  const occupied = findActiveMember(containerId, excludeBatchId);
  if (occupied) throw new Error(`箱 ${containerId} 已在有效铁路批次 ${occupied.batch.id}（${occupied.batch.trainNo}）中，不能重复加入`);
  return container;
}

export interface RailActionResult { ok: boolean; outcome: string; batch: RailBatchView; scan?: RailScanEvent; }
function result(batch: RailBatch, outcome: string, scan?: RailScanEvent): RailActionResult { return { ok: true, outcome, batch: railBatchView(batch.id)!, scan }; }

export interface RailBatchInput { trainNo: string; railWindowStart: string; railWindowEnd: string; direction: Container['direction']; originStation: string; destinationStation: string; containerIds?: string[]; fromAppointments?: string[]; fromTasks?: string[]; note?: string; operator?: string; }

export function createRailBatch(input: RailBatchInput): RailBatchView {
  if (!input.trainNo?.trim()) throw new Error('车次号不能为空');
  if (!input.direction) throw new Error('必须指定运输方向');
  if (new Date(input.railWindowEnd) <= new Date(input.railWindowStart)) throw new Error('铁路窗口结束时间必须晚于开始时间');
  if (railBatches.some(batch => batch.trainNo === input.trainNo && isRailActive(batch.status))) throw new Error(`车次 ${input.trainNo} 已存在有效批次，不能重复建档`);
  const members: RailBatchMember[] = []; const problems: string[] = [];
  const collect = (containerId: string, source: RailBatchMember['source'], sourceRef?: string) => {
    try {
      const normalized = containerId.trim().toUpperCase();
      assertMemberUsable(normalized, input.direction);
      if (members.some(item => item.containerId === normalized)) { problems.push(`${normalized}：在创建来源中重复出现`); return; }
      members.push({ containerId: normalized, source, sourceRef, state: 'planned', addedAt: railNow(), updatedAt: railNow(), lastEvent: '已加入集结批次', history: [{ at: railNow(), action: 'add', detail: `批次创建时从${source === 'appointment' ? `铁路预约 ${sourceRef}` : source === 'task' ? `场内任务 ${sourceRef}` : '手工选择'}加入` }] });
    } catch (error) { problems.push(error instanceof Error ? error.message : String(error)); }
  };
  (input.containerIds ?? []).forEach(id => collect(id, 'manual'));
  for (const appointmentId of input.fromAppointments ?? []) {
    const appointment = appointments.find(item => item.id === appointmentId);
    if (!appointment) { problems.push(`预约 ${appointmentId} 不存在`); continue; }
    if (appointment.lane !== 'rail') { problems.push(`预约 ${appointmentId} 不是铁路车道，不能作为铁路批次来源`); continue; }
    collect(appointment.containerId, 'appointment', appointment.id);
  }
  for (const taskId of input.fromTasks ?? []) {
    const task = tasks.find(item => item.id === taskId);
    if (!task) { problems.push(`任务 ${taskId} 不存在`); continue; }
    collect(task.containerId, 'task', task.id);
  }
  if (problems.length) throw new Error(`批次未创建：${problems.join('；')}`);
  const batch: RailBatch = { id: railId('RAIL'), trainNo: input.trainNo.trim(), railWindowStart: input.railWindowStart, railWindowEnd: input.railWindowEnd, direction: input.direction, originStation: input.originStation || (input.direction === 'export' ? '本场铁路闸口' : '外站'), destinationStation: input.destinationStation || (input.direction === 'import' ? '本场铁路线' : '外站'), lane: 'rail', status: 'forming', members, unseals: [], scans: [], createdAt: railNow(), updatedAt: railNow(), note: input.note ?? '' };
  railBatches.unshift(batch);
  recordRailAudit('create', batch, `创建铁路批次 ${batch.id}（${batch.trainNo}，${batch.direction}），初始 ${members.length} 箱`, input.operator ?? '铁路值班员');
  return railBatchView(batch.id)!;
}

export function addRailContainers(batchId: string, containerIds: string[], operator = '铁路值班员'): RailActionResult {
  const batch = getBatch(batchId); assertCanRoster(batch);
  const added: string[] = []; const problems: string[] = [];
  for (const raw of containerIds) {
    const containerId = raw.trim().toUpperCase();
    if (!containerId) continue;
    try {
      assertMemberUsable(containerId, batch.direction, batch.id);
      if (batch.members.some(item => item.containerId === containerId)) throw new Error(`箱 ${containerId} 已在本批次中`);
      const member: RailBatchMember = { containerId, source: 'manual', state: 'planned', addedAt: railNow(), updatedAt: railNow(), lastEvent: '手工加入批次', history: [{ at: railNow(), action: 'add', detail: '手工加入批次' }] };
      batch.members.push(member); added.push(containerId);
    } catch (error) { problems.push(error instanceof Error ? error.message : String(error)); }
  }
  if (!added.length) throw new Error(problems.join('；') || '没有可加入的箱');
  batch.updatedAt = railNow();
  recordRailAudit('add', batch, `加入 ${added.length} 箱：${added.join(', ')}${problems.length ? `；被拒：${problems.join('；')}` : ''}`, operator);
  return result(batch, `已加入 ${added.length} 箱（${added.join('、')}）${problems.length ? `；${problems.length} 箱被拒绝` : ''}`);
}

export function withdrawRailContainer(batchId: string, containerId: string, reason: string, operator = '铁路值班员'): RailActionResult {
  const batch = getBatch(batchId); assertCanRoster(batch);
  const member = batch.members.find(item => item.containerId === containerId.trim().toUpperCase());
  if (!member) throw new Error(`箱 ${containerId} 不在批次 ${batch.id} 中`);
  if (member.state === 'withdrawn') throw new Error(`箱 ${containerId} 已撤出，不能重复撤出`);
  if (!reason?.trim()) throw new Error('撤出必须填写原因（审计要求）');
  const before = memberStateLabel[member.state];
  member.state = 'withdrawn'; logMember(member, 'withdraw', `撤出批次：${reason}（原状态 ${before}）`);
  batch.updatedAt = railNow();
  recordRailAudit('withdraw', batch, `撤出 ${containerId}：${reason}`, operator);
  return result(batch, `箱 ${containerId} 已撤出，封批清单将不再包含该箱`);
}

export function railStageScan(batchId: string, containerId: string, operator = '铁路值班员'): RailActionResult {
  const batch = getBatch(batchId);
  if (!canRosterEdit(batch.status)) {
    const scan = pushScan(batch, { containerId: containerId.trim().toUpperCase(), checkpoint: 'staging', result: 'blocked', operator, lane: 'rail', detail: `批次当前 ${batch.status}，集结扫描通道关闭` });
    return result(batch, `扫描被拒：批次 ${batch.status === 'sealed' ? '已封批' : '不在集结阶段'}，集结扫描通道已关闭`, scan);
  }
  const id = containerId.trim().toUpperCase();
  const member = batch.members.find(item => item.containerId === id);
  if (!member) {
    const scan = pushScan(batch, { containerId: id, checkpoint: 'staging', result: 'not-in-batch', operator, lane: 'rail', detail: '该箱不属于本批次清单' });
    return result(batch, `扫描结果：箱 ${id} 不在批次 ${batch.id} 清单内，已拦截`, scan);
  }
  if (member.state === 'withdrawn') {
    const scan = pushScan(batch, { containerId: id, checkpoint: 'staging', result: 'blocked', operator, lane: 'rail', detail: '该箱已撤出批次' });
    return result(batch, `扫描被拒：箱 ${id} 已撤出本批次`, scan);
  }
  if (member.state === 'staged' || member.state === 'gated' || member.state === 'arrived') {
    const scan = pushScan(batch, { containerId: id, checkpoint: 'staging', result: 'duplicate', operator, lane: 'rail', detail: `重复扫描，当前状态 ${memberStateLabel[member.state]}` });
    return result(batch, `重复扫描：${id} 已处于「${memberStateLabel[member.state]}」，状态不变`, scan);
  }
  if (member.state === 'inspection-hold') {
    const scan = pushScan(batch, { containerId: id, checkpoint: 'staging', result: 'intercepted', operator, lane: 'rail', detail: '海关查验挂起，集结扫描不予确认' });
    return result(batch, `扫描被拦截：${id} 处于海关查验挂起，须先完成查验放行`, scan);
  }
  member.state = 'staged'; logMember(member, 'stage-scan', '集结区扫码确认到位');
  const container = containers.find(item => item.id === id);
  if (container && container.status !== 'at-gate' && container.status !== 'in-yard') container.status = 'in-yard';
  if (container) container.lastEvent = `铁路批次 ${batch.id} 集结到位`;
  const scan = pushScan(batch, { containerId: id, checkpoint: 'staging', result: 'ok', operator, lane: 'rail', detail: '集结区扫码确认到位' });
  batch.updatedAt = railNow();
  recordRailAudit('stage-scan', batch, `集结扫描 ${id} 确认到位`, operator);
  return result(batch, `${id} 集结到位`, scan);
}

export function railGateScan(batchId: string, scannedId: string, operator = '铁路闸口值班员'): RailActionResult {
  const batch = getBatch(batchId);
  const id = scannedId.trim().toUpperCase();
  if (batch.status !== 'sealed') {
    const scan = pushScan(batch, { containerId: id, checkpoint: 'gate', result: 'blocked', operator, lane: 'rail', detail: `批次当前 ${batch.status}，铁路闸口只接受已封批批次` });
    return result(batch, `闸口拒收：批次当前为「${batch.status}」，只有已封批批次能过铁路闸口`, scan);
  }
  const member = batch.members.find(item => item.containerId === id);
  if (!member) {
    const near = batch.members.find(item => item.state !== 'withdrawn' && item.state !== 'gated' && item.state !== 'arrived');
    if (near && containers.some(item => item.id === id)) {
      return openUnsealFlow(batchId, 'number-mismatch', operator, `闸口实扫 ${id} 与封批清单待过箱 ${near.containerId} 不符`, `实扫箱号 ${id}，清单期待 ${near.containerId}`, false);
    }
    const scan = pushScan(batch, { containerId: id, checkpoint: 'gate', result: 'not-in-batch', operator, lane: 'rail', detail: '该箱不属于封批清单' });
    return result(batch, `闸口拦截：箱 ${id} 不属于批次 ${batch.id} 的封批清单`, scan);
  }
  if (member.state === 'gated' || member.state === 'arrived') {
    const scan = pushScan(batch, { containerId: id, checkpoint: 'gate', result: 'duplicate', operator, lane: 'rail', detail: `重复过闸扫描，当前 ${memberStateLabel[member.state]}` });
    return result(batch, `重复扫描：${id} 已过闸${member.state === 'arrived' ? '并已到站' : ''}，状态不变`, scan);
  }
  if (member.state === 'withdrawn') {
    const scan = pushScan(batch, { containerId: id, checkpoint: 'gate', result: 'blocked', operator, lane: 'rail', detail: '该箱已撤出封批清单' });
    return result(batch, `闸口拒收：${id} 已撤出封批清单`, scan);
  }
  const container = containers.find(item => item.id === id);
  if (container && container.customs !== 'released') {
    return openUnsealFlow(batchId, 'customs-inspection', operator, `闸口海关拦截 ${id}（${container.customs}）`, `${id} 海关状态 ${container.customs}，闸口布控拦截`, false);
  }
  if (member.state === 'inspection-hold') {
    const scan = pushScan(batch, { containerId: id, checkpoint: 'gate', result: 'intercepted', operator, lane: 'rail', detail: '查验挂起箱尝试过闸' });
    return result(batch, `闸口拦截：${id} 查验挂起未解除`, scan);
  }
  member.state = 'gated'; logMember(member, 'gate-scan', '铁路闸口扫码放行装车');
  if (container) container.lastEvent = `铁路批次 ${batch.id} 已过铁路闸口装车`;
  const appointment = appointments.find(item => item.containerId === id && item.lane === 'rail' && item.status !== 'cancelled' && item.status !== 'completed');
  if (appointment) appointment.status = 'checked-in';
  const scan = pushScan(batch, { containerId: id, checkpoint: 'gate', result: 'ok', operator, lane: 'rail', detail: '铁路闸口扫码放行装车' });
  batch.updatedAt = railNow();
  recordRailAudit('gate-scan', batch, `闸口扫描 ${id} 放行装车`, operator);
  const view = railBatchView(batch.id)!;
  return result(batch, view.missing.length ? `${id} 已过闸装车；批次仍缺 ${view.missing.length} 箱` : `${id} 已过闸装车；全部箱已过闸，可以发运`, scan);
}

export function sealRailBatch(batchId: string, operator = '铁路值班员'): RailActionResult {
  const batch = getBatch(batchId);
  if (batch.status !== 'forming') throw new Error(`批次 ${batch.status} 状态不能执行封批（封批仅对集结中批次开放）`);
  const view = computeView(batch);
  if (!view.activeCount) throw new Error('空批次不能封批');
  const criticalBlockers = view.blockers.filter(item => item.level === 'critical');
  if (criticalBlockers.length || view.missing.length) {
    const critical = [...view.missing.map(item => item.reason), ...criticalBlockers.map(item => item.message)];
    throw new Error(`封批被拒（${critical.length} 项阻塞）：${[...new Set(critical)].slice(0, 5).join('；')}`);
  }
  batch.status = 'sealed'; batch.sealedAt = railNow(); batch.sealNo = `SEAL-${batch.trainNo}-${new Date().getHours()}${new Date().getMinutes()}`; batch.updatedAt = railNow();
  recordRailAudit('seal', batch, `批次封批，封志号 ${batch.sealNo}，共 ${view.activeCount} 箱`, operator);
  return result(batch, `批次已封批（封志 ${batch.sealNo}），封批后改箱必须走解封流程`);
}

function openUnsealFlow(batchId: string, reason: UnsealReason, requestedBy: string, note: string, _resolution: string | false, auto = false): RailActionResult {
  const batch = getBatch(batchId);
  const open = batch.unseals.find(item => !item.closedAt);
  if (batch.status === 'unsealed' || open) throw new Error(`批次已处于解封流程（${open?.id ?? '未知单号'}，${open ? unsealReasonLabel[open.reason] : '未知原因'}），请先关闭该解封单并重新封批，或处理后再次解封`);
  if (!['sealed', 'in-transit', 'partial-arrived'].includes(batch.status)) throw new Error(`批次 ${batch.status} 状态不能解封；集结中可直接改箱，已取消/已到站批次无需解封`);
  const unseal: RailUnseal = { id: railId('UNS'), reason, fromStatus: batch.status as 'sealed' | 'in-transit' | 'partial-arrived', requestedBy, openedAt: railNow(), note };
  batch.unseals.unshift(unseal); batch.prevStatus = unseal.fromStatus; batch.status = 'unsealed'; batch.updatedAt = railNow();
  if (reason === 'customs-inspection') {
    const hit = note.match(/拦截\s*([A-Z]{4}-?\d+)|([A-Z]{4}-?\d+)\s*海关/);
    const target = hit ? (hit[1] ?? hit[2]) : undefined;
    for (const member of batch.members) {
      const container = containers.find(item => item.id === member.containerId);
      if (member.state !== 'withdrawn' && member.state !== 'arrived' && (member.containerId === target || container?.customs !== 'released')) {
        member.state = 'inspection-hold'; logMember(member, 'inspection-hold', `海关查验拦截，批次解封（${unseal.id}）`);
        if (container) { container.customs = 'inspection'; container.status = 'hold'; container.lastEvent = `铁路批次 ${batch.id} 途中/到站查验拦截`; }
      }
    }
  }
  if (reason === 'number-mismatch') {
    const match = note.match(/(?:期待|待过箱)\s*([A-Z]{4}-?\d+)/);
    const target = match?.[1];
    const member = batch.members.find(item => item.containerId === target && item.state !== 'withdrawn' && item.state !== 'gated' && item.state !== 'arrived');
    if (member) { member.state = 'number-mismatch'; logMember(member, 'number-mismatch', `闸口实扫箱号与清单不符，批次解封（${unseal.id}）`); }
  }
  recordRailAudit('unseal', batch, `${auto ? '系统自动' : '人工'}解封：${unsealReasonLabel[reason]} / ${note}`, requestedBy);
  const scan = pushScan(batch, { containerId: note, checkpoint: reason === 'number-mismatch' ? 'gate' : 'arrival', result: reason === 'number-mismatch' ? 'mismatch' : 'intercepted', operator: requestedBy, lane: 'rail', detail: note });
  return result(batch, `批次已进入解封流程（${unseal.id}，${unsealReasonLabel[reason]}）：${note}。封批清单锁定解除，全部处理留痕，完成后须重新封批`, scan);
}

export function unsealRailBatch(batchId: string, input: { reason: UnsealReason; requestedBy?: string; note: string }): RailActionResult {
  if (!input.reason || !['customs-inspection', 'number-mismatch', 'window-change'].includes(input.reason)) throw new Error('解封原因必须是 customs-inspection / number-mismatch / window-change 之一');
  if (!input.note?.trim()) throw new Error('解封必须填写情况说明（审计要求）');
  return openUnsealFlow(batchId, input.reason, input.requestedBy ?? '铁路值班员', input.note, false, false);
}

export function resolveMismatchRailContainer(batchId: string, containerId: string, resolution: 'confirmed' | 'swap', actualContainerId?: string, operator = '铁路值班员'): RailActionResult {
  const batch = getBatch(batchId);
  const open = batch.unseals.find(item => !item.closedAt);
  if (batch.status !== 'unsealed' || !open || open.reason !== 'number-mismatch') throw new Error('只有处于箱号不符解封流程的批次可以处理箱号不符');
  const member = batch.members.find(item => item.containerId === containerId.trim().toUpperCase());
  if (!member) throw new Error(`箱 ${containerId} 不在批次中`);
  if (member.state !== 'number-mismatch') throw new Error(`箱 ${containerId} 当前不是箱号不符状态`);
  if (resolution === 'confirmed') {
    member.state = open.fromStatus === 'sealed' ? 'gated' : 'arrived';
    logMember(member, 'mismatch-resolve', open.fromStatus === 'sealed' ? '人工核对箱号无误（OCR/清单误报），现场补过闸' : '人工核对箱号无误，恢复交接');
    open.resolution = `核对无误，箱 ${member.containerId} 恢复流转`;
  } else {
    const actual = (actualContainerId ?? '').trim().toUpperCase();
    if (!actual) throw new Error('选择换箱时必须提供实际箱号');
    const occupied = findActiveMember(actual, batch.id);
    if (occupied) throw new Error(`实际箱 ${actual} 已在批次 ${occupied.batch.id} 中`);
    const container = containers.find(item => item.id === actual);
    if (!container) throw new Error(`实际箱 ${actual} 在箱务台账中不存在`);
    if (container.direction !== batch.direction) throw new Error(`实际箱 ${actual} 流向与批次不一致`);
    const old = member.containerId;
    member.containerId = actual; member.state = 'staged';
    logMember(member, 'mismatch-resolve', `箱号不符换箱：${old} → ${actual}，重新集结`);
    open.resolution = `换箱处理：${old} → ${actual}`;
  }
  batch.updatedAt = railNow();
  recordRailAudit('mismatch-resolve', batch, open.resolution, operator);
  return result(batch, `箱号不符已处理：${open.resolution}。处理结果已写入解封单 ${open.id}`);
}

export function holdCustomsRailContainer(batchId: string, containerId: string, note: string, operator = '海关查验科'): RailActionResult {
  const batch = getBatch(batchId);
  const member = batch.members.find(item => item.containerId === containerId.trim().toUpperCase());
  if (!member) throw new Error(`箱 ${containerId} 不在批次 ${batch.id} 中`);
  if (member.state === 'withdrawn') throw new Error('已撤出的箱不能布控');
  if (member.state === 'arrived') throw new Error('已到站完成交接的箱不通过铁路批次布控，请走查验台账');
  const container = containers.find(item => item.id === member.containerId);
  if (['sealed', 'in-transit', 'partial-arrived'].includes(batch.status)) {
    const opened = openUnsealFlow(batchId, 'customs-inspection', operator, `${member.containerId} 海关布控查验：${note || '未填写说明'}`, false, true);
    return { ...opened, outcome: `${opened.outcome}；布控箱已挂起，其余箱保持原状态` };
  }
  member.state = 'inspection-hold'; logMember(member, 'inspection-hold', `海关布控查验：${note || '未填写说明'}`);
  if (container) { container.customs = 'inspection'; container.status = 'hold'; container.lastEvent = `铁路批次 ${batch.id} 布控查验`; }
  batch.updatedAt = railNow();
  recordRailAudit('customs-hold', batch, `${member.containerId} 布控查验：${note}`, operator);
  return result(batch, `${member.containerId} 已布控查验挂起，封批前必须完成放行或撤出`);
}

export function releaseCustomsRailContainer(batchId: string, containerId: string, note: string, operator = '海关查验科'): RailActionResult {
  const batch = getBatch(batchId);
  const member = batch.members.find(item => item.containerId === containerId.trim().toUpperCase());
  if (!member) throw new Error(`箱 ${containerId} 不在批次 ${batch.id} 中`);
  const container = containers.find(item => item.id === member.containerId);
  if (!container?.customs || container.customs === 'released') throw new Error(`箱 ${member.containerId} 海关状态已是放行`);
  container.customs = 'released'; if (container.status === 'hold') container.status = 'in-transit'; container.lastEvent = `铁路批次 ${batch.id} 查验完成放行`;
  const open = batch.unseals.find(item => !item.closedAt && item.reason === 'customs-inspection');
  const stillHeld = batch.members.some(item => item.containerId !== member.containerId && item.state !== 'withdrawn' && item.state !== 'arrived' && (item.state === 'inspection-hold' || containers.find(c => c.id === item.containerId)?.customs !== 'released'));
  if (member.state === 'inspection-hold') {
    const phase = batch.status === 'unsealed' ? open?.fromStatus : batch.status;
    member.state = phase === 'sealed' ? 'staged' : phase === 'in-transit' || phase === 'partial-arrived' ? 'gated' : 'planned';
    logMember(member, 'customs-release', `海关查验完成放行，恢复为${memberStateLabel[member.state]}`);
  }
  if (open && !stillHeld) { open.closedAt = railNow(); open.resolution = `查验全部完成并放行：${note || '海关放行'}`; }
  batch.updatedAt = railNow();
  recordRailAudit('customs-release', batch, `${member.containerId} 查验放行${open && !stillHeld ? '，解封单已关闭待重封' : '，批次仍有其他查验箱'}`, operator);
  const view = railBatchView(batch.id)!;
  return result(batch, `${member.containerId} 海关已放行${open?.closedAt ? `；解封单 ${open.id} 已关闭，${view.readyToSeal ? '可以重新封批' : '仍有其他阻塞待处理'}` : '；批次仍有查验箱未放行'}`);
}

export function changeRailWindow(batchId: string, railWindowStart: string, railWindowEnd: string, reason: string, operator = '铁路调度'): RailActionResult {
  const batch = getBatch(batchId);
  if (!reason?.trim()) throw new Error('窗口变更必须填写原因（审计要求）');
  if (new Date(railWindowEnd) <= new Date(railWindowStart)) throw new Error('铁路窗口结束时间必须晚于开始时间');
  if (batch.status === 'cancelled' || batch.status === 'arrived') throw new Error('已取消或已完成到站的批次不能改窗口');
  const from = `${batch.railWindowStart.slice(11, 16)}~${batch.railWindowEnd.slice(11, 16)}`;
  if (['sealed', 'in-transit', 'partial-arrived'].includes(batch.status)) {
    const opened = openUnsealFlow(batchId, 'window-change', operator, `窗口 ${from} 改为 ${railWindowStart.slice(11, 16)}~${railWindowEnd.slice(11, 16)}：${reason}`, false, false);
    batch.railWindowStart = railWindowStart; batch.railWindowEnd = railWindowEnd;
    batch.updatedAt = railNow();
    return { ...opened, outcome: `铁路窗口变更已留痕并触发解封单（${opened.scan?.id}），批次保持解封状态，核对清单后重新封批` };
  }
  batch.railWindowStart = railWindowStart; batch.railWindowEnd = railWindowEnd; batch.updatedAt = railNow();
  recordRailAudit('window-change', batch, `集结中窗口变更 ${from} → ${railWindowStart.slice(11, 16)}~${railWindowEnd.slice(11, 16)}：${reason}`, operator);
  return result(batch, '集结中批次窗口已直接更新并写入审计');
}

export function resealRailBatch(batchId: string, operator = '铁路值班员'): RailActionResult {
  const batch = getBatch(batchId);
  if (batch.status !== 'unsealed') throw new Error('只有解封状态的批次才能重新封批');
  const lastUnseal = batch.unseals[0];
  if (!lastUnseal) throw new Error('批次没有解封记录，不能执行重新封批');
  if (!lastUnseal.closedAt && lastUnseal.reason === 'customs-inspection') throw new Error(`解封单 ${lastUnseal.id} 仍有查验未处理完成，不能重新封批`);
  const view = computeView(batch);
  if (view.blockers.some(item => item.level === 'critical' && item.code !== 'unsealed') || view.missing.length) {
    const critical = [...view.missing.map(item => `${item.containerId}: ${item.reason}`), ...view.blockers.filter(item => item.level === 'critical' && item.code !== 'unsealed').map(item => item.message)];
    throw new Error(`重新封批被拒（${critical.length} 项阻塞）：${[...new Set(critical)].slice(0, 5).join('；')}`);
  }
  if (!lastUnseal.closedAt) { lastUnseal.closedAt = railNow(); lastUnseal.resolution = lastUnseal.resolution ?? '异常处理完成，重新封批'; }
  const restored = lastUnseal.fromStatus;
  const beforeDeparture = phaseRank.indexOf(restored) < phaseRank.indexOf('in-transit');
  batch.status = beforeDeparture ? 'sealed' : restored;
  batch.sealedAt = railNow(); batch.sealNo = `SEAL-${batch.trainNo}-R${batch.unseals.length}`; batch.updatedAt = railNow();
  recordRailAudit('reseal', batch, `解封单 ${lastUnseal.id}（${unsealReasonLabel[lastUnseal.reason]}）关闭并重新封批，恢复阶段 ${batch.status}，封志 ${batch.sealNo}`, operator);
  return result(batch, `已重新封批（封志 ${batch.sealNo}），恢复到「${{ sealed: '已封批待发运', 'in-transit': '在途', 'partial-arrived': '部分到站', forming: '集结中', arrived: '全部到站', unsealed: '已解封', cancelled: '已取消' }[batch.status]}」阶段`);
}

export function departRailBatch(batchId: string, operator = '铁路调度'): RailActionResult {
  const batch = getBatch(batchId);
  if (batch.status !== 'sealed') throw new Error(`批次 ${batch.status} 状态不能发运，需要先封批`);
  const view = computeView(batch);
  const notGated = view.memberViews.filter(item => item.member.state !== 'withdrawn' && item.member.state !== 'gated' && item.member.state !== 'arrived');
  if (notGated.length) throw new Error(`发运被拒：${notGated.map(item => item.member.containerId).join('、')} 尚未过铁路闸口`);
  if (new Date(batch.railWindowEnd).getTime() < Date.now()) throw new Error('发运被拒：铁路窗口已过期，请先走窗口变更');
  batch.status = 'in-transit'; batch.departedAt = railNow(); batch.updatedAt = railNow();
  for (const member of batch.members) if (member.state === 'gated') logMember(member, 'depart', '车次发运，铁路在途');
  const containerIds = batch.members.filter(member => member.state === 'gated').map(member => member.containerId);
  for (const id of containerIds) {
    const container = containers.find(item => item.id === id); if (container) { container.status = 'in-transit'; container.lastEvent = `随铁路批次 ${batch.id}（${batch.trainNo}）发运在途`; }
    appointments.filter(item => item.containerId === id && item.lane === 'rail' && item.status !== 'cancelled').forEach(item => { item.status = 'completed'; });
    tasks.filter(item => item.containerId === id && item.kind === 'deliver' && item.to.includes('铁路') && item.status !== 'done').forEach(item => { item.status = 'done'; item.blockingReasons = []; });
  }
  recordRailAudit('depart', batch, `车次 ${batch.trainNo} 发运在途，${containerIds.length} 箱`, operator);
  return result(batch, `车次 ${batch.trainNo} 已发运，${containerIds.length} 箱进入在途，相关铁路预约与送箱任务已联动完成`);
}

export function railArrivalScan(batchId: string, containerId: string, operator = '到站铁路值班员'): RailActionResult {
  const batch = getBatch(batchId);
  const id = containerId.trim().toUpperCase();
  if (batch.status !== 'in-transit' && batch.status !== 'partial-arrived') {
    const scan = pushScan(batch, { containerId: id, checkpoint: 'arrival', result: 'blocked', operator, lane: 'rail', detail: `批次当前 ${batch.status}，到站扫描只接受在途批次` });
    return result(batch, `到站扫描拒收：批次当前为「${batch.status}」`, scan);
  }
  const member = batch.members.find(item => item.containerId === id);
  if (!member) {
    const scan = pushScan(batch, { containerId: id, checkpoint: 'arrival', result: 'not-in-batch', operator, lane: 'rail', detail: '到站箱号不在批次清单' });
    return result(batch, `到站拦截：箱 ${id} 不在批次 ${batch.id} 清单`, scan);
  }
  if (member.state === 'arrived') {
    const scan = pushScan(batch, { containerId: id, checkpoint: 'arrival', result: 'duplicate', operator, lane: 'rail', detail: '重复到站扫描' });
    return result(batch, `重复扫描：${id} 已确认到站，状态不变`, scan);
  }
  if (member.state === 'withdrawn') {
    const scan = pushScan(batch, { containerId: id, checkpoint: 'arrival', result: 'blocked', operator, lane: 'rail', detail: '该箱发运前已撤出' });
    return result(batch, `到站拒收：${id} 在发运前已撤出批次`, scan);
  }
  if (member.state !== 'gated') {
    const scan = pushScan(batch, { containerId: id, checkpoint: 'arrival', result: 'blocked', operator, lane: 'rail', detail: `该箱未过闸发运（${memberStateLabel[member.state]}）` });
    return result(batch, `到站异常：${id} 未过闸却出现到站扫描（当前 ${memberStateLabel[member.state]}），请核查`, scan);
  }
  const container = containers.find(item => item.id === id);
  if (container && container.customs !== 'released') {
    return openUnsealFlow(batchId, 'customs-inspection', operator, `到站海关拦截 ${id}（${container.customs}）`, `${id} 到站布控查验`, false);
  }
  member.state = 'arrived'; logMember(member, 'arrive-scan', '到站扫码确认完成交接');
  if (container) { container.status = batch.direction === 'export' ? 'in-yard' : 'released'; container.lastEvent = `铁路批次 ${batch.id} 到站确认`; }
  const scan = pushScan(batch, { containerId: id, checkpoint: 'arrival', result: 'ok', operator, lane: 'rail', detail: '到站扫码确认完成交接' });
  const activeMembers = batch.members.filter(item => item.state !== 'withdrawn');
  const allArrived = activeMembers.every(item => item.state === 'arrived');
  if (allArrived) { batch.status = 'arrived'; batch.arrivedAt = railNow(); }
  else batch.status = 'partial-arrived';
  batch.updatedAt = railNow();
  recordRailAudit('arrive-scan', batch, `${id} 到站确认${allArrived ? '，批次全部到站完成' : '，批次部分到站'}`, operator);
  return result(batch, allArrived ? `${id} 到站确认，批次全部到站，交接完成` : `${id} 到站确认；仍有 ${activeMembers.filter(item => item.state !== 'arrived').length} 箱未到站，批次保持部分到站`, scan);
}

export function cancelRailBatch(batchId: string, reason: string, operator = '铁路调度'): RailActionResult {
  const batch = getBatch(batchId);
  if (!reason?.trim()) throw new Error('取消批次必须填写原因（审计要求）');
  if (batch.status === 'cancelled') throw new Error('批次已经取消');
  if (batch.status === 'arrived') throw new Error('已完成到站交接的批次不能取消');
  const open = batch.unseals.find(item => !item.closedAt);
  if (batch.status === 'unsealed' && (open?.fromStatus === 'in-transit' || open?.fromStatus === 'partial-arrived')) throw new Error('在途/部分到站批次不能直接取消：请先按异常流程完成解封处理');
  if (batch.status === 'unsealed') throw new Error('批次处于解封流程，不能直接取消：请先完成异常处理并重新封批，封批后在发运前才能取消');
  if (['in-transit', 'partial-arrived'].includes(batch.status)) throw new Error('在途/部分到站批次不能直接取消：请先按异常流程解封处理');
  for (const member of batch.members) if (member.state !== 'withdrawn') { member.state = 'withdrawn'; logMember(member, 'batch-cancel', `批次取消：${reason}`); }
  batch.status = 'cancelled'; batch.updatedAt = railNow(); batch.note = `${batch.note}${batch.note ? '；' : ''}取消原因：${reason}`;
  recordRailAudit('cancel', batch, `批次取消：${reason}`, operator);
  return result(batch, `批次 ${batch.id} 已取消，在册箱全部释放回箱务池，可重新组批`);
}

export function railBatchView(id: string): RailBatchView | undefined { const batch = railBatches.find(item => item.id === id); return batch ? computeView(batch) : undefined; }
export function railBatchList(): RailBatchView[] { return railBatches.map(computeView); }
export function railRosterCandidates(direction: Container['direction']) {
  return containers
    .filter(container => container.direction === direction && !findActiveMember(container.id))
    .map(container => ({ container, railAppointment: appointments.find(item => item.containerId === container.id && item.lane === 'rail' && item.status !== 'cancelled'), deliverTask: tasks.find(item => item.containerId === container.id && item.kind === 'deliver' && item.to.includes('铁路') && item.status !== 'done') }));
}

export function assertRailContainerEditable(containerId: string): string | undefined {
  const occupied = findActiveMember(containerId);
  if (!occupied) return undefined;
  const { batch, member } = occupied;
  if (member.state === 'withdrawn') return undefined;
  if (canRosterEdit(batch.status)) return undefined;
  return `箱 ${containerId} 在铁路批次 ${batch.id}（${batch.status === 'sealed' ? '已封批' : '在途/到站'}）锁定中，不能从箱务/公路侧改动；请先在铁路批次中按查验、箱号不符或窗口变更走解封流程`;
}
