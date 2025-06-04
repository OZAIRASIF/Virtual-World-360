package com.vw360.demo.controller;

import com.vw360.demo.model.Scene;
import com.vw360.demo.model.Tour;
import com.vw360.demo.service.SceneService;
import com.vw360.demo.service.TourService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/tours")
public class TourController {

    private final TourService tourService;
    private final SceneService sceneService;

    public TourController(TourService tourService, SceneService sceneService) {
        this.tourService = tourService;
        this.sceneService = sceneService;
    }

    // GET /api/tours
    @GetMapping
    public List<Tour> getAllTours() {
        return tourService.getAllTours();
    }

    // POST /api/tours
    @PostMapping
    public Tour createTour(@RequestBody Tour tour) {
        return tourService.createTour(tour);
    }

    // PUT /api/tours/{id}
    @PutMapping("/{id}")
    public Tour updateTour(@PathVariable String id, @RequestBody Tour tour) {
        return tourService.updateTour(id, tour);
    }

    // GET /api/tours/{id}
    @GetMapping("/{id}")
    public Tour getTour(@PathVariable String id) {
        return tourService.getTourById(id);
    }

    // POST /api/tours/{tourId}/scenes
    @PostMapping("/{tourId}/scenes")
    public Scene addSceneToTour(@PathVariable String tourId, @RequestParam("file") MultipartFile file) {
        return sceneService.createScene(tourId, file);
    }

    // GET /api/tours/{tourId}/scenes
    @GetMapping("/{tourId}/scenes")
    public List<Scene> getScenesForTour(@PathVariable String tourId) {
        return sceneService.getScenesByTourId(tourId);
    }

    // DELETE /api/tours/{tourId}/scenes/{sceneId}
    @DeleteMapping("/{tourId}/scenes/{sceneId}")
    public void deleteSceneFromTour(@PathVariable String tourId, @PathVariable String sceneId) {
        sceneService.deleteScene(tourId, sceneId);
    }

    
    // PUT /api/tours/{tour_id}/scenes/{scene_id}
    @PutMapping("/{tourId}/scenes/{sceneId}")
    public String updateSceneName(
        @PathVariable String tourId,
        @PathVariable String sceneId,
        @RequestBody Scene scene
    ) {
        sceneService.updateSceneName(sceneId, scene.getName());
        return "{\"message\": \"Scene name updated successfully\"}";
    }

}
