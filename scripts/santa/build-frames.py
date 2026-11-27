"""Renders the Christmas Eve sleigh's gallop frames (the scene-weather spec) from "Santa´s sleigh (WIP)" by UlissesVinicios
(CC BY 4.0, https://sketchfab.com/3d-models/83d87df1b937482ba57792bac8830d9c; see README's Credits).

Download the model's glTF (.glb) from Sketchfab, then:

  blender -b --factory-startup --python scripts/santa/build-frames.py -- model.glb out

It writes out/side-0.png .. out/side-7.png and out/toward-0.png .. out/toward-7.png, already cropped, and prints where
Rudolph's nose sits in each frame as a share of its width and height (SANTA's nose places in components/scene/layout.ts).
Stack and encode the sheets with:

  ffmpeg -i out/side-%d.png -vf scale=960:-2,tile=1x8 -frames:v 1 -update 1 out/side.png
  ffmpeg -i out/toward-%d.png -vf scale=800:-2,tile=1x8 -frames:v 1 -update 1 out/toward.png
  cwebp -q 85 -alpha_q 90 out/side.png -o public/scene/santa-side.webp
  cwebp -q 85 -alpha_q 90 out/toward.png -o public/scene/santa-toward.webp
"""
import math
import os
import sys

import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Matrix, Quaternion, Vector

GLB, OUT = sys.argv[sys.argv.index("--") + 1:][:2]
FRAMES = 8
RENDER = (1800, 800)
# The camera's direction from the team, and the crop (x, y, width, height) that holds the whole team in every frame.
VIEWS = {
    "side": (Vector((1, 0, -0.18)), (170, 190, 1475, 420)),
    "toward": (Vector((0.85, -0.75, -0.22)), (275, 70, 1170, 600)),
}

# The model's parts by their parent's name, each pair's left (-x) then right reindeer, the team facing -y.
DEER = {
    "front-left": ["Circle.010", "Circle.011", "Cube.009", "BezierCurve.004", "Cube.008"],
    "front-right": ["Circle.012", "Circle.013", "Cube.011", "BezierCurve.005", "Cube.010"],
    "mid-left": ["Circle", "Circle.001", "Cube.001", "BezierCurve", "Cube"],
    "mid-right": ["Circle.002", "Circle.003", "Cube.004", "BezierCurve.001", "Cube.002"],
    "back-left": ["Circle.004", "Circle.005", "Cube.005", "BezierCurve.002", "Cube.003"],
    "back-right": ["Circle.006", "Circle.007", "Cube.007", "BezierCurve.003", "Cube.006"],
}
SANTA = ["PERSONAGEM_CHIBI.002", "base_animacao.004", "base_animacao.005", "BOOTS", "Circle.008", "Circle.009", "Cube.013"]
PAIR_SPACING = 1.4

# Joint angles in degrees at eight even points of one stride; positive swings the part below the joint forward. At 0 the
# reindeer is stretched out: front legs reaching, hind legs just pushed off behind.
GAIT = {
    "front": {
        "shoulder": [35, 22, 5, -15, -30, -20, 5, 25],
        "elbow": [15, 0, 0, -5, 0, 35, 50, 35],
        "carpus": [0, 0, 0, -10, -60, -110, -90, -30],
        "fetlock": [10, 25, 35, 20, -30, -40, -30, 0],
    },
    "hind": {
        "hip": [-60, -38, 0, 20, 25, 10, -15, -42],
        "stifle": [12, -25, -40, -25, -10, -10, -2, 8],
        "hock": [-5, 45, 60, 35, 15, 20, 10, 0],
        "fetlock": [15, -35, -30, 0, 20, 30, 25, 20],
    },
    "pitch": [-3, 0, 3, 4, 2, 0, -2, -4],
}
# Each reindeer a little behind the one ahead in its stride, and the right legs behind the left, as in a real gallop.
DEER_LAG, RIGHT_LAG = 0.13, 0.06


def at(keys, t):
    """The stride's angle at t (0 to 1, wrapping), smoothly through the keys."""
    n = len(keys)
    x = (t % 1.0) * n
    i, f = int(x), x - int(x)
    p0, p1, p2, p3 = (keys[(i + k) % n] for k in (-1, 0, 1, 2))
    return 0.5 * (2 * p1 + (p2 - p0) * f + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f + (3 * p1 - p0 - 3 * p2 + p3) * f ** 3)


def load():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=GLB)
    # Every transform baked into its mesh, so parts can be moved, copied and rigged in world space.
    for o in list(bpy.data.objects):
        if o.type == "MESH":
            o.data = o.data.copy()
            world = o.matrix_world.copy()
            o.parent = None
            o.data.transform(world)
            o.matrix_world = Matrix.Identity(4)


