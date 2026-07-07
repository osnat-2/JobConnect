const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../app');

function makeJsonResponse(payload, status = 200) {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: {},
    async json() {
      return payload;
    }
  };
}

test('health endpoint returns ok and correlation id', async () => {
  const app = createApp({
    fetchImpl: async () => makeJsonResponse({ status: 'ok' })
  });

  const server = app.listen(0);
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.status, 'ok');
    assert.ok(response.headers.get('x-correlation-id'));
  } finally {
    server.close();
  }
});

test('kanban aggregation endpoint combines application and candidate data', async () => {
  const app = createApp({
    fetchImpl: async (url) => {
      if (url.includes('/api/Applications/')) {
        return makeJsonResponse({ id: 'app-1', candidateId: 'cand-1', status: 'Submitted' });
      }

      if (url.includes('/api/Candidates/')) {
        return makeJsonResponse({ id: 'cand-1', fullName: 'Ada Lovelace' });
      }

      throw new Error(`Unexpected URL: ${url}`);
    }
  });

  const server = app.listen(0);
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/aggregate/kanban/cand-1`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, {
      application: { id: 'app-1', candidateId: 'cand-1', status: 'Submitted' },
      candidate: { id: 'cand-1', fullName: 'Ada Lovelace' }
    });
  } finally {
    server.close();
  }
});

test('login route proxies credentials to the auth service', async () => {
  const app = createApp({
    fetchImpl: async (url, options) => {
      assert.equal(url, 'http://auth-service:80/api/auth/login');
      assert.equal(options.method, 'POST');
      assert.deepEqual(JSON.parse(options.body), { email: 'user@example.com', password: 'secret123' });
      return makeJsonResponse({ accessToken: 'jwt-token', user: { email: 'user@example.com' } }, 200);
    }
  });

  const server = app.listen(0);
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'user@example.com', password: 'secret123' })
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.accessToken, 'jwt-token');
  } finally {
    server.close();
  }
});

test('auth middleware strips bearer tokens before forwarding downstream', async () => {
  const app = createApp({
    fetchImpl: async (url, options) => {
      assert.equal(options.headers.authorization, undefined);
      assert.equal(options.headers['x-user-id'], 'user-123');
      assert.equal(options.headers['x-user-email'], 'user@example.com');
      assert.equal(options.headers['x-user-roles'], 'recruiter,admin');
      return makeJsonResponse({ ok: true });
    }
  });
  process.env.AUTH_REQUIRED = 'true';

  const server = app.listen(0);
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/jobs/hot`, {
      headers: {
        authorization: 'Bearer incoming-token',
        'x-user-id': 'user-123',
        'x-user-email': 'user@example.com',
        'x-user-roles': 'recruiter,admin'
      }
    });
    assert.equal(response.status, 200);
  } finally {
    server.close();
    delete process.env.AUTH_REQUIRED;
  }
});

test('auth middleware decodes role claims from JWT and forwards them', async () => {
  const payload = Buffer.from(JSON.stringify({ sub: 'user-123', email: 'user@example.com', role: 'Manager' }))
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  const token = `header.${payload}.signature`;

  const app = createApp({
    fetchImpl: async (url, options) => {
      assert.equal(options.headers.authorization, undefined);
      assert.equal(options.headers['x-user-id'], 'user-123');
      assert.equal(options.headers['x-user-email'], 'user@example.com');
      assert.equal(options.headers['x-user-roles'], 'Manager');
      return makeJsonResponse({ ok: true });
    }
  });

  const server = app.listen(0);
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/jobs/hot`, {
      headers: {
        authorization: `Bearer ${token}`
      }
    });
    assert.equal(response.status, 200);
  } finally {
    server.close();
  }
});

test('authentication middleware rejects requests without a bearer token when enabled', async () => {
  const app = createApp({
    fetchImpl: async () => makeJsonResponse({ ok: true })
  });
  process.env.AUTH_REQUIRED = 'true';

  const server = app.listen(0);
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/aggregate/kanban/cand-1`);
    assert.equal(response.status, 401);
  } finally {
    server.close();
    delete process.env.AUTH_REQUIRED;
  }
});

test('authentication middleware accepts a matching bearer token', async () => {
  const app = createApp({
    fetchImpl: async () => makeJsonResponse({ ok: true })
  });
  process.env.AUTH_REQUIRED = 'true';
  process.env.AUTH_TOKEN = 'dev-token';

  const server = app.listen(0);
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/health`, {
      headers: { authorization: 'Bearer dev-token' }
    });
    assert.equal(response.status, 200);
  } finally {
    server.close();
    delete process.env.AUTH_REQUIRED;
    delete process.env.AUTH_TOKEN;
  }
});

test('aggregation endpoint rejects an empty candidate id', async () => {
  const app = createApp({
    fetchImpl: async () => makeJsonResponse({ ok: true })
  });

  const server = app.listen(0);
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/aggregate/kanban/ `);
    const bodyText = await response.text();
    const body = bodyText ? JSON.parse(bodyText) : {};

    assert.equal(response.status, 400);
    assert.equal(body.error, 'invalid_request');
  } finally {
    server.close();
  }
});

test('job endpoint forwards to the job service', async () => {
  const app = createApp({
    fetchImpl: async (url) => {
      if (url.includes('/Jobs/hot')) {
        return makeJsonResponse([{ id: 'job-1', title: 'Engineer' }]);
      }

      throw new Error(`Unexpected URL: ${url}`);
    }
  });

  const server = app.listen(0);
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/jobs/hot?take=1`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, [{ id: 'job-1', title: 'Engineer' }]);
  } finally {
    server.close();
  }
});

test('candidate create route handles a downstream response without a JSON body', async () => {
  const app = createApp({
    fetchImpl: async (url, options) => {
      assert.equal(url, 'http://candidate-service:80/api/Candidates');
      assert.equal(options.method, 'POST');
      return {
        status: 201,
        ok: true,
        headers: {},
        async text() {
          return '';
        }
      };
    }
  });

  const server = app.listen(0);
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/candidates`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ FirstName: 'Ada', LastName: 'Lovelace', Email: 'ada@example.com' })
    });

    assert.equal(response.status, 201);
    const body = await response.json();
    assert.deepEqual(body, {});
  } finally {
    server.close();
  }
});

test('aggregation endpoint retries once after a transient downstream failure', async () => {
  let attempts = 0;
  const app = createApp({
    fetchImpl: async (url) => {
      if (url.includes('/api/Applications/')) {
        attempts += 1;
        if (attempts === 1) {
          throw new Error('temporary failure');
        }
        return makeJsonResponse({ id: 'app-1', status: 'Submitted' });
      }

      if (url.includes('/api/Candidates/')) {
        return makeJsonResponse({ id: 'cand-1', fullName: 'Ada Lovelace' });
      }

      throw new Error(`Unexpected URL: ${url}`);
    }
  });

  const server = app.listen(0);
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/aggregate/kanban/cand-1`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(attempts, 2);
    assert.equal(body.application.id, 'app-1');
  } finally {
    server.close();
  }
});
