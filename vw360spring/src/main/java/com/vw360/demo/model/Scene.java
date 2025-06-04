package com.vw360.demo.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;
import java.util.UUID;

@Document
public class Scene {
    @Id
    private String id = UUID.randomUUID().toString();
    private String name;
    private String image;
    private List<Hotspot> hotspots;

    public Scene() {}

    public Scene(String name, String image, List<Hotspot> hotspots) {
        this.name = name;
        this.image = image;
        this.hotspots = hotspots;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getImage() {
        return image;
    }

    public List<Hotspot> getHotspots() {
        return hotspots;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public void setHotspots(List<Hotspot> hotspots) {
        this.hotspots = hotspots;
    }
}
