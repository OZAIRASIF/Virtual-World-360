package com.vw360.demo.service;

import com.vw360.demo.model.Tour;
import com.vw360.demo.repository.TourRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TourService {
    private final TourRepository tourRepository;

    public TourService(TourRepository tourRepository) {
        this.tourRepository = tourRepository;
    }

    public List<Tour> getAllTours() {
        return tourRepository.findAll();
    }

    public Tour createTour(Tour tour) {
        return tourRepository.save(tour);
    }

    public Tour updateTour(String id, Tour tour) {
        Tour existing = tourRepository.findById(id).orElseThrow();
        existing.setName(tour.getName());
        return tourRepository.save(existing);
    }

    public Tour getTourById(String id) {
        return tourRepository.findById(id).orElseThrow();
    }
}
