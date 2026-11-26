package com.esigelec.ehpad_backend.repository;

import com.esigelec.ehpad_backend.entity.WeeklyMenu;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface WeeklyMenuRepository extends JpaRepository<WeeklyMenu, Long> {

    List<WeeklyMenu> findByWeekStartOrderByDayOfWeekAscMealTypeAsc(LocalDate weekStart);
}
