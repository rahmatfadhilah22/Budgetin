import assert from 'node:assert';
import { getCycle, shiftCycle, formatRange, cycleYear } from './cycle';

function check(label: string, actual: { start: string; end: string }, start: string, end: string) {
  assert.deepStrictEqual(actual, { start, end }, label);
}

// monthly, startDay 1
check('jan-start1', getCycle('monthly', 1, '2026-01-15'), '2026-01-01', '2026-01-31');
// monthly, startDay 25, anchor 27 (after start) -> 25 Aug..24 Sep
check('aug-25', getCycle('monthly', 25, '2026-08-27'), '2026-08-25', '2026-09-24');
// monthly, startDay 25, anchor 10 (before start) -> 25 Jul..24 Aug
check('aug-10', getCycle('monthly', 25, '2026-08-10'), '2026-07-25', '2026-08-24');
// clamp: startDay 31 in Feb — Feb 20 is before the clamped 28th, so it belongs to the Jan cycle.
check('feb-before', getCycle('monthly', 31, '2026-02-20'), '2026-01-31', '2026-02-27');
// on the clamped start day -> the Feb cycle starts the 28th.
check('feb-on', getCycle('monthly', 31, '2026-02-28'), '2026-02-28', '2026-03-30');
// weekly: Thursday -> Mon..Sun
check('week', getCycle('weekly', 25, '2026-08-27'), '2026-08-24', '2026-08-30');
// shift +1 monthly
check('shift+1', shiftCycle('monthly', 25, getCycle('monthly', 25, '2026-08-27'), 1), '2026-09-25', '2026-10-24');
// shift -1 weekly
check('shift-1w', shiftCycle('weekly', 25, getCycle('weekly', 25, '2026-08-27'), -1), '2026-08-17', '2026-08-23');
// shift 0 is identity
check('shift0', shiftCycle('monthly', 1, getCycle('monthly', 1, '2026-08-27'), 0), '2026-08-01', '2026-08-31');
// shift +2 does not collapse (regression: any |delta|>1 returned the same ±1 cycle)
check('shift+2', shiftCycle('monthly', 1, getCycle('monthly', 1, '2026-08-27'), 2), '2026-10-01', '2026-10-31');
check('shift-2', shiftCycle('monthly', 1, getCycle('monthly', 1, '2026-08-27'), -2), '2026-06-01', '2026-06-30');
check('shift+2c', shiftCycle('monthly', 25, getCycle('monthly', 25, '2026-08-27'), 2), '2026-10-25', '2026-11-24');
// multi-step weekly
check('shift+2w', shiftCycle('weekly', 25, getCycle('weekly', 25, '2026-08-27'), 2), '2026-09-07', '2026-09-13');
check('shift-2w', shiftCycle('weekly', 25, getCycle('weekly', 25, '2026-08-27'), -2), '2026-08-10', '2026-08-16');

assert.strictEqual(formatRange('2026-08-25', '2026-09-24'), '25 Agu – 24 Sep');
assert.strictEqual(cycleYear('2026-08-25', '2026-09-24'), '2026');
assert.strictEqual(cycleYear('2026-12-25', '2027-01-24'), '2026 – 2027');
console.log('formatRange:', formatRange('2026-08-25', '2026-09-24'), '| cycleYear:', cycleYear('2026-12-25', '2027-01-24'));
console.log('cycle self-check passed');
