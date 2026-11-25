package com.esigelec.ehpad_backend.repository;

import com.esigelec.ehpad_backend.entity.MedicationDose;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface MedicationDoseRepository extends JpaRepository<MedicationDose, Long> {

    @Query("""
            select d from MedicationDose d
            join fetch d.resident r
            left join fetch r.room
            where r.active = true and d.scheduledAt >= :from and d.scheduledAt < :to
            order by d.scheduledAt
            """)
    List<MedicationDose> findActiveBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
}
