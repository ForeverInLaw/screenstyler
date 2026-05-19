import { LocalProjectStore } from './local-project-store';
import type { ProjectStore } from './types';

export const projectStore: ProjectStore = new LocalProjectStore();
