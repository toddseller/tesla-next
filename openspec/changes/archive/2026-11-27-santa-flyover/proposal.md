# Proposal

## Why

The scene already marks the calendar: the Death Star and Star Destroyers in May, the house's Christmas lights through the holidays. Christmas Eve is the one night of the year something should fly over the house, so Santa's sleigh, pulled by his reindeer with Rudolph leading, crossing the sky that night every few minutes, is the season's last touch.

## What Changes

- **Santa's sleigh crosses the Christmas Eve sky:** Santa seated in his sleigh, eight reindeer in four pairs, and Rudolph alone in the lead, galloping through the air. A pass comes within a few seconds of the night showing, then another 3 to 5 minutes after each ends while the page is open, live and in replay.
- **Christmas Eve night only:** the night that starts on the evening of December 24 at the site, counted the way the Christmas lights count a night, with the sun 6 or more degrees below the horizon, as for the May Star Destroyer.
- **A 3D render that gallops:** the team is rendered in Blender from "Santa´s sleigh (WIP)" by UlissesVinicios (CC BY 4.0). Santa sits in the seat; the six reindeer become eight plus Rudolph; each reindeer has a skeleton (body, shoulder, forearm, cannon and pastern in front; thigh, gaskin, cannon and pastern behind) posed through an eight-frame gallop that moves the shoulders and haunches, folds the knees and hocks, and stretches the hind legs back on the push-off; the team climbs under moonlight. Two views ship as WebP: side-on and three-quarter toward the viewer.
- **Each pass takes its own path:** near passes are large, lower in the sky and quicker, seen three-quarter on; far passes are small, high, slower and hazed by the distance; any depth between. Direction is random. Paths stay in the sky above the roof, clear of the house and its labels, and the team flies in front of the moon.
- **Through cloud and rain:** the more cloud, the fainter the team, down to about half under full cover, so some of the sleigh and team always shows, while Rudolph's red nose glows at full strength over the clouds and rain.
- **Like the Star Destroyer:** a pass under way finishes even if the replay pauses or the night ends, no new pass starts while paused, and nothing flies for a viewer who prefers reduced motion.
- **The credit:** README's Credits names the model, its author and licence, and the modifications, as for the other renders; the Blender script that builds the frames is kept in the repo so they can be rebuilt.

Out of scope: sound, any setting to turn it off, other nights of the season, and Home's Now scene (unchanged: it gets the pass because it shows the same scene, with no change of its own).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `scene-weather`: Santa's sleigh crosses the sky on Christmas Eve night, beside the May Star Destroyer's requirements.

## Impact

- **Code:** `lib/scene/live-scene.ts` (a Christmas Eve flag beside `christmas`), `components/scene/live-scene.tsx` (the pass, sharing the Star Destroyer's scheduling), `components/scene/scene.css` (the crossing, the gallop and the haze), `components/scene/layout.ts` (the team's sizes and sky band), and their tests.
- **Assets:** two gallop sprite sheets in `public/scene/` (side-on and three-quarter, eight frames each), loaded only while a pass is crossing.
- **Tooling:** a Blender script under `scripts/` that builds the frames from the downloaded model; it runs by hand, not in the build or the tests.
- **Docs:** README's Credits (CC BY 4.0 credit for UlissesVinicios's model, with the modifications).
