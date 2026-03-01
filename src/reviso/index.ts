export type {
  RevisoDocument,
  RevisoPage,
  RevisoRegion,
  RevisoProps,
} from './types/public';

export {
  toInternalDocument,
  toInternalPage,
  toInternalRegion,
  toPublicDocument,
  toPublicPage,
  toPublicRegion,
} from './utils/typeMappers';

export { Reviso } from './Reviso';
