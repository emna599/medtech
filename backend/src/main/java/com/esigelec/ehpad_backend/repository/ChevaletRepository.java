package com.esigelec.ehpad_backend.repository;

import com.esigelec.ehpad_backend.entity.Chevalet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ChevaletRepository extends JpaRepository<Chevalet, Long> {

    @Query("select c from Chevalet c left join fetch c.resident where upper(c.code) = upper(:code)")
    Optional<Chevalet> findByCodeIgnoreCase(@Param("code") String code);

    @Query("select c from Chevalet c left join fetch c.resident where c.resident.id = :residentId")
    Optional<Chevalet> findByResidentId(@Param("residentId") Long residentId);
}
