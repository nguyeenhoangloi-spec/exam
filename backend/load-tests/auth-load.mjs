#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { performance } from 'node:perf_hooks';
import { setTimeout as sleep } from 'node:timers/promises';

const DEFAULTS = {
  baseUrl: process.env.LOAD_BASE_URL || 'http://localhost:3001',
  scenario: process.env.LOAD_SCENARIO || 'login-once',
  vus: Number(process.env.LOAD_VUS || 10),
  durationMs: parseDuration(process.env.LOAD_DURATION || '30s'),
  timeoutMs: Number(process.env.LOAD_TIMEOUT_MS || 10_000),
  thinkMs: Number(process.env.LOAD_THINK_MS || 1_000),
};

function parseDuration(value) {
  const match = String(value).trim().match(/^(\d+(?:\.\d+)?)(ms|s|m)$/i);
  if (!match) throw new Error(`Thời lượng không hợp lệ: ${value}. Dùng dạng 500ms, 30s hoặc 5m.`);
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  return unit === 'ms' ? amount : unit === 's' ? amount * 1_000 : amount * 60_000;
}

function parseArgs(argv) {
  const options = { ...DEFAULTS };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--help' || token === '-h') options.help = true;
    else if (token === '--allow-high-load') options.allowHighLoad = true;
    else if (token === '--allow-production') options.allowProduction = true;
    else if (token.startsWith('--')) {
      const [rawKey, inlineValue] = token.slice(2).split('=', 2);
      const key = rawKey.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      const value = inlineValue ?? argv[++index];
      if (value === undefined) throw new Error(`Thiếu giá trị cho --${rawKey}.`);
      if (key === 'duration') options.durationMs = parseDuration(value);
      else if (key === 'vus' || key === 'timeoutMs' || key === 'thinkMs') options[key] = Number(value);
      else options[key] = value;
    } else {
      throw new Error(`Tham số không hỗ trợ: ${token}`);
    }
  }
  return options;
}

function printHelp() {
  console.log(`
Auth load runner (Node.js built-in fetch)

Ví dụ:
  node backend/load-tests/auth-load.mjs \\
    --users-file C:\\secure\\exam-load-users.json \\
    --scenario login-once --vus 10 --duration 30s

Tùy chọn:
  --users-file       File JSON chứa tài khoản kiểm thử (bắt buộc)
  --base-url         Backend URL, mặc định http://localhost:3001
  --scenario         login-once | auth-cycle, mặc định login-once
  --vus              Số virtual users, mặc định 10
  --duration         500ms | 30s | 5m, mặc định 30s
  --timeout-ms       Timeout mỗi request, mặc định 10000
  --think-ms         Thời gian nghỉ giữa chu kỳ, mặc định 1000
  --allow-high-load  Cho phép trên 100 VU (mặc định bị chặn)
  --allow-production Cho phép URL không phải localhost/127.0.0.1

Tài khoản không được ghi trực tiếp vào source hoặc log. File tài khoản nên đặt
ngoài repository và chỉ dùng trên môi trường kiểm thử.
`);
}

function assertOptions(options) {
  if (!Number.isInteger(options.vus) || options.vus < 1) throw new Error('--vus phải là số nguyên dương.');
  if (options.vus > 5000) throw new Error('--vus tối đa là 5000 để tránh chạy nhầm tải ngoài ý muốn.');
  if (options.vus > 100 && !options.allowHighLoad) {
    throw new Error('Tải trên 100 VU cần thêm --allow-high-load sau khi đã xác nhận môi trường staging.');
  }
  if (!Number.isFinite(options.durationMs) || options.durationMs < 100) throw new Error('--duration phải tối thiểu 100ms.');
  if (!['login-once', 'auth-cycle'].includes(options.scenario)) {
    throw new Error('--scenario chỉ hỗ trợ login-once hoặc auth-cycle.');
  }
  const url = new URL(options.baseUrl);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('--base-url phải dùng http hoặc https.');
  if (!options.allowProduction && !['localhost', '127.0.0.1', '::1'].includes(url.hostname)) {
    throw new Error('URL không phải máy cục bộ. Dùng --allow-production chỉ khi đã xác nhận đây là staging.');
  }
}

async function loadUsers(filePath) {
  if (!filePath) throw new Error('Thiếu --users-file. Không dùng tài khoản production cho bài tải.');
  const raw = await readFile(filePath, 'utf8');
  const parsed = JSON.parse(raw);
  const users = Array.isArray(parsed) ? parsed : parsed.users;
  if (!Array.isArray(users) || users.length === 0) throw new Error('Users file phải là mảng tài khoản kiểm thử không rỗng.');
  for (const [index, user] of users.entries()) {
    if (!user || typeof user.username !== 'string' || !user.username || typeof user.password !== 'string' || !user.password) {
      throw new Error(`Tài khoản kiểm thử tại vị trí ${index} thiếu username hoặc password.`);
    }
  }
  return users;
}

class CookieJar {
  constructor() {
    this.cookies = new Map();
  }

  update(response) {
    const setCookies = typeof response.headers.getSetCookie === 'function'
      ? response.headers.getSetCookie()
      : (response.headers.get('set-cookie') ? [response.headers.get('set-cookie')] : []);
    for (const setCookie of setCookies) {
      const firstPart = setCookie.split(';', 1)[0];
      const separator = firstPart.indexOf('=');
      if (separator <= 0) continue;
      const name = firstPart.slice(0, separator).trim();
      const value = firstPart.slice(separator + 1).trim();
      if (!value) this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
  }

  header() {
    return [...this.cookies.entries()].map(([name, value]) => `${name}=${value}`).join('; ');
  }
}

class Metrics {
  constructor() {
    this.startedAt = new Date().toISOString();
    this.total = 0;
    this.ok = 0;
    this.failed = 0;
    this.statuses = new Map();
    this.endpoints = new Map();
    this.latencies = [];
  }

