# Tasks

## 1. Image

- [x] 1.1 Render and composite `Tesla App Assets/tie-render/` (wheel texture, then render, then composite). Check the angles are in tolerance, then copy its `tie-fighter.webp` over `public/scene/model-3.webp`
- [x] 1.2 Measure T.I.E. Fighter's plug (top of the left taillight) on the render, in render units

## 2. Plug and credit

- [x] 2.1 Write a failing test in `live-scene.test.tsx`: T.I.E. Fighter's plug ends at the measured point (render units, plus the stage's 80)
- [x] 2.2 Update `CAR_CABLES.model3` in `components/scene/layout.ts`; run the whole suite
- [x] 2.3 Add the Model 3 mesh to the README's `## Credits`: title, author, Sketchfab link, CC BY 4.0, and that it was modified

## 3. Check

- [x] 3.1 Look at T.I.E. Fighter plugged in on the page (or a composite of the scene's layers): it sits inside the garage, and its cable reaches the top of its left taillight without crossing the body
- [x] 3.2 Run the ponytail review on the diff in a fresh subagent and report its findings
