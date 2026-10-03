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
  { id: 'TEMU-1774029', voyageId: 'VOY-AX7', size: '40', isoType: '45R1', direction: 'import', status: 'in-yard', weightT: 26.3, reefer: true, temperature: 4, customs: 'inspection', priority: 'reefer', yardSlot: 'D05-R05-T1', lastEvent: '待海关查验' }
];
export const appointments: GateAppointment[] = [
  { id: 'APT-9001', containerId: 'OOLU-7734201', truckNo: '沪A·7K229', driver: '陈海', type: 'dropoff', windowStart: iso(-14), windowEnd: iso(16), lane: 'south', status: 'checked-in', sealVerified: true, weightVerified: true },
  { id: 'APT-9002', containerId: 'MSCU-4829017', truckNo: '苏E·66218', driver: '王建国', type: 'pickup', windowStart: iso(34), windowEnd: iso(64), lane: 'north', status: 'booked', sealVerified: false, weightVerified: false },
  { id: 'APT-9003', containerId: 'EISU-1288420', truckNo: '沪B·02891', driver: '赵晨', type: 'pickup', windowStart: iso(38), windowEnd: iso(68), lane: 'north', status: 'booked', sealVerified: false, weightVerified: false },
  { id: 'APT-9004', containerId: 'FCIU-9920310', truckNo: '沪A·7K229', driver: '陈海', type: 'pickup', windowStart: iso(4), windowEnd: iso(22), lane: 'south', status: 'booked', sealVerified: false, weightVerified: false, exception: '同一车辆相邻窗口过短' }
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
  { id: 'TASK-104', kind: 'load', containerId: 'FCIU-9920310', from: 'C03-R04-T2', to: 'B07 / VOY-QF2', equipmentId: 'YC-05', priority: 75, status: 'queued', scheduledAt: iso(76), blockingReasons: [], estimatedMinutes: 21 }
];
export const auditEvents: AuditEvent[] = [{ id: 'AUD-500', actor: '中控调度员', action: 'REPLAN', entity: 'voyage', entityId: 'VOY-AX7', at: new Date(start - 20 * 60000).toISOString(), details: '因 QC-07 瞬时降速，重新计算 14 个高优先级作业' }];

// 铁路集结箱（出口方向，先在场内集结，再由铁路批次接管）
export const railStagingContainers: Container[] = [
  { id: 'CXRU-2201108', voyageId: 'VOY-QF2', size: '40', isoType: '45G1', direction: 'export', status: 'at-gate', weightT: 21.6, reefer: false, customs: 'released', priority: 'normal', yardSlot: 'C03-R02-T1', appointmentId: 'APT-9010', lastEvent: '铁路集结位待装车' },
  { id: 'CXRU-2201115', voyageId: 'VOY-QF2', size: '20', isoType: '22G1', direction: 'export', status: 'in-yard', weightT: 11.8, reefer: false, customs: 'released', priority: 'normal', yardSlot: 'C03-R02-T3', appointmentId: 'APT-9011', lastEvent: '场内集结，等待铁路车道签到' },
  { id: 'CXRU-2201131', voyageId: 'VOY-QF2', size: '40', isoType: '45G1', direction: 'export', status: 'hold', weightT: 23.9, reefer: false, hazmatClass: '3', customs: 'inspection', priority: 'hazmat', yardSlot: 'D05-R03-T1', lastEvent: '铁路装车前被海关抽中查验' },
  { id: 'CXRU-2201147', voyageId: 'VOY-QF2', size: '40', isoType: '45G1', direction: 'export', status: 'in-yard', weightT: 24.4, reefer: false, customs: 'released', priority: 'normal', yardSlot: 'C03-R03-T2', appointmentId: 'APT-9012', lastEvent: '公路提箱预约未释放' },
  { id: 'CRWU-5002311', voyageId: 'VOY-QF2', size: '40', isoType: '45G1', direction: 'export', status: 'in-transit', weightT: 20.7, reefer: false, customs: 'released', priority: 'normal', yardSlot: 'C03-R01-T1', appointmentId: 'APT-9007', lastEvent: 'X8604 次列车在途，GPS 南京东' },
  { id: 'CRWU-5002318', voyageId: 'VOY-QF2', size: '40', isoType: '45G1', direction: 'export', status: 'in-transit', weightT: 22.9, reefer: false, customs: 'released', priority: 'normal', yardSlot: 'C03-R01-T2', appointmentId: 'APT-9008', lastEvent: '合肥北站到站确认 12:10' },
  { id: 'CRWU-5002325', voyageId: 'VOY-QF2', size: '20', isoType: '22G1', direction: 'export', status: 'in-transit', weightT: 12.5, reefer: false, customs: 'released', priority: 'normal', yardSlot: 'C03-R01-T3', appointmentId: 'APT-9009', lastEvent: 'X8604 次列车在途，未到站' }
];
containers.push(...railStagingContainers);

export const railAppointments: GateAppointment[] = [
  { id: 'APT-9007', containerId: 'CRWU-5002311', truckNo: '沪A·R0007', driver: '铁路理货员', type: 'pickup', windowStart: iso(-210), windowEnd: iso(-160), lane: 'rail', status: 'completed', sealVerified: true, weightVerified: true },
  { id: 'APT-9008', containerId: 'CRWU-5002318', truckNo: '沪A·R0008', driver: '铁路理货员', type: 'pickup', windowStart: iso(-208), windowEnd: iso(-158), lane: 'rail', status: 'completed', sealVerified: true, weightVerified: true },
  { id: 'APT-9009', containerId: 'CRWU-5002325', truckNo: '沪A·R0009', driver: '铁路理货员', type: 'pickup', windowStart: iso(-206), windowEnd: iso(-156), lane: 'rail', status: 'completed', sealVerified: true, weightVerified: true },
  { id: 'APT-9010', containerId: 'CXRU-2201108', truckNo: '沪A·R0010', driver: '铁路理货员', type: 'pickup', windowStart: iso(-6), windowEnd: iso(24), lane: 'rail', status: 'checked-in', sealVerified: true, weightVerified: true },
  { id: 'APT-9011', containerId: 'CXRU-2201115', truckNo: '沪A·R0011', driver: '铁路理货员', type: 'pickup', windowStart: iso(12), windowEnd: iso(42), lane: 'rail', status: 'booked', sealVerified: false, weightVerified: false },
  { id: 'APT-9012', containerId: 'CXRU-2201147', truckNo: '苏E·66218', driver: '王建国', type: 'pickup', windowStart: iso(30), windowEnd: iso(60), lane: 'north', status: 'booked', sealVerified: false, weightVerified: false }
];
appointments.push(...railAppointments);

