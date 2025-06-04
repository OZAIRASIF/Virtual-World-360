package com.vw360.demo.repository;

import com.vw360.demo.model.Tour;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface TourRepository extends MongoRepository<Tour, String> {
}
