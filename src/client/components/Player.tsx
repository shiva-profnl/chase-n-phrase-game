import { useGLTF } from "@react-three/drei";
import { useRef } from "react";
import { Group } from "three";

export function Player3D({ lane }: { lane: number }) {
  const { scene } = useGLTF("../models/Dragon.gltf");
  const ref = useRef<Group>(null);

  return (
    <primitive
      ref={ref}
      object={scene}
      scale={1.5}
      position={[lane * 2 - 2, 0.5, 0]} // simple lane positioning
    />
  );
}