export const railTasks: YardTask[] = [
  { id: 'TASK-201', kind: 'deliver', containerId: 'CXRU-2201108', from: 'C03-R02-T1', to: '铁路闸口 R1', equipmentId: 'YC-05', priority: 82, status: 'assigned', scheduledAt: iso(8), blockingReasons: [], estimatedMinutes: 14 },
  { id: 'TASK-202', kind: 'inspect', containerId: 'CXRU-2201131', from: 'D05-R03-T1', to: 'D05-R03-T1', priority: 118, status: 'blocked', scheduledAt: iso(6), blockingReasons: ['待海关查验窗口'], estimatedMinutes: 30 },
  { id: 'TASK-203', kind: 'deliver', containerId: 'CRWU-5002318', from: 'C03-R01-T2', to: '铁路闸口 R1', equipmentId: 'YC-05', priority: 80, status: 'done', scheduledAt: iso(-190), blockingReasons: [], estimatedMinutes: 12 }
];
tasks.push(...railTasks);

function parseSlot(slot: string) { const match = slot.match(/^([A-Z]\d\d)-/); return match?.[1]; }
export function dashboard() {
  const activeVoyages = voyages.filter(v => v.status !== 'departed');
  const yardCapacity = blocks.reduce((sum, block) => sum + block.capacity, 0); const yardOccupied = blocks.reduce((sum, block) => sum + block.occupied, 0);
  return { activeVoyages: activeVoyages.length, berthMoves: activeVoyages.reduce((sum, v) => sum + v.movesPlanned - v.movesDone, 0), yardUtilization: yardOccupied / yardCapacity, gateQueue: appointments.filter(a => a.status === 'checked-in').length + 7, pendingTasks: tasks.filter(t => t.status !== 'done').length, blockedTasks: tasks.filter(t => t.status === 'blocked').length, reeferAlerts: containers.filter(c => c.reefer && (c.customs === 'inspection' || (c.temperature ?? 0) > 5)).length, hazmatHolds: containers.filter(c => c.hazmatClass && c.customs !== 'released').length, lateVessels: activeVoyages.filter(v => v.lateRisk === 'high').length, railBatchesActive: railBatches.filter(b => ACTIVE_RAIL_STATUS.includes(b.status)).length, railInTransit: railBatches.filter(b => b.status === 'in-transit').length, railUnsealed: railBatches.filter(b => b.activeUnseal).length, railMissingAtStation: railBatches.reduce((sum, b) => b.status === 'in-transit' ? sum + b.members.filter(m => m.state === 'on-rail').length : sum, 0) };
}
export function gateConflicts() {
  const result: { severity: 'critical' | 'warning'; appointmentId: string; reason: string }[] = [];
  appointments.forEach((a, index) => appointments.slice(index + 1).forEach(b => {
    const overlap = a.truckNo === b.truckNo && new Date(a.windowStart).getTime() < new Date(b.windowEnd).getTime() && new Date(b.windowStart).getTime() < new Date(a.windowEnd).getTime();
    if (overlap) result.push({ severity: 'critical', appointmentId: a.id, reason: `车辆 ${a.truckNo} 与 ${b.id} 时间窗口重叠，需重新分配闸口时隙` });
  }));
  appointments.filter(a => a.status === 'booked').forEach(a => { const container = containers.find(c => c.id === a.containerId); if (container?.customs !== 'released') result.push({ severity: 'warning', appointmentId: a.id, reason: `箱 ${a.containerId} 海关状态为 ${container?.customs}，无法无条件放行` }); });
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
export function updateAppointment(id: string, patch: Partial<Pick<GateAppointment, 'status' | 'sealVerified' | 'weightVerified' | 'exception'>>) { const item = appointments.find(a => a.id === id); if (!item) return undefined; Object.assign(item, patch); const container = containers.find(c => c.id === item.containerId); if (item.status === 'checked-in' && container) container.status = 'at-gate'; if (item.status === 'completed' && container) container.status = item.type === 'pickup' && item.lane !== 'rail' ? 'released' : 'in-yard'; auditEvents.unshift({ id: `AUD-${Date.now()}`, actor: '闸口值班员', action: 'GATE_UPDATE', entity: 'appointment', entityId: id, at: new Date().toISOString(), details: JSON.stringify(patch) }); return item; }
export function assignTask(id: string, equipmentId: string) { const task = tasks.find(item => item.id === id); const machine = equipment.find(item => item.id === equipmentId); if (!task || !machine) return undefined; const blockingReasons = [...task.blockingReasons]; if (machine.status === 'maintenance' || machine.status === 'offline') blockingReasons.push(`${machine.name} 当前不可用`); if (task.kind === 'inspect' && machine.kind !== 'reach-stacker') blockingReasons.push('查验作业需要正面吊或专用设备'); task.equipmentId = equipmentId; task.status = blockingReasons.length ? 'blocked' : 'assigned'; task.blockingReasons = blockingReasons; auditEvents.unshift({ id: `AUD-${Date.now()}`, actor: '中控调度员', action: 'ASSIGN_TASK', entity: 'yard-task', entityId: id, at: new Date().toISOString(), details: `${equipmentId} -> ${task.containerId}` }); return task; }
export function containerDetail(id: string) { const container = containers.find(item => item.id === id); if (!container) return undefined; return { container, voyage: voyages.find(v => v.id === container.voyageId), appointment: appointments.find(a => a.id === container.appointmentId), plan: containerPlan(id), tasks: tasks.filter(t => t.containerId === id), railBatch: railBatchForContainer(id) }; }

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
  const index = containers.findIndex(item => item.id === id);
  if (index < 0) return undefined;
  // 铁路交接联动：封批/在途批次的箱单受保护，只有解封后才能随台账删除
  const locked = railBatches.find(batch => isFrozen(batch) && batch.members.some(member => member.containerId === id && member.state !== 'pulled'));
  if (locked) throw new Error(`箱 ${id} 在已封批铁路批次 ${locked.id}（${locked.trainNo}）中，需先按查验/箱号不符/窗口变更解封并撤出后才能删除`);
  const [item] = containers.splice(index, 1);
  const removedAppointments = appointments.filter(appointment => appointment.containerId === id);
  for (const appointment of removedAppointments) appointments.splice(appointments.indexOf(appointment), 1);
  const removedTasks = tasks.filter(task => task.containerId === id);
  for (const task of removedTasks) tasks.splice(tasks.indexOf(task), 1);
  let railPulls = 0;
  for (const batch of railBatches.filter(batch => ACTIVE_RAIL_STATUS.includes(batch.status))) {
    const member = batch.members.find(entry => entry.containerId === id && entry.state !== 'pulled');
    if (member) { member.state = 'pulled'; member.note = `箱务台账删除联动撤出 @ ${new Date().toISOString()}`; railPulls += 1; }
  }
  recordAudit('DELETE', 'container', id, `删除箱务记录，并级联清理 ${removedAppointments.length} 条预约、${removedTasks.length} 条未完成任务${railPulls ? `、${railPulls} 个铁路批次撤出` : ''}`);
  return item;
}

