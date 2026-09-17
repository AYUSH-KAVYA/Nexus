const { getImpact } = require('../src/engine/impact');
const pool = require('../src/config/db');

jest.mock('../src/config/db', () => ({
  query: jest.fn(),
}));

describe('Impact Engine', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const projectId = 'proj-1';
  const mockTasks = [
    { id: 'A', title: 'Task A', status: 'pending', owner_id: 's1', owner_name: 'Alice', owner_role: 'Dev', owner_email: 'a@a.com' },
    { id: 'B', title: 'Task B', status: 'pending', owner_id: 's2', owner_name: 'Bob', owner_role: 'Dev', owner_email: 'b@b.com' },
    { id: 'C', title: 'Task C', status: 'pending', owner_id: 's3', owner_name: 'Charlie', owner_role: 'Dev', owner_email: 'c@c.com' },
    { id: 'D', title: 'Task D', status: 'pending', owner_id: 's4', owner_name: 'Dave', owner_role: 'QA', owner_email: 'd@d.com' },
    { id: 'E', title: 'Task E', status: 'pending', owner_id: 's5', owner_name: 'Eve', owner_role: 'QA', owner_email: 'e@e.com' },
  ];

  function setupMockDB(dependencies, approvals = []) {
    pool.query.mockImplementation((queryStr, values) => {
      if (queryStr.includes('FROM dependencies')) {
        return Promise.resolve({ rows: dependencies });
      }
      if (queryStr.includes('FROM tasks t')) {
        const ids = values[0]; // affectedTaskIds
        return Promise.resolve({
          rows: mockTasks.filter(t => ids.includes(t.id))
        });
      }
      if (queryStr.includes('FROM approvals a')) {
        const ids = values[0];
        return Promise.resolve({
          rows: approvals.filter(a => ids.includes(a.task_id))
        });
      }
      if (queryStr.includes('UPDATE approvals')) {
        return Promise.resolve({ rowCount: 1 });
      }
      return Promise.resolve({ rows: [] });
    });
  }

  it('1. Linear chain: A->B->C', async () => {
    setupMockDB([
      { from_task_id: 'A', to_task_id: 'B' },
      { from_task_id: 'B', to_task_id: 'C' }
    ]);

    const result = await getImpact('A', projectId, { dryRun: true });

    expect(result.affectedTasks).toHaveLength(2); // B, C
    const b = result.affectedTasks.find(t => t.id === 'B');
    const c = result.affectedTasks.find(t => t.id === 'C');
    expect(b.depth).toBe(1);
    expect(c.depth).toBe(2);

    expect(result.directCount).toBe(1);
    expect(result.indirectCount).toBe(1);
    // score = 1 + 0.5 = 1.5 => low
    expect(result.blastRadiusScore).toBe(1.5);
    expect(result.blastRadiusLevel).toBe('low');
  });

  it('2. Branching: A->B, A->C, B->D', async () => {
    setupMockDB([
      { from_task_id: 'A', to_task_id: 'B' },
      { from_task_id: 'A', to_task_id: 'C' },
      { from_task_id: 'B', to_task_id: 'D' }
    ]);

    const result = await getImpact('A', projectId, { dryRun: true });

    expect(result.affectedTasks).toHaveLength(3); // B, C, D
    expect(result.directCount).toBe(2); // B, C
    expect(result.indirectCount).toBe(1); // D
    // score = 2 + 0.5 = 2.5 => low
    expect(result.blastRadiusScore).toBe(2.5);
    expect(result.blastRadiusLevel).toBe('low');
  });

  it('3. With approval gate: A->B with approval on B', async () => {
    setupMockDB(
      [{ from_task_id: 'A', to_task_id: 'B' }],
      [{ id: 'app1', task_id: 'B', required_from: 's2', status: 'approved', task_title: 'Task B', stakeholder_name: 'Bob' }]
    );

    const result = await getImpact('A', projectId, { dryRun: true });

    expect(result.directCount).toBe(1);
    expect(result.approvalGatesReopened).toBe(1);
    // score = 1 + 2 = 3 => medium
    expect(result.blastRadiusScore).toBe(3);
    expect(result.blastRadiusLevel).toBe('medium');
    expect(pool.query).not.toHaveBeenCalledWith(expect.stringContaining('UPDATE approvals'), expect.any(Array));
  });

  it('4. Cycle detection: A->B->C->A', async () => {
    setupMockDB([
      { from_task_id: 'A', to_task_id: 'B' },
      { from_task_id: 'B', to_task_id: 'C' },
      { from_task_id: 'C', to_task_id: 'A' }
    ]);

    const result = await getImpact('A', projectId, { dryRun: true });

    // Should find B, C
    expect(result.affectedTasks).toHaveLength(2);
    expect(result.directCount).toBe(1); // B
    expect(result.indirectCount).toBe(1); // C
  });

  it('5. dryRun=false writes to DB', async () => {
    setupMockDB(
      [{ from_task_id: 'A', to_task_id: 'B' }],
      [{ id: 'app1', task_id: 'B', required_from: 's2', status: 'approved' }]
    );

    await getImpact('A', projectId, { dryRun: false });

    // Should call UPDATE approvals
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE approvals'),
      expect.arrayContaining([['B']])
    );
  });

  it('6. High blast radius: chain with 4+ direct and approval gates', async () => {
    setupMockDB(
      [
        { from_task_id: 'A', to_task_id: 'B' },
        { from_task_id: 'A', to_task_id: 'C' },
        { from_task_id: 'A', to_task_id: 'D' },
        { from_task_id: 'A', to_task_id: 'E' }
      ],
      [
        { id: 'app1', task_id: 'B', required_from: 's2', status: 'approved' },
        { id: 'app2', task_id: 'C', required_from: 's3', status: 'approved' }
      ]
    );

    const result = await getImpact('A', projectId, { dryRun: true });

    expect(result.directCount).toBe(4);
    expect(result.approvalGatesReopened).toBe(2);
    // score = 4 + 0 + 2*2 = 8 => high
    expect(result.blastRadiusScore).toBe(8);
    expect(result.blastRadiusLevel).toBe('high');
  });
});
