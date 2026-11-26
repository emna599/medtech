package com.esigelec.ehpad_backend.repository;

import com.esigelec.ehpad_backend.entity.Allergy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface AllergyRepository extends JpaRepository<Allergy, Long> {

    List<Allergy> findByResidentId(Long residentId);

    List<Allergy> findByResidentIdIn(Collection<Long> residentIds);

    Optional<Allergy> findByIdAndResidentId(Long id, Long residentId);
}
