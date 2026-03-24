import React, { useEffect, useState } from 'react';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, Stage, Center } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { TextureLoader } from 'three';
import { Suspense } from 'react';
import { api } from '../api';
import type { NavMapResponse } from '../api';
import * as THREE from 'three';

interface SceneViewerProps {
  sceneId: string | null;
  agentId: string | null;
  showNavMap: boolean;
  activeDebugData: any | null;
  overrides?: any;
  onNavMapLoadingChange?: (loading: boolean) => void;
  meshUrl?: string | null;
  staticNavMapData?: any;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("SceneViewer Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry />
          <meshStandardMaterial color="red" />
        </mesh>
      );
    }
    return this.props.children;
  }
}

const Model = ({ url, objectRef }: { url: string, objectRef?: React.MutableRefObject<any> }) => {
  const gltf = useLoader(GLTFLoader, url);
  return <primitive object={gltf.scene} ref={objectRef} />;
};

const SnapshotHelper = ({ 
  sceneId, 
  modelRef, 
  activeDebugData,
  navMapData,
  registerTakeSnapshot 
}: { 
  sceneId: string | null, 
  modelRef: React.MutableRefObject<any>, 
  activeDebugData: any,
  navMapData: any,
  registerTakeSnapshot: (fn: () => Promise<string>) => void 
}) => {
  const { camera } = useThree();
  
  useEffect(() => {
    registerTakeSnapshot(async () => {
      if (!sceneId || !modelRef.current) throw new Error("No model or sceneId");
      
      const camMatrix = camera.matrixWorld.clone();
      const modelMatrixInv = modelRef.current.matrixWorld.clone().invert();
      const localCamMatrix = modelMatrixInv.multiply(camMatrix);
      
      const pos = new THREE.Vector3();
      const quat = new THREE.Quaternion();
      const scale = new THREE.Vector3();
      localCamMatrix.decompose(pos, quat, scale);
      
      const vFovDeg = (camera as THREE.PerspectiveCamera).fov || 45;
      const aspect = (camera as THREE.PerspectiveCamera).aspect || 1;
      const effectiveAspect = Math.min(1920 / 1080, aspect);
      const vFovRad = THREE.MathUtils.degToRad(vFovDeg);
      const hFovRad = 2 * Math.atan(effectiveAspect * Math.tan(vFovRad / 2));
      const blenderFovDeg = THREE.MathUtils.radToDeg(hFovRad);
      
      const finalNavMapData = (activeDebugData && activeDebugData.image_base64) ? activeDebugData : navMapData;

      const base64 = await api.takeSnapshot(
        sceneId, 
        [pos.x, pos.y, pos.z], 
        [quat.w, quat.x, quat.y, quat.z],
        blenderFovDeg,
        activeDebugData,
        finalNavMapData
      );
      return base64;
    });
  }, [sceneId, camera, modelRef, activeDebugData, navMapData, registerTakeSnapshot]);

  return null;
};

