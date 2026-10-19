import 'server-only';

/** Data-only public API for cross-feature repositories (no Server Actions). */
export {
  archiveArea,
  createArea,
  deleteArea,
  getArea,
  listAreas,
  moveArea,
  unarchiveArea,
  updateArea,
  type Area,
  type AreaWriteResult,
} from './infra';
