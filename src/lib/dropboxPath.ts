// Where a trip's receipts go in Dropbox. Uses the trip's explicit folder
// override if set (Settings -> Receipts), otherwise derives one from the
// trip name.

export function receiptFolder(tripName: string, dropboxFolder?: string): string {
  if (dropboxFolder?.trim()) {
    const cleaned = dropboxFolder.trim().replace(/\/+$/, '')
    return cleaned.startsWith('/') ? cleaned : `/${cleaned}`
  }
  const safeTrip = (tripName || 'Trip').replace(/[^a-z0-9]+/gi, '-').slice(0, 40)
  return `/${safeTrip}/Receipts`
}
