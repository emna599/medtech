package com.esigelec.ehpad_backend.repository;

import com.esigelec.ehpad_backend.entity.Meal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface MealRepository extends JpaRepository<Meal, Long> {

    @Query("""
            select m from Meal m
            join fetch m.resident r
            left join fetch r.room
            where r.active = true and m.scheduledAt >= :from and m.scheduledAt < :to
            order by m.scheduledAt
            """)
    List<Meal> findActiveBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("""
            select m from Meal m
            where m.resident.id = :residentId and m.scheduledAt >= :from and m.scheduledAt < :to
            order by m.scheduledAt
            """)
    List<Meal> findByResidentBetween(@Param("residentId") Long residentId,
                                     @Param("from") LocalDateTime from,
                                     @Param("to") LocalDateTime to);
}