export function createGateAppointment(input: AppointmentInput) {
  const container = containers.find(item => item.id === input.containerId);
  if (!container) throw new Error('箱号不存在');
  if (input.type === 'pickup' && container.customs !== 'released') throw new Error('海关未放行，不能预约提箱');
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
  const previousContainer = containers.find(container => container.id === item.containerId);
  Object.assign(item, patch);
  const nextContainer = containers.find(container => container.id === item.containerId);
  if (previousContainer && previousContainer.id !== nextContainer?.id && previousContainer.appointmentId === id) previousContainer.appointmentId = undefined;
  if (nextContainer) nextContainer.appointmentId = id;
  if (item.status === 'checked-in' && nextContainer) nextContainer.status = 'at-gate';
  if (item.status === 'completed' && nextContainer) nextContainer.status = item.type === 'pickup' && item.lane !== 'rail' ? 'released' : 'in-yard';
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
  Object.assign(item, patch);
  recordAudit('UPDATE', 'yard-task', id, `更新场内作业任务：${JSON.stringify(patch)}`);
  return item;
}

export function deleteYardTask(id: string) {
  const index = tasks.findIndex(item => item.id === id);
  if (index < 0) return undefined;
  const [item] = tasks.splice(index, 1);
  recordAudit('DELETE', 'yard-task', id, `删除 ${item.containerId} 的场内任务`);
  return item;
}

// ==================== 铁路交接批次（Rail Handover Batch） ====================
// 与公路提箱签到的区别：箱子先在场内集结区集结，再由铁路批次整体接管；
// 封批后箱单冻结，只有查验、箱号不符、铁路窗口变更可走可审计解封流程；
// 批次状态与箱子流向、海关状态、闸口车道（lane=rail）及场内任务实时联动。

export type RailBatchStatus = 'draft' | 'sealed' | 'in-transit' | 'arrived' | 'cancelled';
export type RailMemberState = 'pending' | 'at-gate' | 'on-rail' | 'arrived' | 'intercepted' | 'pulled';
export type RailUnsealReason = 'customs-inspection' | 'id-mismatch' | 'rail-window-change';
export const RAIL_UNSEAL_LABEL: Record<RailUnsealReason, string> = {
  'customs-inspection': '海关查验拦截',
  'id-mismatch': '箱号/封志不符',
  'rail-window-change': '铁路窗口变更'
};

export interface RailMember {
  containerId: string;
  state: RailMemberState;
  source: 'container' | 'appointment' | 'task';
  refId?: string;
  addedAt: string;
  arrivedAt?: string;
  note?: string;
}
export interface RailUnsealRecord {
  reason: RailUnsealReason;
  actor: string;
  at: string;
  note: string;
  refSealAt: string;
}
export interface RailBatch {
  id: string;
  trainNo: string;
  originStation: string;
  destStation: string;
  windowStart: string;
  windowEnd: string;
  lane: string;
  status: RailBatchStatus;
  members: RailMember[];
  sealedAt?: string;
  departedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  unsealHistory: RailUnsealRecord[];
  activeUnseal?: RailUnsealRecord;
  lastEvent: string;
}

const railNow = () => new Date().toISOString();
const ACTIVE_RAIL_STATUS: RailBatchStatus[] = ['draft', 'sealed', 'in-transit'];

export const railBatches: RailBatch[] = [
  {
    id: 'RB-7042', trainNo: 'X8604', originStation: '上海芦潮港站', destStation: '合肥北站',
    windowStart: iso(-170), windowEnd: iso(-120), lane: 'R1', status: 'in-transit',
    members: [
      { containerId: 'CRWU-5002311', state: 'on-rail', source: 'appointment', refId: 'APT-9007', addedAt: iso(-240) },
      { containerId: 'CRWU-5002318', state: 'arrived', source: 'appointment', refId: 'APT-9008', addedAt: iso(-238), arrivedAt: iso(-28) },
      { containerId: 'CRWU-5002325', state: 'on-rail', source: 'appointment', refId: 'APT-9009', addedAt: iso(-236) }
    ],
    sealedAt: iso(-175), departedAt: iso(-150), unsealHistory: [],
    lastEvent: '列车发运，2/3 箱已到站确认'
  },
  {
    id: 'RB-7108', trainNo: 'X8611', originStation: '上海芦潮港站', destStation: '义乌西站',
    windowStart: iso(40), windowEnd: iso(80), lane: 'R1', status: 'draft',
    members: [
      { containerId: 'CXRU-2201108', state: 'pending', source: 'appointment', refId: 'APT-9010', addedAt: iso(-30) },
      { containerId: 'CXRU-2201115', state: 'pending', source: 'appointment', refId: 'APT-9011', addedAt: iso(-25) },
      { containerId: 'CXRU-2201131', state: 'pending', source: 'task', refId: 'TASK-202', addedAt: iso(-20) },
      { containerId: 'CXRU-2201147', state: 'pending', source: 'container', addedAt: iso(-12) }
    ],
    unsealHistory: [],
    lastEvent: '铁路窗口集结中，存在 3 项封批阻塞'
  }
];

let railBatchSeq = 7200;
function nextRailBatchId() { railBatchSeq += 1; return `RB-${railBatchSeq}`; }

