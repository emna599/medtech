package com.esigelec.ehpad_backend.service;

import com.esigelec.ehpad_backend.dto.AppetiteDto;
import com.esigelec.ehpad_backend.dto.AppetiteDto.Day;
import com.esigelec.ehpad_backend.entity.Meal;
import com.esigelec.ehpad_backend.entity.MealDistribution;
import com.esigelec.ehpad_backend.entity.QuantityEaten;
import com.esigelec.ehpad_backend.entity.ServiceStatus;
import com.esigelec.ehpad_backend.repository.MealDistributionRepository;
import com.esigelec.ehpad_backend.repository.MealRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Tendance d'appétit : ce que le résident a mangé ces derniers jours, d'après les quantités notées par le personnel. */
@Service
public class AppetiteService {

    private static final int MIN_DAYS = 3;
    private static final int MAX_DAYS = 14;
    /** Nombre de derniers jours comparés aux jours précédents. */
    private static final int RECENT_DAYS = 3;

    private final ResidentService residentService;
    private final MealRepository mealRepository;
    private final MealDistributionRepository distributionRepository;

    public AppetiteService(ResidentService residentService,
                           MealRepository mealRepository,
                           MealDistributionRepository distributionRepository) {
        this.residentService = residentService;
        this.mealRepository = mealRepository;
        this.distributionRepository = distributionRepository;
    }

    @Transactional(readOnly = true)
    public AppetiteDto forResident(Long residentId, int requestedDays) {
        residentService.get(residentId); // 404 si le résident n'existe pas ou n'est plus actif
        int days = Math.max(MIN_DAYS, Math.min(MAX_DAYS, requestedDays));
        LocalDate today = LocalDate.now();
        LocalDate first = today.minusDays(days - 1L);

        List<Meal> meals = mealRepository.findByResidentBetween(
                residentId, first.atStartOfDay(), today.plusDays(1).atStartOfDay());
        Map<Long, MealDistribution> distributions = meals.isEmpty() ? Map.of()
                : distributionRepository.findByMealIdIn(meals.stream().map(Meal::getId).toList()).stream()
                .collect(Collectors.toMap(d -> d.getMeal().getId(), Function.identity()));

        List<Day> result = new ArrayList<>();
        for (int i = 0; i < days; i++) {
            LocalDate date = first.plusDays(i);
            double sum = 0;
            int counted = 0;
            int refused = 0;
            for (Meal meal : meals) {
                if (!meal.getScheduledAt().toLocalDate().equals(date)) {
                    continue;
                }
                if (meal.getStatus() == ServiceStatus.REFUSE) {
                    counted++;
                    refused++;
                } else if (meal.getStatus() == ServiceStatus.FAIT) {
                    MealDistribution distribution = distributions.get(meal.getId());
                    if (distribution != null && distribution.getQuantityEaten() != null) {
                        sum += score(distribution.getQuantityEaten());
                        counted++;
                    }
                }
            }
            result.add(new Day(date, counted == 0 ? null : sum / counted, counted, refused));
        }
        return summarize(result);
    }

    private AppetiteDto summarize(List<Day> days) {
        List<Double> scores = days.stream().map(Day::score).filter(s -> s != null).toList();
        if (scores.size() <= RECENT_DAYS) {
            return new AppetiteDto(days, average(scores), null, false);
        }
        List<Double> recent = scores.subList(scores.size() - RECENT_DAYS, scores.size());
        List<Double> previous = scores.subList(0, scores.size() - RECENT_DAYS);
        Double recentAverage = average(recent);
        Double previousAverage = average(previous);
        boolean declining = recentAverage != null
                && (recentAverage < 0.5 || (previousAverage != null && recentAverage <= previousAverage - 0.2));
        return new AppetiteDto(days, recentAverage, previousAverage, declining);
    }

    private static Double average(List<Double> values) {
        if (values.isEmpty()) {
            return null;
        }
        return values.stream().mapToDouble(Double::doubleValue).average().orElse(0);
    }

    private static double score(QuantityEaten quantity) {
        return switch (quantity) {
            case RIEN -> 0.0;
            case QUART -> 0.25;
            case MOITIE -> 0.5;
            case TROIS_QUARTS -> 0.75;
            case TOUT -> 1.0;
        };
    }
}
