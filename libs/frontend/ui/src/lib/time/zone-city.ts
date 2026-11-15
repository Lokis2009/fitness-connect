/** City label of an IANA zone id: `Europe/Warsaw` gives "Warsaw", `UTC` stays "UTC". */
export function zoneCity(zone: string): string {
  const lastSegment = zone.slice(zone.lastIndexOf('/') + 1);
  return lastSegment.replaceAll('_', ' ');
}
