# venue-time

Date arithmetic in a venue's IANA time zone that the dev seed and the e2e tests share, so the two cannot disagree about "tomorrow at noon". Import path: `@fitness-connect/venue-time`. Tags: `scope:shared`, `type:util`. It has no dependencies and uses only `Intl`.

## Public API

| Export | Description |
| --- | --- |
| `zoneOffsetMs(zone, at)` | Offset of the zone from UTC at an instant, in milliseconds. |
| `tomorrowNoon(zone, now)` | The instant at which it is noon on the calendar day after `now` in the zone. Noon never falls in a daylight saving gap. |

## Running unit tests

Run `pnpm nx test venue-time` (add `--coverage` for the 80% gate).
