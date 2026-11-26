package com.esigelec.ehpad_backend.repository;

import com.esigelec.ehpad_backend.entity.TablePresence;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface TablePresenceRepository extends JpaRepository<TablePresence, Long> {

    /** Résidents encore assis, arrivés depuis la date donnée (les lectures anciennes sont ignorées). */
    List<TablePresence> findByLeftAtIsNullAndArrivedAtAfterOrderByArrivedAtAsc(LocalDateTime since);

    List<TablePresence> findByResidentIdAndLeftAtIsNull(Long residentId);
}
