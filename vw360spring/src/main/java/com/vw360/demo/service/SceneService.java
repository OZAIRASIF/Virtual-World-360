package com.vw360.demo.service;

import com.cloudinary.Cloudinary;
import com.vw360.demo.model.Hotspot;
import com.vw360.demo.model.Scene;
import com.vw360.demo.model.Tour;
import com.vw360.demo.repository.SceneRepository;
import com.vw360.demo.repository.TourRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class SceneService {
    private final SceneRepository sceneRepository;
    private final TourRepository tourRepository;
    private final Cloudinary cloudinary;

    public SceneService(SceneRepository sceneRepository, TourRepository tourRepository, Cloudinary cloudinary) {
        this.sceneRepository = sceneRepository;
        this.tourRepository = tourRepository;
        this.cloudinary = cloudinary;
    }

    public Scene createScene(String tourId, MultipartFile file) {
        try {
            Map upload = cloudinary.uploader().upload(file.getBytes(), Map.of());
            String imageUrl = (String) upload.get("secure_url");

            Scene scene = new Scene("New Scene", imageUrl, new ArrayList<>());
            scene = sceneRepository.save(scene);

            Tour tour = tourRepository.findById(tourId).orElseThrow();
            tour.getSceneIds().add(scene.getId());
            tourRepository.save(tour);

            return scene;
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public List<Scene> getScenesByTourId(String tourId) {
        Tour tour = tourRepository.findById(tourId).orElseThrow();
        return sceneRepository.findAllById(tour.getSceneIds());
    }

    public Scene updateSceneName(String sceneId, String name) {
        Scene scene = sceneRepository.findById(sceneId).orElseThrow();
        scene.setName(name);
        return sceneRepository.save(scene);
    }

    public void deleteScene(String tourId, String sceneId) {
        Tour tour = tourRepository.findById(tourId).orElseThrow();
        tour.getSceneIds().remove(sceneId);
        tourRepository.save(tour);
        sceneRepository.deleteById(sceneId);
    }

    public Scene addHotspot(String sceneId, Hotspot hotspot) {
        Scene scene = sceneRepository.findById(sceneId).orElseThrow();
        scene.getHotspots().add(hotspot);
        return sceneRepository.save(scene);
    }

    public Scene updateHotspot(String sceneId, Hotspot updatedHotspot) {
        Scene scene = sceneRepository.findById(sceneId).orElseThrow();
        scene.getHotspots().removeIf(h -> h.getPitch() == updatedHotspot.getPitch() && h.getYaw() == updatedHotspot.getYaw());
        scene.getHotspots().add(updatedHotspot);
        return sceneRepository.save(scene);
    }

    public Scene deleteHotspot(String sceneId, Hotspot hotspotToDelete) {
    Scene scene = sceneRepository.findById(sceneId).orElseThrow();
    List<Hotspot> newHotspots = new ArrayList<>();
    boolean deleted = false;
    for (Hotspot hs : scene.getHotspots()) {
        if (hs.getPitch() == hotspotToDelete.getPitch() &&
            hs.getYaw() == hotspotToDelete.getYaw()) {
            deleted = true;
            continue; // skip this one (delete)
        }
        newHotspots.add(hs);
    }
    if (!deleted) {
        throw new RuntimeException("Hotspot not found");
    }
    scene.setHotspots(newHotspots);
    return sceneRepository.save(scene);
}

}
