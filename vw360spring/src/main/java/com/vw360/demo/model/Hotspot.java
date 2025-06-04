package com.vw360.demo.model;

public class Hotspot {
    private double pitch;
    private double yaw;
    private String sceneId;
    private String text;
    private String type;

    public double getPitch() { return pitch; }
    public double getYaw() { return yaw; }
    public String getSceneId() { return sceneId; }
    public String getText() { return text; }
    public String getType() { return type; }

    public void setPitch(double pitch) { this.pitch = pitch; }
    public void setYaw(double yaw) { this.yaw = yaw; }
    public void setSceneId(String sceneId) { this.sceneId = sceneId; }
    public void setText(String text) { this.text = text; }
    public void setType(String type) { this.type = type; }
}
