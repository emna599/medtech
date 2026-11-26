package com.esigelec.ehpad_backend.repository;

import com.esigelec.ehpad_backend.entity.DietaryRegime;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface DietaryRegimeRepository extends JpaRepository<DietaryRegime, Long> {

    List<DietaryRegime> findByResidentIdIn(Collection<Long> residentIds);
}