function railAudit(action: string, entityId: string, details: string, actor = '铁路值班员') {
  auditEvents.unshift({ id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`, actor, action, entity: 'rail-batch', entityId, at: railNow(), details });
}
function getBatch(id: string) { return railBatches.find(batch => batch.id === id); }
function activeMember(batch: RailBatch, containerId: string) { return batch.members.find(member => member.containerId === containerId && member.state !== 'pulled'); }
function isFrozen(batch: RailBatch) { return (batch.status === 'sealed' || batch.status === 'in-transit') && !batch.activeUnseal; }

function railBlockers(container: Container): string[] {
  const blockers: string[] = [];
  if (container.direction !== 'export') blockers.push(`流向为${container.direction === 'import' ? '进口' : '中转'}，铁路出口班列只接管出口箱`);
  if (['released', 'on-quay'].includes(container.status)) blockers.push(`箱状态为 ${container.status}，已离开堆场可交接范围`);
  if (container.customs === 'inspection') blockers.push('海关查验中，未放行不能发运');
  if (container.customs === 'hold') blockers.push('海关扣留，未放行不能发运');
  const appointment = appointments.find(item => item.id === container.appointmentId);
  if (!appointment) blockers.push('缺少铁路车道（rail）提箱预约');
  else {
    if (appointment.lane !== 'rail') blockers.push(`预约 ${appointment.id} 走${appointment.lane === 'north' ? '北' : '南'}闸口公路车道，未改派铁路车道`);
    if (appointment.status === 'booked') blockers.push(`铁路预约 ${appointment.id} 尚未在铁路闸口签到`);
    if (appointment.status === 'cancelled') blockers.push(`铁路预约 ${appointment.id} 已取消`);
    if (appointment.status === 'exception') blockers.push(`铁路预约 ${appointment.id} 异常：${appointment.exception ?? '未注明'}`);
  }
  const openTasks = tasks.filter(task => task.containerId === container.id && task.status !== 'done');
  for (const task of openTasks) {
    if (task.status === 'blocked') blockers.push(`场内任务 ${task.id} 已阻塞：${task.blockingReasons.join('、') || '原因未登记'}`);
    else if (task.kind === 'inspect') blockers.push(`查验任务 ${task.id} 未完成，海关未放行前不能装车`);
    else if (!task.to.includes('铁路') && !task.to.toLowerCase().includes('rail')) blockers.push(`任务 ${task.id} 终点为「${task.to}」，不是铁路闸口集结方向`);
  }
  return blockers;
}

function memberView(batch: RailBatch, member: RailMember) {
  const container = containers.find(item => item.id === member.containerId);
  const appointment = appointments.find(item => item.id === container?.appointmentId);
  const openTasks = tasks.filter(task => task.containerId === member.containerId && task.status !== 'done');
  const blockers = member.state === 'pulled' || member.state === 'arrived'
    ? []
    : container ? railBlockers(container) : ['箱务台账中找不到该箱'];
  return {
    ...member,
    container: container ? {
      id: container.id, size: container.size, direction: container.direction, status: container.status,
      customs: container.customs, yardSlot: container.yardSlot, hazmatClass: container.hazmatClass,
      reefer: container.reefer, lastEvent: container.lastEvent
    } : undefined,
    appointment: appointment ? { id: appointment.id, lane: appointment.lane, status: appointment.status, windowStart: appointment.windowStart, windowEnd: appointment.windowEnd } : undefined,
    openTasks: openTasks.map(task => ({ id: task.id, kind: task.kind, status: task.status, to: task.to, blockingReasons: task.blockingReasons })),
    blockers,
    ready: blockers.length === 0
  };
}

export type RailMemberView = ReturnType<typeof memberView>;

export interface RailBatchView extends RailBatch {
  members: RailMemberView[];
  activeMembers: RailMemberView[];
  readyCount: number;
  missingYard: { containerId: string; blockers: string[] }[];
  missingStation: { containerId: string; state: RailMemberState }[];
  blockers: string[];
  warnings: string[];
  canSeal: boolean;
  canDepart: boolean;
  frozen: boolean;
}

export function railBatchView(batch: RailBatch): RailBatchView {
  const members = batch.members.map(member => memberView(batch, member));
  const activeMembers = members.filter(member => member.state !== 'pulled');
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (new Date(batch.windowEnd) <= new Date(batch.windowStart)) blockers.push('铁路窗口结束时间必须晚于开始时间');
  if (!activeMembers.length) blockers.push('批次内没有有效箱（全部撤出或从未加入）');

  const unsealLabel = batch.activeUnseal ? RAIL_UNSEAL_LABEL[batch.activeUnseal.reason] : '';
  for (const member of activeMembers) {
    const prefix = `箱 ${member.containerId}`;
    member.blockers.forEach(reason => blockers.push(`${prefix}：${reason}`));
    if (member.state === 'intercepted') blockers.push(`${prefix}：海关查验拦截，待处置（放行或撤出）`);
  }
  if (batch.activeUnseal) {
    warnings.push(`批次已按「${unsealLabel}」解封，修正箱单后必须重新封批；解封原因：${batch.activeUnseal.note}`);
    const reblock: string[] = [];
    for (const member of activeMembers) member.blockers.forEach(reason => reblock.push(`箱 ${member.containerId}：${reason}`));
    blockers.length = 0; blockers.push(...reblock);
  }
  // 发运前的铁路闸口集结检查（封批阶段只预警，真正放行在 depart）
  if (batch.status === 'draft' || (batch.status === 'sealed' && !batch.departedAt)) {
    for (const member of activeMembers) {
      if (member.state === 'at-gate' || member.state === 'on-rail' || member.state === 'arrived') continue;
      const appointment = member.appointment;
      if (appointment && appointment.status === 'booked') warnings.push(`箱 ${member.containerId} 的铁路预约 ${appointment.id} 尚未签到，装车前必须完成铁路闸口集结`);
    }
  }
  if (batch.status === 'draft' && activeMembers.some(m => m.state === 'arrived' || m.state === 'on-rail')) {
    warnings.push('批次尚未封批却已有在途/到站箱，请核对批次归属');
  }

  const readyCount = activeMembers.filter(member => member.ready).length;
  const missingYard = activeMembers
    .filter(member => member.state === 'pending' || member.state === 'at-gate')
    .filter(member => !member.ready)
    .map(member => ({ containerId: member.containerId, blockers: member.blockers }));
  const missingStation = batch.status === 'in-transit'
    ? activeMembers.filter(member => member.state === 'on-rail').map(member => ({ containerId: member.containerId, state: member.state }))
    : [];

  const frozen = isFrozen(batch);
  const canSeal = (batch.status === 'draft' || Boolean(batch.activeUnseal))
    && blockers.length === 0
    && activeMembers.every(member => member.state === 'pending' || member.state === 'at-gate');
  const canDepart = (batch.status === 'sealed' || (batch.status === 'in-transit' && !batch.departedAt))
    && !batch.activeUnseal
    && activeMembers.length > 0
    && activeMembers.every(member => member.state !== 'intercepted' && member.state !== 'pulled')
    && activeMembers.every(member => {
      const appointment = member.appointment;
      return !appointment || (appointment.lane === 'rail' && appointment.status !== 'booked' && appointment.status !== 'cancelled' && appointment.status !== 'exception');
    });

  return { ...batch, members, activeMembers, readyCount, missingYard, missingStation, blockers, warnings, canSeal, canDepart, frozen };
}

export function listRailBatches() { return railBatches.map(railBatchView); }
export function railBatchDetail(id: string) { const batch = getBatch(id); return batch ? railBatchView(batch) : undefined; }

export interface RailCandidate {
  containerId: string;
  status: string;
  direction: string;
  customs: string;
  yardSlot: string;
  appointmentId?: string;
  appointmentLane?: string;
  appointmentStatus?: string;
  taskIds: string[];
  blockers: string[];
  inBatchId?: string;
}

// 从箱务台账、铁路预约、场内任务三个来源汇总可加入铁路批次的箱子
export function railCandidates(): RailCandidate[] {
  const byId = new Map<string, RailCandidate>();
  const ensure = (containerId: string) => {
    let item = byId.get(containerId);
    if (!item) {
      const container = containers.find(entry => entry.id === containerId);
      item = {
        containerId, status: container?.status ?? 'unknown', direction: container?.direction ?? 'unknown',
        customs: container?.customs ?? 'unknown', yardSlot: container?.yardSlot ?? '-',
        appointmentId: container?.appointmentId,
        appointmentLane: appointments.find(a => a.id === container?.appointmentId)?.lane,
        appointmentStatus: appointments.find(a => a.id === container?.appointmentId)?.status,
        taskIds: tasks.filter(t => t.containerId === containerId && t.status !== 'done').map(t => t.id),
        blockers: container ? railBlockers(container) : ['箱务台账中找不到该箱']
      };
      byId.set(containerId, item);
    }
    return item;
  };
  containers.filter(c => c.direction === 'export' && !['released', 'on-quay'].includes(c.status)).forEach(c => ensure(c.id));
  appointments.filter(a => a.lane === 'rail').forEach(a => { const item = ensure(a.containerId); item.appointmentId = a.id; item.appointmentLane = a.lane; item.appointmentStatus = a.status; });
  tasks.filter(t => t.to.includes('铁路') || t.to.toLowerCase().includes('rail')).forEach(t => ensure(t.containerId).taskIds.push(t.id));
  for (const batch of railBatches.filter(b => ACTIVE_RAIL_STATUS.includes(b.status))) {
    batch.members.filter(m => m.state !== 'pulled').forEach(m => { const item = byId.get(m.containerId); if (item) item.inBatchId = batch.id; });
  }
  return [...byId.values()].sort((a, b) => a.containerId.localeCompare(b.containerId));
}

export interface RailBatchInput {
  trainNo: string;
  originStation?: string;
  destStation: string;
  windowStart: string;
  windowEnd: string;
  lane?: string;
  containerIds?: string[];
  appointmentIds?: string[];
  taskIds?: string[];
}

// 从现有箱务、预约、场内任务中创建铁路批次（重复来源自动去重）
export function createRailBatch(input: RailBatchInput) {
  const trainNo = input.trainNo?.trim();
  if (!trainNo) throw new Error('列车车次不能为空');
  if (!input.destStation?.trim()) throw new Error('到站不能为空');
  if (new Date(input.windowEnd) <= new Date(input.windowStart)) throw new Error('铁路窗口结束时间必须晚于开始时间');
  if (railBatches.some(batch => batch.trainNo === trainNo && ACTIVE_RAIL_STATUS.includes(batch.status))) {
    throw new Error(`车次 ${trainNo} 已有在途或未完成批次，同一车次不能重复建批`);
  }
  const ordered: { containerId: string; source: RailMember['source']; refId?: string }[] = [];
  const seen = new Set<string>();
  const push = (containerId: string, source: RailMember['source'], refId?: string) => {
    const normalized = containerId?.trim().toUpperCase();
    if (!normalized) return;
    if (seen.has(normalized)) return;
    seen.add(normalized);
    ordered.push({ containerId: normalized, source, refId });
  };
  (input.appointmentIds ?? []).forEach(id => {
    const appointment = appointments.find(item => item.id === id);
    if (!appointment) throw new Error(`预约 ${id} 不存在`);
    push(appointment.containerId, 'appointment', id);
  });
  (input.taskIds ?? []).forEach(id => {
    const task = tasks.find(item => item.id === id);
    if (!task) throw new Error(`场内任务 ${id} 不存在`);
    push(task.containerId, 'task', id);
  });
  (input.containerIds ?? []).forEach(id => push(id, 'container'));
  if (!ordered.length) throw new Error('批次至少要从箱务、预约或场内任务中选择一个箱子');

  const batch: RailBatch = {
    id: nextRailBatchId(), trainNo,
    originStation: input.originStation?.trim() || '上海芦潮港站', destStation: input.destStation.trim(),
    windowStart: input.windowStart, windowEnd: input.windowEnd, lane: input.lane?.trim() || 'R1',
    status: 'draft', members: [], unsealHistory: [], lastEvent: '批次创建（集结中）'
  };
  const rejected: { containerId: string; reason: string }[] = [];
  for (const entry of ordered) {
    const result = joinRailBatchInternal(batch, entry.containerId, entry.source, entry.refId);
    if (result.outcome === 'rejected') rejected.push({ containerId: entry.containerId, reason: result.reason });
  }
  railBatches.unshift(batch);
  railAudit('RAIL_CREATE', batch.id, `创建车次 ${trainNo} → ${batch.destStation} 的铁路批次，加入 ${batch.members.length} 箱${rejected.length ? `，拒绝 ${rejected.length} 箱` : ''}`);
  return { batch: railBatchView(batch), rejected };
}

export interface RailScanResult {
  outcome: 'joined' | 'already-in-batch' | 'reactivated' | 'rejected';
  batchId: string;
  containerId: string;
  reason: string;
  memberState?: RailMemberState;
}

function joinRailBatchInternal(batch: RailBatch, containerId: string, source: RailMember['source'], refId?: string): RailScanResult {
  const container = containers.find(item => item.id === containerId);
  if (!container) return { outcome: 'rejected', batchId: batch.id, containerId, reason: `箱号 ${containerId} 不存在于箱务台账` };
  const existing = batch.members.find(member => member.containerId === containerId);
  if (existing) {
    if (existing.state !== 'pulled') {
      return { outcome: 'already-in-batch', batchId: batch.id, containerId, reason: `重复扫描：${containerId} 已在批次 ${batch.id} 中（状态 ${existing.state}），忽略本次扫描`, memberState: existing.state };
    }
    existing.state = container.status === 'at-gate' ? 'at-gate' : 'pending';
    existing.source = source; existing.refId = refId; existing.addedAt = railNow();
    existing.arrivedAt = undefined; existing.note = undefined;
    return { outcome: 'reactivated', batchId: batch.id, containerId, reason: `${containerId} 曾撤出本批，已重新加入`, memberState: existing.state };
  }
  const other = railBatches.find(item => item.id !== batch.id && ACTIVE_RAIL_STATUS.includes(item.status) && item.members.some(member => member.containerId === containerId && member.state !== 'pulled'));
  if (other) return { outcome: 'rejected', batchId: batch.id, containerId, reason: `${containerId} 已被在途/未完成批次 ${other.id}（${other.trainNo}）接管，需先从原批次撤出` };
  if (container.direction !== 'export') return { outcome: 'rejected', batchId: batch.id, containerId, reason: `${containerId} 流向为 ${container.direction}，铁路出口班列只接管出口箱` };
  if (['released', 'on-quay'].includes(container.status)) return { outcome: 'rejected', batchId: batch.id, containerId, reason: `${containerId} 箱状态为 ${container.status}，已离开堆场，不能加入铁路批次` };
  const state: RailMemberState = container.status === 'at-gate' ? 'at-gate' : 'pending';
  batch.members.push({ containerId, state, source, refId, addedAt: railNow() });
  const blockers = railBlockers(container);
  return {
    outcome: 'joined', batchId: batch.id, containerId, memberState: state,
    reason: blockers.length ? `${containerId} 已加入，但存在 ${blockers.length} 项封批阻塞：${blockers.join('；')}` : `${containerId} 已加入批次，满足封批条件`
  };
}

// 铁路闸口/集结区扫描加箱（重复扫描返回明确结果，不报错）
export function scanRailContainer(batchId: string, containerId: string, source: RailMember['source'] = 'appointment', refId?: string) {
  const batch = getBatch(batchId);
  if (!batch) throw new Error(`铁路批次 ${batchId} 不存在`);
  if (isFrozen(batch)) throw new Error(`批次 ${batchId} 已封批，箱单冻结；加箱必须先按查验/箱号不符/窗口变更走解封流程`);
  if (batch.status === 'arrived' || batch.status === 'cancelled') throw new Error(`批次 ${batchId} 已${batch.status === 'arrived' ? '完成到站' : '取消'}，不能再加入箱子`);
  const result = joinRailBatchInternal(batch, containerId.trim().toUpperCase(), source, refId);
  batch.lastEvent = result.outcome === 'already-in-batch' ? `重复扫描 ${containerId}，已忽略` : `扫描加入 ${containerId}`;
  railAudit('RAIL_SCAN', batch.id, result.reason);
  return { ...result, batch: railBatchView(batch) };
}

// 从批次撤出箱子（封批后禁止随意撤出）
export function pullRailContainer(batchId: string, containerId: string, reason: string) {
  const batch = getBatch(batchId);
  if (!batch) throw new Error(`铁路批次 ${batchId} 不存在`);
  if (isFrozen(batch)) throw new Error('封批后不允许随意撤出箱子；如确需调整，请按查验、箱号不符或铁路窗口变更发起解封');
  if (batch.status === 'arrived') throw new Error('批次已完成到站，不能撤箱');
  const member = activeMember(batch, containerId);
  if (!member) throw new Error(`${containerId} 不在批次 ${batchId} 的有效箱单中`);
  member.state = 'pulled';
  member.note = `撤出：${reason || '未注明原因'} @ ${railNow()}`;
  batch.lastEvent = `${containerId} 撤出批次（${reason || '未注明原因'}）`;
  railAudit('RAIL_PULL', batch.id, `${containerId} 撤出：${reason || '未注明原因'}`);
  return railBatchView(batch);
}

// 封批：联动校验流向、海关、铁路车道、场内任务；任一硬阻塞则拒绝封批
export function sealRailBatch(batchId: string, actor = '铁路值班员') {
  const batch = getBatch(batchId);
  if (!batch) throw new Error(`铁路批次 ${batchId} 不存在`);
  if (batch.status === 'sealed' || batch.status === 'in-transit') {
    if (batch.activeUnseal) {
      const view = railBatchView(batch);
      if (view.blockers.length) throw new Error(`仍有 ${view.blockers.length} 项阻塞，不能重新封批：${view.blockers.join('；')}`);
      const unseal = batch.activeUnseal;
      batch.sealedAt = railNow();
      batch.activeUnseal = undefined;
      batch.lastEvent = `按「${RAIL_UNSEAL_LABEL[unseal.reason]}」处置后重新封批`;
      railAudit('RAIL_RESEAL', batch.id, `解封原因「${RAIL_UNSEAL_LABEL[unseal.reason]}」处置完成（${unseal.note}），重新封批`, actor);
      return railBatchView(batch);
    }
    throw new Error(`批次 ${batchId} 已封批，重复封批被忽略`);
  }
  if (batch.status === 'arrived' || batch.status === 'cancelled') throw new Error(`批次已${batch.status === 'arrived' ? '到站完成' : '取消'}，不能封批`);
  const view = railBatchView(batch);
  if (!view.activeMembers.length) throw new Error('空批次不能封批');
  if (view.blockers.length) throw new Error(`封批被阻止（${view.blockers.length} 项）：${view.blockers.join('；')}`);
  batch.status = 'sealed';
  batch.sealedAt = railNow();
  batch.activeUnseal = undefined;
  for (const member of batch.members) {
    if (member.state === 'pending') member.state = 'at-gate';
  }
  batch.lastEvent = `批次封批，${view.activeMembers.length} 箱冻结待发运`;
  railAudit('RAIL_SEAL', batch.id, `封批 ${view.activeMembers.length} 箱（${batch.trainNo} → ${batch.destStation}），箱单冻结`, actor);
  return railBatchView(batch);
}

// 可审计解封：仅允许查验、箱号不符、铁路窗口变更三种原因
export function unsealRailBatch(batchId: string, reason: RailUnsealReason, note: string, actor = '铁路值班员') {
  const batch = getBatch(batchId);
  if (!batch) throw new Error(`铁路批次 ${batchId} 不存在`);
  if (!['customs-inspection', 'id-mismatch', 'rail-window-change'].includes(reason)) throw new Error('解封原因必须是查验、箱号不符或铁路窗口变更之一');
  if (batch.status !== 'sealed' && batch.status !== 'in-transit') throw new Error(`批次状态为 ${batch.status}，只有封批/在途批次需要解封`);
  if (batch.activeUnseal) throw new Error(`批次已处于解封状态（${RAIL_UNSEAL_LABEL[batch.activeUnseal.reason]}），请先处置并重新封批`);
  const record: RailUnsealRecord = { reason, actor, note: note || '未填写处置说明', at: railNow(), refSealAt: batch.sealedAt ?? railNow() };
  batch.activeUnseal = record;
  batch.unsealHistory.push(record);
  batch.lastEvent = `按「${RAIL_UNSEAL_LABEL[reason]}」解封，箱单可受控调整`;
  railAudit('RAIL_UNSEAL', batch.id, `解封原因：${RAIL_UNSEAL_LABEL[reason]}；说明：${record.note}`, actor);
  return railBatchView(batch);
}

// 铁路窗口变更（draft/unsealed 直接改；封批状态必须先走 window-change 解封）
export function updateRailWindow(batchId: string, patch: { windowStart?: string; windowEnd?: string; trainNo?: string; destStation?: string; lane?: string }) {
  const batch = getBatch(batchId);
  if (!batch) throw new Error(`铁路批次 ${batchId} 不存在`);
  if (isFrozen(batch)) throw new Error('封批后窗口已冻结，铁路窗口变更必须先发起「铁路窗口变更」解封并保留审计');
  if (batch.status === 'arrived' || batch.status === 'cancelled') throw new Error('批次已结束，窗口不能再变更');
  const nextStart = patch.windowStart ?? batch.windowStart;
  const nextEnd = patch.windowEnd ?? batch.windowEnd;
  if (new Date(nextEnd) <= new Date(nextStart)) throw new Error('铁路窗口结束时间必须晚于开始时间');
  if (patch.trainNo?.trim() && railBatches.some(other => other.id !== batch.id && other.trainNo === patch.trainNo!.trim() && ACTIVE_RAIL_STATUS.includes(other.status))) {
    throw new Error(`车次 ${patch.trainNo} 已被其他在途批次占用`);
  }
  Object.assign(batch, {
    windowStart: nextStart, windowEnd: nextEnd,
    ...(patch.trainNo?.trim() ? { trainNo: patch.trainNo.trim() } : {}),
    ...(patch.destStation?.trim() ? { destStation: patch.destStation.trim() } : {}),
    ...(patch.lane?.trim() ? { lane: patch.lane.trim() } : {})
  });
  batch.lastEvent = '铁路窗口/车次信息已更新';
  railAudit('RAIL_WINDOW', batch.id, `窗口/车次变更：${JSON.stringify(patch)}`);
  return railBatchView(batch);
}

// 发运：铁路闸口最终放行（所有有效箱必须已在铁路车道签到，无查验拦截）
export function departRailBatch(batchId: string, actor = '铁路值班员') {
  const batch = getBatch(batchId);
  if (!batch) throw new Error(`铁路批次 ${batchId} 不存在`);
  if (batch.activeUnseal) throw new Error('批次处于解封状态，必须重新封批后才能发运');
  if (batch.status === 'in-transit' && batch.departedAt) throw new Error('批次已经发运，不能重复发运');
  if (batch.status !== 'sealed' && !(batch.status === 'in-transit' && !batch.departedAt)) throw new Error(`批次状态为 ${batch.status}，封批后才能发运`);
  const active = batch.members.filter(member => member.state !== 'pulled');
  const gateProblems = active.filter(member => {
    const appointment = appointments.find(item => item.id === containers.find(c => c.id === member.containerId)?.appointmentId);
    return !appointment || appointment.lane !== 'rail' || ['booked', 'cancelled', 'exception'].includes(appointment.status);
  }).map(member => member.containerId);
  if (gateProblems.length) throw new Error(`铁路闸口未完成集结：${gateProblems.join('、')} 缺少已签到的铁路车道记录`);
  if (active.some(member => member.state === 'intercepted')) throw new Error('存在海关查验拦截箱，必须先处置（放行/撤出）并重新封批');
  batch.status = 'in-transit';
  batch.departedAt = railNow();
  for (const member of active) {
    member.state = 'on-rail';
    const container = containers.find(item => item.id === member.containerId);
    if (container) { container.status = 'in-transit'; container.lastEvent = `${batch.trainNo} 次列车发运，铁路闸口 R1 放行`; }
  }
  batch.lastEvent = `列车发运，${active.length} 箱在途`;
  railAudit('RAIL_DEPART', batch.id, `${batch.trainNo} 发运：${active.length} 箱，铁路闸口放行`, actor);
  return railBatchView(batch);
}

export interface RailArrivalResult {
  outcome: 'arrived' | 'already-arrived' | 'not-a-member' | 'not-in-transit' | 'intercepted';
  batchId: string;
  containerId: string;
  reason: string;
  batchStatus: RailBatchStatus;
  allArrived: boolean;
  arrivedCount: number;
  expectedCount: number;
}

// 到站扫描确认：重复扫描给明确结果；部分到站保持在途；全部到站才关闭批次
export function confirmRailArrival(batchId: string, scannedContainerId: string): RailArrivalResult {
  const batch = getBatch(batchId);
  if (!batch) throw new Error(`铁路批次 ${batchId} 不存在`);
  const containerId = scannedContainerId.trim().toUpperCase();
  const base = (outcome: RailArrivalResult['outcome'], reason: string): RailArrivalResult => {
    const active = batch.members.filter(m => m.state !== 'pulled');
    return {
      outcome, batchId, containerId, reason, batchStatus: batch.status, allArrived: false,
      arrivedCount: active.filter(m => m.state === 'arrived').length, expectedCount: active.length
    };
  };
  if (batch.status !== 'in-transit' && batch.status !== 'arrived') return base('not-in-transit', `批次状态为 ${batch.status}，到站确认只对在途批次有效`);
  const member = activeMember(batch, containerId);
  if (!member) {
    const other = railBatches.find(item => ACTIVE_RAIL_STATUS.includes(item.status) && activeMember(item, containerId));
    return base('not-a-member', other ? `扫描箱 ${containerId} 不属于本批，它在批次 ${other.id}（${other.trainNo}）中，疑似箱号不符` : `扫描箱 ${containerId} 不在本批箱单中，疑似箱号/封志不符`);
  }
  if (member.state === 'arrived') return base('already-arrived', `重复扫描：${containerId} 已于 ${member.arrivedAt} 完成到站确认`);
  if (member.state === 'intercepted') return base('intercepted', `${containerId} 已被海关查验拦截，不能到站确认，等待查验结果`);
  if (batch.activeUnseal) return base('not-in-transit', '批次已解封，箱单未定，不能继续到站确认；请先处置并重新封批');
  if (batch.status !== 'in-transit') return base('not-in-transit', `批次状态为 ${batch.status}，不能继续登记新的到站箱`);
  member.state = 'arrived';
  member.arrivedAt = railNow();
  const container = containers.find(item => item.id === containerId);
  if (container) { container.status = 'released'; container.lastEvent = `${batch.destStation} 到站确认 ${new Date(member.arrivedAt).toLocaleTimeString()}`; }
  const active = batch.members.filter(m => m.state !== 'pulled');
  const arrived = active.filter(m => m.state === 'arrived');
  const allArrived = arrived.length === active.length;
  if (allArrived) {
    batch.status = 'arrived';
    batch.completedAt = railNow();
    batch.lastEvent = `${arrived.length}/${active.length} 全部到站，批次关闭`;
  } else {
    batch.lastEvent = `${containerId} 到站，部分到站 ${arrived.length}/${active.length}，仍缺 ${active.length - arrived.length} 箱`;
  }
  railAudit('RAIL_ARRIVAL', batch.id, `${containerId} 到站确认（${arrived.length}/${active.length}）${allArrived ? '，批次全部到站关闭' : '，批次保持在途'}`);
  return { ...base('arrived', `${containerId} 到站确认成功，当前 ${arrived.length}/${active.length}${allArrived ? '，全部到站，批次关闭' : '，仍有缺箱，批次保持在途'}`), batchStatus: batch.status, allArrived, arrivedCount: arrived.length, expectedCount: active.length };
}

// 海关查验拦截：自动按查验原因解封，箱子进入 intercepted，等待放行或撤出
export function interceptRailContainer(batchId: string, containerId: string, note: string, actor = '海关查验台') {
  const batch = getBatch(batchId);
  if (!batch) throw new Error(`铁路批次 ${batchId} 不存在`);
  const member = activeMember(batch, containerId);
  if (!member) throw new Error(`${containerId} 不在批次 ${batchId} 的有效箱单中`);
  if (!['sealed', 'in-transit'].includes(batch.status) || batch.activeUnseal) {
    if (batch.status !== 'sealed' && batch.status !== 'in-transit') throw new Error(`批次状态为 ${batch.status}，未封批的箱子直接撤出即可，无需查验拦截流程`);
  }
  if (!batch.activeUnseal) {
    const record: RailUnsealRecord = { reason: 'customs-inspection', actor, note: note || '海关查验拦截', at: railNow(), refSealAt: batch.sealedAt ?? railNow() };
    batch.activeUnseal = record;
    batch.unsealHistory.push(record);
  }
  member.state = 'intercepted';
  member.note = `查验拦截：${note || '海关抽中查验'} @ ${railNow()}`;
  const container = containers.find(item => item.id === containerId);
  if (container) { container.customs = 'inspection'; container.status = 'hold'; container.lastEvent = '铁路交接途中被海关查验拦截'; }
  batch.lastEvent = `${containerId} 海关查验拦截，批次解封待处置`;
  railAudit('RAIL_INTERCEPT', batch.id, `${containerId} 海关查验拦截：${note || '海关抽中查验'}；批次自动解封`, actor);
  return railBatchView(batch);
}

// 查验处置：放行回箱单（需海关已放行且无其他阻塞），或撤出
export function resolveRailIntercept(batchId: string, containerId: string, action: 'release' | 'pull', reason: string, actor = '海关查验台') {
  const batch = getBatch(batchId);
  if (!batch) throw new Error(`铁路批次 ${batchId} 不存在`);
  const member = activeMember(batch, containerId);
  if (!member || member.state !== 'intercepted') throw new Error(`${containerId} 不是查验拦截状态，不能按查验流程处置`);
  const container = containers.find(item => item.id === containerId);
  if (action === 'pull') {
    member.state = 'pulled';
    member.note = `查验后撤出：${reason || '查验未通过'} @ ${railNow()}`;
    batch.lastEvent = `${containerId} 查验后撤出批次`;
    railAudit('RAIL_INTERCEPT_PULL', batch.id, `${containerId} 查验后撤出：${reason || '查验未通过'}`, actor);
    // 在途批次：撤出是查验的终态处置。拦截箱已从箱单移除，自动重新封批使剩余箱可以继续到站（审计链保留）
    if (batch.departedAt && batch.status === 'in-transit') {
      const remaining = batch.members.filter(m => m.state !== 'pulled');
      if (!remaining.some(m => m.state === 'intercepted')) {
        batch.activeUnseal = undefined;
        batch.sealedAt = railNow();
        batch.lastEvent = `${containerId} 查验撤出，在途批次自动重新封批，剩余 ${remaining.length} 箱继续运输`;
        railAudit('RAIL_RESEAL', batch.id, `查验撤出后自动重新封批（箱单缩减为 ${remaining.length} 箱），审计链保留`, actor);
      }
    }
  } else {
    if (container && container.customs !== 'released') throw new Error(`${containerId} 海关状态仍为 ${container.customs}，查验放行必须先更新海关放行状态`);
    const blockers = container ? railBlockers(container) : ['箱务台账中找不到该箱'];
    if (blockers.length) throw new Error(`${containerId} 查验放行但仍有阻塞：${blockers.join('；')}`);
    member.state = batch.departedAt ? 'on-rail' : 'at-gate';
    member.note = `查验放行回箱单：${reason || '查验通过'} @ ${railNow()}`;
    if (container) { container.customs = 'released'; container.status = batch.departedAt ? 'in-transit' : 'at-gate'; container.lastEvent = '海关查验通过，回到铁路批次箱单'; }
    batch.lastEvent = `${containerId} 查验放行，回到批次箱单（解封未关闭，需重新封批）`;
    railAudit('RAIL_INTERCEPT_RELEASE', batch.id, `${containerId} 查验放行回箱单：${reason || '查验通过'}；批次仍需重新封批`, actor);
  }
  return railBatchView(batch);
}

// 批次取消：封批/在途批次必须先解封留痕；取消后箱回集结区
export function cancelRailBatch(batchId: string, reason: string, actor = '铁路值班员') {
  const batch = getBatch(batchId);
  if (!batch) throw new Error(`铁路批次 ${batchId} 不存在`);
  if (batch.status === 'arrived' || batch.status === 'cancelled') throw new Error(`批次已${batch.status === 'arrived' ? '到站完成' : '取消'}，不能重复取消`);
  if (isFrozen(batch)) throw new Error('批次已封批，取消属于箱单变更：请先按铁路窗口变更（或查验/箱号不符）发起解封并记录原因');
  const note = reason || '未注明取消原因';
  for (const member of batch.members) {
    if (member.state === 'pulled') continue;
    member.state = 'pulled';
    member.note = `批次取消：${note} @ ${railNow()}`;
    const container = containers.find(item => item.id === member.containerId);
    if (container && container.status === 'in-transit') { container.status = 'in-yard'; container.lastEvent = '铁路批次取消，箱回集结区'; }
  }
  batch.status = 'cancelled';
  batch.cancelledAt = railNow();
  batch.cancelReason = note;
  batch.lastEvent = `批次取消：${note}`;
  railAudit('RAIL_CANCEL', batch.id, `批次取消：${note}`, actor);
  return railBatchView(batch);
}

// 控制台缺箱与阻塞汇总
export function railControlSummary() {
  const views = railBatches.map(railBatchView);
  return {
    total: views.length,
    active: views.filter(b => ACTIVE_RAIL_STATUS.includes(b.status)).length,
    inTransit: views.filter(b => b.status === 'in-transit').length,
    unsealed: views.filter(b => b.activeUnseal).length,
    missingAtStation: views.reduce((sum, b) => sum + b.missingStation.length, 0),
    blockedBatches: views.filter(b => b.blockers.length > 0 || b.missingStation.length > 0 || b.missingYard.length > 0).map(b => ({
      id: b.id, trainNo: b.trainNo, status: b.status,
      missingYard: b.missingYard, missingStation: b.missingStation, blockers: b.blockers
    }))
  };
}

// 单个箱子当前归属的有效铁路批次（供箱务详情联动展示）
export function railBatchForContainer(containerId: string) {
  const batch = railBatches.find(item => ACTIVE_RAIL_STATUS.includes(item.status) && item.members.some(member => member.containerId === containerId && member.state !== 'pulled'));
  if (!batch) return undefined;
  const member = batch.members.find(entry => entry.containerId === containerId);
  return { id: batch.id, trainNo: batch.trainNo, destStation: batch.destStation, status: batch.status, memberState: member?.state, unsealed: Boolean(batch.activeUnseal) };
}
