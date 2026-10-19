import {execFileSync} from 'node:child_process';
execFileSync(process.execPath,['scripts/clean.mjs'],{stdio:'inherit'});
execFileSync(process.execPath,['node_modules/@11ty/eleventy/cmd.cjs'],{stdio:'inherit',env:{...process.env,CONTEXT:'deploy-preview',ALLOW_INDEXING:'false',ENABLE_CONTACT:'true',CONTACT_FORM_NAME:'1234567890abcdef'.repeat(2)}});