  record(endpoint, status, durationMs) {
    this.total += 1;
    if (status >= 200 && status < 400) this.ok += 1;
    else this.failed += 1;
    this.statuses.set(String(status), (this.statuses.get(String(status)) || 0) + 1);
    const endpointStats = this.endpoints.get(endpoint) || { total: 0, ok: 0, failed: 0, latencies: [] };
    endpointStats.total += 1;
    if (status >= 200 && status < 400) endpointStats.ok += 1;
    else endpointStats.failed += 1;
    if (endpointStats.latencies.length < 50_000) endpointStats.latencies.push(durationMs);
    this.endpoints.set(endpoint, endpointStats);
    if (this.latencies.length < 200_000) this.latencies.push(durationMs);
  }

  percentile(values, percentile) {
    if (!values.length) return null;
    const ordered = [...values].sort((a, b) => a - b);
    const index = Math.min(ordered.length - 1, Math.ceil((percentile / 100) * ordered.length) - 1);
    return Number(ordered[index].toFixed(2));
  }

  summary(metadata) {
    const endpoints = {};
    for (const [endpoint, stats] of this.endpoints.entries()) {
      endpoints[endpoint] = {
        total: stats.total,
        ok: stats.ok,
        failed: stats.failed,
        p50Ms: this.percentile(stats.latencies, 50),
        p95Ms: this.percentile(stats.latencies, 95),
        p99Ms: this.percentile(stats.latencies, 99),
      };
    }
    return {
      ...metadata,
      startedAt: this.startedAt,
      finishedAt: new Date().toISOString(),
      totalRequests: this.total,
      successfulRequests: this.ok,
      failedRequests: this.failed,
      successRate: this.total ? Number(((this.ok / this.total) * 100).toFixed(3)) : 0,
      statuses: Object.fromEntries(this.statuses),
      latencyMs: {
        p50: this.percentile(this.latencies, 50),
        p95: this.percentile(this.latencies, 95),
        p99: this.percentile(this.latencies, 99),
        max: this.latencies.length
          ? Number(this.latencies.reduce((max, value) => Math.max(max, value), 0).toFixed(2))
          : null,
      },
      endpoints,
    };
  }
}

async function request({ baseUrl, endpoint, method = 'GET', token, jar, body, timeoutMs, metrics }) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const cookie = jar?.header();
  if (cookie) headers.Cookie = cookie;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const started = performance.now();
  let status = 0;
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}${endpoint}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    status = response.status;
    jar?.update(response);
    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = null; }
    const durationMs = performance.now() - started;
    metrics.record(endpoint, status, durationMs);
    return { status, data };
  } catch {
    const durationMs = performance.now() - started;
    metrics.record(endpoint, status, durationMs);
    return { status, data: null };
  } finally {
    clearTimeout(timeout);
  }
}

async function runUser({ id, user, options, metrics, deadline }) {
  const jar = new CookieJar();
  let cycles = 0;
  do {
    const login = await request({
      baseUrl: options.baseUrl,
      endpoint: '/auth/login',
      method: 'POST',
      body: { username: user.username, password: user.password },
      jar,
      timeoutMs: options.timeoutMs,
      metrics,
    });
    if (login.status >= 200 && login.status < 300 && login.data?.accessToken) {
      let token = login.data.accessToken;
      await request({ baseUrl: options.baseUrl, endpoint: '/auth/profile', token, jar, timeoutMs: options.timeoutMs, metrics });
      const refresh = await request({ baseUrl: options.baseUrl, endpoint: '/auth/refresh', method: 'POST', jar, timeoutMs: options.timeoutMs, metrics });
      if (refresh.status >= 200 && refresh.status < 300 && refresh.data?.accessToken) token = refresh.data.accessToken;
      await request({ baseUrl: options.baseUrl, endpoint: '/auth/logout', method: 'POST', token, jar, timeoutMs: options.timeoutMs, metrics });
    }
    cycles += 1;
    if (options.scenario === 'login-once' || Date.now() >= deadline) break;
    if (options.thinkMs > 0) await sleep(options.thinkMs);
  } while (Date.now() < deadline);
  return { id, cycles };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) return printHelp();
  assertOptions(options);
  const users = await loadUsers(options.usersFile);
  if (users.length < options.vus) {
    console.warn(`CẢNH BÁO: ${options.vus} VU nhưng chỉ có ${users.length} tài khoản; tài khoản sẽ được luân phiên.`);
  }
  if (process.env.NODE_ENV === 'production') {
    console.warn('CẢNH BÁO: NODE_ENV=production; rate limit auth có thể làm kết quả capacity bị giới hạn bởi 429.');
  }

  const metrics = new Metrics();
  const started = Date.now();
  const deadline = started + options.durationMs;
  const results = await Promise.all(
    Array.from({ length: options.vus }, (_, id) => runUser({
      id,
      user: users[id % users.length],
      options,
      metrics,
      deadline,
    })),
  );
  const completedCycles = results.reduce((sum, result) => sum + result.cycles, 0);
  console.log(JSON.stringify(metrics.summary({
    baseUrl: options.baseUrl,
    scenario: options.scenario,
    vus: options.vus,
    requestedDurationMs: options.durationMs,
    actualDurationMs: Date.now() - started,
    completedCycles,
    usersAvailable: users.length,
  }), null, 2));
}

main().catch((error) => {
  console.error(`LOAD_TEST_ERROR: ${error.message}`);
  process.exitCode = 1;
});
