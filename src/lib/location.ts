// 폰의 현재 위치. 장소 등록에 씀 (HTTPS나 localhost에서만 동작)
export type Coordinates = { latitude: number; longitude: number }

export class LocationError extends Error {}

export function getCurrentPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    // http://<IP> 같은 주소에서는 브라우저가 권한을 묻지도 않고 거부함. 권한 문제로 오해하지 않게 따로 안내
    if (!window.isSecureContext) {
      reject(new LocationError('현재 위치는 https 주소에서만 쓸 수 있어요. 지도를 움직여 직접 골라 주세요.'))
      return
    }
    if (!('geolocation' in navigator)) {
      reject(new LocationError('이 브라우저는 위치를 지원하지 않아요.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: round6(coords.latitude), longitude: round6(coords.longitude) }),
      (error) => reject(new LocationError(messageOf(error))),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 },
    )
  })
}

// 서버는 소수 6자리까지 받음 (약 10cm)
function round6(value: number) {
  return Math.round(value * 1_000_000) / 1_000_000
}

function messageOf(error: GeolocationPositionError) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return '위치 권한이 꺼져 있어요. 브라우저 설정에서 위치를 허용해 주세요.'
    case error.TIMEOUT:
      return '위치를 찾는 데 너무 오래 걸려요. 밖으로 나가서 다시 시도해 주세요.'
    default:
      return '현재 위치를 찾을 수 없어요.'
  }
}
