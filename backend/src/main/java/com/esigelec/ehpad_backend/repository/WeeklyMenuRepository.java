package com.esigelec.ehpad_backend.repository;

import com.esigelec.ehpad_backend.entity.WeeklyMenu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface WeeklyMenuRepository extends JpaRepository<WeeklyMenu, Long> {

    /** Dernière semaine de menu saisie jusqu'à cette date (le menu se répète tant qu'aucun nouveau n'est saisi). */
    @Query("select max(m.weekStart) from WeeklyMenu m where m.weekStart <= :date")
    Optional<LocalDate> latestWeekStart(@Param("date") LocalDate date);

    List<WeeklyMenu> findByWeekStartOrderByDayOfWeekAscMealTypeAsc(LocalDate weekStart);
}
