package com.esigelec.ehpad_backend.repository;

import com.esigelec.ehpad_backend.entity.MedicationDose;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface MedicationDoseRepository extends JpaRepository<MedicationDose, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select entity from MedicationDose entity where entity.id = :id")
    Optional<MedicationDose> findByIdForUpdate(@Param("id") Long id);

    @Query("select entity.resident.id from MedicationDose entity where entity.id = :id")
    Optional<Long> findResidentId(@Param("id") Long id);

    @Query("""
            select d from MedicationDose d
            join fetch d.resident r
            left join fetch r.room
            where r.active = true and d.scheduledAt >= :from and d.scheduledAt < :to
            order by d.scheduledAt
            """)
    List<MedicationDose> findActiveBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
}
