import * as THREE from "three";

/**
 * Export a Three.js mesh or group to binary STL format.
 * Single-pass write directly to DataView, reusing Vector3 instances to avoid GC pressure.
 */
export function exportToSTL(object: THREE.Object3D): ArrayBuffer {
  // First pass: count triangles
  let totalTriangles = 0;
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const geo = child.geometry;
    const index = geo.getIndex();
    totalTriangles += index
      ? index.count / 3
      : geo.getAttribute("position").count / 3;
  });

  // Binary STL: 80-byte header + 4-byte count + 50 bytes per triangle
  const bufferSize = 80 + 4 + totalTriangles * 50;
  const buffer = new ArrayBuffer(bufferSize);
  const view = new DataView(buffer);
  view.setUint32(80, totalTriangles, true);

  // Reuse vector instances across all triangles
  const v0 = new THREE.Vector3();
  const v1 = new THREE.Vector3();
  const v2 = new THREE.Vector3();
  const edge1 = new THREE.Vector3();
  const edge2 = new THREE.Vector3();
  const normal = new THREE.Vector3();

  let offset = 84;
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const geo = child.geometry;
    const posAttr = geo.getAttribute("position");
    const index = geo.getIndex();
    const worldMatrix = child.matrixWorld;
    const triCount = index ? index.count / 3 : posAttr.count / 3;

    for (let t = 0; t < triCount; t++) {
      const verts = [v0, v1, v2];
      for (let j = 0; j < 3; j++) {
        const idx = index ? index.getX(t * 3 + j) : t * 3 + j;
        verts[j].set(posAttr.getX(idx), posAttr.getY(idx), posAttr.getZ(idx));
        verts[j].applyMatrix4(worldMatrix);
      }

      edge1.subVectors(v1, v0);
      edge2.subVectors(v2, v0);
      normal.crossVectors(edge1, edge2).normalize();

      view.setFloat32(offset, normal.x, true);
      offset += 4;
      view.setFloat32(offset, normal.y, true);
      offset += 4;
      view.setFloat32(offset, normal.z, true);
      offset += 4;
      for (const v of verts) {
        view.setFloat32(offset, v.x, true);
        offset += 4;
        view.setFloat32(offset, v.y, true);
        offset += 4;
        view.setFloat32(offset, v.z, true);
        offset += 4;
      }
      view.setUint16(offset, 0, true);
      offset += 2;
    }
  });

  return buffer;
}
