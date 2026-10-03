import express from 'express';
import { appointments, assignTask, blocks, cancelRailBatch, confirmRailArrival, containerDetail, containers, createContainer, createGateAppointment, createRailBatch, createYardTask, dashboard, deleteContainer, deleteGateAppointment, deleteYardTask, departRailBatch, editGateAppointment, equipment, gateConflicts, interceptRailContainer, listRailBatches, prioritizeTasks, pullRailContainer, railBatchDetail, railCandidates, railControlSummary, resolveRailIntercept, scanRailContainer, sealRailBatch, tasks, unsealRailBatch, updateContainer, updateRailWindow, updateYardTask, voyages, yardHeatmap } from './domain.js';
const app = express(); app.use(express.json());
app.get('/api/dashboard', (_req, res) => res.json(dashboard()));
app.get('/api/voyages', (_req, res) => res.json(voyages));
app.get('/api/containers', (req, res) => res.json(req.query.status ? containers.filter(c => c.status === req.query.status) : containers));
app.post('/api/containers', (req, res) => { try { res.status(201).json(createContainer(req.body)); } catch (error) { res.status(409).json({ message: error instanceof Error ? error.message : '创建箱务记录失败' }); } });
app.patch('/api/containers/:id', (req, res) => { try { const result = updateContainer(req.params.id, req.body); if (!result) return res.status(404).json({ message: '箱号不存在' }); res.json(result); } catch (error) { res.status(409).json({ message: error instanceof Error ? error.message : '更新箱务记录失败' }); } });
app.delete('/api/containers/:id', (req, res) => { try { const result = deleteContainer(req.params.id); if (!result) return res.status(404).json({ message: '箱号不存在' }); res.json({ deleted: true, id: result.id }); } catch (error) { res.status(409).json({ message: error instanceof Error ? error.message : '删除箱务记录失败' }); } });
app.get('/api/containers/:id', (req, res) => { const result = containerDetail(req.params.id); if (!result) return res.status(404).json({ message: '箱号不存在' }); res.json(result); });
app.get('/api/yard/heatmap', (_req, res) => res.json(yardHeatmap()));
app.get('/api/yard/blocks', (_req, res) => res.json(blocks));
app.get('/api/gate/appointments', (_req, res) => res.json(appointments));
app.get('/api/gate/conflicts', (_req, res) => res.json(gateConflicts()));
app.post('/api/gate/appointments', (req, res) => { try { res.status(201).json(createGateAppointment(req.body)); } catch (error) { res.status(409).json({ message: error instanceof Error ? error.message : '预约失败' }); } });
app.patch('/api/gate/appointments/:id', (req, res) => { try { const result = editGateAppointment(req.params.id, req.body); if (!result) return res.status(404).json({ message: '预约不存在' }); res.json(result); } catch (error) { res.status(409).json({ message: error instanceof Error ? error.message : '更新预约失败' }); } });
app.delete('/api/gate/appointments/:id', (req, res) => { const result = deleteGateAppointment(req.params.id); if (!result) return res.status(404).json({ message: '预约不存在' }); res.json({ deleted: true, id: result.id }); });
app.get('/api/equipment', (_req, res) => res.json(equipment));
app.get('/api/tasks', (_req, res) => res.json(prioritizeTasks()));
app.post('/api/tasks', (req, res) => { try { res.status(201).json(createYardTask(req.body)); } catch (error) { res.status(409).json({ message: error instanceof Error ? error.message : '创建作业任务失败' }); } });
app.patch('/api/tasks/:id', (req, res) => { try { const result = updateYardTask(req.params.id, req.body); if (!result) return res.status(404).json({ message: '作业任务不存在' }); res.json(result); } catch (error) { res.status(409).json({ message: error instanceof Error ? error.message : '更新作业任务失败' }); } });
app.delete('/api/tasks/:id', (req, res) => { const result = deleteYardTask(req.params.id); if (!result) return res.status(404).json({ message: '作业任务不存在' }); res.json({ deleted: true, id: result.id }); });
app.patch('/api/tasks/:id/assign', (req, res) => { const result = assignTask(req.params.id, req.body.equipmentId); if (!result) return res.status(404).json({ message: '任务或设备不存在' }); res.json(result); });