const NavMapOverlay = ({ 
  sceneId, 
  agentId, 
  debugData,
  overrides,
  onLoadingChange,
  onDataLoad,
  staticNavMapData
}: { 
  sceneId?: string, 
  agentId?: string, 
  debugData?: any,
  overrides?: any,
  onLoadingChange?: (loading: boolean) => void,
  onDataLoad?: (data: NavMapResponse | null) => void,
  staticNavMapData?: any
}) => {
  const [data, setData] = useState<NavMapResponse | null>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let active = true;

    if (debugData) {
      if (debugData.image_base64) {
        setData(debugData);
        onDataLoad?.(debugData);
        new TextureLoader().load(debugData.image_base64, (tex) => {
          if (!active) return;
          tex.magFilter = THREE.NearestFilter;
          tex.minFilter = THREE.NearestFilter;
          setTexture(tex);
        });
      } else {
        setData(null);
        onDataLoad?.(null);
        setTexture(null);
      }
    } else if (staticNavMapData) {
        setData(staticNavMapData);
        onDataLoad?.(staticNavMapData);
        new TextureLoader().load(staticNavMapData.image_base64, (tex) => {
            if (!active) return;
            tex.magFilter = THREE.NearestFilter;
            tex.minFilter = THREE.NearestFilter;
            setTexture(tex);
        });
    } else if (sceneId && agentId) {
      onLoadingChange?.(true);
      api.getNavMap(sceneId, agentId, overrides).then(res => {
        if (!active) return;
        if (res) {
          setData(res);
          onDataLoad?.(res);
          new TextureLoader().load(res.image_base64, (tex) => {
            if (!active) return;
            tex.magFilter = THREE.NearestFilter;
            tex.minFilter = THREE.NearestFilter;
            setTexture(tex);
            setTimeout(() => {
                if (active) onLoadingChange?.(false);
            }, 100);
          });
        } else {
            onLoadingChange?.(false);
            onDataLoad?.(null);
        }
      }).catch(() => {
          if (active) onLoadingChange?.(false);
      });
    }

    return () => { active = false; };
  }, [sceneId, agentId, debugData, JSON.stringify(overrides), staticNavMapData]);

  if (!data || !texture) return null;

  const width = 2 * data.scale;
  const height = 2 * data.scale;
  const [cx, _, cz] = data.origin;
  const floorY = data.floor_y + 0.05;

  return (
    <mesh position={[cx, floorY, cz]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial 
        map={texture} 
        transparent 
        opacity={0.8} 
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
};

const DebugBox = ({ obj }: { obj: any }) => {
  const m = new THREE.Matrix4();
  m.set(
    obj.transform[0][0], obj.transform[0][1], obj.transform[0][2], obj.transform[0][3],
    obj.transform[1][0], obj.transform[1][1], obj.transform[1][2], obj.transform[1][3],
    obj.transform[2][0], obj.transform[2][1], obj.transform[2][2], obj.transform[2][3],
    obj.transform[3][0], obj.transform[3][1], obj.transform[3][2], obj.transform[3][3]
  );

  return (
    <mesh matrixAutoUpdate={false} onUpdate={self => { self.matrix = m; }}>
      <boxGeometry args={obj.dimensions} />
      <meshStandardMaterial 
        color={new THREE.Color(obj.color[0], obj.color[1], obj.color[2])} 
        transparent 
        opacity={obj.color[3]} 
        depthWrite={false}
      />
    </mesh>
  );
};

const DebugPointCloud = ({ obj }: { obj: any }) => {
  const geometry = React.useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const vertices = new Float32Array(obj.points.flat());
    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    return geo;
  }, [obj.points]);

  return (
    <points geometry={geometry}>
      <pointsMaterial 
        size={0.05} 
        color={new THREE.Color(obj.color[0], obj.color[1], obj.color[2])} 
        transparent
        opacity={obj.color[3] !== undefined ? obj.color[3] : 0.6}
        sizeAttenuation={true}
      />
    </points>
  );
};

