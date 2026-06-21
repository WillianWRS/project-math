const SIMULATED_AD_DURATION_MS = 2_000

export type RewardedResult = 'completed' | 'dismissed' | 'limit'

export interface RewardedAdsAdapter {
  showRewardedAutoCheck(): Promise<RewardedResult>
}

interface SimulatedRewardedAdsOptions {
  getRemainingToday: () => number
  onReward: () => void
}

export class SimulatedRewardedAds implements RewardedAdsAdapter {
  private readonly options: SimulatedRewardedAdsOptions

  constructor(options: SimulatedRewardedAdsOptions) {
    this.options = options
  }

  async showRewardedAutoCheck(): Promise<RewardedResult> {
    if (this.options.getRemainingToday() <= 0) return 'limit'
    await new Promise((resolve) => window.setTimeout(resolve, SIMULATED_AD_DURATION_MS))
    this.options.onReward()
    return 'completed'
  }
}
