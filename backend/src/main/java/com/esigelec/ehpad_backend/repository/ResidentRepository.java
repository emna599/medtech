package com.esigelec.ehpad_backend.repository;

import com.esigelec.ehpad_backend.entity.Resident;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ResidentRepository extends JpaRepository<Resident, Long> {

    @Query("select r from Resident r left join fetch r.room where r.active = true order by r.lastName, r.firstName")
    List<Resident> findAllActive();

    @Query("select r from Resident r left join fetch r.room where r.id = :id and r.active = true")
    Optional<Resident> findActiveById(@Param("id") Long id);

    @Query("select r from Resident r left join fetch r.room where r.identityCode = :code and r.active = true")
    Optional<Resident> findActiveByIdentityCode(@Param("code") String code);
}
