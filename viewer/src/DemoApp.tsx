import { useState, useRef, useEffect } from 'react';
import { SceneViewer } from './components/SceneViewer';
import { CheckCircle, XCircle, ChevronDown, ChevronRight, AlertCircle, Loader2, Map, Play, Pause, RotateCcw } from 'lucide-react';
import type { PlanStep } from './api';

// Reuse types from App.tsx
interface PropertyState {
  name: string;
  status: 'pending' | 'running' | 'success' | 'failure';
  message: string;
  debugData?: any;
}

interface StepState {
  step: PlanStep;
  status: 'pending' | 'running' | 'success' | 'failure';
  properties: PropertyState[];
}

const PROPERTY_ICONS: Record<string, string> = {
  'is_Navigable_To': './icons/P_nav-alt.png',
  'is_Reachable': './icons/P_reach-alt.png',
  'is_Interactable': './icons/P_grasp-alt.png',
  'is_Visible': './icons/P_vis-alt.png',
  'has_Clearance': './icons/P_clear-alt.png',
};

const AGENT_ICONS: Record<string, string> = {
  'adult': './icons/st_man.png',
  'child': './icons/st_child.png',
  'adult_wheelchair': './icons/st_wheel.png',
};

const PlanStepItem = ({ 
  stepState, 
  index, 
  onShowDebug, 
  activeDebugData 
}: { 
  stepState: StepState, 
  index: number,
  onShowDebug: (stepIndex: number, propName: string, data: any) => void,
  activeDebugData: any
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isRunning = stepState.status === 'running';
  
  useEffect(() => {
    if (isRunning) setIsOpen(true);
  }, [isRunning]);

  const borderColor = 
    stepState.status === 'running' ? 'border-blue-500 bg-blue-900/10' :
    stepState.status === 'success' ? 'border-green-800 bg-green-900/20' :
    stepState.status === 'failure' ? 'border-red-800 bg-red-900/20' :
    'border-slate-700 bg-slate-800/50';

  const icon = 
    stepState.status === 'running' ? <Loader2 className="w-5 h-5 text-blue-500 animate-spin shrink-0" /> :
    stepState.status === 'success' ? <CheckCircle className="w-5 h-5 text-green-500 shrink-0" /> :
    stepState.status === 'failure' ? <XCircle className="w-5 h-5 text-red-500 shrink-0" /> :
    <div className="w-5 h-5 rounded-full border border-slate-600 shrink-0" />;

  return (
    <div className={`rounded border transition-colors ${borderColor}`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/5 transition-colors"
      >
        {icon}
        <div className="flex-grow min-w-0 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="font-semibold text-sm truncate">{index + 1}. {stepState.step.semantic_action}</div>
            <div className="text-xs text-slate-400 truncate">
              {stepState.step.object_id} 
              {stepState.step.object_category && <span className="text-slate-500 ml-1">({stepState.step.object_category})</span>}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {stepState.properties.map((p, i) => {
                const iconPath = PROPERTY_ICONS[p.name];
                if (!iconPath) return null;
                return (
                    <img 
                        key={i} 
                        src={iconPath} 
                        className={`w-6 h-6 ${p.status === 'success' ? 'opacity-100' : 'opacity-50 grayscale'}`} 
                        title={p.name} 
                        alt={p.name}
                    />
                );
            })}
          </div>
        </div>
        {stepState.properties.length > 0 && (
          isOpen ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />
        )}
      </button>
      {isOpen && stepState.properties.length > 0 && (
        <div className="border-t border-slate-700/50 p-3 bg-black/20 text-xs flex flex-col gap-2">
          {stepState.properties.map((prop, i) => (
            <div key={i} className="flex items-center gap-2 w-full">
              <div className="w-3 h-3 flex items-center justify-center mt-0.5 shrink-0">
                {prop.status === 'running' ? (
                  <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                ) : prop.status === 'success' ? (
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                ) : prop.status === 'failure' ? (
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full border border-slate-600" />
                )}
              </div>
              <div className="flex-grow min-w-0">
                <span className={`font-mono font-bold ${
                  prop.status === 'running' ? 'text-blue-300' :
                  prop.status === 'success' ? 'text-green-300' : 
                  prop.status === 'failure' ? 'text-red-300' : 'text-slate-500'
                }`}>
                  {prop.name}
                </span>
                <p className="text-slate-300 mt-0.5">{prop.message || (prop.status === 'running' ? 'Checking...' : '')}</p>
              </div>
              {prop.debugData && (() => {
                const isActive = activeDebugData?.step_index === index && activeDebugData?.property_name === prop.name;
                const buttonText = isActive 
                  ? (activeDebugData.showing_interaction_zones && prop.debugData.image_base64 ? 'Map' : 'Hide') 
                  : 'Show';
                return (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onShowDebug(index, prop.name, prop.debugData); }}
                    className={`shrink-0 w-14 justify-center px-2 py-1 rounded text-[10px] uppercase font-bold transition-colors ${
                      isActive ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {buttonText}
                  </button>
                );
              })()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function DemoApp() {
  const [hasStarted, setHasStarted] = useState(false);
  const [traceData, setTraceData] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(500); // ms per event
  
  const [steps, setSteps] = useState<StepState[]>([]);
  const [insight, setInsight] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  
  const [showNavMap, setShowNavMap] = useState(false);
  const [activeDebugData, setActiveDebugData] = useState<any | null>(null);
  
  const stepsRef = useRef<StepState[]>([]);
  const currentStepIndexRef = useRef<number>(-1);
  const eventIndexRef = useRef<number>(0);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (!hasStarted) return;
    fetch('./demo_trace.json').then(r => {
      if (!r.ok) {
        throw new Error("HTTP error " + r.status);
      }
      return r.json();
    }).then(data => {
      setTraceData(data);
    }).catch(e => {
      console.error("Failed to load trace data:", e);
    });
  }, [hasStarted]);

  const updateSteps = (newSteps: StepState[]) => {
    stepsRef.current = newSteps;
    setSteps([...newSteps]);
  };

  const processEvent = (event: any) => {
    const type = event.type;
    const payload = event.payload;
    const currentSteps = [...stepsRef.current];

    switch (type) {
      case 'log':
         if (payload.level === 'info') {
             const cleanMsg = payload.message.replace(/\[.*?\]/g, ''); 
             setStatusMessage(cleanMsg);
         }
         break;
      case 'plan_generated':
        const initialSteps: StepState[] = payload.plan.map((s: PlanStep) => ({
          step: s,
          status: 'pending',
          properties: (s.properties || []).map(pName => ({
            name: pName,
            status: 'pending',
            message: ''
          }))
        }));
        if (initialSteps.length > 0) initialSteps[0].status = 'running';
        updateSteps(initialSteps);
        break;
      case 'action_start':
        const match = payload.title?.match(/Step (\d+):/);
        if (match) {
          const idx = parseInt(match[1]) - 1;
          if (idx >= 0 && idx < currentSteps.length) {
            currentStepIndexRef.current = idx;
            currentSteps[idx] = { ...currentSteps[idx], status: 'running' };
            updateSteps(currentSteps);
          }
        }
        break;
      case 'action_end':
        const endIdx = currentStepIndexRef.current;
        if (endIdx >= 0 && endIdx < currentSteps.length) {
           if (currentSteps[endIdx].status !== 'failure') {
             currentSteps[endIdx] = { ...currentSteps[endIdx], status: 'success' };
           }
           updateSteps(currentSteps);
        }
        break;
      case 'property_start':
        const pStartIdx = currentStepIndexRef.current;
        if (pStartIdx >= 0 && pStartIdx < currentSteps.length) {
          const step = { ...currentSteps[pStartIdx] };
          if (step.status === 'pending') step.status = 'running';
          const propIdx = step.properties.findIndex(p => p.name === payload.name);
          if (propIdx !== -1) {
            const newProps = [...step.properties];
            newProps[propIdx] = { ...newProps[propIdx], status: 'running' };
            step.properties = newProps;
          } else {
            step.properties = [...step.properties, { name: payload.name, status: 'running', message: '' }];
          }
          currentSteps[pStartIdx] = step;
          updateSteps(currentSteps);
        }
        break;
      case 'property_end':
        const pEndIdx = currentStepIndexRef.current;
        if (pEndIdx >= 0 && pEndIdx < currentSteps.length) {
          const step = { ...currentSteps[pEndIdx] };
          const props = [...step.properties];
          const runningPropIdx = props.findIndex(p => p.status === 'running');
          if (runningPropIdx !== -1) {
            props[runningPropIdx] = {
              ...props[runningPropIdx],
              status: payload.success ? 'success' : 'failure',
              message: payload.message
            };
            step.properties = props;
            if (!payload.success) step.status = 'failure';
            currentSteps[pEndIdx] = step;
            updateSteps(currentSteps);
          }
        }
        break;
      case 'property_debug_data':
        const sIdx = payload.step_index;
        const pName = payload.property_name;
        if (sIdx >= 0 && sIdx < currentSteps.length) {
          const step = { ...currentSteps[sIdx] };
          step.properties = step.properties.map(p => 
            p.name === pName ? { ...p, debugData: payload } : p
          );
          currentSteps[sIdx] = step;
          
          // Auto-show debug data in demo mode
          setActiveDebugData({
            ...payload, 
            showing_interaction_zones: false 
          });

          updateSteps(currentSteps);
        }
        break;
      case 'result':
         if (payload.insight) setInsight(payload.insight);
         setIsPlaying(false);
         break;
    }
  };

  const playNextEvent = () => {
    if (!traceData || eventIndexRef.current >= traceData.events.length) {
      setIsPlaying(false);
      return;
    }
    const event = traceData.events[eventIndexRef.current];
    processEvent(event);
    eventIndexRef.current += 1;
    
    // Check next event. If it's a fast log, schedule it quickly, else wait
    if (eventIndexRef.current < traceData.events.length && isPlaying) {
       timerRef.current = setTimeout(playNextEvent, playbackSpeed);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setTimeout(playNextEvent, playbackSpeed);
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying]);

  const resetSimulation = () => {
    setIsPlaying(false);
    eventIndexRef.current = 0;
    updateSteps([]);
    setInsight(null);
    setStatusMessage(null);
    setActiveDebugData(null);
  };

  const toggleDebugData = (stepIndex: number, propName: string, data: any) => {
    const isActive = activeDebugData?.step_index === stepIndex && activeDebugData?.property_name === propName;
    if (isActive) {
      if (activeDebugData.showing_interaction_zones && data.image_base64) {
        setActiveDebugData({ ...data, step_index: stepIndex, property_name: propName, showing_interaction_zones: false });
      } else {
        setActiveDebugData(null);
      }
    } else {
      if (data.interaction_zones_debug_objects) {
        setActiveDebugData({ step_index: stepIndex, property_name: propName, showing_interaction_zones: true, debug_objects: data.interaction_zones_debug_objects });
      } else {
        setActiveDebugData({ ...data, step_index: stepIndex, property_name: propName, showing_interaction_zones: false });
      }
      setShowNavMap(false);
    }
  };

  if (!hasStarted) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-slate-950 text-white relative">
        <div className="absolute inset-0 bg-slate-900 opacity-50" style={{ backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        <div className="z-10 flex flex-col items-center gap-6 bg-slate-900/80 p-8 md:p-12 rounded-2xl border border-slate-700 backdrop-blur shadow-2xl max-w-2xl text-center">
          <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center border border-blue-500/30">
            <Play className="w-8 h-8 text-blue-400 ml-1" />
          </div>
          <div>
            <h2 className="text-3xl font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent tracking-tight mb-3">
              Interactive 3D Demo
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              Experience how SceneTeract decomposes and grounds an activity within a 3D scene step-by-step.
            </p>
          </div>
          <button
            onClick={() => setHasStarted(true)}
            className="mt-4 px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold flex items-center gap-3 transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)]"
          >
            Load Interactive Demo <span className="text-blue-200 font-normal text-sm">(~15MB)</span>
          </button>
        </div>
      </div>
    );
  }

  if (!traceData) {
    return (
      <div className="w-full h-screen flex flex-col gap-4 items-center justify-center bg-slate-950 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="font-medium animate-pulse">Downloading Scene Data...</span>
      </div>
    );
  }

  const { scene_id, agent_id, task } = traceData.metadata;
  const displaySceneId = scene_id.includes('_') ? scene_id.split('_').pop() : scene_id;
  const agentIcon = AGENT_ICONS[agent_id] || AGENT_ICONS['adult'];

  return (
    <div className="flex flex-col md:flex-row w-full h-screen overflow-hidden text-white font-sans text-left bg-slate-950">
      <div className="w-full md:w-80 h-auto md:h-full bg-slate-900 p-4 flex flex-row md:flex-col gap-4 md:gap-6 shadow-xl z-10 overflow-x-auto md:overflow-x-hidden md:overflow-y-auto shrink-0 border-b md:border-b-0 md:border-r border-slate-800 items-center md:items-stretch">
        <div className="shrink-0 md:shrink">
          <h1 className="text-lg md:text-2xl font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent tracking-tighter leading-none mb-1 md:mb-2">
            SceneTeract Demo
          </h1>
          <div className="hidden md:block text-sm text-slate-300">
            <strong>Task:</strong> {task}
          </div>
          <div className="flex items-center gap-2 md:gap-3 mt-0 md:mt-3 bg-slate-800/50 p-1.5 md:p-2 rounded-lg border border-slate-700/50 min-w-[140px] md:min-w-0">
            <img src={agentIcon} alt={agent_id} className="w-6 h-8 md:w-10 md:h-14 object-contain bg-slate-800 rounded p-0.5 md:p-1" />
            <div className="text-[10px] md:text-xs text-slate-300 flex flex-col justify-center">
              <span className="truncate max-w-[80px] md:max-w-none"><strong>Agent:</strong> {agent_id.replace('_', ' ')}</span>
              <span className="hidden md:inline"><strong>Scene:</strong> {displaySceneId}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-row md:flex-col gap-2 flex-grow md:flex-grow-0 items-center md:items-stretch min-w-[120px] md:min-w-0">
          <div className="flex gap-2 w-full">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex-1 py-1.5 md:py-2 px-3 md:px-4 rounded flex items-center justify-center gap-2 font-bold text-xs md:text-sm transition-colors shrink-0 ${isPlaying ? 'bg-orange-600 hover:bg-orange-500' : 'bg-green-600 hover:bg-green-500'}`}
            >
              {isPlaying ? <><Pause className="w-3 h-3 md:w-4 md:h-4"/> Pause</> : <><Play className="w-3 h-3 md:w-4 md:h-4"/> Play</>}
            </button>
            <button 
              onClick={resetSimulation}
              className="px-2 md:px-4 py-1.5 md:py-2 bg-slate-800 hover:bg-slate-700 rounded flex items-center justify-center transition-colors shrink-0"
              title="Reset Trace"
            >
              <RotateCcw className="w-3 h-3 md:w-4 md:h-4"/>
            </button>
          </div>
        </div>

        <div className="hidden md:block space-y-3">
            {steps.map((stepState, idx) => (
                <PlanStepItem 
                    key={idx} 
                    index={idx} 
                    stepState={stepState} 
                    onShowDebug={toggleDebugData}
                    activeDebugData={activeDebugData}
                />
            ))}
        </div>
        
        {insight && (
            <div className="hidden md:block mt-4 p-4 bg-blue-900/20 border border-blue-800 rounded text-sm text-slate-200">
                <div className="font-bold text-blue-300 mb-2 flex items-center gap-2">
                <span className="text-lg">💡</span> Actionable Insight
                </div>
                {insight}
            </div>
        )}
      </div>
      
      <div className="flex-grow relative">
        <SceneViewer 
          sceneId={scene_id} 
          agentId={agent_id}
          showNavMap={showNavMap}
          activeDebugData={activeDebugData}
          meshUrl="./demo_scene.glb"
          staticNavMapData={traceData.global_nav_map}
        />
        
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
            <button
              onClick={() => { setShowNavMap(!showNavMap); setActiveDebugData(null); }}
              className={`px-4 py-2 rounded font-medium text-sm border transition-colors shadow-lg flex items-center gap-2 ${
                showNavMap 
                  ? 'bg-blue-600 border-blue-500 text-white hover:bg-blue-500' 
                  : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Map className="w-4 h-4" />
              <span>{showNavMap ? "Hide Nav Map" : "Show Nav Map"}</span>
            </button>
        </div>

        {/* Legend */}
        {(showNavMap || activeDebugData) && (
          <div className="absolute top-4 right-4 z-10">
            <div className="bg-slate-900/90 backdrop-blur p-3 rounded-lg border border-slate-700 shadow-xl flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-200 w-48">
              <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">
                {activeDebugData ? `${activeDebugData.property_name} Legend` : 'Navigation Legend'}
              </div>
              
              {activeDebugData?.property_name === 'is_Visible' ? (
                <>
                  <div className="flex items-center gap-2 text-xs text-slate-200">
                    <div className="w-3 h-3 rounded-full bg-green-500 border border-green-400"></div>
                    <span>Visible Ray</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-200">
                    <div className="w-3 h-3 rounded-full bg-red-500 border border-red-400"></div>
                    <span>Blocked Ray</span>
                  </div>
                </>
              ) : activeDebugData?.property_name === 'has_Clearance' ? (
                <>
                  <div className="flex items-center gap-2 text-xs text-slate-200">
                    <div className="w-3 h-3 rounded-full bg-green-500 border border-green-400"></div>
                    <span>Valid Clearance</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-200">
                    <div className="w-3 h-3 rounded-full bg-red-500 border border-red-400"></div>
                    <span>Collision / Blocked</span>
                  </div>
                </>
              ) : activeDebugData?.property_name === 'is_Reachable' ? (
                <>
                  <div className="flex items-center gap-2 text-xs text-slate-200">
                    <div className="w-3 h-3 rounded-full bg-green-500 border border-green-400"></div>
                    <span>Reachable Area</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-200">
                    <div className="w-3 h-3 rounded-full bg-purple-500 border border-purple-400"></div>
                    <span>Unreachable Area</span>
                  </div>
                </>
              ) : activeDebugData?.property_name === 'is_Interactable' ? (
                <>
                  <div className="flex items-center gap-2 text-xs text-slate-200">
                    <div className="w-3 h-3 rounded-full bg-pink-500 border border-pink-400"></div>
                    <span>Interactable Volume</span>
                  </div>
                </>
              ) : activeDebugData?.showing_interaction_zones ? (
                <>
                  <div className="flex items-center gap-2 text-xs text-slate-200">
                    <div className="w-3 h-3 bg-red-500 border border-red-400"></div>
                    <span>North Zone</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-200">
                    <div className="w-3 h-3 bg-blue-500 border border-blue-400"></div>
                    <span>South Zone</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-200">
                    <div className="w-3 h-3 bg-green-500 border border-green-400"></div>
                    <span>West Zone</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-200">
                    <div className="w-3 h-3 bg-yellow-500 border border-yellow-400"></div>
                    <span>East Zone</span>
                  </div>
                </>
              ) : activeDebugData ? (
                <>
                  <div className="flex items-center gap-2 text-xs text-slate-200">
                    <div className="w-3 h-3 rounded-full bg-yellow-500 border border-yellow-400"></div>
                    <span>Target Zones</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-200">
                    <div className="w-3 h-3 rounded-full bg-blue-500 border border-blue-400"></div>
                    <span>Actual Path</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-xs text-slate-200">
                    <div className="w-3 h-3 rounded-full bg-green-500 border border-green-400"></div>
                    <span>Walkable Area</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-200">
                    <div className="w-3 h-3 rounded-full bg-yellow-500 border border-yellow-400"></div>
                    <span>Isolated Island</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-200">
                    <div className="w-3 h-3 rounded-full bg-red-500 border border-red-400"></div>
                    <span>Obstacle / Blocked</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}