const DebugLine = ({ obj }: { obj: any }) => {
  const geometry = React.useMemo(() => {
    const points = [
        new THREE.Vector3(...obj.start),
        new THREE.Vector3(...obj.end)
    ];
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [obj.start, obj.end]);

  return (
    <line>
      <primitive object={geometry} attach="geometry" />
      <lineBasicMaterial 
        color={new THREE.Color(obj.color[0], obj.color[1], obj.color[2])} 
        transparent
        opacity={obj.color[3]}
      />
    </line>
  );
};

const DebugPolygon = ({ obj }: { obj: any }) => {
  const geometry = React.useMemo(() => {
    const pts = obj.vertices.map((v: number[]) => new THREE.Vector3(...v));
    const geo = new THREE.BufferGeometry();
    
    let indices: number[] = [];
    if (pts.length === 4) {
       indices = [0, 1, 2, 0, 2, 3];
    } else if (pts.length === 3) {
       indices = [0, 1, 2];
    } else {
       for (let i = 1; i < pts.length - 1; i++) {
           indices.push(0, i, i + 1);
       }
    }
    
    const vertices = new Float32Array(pts.length * 3);
    pts.forEach((p: THREE.Vector3, i: number) => {
       vertices[i*3] = p.x;
       vertices[i*3+1] = p.y + 0.05; 
       vertices[i*3+2] = p.z;
    });
    
    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, [obj.vertices]);

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial 
        color={new THREE.Color(obj.color[0], obj.color[1], obj.color[2])} 
        transparent
        opacity={obj.color[3] !== undefined ? obj.color[3] : 0.5}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
};

const DebugObjects = ({ data }: { data: any }) => {
  if (!data || !data.debug_objects) return null;

  return (
    <group>
      {data.debug_objects.map((obj: any, i: number) => {
        if (obj.type === 'box') {
          return <DebugBox key={i} obj={obj} />;
        } else if (obj.type === 'point_cloud') {
          return <DebugPointCloud key={i} obj={obj} />;
        } else if (obj.type === 'line') {
          return <DebugLine key={i} obj={obj} />;
        } else if (obj.type === 'polygon') {
          return <DebugPolygon key={i} obj={obj} />;
        }
        return null;
      })}
    </group>
  );
};

export const SceneViewer: React.FC<SceneViewerProps> = ({ 
  sceneId, 
  agentId, 
  showNavMap, 
  activeDebugData,
  overrides,
  onNavMapLoadingChange,
  meshUrl: externalMeshUrl,
  staticNavMapData
}) => {
  const resolvedMeshUrl = externalMeshUrl !== undefined ? externalMeshUrl : (sceneId ? `http://localhost:8000/api/scene/${sceneId}/mesh` : null);

  const [autoFit, setAutoFit] = useState(true);
  const [loadingSnapshot, setLoadingSnapshot] = useState(false);
  const [isHoveringSnapshot, setIsHoveringSnapshot] = useState(false);
  const [navMapData, setNavMapData] = useState<NavMapResponse | null>(null);
  
  const takeSnapshotRef = React.useRef<(() => Promise<string>) | null>(null);
  const modelRef = React.useRef<any>(null);

  useEffect(() => {
    setAutoFit(true);
    const timer = setTimeout(() => setAutoFit(false), 500);
    return () => clearTimeout(timer);
  }, [resolvedMeshUrl]);

  const handleSnapshot = async () => {
    if (takeSnapshotRef.current) {
        setLoadingSnapshot(true);
        try {
            const base64 = await takeSnapshotRef.current();
            const link = document.createElement('a');
            link.href = base64;
            link.download = `snapshot_${sceneId}.png`;
            link.click();
        } catch (e: any) {
            console.error(e);
            alert("Snapshot failed: " + e.message);
        } finally {
            setLoadingSnapshot(false);
        }
    }
  };

  return (
    <div className="w-full h-full bg-slate-950 relative">
      {sceneId && !externalMeshUrl && (
        <button
          onClick={handleSnapshot}
          onMouseEnter={() => setIsHoveringSnapshot(true)}
          onMouseLeave={() => setIsHoveringSnapshot(false)}
          disabled={loadingSnapshot}
          className="absolute bottom-4 left-4 z-30 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-white rounded shadow text-sm backdrop-blur transition-all disabled:opacity-50 flex items-center gap-2 border border-slate-700 cursor-pointer"
        >
          {loadingSnapshot ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Rendering...
            </>
          ) : (
            <>
              Take Snapshot
            </>
          )}
        </button>
      )}

      <Canvas camera={{ position: [8, 8, 8], fov: 45 }} shadows>
        <SnapshotHelper 
          sceneId={sceneId} 
          modelRef={modelRef} 
          activeDebugData={activeDebugData}
          navMapData={showNavMap ? navMapData : null}
          registerTakeSnapshot={(fn) => { takeSnapshotRef.current = fn; }} 
        />
        <Suspense fallback={null}>
          <ErrorBoundary>
            <Stage 
                key={resolvedMeshUrl || 'empty'} 
                environment="city" 
                intensity={0.5} 
                shadows={false} 
                adjustCamera={autoFit}
            >
              <Center>
                {resolvedMeshUrl ? (
                  <>
                    <Model key={resolvedMeshUrl} url={resolvedMeshUrl} objectRef={modelRef} />
                    {activeDebugData && (
                      <>
                        <NavMapOverlay debugData={activeDebugData} />
                        <DebugObjects data={activeDebugData} />
                      </>
                    )}
                    {showNavMap && !activeDebugData && sceneId && agentId && (
                      <NavMapOverlay 
                        sceneId={sceneId} 
                        agentId={agentId} 
                        overrides={overrides} 
                        onLoadingChange={onNavMapLoadingChange}
                        onDataLoad={setNavMapData}
                        staticNavMapData={staticNavMapData}
                      />
                    )}
                  </>
                ) : (
                  <mesh position={[0, 0.5, 0]}>
                    <boxGeometry />
                    <meshStandardMaterial color="#334155" />
                  </mesh>
                )}
              </Center>
            </Stage>
          </ErrorBoundary>
        </Suspense>
        <OrbitControls makeDefault minDistance={2} maxDistance={50} />
      </Canvas>
      
      {!resolvedMeshUrl && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-slate-900/50 backdrop-blur px-4 py-2 rounded-full text-slate-400 text-sm border border-slate-800">
            Select a scene to begin
          </div>
        </div>
      )}
    </div>
  );
};