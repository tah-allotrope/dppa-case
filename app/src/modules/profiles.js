export function scaleProfile(profile, scale) {
  return profile.map((value) => Math.round(value * scale))
}

export function deriveVolumes(loadProfile, generationProfile) {
  return loadProfile.map((load, index) => {
    const generation = generationProfile[index] ?? 0
    const matched = Math.min(load, generation)
    const shortfall = Math.max(load - generation, 0)
    const excess = Math.max(generation - load, 0)

    return {
      hour: index,
      load,
      generation,
      matched,
      shortfall,
      excess,
    }
  })
}

export function sumVolume(items, key) {
  return items.reduce((total, item) => total + item[key], 0)
}
