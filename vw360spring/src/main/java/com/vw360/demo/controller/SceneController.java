package com.vw360.demo.controller;

import com.vw360.demo.model.Hotspot;
import com.vw360.demo.model.Scene;
import com.vw360.demo.service.SceneService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/scenes")
public class SceneController {

    private final SceneService sceneService;

    public SceneController(SceneService sceneService) {
        this.sceneService = sceneService;
    }

        
    // POST /api/scenes/{scene_id}/hotspots
    @PostMapping("/{sceneId}/hotspots")
    public String addHotspot(@PathVariable String sceneId, @RequestBody Hotspot hotspot) {
        sceneService.addHotspot(sceneId, hotspot);
        return "{\"message\": \"Hotspot added successfully\"}";
    }

    // PUT /api/scenes/{scene_id}/hotspots
    @PutMapping("/{sceneId}/hotspots")
    public String updateHotspot(@PathVariable String sceneId, @RequestBody Hotspot hotspot) {
        sceneService.updateHotspot(sceneId, hotspot);
        return "{\"message\": \"Hotspot updated successfully\"}";
    }

    // DELETE /api/scenes/{scene_id}/hotspots
    @DeleteMapping("/{sceneId}/hotspots")
    public String deleteHotspot(@PathVariable String sceneId, @RequestBody Hotspot hotspot) {
        sceneService.deleteHotspot(sceneId, hotspot);
        return "{\"message\": \"Hotspot deleted successfully\"}";
    }
}

    
    