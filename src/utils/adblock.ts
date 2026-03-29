export const detectAdBlock = async (): Promise<boolean> => {
  try {
    // Attempt to fetch the Google AdSense script url
    // Ad blockers intercept this specific domain and fail the request
    await fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store',
    })

    // If we get here, the request wasn't blocked
    return false
  } catch {
    // Fetch threw an error, highly likely due to ad blocker
    return true
  }
}