def meshes_of(parents):
    return [o for o in bpy.data.objects if o.type == "MESH" and any(o.name.startswith(p + "_") for p in parents)]


def duplicate(objs, offset):
    copies = []
    for o in objs:
        c = o.copy()
        c.data = o.data.copy()
        bpy.context.scene.collection.objects.link(c)
        c.data.transform(Matrix.Translation(offset))
        copies.append(c)
    return copies


def chain(front, ly):
    """A leg's bones in (y, z), from the joint high inside the body down to the hoof's tip."""
    if front:
        pts = [(ly + 0.07, 0.36), (ly + 0.01, 0.04), (ly, -0.10), (ly, -0.22), (ly - 0.03, -0.29)]
        return list(zip(["shoulder", "elbow", "carpus", "fetlock"], pts, pts[1:]))
    pts = [(ly - 0.02, 0.30), (ly - 0.09, 0.12), (ly + 0.03, -0.04), (ly, -0.22), (ly - 0.03, -0.29)]
    return list(zip(["hip", "stifle", "hock", "fetlock"], pts, pts[1:]))


def rig_and_pose(objs, t):
    """Skins one reindeer to a skeleton, poses it at point t of the stride, and bakes the pose into its meshes."""
    body = next(o for o in objs if "Material.030" in o.name and o.name.startswith("Circle"))
    vs = body.data.vertices
    xc = (min(v.co.x for v in vs) + max(v.co.x for v in vs)) / 2
    yc = (min(v.co.y for v in vs) + max(v.co.y for v in vs)) / 2
    low = [v.co for v in vs if v.co.z < -0.15]
    arm = bpy.data.objects.new("rig", bpy.data.armatures.new("rig"))
    bpy.context.scene.collection.objects.link(arm)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="EDIT")
    bones = arm.data.edit_bones
    root = bones.new("root")
    root.head, root.tail = (xc, yc + 0.3, 0.3), (xc, yc - 0.3, 0.3)
    legs = []
    for side in (-1, 1):
        for front in (True, False):
            feet = [c for c in low if (c.x - xc) * side > 0 and (c.y < yc) == front]
            lx, ly = sum(c.x for c in feet) / len(feet), sum(c.y for c in feet) / len(feet)
            parent = root
            for joint, (y0, z0), (y1, z1) in chain(front, ly):
                b = bones.new(f"{side}{front}{joint}")
                b.head, b.tail = (lx, y0, z0), (lx, y1, z1)
                b.parent, b.use_connect = parent, parent is not root
                parent = b
            legs.append((side, front))
    bpy.ops.object.mode_set(mode="OBJECT")
    skinned = [o for o in objs if o.name.startswith("Circle") and ("Material.030" in o.name or "Material.029" in o.name)]
    bpy.ops.object.select_all(action="DESELECT")
    for o in skinned:
        o.select_set(True)
    arm.select_set(True)
    bpy.ops.object.parent_set(type="ARMATURE_AUTO")
    # The head, harness and reins ride on the body.
    for o in objs:
        if o not in skinned:
            o.vertex_groups.new(name="root").add(range(len(o.data.vertices)), 1.0, "REPLACE")
            o.modifiers.new("rig", "ARMATURE").object = arm

    def turn(name, degrees):
        # Every joint turns in the reindeer's own plane: about world x, whatever the bone's roll.
        pose = arm.pose.bones[name]
        pose.rotation_mode = "QUATERNION"
        axis = arm.data.bones[name].matrix_local.to_3x3().inverted() @ Vector((-1, 0, 0))
        pose.rotation_quaternion = Quaternion(axis, math.radians(degrees))

    turn("root", at(GAIT["pitch"], t))
    for side, front in legs:
        for joint, keys in GAIT["front" if front else "hind"].items():
            turn(f"{side}{front}{joint}", at(keys, t - (RIGHT_LAG if side > 0 else 0)))
    bpy.context.view_layer.update()
    graph = bpy.context.evaluated_depsgraph_get()
    for o in objs:
        baked = bpy.data.meshes.new_from_object(o.evaluated_get(graph))
        o.modifiers.clear()
        o.parent = None
        o.matrix_world = Matrix.Identity(4)
        o.data = baked
    bpy.data.objects.remove(arm)


def glowing(color, strength):
    m = bpy.data.materials.new("nose")
    m.use_nodes = True
    shader = m.node_tree.nodes["Principled BSDF"]
    shader.inputs["Base Color"].default_value = (*color, 1)
    shader.inputs["Emission Color"].default_value = (*color, 1)
    shader.inputs["Emission Strength"].default_value = strength
    return m


