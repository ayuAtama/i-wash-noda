export class GeoUtils {
  // helper functions radians
  private static toRad(value: number) {
    return (value * Math.PI) / 180;
  }

  static calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ) {
    const R = 6371; // Earth radius in KM

    const dLat = GeoUtils.toRad(lat2 - lat1);
    const dLng = GeoUtils.toRad(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(GeoUtils.toRad(lat1)) *
        Math.cos(GeoUtils.toRad(lat2)) *
        Math.sin(dLng / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}
