package com.esigelec.ehpad_backend.service;

import com.esigelec.ehpad_backend.dto.AppetiteDto;
import com.esigelec.ehpad_backend.entity.Meal;
import com.esigelec.ehpad_backend.entity.MealDistribution;
import com.esigelec.ehpad_backend.entity.QuantityEaten;
import com.esigelec.ehpad_backend.entity.ServiceStatus;
import com.esigelec.ehpad_backend.exception.ResourceNotFoundException;
import com.esigelec.ehpad_backend.repository.MealDistributionRepository;
import com.esigelec.ehpad_backend.repository.MealRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.function.IntFunction;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AppetiteServiceTest {

    private ResidentService residentService;
    private MealRepository mealRepository;
    private MealDistributionRepository distributionRepository;
    private AppetiteService service;

    @BeforeEach
    void setUp() {
        residentService = mock(ResidentService.class);
        mealRepository = mock(MealRepository.class);
        distributionRepository = mock(MealDistributionRepository.class);
        service = new AppetiteService(residentService, mealRepository, distributionRepository);
    }

    @Test
    void flagsADeclineWhenTheLastThreeDaysAreMuchWorse() {
        // il y a 6 à 3 jours : tout mangé ; depuis 2 jours : rien mangé
        givenSevenDays(daysAgo -> daysAgo >= 3 ? QuantityEaten.TOUT : QuantityEaten.RIEN);

        AppetiteDto result = service.forResident(1L, 7);

        assertThat(result.days()).hasSize(7);
        assertThat(result.recentAverage()).isEqualTo(0.0);
        assertThat(result.previousAverage()).isEqualTo(1.0);
        assertThat(result.declining()).isTrue();
    }

    @Test
    void staysCalmWhenAppetiteIsGood() {
        givenSevenDays(daysAgo -> QuantityEaten.TOUT);

        AppetiteDto result = service.forResident(1L, 7);

        assertThat(result.recentAverage()).isEqualTo(1.0);
        assertThat(result.declining()).isFalse();
    }

    @Test
    void countsARefusedMealAsZero() {
        Meal refused = meal(1L, LocalDate.now(), ServiceStatus.REFUSE);
        when(mealRepository.findByResidentBetween(eq(1L), any(), any())).thenReturn(List.of(refused));
        when(distributionRepository.findByMealIdIn(anyCollection())).thenReturn(List.of());

        AppetiteDto result = service.forResident(1L, 7);

        AppetiteDto.Day today = result.days().get(result.days().size() - 1);
        assertThat(today.score()).isEqualTo(0.0);
        assertThat(today.refused()).isEqualTo(1);
    }

    @Test
    void leavesDaysWithoutMealsEmpty() {
        when(mealRepository.findByResidentBetween(eq(1L), any(), any())).thenReturn(List.of());

        AppetiteDto result = service.forResident(1L, 7);

        assertThat(result.days()).allMatch(day -> day.score() == null);
        assertThat(result.recentAverage()).isNull();
        assertThat(result.declining()).isFalse();
    }

    @Test
    void keepsTheNumberOfDaysBetweenThreeAndFourteen() {
        when(mealRepository.findByResidentBetween(eq(1L), any(), any())).thenReturn(List.of());

        assertThat(service.forResident(1L, 1).days()).hasSize(3);
        assertThat(service.forResident(1L, 100).days()).hasSize(14);
    }

    @Test
    void failsForAnUnknownResident() {
        when(residentService.get(99L)).thenThrow(new ResourceNotFoundException("Résident introuvable"));

        assertThatThrownBy(() -> service.forResident(99L, 7)).isInstanceOf(ResourceNotFoundException.class);
    }

    private void givenSevenDays(IntFunction<QuantityEaten> quantityForDaysAgo) {
        List<Meal> meals = new ArrayList<>();
        List<MealDistribution> distributions = new ArrayList<>();
        long id = 1;
        for (int daysAgo = 6; daysAgo >= 0; daysAgo--) {
            Meal meal = meal(id++, LocalDate.now().minusDays(daysAgo), ServiceStatus.FAIT);
            MealDistribution distribution = new MealDistribution();
            distribution.setMeal(meal);
            distribution.setQuantityEaten(quantityForDaysAgo.apply(daysAgo));
            meals.add(meal);
            distributions.add(distribution);
        }
        when(mealRepository.findByResidentBetween(eq(1L), any(), any())).thenReturn(meals);
        when(distributionRepository.findByMealIdIn(anyCollection())).thenReturn(distributions);
    }

    private static Meal meal(Long id, LocalDate day, ServiceStatus status) {
        Meal meal = new Meal();
        ReflectionTestUtils.setField(meal, "id", id);
        meal.setType("DEJEUNER");
        meal.setScheduledAt(LocalDateTime.of(day, java.time.LocalTime.NOON));
        meal.setStatus(status);
        return meal;
    }
}
