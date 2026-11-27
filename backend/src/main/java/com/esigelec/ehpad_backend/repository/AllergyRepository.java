package com.esigelec.ehpad_backend.repository;

import com.esigelec.ehpad_backend.entity.Allergy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface AllergyRepository extends JpaRepository<Allergy, Long> {

    List<Allergy> findByResidentIdIn(Collection<Long> residentIds);
}
