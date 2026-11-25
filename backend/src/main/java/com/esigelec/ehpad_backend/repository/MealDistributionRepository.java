package com.esigelec.ehpad_backend.repository;

import com.esigelec.ehpad_backend.entity.MealDistribution;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface MealDistributionRepository extends JpaRepository<MealDistribution, Long> {

    Optional<MealDistribution> findByMealId(Long mealId);

    List<MealDistribution> findByMealIdIn(Collection<Long> mealIds);
}
