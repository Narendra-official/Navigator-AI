import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  fetchIssues,
  getHealth,
  startWorkflowRun,
  exploreRepository,
} from '../lib/api';

describe('Frontend API Client Reliability', () => {
  let lastFetchUrl = '';
  let lastFetchOptions: RequestInit | undefined;
  let mockFetchResponse: Response | null = null;

  beforeEach(() => {
    lastFetchUrl = '';
    lastFetchOptions = undefined;
    mockFetchResponse = null;

    global.fetch = async (url: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      lastFetchUrl = url.toString();
      lastFetchOptions = init;
      if (mockFetchResponse) {
        return mockFetchResponse;
      }
      return new Response(JSON.stringify({ status: 'healthy', app_name: 'OpenSource Navigator AI' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };
  });

  it('formats fetchIssues query parameters accurately', async () => {
    mockFetchResponse = new Response(
      JSON.stringify({
        total_count: 1,
        items: [],
        page: 2,
        per_page: 15,
        total_pages: 1,
        rate_limited: false,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

    const res = await fetchIssues({
      q: 'good first issue',
      language: 'python',
      label: 'bug',
      repo: 'pallets/flask',
      page: 2,
      per_page: 15,
      sort: 'created',
    });

    assert.equal(res.page, 2);
    assert.ok(lastFetchUrl.includes('/api/v1/issues'));
    assert.ok(lastFetchUrl.includes('language=python'));
    assert.ok(lastFetchUrl.includes('label=bug'));
    assert.ok(lastFetchUrl.includes('repo=pallets%2Fflask'));
    assert.ok(lastFetchUrl.includes('page=2'));
    assert.ok(lastFetchUrl.includes('per_page=15'));
  });

  it('handles rate-limited responses with reset info', async () => {
    mockFetchResponse = new Response(
      JSON.stringify({
        detail: {
          message: 'GitHub API rate limit exceeded.',
          rate_limit_reset: 1729900000,
        },
      }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );

    const res = await fetchIssues({ q: 'test' });
    assert.equal(res.rate_limited, true);
    assert.equal(res.rate_limit_reset, 1729900000);
    assert.ok(res.message?.includes('rate limit'));
  });

  it('starts workflow run with typed input payload', async () => {
    mockFetchResponse = new Response(
      JSON.stringify({
        run_id: 'run-direct-456',
        target_agent: 'issue_understanding',
        status: 'queued',
        created_at: Date.now(),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

    const res = await startWorkflowRun({
      target_agent: 'issue_understanding',
      issue_title: 'Support markdown preview',
      issue_body: 'Add live preview mode in editor',
      repository_name: 'facebook/react',
    });

    assert.equal(res.run_id, 'run-direct-456');
    assert.equal(res.target_agent, 'issue_understanding');
    assert.equal(res.status, 'queued');
    assert.equal(lastFetchOptions?.method, 'POST');
    assert.ok(lastFetchUrl.includes('/api/v1/agents/runs'));
  });

  it('queries health endpoint with no-store cache policy', async () => {
    mockFetchResponse = new Response(
      JSON.stringify({
        status: 'healthy',
        app_name: 'OpenSource Navigator AI',
        version: '1.0.0',
        ollama: { connected: true, configured_model: 'llama3:8b' },
        github: { token_configured: false },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

    const health = await getHealth();
    assert.equal(health.status, 'healthy');
    assert.ok(lastFetchUrl.includes('/api/v1/health'));
    assert.equal(lastFetchOptions?.cache, 'no-store');
  });

  it('explores repository tree and handles 404 cleanly', async () => {
    mockFetchResponse = new Response(
      JSON.stringify({
        detail: 'Repository nonexistent/repo not found on GitHub.',
      }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );

    await assert.rejects(
      async () => {
        await exploreRepository('nonexistent/repo');
      },
      (err: Error) => {
        assert.ok(err.message.includes('not found'));
        return true;
      }
    );
  });
});
