# Tasks

## 1. Images

- [x] 1.1 Put `Tesla App Assets/model3-render/` back to true scale (`render_car.py`: 1600 x 1100 at 240 px/m; `composite.py`: corner (789, 2741), the door polygon with its bottom edge, everything clipped to the house), re-render and composite, and check the result matches the first render (angles in tolerance, plug at `[178.3, 590.7]`)
- [x] 1.2 Copy the Star Destroyer's `star-destroyer.webp` and the Model Y's `model-y.webp` into `public/scene/`

## 2. Plugs and credit

- [x] 2.1 Write failing tests in `live-scene.test.tsx`: R2D2's plug ends at `[178.5, 580.7]` and the Star Destroyer's at `[178.3, 590.7]` (render units, before the stage offset)
- [x] 2.2 Update the two plug points in `components/scene/layout.ts`; run the whole suite
- [x] 2.3 Add a `## Credits` section to `README.md` for the Model Y mesh: title, author, Sketchfab link, CC BY 4.0, and that it was modified

## 3. Check

- [x] 3.1 Look at both cars plugged in on the page (a branch container on onyx or a composite of the scene's layers): each sits inside the garage, and its cable reaches the top of its left taillight without crossing the body
- [x] 3.2 Run the ponytail review on the diff in a fresh subagent and report its findings
