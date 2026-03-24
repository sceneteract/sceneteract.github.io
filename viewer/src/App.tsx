import { useState, useRef, useEffect } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { SceneViewer } from './components/SceneViewer';
import { api } from './api';
import type { PlanStep } from './api';
import { CheckCircle, XCircle, ChevronDown, ChevronRight, AlertCircle, Loader2, Map, Download } from 'lucide-react';

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
  'is_Navigable_To': '/icons/P_nav-alt.png',
  'is_Reachable': '/icons/P_reach-alt.png',
  'is_Interactable': '/icons/P_grasp-alt.png',
  'is_Visible': '/icons/P_vis-alt.png',
  'has_Clearance': '/icons/P_clear-alt.png',
};

// --- Sub-component for individual plan steps ---
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
  
  // Auto-open if running
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
                      isActive
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
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

function App() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isNavMapLoading, setIsNavMapLoading] = useState(false);
  const [steps, setSteps] = useState<StepState[]>([]);
  const [insight, setInsight] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [currentTask, setCurrentTask] = useState<string>("");
  const [showNavMap, setShowNavMap] = useState(false);
  const [activeDebugData, setActiveDebugData] = useState<any | null>(null);
  const [agentOverrides, setAgentOverrides] = useState<any>({});
  
  // Use refs for state accessed inside the event callback closure to avoid stale closures
  const stepsRef = useRef<StepState[]>([]);
  const currentStepIndexRef = useRef<number>(-1);
  const eventTraceRef = useRef<any[]>([]);

  const updateSteps = (newSteps: StepState[]) => {
    stepsRef.current = newSteps;
    setSteps([...newSteps]);
  };

  const handlePlanGenerate = async (sceneId: string, agentId: string, task: string, overrides?: any) => {
    setIsGenerating(true);
    setError(null);
    setInsight(null);
    setStatusMessage("Generating Plan...");
    setActiveDebugData(null);
    updateSteps([]);
    currentStepIndexRef.current = -1;
    eventTraceRef.current = [];
    setCurrentTask(task);

    try {
      await api.generatePlanStream(sceneId, agentId, task, (type, payload) => {
        eventTraceRef.current.push({ type, payload, timestamp: Date.now() });
        const currentSteps = [...stepsRef.current];

        switch (type) {
          case 'log':
             if (payload.level === 'info') {
                 // Remove rich color codes mostly
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
            if (initialSteps.length > 0) {
              initialSteps[0].status = 'running';
            }
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
                step.properties = [...step.properties, {
                  name: payload.name,
                  status: 'running',
                  message: ''
                }];
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
                if (!payload.success) {
                  step.status = 'failure';
                }
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
              updateSteps(currentSteps);
            }
            break;
            
          case 'result':
             setIsGenerating(false);
             if (payload.error) setError(payload.error);
             if (payload.insight) setInsight(payload.insight);
             break;
             
          case 'error':
             setError(payload);
             setIsGenerating(false);
             break;
        }
      }, overrides);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to generate plan");
      setIsGenerating(false);
    }
  };

  const handleExport = async () => {
    if (!selectedSceneId || !selectedAgentId) return;
    
    setIsExporting(true);
    try {
      // 1. Fetch global nav map to include in the bundle
      const globalNavMap = await api.getNavMap(selectedSceneId, selectedAgentId, agentOverrides);
      
      // 2. Build the export bundle
      const bundle = {
        metadata: {
          scene_id: selectedSceneId,
          agent_id: selectedAgentId,
          task: currentTask,
          overrides: agentOverrides
        },
        global_nav_map: globalNavMap,
        events: eventTraceRef.current
      };

      // 3. Trigger JSON download
      const blob = new Blob([JSON.stringify(bundle)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sceneteract_demo_${selectedSceneId}_${selectedAgentId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // 4. Trigger GLB download
      const glbUrl = `http://localhost:8000/api/scene/${selectedSceneId}/mesh`;
      const glbRes = await fetch(glbUrl);
      const glbBlob = await glbRes.blob();
      const glbObjUrl = URL.createObjectURL(glbBlob);
      const glbA = document.createElement('a');
      glbA.href = glbObjUrl;
      glbA.download = `scene_${selectedSceneId}.glb`;
      document.body.appendChild(glbA);
      glbA.click();
      document.body.removeChild(glbA);
      URL.revokeObjectURL(glbObjUrl);
      
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export trace data.");
    } finally {
      setIsExporting(false);
    }
  };

  const toggleDebugData = (stepIndex: number, propName: string, data: any) => {
    const isActive = activeDebugData?.step_index === stepIndex && activeDebugData?.property_name === propName;
    
    if (isActive) {
      if (activeDebugData.showing_interaction_zones && data.image_base64) {
        // Move to Nav Map view
        setActiveDebugData({ ...data, step_index: stepIndex, property_name: propName, showing_interaction_zones: false });
      } else {
        // Hide
        setActiveDebugData(null);
      }
    } else {
      // Start with Interaction Zones if available, else Nav Map
      if (data.interaction_zones_debug_objects) {
        setActiveDebugData({ 
          step_index: stepIndex, 
          property_name: propName, 
          showing_interaction_zones: true, 
          debug_objects: data.interaction_zones_debug_objects 
        });
      } else {
        setActiveDebugData({ 
          ...data, 
          step_index: stepIndex, 
          property_name: propName, 
          showing_interaction_zones: false 
        });
      }
      setShowNavMap(false);
    }
  };

  const hasResults = steps.length > 0 || error || isGenerating;

  return (
    <div className="flex w-full h-screen overflow-hidden">
      <ControlPanel 
        onPlanGenerate={handlePlanGenerate} 
        onSceneSelect={setSelectedSceneId}
        onAgentSelect={setSelectedAgentId}
        isGenerating={isGenerating} 
        onOverridesChange={setAgentOverrides}
      />
      
      <div className="flex-grow relative">
        <SceneViewer 
          sceneId={selectedSceneId} 
          agentId={selectedAgentId}
          showNavMap={showNavMap}
          activeDebugData={activeDebugData}
          overrides={agentOverrides}
          onNavMapLoadingChange={setIsNavMapLoading}
        />
        
        {/* Toggle Nav Map Button & Legend */}
        {selectedSceneId && selectedAgentId && (
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
            <button
              onClick={() => { setShowNavMap(!showNavMap); setActiveDebugData(null); }}
              disabled={isNavMapLoading}
              className={`px-4 py-2 rounded font-medium text-sm border transition-colors shadow-lg flex items-center gap-2 ${
                showNavMap 
                  ? 'bg-blue-600 border-blue-500 text-white hover:bg-blue-500' 
                  : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800'
              } disabled:opacity-80 disabled:cursor-wait`}
            >
              {isNavMapLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Map className="w-4 h-4" />}
              <span>{showNavMap ? "Hide Nav Map" : "Show Nav Map"}</span>
            </button>

            {(showNavMap || activeDebugData) && (
              <div className="bg-slate-900/90 backdrop-blur p-3 rounded-lg border border-slate-700 shadow-xl flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
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
                    {/* <div className="flex items-center gap-2 text-xs text-slate-200">
                      <div className="w-3 h-3 rounded-full bg-green-500 border border-green-400"></div>
                      <span>Agent Pos</span>
                    </div> */}
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
            )}
          </div>
        )}
        
        {/* Results Overlay */}
        {hasResults && (
          <div className="absolute top-4 right-4 w-96 bg-slate-900/95 backdrop-blur text-white rounded-lg shadow-xl max-h-[calc(100vh-2rem)] overflow-y-auto border border-slate-700 flex flex-col">
            <div className="p-4 border-b border-slate-700 sticky top-0 bg-slate-900/95 backdrop-blur z-10 flex justify-between items-center">
              <h2 className="text-lg font-bold bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent flex items-center gap-2">
                {isGenerating && <Loader2 className="w-4 h-4 animate-spin text-green-400" />}
                Plan Execution
              </h2>
              <div className="flex items-center gap-2">
                {!isGenerating && steps.length > 0 && (
                  <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded transition-colors disabled:opacity-50"
                    title="Export Trace & 3D Scene for the Website"
                  >
                    {isExporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                    Save for Web
                  </button>
                )}
                <button 
                  onClick={() => { setSteps([]); setError(null); setInsight(null); setActiveDebugData(null); }}
                  className="text-slate-400 hover:text-white ml-2"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {isGenerating && steps.length === 0 && !error && (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-3">
                      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                      <div className="text-sm font-mono animate-pulse">{statusMessage || "Processing..."}</div>
                  </div>
              )}

              {error ? (
                <div className="p-4 bg-red-900/20 border border-red-800 rounded flex gap-3 text-red-200 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <div>
                    <div className="font-bold">Execution Failed</div>
                    {error}
                  </div>
                </div>
              ) : (
                <>
                {steps.map((stepState, idx) => (
                    <PlanStepItem 
                      key={idx} 
                      index={idx} 
                      stepState={stepState} 
                      onShowDebug={toggleDebugData}
                      activeDebugData={activeDebugData}
                    />
                  ))}
                
                {insight && (
                    <div className="mt-4 p-4 bg-blue-900/20 border border-blue-800 rounded text-sm text-slate-200">
                      <div className="font-bold text-blue-300 mb-2 flex items-center gap-2">
                        <span className="text-lg">💡</span> Actionable Insight
                      </div>
                      {insight}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;