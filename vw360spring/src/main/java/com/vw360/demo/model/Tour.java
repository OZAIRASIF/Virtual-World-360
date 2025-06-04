package com.vw360.demo.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Document
public class Tour {
    @Id
    private String id = UUID.randomUUID().toString();
    private String name;
    private List<String> sceneIds = new ArrayList<>();

    public String getId() { return id; }
    public String getName() { return name; }
    public List<String> getSceneIds() { return sceneIds; }

    public void setName(String name) { this.name = name; }
}
