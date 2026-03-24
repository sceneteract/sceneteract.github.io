const API_BASE = "http://localhost:8000/api";

export interface SceneInfo {
  id: string;
  default_task: string;
  type: string;
}

export interface AgentInfo {
  id: string;
  name: string;
  config: any;
}

export interface PlanStep {
  object_id: string;
  semantic_action: string;
  object_category?: string;
  properties?: string[];
}

export interface PlanResponse {
  success: boolean;
  plan: PlanStep[];
  error?: string;
  verification_report?: any;
}

export interface NavMapResponse {
  image_base64: string;
  origin: number[];
  scale: number;
  width: number;
  height: number;
  floor_y: number;
}

export const api = {
  getScenes: async (): Promise<SceneInfo[]> => {
    try {
      const res = await fetch(`${API_BASE}/scenes`);
      if (!res.ok) throw new Error(`Scenes fetch failed: ${res.statusText}`);
      return res.json();
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  getAgents: async (): Promise<AgentInfo[]> => {
    try {
      const res = await fetch(`${API_BASE}/agents`);
      if (!res.ok) throw new Error(`Agents fetch failed: ${res.statusText}`);
      return res.json();
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  getNavMap: async (sceneId: string, agentId: string, overrides?: any): Promise<NavMapResponse | null> => {
    try {
      const res = await fetch(`${API_BASE}/scene/${sceneId}/nav_map`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_id: agentId,
          agent_config_overrides: overrides
        })
      });
      if (!res.ok) throw new Error(`NavMap fetch failed: ${res.statusText}`);
      return res.json();
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  generatePlan: async (sceneId: string, agentId: string, task: string, overrides?: any): Promise<PlanResponse> => {
    const res = await fetch(`${API_BASE}/plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scene_id: sceneId,
        agent_id: agentId,
        task_description: task,
        agent_config_overrides: overrides
      })
    });
    return res.json();
  },

  generatePlanStream: async (
    sceneId: string, 
    agentId: string, 
    task: string, 
    onEvent: (type: string, payload: any) => void,
    overrides?: any
  ): Promise<void> => {
    const res = await fetch(`${API_BASE}/plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scene_id: sceneId,
        agent_id: agentId,
        task_description: task,
        agent_config_overrides: overrides
      })
    });

    if (!res.ok) throw new Error(`Plan generation failed: ${res.statusText}`);
    if (!res.body) throw new Error("No response body");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";

      for (const part of parts) {
        if (part.startsWith("data: ")) {
          try {
            const jsonStr = part.slice(6);
            const event = JSON.parse(jsonStr);
            if (event.type && event.payload !== undefined) {
               onEvent(event.type, event.payload);
            }
          } catch (e) {
            console.error("Failed to parse SSE event:", part, e);
          }
        }
      }
    }
  },
    generateTask: async (sceneId: string, agentId: string): Promise<string> => {
        const res = await fetch(`${API_BASE}/generate_task`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                scene_id: sceneId,
                agent_id: agentId,
                front_type: "livingroom" // Default, could be inferred if needed
            })
        });
        if (!res.ok) throw new Error(`Task generation failed: ${res.statusText}`);
        const data = await res.json();
        return data.task;
    },

    takeSnapshot: async (
      sceneId: string, 
      position: number[], 
      quaternion: number[], 
      fov: number,
      debugData?: any,
      navMapData?: any
    ): Promise<string> => {
        const res = await fetch(`${API_BASE}/scene/${sceneId}/snapshot`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                position,
                quaternion,
                fov,
                front_type: "livingroom",
                debug_data: debugData,
                nav_map_data: navMapData
            })
        });
        if (!res.ok) throw new Error(`Snapshot failed: ${res.statusText}`);
        const data = await res.json();
        return data.image_base64;
    }
};
