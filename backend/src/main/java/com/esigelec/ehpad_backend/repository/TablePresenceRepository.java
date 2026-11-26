package com.esigelec.ehpad_backend.repository;

import com.esigelec.ehpad_backend.entity.TablePresence;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface TablePresenceRepository extends JpaRepository<TablePresence, Long> {

    /** Résidents encore assis, arrivés depuis la date donnée (les lectures anciennes sont ignorées). */
    List<TablePresence> findByLeftAtIsNullAndArrivedAtAfterOrderByArrivedAtAsc(LocalDateTime since);

    @Query(value = """
            select count(*) from table_presence p join resident r on r.id = p.resident_id
            where p.table_id = :tableId and p.left_at is null and p.arrived_at >= :since and r.active
            """, nativeQuery = true)
    long countActiveAtTable(@Param("tableId") Long tableId, @Param("since") LocalDateTime since);

    List<TablePresence> findByResidentIdAndLeftAtIsNull(Long residentId);
}
