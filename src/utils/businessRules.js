export function getRewardProgress(completedEligibleRides, milestoneSize = 100) {
  if (!Number.isInteger(completedEligibleRides) || completedEligibleRides < 0) {
    throw new RangeError('Completed eligible rides must be a non-negative integer.')
  }
  if (!Number.isInteger(milestoneSize) || milestoneSize < 1) {
    throw new RangeError('Milestone size must be a positive integer.')
  }

  const ridesUntilReward = milestoneSize - (completedEligibleRides % milestoneSize)
  return {
    eligibleCompletedRides: completedEligibleRides,
    nextMilestone: completedEligibleRides + ridesUntilReward,
    ridesUntilReward,
    rewardDue: completedEligibleRides > 0 && completedEligibleRides % milestoneSize === 0,
  }
}

export function validateFareOffer(offer, { standardFare, minimumFare }) {
  if (!Number.isFinite(offer) || !Number.isFinite(standardFare) || !Number.isFinite(minimumFare)) {
    return { valid: false, reason: 'Fare configuration is unavailable.' }
  }
  if (minimumFare < 0 || minimumFare > standardFare) {
    return { valid: false, reason: 'Fare configuration is invalid.' }
  }
  if (offer < minimumFare || offer >= standardFare) {
    return { valid: false, reason: `Offer must be between ₹${minimumFare} and ₹${standardFare}.` }
  }
  return { valid: true }
}
