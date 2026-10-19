import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { auth, requireUserId } from '@/features/auth/server';
import { DELETE, PATCH } from '@/app/api/medications/[id]/route';
import { GET as listMedicationsRoute, POST } from '@/app/api/medications/route';
import { PUT } from '@/app/api/medication-logs/[date]/route';
import { GET as listLogs } from '@/app/api/medication-logs/route';
import { createUserFixtures } from '@/test/fixtures';
import { createMedication, listMedications } from '../infra';

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
  mockedAuth.mockResolvedValue({ user: { id: userId } });
}

function idContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

function dateContext(date: string) {
  return { params: Promise.resolve({ date }) };
}

const body = {
  name: 'Losartana',
  instructions: null,
  frequencyKind: 'daily' as const,
  weekdays: null,
  times: ['08:00'],
  startsOn: '2020-03-01',
};

describe('medication route handlers', () => {
  it('returns 401 without a session and does not call requireUserId', async () => {
    mockedAuth.mockResolvedValue(null);
    const response = await listMedicationsRoute();
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'unauthorized' });
    expect(mockedRequireUserId).not.toHaveBeenCalled();
  });

  it('rejects a dose and does not create a row', async () => {
    const userId = await fixtures.createUser();
    asUser(userId);
    const response = await POST(
      new Request('http://localhost/api/medications', {
        method: 'POST',
        body: JSON.stringify({ ...body, doseAmount: 50 }),
      }),
    );
    expect(response.status).toBe(400);
    expect(await listMedications(userId)).toEqual({ active: [], archived: [] });
  });

  it('returns pending occurrences for a day without logs', async () => {
    const userId = await fixtures.createUser();
    asUser(userId);
    await createMedication(userId, {
      ...body,
      instructions: 'anotação minha',
    });
    const response = await listLogs(
      new Request('http://localhost/api/medication-logs?date=2020-03-01'),
    );
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.occurrences).toEqual([
      expect.objectContaining({
        name: 'Losartana',
        scheduledTime: '08:00',
        status: 'pending',
        takenAt: null,
      }),
    ]);
  });

  it('rejects a future date without writing', async () => {
    const userId = await fixtures.createUser();
    asUser(userId);
    const medication = await createMedication(userId, body);
    const response = await PUT(
      new Request('http://localhost/api/medication-logs/2099-01-01', {
        method: 'PUT',
        body: JSON.stringify({
          logs: [
            {
              medicationId: medication.id,
              scheduledTime: '08:00',
              status: 'done',
            },
          ],
        }),
      }),
      dateContext('2099-01-01'),
    );
    expect(response.status).toBe(400);
    const listed = await listLogs(
      new Request(
        'http://localhost/api/medication-logs?from=2099-01-01&to=2099-01-01',
      ),
    );
    expect(await listed.json()).toEqual({ logs: [] });
  });

  it('rejects an inverted range, a mixed query, and a span over 366 days', async () => {
    const userId = await fixtures.createUser();
    asUser(userId);
    const inverted = await listLogs(
      new Request(
        'http://localhost/api/medication-logs?from=2020-05-02&to=2020-05-01',
      ),
    );
    expect(inverted.status).toBe(400);
    const mixed = await listLogs(
      new Request(
        'http://localhost/api/medication-logs?date=2020-03-01&from=2020-03-01&to=2020-03-02',
      ),
    );
    expect(mixed.status).toBe(400);
    const wide = await listLogs(
      new Request(
        'http://localhost/api/medication-logs?from=2020-01-01&to=2021-01-02',
      ),
    );
    expect(wide.status).toBe(400);
  });

  it('returns only stored logs in a range', async () => {
    const userId = await fixtures.createUser();
    asUser(userId);
    const medication = await createMedication(userId, body);
    const saved = await PUT(
      new Request('http://localhost/api/medication-logs/2020-04-01', {
        method: 'PUT',
        body: JSON.stringify({
          logs: [
            {
              medicationId: medication.id,
              scheduledTime: '08:00',
              status: 'done',
            },
          ],
        }),
      }),
      dateContext('2020-04-01'),
    );
    expect(saved.status).toBe(200);
    const response = await listLogs(
      new Request(
        'http://localhost/api/medication-logs?from=2020-04-01&to=2020-04-03',
      ),
    );
    const json = await response.json();
    expect(json.logs).toHaveLength(1);
    expect(json.logs[0]).toMatchObject({
      entryDate: '2020-04-01',
      status: 'done',
    });
    expect(json.logs.some((log: { status: string }) => log.status === 'not_done')).toBe(
      false,
    );
  });

  it('updates and deletes only the session user medication', async () => {
    const userA = await fixtures.createUser();
    const userB = await fixtures.createUser();
    const medB = await createMedication(userB, { ...body, name: 'De B' });
    asUser(userA);
    const missing = await PATCH(
      new Request('http://localhost/api/medications/x', {
        method: 'PATCH',
        body: JSON.stringify({ ...body, name: 'Invadiu' }),
      }),
      idContext(medB.id),
    );
    expect(missing.status).toBe(404);
    const removed = await DELETE(
      new Request('http://localhost/api/medications/x', { method: 'DELETE' }),
      idContext(medB.id),
    );
    expect(removed.status).toBe(404);
    expect((await listMedications(userB)).active[0]?.name).toBe('De B');
  });
});
