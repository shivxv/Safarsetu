import test from 'node:test'
import assert from 'node:assert/strict'
import { getRewardProgress, validateFareOffer } from '../src/utils/businessRules.js'

test('reward progress only marks each exact 100-ride milestone', () => {
  assert.deepEqual(getRewardProgress(99), {
    eligibleCompletedRides: 99,
    nextMilestone: 100,
    ridesUntilReward: 1,
    rewardDue: false,
  })
  assert.equal(getRewardProgress(100).rewardDue, true)
  assert.equal(getRewardProgress(101).nextMilestone, 200)
  assert.equal(getRewardProgress(0).rewardDue, false)
})

test('fare offer validation honors the configured minimum and standard fare', () => {
  const configuration = { standardFare: 100, minimumFare: 75 }
  assert.equal(validateFareOffer(75, configuration).valid, true)
  assert.equal(validateFareOffer(74, configuration).valid, false)
  assert.equal(validateFareOffer(100, configuration).valid, false)
  assert.equal(validateFareOffer(101, configuration).valid, false)
  assert.equal(validateFareOffer(80, {}).valid, false)
})