// 铁路交接批次
app.get('/api/rail/batches', (_req, res) => res.json(listRailBatches()));
app.get('/api/rail/summary', (_req, res) => res.json(railControlSummary()));
app.get('/api/rail/candidates', (_req, res) => res.json(railCandidates()));
app.post('/api/rail/batches', (req, res) => { try { res.status(201).json(createRailBatch(req.body)); } catch (error) { res.status(409).json({ message: error instanceof Error ? error.message : '创建铁路批次失败' }); } });
app.get('/api/rail/batches/:id', (req, res) => { const result = railBatchDetail(req.params.id); if (!result) return res.status(404).json({ message: '铁路批次不存在' }); res.json(result); });
// 集结区/铁路闸口扫描加箱：重复扫描返回 200 + outcome，业务硬错误返回 409
app.post('/api/rail/batches/:id/scan', (req, res) => {
  try {
    const result = scanRailContainer(req.params.id, String(req.body.containerId ?? ''), req.body.source ?? 'appointment', req.body.refId);
    res.status(result.outcome === 'rejected' ? 409 : 200).json(result);
  } catch (error) { res.status(409).json({ message: error instanceof Error ? error.message : '扫描加箱失败' }); }
});
app.post('/api/rail/batches/:id/pull', (req, res) => { try { res.json(pullRailContainer(req.params.id, String(req.body.containerId ?? ''), String(req.body.reason ?? ''))); } catch (error) { res.status(409).json({ message: error instanceof Error ? error.message : '撤出失败' }); } });
app.post('/api/rail/batches/:id/seal', (req, res) => { try { res.json(sealRailBatch(req.params.id, req.body?.actor)); } catch (error) { res.status(409).json({ message: error instanceof Error ? error.message : '封批失败' }); } });
app.post('/api/rail/batches/:id/unseal', (req, res) => { try { res.json(unsealRailBatch(req.params.id, req.body.reason, String(req.body.note ?? ''), req.body.actor)); } catch (error) { res.status(409).json({ message: error instanceof Error ? error.message : '解封失败' }); } });
app.patch('/api/rail/batches/:id/window', (req, res) => { try { res.json(updateRailWindow(req.params.id, req.body)); } catch (error) { res.status(409).json({ message: error instanceof Error ? error.message : '窗口变更失败' }); } });
app.post('/api/rail/batches/:id/depart', (req, res) => { try { res.json(departRailBatch(req.params.id, req.body?.actor)); } catch (error) { res.status(409).json({ message: error instanceof Error ? error.message : '发运失败' }); } });
// 到站扫描确认：重复扫描/箱号不符返回 200 + outcome 便于控制台提示，状态不允许返回 409
app.post('/api/rail/batches/:id/arrival', (req, res) => {
  try {
    const result = confirmRailArrival(req.params.id, String(req.body.containerId ?? ''));
    res.status(result.outcome === 'not-in-transit' ? 409 : 200).json(result);
  } catch (error) { res.status(409).json({ message: error instanceof Error ? error.message : '到站确认失败' }); }
});
app.post('/api/rail/batches/:id/intercept', (req, res) => { try { res.json(interceptRailContainer(req.params.id, String(req.body.containerId ?? ''), String(req.body.note ?? ''), req.body.actor)); } catch (error) { res.status(409).json({ message: error instanceof Error ? error.message : '查验拦截失败' }); } });
app.post('/api/rail/batches/:id/intercept/resolve', (req, res) => { try { res.json(resolveRailIntercept(req.params.id, String(req.body.containerId ?? ''), req.body.action === 'pull' ? 'pull' : 'release', String(req.body.reason ?? ''), req.body.actor)); } catch (error) { res.status(409).json({ message: error instanceof Error ? error.message : '查验处置失败' }); } });
app.post('/api/rail/batches/:id/cancel', (req, res) => { try { res.json(cancelRailBatch(req.params.id, String(req.body.reason ?? ''), req.body.actor)); } catch (error) { res.status(409).json({ message: error instanceof Error ? error.message : '批次取消失败' }); } });

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'port-yard-operations' }));
const port = Number(process.env.PORT || 4107); app.listen(port, () => console.log(`port yard API listening on ${port}`));
