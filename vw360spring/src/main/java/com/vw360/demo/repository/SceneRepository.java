package com.vw360.demo.repository;

import com.vw360.demo.model.Scene;
import org.springframework.data.mongodb.repository.MongoRepository;


public interface SceneRepository extends MongoRepository<Scene, String> {
}