def build(t):
    """The whole team at point t of the stride; returns Rudolph's nose."""
    load()
    deer = {k: meshes_of(v) for k, v in DEER.items()}
    deer["lead-left"] = duplicate(deer["front-left"], Vector((0, -PAIR_SPACING, 0)))
    deer["lead-right"] = duplicate(deer["front-right"], Vector((0, -PAIR_SPACING, 0)))
    deer["rudolph"] = duplicate(deer["front-left"], Vector((0.37, -2 * PAIR_SPACING, 0)))
    for i, objs in enumerate(deer.values()):
        rig_and_pose(objs, t + i * DEER_LAG)
    head = next(o for o in deer["rudolph"] if "Material.028" in o.name)
    # The muzzle: the most forward point at head height, not the chest the same part covers.
    top = max(v.co.z for v in head.data.vertices)
    tip = min((v.co for v in head.data.vertices if v.co.z > top - 0.22), key=lambda c: c.y)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.035, location=tip + Vector((0, -0.015, 0)))
    nose = bpy.context.active_object
    # Into its mesh, like every other part, so the climb below turns it with the team.
    nose.data.transform(Matrix.Translation(nose.location))
    nose.location = (0, 0, 0)
    nose.data.materials.append(glowing((1.0, 0.04, 0.02), 6))
    light = bpy.data.lights.new("nose-light", "POINT")
    light.color, light.energy, light.shadow_soft_size = (1, 0.15, 0.1), 12, 0.05
    lamp = bpy.data.objects.new("nose-light", light)
    lamp.location = tip + Vector((0, -0.07, 0))
    bpy.context.scene.collection.objects.link(lamp)
    # Santa stands beside the sleigh in the model; this seats him on its bench.
    for o in meshes_of(SANTA):
        o.data.transform(Matrix.Translation(Vector((-0.92, -0.12, 0.36))))
    climb = Matrix.Translation(Vector((0, 0.5, 0.3))) @ Matrix.Rotation(math.radians(-8), 4, "X") @ Matrix.Translation(Vector((0, -0.5, -0.3)))
    for o in bpy.data.objects:
        if o.type == "MESH":
            o.data.transform(climb)
    lamp.location = climb @ lamp.location
    return climb @ (tip + Vector((0, -0.05, 0)))


def render(view, path):
    scene = bpy.context.scene
    engines = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items]
    scene.render.engine = "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in engines else "BLENDER_EEVEE"
    scene.render.film_transparent = True
    scene.render.resolution_x, scene.render.resolution_y = RENDER
    world = bpy.data.worlds.new("night")
    scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = (0.05, 0.07, 0.12, 1)
    world.node_tree.nodes["Background"].inputs[1].default_value = 0.6
    for name, energy, color, angles in [("moon", 3.0, (0.78, 0.85, 1.0), (55, 0, -140)), ("rim", 1.0, (0.6, 0.7, 1.0), (100, 0, 30))]:
        sun = bpy.data.lights.new(name, "SUN")
        sun.energy, sun.color = energy, color
        o = bpy.data.objects.new(name, sun)
        scene.collection.objects.link(o)
        o.rotation_euler = [math.radians(a) for a in angles]
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
    scene.collection.objects.link(cam)
    scene.camera = cam
    cam.data.lens = 85
    target = Vector((0, -3.05, 0.75))
    cam.location = target + VIEWS[view][0].normalized() * 27
    cam.rotation_euler = (target - cam.location).to_track_quat("-Z", "Y").to_euler()
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    return cam


def crop(path, box):
    x, y, w, h = box
    image = bpy.data.images.load(path)
    width = image.size[0]
    pixels = list(image.pixels)
    out = bpy.data.images.new("crop", w, h, alpha=True)
    rows = []
    # Blender's pixels run bottom row first.
    for row in range(RENDER[1] - y - h, RENDER[1] - y):
        start = (row * width + x) * 4
        rows.extend(pixels[start:start + w * 4])
    out.pixels = rows
    out.filepath_raw, out.file_format = path, "PNG"
    out.save()


os.makedirs(OUT, exist_ok=True)
for view, (_, box) in VIEWS.items():
    for i in range(FRAMES):
        nose = build(i / FRAMES)
        path = os.path.join(os.path.abspath(OUT), f"{view}-{i}.png")
        cam = render(view, path)
        crop(path, box)
        u, v, _ = world_to_camera_view(bpy.context.scene, cam, nose)
        x, y, w, h = box
        print(f"NOSE {view} {i} {(u * RENDER[0] - x) / w:.3f} {((1 - v) * RENDER[1] - y) / h:.3f}")
