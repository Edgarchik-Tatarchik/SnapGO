import { useState, useCallback } from 'react'

const LOCATION_PERMISSION_KEY = 'snapgo_location_asked'

export interface Coords {
  latitude: number
  longitude: number
}

export function useGeolocation() {
  const [showExplainer, setShowExplainer] = useState(false)
  const [coords, setCoords] = useState<Coords | null>(null)

  const checkAndRequest = useCallback((onGranted?: (coords: Coords | null) => void) => {
    const alreadyAsked = localStorage.getItem(LOCATION_PERMISSION_KEY)

    if (alreadyAsked) {
      requestLocation(onGranted)
      return
    }

    setShowExplainer(true)
  }, [])

  function requestLocation(onGranted?: (coords: Coords | null) => void) {
    if (!('geolocation' in navigator)) {
      onGranted?.(null)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const c = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }
        setCoords(c)
        onGranted?.(c)
      },
      () => {
        onGranted?.(null)
      },
      { timeout: 5000, maximumAge: 60000 }
    )
  }

  function confirmExplainer(onGranted?: (coords: Coords | null) => void) {
    localStorage.setItem(LOCATION_PERMISSION_KEY, 'true')
    setShowExplainer(false)
    requestLocation(onGranted)
  }

  function dismissExplainer() {
    localStorage.setItem(LOCATION_PERMISSION_KEY, 'true')
    setShowExplainer(false)
  }

  return { showExplainer, coords, checkAndRequest, confirmExplainer, dismissExplainer }
}