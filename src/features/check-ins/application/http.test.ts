import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { auth, requireUserId } from '@/features/auth/server';
import {
  DELETE,
  GET as getByDate,
  PUT,
} from '@/app/api/check-ins/[date]/route';
import { GET as listCheckIns } from '@/app/api/check-ins/route';
import { createUserFixtures } from '@/test/fixtures';

vi.mock('@/features/auth/server', () => ({
  auth: vi.fn(),
  requireUserId: vi.fn(),
}));

const mockedAuth = vi.mocked(auth as () => Promise<{ user?: { id?: string } } | null>);
const mockedRequireUserId = vi.mocked(requireUserId);
const fixtures = createUserFixtures();
afterAll(() => fixtures.cleanup());

beforeEach(() => {
  mockedAuth.mockReset();
  mockedRequireUserId.mockReset();
});

function asUser(userId: string) {
  mockedAuth.mockResolvedValue({
    user: { id: userId },
  });
}

function dateContext(date: string) {
  return { params: Promise.resolve({ date }) };
}

describe('check-in route handlers', () => {
  it('returns 401 without a session and does not call requireUserId', async () => {
    mockedAuth.mockResolvedValue(null);
    const response = await getByDate(
      new Request('http://localhost/api/check-ins/2020-01-01'),
      dateContext('2020-01-01'),
    );
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'unauthorized' });
    expect(mockedRequireUserId).not.toHaveBeenCalled();
  });

  it('returns an empty day as 200 and preserves createdAt on upsert', async () => {
    const userId = await fixtures.createUser();
    asUser(userId);

    const empty = await getByDate(
      new Request('http://localhost/api/check-ins/2020-03-01'),
      dateContext('2020-03-01'),
    );
    expect(empty.status).toBe(200);
    expect(await empty.json()).toMatchObject({
      entryDate: '2020-03-01',
      generalNote: null,
      mood: null,
      createdAt: null,
      habitLogs: [],
    });

    const put = (note: string) =>
      PUT(
        new Request('http://localhost/api/check-ins/2020-03-01', {
          method: 'PUT',
          body: JSON.stringify({ generalNote: note, mood: null }),
        }),
        dateContext('2020-03-01'),
      );

    const first = await put('primeira');
    const second = await put('segunda');
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    const firstBody = await first.json();
    const secondBody = await second.json();
    expect(secondBody.generalNote).toBe('segunda');
    expect(secondBody.createdAt).toBe(firstBody.createdAt);
  });

  it('rejects a future date and detailed fields', async () => {
    const userId = await fixtures.createUser();
    asUser(userId);

    const future = await PUT(
      new Request('http://localhost/api/check-ins/2099-01-01', {
        method: 'PUT',
        body: JSON.stringify({ mood: 1, generalNote: null }),
      }),
      dateContext('2099-01-01'),
    );
    expect(future.status).toBe(400);

    const detailed = await PUT(
      new Request('http://localhost/api/check-ins/2020-03-02', {
        method: 'PUT',
        body: JSON.stringify({
          mood: 1,
          generalNote: null,
          gratitude: 'obrigado',
        }),
      }),
      dateContext('2020-03-02'),
    );
    expect(detailed.status).toBe(400);
    const followUp = await getByDate(
      new Request('http://localhost/api/check-ins/2020-03-02'),
      dateContext('2020-03-02'),
    );
    expect(await followUp.json()).toMatchObject({ createdAt: null });
  });

  it('lists only dates with data and rejects a bad range', async () => {
    const userId = await fixtures.createUser();
    asUser(userId);
    await PUT(
      new Request('http://localhost/api/check-ins/2020-04-01', {
        method: 'PUT',
        body: JSON.stringify({ generalNote: 'um', mood: null }),
      }),
      dateContext('2020-04-01'),
    );
    await PUT(
      new Request('http://localhost/api/check-ins/2020-04-03', {
        method: 'PUT',
        body: JSON.stringify({ generalNote: 'três', mood: null }),
      }),
      dateContext('2020-04-03'),
    );

    const listed = await listCheckIns(
      new Request(
        'http://localhost/api/check-ins?from=2020-04-01&to=2020-04-03',
      ),
    );
    expect(listed.status).toBe(200);
    const body = await listed.json();
    expect(body.checkIns.map((item: { entryDate: string }) => item.entryDate)).toEqual([
      '2020-04-01',
      '2020-04-03',
    ]);
    expect(JSON.stringify(body)).not.toMatch(/fail|falh/i);

    const inverted = await listCheckIns(
      new Request(
        'http://localhost/api/check-ins?from=2020-05-02&to=2020-05-01',
      ),
    );
    expect(inverted.status).toBe(400);
    expect(await inverted.json()).not.toHaveProperty('checkIns');

    const tooWide = await listCheckIns(
      new Request(
        'http://localhost/api/check-ins?from=2020-01-01&to=2021-01-02',
      ),
    );
    expect(tooWide.status).toBe(400);
  });

  it('deletes with 204 even when the day is already empty', async () => {
    const userId = await fixtures.createUser();
    asUser(userId);
    await PUT(
      new Request('http://localhost/api/check-ins/2020-07-01', {
        method: 'PUT',
        body: JSON.stringify({ generalNote: 'apagar', mood: 2 }),
      }),
      dateContext('2020-07-01'),
    );

    const removed = await DELETE(
      new Request('http://localhost/api/check-ins/2020-07-01', {
        method: 'DELETE',
      }),
      dateContext('2020-07-01'),
    );
    expect(removed.status).toBe(204);

    const again = await DELETE(
      new Request('http://localhost/api/check-ins/2020-07-01', {
        method: 'DELETE',
      }),
      dateContext('2020-07-01'),
    );
    expect(again.status).toBe(204);

    const after = await getByDate(
      new Request('http://localhost/api/check-ins/2020-07-01'),
      dateContext('2020-07-01'),
    );
    expect(await after.json()).toMatchObject({
      createdAt: null,
      habitLogs: [],
    });
  });
});
