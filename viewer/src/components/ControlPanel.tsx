import { useEffect, useState } from 'react';
import { api } from '../api';
import type { SceneInfo, AgentInfo } from '../api';
import { Loader2, Settings2, ChevronDown, ChevronRight, Sparkles } from 'lucide-react';

interface ControlPanelProps {
  onPlanGenerate: (sceneId: string, agentId: string, task: string, overrides?: any) => void;
  onSceneSelect: (sceneId: string) => void;
  onAgentSelect: (agentId: string) => void;
  isGenerating: boolean;
  onOverridesChange?: (overrides: any) => void;
}

const AGENT_ICONS: Record<string, string> = {
  'adult': '/icons/st_man.png',
  'child': '/icons/st_child.png',
  'adult_wheelchair': '/icons/st_wheel.png',
};

export const ControlPanel: React.FC<ControlPanelProps> = ({ onPlanGenerate, onSceneSelect, onAgentSelect, isGenerating, onOverridesChange }) => {
  const [scenes, setScenes] = useState<SceneInfo[]>([]);
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  
  const [selectedScene, setSelectedScene] = useState<string>("");
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [task, setTask] = useState<string>("");
  const [isGeneratingTask, setIsGeneratingTask] = useState(false);
  
  const [overrides, setOverrides] = useState<any>({});
  const [showProperties, setShowProperties] = useState(false);
  const [showAnatomy, setShowAnatomy] = useState(false);

  useEffect(() => {
    if (onOverridesChange) {
      onOverridesChange(overrides);
    }
  }, [overrides, onOverridesChange]);

  useEffect(() => {
    api.getScenes().then(data => {
      if (Array.isArray(data)) {
        setScenes(data);
        if (data.length > 0) {
          const defaultSceneId = "577c772f-369a-46ae-85ed-bf392426180f_LivingRoom-1097";
          const defaultScene = data.find(s => s.id === defaultSceneId) || data[0];
          
          setSelectedScene(defaultScene.id);
          setTask(defaultScene.default_task);
          onSceneSelect(defaultScene.id);
        }
      } else {
        console.error("Invalid scenes data:", data);
      }
    }).catch(console.error);

    api.getAgents().then(data => {
      if (Array.isArray(data)) {
        setAgents(data);
        if (data.length > 0) {
            handleAgentSelect(data[0].id, data);
        }
      } else {
        console.error("Invalid agents data:", data);
      }
    }).catch(console.error);
  }, []);

  const handleAgentSelect = (agentId: string, agentsList = agents) => {
      setSelectedAgent(agentId);
      onAgentSelect(agentId);
      
      const agent = agentsList.find(a => a.id === agentId);
      if (agent) {
          // Reset overrides to the agent's default values
          setOverrides({
              base: {
                  standing_shoulder_height: agent.config.base?.standing_shoulder_height || 1.45,
                  shoulder_to_eye_offset: agent.config.base?.shoulder_to_eye_offset || 0.20,
                  eye_to_top_offset: agent.config.base?.eye_to_top_offset || 0.10,
                  crouch_mobility_factor: agent.config.base?.crouch_mobility_factor ?? 0.4,
              },
              locomotion: {
                  width: agent.config.locomotion?.width || 0.5,
              },
              manipulation: {
                  reach_distance: agent.config.manipulation?.reach_distance || 0.8
              }
          });
      }
  };

  const updateOverride = (path: string[], value: number) => {
      setOverrides((prev: any) => {
          const newOverrides = { ...prev };
          let current = newOverrides;
          for (let i = 0; i < path.length - 1; i++) {
              if (!current[path[i]]) current[path[i]] = {};
              current = current[path[i]];
          }
          current[path[path.length - 1]] = value;
          return newOverrides;
      });
  };

  const handleGenerateTask = async () => {
      if (!selectedScene || !selectedAgent) return;
      setIsGeneratingTask(true);
      try {
          const newTask = await api.generateTask(selectedScene, selectedAgent);
          setTask(newTask);
      } catch (e) {
          console.error("Failed to generate task:", e);
      } finally {
          setIsGeneratingTask(false);
      }
  };

  return (
    <div className="w-80 h-full bg-slate-900 text-white p-4 flex flex-col gap-6 shadow-xl z-10 overflow-y-auto">
      <div>
        <h1 className="text-3xl font-black bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent tracking-tighter leading-none">
          SceneTeract
        </h1>
        <p className="text-[12px] font-medium text-slate-400 mt-2 leading-snug">
          Human-Centric Functional Affordance and VLM Grounding in 3D Scenes
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-400">Scene</label>
        <input 
          list="scene-options"
          className="bg-slate-800 border border-slate-700 rounded p-2 text-sm focus:border-blue-500 outline-none text-white w-full"
          value={selectedScene}
          onChange={(e) => {
            const sceneId = e.target.value;
            setSelectedScene(sceneId);
            
            // Only trigger full update if it's a valid existing scene
            const scene = scenes.find(s => s.id === sceneId);
            if (scene) {
              onSceneSelect(sceneId);
              setTask(scene.default_task);
            }
          }}
          placeholder="Select or type a scene ID..."
        />
        <datalist id="scene-options">
          {scenes.map(s => (
            <option key={s.id} value={s.id}>{s.id.split('_')[1] || s.id}</option>
          ))}
        </datalist>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-slate-400">Agent</label>
        
        {/* Visual Selector */}
        <div className="grid grid-cols-3 gap-2">
            {agents.map(a => {
                const icon = AGENT_ICONS[a.id];
                const isSelected = selectedAgent === a.id;
                return (
                    <button
                        key={a.id}
                        onClick={() => handleAgentSelect(a.id)}
                        className={`
                            flex flex-col items-center justify-center p-2 rounded-lg border transition-all
                            ${isSelected 
                                ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]' 
                                : 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-600'}
                        `}
                        title={a.name}
                    >
                        {icon ? (
                            <img src={icon} alt={a.name} className="w-10 h-14 object-contain mb-1" />
                        ) : (
                            <div className="w-10 h-14 bg-slate-700 rounded-md mb-1 flex items-center justify-center text-xs">?</div>
                        )}
                        <span className="text-[10px] font-medium truncate w-full text-center">{a.name}</span>
                    </button>
                );
            })}
        </div>

        {/* Properties Dropdown */}
        <div className="border border-slate-700 rounded-lg bg-slate-800/50 overflow-hidden">
            <button 
                onClick={() => setShowProperties(!showProperties)}
                className="w-full flex items-center justify-between p-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Settings2 className="w-3 h-3" />
                    <span>Agent Properties</span>
                </div>
                {showProperties ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            
            {showProperties && (
                <div className="p-3 bg-slate-900/50 space-y-3 text-xs border-t border-slate-700">
                    
                    {/* Vertical Anatomy Nested Dropdown */}
                    <div className="border border-slate-700 rounded bg-slate-800/30 overflow-hidden">
                        {(() => {
                            const h = overrides.base?.standing_shoulder_height || 0;
                            const e = overrides.base?.shoulder_to_eye_offset || 0;
                            const t = overrides.base?.eye_to_top_offset || 0;
                            const total = h + e + t;
                            return (
                                <button 
                                    onClick={() => setShowAnatomy(!showAnatomy)}
                                    className="w-full flex items-center justify-between p-2 text-[11px] font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
                                >
                                    <span>Height ({total.toFixed(2)}m)</span>
                                    {showAnatomy ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                </button>
                            );
                        })()}
                        
                        {showAnatomy && (
                            <div className="p-2 space-y-3 bg-slate-900/30 border-t border-slate-700">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-slate-400">
                                        <label>Shoulder Ht (m)</label>
                                        <span>{overrides.base?.standing_shoulder_height?.toFixed(2)}</span>
                                    </div>
                                    <input 
                                        type="range" min="0.5" max="2.0" step="0.01"
                                        value={overrides.base?.standing_shoulder_height || 1.45}
                                        onChange={(e) => updateOverride(['base', 'standing_shoulder_height'], parseFloat(e.target.value))}
                                        className="w-full accent-blue-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between text-slate-400">
                                        <label>Eye Offset (m)</label>
                                        <span>{overrides.base?.shoulder_to_eye_offset?.toFixed(2)}</span>
                                    </div>
                                    <input 
                                        type="range" min="0.05" max="0.4" step="0.01"
                                        value={overrides.base?.shoulder_to_eye_offset || 0.20}
                                        onChange={(e) => updateOverride(['base', 'shoulder_to_eye_offset'], parseFloat(e.target.value))}
                                        className="w-full accent-blue-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between text-slate-400">
                                        <label>Head Top Offset (m)</label>
                                        <span>{overrides.base?.eye_to_top_offset?.toFixed(2)}</span>
                                    </div>
                                    <input 
                                        type="range" min="0.0" max="0.3" step="0.01"
                                        value={overrides.base?.eye_to_top_offset || 0.10}
                                        onChange={(e) => updateOverride(['base', 'eye_to_top_offset'], parseFloat(e.target.value))}
                                        className="w-full accent-blue-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                    
                     <div className="space-y-1">
                        <div className="flex justify-between text-slate-400">
                            <label>Width (m)</label>
                            <span>{(overrides.locomotion?.width || 0.5).toFixed(2)}</span>
                        </div>
                        <input 
                            type="range" min="0.2" max="1.2" step="0.05"
                            value={overrides.locomotion?.width || 0.5}
                            onChange={(e) => updateOverride(['locomotion', 'width'], parseFloat(e.target.value))}
                            className="w-full accent-blue-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                    
                    <div className="space-y-1">
                        <div className="flex justify-between text-slate-400">
                            <label>Reach Dist (m)</label>
                            <span>{overrides.manipulation?.reach_distance}</span>
                        </div>
                        <input 
                            type="range" min="0.3" max="2.0" step="0.05"
                            value={overrides.manipulation?.reach_distance || 0.8}
                            onChange={(e) => updateOverride(['manipulation', 'reach_distance'], parseFloat(e.target.value))}
                            className="w-full accent-blue-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between text-slate-400">
                            <label>Mobility (0=Stiff, 1=Flex)</label>
                            <span>{overrides.base?.crouch_mobility_factor?.toFixed(2)}</span>
                        </div>
                        <input 
                            type="range" min="0.0" max="1.0" step="0.05"
                            value={overrides.base?.crouch_mobility_factor ?? 0.4}
                            onChange={(e) => updateOverride(['base', 'crouch_mobility_factor'], parseFloat(e.target.value))}
                            className="w-full accent-blue-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                </div>
            )}
        </div>
      </div>

      <div className="flex flex-col gap-2 flex-grow">
        <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-slate-400">Task</label>
            <button 
                onClick={handleGenerateTask}
                disabled={isGeneratingTask || isGenerating}
                className="text-[10px] bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded px-2 py-1 flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Generate a random task for this scene"
            >
                {isGeneratingTask ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-yellow-400" />}
                <span>Auto-Generate</span>
            </button>
        </div>
        <textarea 
          className="bg-slate-800 border border-slate-700 rounded p-2 text-sm h-32 resize-none focus:border-blue-500 outline-none"
          value={task}
          onChange={(e) => setTask(e.target.value)}
        />
      </div>

      <button 
        className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => onPlanGenerate(selectedScene, selectedAgent, task, overrides)}
        disabled={isGenerating}
      >
        {isGenerating ? <Loader2 className="animate-spin h-4 w-4" /> : "Generate & Verify Plan"}
      </button>
    </div>
  );
};
