# Fire Dragon model audit and revision

## Scope
This revision covers the first four model-work stages only:
1. Audit the existing geometry and bone hierarchy.
2. Compare structural patterns with official Bedrock sample models and documented community dragon implementations.
3. Reorganize the fire dragon geometry.
4. Add articulated wing-tip and supporting neck/head animation.

The in-game visual review (stage 5) is intentionally pending. No claim of in-game validation is made.

## Findings in the previous geometry
- The horn cubes were placed around Y=0 and Z=-1 while the skull was built farther forward and higher, leaving the horns detached from the intended head region.
- The dorsal-spine cubes were placed around Y=0..4 while the torso top was around Y=14..15.
- The head's main skull blocks overlapped the neck/body transition instead of continuing cleanly along the forward -Z direction.
- The wing surfaces used narrow, mostly one-unit-thick plates and had no separate distal wing-tip joints.
- The animation set had only the shoulder wing bones and membrane bones; there was no secondary wing-tip articulation.

## Comparison references
- Mojang Bedrock sample Ender Dragon geometry: https://github.com/Mojang/bedrock-samples/blob/main/resource_pack/models/entity/ender_dragon.geo.json
  - Uses separate wing and wingtip bones.
  - Uses a long torso and a multi-part neck/tail hierarchy.
- Mojang Bedrock sample Phantom geometry: https://github.com/Mojang/bedrock-samples/blob/main/resource_pack/models/entity/phantom.geo.json
  - Uses wingtip bones parented to wing bones, providing a compact example of secondary wing articulation.
- Community Warp Stone addon release notes (v7.6): https://www.curseforge.com/minecraft-bedrock/addons/warp-stone-wp/files/9450511
  - Describes wider two-segment wings, delayed wing-tip movement, body pitch, tucked legs, and tail motion as natural-flight improvements. This was used as a design reference, not as copied source code.

## Changes made
- Rebalanced torso, neck, skull, jaw, and head pivots to create a longer, clearer silhouette.
- Repositioned both horns onto the upper skull.
- Raised dorsal spines onto the back.
- Widened the wing membrane panels.
- Added `wing_tip_left` and `wing_tip_right` bones, each parented to its corresponding main wing.
- Added idle, walk, and flight motion for the new wing tips.
- Added restrained neck/head movement and reduced membrane rotation so the membranes do not visually over-rotate against the main wing motion.
- Kept the current texture reference, entity identifier, render-controller binding, and existing three-state animation controller.

## Size comparison: Fire Dragon vs Ender Dragon
- Fire Dragon entity collision box: 2.2 blocks wide x 2.8 blocks high.
- Ender Dragon entity collision box in Mojang's current sample: 13 blocks wide x 4 blocks high.
- Ender Dragon geometry body core: 24 x 24 x 64 model units; its sample geometry uses a much larger overall wing structure.
- Fire Dragon body core in the first revision: 13 x 11 x 17 model units.
- Fire Dragon body core in the new proportional revision: 24 x 24 x 32 model units.

The Ender Dragon is substantially larger. Its dimensions are a structural reference, not a target size for the Fire Dragon.

## Validation performed
- Parsed the revised geometry and animation JSON successfully.
- Verified 25 unique geometry bones.
- Verified all animation bone references resolve to geometry bones.
- Verified the two new wing-tip bones exist.
- Verified the entity animation map and the existing idle/walk/fly controller states remain connected.

## Not yet validated
- No Minecraft runtime test has been performed.
- No screenshot/render comparison has been performed.
- Texture UV appearance and the actual visual result must be checked in stage 5 on the user's device.
- Do not merge this branch into the base branch without explicit user approval.


## Proportional rebuild — revision 0.3

The user's new requirement is that the Fire Dragon's main body must be at least 24 x 24 x 24 model units. The geometry was therefore rebuilt proportionally rather than enlarging only one isolated torso cube.

- Main torso core is now exactly 24 x 24 x 32 model units.
- The original anatomy, 25-bone hierarchy, four legs, two wings, articulated wing tips, three tail sections, neck, head, jaw, horns, dorsal spines, and chest details were retained and scaled around the model origin.
- Axis scale factors: X = 24/13, Y = 24/11, Z = 32/17. This preserves the previous silhouette proportions while increasing the body volume.
- Visible bounds were increased to accommodate the larger model.
- Entity collision box remains 2.2 blocks wide x 2.8 blocks high. Geometry dimensions and entity collision dimensions are separate systems; the collision box was not changed without an explicit design request.
- Existing UV coordinates were converted to explicit per-face UV mappings to prevent the enlarged cubes from expanding beyond the 128 x 128 texture atlas. Three out-of-bounds face mappings were redirected to a small in-atlas patch at [112,112]; these faces require visual texture review.

## Revision 0.3 structural validation

- Geometry JSON parsed successfully after the rebuild.
- Main torso dimensions verified as 24 x 24 x 32.
- 25 unique bones and 75 geometry cubes retained.
- All animation bone references resolve to geometry bones.
- UV rectangles are within the declared 128 x 128 atlas.
- Existing entity identifier, render-controller binding, animation identifiers, and behavior entity collision box were preserved.
- No Minecraft runtime test or visual texture inspection has been performed. This is a committed structural candidate, not an in-game approved appearance.
