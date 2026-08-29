#!/usr/bin/env node
import { existsSync, mkdirSync, cpSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const rootDir = resolve(__dirname, '..');
const distDir = resolve(rootDir, 'dist-package');

console.log('======================================================================');
console.log('  EXAM MANAGEMENT SYSTEM - RELEASE DISTRIBUTION PACKAGER');
console.log('======================================================================\n');

try {
  // 1. Clean previous release output
  if (existsSync(distDir)) {
    console.log('[+] Cleaning previous dist-package directory...');
    rmSync(distDir, { recursive: true, force: true });
  }
  mkdirSync(distDir, { recursive: true });

  // 2. Validate prerequisites
  const backendDist = resolve(rootDir, 'backend/dist');
  const frontendNext = resolve(rootDir, 'frontend/.next');

  if (!existsSync(backendDist)) {
    console.warn('[!] backend/dist not found. Please run "npm run build" first.');
  }

  if (!existsSync(frontendNext)) {
    console.warn('[!] frontend/.next not found. Please run "npm run build" first.');
  }

  console.log('[+] Copying Backend production files...');
  const backendTarget = join(distDir, 'backend');
  mkdirSync(backendTarget, { recursive: true });

  if (existsSync(backendDist)) {
    cpSync(backendDist, join(backendTarget, 'dist'), { recursive: true });
  }
  cpSync(resolve(rootDir, 'backend/package.json'), join(backendTarget, 'package.json'));
  if (existsSync(resolve(rootDir, 'backend/package-lock.json'))) {
    cpSync(resolve(rootDir, 'backend/package-lock.json'), join(backendTarget, 'package-lock.json'));
  }
  if (existsSync(resolve(rootDir, 'backend/prisma'))) {
    cpSync(resolve(rootDir, 'backend/prisma'), join(backendTarget, 'prisma'), { recursive: true });
  }
  if (existsSync(resolve(rootDir, 'backend/scripts'))) {
    cpSync(resolve(rootDir, 'backend/scripts'), join(backendTarget, 'scripts'), { recursive: true });
  }
  if (existsSync(resolve(rootDir, 'backend/Dockerfile'))) {
    cpSync(resolve(rootDir, 'backend/Dockerfile'), join(backendTarget, 'Dockerfile'));
  }
  if (existsSync(resolve(rootDir, 'backend/.dockerignore'))) {
    cpSync(resolve(rootDir, 'backend/.dockerignore'), join(backendTarget, '.dockerignore'));
  }

  console.log('[+] Copying Frontend production files...');
  const frontendTarget = join(distDir, 'frontend');
  mkdirSync(frontendTarget, { recursive: true });

  const standaloneDir = resolve(rootDir, 'frontend/.next/standalone');
  if (existsSync(standaloneDir)) {
    cpSync(standaloneDir, frontendTarget, { recursive: true });
    const staticDir = resolve(rootDir, 'frontend/.next/static');
    if (existsSync(staticDir)) {
      mkdirSync(join(frontendTarget, '.next/static'), { recursive: true });
      cpSync(staticDir, join(frontendTarget, '.next/static'), { recursive: true });
    }
  } else if (existsSync(frontendNext)) {
    mkdirSync(join(frontendTarget, '.next'), { recursive: true });
    cpSync(frontendNext, join(frontendTarget, '.next'), { recursive: true });
  }

  if (existsSync(resolve(rootDir, 'frontend/public'))) {
    cpSync(resolve(rootDir, 'frontend/public'), join(frontendTarget, 'public'), { recursive: true });
  }
  cpSync(resolve(rootDir, 'frontend/package.json'), join(frontendTarget, 'package.json'));
  if (existsSync(resolve(rootDir, 'frontend/Dockerfile'))) {
    cpSync(resolve(rootDir, 'frontend/Dockerfile'), join(frontendTarget, 'Dockerfile'));
  }
  if (existsSync(resolve(rootDir, 'frontend/.dockerignore'))) {
    cpSync(resolve(rootDir, 'frontend/.dockerignore'), join(frontendTarget, '.dockerignore'));
  }

  console.log('[+] Copying deploy folder, Docker compose, and configurations...');
  cpSync(resolve(rootDir, 'docker-compose.yml'), join(distDir, 'docker-compose.yml'));
  cpSync(resolve(rootDir, '.dockerignore'), join(distDir, '.dockerignore'));
  cpSync(resolve(rootDir, '.env.example'), join(distDir, '.env.example'));

  // Copy organized deploy folder
  mkdirSync(join(distDir, 'deploy'), { recursive: true });
  cpSync(resolve(rootDir, 'deploy/windows'), join(distDir, 'deploy/windows'), { recursive: true });
  cpSync(resolve(rootDir, 'deploy/linux'), join(distDir, 'deploy/linux'), { recursive: true });

  // Create clean production root package.json for package distribution
  const rootPkg = {
    name: 'exam-management-system-dist',
    version: '1.0.0',
    private: true,
    scripts: {
      'db:migrate': 'npx --prefix backend prisma migrate deploy',
      'db:seed': 'npm run seed --prefix backend',
      'start:backend': 'node backend/dist/src/main.js',
      'start:frontend': 'node frontend/server.js',
      'start': 'concurrently -n \"BACKEND,FRONTEND\" -c \"blue,green\" \"npm run start:backend\" \"npm run start:frontend\"',
      'docker:up': 'docker compose up -d',
      'docker:down': 'docker compose down'
    },
    dependencies: {
      concurrently: '^8.2.2'
    }
  };
  writeFileSync(join(distDir, 'package.json'), JSON.stringify(rootPkg, null, 2), 'utf-8');

  // Copy docs
  const guideSrc = resolve(rootDir, 'docs/HUONG-DAN-CAI-DAT-WINDOWS-LINUX.md');
  if (existsSync(guideSrc)) {
    writeFileSync(join(distDir, 'HUONG-DAN-CAI-DAT.md'), readFileSync(guideSrc, 'utf-8'), 'utf-8');
  }

  console.log('\n======================================================================');
  console.log('  [SUCCESS] RELEASE PACKAGE CREATED AT:');
  console.log(`  ${distDir}`);
  console.log('======================================================================\n');
} catch (error) {
  console.error('[ERROR] Packaging failed:', error);
  process.exit(1);
}
