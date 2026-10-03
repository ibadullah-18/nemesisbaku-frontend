import test from 'node:test';
import assert from 'node:assert/strict';
import { readDateParts, writeDateParts, clampDateParts, dateWheelBounds, localToday } from '../src/components/common/dateWheelUtils.js';
test('past days, months and years are absent from today wheels', () => {
 const p = readDateParts('2026-10-03');
 const b = dateWheelBounds(p, '2026-10-03', undefined, 2026);
 assert.deepEqual(b.day, [3,31]); assert.deepEqual(b.month,[10,12]); assert.equal(b.year[0],2026);
});
test('returning from a future year clamps the entire date to today', () => {
 const p = clampDateParts(readDateParts('2026-01-01'),'2026-10-03');
 assert.equal(writeDateParts(p),'2026-10-03');
 assert.deepEqual(dateWheelBounds(readDateParts('2027-01-01'),'2026-10-03',undefined,2026).month,[1,12]);
});
test('month lengths and leap years stay valid', () => {
 assert.equal(writeDateParts(clampDateParts(readDateParts('2025-02-29'))),'2025-02-28');
 assert.equal(writeDateParts(clampDateParts(readDateParts('2024-02-29'))),'2024-02-29');
 assert.equal(writeDateParts(clampDateParts(readDateParts('2026-11-31'))),'2026-11-30');
});
test('upper date and time bounds remain enforced', () => {
 assert.equal(writeDateParts(clampDateParts(readDateParts('2026-10-04T17:00'),'2026-10-03T00:00','2026-10-04T15:30',true),true),'2026-10-04T15:30');
});
test('birthday and history pickers still permit earlier dates', () => {
 const p=readDateParts('1995-05-10'); assert.equal(writeDateParts(clampDateParts(p)),'1995-05-10');
 assert.equal(localToday(new Date(2026,9,3,0,1)),'2026-10-03');
});
