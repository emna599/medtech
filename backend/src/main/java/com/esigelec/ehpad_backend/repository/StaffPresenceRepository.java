package com.esigelec.ehpad_backend.repository;

import com.esigelec.ehpad_backend.entity.StaffPresence;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface StaffPresenceRepository extends JpaRepository<StaffPresence, Long> {

    /** Présences encore ouvertes et commencées après la date donnée. */
    List<StaffPresence> findByEndedAtIsNullAndStartedAtAfter(LocalDateTime since);

    List<StaffPresence> findByUserIdAndEndedAtIsNull(Long userId);
}
