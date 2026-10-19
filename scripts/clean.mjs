import { rm } from 'node:fs/promises';
await rm('_site', { recursive: true, force: true });
